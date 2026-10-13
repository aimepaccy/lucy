import shutil
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, File, Form, HTTPException, UploadFile
from fastapi import Path as PathParam

from app import generate, jobs
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
from app.schemas import (
    MAX_NOTES_CHARS,
    AudioReceipt,
    Health,
    JobCreated,
    JobState,
    Limits,
    PackJobCreated,
    PackRequest,
    SessionReceipt,
    SlideReceipt,
)

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
        max_pack_words=generate.allowed_words(),
        max_pack_chars=generate.allowed_chars(),
    )


@router.post('/sessions', status_code=202)
def receive_session(
    background: BackgroundTasks,
    notes: Annotated[str, Form(max_length=MAX_NOTES_CHARS)] = '',
    slides: Annotated[list[UploadFile] | None, File()] = None,
    audio: Annotated[UploadFile | None, File()] = None,
) -> JobCreated:
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

    # FastAPI deletes the uploads when this request ends, so the job gets its own copies,
    # under generic names, in a private folder that the job deletes when it finishes.
    folder = jobs.new_folder()
    try:
        work = jobs.JobInput(folder=folder, slides=[])
        for number, (upload, receipt) in enumerate(zip(slides, slide_receipts)):
            path = _save(upload, folder / f'slide-{number}.{receipt.kind}')
            work.slides.append(jobs.SlideInput(path=path, name=receipt.name, kind=receipt.kind))
        if audio is not None and audio_receipt is not None:
            work.audio = _save(audio, folder / f'audio.{audio_receipt.kind}')
            work.audio_kind = audio_receipt.kind
        job_id = jobs.create()
        background.add_task(jobs.run, job_id, work)
    except Exception:
        shutil.rmtree(folder, ignore_errors=True)
        raise
    receipt = SessionReceipt(notes_words=len(notes.split()), slides=slide_receipts, audio=audio_receipt)
    return JobCreated(job_id=job_id, receipt=receipt)


@router.post('/packs', status_code=202)
def write_pack(request: PackRequest, background: BackgroundTasks) -> PackJobCreated:
    material = generate.assemble(request)
    if not material:
        raise HTTPException(status_code=422, detail='There is nothing to write a study pack from yet.')
    try:
        generate.check_budget(material)
    except generate.MaterialTooLong as error:
        present = [
            name
            for name, there in (
                ('your notes', request.notes.strip()),
                ('the transcript', request.transcript and request.transcript.strip()),
                ('the slide text', any(slide.text.strip() for slide in request.slides)),
            )
            if there
        ]
        advice = present[0] if len(present) == 1 else ', '.join(present[:-1]) + ' or ' + present[-1]
        raise HTTPException(
            status_code=413,
            detail=(
                f'Your material is about {error.words:,} words, and Lucy can write from about '
                f'{error.allowed_words:,} at a time. Shorten {advice}.'
            ),
        ) from error
    job_id = jobs.create()
    background.add_task(jobs.write, job_id, request)
    return PackJobCreated(job_id=job_id)


@router.get('/jobs/{job_id}')
def job_state(job_id: Annotated[str, PathParam(pattern='^[0-9a-f]{32}$')]) -> JobState:
    state = jobs.get(job_id)
    if state is None:
        raise HTTPException(status_code=404, detail='This job has finished and its results were cleared, or it never existed.')
    return state


def _save(upload: UploadFile, destination: Path) -> Path:
    upload.file.seek(0)
    with destination.open('wb') as out:
        shutil.copyfileobj(upload.file, out)
    return destination
