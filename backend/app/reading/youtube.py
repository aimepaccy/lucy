"""Videos from a short list of trusted teaching channels.

YouTube's own search costs 100 quota units a call and covers one channel at a time, so five channels
would cost 500 units a term (20 terms a day on the free 10,000). Instead Lucy keeps a catalogue: once
a day it reads each channel's list of uploads (1 unit per 50 videos, about 80 units in all) and
searches the titles itself, which costs nothing.
"""

import asyncio
import json
import logging
import re
import time
from dataclasses import asdict, dataclass, field
from datetime import UTC, datetime, timedelta
from pathlib import Path

import httpx2

from app.config import get_settings
from app.reading import web
from app.schemas import ReadingLink

log = logging.getLogger('lucy.youtube')

API = 'https://www.googleapis.com/youtube/v3/playlistItems'
# Channel ids (found once with the API) and the names shown to students.
CHANNELS = {
    'UCNI0qOojpkhsUtaQ4_2NUhQ': 'Osmosis',
    'UC6QYFutt9cluQ3uSM963_KQ': 'Ninja Nerd',
    'UCwZEjeak8ychtv2Unng5W2A': 'Zero to Finals',
    'UCkjnrEHQ8bQQmlfNdAQC_5w': 'Geeky Medics',
    'UCesNt4_Z-Pm41RzpAClfVcg': 'Armando Hasudungan',
}
# Public video titles only, never anything a student sent, so keeping this file breaks no privacy rule.
CACHE_FILE = Path(__file__).resolve().parents[2] / 'cache' / 'youtube.json'
REFRESH_AFTER = timedelta(days=1)
CHECK_EVERY_SECONDS = 3600
# With no catalogue at all, try again sooner: students are waiting for it.
RETRY_SECONDS = 300
# 60 pages of 50 is 3,000 videos: a guard against a channel ever eating the day's quota.
MAX_PAGES = 60
MAX_VIDEOS = 4
MAX_PER_CHANNEL = 2

_VIDEO_ID = re.compile(r'^[\w-]{11}$')
_WORD = re.compile(r'[a-z0-9]+')
# Shorts and promotional clips tag their titles (#asthma #meded); teaching videos do not.
_HASHTAG = re.compile(r'#[a-z]', re.IGNORECASE)
_STOP_WORDS = frozenset('a an and the of in on for to with by or at from vs versus how what is are its'.split())
# Words that describe the angle on a topic rather than the topic itself. They lift a video up the list
# but are never required: a video called "Asthma" is a good answer to "acute asthma management".
_CONTEXT_WORDS = frozenset(
    'acute chronic severe mild moderate management treatment therapy diagnosis approach overview introduction '
    'clinical adult adults children child paediatric pediatric patient assessment guideline examination '
    'investigation sign symptom cause pathophysiology medicine disease disorder syndrome measurement technique '
    'use using basic first line severity life threatening emergency interpretation recognition red flag principle'.split()
)


class NotReady(Exception):
    """The catalogue has not been loaded yet."""


@dataclass
class Video:
    id: str
    title: str
    channel: str
    published: str
    description: str


@dataclass
class Catalogue:
    fetched_at: datetime
    videos: list[Video]
    # Each video's title words and description words, worked out once rather than on every search.
    words: list[tuple[set[str], set[str]]] = field(default_factory=list)
    vocabulary: set[str] = field(default_factory=set)

    def __post_init__(self):
        self.videos = [video for video in self.videos if not _HASHTAG.search(video.title)]
        self.words = [(_words(video.title), _words(video.description)) for video in self.videos]
        self.vocabulary = set().union(*(title | text for title, text in self.words))

    @property
    def stale(self) -> bool:
        return datetime.now(UTC) - self.fetched_at > REFRESH_AFTER


_catalogue: Catalogue | None = None
# True when the last attempt to read the channels failed completely (a wrong key, or the day's quota used up).
_refresh_failed = False


