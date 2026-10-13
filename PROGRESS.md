# Progress

Last updated: 2026-10-13

## Status
Phase 0 (setup) done. Groq key checked and valid; `backend/.env` complete.

Phase 1 (front-end shell) done on 2026-10-10: input page with notes (with clear and undo), a simulated recorder, a slide drop zone, a sticky Generate bar, light and dark themes, and subtle motion.

Phase 2 (back-end skeleton) done on 2026-10-12: FastAPI app with `GET /api/health`, `GET /api/limits` and `POST /api/sessions` (notes plus up to 5 PDF or .pptx files). Files are identified by content, request size is limited as bytes arrive, nothing is kept, CORS allows only the front end. Generate sends to the server and shows a receipt or a clear error. 13 tests pass; checked in a real browser (received, rejected, server down). Quality review and `/security-review` run; all recommended fixes applied.

Phase 3a (recording) done on 2026-10-12: real microphone recording at 32 kbps (about 14 MB an hour) with pause, resume, cancel, a live level meter and listen-back; audio-file upload; consent reminder by the record button. The microphone switches off on stop, cancel, failure and when the page goes away; a recording is kept if the microphone drops out; Generate is blocked while recording. The server accepts one audio file (25 MB, identified by its opening bytes). Quality review and `/security-review` run; all must-fix and recommended items fixed except the MP4 brand check (see Next).

Phase 3b (understanding) done on 2026-10-12: Generate answers 202 with a job number and the browser polls (tolerating up to two dropped checks). Background jobs read PDF and PowerPoint text (tables, grouped shapes, speaker notes; 300-page and zip-bomb limits; warnings for scanned or unreadable files) and transcribe audio with Whisper through the provider layer (transcription can use its own provider). Uploads are copied under generic names to a private folder deleted when the job ends; leftovers are swept at startup; results are forgotten once collected (15 minutes at most). "What Lucy heard and read" panel, labelled AI-generated; privacy notice updated to match. 32 tests pass with a stand-in for the provider; one live Groq run with a synthetic voice transcribed correctly apart from one drug-instruction word. Quality review and security review run; all findings fixed.

Phase 4a (edit before writing) done on 2026-10-13: the transcript and slide text are editable; corrections are kept in `App` next to Lucy's unchanged reading, marked "corrected by you", and can be undone. Closing the panel or reading again asks first when there are corrections. If the slides or recording change after reading, the button becomes "Read again". Notes-only sessions skip the panel. "Write my study pack" is in place but switched off until 4b. Quality review run; all must-fix and recommended items fixed; Playwright check in Edge passes 24 checks.

Phase 4b (the generator) done on 2026-10-13: "Write my study pack" sends notes and the corrected text as JSON to `POST /api/packs`; the job asks `openai/gpt-oss-120b` on Groq to fill in a strict JSON form (summary, flashcards, single best answer questions with an explanation per option, search terms); Pydantic checks it, a broken answer gets one more try, and Lucy checks every item's quote is really in the material (flagging any it cannot find), removes links, shuffles options and drops malformed questions. Material over the per-minute token budget is refused before any AI call. Notes-only sessions go straight to writing. Plain pack view, labelled AI-generated. 58 tests with a stand-in; live run from the browser: 6.4 s, 15 of 15 items grounded. Quality and security review run; must-fix and all recommended items fixed; race, live write and 4a browser checks pass. Slide text is sent as text, so matching to files by position no longer matters.

Phase 5 (results screen) done on 2026-10-13: the study pack opens in tabs (Summary, Flashcards, Quiz). Flashcards turn over in 3D with click, tap or Space, and the arrow keys move between them; the quiz takes one locked answer per question, shows every explanation, and derives the score. A step tracker (Upload, Read, Check, Write, with a timer on slow steps) and a word meter read from `/api/limits` show progress and the limit before writing; Write is switched off when the material is over. Polling kept (decision below). Quality review run; must-fix (crash on a pack with no flashcards) and all recommended items fixed; five Playwright checks pass (study, focus, progress, edit, race), using a network stand-in for the writer.

