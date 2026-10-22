import asyncio
import json
import time
from datetime import UTC, datetime, timedelta

import httpx2
import pytest
from fastapi.testclient import TestClient
from pydantic import SecretStr

from app import reading
from app.config import get_settings
from app.main import app
from app.reading import cache as cache_module
from app.reading import ncbi, web, youtube
from app.reading.cache import TimedCache
from app.reading.youtube import Catalogue, Video

client = TestClient(app)

PUBMED_SUMMARY = {
    'result': {
        'uids': ['111', 'bad'],
        '111': {
            'uid': '111',
            'title': 'Asthma <i>today</i> &amp; tomorrow.',
            'fulljournalname': 'Chest',
            'pubdate': '2022 Jan',
            'pubtype': ['Journal Article', 'Review'],
        },
        'bad': {'uid': 'bad', 'title': 'Not a real PubMed id'},
    }
}


def chapter_piece(chapter: str, title: str, own_chapter: bool) -> dict:
    """A StatPearls search hit: either the chapter itself, or a table inside it."""
    tag = 'Self' if own_chapter else 'Parent'
    return {
        'chapteraccessionid': chapter,
        'bookinfo': f'<Info><Path><Parent type="book"><Title>StatPearls</Title></Parent>'
        f'<{tag} id="article-1" type="chapter"><Title>{title}</Title></{tag}></Path></Info>',
    }


BOOKS_SUMMARY = {
    'result': {
        'uids': ['1', '2', '3'],
        '1': chapter_piece('NBK1', 'Asthma', own_chapter=False),
        '2': chapter_piece('NBK1', 'Asthma', own_chapter=True),
        '3': chapter_piece('NBK2', 'Status Asthmaticus', own_chapter=False),
    }
}

WIKIPEDIA = {'pages': [{'key': 'Acute_severe_asthma', 'title': 'Acute severe asthma', 'description': 'Medical condition'}]}


def video(title: str, channel: str = 'Osmosis', description: str = '', published: str = '2024-01-01') -> Video:
    number = abs(hash((title, channel))) % 10**11
    return Video(id=f'{number:011d}', title=title, channel=channel, published=published, description=description)


class Services:
    """Stand-ins for PubMed, StatPearls, Wikipedia and YouTube, answering real HTTP requests from canned replies."""

    def __init__(self):
        self.requests: list[httpx2.Request] = []
        self.down: set[str] = set()
        self.playlists: dict[str, list[dict]] = {}

    def handle(self, request: httpx2.Request) -> httpx2.Response:
        self.requests.append(request)
        host, path, params = request.url.host, request.url.path, request.url.params
        if host in self.down:
            return httpx2.Response(503)
        if path.endswith('esearch.fcgi'):
            ids = ['111', 'bad'] if params['db'] == 'pubmed' else ['1', '2', '3']
            return httpx2.Response(200, json={'esearchresult': {'idlist': ids}})
        if path.endswith('esummary.fcgi'):
            return httpx2.Response(200, json=PUBMED_SUMMARY if params['db'] == 'pubmed' else BOOKS_SUMMARY)
        if host == 'en.wikipedia.org':
            return httpx2.Response(200, json=WIKIPEDIA)
        if host == 'www.googleapis.com':
            pages = self.playlists.get(params['playlistId'], [{'items': []}])
            page = pages[int(params.get('pageToken', '0'))]
            return httpx2.Response(200, json=page)
        return httpx2.Response(404)

    def to(self, host: str) -> list[httpx2.Request]:
        return [request for request in self.requests if request.url.host == host]


@pytest.fixture(autouse=True)
def services(monkeypatch, tmp_path):
    stand_in = Services()
    settings = get_settings()
    monkeypatch.setattr(settings, 'youtube_api_key', SecretStr('test-youtube-key'))
    monkeypatch.setattr(settings, 'ncbi_api_key', SecretStr(''))
    monkeypatch.setattr(web, 'transport', httpx2.MockTransport(stand_in.handle))
    monkeypatch.setattr(web, '_client', None)
    monkeypatch.setattr(ncbi, '_spacing', web.Spacing(1000))
    monkeypatch.setattr(youtube, 'CACHE_FILE', tmp_path / 'youtube.json')
    monkeypatch.setattr(youtube, '_refresh_failed', False)
    monkeypatch.setattr(youtube, '_catalogue', Catalogue(datetime.now(UTC), [video('Asthma | Clinical Medicine', 'Ninja Nerd')]))
    reading.answers.clear()
    return stand_in


