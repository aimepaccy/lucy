"""The one place Lucy talks to an AI provider. Which provider is chosen in .env, not here."""

from pathlib import Path

import openai

from app.config import get_settings

# A short hint of the setting helps Whisper spell clinical terms and keep punctuation.
TRANSCRIBE_HINT = 'A clinical teaching session on a hospital ward, with medical terms.'


class ProviderError(Exception):
    """A failure the student can be told about in plain words."""


def _transcription_client() -> openai.OpenAI:
    base_url, key = get_settings().transcription_provider
    if not key:
        raise ProviderError("Lucy's server has no AI key configured, so it cannot transcribe yet.")
    # Worst case, three tries of two minutes each stays inside the browser's ten-minute wait.
    return openai.OpenAI(base_url=base_url, api_key=key, timeout=120, max_retries=2)


def transcribe(audio: Path, kind: str) -> str:
    # The file goes as bytes under a generic name; the student's own file name never leaves the server.
    try:
        with audio.open('rb') as file:
            text = _transcription_client().audio.transcriptions.create(
                model=get_settings().transcribe_model,
                file=(f'audio.{kind}', file),
                prompt=TRANSCRIBE_HINT,
                response_format='text',
            )
    except openai.AuthenticationError as error:
        raise ProviderError("The transcription service did not accept Lucy's key.") from error
    except openai.RateLimitError as error:
        raise ProviderError('The transcription service is busy. Please try again in a minute.') from error
    except (openai.APIConnectionError, openai.APITimeoutError) as error:
        raise ProviderError('Lucy could not reach the transcription service. Please try again.') from error
    except openai.BadRequestError as error:
        raise ProviderError('The transcription service could not read this recording.') from error
    except openai.APIError as error:
        raise ProviderError('The transcription service had a problem. Please try again.') from error
    return str(text).strip()
