"""The one place Lucy talks to an AI provider. Which provider is chosen in .env, not here."""

from pathlib import Path

import openai
from pydantic import BaseModel

from app.config import get_settings

# A short hint of the setting helps Whisper spell clinical terms and keep punctuation.
TRANSCRIBE_HINT = 'A clinical teaching session on a hospital ward, with medical terms.'


class ProviderError(Exception):
    """A failure the student can be told about in plain words."""


class InvalidOutput(ProviderError):
    """The AI's answer did not fit the form it was given. Worth one more try."""


def _client(base_url: str, key: str, service: str) -> openai.OpenAI:
    if not key:
        raise ProviderError(f"Lucy's server has no AI key configured, so it cannot {service} yet.")
    # Worst case, three tries of two minutes each stays inside the browser's ten-minute wait.
    return openai.OpenAI(base_url=base_url, api_key=key, timeout=120, max_retries=2)


def _translate(error: openai.APIError, service: str) -> ProviderError:
    """Turn a technical failure into words for the student. The cause stays attached for the log."""
    if isinstance(error, openai.AuthenticationError):
        return ProviderError(f"The {service} service did not accept Lucy's key.")
    if isinstance(error, openai.RateLimitError):
        return ProviderError(f'The {service} service is busy. Please try again in a minute.')
    if isinstance(error, (openai.APIConnectionError, openai.APITimeoutError)):
        return ProviderError(f'Lucy could not reach the {service} service. Please try again.')
    if isinstance(error, openai.APIStatusError) and error.status_code == 413:
        return ProviderError(f'Your material is too long for the {service} service in one go.')
    return ProviderError(f'The {service} service had a problem. Please try again.')


def transcribe(audio: Path, kind: str) -> str:
    base_url, key = get_settings().transcription_provider
    # The file goes as bytes under a generic name; the student's own file name never leaves the server.
    try:
        with audio.open('rb') as file:
            text = _client(base_url, key, 'transcribe').audio.transcriptions.create(
                model=get_settings().transcribe_model,
                file=(f'audio.{kind}', file),
                prompt=TRANSCRIBE_HINT,
                response_format='text',
            )
    except openai.BadRequestError as error:
        raise ProviderError('The transcription service could not read this recording.') from error
    except openai.APIError as error:
        raise _translate(error, 'transcription') from error
    return str(text).strip()


def write_json(instructions: str, material: str, form: type[BaseModel], max_tokens: int) -> tuple[str, int]:
    """Ask the LLM to fill in `form` (structured output). Returns the raw JSON and the tokens used."""
    settings = get_settings()
    client = _client(settings.llm_base_url, settings.llm_api_key.get_secret_value(), 'write')
    extra = {'reasoning_effort': settings.llm_reasoning_effort} if settings.llm_reasoning_effort else {}
    try:
        response = client.chat.completions.create(
            model=settings.llm_model,
            messages=[
                {'role': 'system', 'content': instructions},
                {'role': 'user', 'content': material},
            ],
            # Low temperature: steady, predictable wording for medical facts.
            temperature=0.3,
            max_tokens=max_tokens,
            response_format={
                'type': 'json_schema',
                'json_schema': {'name': form.__name__, 'strict': True, 'schema': form.model_json_schema()},
            },
            **extra,
        )
    except openai.BadRequestError as error:
        # Groq answers 400 when the model's output breaks the schema; other providers may too.
        raise InvalidOutput('The AI wrote something Lucy could not use.') from error
    except openai.APIError as error:
        raise _translate(error, 'writing') from error

    choice = response.choices[0]
    if choice.finish_reason == 'length' or not choice.message.content:
        raise InvalidOutput('The AI ran out of room before finishing.')
    used = response.usage.total_tokens if response.usage else 0
    return choice.message.content, used
