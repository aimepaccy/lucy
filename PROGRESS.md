# Progress

Last updated: 2026-10-10

## Status
Phase 0 (setup) done. Groq key checked and valid; `backend/.env` complete.

Phase 1 (front-end shell) done on 2026-10-10: input page with notes (with clear and undo), a simulated recorder, a slide drop zone, a sticky Generate bar, light and dark themes, and subtle motion. Quality review run; all must-fix and recommended items fixed. Explain-back done (feedback in `LEARNING.md`).

## Next
1. Phase 2: back-end skeleton (FastAPI, an upload route, the front end talking to the back end). Starts with a preview of REST, HTTP, CORS and Pydantic.
2. Carry-overs to their phases:
   - Phase 3: add audio-file upload to the Recorder panel (v1 input in `docs/plan.md`); the microphone needs a secure context (HTTPS or localhost); turn the microphone off in effect cleanup.
   - Phase 5: replace the Generate notice and the "Preview" badge with real states.
   - Phase 10: the inline theme script in `index.html` needs a hash in the Content Security Policy; test the animated background on a low-end phone or laptop.
3. Revisit with Rugimbana: effect cleanup (explain-back question 2 was missed).

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
