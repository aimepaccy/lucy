import zipfile
from pathlib import PurePath

from fastapi import UploadFile

from app.schemas import SlideKind

MAX_SLIDE_FILES = 5
MAX_SLIDE_MB = 25
MAX_SLIDE_BYTES = MAX_SLIDE_MB * 1024 * 1024

PDF_SIGNATURE = b'%PDF-'
ZIP_SIGNATURE = b'PK\x03\x04'


def detect_slide_kind(upload: UploadFile) -> SlideKind | None:
    """Identify a file by its content, not its name: a renamed file must not pass."""
    upload.file.seek(0)
    start = upload.file.read(1024)
    upload.file.seek(0)

    # The PDF standard allows the signature anywhere in the first 1024 bytes.
    if PDF_SIGNATURE in start:
        return 'pdf'
    if start.startswith(ZIP_SIGNATURE) and _is_presentation(upload):
        return 'pptx'
    return None


def _is_presentation(upload: UploadFile) -> bool:
    # A .docx or .xlsx is also a zip; only PowerPoint files contain this entry.
    # Listing names reads the zip's index without unpacking anything. A damaged zip
    # can fail in several ways; all of them mean "not a presentation".
    try:
        with zipfile.ZipFile(upload.file) as archive:
            return 'ppt/presentation.xml' in archive.namelist()
    except (zipfile.BadZipFile, ValueError, OSError, EOFError):
        return False
    finally:
        upload.file.seek(0)


def display_name(upload: UploadFile) -> str:
    # Used only for showing back to the user, never to build a path on disk.
    name = PurePath((upload.filename or 'file').replace('\\', '/')).name
    return name[:200] or 'file'
