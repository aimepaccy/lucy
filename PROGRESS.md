# Progress

Last updated: 2026-10-10

## Status
Phase 0 (setup) done: project files, plan (`docs/plan.md`), git repository, public GitHub repo `aimepaccy/lucy`.

## Next
1. Rugimbana: copy `backend/.env.example` to `backend/.env` and paste a Groq API key (from console.groq.com). Then the AI runs a check that the key works without printing it.
2. Phase 0 explain-back questions (see `LEARNING.md`, 2026-10-10).
3. Phase 1: front-end shell. Starts with a preview of React, Vite, Tailwind, shadcn/ui and Motion.

## Blockers
None.

## Decisions
- 2026-10-10: Name Lucy. GitHub repo `aimepaccy/lucy`; the local folder is still `notes-app` (rename it when VS Code is closed, then update the folder name in `_hub/projects.txt`).
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
- 2026-10-10: No license file yet (all rights reserved by default). Revisit before sharing widely.
