"""What every reading source shares: one web client, the list of hosts links may point to, and a queue."""

import asyncio
import time
from urllib.parse import urlsplit

import httpx2

# Services ask callers to say who they are; Wikipedia refuses requests without this.
USER_AGENT = 'WardWise/0.1 (https://github.com/aimepaccy/wardwise)'
# A slow service should not hold the page up: give up on connecting after 5 seconds, on answering after 8.
TIMEOUT = httpx2.Timeout(8.0, connect=5.0)

# Every link WardWise shows must point to one of these hosts, over https. Anything else is dropped.
ALLOWED_HOSTS = frozenset({
    'pubmed.ncbi.nlm.nih.gov',
    'www.ncbi.nlm.nih.gov',
    'en.wikipedia.org',
    'www.youtube.com',
    'radiopaedia.org',
    'www.msdmanuals.com',
})

# Tests swap in a stand-in transport, so no test ever reaches the real internet.
transport: httpx2.AsyncBaseTransport | None = None
_client: httpx2.AsyncClient | None = None


def client() -> httpx2.AsyncClient:
    """One client for the whole server, so connections to each service are opened once and reused."""
    global _client
    if _client is None:
        _client = httpx2.AsyncClient(
            headers={'User-Agent': USER_AGENT},
            timeout=TIMEOUT,
            # A redirect could lead anywhere; every address we call is known, so none is followed.
            follow_redirects=False,
            transport=transport,
        )
    return _client


async def close() -> None:
    global _client
    if _client is not None:
        await _client.aclose()
        _client = None


def allowed(url: str) -> bool:
    try:
        parts = urlsplit(url)
        return parts.scheme == 'https' and parts.hostname in ALLOWED_HOSTS and not parts.username and not parts.port
    except ValueError:
        return False


class QueueFull(Exception):
    """The wait for a turn would be too long; better to say so now than to time out later."""


class Spacing:
    """Lets calls through no closer together than a set gap, in the order they arrive.

    Like taking a numbered ticket: each caller books the next free slot, then waits for it.
    Booking needs no lock because nothing else runs between reading and moving `_next`.
    A caller who would wait longer than `max_wait` is turned away without a ticket, so a rush
    cannot book slots minutes ahead and leave everyone after it waiting.
    It counts calls in this one server process; several worker processes would each keep their own count.
    """

    def __init__(self, per_second: float, max_wait: float = 6.0):
        self.gap = 1 / per_second
        self.max_wait = max_wait
        self._next = 0.0

    async def wait(self) -> None:
        now = time.monotonic()
        slot = max(now, self._next)
        if slot - now > self.max_wait:
            raise QueueFull
        self._next = slot + self.gap
        if slot > now:
            await asyncio.sleep(slot - now)
