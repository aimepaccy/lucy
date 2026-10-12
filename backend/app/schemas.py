from typing import Literal

from pydantic import BaseModel

SlideKind = Literal['pdf', 'pptx']


class Health(BaseModel):
    status: Literal['ok']


class SlideReceipt(BaseModel):
    name: str
    kind: SlideKind
    size_bytes: int


class SessionReceipt(BaseModel):
    notes_words: int
    slides: list[SlideReceipt]


class Limits(BaseModel):
    max_slide_files: int
    max_slide_mb: int
    max_notes_chars: int