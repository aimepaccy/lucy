# Learning log

Dated entries. For each session: concepts met, what clicked, mistakes worth remembering, open questions.

## 2026-10-10: Phase 0, planning and setup
- **MVP (minimum viable product):** the smallest version that proves the idea works for a real user. Scope is cut on purpose; the rest goes to v2.
- **Front end vs back end:** the front end runs in the user's browser (what they see and click). The back end runs on a server (files, secrets, calls to AI services). API keys live only on the back end, because anything in the browser can be read by the user.
- **Monorepo:** one repository holding both `frontend/` and `backend/`. Simple for a solo project; larger teams sometimes split them.
- **Environment variables and `.env`:** settings and secrets kept outside the code. `.env` is gitignored; `.env.example` is committed with empty values so anyone knows which settings to fill in.
- **OpenAI-compatible API:** a request format many AI providers accept. Writing to that format, with the provider chosen in `.env`, is how Lucy stays vendor independent.
- **Grounding:** making AI output depend on real sources. In Lucy the AI only suggests search terms; real APIs return the links.
- **Public repo:** anyone can read the code and the full history. A secret committed once stays in the history even after deletion, so `.gitignore` must be right before the first commit.
- **Privacy by design:** deciding what data a system may touch before building it (here: role-play and teaching audio only).
- Explain-back (to answer next session):
  1. Why must the Groq API key live in the back end and never in the React code?
  2. If we want to switch from Groq to a local model next year, what do we change, and what stays the same?
  3. Why does the further-reading feature not just ask the AI for "five good references"?
- Explain-back answers (2026-10-10, second session):
  1. Right conclusion, imprecise reason ("the code is public"). The real reason: front-end code is downloaded to and runs on the user's device, so anyone can read it with developer tools, even if the repo were private. Principle: the **trust boundary**; nothing on the user's side can hold a secret.
  2. Solid: change `.env` settings (URL, key, model), keep the code. Caveat added: a new provider keeps the app connected but not necessarily the same output quality, so re-test after switching.
  3. Half right. Correction: the AI does not search or propose sources at all; it only suggests search terms, and real APIs return real links. The reason is **hallucination**: LLMs produce plausible-looking references that may not exist, and "plausible" is the danger.
- AI-tool feature: `/resume` reopens past Claude Code conversations, filed by folder path (renaming the folder hides old chats). Verdict: use it for continuity, but keep `PROGRESS.md` as the real record, since it travels with the repo.
