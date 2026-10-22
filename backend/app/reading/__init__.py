"""Further reading: real links for a search term, from services WardWise trusts. The AI never writes links."""

import asyncio
import logging
import re
from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from typing import Literal

from app.reading import ncbi, search_pages, web, wikipedia, youtube
from app.reading.cache import TimedCache
from app.schemas import Reading, ReadingLink, ReadingSource

log = logging.getLogger('wardwise.reading')

MAX_TERM_CHARS = 120
# Each source gets this long in all (including its wait in the NCBI queue) before WardWise moves on without it.
SOURCE_TIMEOUT_SECONDS = 12
# Letters, digits, spaces and a little punctuation. Brackets and quotes go, so a term cannot change
# the shape of a search (in PubMed, "asthma[ti]" or a closing bracket would).
_UNSAFE = re.compile(r"[^\w\s\-'.,/+&]")


@dataclass(frozen=True)
class Source:
    key: str
    name: str
    kind: Literal['results', 'search']
    about: str
    find: Callable[[str], Awaitable[list[ReadingLink]]]


SOURCES = (
    Source('statpearls', 'StatPearls', 'results', 'Peer-reviewed review chapters', ncbi.statpearls),
    Source('pubmed', 'PubMed', 'results', 'Reviews and guidelines first', ncbi.pubmed),
    Source('wikipedia', 'Wikipedia', 'results', 'A quick overview; check it against the others', wikipedia.wikipedia),
    Source('youtube', 'YouTube', 'results', 'From ' + ', '.join(youtube.CHANNELS.values()), youtube.search),
    Source('radiopaedia', 'Radiopaedia', 'search', 'Imaging articles and cases', search_pages.radiopaedia),
    Source('msd', 'MSD Manuals', 'search', 'Professional edition', search_pages.msd),
)

# A day: articles and videos do not change by the hour, and repeat searches cost the services nothing.
answers: TimedCache[Reading] = TimedCache(ttl_seconds=24 * 3600, max_items=500)


def clean_term(term: str) -> str:
    return ' '.join(_UNSAFE.sub(' ', term).split())


async def find(term: str) -> Reading:
    key = term.casefold()
    cached = answers.get(key)
    if cached is not None:
        return cached
    # All sources at once: the slowest one sets the wait, not the sum of them all.
    sources = await asyncio.gather(*(_ask(source, term) for source in SOURCES))
    reading = Reading(term=term, sources=list(sources))
    # A failure may be passing (a timeout, a busy service), so only complete answers are kept.
    if all(source.status != 'failed' for source in sources):
        answers.put(key, reading)
    return reading


async def _ask(source: Source, term: str) -> ReadingSource:
    answer = ReadingSource(key=source.key, name=source.name, about=source.about, kind=source.kind, status='ok')
    if source.key == 'youtube' and not youtube.configured():
        return answer.model_copy(update={'status': 'off', 'note': 'Videos are not set up on this server.'})
    try:
        links = await asyncio.wait_for(source.find(term), SOURCE_TIMEOUT_SECONDS)
    except youtube.NotReady:
        if youtube.unavailable():
            return answer.model_copy(update={'status': 'failed', 'note': 'Videos are unavailable right now.'})
        return answer.model_copy(
            update={'status': 'failed', 'note': 'WardWise is still loading the video list. Try again in a minute.'}
        )
    except Exception as error:  # noqa: BLE001 - one source failing must never take the others down
        # Only the kind of error is logged: its message can contain the full address, and with it a key.
        log.warning('%s lookup failed: %s', source.name, type(error).__name__)
        return answer.model_copy(update={'status': 'failed', 'note': f'WardWise could not reach {source.name} just now.'})

    safe = [link for link in links if web.allowed(link.url)]
    if len(safe) < len(links):
        log.warning('%s returned %d links outside the allow-list', source.name, len(links) - len(safe))
    return answer.model_copy(update={'links': safe})
