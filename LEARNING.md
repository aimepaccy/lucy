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
- **Going back with git (revert vs reset):** the design upgrade was undone with `git revert --no-edit ef045ee`, which adds a new commit that reverses that one commit and leaves history intact. `git reset` would erase the commit and, since it was already pushed, need a force push that rewrites the public history. On a shared, pushed branch, use revert. One genuine bug fix from the reverted commit (removing the leftover blur filter) was re-applied by hand afterwards.

## 2026-10-11 to 2026-10-12: Phase 2, back-end skeleton
- **Client and server, HTTP:** the browser (client) sends a request (method, path, headers, body); the server answers with a response (status code, headers, body).
- **REST:** design an API around resources (nouns like `/api/sessions`) acted on by HTTP methods (verbs: `GET` reads, `POST` sends something new). An **endpoint** is one method plus one path.
- **Status code families:** 2xx success, 4xx the request was wrong (client's side), 5xx the server failed (our side). Lucy uses 200, 400, 413 (too large), 415 (wrong file type), 422 (well-formed but unusable).
- **Multipart upload:** one request split into labelled parts (notes, then each file), separated by a boundary the browser chooses. That is why we never set `Content-Type` ourselves with `FormData`.
- **CORS and the same-origin policy:** a different port counts as a different origin. The browser reads the server's `Access-Control-Allow-Origin` reply before letting a page read the answer. Simple requests go straight through; JSON requests first send a preflight (`OPTIONS`).
- **Uvicorn, ASGI, FastAPI:** Uvicorn listens on the port, ASGI is the standard hand-over, FastAPI is where the routes live.
- **Middleware as an onion:** each request passes through layers before reaching the route. In FastAPI the layer added last is the outermost. CORS sits outside the size limit so even a 413 carries CORS headers.
- **Pydantic:** declare the shape and limits of data; FastAPI rejects anything else with a 422 before our code runs. Same tool will check the AI's JSON in phase 4.
- **Magic numbers (file signatures):** identify a file by its content (`%PDF-`, `PK` for zip), not its name. A .pptx is a zip; we read its table of contents for `ppt/presentation.xml` without unpacking it (no zip bombs, no zip slip).
- **Defence in depth:** browser checks for convenience, server checks for safety, and a size limit that counts bytes as they arrive because the client's declared size can lie.
- **Discriminated union (`SendState`):** each status carries its own data; TypeScript only lets you read `receipt` after checking the status is `'received'`.
- **Tests:** `pytest` with `TestClient` calls the app in-process. Tests caught a corrupted file in under a second during the build.
- Warm-up (effect cleanup, revisited from phase 1): right this time. Without cleanup the old interval keeps running, so pause does not pause and each resume adds another timer.
- Retype: `Limits` model and `GET /api/limits`. Worked first time. Style note: Python (PEP 8) puts two blank lines between top-level functions and classes; fixed in review.
- Explain-back answers:
  1. Renamed `virus.exe`: right idea (content is checked, not the name) and right family (4xx). Sharper: the browser check passes it (it only reads the name); the file does reach the server, lands in a temporary file, fails the signature check, is refused with **415**, and is deleted. "Rejected" is not "never uploaded".
  2. `curl` and CORS: **wrong.** CORS does not stop curl. CORS is a rule the browser enforces to protect its user from malicious websites reading other sites' answers with the user's browser. Tools outside a browser ignore it. The server must protect itself (our checks now, an access code in phase 10). **Revisit.**
  3. 415 vs 500: right. 415 means the request was wrong; 500 means our code failed on it (a bug for us to fix).
- Data down, events up: not sticking yet. Re-explained with the ward chart analogy (App holds the one chart; children get read-only copies and call App to change it). **Revisit** with the check question about a word count in the Header.
- AI-tool feature: **`/security-review`** skill. Found nothing exploitable; it compares committed changes against GitHub, so it had to be pointed at the staged changes. It skips denial-of-service and correctness on purpose, so it complements the Quality reviewer (which found a real 500 bug). Verdict: adopt for phases touching inputs, secrets or access (3, 6, 10).

## 2026-10-12: Phase 3a, recording
- **Microphone permission and secure context:** the browser asks the user, not the website, and only on https or localhost pages.
- **`await` and Promises:** a Promise is an IOU for an answer that comes later (for example, the user clicking Allow). `await` pauses that one function until the answer arrives; the rest of the page keeps running.
- **Callbacks:** functions handed to the browser to call when something happens (`ondataavailable`, `onstop`).
- **MediaRecorder and Blobs:** the browser's tape recorder delivers 1-second chunks; Stop glues them into one in-memory file (a Blob).
- **Container vs codec, bitrate:** envelope (WebM, MP4) vs the language inside (Opus, AAC). 32 kbps keeps speech clear: about 14 MB an hour (measured 18 KB for 5 seconds).
- **RMS level meter:** centre the samples on silence (128), square, average, square root. With the mean at zero, RMS is the standard deviation of the wave.
- **Custom hooks:** a `use...` function that bundles state and effects. The engine (`use-audio-recorder.ts`) is separate from the dashboard (`Recorder.tsx`).
- **State vs refs:** state is the whiteboard (changing it redraws the screen); a ref is a pocket notebook (kept, but no redraw). Live browser objects go in refs.
- **Object URLs:** a temporary address for an in-memory file, like a cloakroom ticket; revoke it in the cleanup.
- **Timestamps vs counting ticks:** counting timer ticks loses time around pauses and in background tabs; subtracting timestamps does not.
- **Race conditions:** two actions overlapping in an order nobody planned (upload during the permission prompt; double-clicking Stop). The fix: check the current state before acting.
- **Single source of truth, applied:** the Recorder no longer keeps its own "done" flag; the recording lives in `App` and comes down as a prop.
- Explain-back answers:
  1. Refs vs state: right (the timer must redraw every second; the stream only needs to be kept).
  2. Stop to chip: events up right, but described App as "throwing up a function". Correction: App handed `onChange` down at the start; Stop calls it (up); App updates its chart and passes the recording down to GenerateBar, which draws the chip. Memory hook: "down go data and phone numbers, up go phone calls." **Revisit.**
  3. Race condition: described as acting before permission. Correction: the problem was two actions overlapping (upload finishing while the microphone was starting). Named the term; fix is checking the current state before acting.
- No retype this phase (kept rare on purpose); the 3b polling loop is the next candidate.
- AI-tool feature: **hooks** (a standing order for Claude Code). After any back-end Python edit, the tests run automatically; silent on success, reported on failure. Proven to fire. Verdict: adopt. Review with `/hooks`.
- The Quality reviewer found two real microphone bugs (both race conditions) that the browser tests had missed; tests only check the paths you think of.

## 2026-10-12: Phase 3b, understanding
- **202 Accepted and background jobs:** the server answers at once with a job number ("received, still working") and does the slow work afterwards, like a lab specimen number.
- **Polling:** the browser asks "is it ready yet?" every 1.5 seconds. The alternative, being told when it is ready (streaming or push), comes in phase 5.
- **Threads and locks:** jobs run on several worker threads sharing one list of jobs; a lock makes them take turns, like nurses sharing one pen for one chart.
- **Provider layer and SDK:** one door to outside AI, using the `openai` library pointed at any OpenAI-compatible provider from `.env`. Transcription can use its own provider. `SecretStr` hides the key from logs.
- **Translating errors:** technical failures become plain words for the student; the technical cause is logged for the operator, never the student's content.
- **Text extraction:** pypdf and python-pptx, including tables, grouped shapes and speaker notes. Scanned PDFs have pictures of words, not text, so Lucy warns. Limits on pages and unpacked size because files come from strangers. python-pptx reads XML with entities switched off (no XXE).
- **Data minimisation:** keep the least for the shortest time. Files deleted when the job ends, leftovers swept at startup, results forgotten once collected. The privacy notice must match what the code does.
- **Test stand-ins (fakes, mocks):** a fake transcription function returns a fixed sentence, like a simulated patient in an OSCE. Real calls in tests are slow, unreliable, use the free quota and send data out; the first test run did reach Groq by mistake, which the hook's slow run exposed.
- **AI errors are real:** the first live transcript turned "nebulised" into "nebulasts" in a drug instruction.
- Explain-back answers:
  1. 202 vs 200: right.
  2. Copying uploads: half right. FastAPI deletes the uploads when the request ends, which is before the job even starts; the job needs its own copy to work on afterwards, and deletes that copy when it finishes.
  3. Test stand-ins: not answered (tired). Answer recorded above. **Revisit.** Raised instead a good product point: the student should be able to edit the transcript before the AI uses it (human in the loop). Adopted as the first item of phase 4.
- Retype: done by Claude at Rugimbana's request (tired): polling now tolerates up to two dropped checks in a row; tested by cutting the connection on purpose (2 dropped: continues; 3 dropped: clear message).
- AI-tool feature: the hook proved itself (caught the 200 to 202 change at once; its slow run exposed tests calling Groq). Review agents ran in parallel in the background.
- Process slip (Claude): two progress-file edits silently matched nothing (the phase 3a status line, then the first 3b close). Fixed; edits to these files are now checked after writing.

## 2026-10-13: Phase 4a, edit before writing
- **Human in the loop:** a person checks the AI's work before it is used (a senior signing off an intern's drug chart). The student corrects the transcript and slide text; the AI writes from the corrected version.
- **Controlled component:** the text box shows only what comes down as `value` and sends every keystroke up through `onChange`. Remove `onChange` and typing does nothing.
- **Lifting state up / data down, events up, in real code:** the draft lives in `App`; the panel gets a copy and phones changes up. `App` keeps Lucy's original reading unchanged next to it.
- **Derived state:** "corrected by you" is worked out by comparing draft and original each time (like BMI from height and weight), never stored, so it cannot go out of date and Undo needs no extra code.
- **Immutable update and reference equality:** `slides.map(...)` builds a new list with one slide replaced; React notices a change by "is this a different object?", not by reading every word. The same idea tells Lucy that the slides or recording changed after reading (`sendState.slides !== slides`).
- **State updates are applied later, not on the spot:** `setState` notes the change and React redraws afterwards. Moving focus straight after closing the panel failed because the Generate button was still disabled; `flushSync` redraws first. Rarely needed; the principle is fundamental.
- **Protecting the student's work:** confirm before losing corrections (close, read again), but only when there are corrections, so warnings keep their meaning.
- Retype: `setSlideText` (immutable update). Correct and compiled first time.
- Explain-back: Rugimbana asked for the answers to be explained instead (end of weekly AI quota). Answers given: (1) stand-ins make tests reliable, fast, free of quota and private; they cannot tell whether the real AI behaves (valid JSON, sensible content), so live checks by hand remain; (2) without `onChange`, typing does nothing because the box only shows what comes down; (3) a stored flag goes stale (type then delete a word), a comparison cannot. **Revisit all three**, plus the 3b stand-in question (now explained, not yet answered).
- The Quality reviewer again found real bugs that 16 browser checks missed: focus lost on close, and a dead end for notes-only sessions. Tests check the paths you think of; review finds the others. Browser check extended to 24 checks, all passing.

