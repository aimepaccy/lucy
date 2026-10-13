import json

from fastapi.testclient import TestClient

from app import generate, providers
from app.main import app
from app.schemas import PackRequest, SlideSource
from tests.conftest import FAKE_NOTES, fake_pack

client = TestClient(app)


def finished_job(job_id: str) -> dict:
    # TestClient runs background tasks before returning, so the job is already finished.
    return client.get(f'/api/jobs/{job_id}').json()


def write(**body) -> dict:
    response = client.post('/api/packs', json=body)
    assert response.status_code == 202, response.text
    return finished_job(response.json()['job_id'])


def test_pack_is_written_and_checked(fake_writer):
    state = write(notes=FAKE_NOTES)
    assert state['status'] == 'done'
    pack = state['pack']
    assert pack['title'] == 'Acute asthma'
    assert [card['grounded'] for card in pack['flashcards']] == [True, False]
    assert pack['questions'][0]['grounded'] is True
    assert pack['model']
    assert len(fake_writer['calls']) == 1


def test_material_is_labelled_and_file_names_stay_here(fake_writer):
    write(notes='Notes here.', transcript='Transcript here.', slides=[{'text': 'Slide text.'}, {'text': '  '}])
    material = fake_writer['calls'][0]['material']
    assert '<notes>\nNotes here.\n</notes>' in material
    assert '<transcript>\nTranscript here.\n</transcript>' in material
    assert '<slides file="1">\nSlide text.\n</slides>' in material
    assert 'file="2"' not in material  # empty slide text is left out


def test_nothing_to_write_from():
    response = client.post('/api/packs', json={'notes': '   ', 'transcript': '', 'slides': []})
    assert response.status_code == 422


def test_too_much_material_is_refused_before_any_ai_call(fake_writer):
    response = client.post('/api/packs', json={'transcript': 'wheeze ' * 20_000})
    assert response.status_code == 413
    assert 'Lucy can write from about' in response.json()['detail']
    assert fake_writer['calls'] == []


def test_notes_over_the_editor_limit_are_refused():
    assert client.post('/api/packs', json={'notes': 'x' * 20_001}).status_code == 422


def test_broken_answer_is_tried_once_more(fake_writer):
    fake_writer['answers'].extend(['{"title": "half a pack"', providers.InvalidOutput('broke the form')])
    state = write(notes=FAKE_NOTES)
    assert state['status'] == 'failed'
    assert state['error'] == 'Lucy could not write a usable study pack this time. Please try again.'
    assert len(fake_writer['calls']) == 2


def test_second_try_can_succeed(fake_writer):
    fake_writer['answers'].append('not json at all')
    state = write(notes=FAKE_NOTES)
    assert state['status'] == 'done'
    assert len(fake_writer['calls']) == 2


def test_provider_failure_is_explained(fake_writer):
    fake_writer['answers'].append(providers.ProviderError('The writing service is busy. Please try again in a minute.'))
    state = write(notes=FAKE_NOTES)
    assert state == {
        'status': 'failed',
        'step': 'Failed',
        'materials': None,
        'pack': None,
        'error': 'The writing service is busy. Please try again in a minute.',
    }
    assert len(fake_writer['calls']) == 1  # a busy service is not retried at once


def test_question_without_five_options_is_left_out(fake_writer):
    broken = fake_pack()['questions'][0] | {'options': fake_pack()['questions'][0]['options'][:4]}
    fake_writer['answers'].append(json.dumps(fake_pack(questions=[broken])))
    assert write(notes=FAKE_NOTES)['pack']['questions'] == []


def test_grounding_ignores_case_punctuation_and_line_breaks():
    material = 'Always check inhaler technique,\nbefore stepping UP treatment.'
    assert generate.is_grounded('check inhaler technique before stepping up', material)
    assert not generate.is_grounded('check inhaler technique after stepping up', material)


def test_short_quotes_prove_nothing():
    assert not generate.is_grounded('asthma', 'Acute asthma on the ward.')


def test_quotes_match_whole_words_only():
    assert not generate.is_grounded('sthma on the ward today', 'Asthma on the ward today.')


def test_budget_follows_the_providers_limit(monkeypatch):
    request = PackRequest(slides=[SlideSource(text='word ' * 1500)])
    material = generate.assemble(request)
    generate.check_budget(material)  # fits in 8000 tokens a minute
    monkeypatch.setenv('LLM_TOKENS_PER_MINUTE', '5000')
    generate.get_settings.cache_clear()
    try:
        try:
            generate.check_budget(material)
            raise AssertionError('should not fit in 5000 tokens a minute')
        except generate.MaterialTooLong:
            pass
    finally:
        monkeypatch.delenv('LLM_TOKENS_PER_MINUTE')
        generate.get_settings.cache_clear()


def test_quote_in_pieces_is_checked_piece_by_piece():
    material = 'Check her inhaler technique. Peak flow above 75 percent of best before discharge.'
    assert generate.is_grounded('her inhaler technique... Peak flow above 75 percent', material)
    assert not generate.is_grounded('her inhaler technique... Peak flow above 90 percent', material)
    assert not generate.is_grounded('her inhaler technique... of', material)  # a tiny piece proves nothing
