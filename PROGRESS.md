# Progress

Last updated: 2026-10-13

## Status
Phase 0 (setup) done. Groq key checked and valid; `backend/.env` complete.

Phase 1 (front-end shell) done on 2026-10-10: input page with notes (with clear and undo), a simulated recorder, a slide drop zone, a sticky Generate bar, light and dark themes, and subtle motion.

Phase 2 (back-end skeleton) done on 2026-10-12: FastAPI app with `GET /api/health`, `GET /api/limits` and `POST /api/sessions` (notes plus up to 5 PDF or .pptx files). Files are identified by content, request size is limited as bytes arrive, nothing is kept, CORS allows only the front end. Generate sends to the server and shows a receipt or a clear error. 13 tests pass; checked in a real browser (received, rejected, server down). Quality review and `/security-review` run; all recommended fixes applied.

Phase 3a (recording) done on 2026-10-12: real microphone recording at 32 kbps (about 14 MB an hour) with pause, resume, cancel, a live level meter and listen-back; audio-file upload; consent reminder by the record button. The microphone switches off on stop, cancel, failure and when the page goes away; a recording is kept if the microphone drops out; Generate is blocked while recording. The server accepts one audio file (25 MB, identified by its opening bytes). Quality review and `/security-review` run; all must-fix and recommended items fixed except the MP4 brand check (see Next).

Phase 3b (understanding) done on 2026-10-12: Generate answers 202 with a job number and the browser polls (tolerating up to two dropped checks). Background jobs read PDF and PowerPoint text (tables, grouped shapes, speaker notes; 300-page and zip-bomb limits; warnings for scanned or unreadable files) and transcribe audio with Whisper through the provider layer (transcription can use its own provider). Uploads are copied under generic names to a private folder deleted when the job ends; leftovers are swept at startup; results are forgotten once collected (15 minutes at most). "What Lucy heard and read" panel, labelled AI-generated; privacy notice updated to match. 32 tests pass with a stand-in for the provider; one live Groq run with a synthetic voice transcribed correctly apart from one drug-instruction word. Quality review and security review run; all findings fixed.

Phase 4a (edit before writing) done on 2026-10-13: the transcript and slide text are editable; corrections are kept in `App` next to Lucy's unchanged reading, marked "corrected by you", and can be undone. Closing the panel or reading again asks first when there are corrections. If the slides or recording change after reading, the button becomes "Read again". Notes-only sessions skip the panel. "Write my study pack" is in place but switched off until 4b. Quality review run; all must-fix and recommended items fixed; Playwright check in Edge passes 24 checks.

## Next
1. Phase 4b: the generator (provider chat call, prompt, Pydantic schema for the study pack, one retry on invalid JSON, grounding check that each item's quote appears in the material, token measurement before deciding on chunking, plain display of the pack, tests with a stand-in). Starts with a preview of tokens, context windows, temperature, structured output and hallucination. First decision: match slide text to files by a stable id, not by position (the server skips unreadable files, so positions can differ). Before 4b, Rugimbana checks Groq's free-tier limits for the text model. Replace the placeholder bar text "writing the study pack comes next".
2. Carry-overs to their phases:
   - Phase 4: the LLM goes through the same provider layer; the test stand-in pattern applies (no test calls the real provider).
   - Phase 5: replace the Generate receipt with real states; compare polling with streaming. Every keystroke in the review panel redraws the whole page (draft lives in `App`); measure on a long transcript and use `memo` if it feels slow.
   - Phase 7: a page reload loses notes, recording and corrections; decide on saving drafts or a leave-page warning.
   - Phase 10: the inline theme script in `index.html` needs a hash in the Content Security Policy; test the animated background on a low-end phone or laptop. Deploy installs from `requirements.txt` (runtime only). An early 413 during a large upload may show as "could not reach its server". The microphone needs https. Test recording on Safari or an iPhone, then decide on the MP4 brand check. Front end could read its limits from `/api/limits`. Jobs live in one process's memory: run a single worker, or move jobs to shared storage; cap concurrent jobs; uvicorn access logs record job ids. Add a time limit for parsing hostile PDFs. Windows `--reload` sometimes fails to restart the server: restart by hand if the API looks out of date.
3. Revisit with Rugimbana: CORS (still pending); data down, events up (memory hook: "down go data and phone numbers, up go phone calls"); test stand-ins, controlled components and derived state (phase 4a explain-back answers were explained, not yet answered by Rugimbana).

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
- 2026-10-12: Groq free-tier limits for `whisper-large-v3-turbo` (from Rugimbana's console): 20 requests a minute, 2,000 a day, 7,200 audio seconds an hour, 28,800 a day. File size limit not published for the free tier, so audio is capped at 25 MB.
- 2026-10-12: Phase 3 split into 3a (recording, mostly browser) and 3b (transcription, slide text, background jobs), so each walkthrough stays digestible.
- 2026-10-12: Recording at 32 kbps, capped at 90 minutes or about 24 MB, whichever comes first. Request limit raised to 160 MB (five 25 MB slide files, 25 MB of audio, notes).
- 2026-10-12: Claude Code hook adopted: after a back-end Python edit, the back-end tests run automatically (`.claude/settings.json`). `.claude/settings.local.json` is git-ignored because it can contain local paths.
- 2026-10-12: Background jobs with polling (202 Accepted + `GET /api/jobs/{id}`), jobs kept in memory, results handed over once. Simple and enough for one-on-one demos; shared storage only if Lucy ever runs on several servers.
- 2026-10-12: Transcription can use its own OpenAI-compatible provider (`TRANSCRIBE_BASE_URL`, `TRANSCRIBE_API_KEY`), defaulting to the LLM provider, because not every provider offers speech-to-text.
- 2026-10-12: Editable transcript before generation (Rugimbana's idea): AI transcription makes mistakes (live test: "nebulasts" for "nebulised"), so the student corrects it and the AI works from the corrected version. Scheduled as the first item of phase 4.
- 2026-10-13: Phase 4 split into 4a (edit before writing) and 4b (the generator). 4b adds a grounding check: each flashcard and question carries a short quote from the material, and the server checks the quote is really there.
- 2026-10-13: One button that follows the stage: Generate, then (while reviewing) Write my study pack, or Read again if the inputs changed. Reading again with corrections asks first.