Phase 5c (overview and coverage) done on 2026-10-13, at Rugimbana's request: the pack opens with 2 to 4 overview paragraphs (labelled as not checked against the material), every teaching point carries a checked quote, and Lucy lists the passages of the material that no item quotes, so the student can read what the summary may have missed. Quality review run; both must-fix and all recommended items fixed (coverage now over-reports rather than hides). 69 tests; six Playwright checks pass. Live runs: 4,727 tokens for a 436-word role-play, 6,084 near the limit.

## Next
1. Phase 6: credible further reading (PubMed/StatPearls, curated YouTube channels, Wikipedia, Radiopaedia search) from the pack's search terms. Links only from real APIs. Run `/security-review` (third-party APIs and keys).
2. Carry-overs to their phases:
   - Phase 4: the LLM goes through the same provider layer; the test stand-in pattern applies (no test calls the real provider).
   - Phase 5: replace the Generate receipt with real states; compare polling with streaming. Every keystroke in the review panel redraws the whole page (draft lives in `App`); measure on a long transcript and use `memo` if it feels slow.
   - Phase 7: a page reload loses notes, recording and corrections; decide on saving drafts or a leave-page warning. Pressing Generate again discards the shown pack before a new one exists; keep it once packs are saved.
   - Decide (Rugimbana): longer sessions. About 1,591 words (roughly 12 to 13 minutes of talk) fit in one pack on Groq's free tier. Options: chunk on Groq (slower, stays on Groq) or switch to a provider with higher limits such as Gemini (a `.env` change; free-tier data may be used for training, acceptable for role-play only).
   - Phase 10: the inline theme script in `index.html` needs a hash in the Content Security Policy; test the animated background on a low-end phone or laptop. Deploy installs from `requirements.txt` (runtime only). An early 413 during a large upload may show as "could not reach its server". The microphone needs https. Test recording on Safari or an iPhone, then decide on the MP4 brand check. Jobs live in one process's memory: run a single worker, or move jobs to shared storage; cap concurrent jobs; uvicorn access logs record job ids. Add a time limit for parsing hostile PDFs. `/api/packs` is open: add the access code, a per-address rate limit, and allow one write at a time (429 "Lucy is busy"), since two writes in a minute already exceed 8,000 tokens. Windows `--reload` sometimes fails to restart the server: restart by hand if the API looks out of date.
3. Revisit with Rugimbana: CORS (still pending); data down, events up (memory hook: "down go data and phone numbers, up go phone calls"); test stand-ins, controlled components and derived state (phase 4a explain-back answers were explained, not yet answered by Rugimbana); phase 8 will need its own history trimming (the model is stateless; the chat resends history).

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
- 2026-10-13: Text model `openai/gpt-oss-120b` on Groq (open weights, Apache 2.0, strict structured output; reasoning effort low, temperature 0.3). Free tier read from Groq's reply headers: 1,000 requests a day, 8,000 tokens a minute.
- 2026-10-13: Token budget from `LLM_TOKENS_PER_MINUTE` (3,500 tokens kept for the answer, 1,200 for instructions and form); too much material is refused with 413 before any AI call.
- 2026-10-13: Grounding: every flashcard and question carries a quote; Lucy checks it word for word after Unicode normalisation that keeps symbols and units; "..." pieces must be in order and close together. Items that fail are flagged, not removed.
- 2026-10-13: Options are shuffled on the server (seeded by the question) because models favour some answer positions.
- 2026-10-13: Polling kept for jobs (a pack takes about 6 seconds; works on any free host; a JSON answer is useless until complete and checked). Streaming considered for the phase 8 chat, where replies are free text. Rugimbana to say if he disagrees.
- 2026-10-13: Material limit measured in characters on both sides and shown as words at 6 characters a word, with 250 characters kept for the server's tags: about 1,883 words. Supersedes the 2,475 words recorded in phase 4b.
- 2026-10-13: Results UI: Radix Tabs kept mounted while hidden; empty tabs left out; `aria-disabled` rather than `disabled` where focus must stay.
- 2026-10-13: Overview paragraphs plus quoted teaching points; coverage check lists passages no item quotes. Over-reporting is the safe error. Answer reserve raised to 4,000 tokens after measuring; limit now about 1,591 words. Supersedes the 1,883 words recorded in phase 5.
- 2026-10-13: Phase 6 waits on two decisions from Rugimbana: the list of trusted YouTube channels, and creating a free YouTube Data API key. The other sources (PubMed, StatPearls, Wikipedia, Radiopaedia search) need no key.