def _key() -> str:
    return get_settings().youtube_api_key.get_secret_value()


def configured() -> bool:
    return bool(_key())


def unavailable() -> bool:
    """No catalogue, and the last try failed: worth saying plainly rather than "still loading"."""
    return _catalogue is None and _refresh_failed


def _words(text: str) -> set[str]:
    words = set()
    for word in _WORD.findall(text.lower()):
        if word in _STOP_WORDS:
            continue
        # A light touch of stemming, so "diseases" matches "disease"; "status" and "diagnosis" stay whole.
        if len(word) > 4 and word.endswith('s') and not word.endswith(('ss', 'us', 'is')):
            word = word[:-1]
        words.add(word)
    return words


def _variants(word: str, vocabulary: set[str]) -> set[str]:
    """The catalogue's words that count as this one: itself, and longer words sharing its start
    ("asthmaticus" and "asthma"). Short words must match exactly, or "flow" would match "flowchart"."""
    if len(word) < 5:
        return {word}
    return {word} | {other for other in vocabulary if len(other) >= 5 and (other.startswith(word) or word.startswith(other))}


def _matches(catalogue: Catalogue, query: set[str], topic: set[str], need: int) -> list[tuple]:
    variants = {word: _variants(word, catalogue.vocabulary) for word in query}
    scored = []
    for video, (title_words, description_words) in zip(catalogue.videos, catalogue.words):
        in_title = {word for word in query if variants[word] & title_words}
        anywhere = in_title | {word for word in query if variants[word] & description_words}
        # Enough topic words somewhere, and at least one in the title. Fewer, surer matches beat many loose ones.
        if len(topic & anywhere) < need or not topic & in_title:
            continue
        # A word in the title says far more about a video than one in its description.
        score = 2 * len(topic & in_title) + len(in_title - topic) + 0.5 * len(anywhere - in_title)
        # On a tie, a title with fewer words (more focused on the topic) wins, then the newer video.
        scored.append((score, -len(title_words), video.published, video))
    scored.sort(key=lambda item: item[:3], reverse=True)
    return scored


async def search(term: str) -> list[ReadingLink]:
    if _catalogue is None:
        raise NotReady
    query = _words(term)
    if not query:
        return []
    topic = (query - _CONTEXT_WORDS) or query

    scored = _matches(_catalogue, query, topic, need=len(topic))
    # A long term rarely fits one video exactly, so one topic word may be missing from three or more.
    # Two-word terms stay strict: "status asthmaticus" must never bring up status epilepticus.
    if not scored and len(topic) >= 3:
        scored = _matches(_catalogue, query, topic, need=len(topic) - 1)

    links: list[ReadingLink] = []
    per_channel: dict[str, int] = {}
    for *_, video in scored:
        # No more than two from one channel, so a big channel does not crowd out the rest.
        if per_channel.get(video.channel, 0) == MAX_PER_CHANNEL:
            continue
        per_channel[video.channel] = per_channel.get(video.channel, 0) + 1
        links.append(ReadingLink(
            title=video.title,
            url=f'https://www.youtube.com/watch?v={video.id}',
            detail=f'{video.channel}, {video.published[:4]}',
        ))
        if len(links) == MAX_VIDEOS:
            break
    return links