def by_key(answer: dict) -> dict:
    return {source['key']: source for source in answer['sources']}


def test_every_source_answers_with_checked_links(services):
    response = client.get('/api/reading', params={'term': 'acute asthma'})
    assert response.status_code == 200
    answer = response.json()
    assert answer['term'] == 'acute asthma'
    sources = by_key(answer)
    assert list(sources) == ['statpearls', 'pubmed', 'wikipedia', 'youtube', 'radiopaedia', 'msd']
    assert all(source['status'] == 'ok' for source in sources.values())

    # PubMed: HTML stripped from the title, the odd id dropped, and the article type shown.
    [article] = sources['pubmed']['links']
    assert article == {'title': 'Asthma today & tomorrow.', 'url': 'https://pubmed.ncbi.nlm.nih.gov/111/', 'detail': 'Chest, 2022 · Review'}

    # StatPearls: two hits inside the same chapter make one link.
    assert [(link['title'], link['url']) for link in sources['statpearls']['links']] == [
        ('Asthma', 'https://www.ncbi.nlm.nih.gov/books/NBK1/'),
        ('Status Asthmaticus', 'https://www.ncbi.nlm.nih.gov/books/NBK2/'),
    ]
    assert sources['wikipedia']['links'][0]['url'] == 'https://en.wikipedia.org/wiki/Acute_severe_asthma'
    assert sources['youtube']['links'][0]['title'] == 'Asthma | Clinical Medicine'
    assert sources['radiopaedia']['links'][0]['url'] == 'https://radiopaedia.org/search?q=acute+asthma&scope=articles'
    assert sources['msd']['links'][0]['url'] == 'https://www.msdmanuals.com/professional/searchresults?query=acute+asthma'
    assert all(web.allowed(link['url']) for source in sources.values() for link in source['links'])


def test_one_source_failing_leaves_the_others_and_is_not_cached(services):
    services.down.add('en.wikipedia.org')
    sources = by_key(client.get('/api/reading', params={'term': 'asthma'}).json())
    assert sources['wikipedia']['status'] == 'failed'
    assert sources['wikipedia']['note'] == 'WardWise could not reach Wikipedia just now.'
    assert sources['wikipedia']['links'] == []
    assert sources['pubmed']['status'] == 'ok'

    # Asked again once Wikipedia is back, WardWise asks again rather than repeating the failure.
    services.down.clear()
    sources = by_key(client.get('/api/reading', params={'term': 'asthma'}).json())
    assert sources['wikipedia']['status'] == 'ok'


def test_answers_are_kept_for_a_day(services):
    client.get('/api/reading', params={'term': 'Asthma'})
    asked = len(services.requests)
    assert asked > 0
    # The same term, in any capitals, is answered from memory: no new requests to any service.
    assert client.get('/api/reading', params={'term': 'asthma'}).status_code == 200
    assert len(services.requests) == asked


def test_a_term_cannot_change_the_shape_of_a_search(services):
    answer = client.get('/api/reading', params={'term': 'asthma[au] OR (copd), acute'}).json()
    assert answer['term'] == 'asthma au OR copd , acute'
    searches = {r.url.params['db']: r.url.params['term'] for r in services.requests if r.url.path.endswith('esearch.fcgi')}
    # Every word is tied to a field, so NCBI cannot read one as an author or a journal.
    assert searches['pubmed'] == (
        'asthma[ti] AND au[ti] AND OR[ti] AND copd[ti] AND acute[ti] AND (review[pt] OR guideline[pt]) AND english[lang]'
    )
    assert searches['books'] == (
        'asthma[All Fields] AND au[All Fields] AND OR[All Fields] AND copd[All Fields] AND acute[All Fields] AND statpearls[book]'
    )


