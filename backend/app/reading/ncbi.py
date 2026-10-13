"""PubMed articles and StatPearls chapters, both from NCBI's E-utilities.

Each lookup is two calls: esearch finds the ids, esummary gives titles and details for those ids.
"""

import html
import re

from app.config import get_settings
from app.reading import web
from app.schemas import ReadingLink

EUTILS = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils'
MAX_ARTICLES = 3
MAX_CHAPTERS = 3

_PMID = re.compile(r'^\d{1,9}$')
_NBK = re.compile(r'^NBK\d{1,9}$')
_TAG = re.compile(r'<[^>]+>')
_SEARCH_WORD = re.compile(r'[\w-]+')
# The chapter's title sits in one known tag of a small piece of XML, so a pattern is enough and no XML parser
# is needed (Python's built-in one is not meant for XML from outside sources).
_CHAPTER_TITLE = re.compile(r'type="chapter"[^>]*>\s*<Title>(.*?)</Title>', re.DOTALL)

# NCBI allows 3 requests a second without a key and 10 with one. Every call from every student waits its turn.
_spacing: web.Spacing | None = None


def _queue() -> web.Spacing:
    global _spacing
    if _spacing is None:
        _spacing = web.Spacing(10 if get_settings().ncbi_api_key.get_secret_value() else 3)
    return _spacing


async def _get(tool: str, params: dict) -> dict:
    params = params | {'retmode': 'json', 'tool': 'lucy'}
    key = get_settings().ncbi_api_key.get_secret_value()
    if key:
        params['api_key'] = key
    await _queue().wait()
    response = await web.client().get(f'{EUTILS}/{tool}', params=params)
    response.raise_for_status()
    return response.json()


async def _search(database: str, query: str, count: int) -> list[str]:
    found = await _get('esearch.fcgi', {'db': database, 'term': query, 'retmax': count, 'sort': 'relevance'})
    return found['esearchresult']['idlist']


async def _summaries(database: str, ids: list[str]) -> list[dict]:
    found = (await _get('esummary.fcgi', {'db': database, 'id': ','.join(ids)}))['result']
    return [found[uid] for uid in found.get('uids', []) if uid in found]


def _tagged(term: str, field: str) -> str:
    """Each word tied to a field, as in "peak[ti] AND flow[ti]".

    Left untagged, NCBI guesses what each word is (automatic term mapping) and guesses badly:
    it read "peak" as an author's name and "flow" as the journal Flow.
    """
    return ' AND '.join(f'{word}[{field}]' for word in _SEARCH_WORD.findall(term))


def _plain(text: str) -> str:
    """Titles can carry HTML such as <i>; React would show the tags as text, so they go."""
    return html.unescape(_TAG.sub('', text)).strip()


async def pubmed(term: str) -> list[ReadingLink]:
    # Words in the title keep articles on topic (in the abstract alone, a term is often a side point).
    # Reviews and guidelines suit a student best; if there are none, any article will do.
    in_title = _tagged(term, 'ti')
    if not in_title:
        return []
    ids = await _search('pubmed', f'{in_title} AND (review[pt] OR guideline[pt]) AND english[lang]', MAX_ARTICLES)
    if not ids:
        ids = await _search('pubmed', f'{in_title} AND english[lang]', MAX_ARTICLES)
    if not ids:
        return []

    links = []
    for article in await _summaries('pubmed', ids):
        pmid = str(article.get('uid', ''))
        title = _plain(article.get('title', ''))
        if not _PMID.match(pmid) or not title:
            continue
        year = str(article.get('pubdate', ''))[:4]
        kinds = article.get('pubtype', [])
        kind = next((k for k in ('Practice Guideline', 'Guideline', 'Systematic Review', 'Review') if k in kinds), '')
        detail = ', '.join(part for part in (article.get('fulljournalname', ''), year) if part)
        links.append(ReadingLink(
            title=title,
            url=f'https://pubmed.ncbi.nlm.nih.gov/{pmid}/',
            detail=f'{detail} · {kind}' if kind else detail,
        ))
    return links


async def statpearls(term: str) -> list[ReadingLink]:
    # The search returns pieces of chapters (sections, tables), so several pieces can share one chapter.
    words = _tagged(term, 'All Fields')
    if not words:
        return []
    ids = await _search('books', f'{words} AND statpearls[book]', 12)
    if not ids:
        return []

    links: list[ReadingLink] = []
    seen = set()
    for piece in await _summaries('books', ids):
        chapter = piece.get('chapteraccessionid', '')
        if not _NBK.match(chapter) or chapter in seen:
            continue
        found = _CHAPTER_TITLE.search(piece.get('bookinfo', ''))
        title = _plain(found.group(1)) if found else ''
        if not title:
            continue
        seen.add(chapter)
        links.append(ReadingLink(title=title, url=f'https://www.ncbi.nlm.nih.gov/books/{chapter}/', detail='StatPearls'))
        if len(links) == MAX_CHAPTERS:
            break
    return links
