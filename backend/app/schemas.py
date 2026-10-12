from typing import Literal

from pydantic import BaseModel

SlideKind = Literal['pdf', 'pptx']
AudioKind = Literal['webm', 'ogg', 'mp4', 'wav', 'mp3', 'flac']


class Health(BaseModel):
    status: Literal['ok']


class SlideReceipt(BaseModel):
    name: str
    kind: SlideKind
    size_bytes: int


class AudioReceipt(BaseModel):
    name: str
    kind: AudioKind
    size_bytes: int


class SessionReceipt(BaseModel):
    notes_words: int
    slides: list[SlideReceipt]
    audio: AudioReceipt | None


class SlideText(BaseModel):
    name: str
    kind: SlideKind
    pages: int
    text: str


class Materials(BaseModel):
    transcript: str | None
    slides: list[SlideText]
    warnings: list[str]


JobStatus = Literal['queued', 'working', 'done', 'failed']


class JobCreated(BaseModel):
    job_id: str
    receipt: SessionReceipt


class JobState(BaseModel):
    status: JobStatus
    step: str
    materials: Materials | None = None
    error: str | None = None


class Limits(BaseModel):
    max_slide_files: int
    max_slide_mb: int
    max_audio_mb: int
    max_notes_chars: int
