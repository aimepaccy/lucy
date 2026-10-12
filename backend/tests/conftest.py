import os

import pytest

# Tests use fixed settings, whatever is in the developer's own .env.
os.environ['ALLOWED_ORIGINS'] = 'http://localhost:5173'
os.environ['MAX_REQUEST_MB'] = '160'
# No real key, so no test can ever reach the AI provider.
os.environ['LLM_API_KEY'] = ''
os.environ['TRANSCRIBE_API_KEY'] = ''

FAKE_TRANSCRIPT = 'Wheeze is a sign of narrowed airways.'


@pytest.fixture(autouse=True)
def private_jobs_folder(monkeypatch, tmp_path):
    """Each test gets its own folder for uploads, so tests never touch the real one."""
    from app import jobs

    monkeypatch.setattr(jobs, 'JOBS_ROOT', tmp_path / 'lucy-jobs')


@pytest.fixture(autouse=True)
def fake_transcribe(monkeypatch):
    """Stands in for the real provider: records each call and returns a fixed transcript."""
    from app import providers

    calls = []

    def transcribe(audio, kind):
        calls.append({'kind': kind, 'name': audio.name, 'bytes': audio.read_bytes()})
        return FAKE_TRANSCRIPT

    monkeypatch.setattr(providers, 'transcribe', transcribe)
    return calls
