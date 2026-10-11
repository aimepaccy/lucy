import io
import zipfile

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.limits import BodySizeLimit
from app.main import app

client = TestClient(app)

PDF = b'%PDF-1.7\n%fake but correctly signed\n'


def office_zip(entry: str) -> bytes:
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, 'w') as archive:
        archive.writestr(entry, '<xml/>')
    return buffer.getvalue()


def post(notes: str = '', files: list[tuple[str, bytes]] | None = None):
    parts = [('slides', (name, content)) for name, content in files or []]
    return client.post('/api/sessions', data={'notes': notes}, files=parts or None)


def test_health():
    response = client.get('/api/health')
    assert response.status_code == 200
    assert response.json() == {'status': 'ok'}


def test_receipt_for_notes_and_slides():
    pptx = office_zip('ppt/presentation.xml')
    response = post('Asthma: wheeze, cough and chest tightness', [('a.pdf', PDF), ('b.pptx', pptx)])
    assert response.status_code == 200
    assert response.json() == {
        'notes_words': 6,
        'slides': [
            {'name': 'a.pdf', 'kind': 'pdf', 'size_bytes': len(PDF)},
            {'name': 'b.pptx', 'kind': 'pptx', 'size_bytes': len(pptx)},
        ],
    }


def test_nothing_to_send():
    assert post('   ').status_code == 422


def test_renamed_file_is_rejected():
    response = post(files=[('slides.pdf', b'MZ\x90\x00 not a pdf')])
    assert response.status_code == 415


def test_word_document_renamed_to_pptx_is_rejected():
    response = post(files=[('slides.pptx', office_zip('word/document.xml'))])
    assert response.status_code == 415


def test_damaged_zip_is_rejected():
    damaged = office_zip('ppt/presentation.xml')[:-10]
    assert post(files=[('slides.pptx', damaged)]).status_code == 415


def test_pdf_signature_after_leading_bytes():
    response = post(files=[('a.pdf', b'\x00' * 20 + PDF)])
    assert response.json()['slides'][0]['kind'] == 'pdf'


def test_too_many_files():
    files = [(f'{n}.pdf', PDF) for n in range(6)]
    assert post(files=files).status_code == 422


def test_file_over_25_mb():
    big = PDF + b'0' * (25 * 1024 * 1024)
    assert post(files=[('big.pdf', big)]).status_code == 413


def test_path_in_filename_is_stripped():
    response = post(files=[('../../etc/a.pdf', PDF)])
    assert response.json()['slides'][0]['name'] == 'a.pdf'


def test_cors_allows_only_the_front_end():
    allowed = client.get('/api/health', headers={'Origin': 'http://localhost:5173'})
    other = client.get('/api/health', headers={'Origin': 'https://evil.example'})
    assert allowed.headers['access-control-allow-origin'] == 'http://localhost:5173'
    assert 'access-control-allow-origin' not in other.headers


def test_body_size_limit():
    tiny = FastAPI()

    @tiny.post('/echo')
    async def echo(body: dict) -> dict:
        return body

    tiny.add_middleware(BodySizeLimit, max_bytes=10)
    limited = TestClient(tiny)
    assert limited.post('/echo', json={'a': 1}).status_code == 200
    assert limited.post('/echo', json={'a': 'x' * 50}).status_code == 413
    streamed = limited.post('/echo', content=iter([b'{"a": "', b'x' * 50, b'"}']))
    assert streamed.status_code == 413
