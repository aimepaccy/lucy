# WardWise

WardWise turns clinical teaching into a study pack. Record a teaching conversation, take photos of your handwritten notes, add the slides, and WardWise gives you a summary, flashcards, an exam-style quiz, a chat about the session, and further reading from credible sources.

**Status:** early development (phase 7 of the plan in `docs/plan.md`). WardWise records or accepts audio, transcribes it with Whisper, reads PDF and PowerPoint slides and photos of handwritten notes, lets you correct what it heard and read, and writes a study pack: an overview, checked teaching points, flashcards, a quiz, and further reading. Every pack is saved in your browser (never on the server), and you can reopen, export and import packs. The chat and feedback come next.

> WardWise is for teaching material only: role-played rounds, lectures, and your own notes. Do not upload anything that could identify a patient.

## How it works
- **Front end:** React, Tailwind CSS, shadcn/ui, Motion
- **Back end:** Python, FastAPI
- **AI:** any OpenAI-compatible provider (Groq by default), set in configuration
- **Further reading:** links come from PubMed, StatPearls, Wikipedia, five teaching channels on YouTube, and the search pages of Radiopaedia and MSD Manuals. The AI only suggests search terms; it never writes links.

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
Before starting the server, put your AI provider key in `.env` as `LLM_API_KEY`. Two keys are optional: `YOUTUBE_API_KEY` (a free YouTube Data API v3 key; without it, videos are left out) and `NCBI_API_KEY` (faster PubMed and StatPearls lookups). The API answers at http://localhost:8000, with interactive documentation at http://localhost:8000/docs. Run the tests with `pytest`.

Front end (needs Node 24):
```
cd frontend
npm install
npm run dev
```
Then open http://localhost:5173. Run the front-end tests with `npm test`.
