# Lucy

Lucy turns clinical teaching into a study pack. Record a teaching conversation, type your notes, add the slides, and Lucy gives you a summary, flashcards, an exam-style quiz, a chat about the session, and further reading from credible sources.

**Status:** early development (phase 2 of the plan in `docs/plan.md`). The front end sends notes and slides to the back end, which checks them and confirms what it received. Study pack generation is not connected yet. See `docs/plan.md`.

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
The API answers at http://localhost:8000, with interactive documentation at http://localhost:8000/docs. Run the tests with `pytest`.

Front end (needs Node 24):
```
cd frontend
npm install
npm run dev
```
Then open http://localhost:5173.
