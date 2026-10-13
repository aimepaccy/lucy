import time
from collections import OrderedDict
from typing import Generic, TypeVar

T = TypeVar('T')


class TimedCache(Generic[T]):
    """Remembers answers for a while (the TTL, time to live), and only so many of them.

    The size cap matters because anyone can send any search term: without it, memory would grow forever.
    """

    def __init__(self, ttl_seconds: float, max_items: int):
        self.ttl = ttl_seconds
        self.max_items = max_items
        self._items: OrderedDict[str, tuple[float, T]] = OrderedDict()

    def get(self, key: str) -> T | None:
        found = self._items.get(key)
        if found is None:
            return None
        stored_at, value = found
        if time.monotonic() - stored_at > self.ttl:
            del self._items[key]
            return None
        return value

    def put(self, key: str, value: T) -> None:
        self._items.pop(key, None)
        self._items[key] = (time.monotonic(), value)
        # The oldest entry goes first when the cache is full.
        while len(self._items) > self.max_items:
            self._items.popitem(last=False)

    def clear(self) -> None:
        self._items.clear()
