# Lucy

Lucy turns clinical teaching into a study pack. Record a teaching conversation, type your notes, add the slides, and Lucy gives you a summary, flashcards, an exam-style quiz, a chat about the session, and further reading from credible sources.

**Status:** early development. The front-end shell (phase 1 of 0 to 11) runs in the browser; study pack generation is not connected yet. See `docs/plan.md`.

> Lucy is for teaching material only: role-played rounds, lectures, and your own notes. Do not upload anything that could identify a patient.

## How it will work
- **Front end:** React, Tailwind CSS, shadcn/ui, Motion
- **Back end:** Python, FastAPI
- **AI:** any OpenAI-compatible provider (Groq by default), set in configuration
- **Further reading:** links come from PubMed/StatPearls, curated YouTube channels, Wikipedia and Radiopaedia, never written by the AI

## Running it locally
Front end (needs Node 24):
```
cd frontend
npm install
npm run dev
```
Then open http://localhost:5173. The back end arrives in phase 2.
