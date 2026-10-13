"""Radiopaedia and MSD Manuals have no free API, so Lucy links to their own search page for the term."""

from urllib.parse import urlencode

from app.schemas import ReadingLink


async def radiopaedia(term: str) -> list[ReadingLink]:
    url = 'https://radiopaedia.org/search?' + urlencode({'q': term, 'scope': 'articles'})
    return [ReadingLink(title=f'Search Radiopaedia for "{term}"', url=url)]


async def msd(term: str) -> list[ReadingLink]:
    url = 'https://www.msdmanuals.com/professional/searchresults?' + urlencode({'query': term})
    return [ReadingLink(title=f'Search MSD Manuals for "{term}"', url=url)]