async def _fetch_channel(channel_id: str, name: str) -> list[Video]:
    # Every channel has an uploads playlist whose id is the channel id with UC changed to UU.
    playlist = 'UU' + channel_id[2:]
    videos: list[Video] = []
    page_token = None
    for _ in range(MAX_PAGES):
        params = {
            'part': 'snippet',
            'playlistId': playlist,
            'maxResults': 50,
            # Ask only for the fields we use: smaller answers, same quota.
            'fields': 'nextPageToken,items(snippet(title,description,publishedAt,resourceId/videoId))',
        }
        if page_token:
            params['pageToken'] = page_token
        # The key goes in a header, not the address: addresses end up in logs and error messages.
        response = await web.client().get(API, params=params, headers={'X-Goog-Api-Key': _key()})
        response.raise_for_status()
        page = response.json()
        for item in page.get('items', []):
            snippet = item.get('snippet', {})
            video_id = snippet.get('resourceId', {}).get('videoId', '')
            title = snippet.get('title', '')
            if not _VIDEO_ID.match(video_id) or title in ('Private video', 'Deleted video'):
                continue
            videos.append(Video(
                id=video_id,
                title=title,
                channel=name,
                published=snippet.get('publishedAt', ''),
                description=snippet.get('description', '')[:300],
            ))
        page_token = page.get('nextPageToken')
        if not page_token:
            break
    return videos


async def refresh() -> None:
    """Read every channel's uploads again. A channel that fails keeps the videos it had."""
    global _catalogue, _refresh_failed
    results = await asyncio.gather(
        *(_fetch_channel(channel_id, name) for channel_id, name in CHANNELS.items()),
        return_exceptions=True,
    )
    if all(isinstance(result, BaseException) for result in results):
        # Nothing new: keep what we have, marked as old, so the next check tries again.
        failure = results[0]
        status = failure.response.status_code if isinstance(failure, httpx2.HTTPStatusError) else ''
        log.warning('Could not read any YouTube channel: %s %s', type(failure).__name__, status)
        _refresh_failed = True
        return
    old = _catalogue.videos if _catalogue else []
    videos: list[Video] = []
    for name, result in zip(CHANNELS.values(), results):
        if isinstance(result, BaseException):
            status = result.response.status_code if isinstance(result, httpx2.HTTPStatusError) else ''
            log.warning('Could not read %s uploads: %s %s', name, type(result).__name__, status)
            videos += [video for video in old if video.channel == name]
        else:
            videos += result
    if not videos:
        return
    _catalogue = Catalogue(datetime.now(UTC), videos)
    _refresh_failed = False
    log.info('YouTube catalogue: %d videos', len(videos))
    try:
        _save(_catalogue)
    except OSError as error:
        # The catalogue still works from memory; only the copy for the next restart is missing.
        log.warning('Could not save the YouTube catalogue: %s', type(error).__name__)


def _save(catalogue: Catalogue) -> None:
    CACHE_FILE.parent.mkdir(exist_ok=True)
    data = {'fetched_at': catalogue.fetched_at.isoformat(), 'videos': [asdict(v) for v in catalogue.videos]}
    # Write to a temporary file, then swap it in, so a crash mid-write never leaves half a catalogue.
    temporary = CACHE_FILE.with_suffix('.tmp')
    temporary.write_text(json.dumps(data), encoding='utf-8')
    temporary.replace(CACHE_FILE)


def load() -> None:
    """Pick up the catalogue saved on disk, so a restart does not spend quota again."""
    global _catalogue
    try:
        data = json.loads(CACHE_FILE.read_text(encoding='utf-8'))
        videos = [Video(**video) for video in data['videos']]
        _catalogue = Catalogue(datetime.fromisoformat(data['fetched_at']), videos)
    except FileNotFoundError:
        return
    except (OSError, ValueError, KeyError, TypeError):
        log.warning('Ignoring an unreadable YouTube catalogue file')


async def keep_fresh() -> None:
    """Runs for the life of the server: load the saved catalogue, then refresh it once it is a day old."""
    if not configured():
        return
    load()
    while True:
        try:
            if _catalogue is None or _catalogue.stale:
                started = time.monotonic()
                await refresh()
                log.info('YouTube refresh took %.1f s', time.monotonic() - started)
        except Exception as error:  # noqa: BLE001 - one bad refresh must not stop the next
            log.warning('YouTube refresh failed: %s', type(error).__name__)
        await asyncio.sleep(RETRY_SECONDS if _catalogue is None else CHECK_EVERY_SECONDS)
