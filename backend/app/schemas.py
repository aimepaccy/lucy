from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

SlideKind = Literal['pdf', 'pptx']

# Same limit as the notes editor in the front end (NotesEditor.tsx).
MAX_NOTES_CHARS = 20_000
# Far above what fits in one study pack; the token budget is the real limit. This only stops absurd requests.
MAX_TEXT_CHARS = 200_000
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


# What the student sends to have a study pack written: their notes and their corrected copy of
# what Lucy heard and read. Only text; the files themselves were deleted after reading.
class SlideSource(BaseModel):
    text: str = Field(max_length=MAX_TEXT_CHARS)


class PackRequest(BaseModel):
    notes: str = Field('', max_length=MAX_NOTES_CHARS)
    transcript: str | None = Field(None, max_length=MAX_TEXT_CHARS)
    slides: list[SlideSource] = Field(default_factory=list, max_length=5)


# The form the AI fills in. `extra='forbid'` makes the JSON schema say "no other fields", which strict
# structured output requires. Counts are maximums only: thin material should give fewer items, not invented ones.
class Strict(BaseModel):
    model_config = ConfigDict(extra='forbid')


class TeachingPoint(Strict):
    text: str = Field(description='One teaching point, one or two sentences.')
    quote: str = Field(description='Words copied exactly from the material that support this point.')


class Flashcard(Strict):
    front: str = Field(description='A question or prompt.')
    back: str = Field(description='The answer, short.')
    quote: str = Field(description='Words copied exactly from the material that support this card.')


class Option(Strict):
    text: str
    explanation: str = Field(description='Why this option is right or wrong.')


class Question(Strict):
    stem: str = Field(description='A short clinical scenario ending in a question.')
    options: list[Option] = Field(description='Exactly five options, A to E.')
    answer: Literal['A', 'B', 'C', 'D', 'E']
    quote: str = Field(description='Words copied exactly from the material that support the answer.')


class PackDraft(Strict):
    title: str
    overview: list[str] = Field(description='Two to four short paragraphs summarising the whole session, in order.')
    summary: list[TeachingPoint] = Field(description='The key teaching points.')
    flashcards: list[Flashcard]
    questions: list[Question]
    search_terms: list[str] = Field(description='Search terms for further reading. Never links or references.')


# What the browser receives: the AI's work plus Lucy's own checks.
class CheckedPoint(TeachingPoint):
    grounded: bool


class CheckedFlashcard(Flashcard):
    grounded: bool


class CheckedQuestion(Question):
    grounded: bool


class StudyPack(BaseModel):
    title: str
    overview: list[str]
    summary: list[CheckedPoint]
    flashcards: list[CheckedFlashcard]
    questions: list[CheckedQuestion]
    search_terms: list[str]
    # Coverage: passages of the material that no item in the pack draws on, out of how many in all.
    uncovered: list[str]
    passage_count: int
    model: str


class PackJobCreated(BaseModel):
    job_id: str


class JobState(BaseModel):
    status: JobStatus
    step: str
    materials: Materials | None = None
    pack: StudyPack | None = None
    error: str | None = None


class Limits(BaseModel):
    max_slide_files: int
    max_slide_mb: int
    max_audio_mb: int
    max_notes_chars: int
    # About how many words of material fit in one study pack with the provider's per-minute allowance.
    max_pack_words: int
    max_pack_chars: int
