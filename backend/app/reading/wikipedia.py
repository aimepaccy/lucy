from urllib.parse import quote

from app.reading import web
from app.schemas import ReadingLink

SEARCH = 'https://en.wikipedia.org/w/rest.php/v1/search/page'
MAX_PAGES = 2


async def wikipedia(term: str) -> list[ReadingLink]:
    response = await web.client().get(SEARCH, params={'q': term, 'limit': MAX_PAGES})
    response.raise_for_status()
    links = []
    # Each page has a key (its address), a title and a one-line description. The excerpt holds HTML, so it is not used.
    for page in response.json().get('pages', []):
        key, title = page.get('key'), page.get('title')
        if not key or not title:
            continue
        links.append(ReadingLink(
            title=title,
            url=f'https://en.wikipedia.org/wiki/{quote(key)}',
            detail=page.get('description') or 'Wikipedia',
        ))
    return links
