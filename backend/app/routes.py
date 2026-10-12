from typing import Annotated

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.files import (
    MAX_AUDIO_BYTES,
    MAX_AUDIO_MB,
    MAX_SLIDE_BYTES,
    MAX_SLIDE_FILES,
    MAX_SLIDE_MB,
    detect_audio_kind,
    detect_slide_kind,
    display_name,
)
from app.schemas import AudioReceipt, Health, Limits, SessionReceipt, SlideReceipt

# Same limit as the notes editor in the front end (NotesEditor.tsx).
MAX_NOTES_CHARS = 20_000

router = APIRouter(prefix='/api')


@router.get('/health')
def health() -> Health:
    return Health(status='ok')


@router.get('/limits')
def limits() -> Limits:
    return Limits(
        max_slide_files=MAX_SLIDE_FILES,
        max_slide_mb=MAX_SLIDE_MB,
        max_audio_mb=MAX_AUDIO_MB,
        max_notes_chars=MAX_NOTES_CHARS,
    )


@router.post('/sessions')
def receive_session(
    notes: Annotated[str, Form(max_length=MAX_NOTES_CHARS)] = '',
    slides: Annotated[list[UploadFile] | None, File()] = None,
    audio: Annotated[UploadFile | None, File()] = None,
) -> SessionReceipt:
    slides = slides or []

    if not notes.strip() and not slides and audio is None:
        raise HTTPException(status_code=422, detail='Add notes, a recording or slides to send.')
    if len(slides) > MAX_SLIDE_FILES:
        raise HTTPException(status_code=422, detail=f'You can send up to {MAX_SLIDE_FILES} slide files.')

    slide_receipts = []
    for upload in slides:
        name = display_name(upload)
        size = upload.size or 0
        if size > MAX_SLIDE_BYTES:
            raise HTTPException(status_code=413, detail=f'{name} is larger than {MAX_SLIDE_MB} MB.')
        kind = detect_slide_kind(upload)
        if kind is None:
            raise HTTPException(status_code=415, detail=f'{name} is not a PDF or PowerPoint (.pptx) file.')
        slide_receipts.append(SlideReceipt(name=name, kind=kind, size_bytes=size))

    audio_receipt = None
    if audio is not None:
        name = display_name(audio)
        size = audio.size or 0
        if size > MAX_AUDIO_BYTES:
            raise HTTPException(status_code=413, detail=f'{name} is larger than {MAX_AUDIO_MB} MB.')
        kind = detect_audio_kind(audio)
        if kind is None:
            raise HTTPException(status_code=415, detail=f'{name} is not an audio format Lucy can read.')
        audio_receipt = AudioReceipt(name=name, kind=kind, size_bytes=size)

    # Nothing is kept: FastAPI closes the uploads after the response, which deletes their temporary files.
    return SessionReceipt(notes_words=len(notes.split()), slides=slide_receipts, audio=audio_receipt)