@pytest.mark.parametrize('term', ['', '?!', 'a', 'x' * 121])
def test_a_term_needs_letters_and_a_sensible_length(term):
    assert client.get('/api/reading', params={'term': term}).status_code == 422


def test_videos_are_off_without_a_key(services, monkeypatch):
    monkeypatch.setattr(get_settings(), 'youtube_api_key', SecretStr(''))
    sources = by_key(client.get('/api/reading', params={'term': 'asthma'}).json())
    assert sources['youtube']['status'] == 'off'
    assert sources['pubmed']['status'] == 'ok'


def test_videos_still_loading_says_so(monkeypatch):
    monkeypatch.setattr(youtube, '_catalogue', None)
    sources = by_key(client.get('/api/reading', params={'term': 'asthma'}).json())
    assert sources['youtube']['status'] == 'failed'
    assert 'still loading' in sources['youtube']['note']


@pytest.mark.parametrize(
    ('url', 'allowed'),
    [
        ('https://en.wikipedia.org/wiki/Asthma', True),
        ('http://en.wikipedia.org/wiki/Asthma', False),
        ('https://en.wikipedia.org.example.com/wiki/Asthma', False),
        ('https://example.com@en.wikipedia.org/wiki/Asthma', False),
        ('https://en.wikipedia.org:8443/wiki/Asthma', False),
        ('javascript:alert(1)', False),
    ],
)
def test_only_https_links_to_listed_hosts_are_allowed(url, allowed):
    assert web.allowed(url) is allowed


def test_video_search_wants_every_topic_word(monkeypatch):
    videos = [
        video('Asthma | Clinical Medicine', 'Ninja Nerd'),
        video('Status Epilepticus', 'Ninja Nerd'),
        video('Asthma', 'Osmosis'),
        video('Asthma pathophysiology', 'Osmosis', published='2025-01-01'),
        video('Asthma in children', 'Osmosis'),
        video('Tight airways #asthma #meded', 'Armando Hasudungan'),
        video('Peak flow explained', 'Geeky Medics'),
        video('Using an asthma inhaler', 'Zero to Finals'),
    ]
    monkeypatch.setattr(youtube, '_catalogue', Catalogue(datetime.now(UTC), videos))
    titles = lambda term: [link.title for link in asyncio.run(youtube.search(term))]  # noqa: E731

    # "management" is a context word, so plain asthma videos count; "asthmaticus" matches "asthma".
    found = titles('acute asthma management')
    assert 'Asthma | Clinical Medicine' in found
    assert len([title for title in found if title.startswith('Asthma') and 'Clinical' not in title]) == 2  # two per channel
    assert 'Tight airways #asthma #meded' not in found  # a Short
    assert titles('status asthmaticus') == []  # never the epilepticus video
    assert titles('peak flow') == ['Peak flow explained']
    assert titles('flowchart') == []  # short words match exactly only
    # Three topic words: one may be missing, but never two.
    assert titles('asthma inhaler spacer') == ['Using an asthma inhaler']


def playlist_item(video_id: str, title: str) -> dict:
    return {'snippet': {'title': title, 'description': '', 'publishedAt': '2024-05-01T00:00:00Z', 'resourceId': {'videoId': video_id}}}


def test_refresh_reads_every_channel_and_keeps_the_key_out_of_addresses(services, monkeypatch):
    monkeypatch.setattr(youtube, '_catalogue', None)
    osmosis = 'UU' + next(iter(youtube.CHANNELS))[2:]
    services.playlists[osmosis] = [
        {'items': [playlist_item('aaaaaaaaaaa', 'Asthma')], 'nextPageToken': '1'},
        {'items': [playlist_item('bbbbbbbbbbb', 'COPD'), playlist_item('not-an-id', 'Bad id'), playlist_item('ccccccccccc', 'Private video')]},
    ]
    asyncio.run(youtube.refresh())

    calls = services.to('www.googleapis.com')
    assert len(calls) == len(youtube.CHANNELS) + 1  # one page each, two for Osmosis
    assert all(call.headers['X-Goog-Api-Key'] == 'test-youtube-key' for call in calls)
    assert all('test-youtube-key' not in str(call.url) for call in calls)
    assert [v.title for v in youtube._catalogue.videos] == ['Asthma', 'COPD']

    # Saved to disk, so a restart picks it up without spending quota.
    monkeypatch.setattr(youtube, '_catalogue', None)
    youtube.load()
    assert [v.id for v in youtube._catalogue.videos] == ['aaaaaaaaaaa', 'bbbbbbbbbbb']
    assert not youtube._catalogue.stale


