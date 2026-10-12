# Progress

Last updated: 2026-10-12

## Status
Phase 0 (setup) done. Groq key checked and valid; `backend/.env` complete.

Phase 1 (front-end shell) done on 2026-10-10: input page with notes (with clear and undo), a simulated recorder, a slide drop zone, a sticky Generate bar, light and dark themes, and subtle motion.

Phase 2 (back-end skeleton) done on 2026-10-12: FastAPI app with `GET /api/health`, `GET /api/limits` and `POST /api/sessions` (notes plus up to 5 PDF or .pptx files). Files are identified by content, request size is limited as bytes arrive, nothing is kept, CORS allows only the front end. Generate sends to the server and shows a receipt or a clear error. 13 tests pass; checked in a real browser (received, rejected, server down). Quality review and `/security-review` run; all recommended fixes applied.

## Next
1. Phase 3: ingestion (in-app recording and audio upload, transcription with Whisper, text from PDF and PPTX). Starts with a preview of MediaRecorder, audio formats, MIME types and background jobs.
2. Carry-overs to their phases:
   - Phase 3: add audio-file upload to the Recorder panel; the microphone needs a secure context (HTTPS or localhost); turn the microphone off in effect cleanup. Audio raises the size question again: check the provider's audio file limit and revisit `MAX_REQUEST_MB`. Test the PDF check on real slide decks. Run `/security-review` on the new upload paths.
   - Phase 5: replace the Generate receipt and the "Preview" badge with real states.
   - Phase 10: the inline theme script in `index.html` needs a hash in the Content Security Policy; test the animated background on a low-end phone or laptop. Deploy installs from `requirements.txt` (runtime only), not the lock file, which also holds test tools. An early 413 during a large upload may show in the browser as "could not reach its server"; test on the hosted version.
3. Revisit with Rugimbana: CORS (explain-back question 2 was missed) and data down, events up (check question set on 2026-10-12).

## Blockers
None.

## Decisions
- 2026-10-10: Name Lucy. GitHub repo `aimepaccy/lucy`; local folder renamed from `notes-app` to `lucy`, and `_hub/projects.txt` updated.
- 2026-10-10: Repo is public from the start, to show the build process. Consequence: no secrets, no patient data, and no mention of the university anywhere in the repo.
- 2026-10-10: Inputs for v1: in-app recording and audio upload, typed notes, .pptx and PDF. Video upload and photos of handwritten notes deferred.
- 2026-10-10: Only role-played or teaching audio, never real ward audio (patient information; free AI tiers may retain data).
- 2026-10-10: Stack: React (Vite, TypeScript) + Tailwind + shadcn/ui + Motion; Python FastAPI back end. Python for its AI and document tooling, and because Rugimbana knows it.
- 2026-10-10: AI through an OpenAI-compatible provider layer configured in `.env` (vendor independence). Groq first.
- 2026-10-10: Further reading from PubMed/StatPearls, curated YouTube channels, Wikipedia and Radiopaedia. Links come only from APIs.
- 2026-10-10: History saved in the browser (IndexedDB), no server database for study content.
- 2026-10-10: v1 extras: exam-style quiz, "ask about my session" chat, and feedback for v2.
- 2026-10-10: Look: calm clinical, light and dark.
- 2026-10-10: Hosting: localhost while building, free hosting for demos (phase 10). Demos are one-on-one conversations, not formal pitches.
- 2026-10-10: Learning mode: Walkthrough with occasional retyping; every phase fully explained, none skipped (see `AGENTS.md`).
- 2026-10-10: Motion and look: subtle and purposeful (springs, staggered entrance, sliding lists, recording pulse, circular theme reveal), switched off by the device's reduce-motion setting. A richer upgrade (spotlight cards, travelling borders, serif accent, magnetic button, "What you get" bento) was built and then reverted the same evening: Rugimbana preferred the calmer original. It stays in git history (commit `ef045ee`) if wanted later. Ideas from component libraries are rewritten in-house, never installed.
- 2026-10-10: Inter font, served from our own files (no Google Fonts request).
- 2026-10-10: Playwright adopted for checking the UI in a real browser (Edge); it becomes the end-to-end test tool in phase 10.
- 2026-10-10: No license file yet (all rights reserved by default). Revisit before sharing widely.
- 2026-10-11: Front end calls the back end directly with CORS, not through a Vite proxy, so CORS is met in development rather than as a surprise at deploy.
- 2026-10-11: Audio is sent from phase 3; phase 2 sends notes and slides only, and the receipt says recordings are not sent yet.
- 2026-10-11: Uploads are identified by content (file signature, and `ppt/presentation.xml` inside the zip), never by name. Limits: 5 files, 25 MB each, 130 MB per request, 20,000 characters of notes (same as the editor).
- 2026-10-11: `/security-review` adopted for phases that touch inputs, secrets or access (3, 6, 10).
- 2026-10-12: Teaching style: beginner-friendly ("for dummies"): everyday words and an analogy first, then the term, then the code. Recorded in `_hub/PROFILE.md`.
