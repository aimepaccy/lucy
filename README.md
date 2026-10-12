# Lucy

Lucy turns clinical teaching into a study pack. Record a teaching conversation, type your notes, add the slides, and Lucy gives you a summary, flashcards, an exam-style quiz, a chat about the session, and further reading from credible sources.

**Status:** early development (phase 3 of the plan in `docs/plan.md`). Lucy records or accepts audio, transcribes it with Whisper, reads the text of PDF and PowerPoint slides, and shows what it heard and read. Study pack generation is not connected yet.

> Lucy is for teaching material only: role-played rounds, lectures, and your own notes. Do not upload anything that could identify a patient.

## How it will work
- **Front end:** React, Tailwind CSS, shadcn/ui, Motion
- **Back end:** Python, FastAPI
- **AI:** any OpenAI-compatible provider (Groq by default), set in configuration
- **Further reading:** links come from PubMed/StatPearls, curated YouTube channels, Wikipedia and Radiopaedia, never written by the AI

## Running it locally
Run the back end and the front end in two terminals.

Back end (needs Python 3.13):
```
cd backend
py -3.13 -m venv .venv
.venv\Scripts\activate
pip install -r requirements-lock.txt
copy .env.example .env
uvicorn app.main:app --reload --port 8000
```
Before starting the server, put your AI provider key in `.env` as `LLM_API_KEY`. The API answers at http://localhost:8000, with interactive documentation at http://localhost:8000/docs. Run the tests with `pytest`.

Front end (needs Node 24):
```
cd frontend
npm install
npm run dev
```
Then open http://localhost:5173.