def test_a_failing_channel_keeps_its_old_videos(services, monkeypatch):
    first = next(iter(youtube.CHANNELS.values()))
    old = Catalogue(datetime.now(UTC) - timedelta(days=2), [video('Old asthma video', first)])
    monkeypatch.setattr(youtube, '_catalogue', old)
    services.down.add('www.googleapis.com')
    asyncio.run(youtube.refresh())
    # Every channel failed: nothing is replaced, and the catalogue stays old so the next check tries again.
    assert youtube._catalogue is old
    assert not youtube.unavailable()  # old videos are still videos

    services.down.clear()
    first_playlist = 'UU' + next(iter(youtube.CHANNELS))[2:]
    services.playlists[first_playlist] = [{'items': []}]

    def first_channel_down(request):
        if request.url.params.get('playlistId') == first_playlist:
            return httpx2.Response(500)
        return services.handle(request)

    monkeypatch.setattr(web, '_client', None)
    monkeypatch.setattr(web, 'transport', httpx2.MockTransport(first_channel_down))
    asyncio.run(youtube.refresh())
    assert [v.title for v in youtube._catalogue.videos] == ['Old asthma video']
    assert not youtube._catalogue.stale


def test_an_unreadable_catalogue_file_is_ignored(monkeypatch):
    monkeypatch.setattr(youtube, '_catalogue', None)
    youtube.CACHE_FILE.write_text(json.dumps({'videos': 'not a list'}), encoding='utf-8')
    youtube.load()
    assert youtube._catalogue is None


def test_ncbi_calls_wait_their_turn():
    async def three_calls():
        spacing = web.Spacing(per_second=20)
        start = time.monotonic()
        await asyncio.gather(spacing.wait(), spacing.wait(), spacing.wait())
        return time.monotonic() - start

    # Three calls at 20 a second: the third goes no sooner than 0.1 s after the first.
    assert asyncio.run(three_calls()) >= 0.09


def test_the_cache_forgets_old_answers_and_keeps_a_limit(monkeypatch):
    now = [1000.0]
    monkeypatch.setattr(cache_module.time, 'monotonic', lambda: now[0])
    memory = TimedCache(ttl_seconds=60, max_items=2)
    memory.put('a', 1)
    memory.put('b', 2)
    memory.put('c', 3)
    assert memory.get('a') is None  # the oldest made room
    assert memory.get('b') == 2
    now[0] += 61
    assert memory.get('c') is None  # past its time to live


def test_outgoing_addresses_stay_out_of_the_logs():
    # Search terms, and an NCBI key if set, travel in the address; the web client would log it at INFO.
    import logging

    import app.main  # noqa: F401 - setting up the app sets the log levels

    assert logging.getLogger('httpx2').getEffectiveLevel() >= logging.WARNING


def test_videos_that_cannot_be_had_say_so_plainly(services, monkeypatch):
    monkeypatch.setattr(youtube, '_catalogue', None)
    services.down.add('www.googleapis.com')
    asyncio.run(youtube.refresh())
    assert youtube.unavailable()
    sources = by_key(client.get('/api/reading', params={'term': 'asthma'}).json())
    assert sources['youtube']['note'] == 'Videos are unavailable right now.'


def test_a_full_queue_turns_callers_away_rather_than_booking_far_ahead():
    async def rush():
        spacing = web.Spacing(per_second=10, max_wait=0.25)
        waits = [spacing.wait() for _ in range(5)]
        return await asyncio.gather(*waits, return_exceptions=True)

    # Slots at 0, 0.1, 0.2 and 0.3 s: the fourth and fifth would wait too long, so they are refused at once.
    results = asyncio.run(rush())
    assert results[:3] == [None, None, None]
    assert all(isinstance(result, web.QueueFull) for result in results[3:])
