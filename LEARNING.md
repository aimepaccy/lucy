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

## 2026-10-10: Phase 1, front-end shell
- **Browsers run three languages:** HTML (structure), CSS (appearance), JavaScript (behaviour). React, TypeScript, Vite and Tailwind all exist to produce those three more easily.
- **Single-page application (SPA):** the page loads once; after that React redraws parts of it as state changes.
- **Component:** a function that returns part of the screen. The page is a tree of components (`App` contains `NotesEditor`, `Recorder` and so on).
- **Props and state:** props are inputs handed down by a parent (read-only); state is data a component remembers and changes, and changing it redraws the screen (`useState`).
- **One-way data flow (data down, events up):** shared state lives in the common parent (`App`), goes down as props, and changes come back up through functions passed as props (`onComplete={setRecording}`). Siblings never talk directly.
- **Controlled input:** the text box shows React's state and reports each keystroke; state is the single source of truth.
- **Derived values:** calculate what you can (word count, whether Generate is enabled) instead of storing a second copy that can drift (the BMI rule).
- **Side effects and cleanup (`useEffect`):** timers, storage and page changes happen outside drawing. The cleanup function stops them when they are no longer needed; without it they pile up (memory leak).
- **TypeScript union types:** `'idle' | 'recording' | 'paused' | 'done'` makes a typo a build error instead of a silent bug.
- **Design tokens:** colours defined once as named values; dark mode swaps the values, not the components. Same principle as `.env`: configuration vs code.
- **Dev server vs build:** `npm run dev` translates code on the fly for development; `npm run build` produces the plain files that get hosted. `localhost:5173` is "this computer, port 5173".
- **Accessibility:** labels for screen readers, keyboard focus that follows the user, status announcements (`role="status"`), and respecting "reduce motion".
- **Trust boundary again:** browser file checks are for convenience; the server must check again.
- Lessons from the build and the quality review:
  - **Supply chain:** the shadcn installer misread our import alias and installed an unrelated npm package (`cn`). Check what installers add to `package.json`.
  - **Filters break glass:** any CSS `filter` on a parent disables `backdrop-filter` blur inside it; the entrance animation now removes its filter when it ends.
  - **Hover is not touch:** a tap fires both hover and click, so the flashcard flipped and unflipped. Interactions must be designed for touch, mouse and keyboard.
  - **Stable function identity:** a function created inside a component is new on every render; when an effect or ref depends on it, wrap it in `useCallback` so it does not re-run.
  - **Undo beats confirm:** a one-click Clear got an "Undo clear" instead of an "Are you sure?" box.
- Retype: added the "Clear" button to the notes panel (conditional rendering, events up). Worked first time; two stray spaces in closing tags tidied in review.
- Explain-back answers:
  1. Recorder to GenerateBar: named one-way data flow correctly, but described the Recorder as "retrieving" info. Correction: it sends data up by calling `onComplete` (which is `App`'s `setRecording`); `App` re-renders and passes `recording` down as a prop.
  2. Missing cleanup: answered that pause would act like stop. Wrong way round: without cleanup nothing stops the old interval, so the timer keeps counting while paused and runs at double, then triple, speed after each resume. **Revisit.** (Strict Mode in development runs effects twice on purpose to expose this.)
  3. Hard-coded dark colours: answered "everything black and a white flash". Correction: the cost is maintenance and consistency; colours scattered across many files, so a palette change or a new theme means editing every component. Tokens change in one place (the formulary principle).
- AI-tool features: **Playwright** (scripted real-browser checks; caught four UI bugs before Rugimbana saw them; verdict: adopt, becomes end-to-end tests in phase 10). **Quality subagent** run in the background while feedback was written (parallel work).
