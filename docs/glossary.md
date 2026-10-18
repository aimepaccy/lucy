# Glossary

Terms from Lucy, in plain words, with where they show up in the code. Built session by session during the learning sessions; read it before a demo or a conversation with an engineer.

Each entry: the term, a one-line plain meaning, an everyday or clinical analogy where it helps, and the file in Lucy where it can be seen. Marked **(fundamental)** when worth mastering, otherwise a detail to look up.

## 1. The whole map

The anchor analogy for every session: the browser is the ward, Lucy's server is the lab in another building, Groq is the reference lab the lab sends work out to.

- **Client** (fundamental): the program that asks. In Lucy, the page in the browser. The ward sending a request form. A role, not a machine: both can run on one laptop. `frontend/`
- **Server** (fundamental): the program that waits for requests and answers them. In Lucy, the FastAPI program. The lab. `backend/app/main.py`
- **Front end / back end** (fundamental): the part the user sees and touches (front) and the part that works behind the scenes (back). Usually the same as client and server.
- **Request** (fundamental): one message from client to server asking for something. The request form. `frontend/src/lib/api.ts` (`request`)
- **Response** (fundamental): the server's answer to one request: a status code, some headers, a body. The result slip.
- **API** (Application Programming Interface) (fundamental): the list of requests a server accepts and how to make each one. The lab's test menu. `backend/app/routes.py`
- **Endpoint** (fundamental): one entry on that menu, such as `GET /api/limits`. One test the lab offers. `@router.get('/limits')` in `routes.py`
- **JSON** (fundamental): text with labelled values, `{"max_slide_files": 5}`. The standard result format both sides read, so Python (server) and TypeScript (page) can talk. Every response in Lucy is JSON, errors included.
- **localhost**: "this same computer". Lucy's page runs at `localhost:5173`, its server at `localhost:8000`.
- **Port**: a numbered door on a computer; each program listens at its own. `API_URL` in `api.ts`
- **Job, job ID** (fundamental): work the server does in the background after it has answered; the ID is the lab number used to ask about it later. `backend/app/jobs.py`
- **Single source of truth** (fundamental): each fact lives in one place and everything else asks that place. The word meter asks the server for the word limit (`frontend/src/hooks/use-limits.ts`); the slide box keeps its own copy of "5 files" (`SlideDropZone.tsx`), which can drift from the server's.

## 2. The browser side

- **React** (fundamental): a library for building pages out of components. You describe what the page should look like for the current state; React does the redrawing. An observation chart that reprints itself from the latest values.
- **Declarative vs imperative** (fundamental): "here is what it should look like" vs "do this, then this". React is declarative; the old way of changing pages box by box is imperative.
- **Component** (fundamental): a reusable piece of the page that knows how to draw itself. A form template, filled in differently each time it is used. One per file in `frontend/src/components/`; `App` holds them all.
- **JSX**: the HTML-looking code inside TypeScript. `<Header theme={theme} />` means "draw a Header, with its `theme` slot filled in".
- **Props** (fundamental): what a parent hands a child: information and phone numbers (functions to call). The child reads them but cannot change them. `theme` and `onChange` in `ThemeToggle.tsx`
- **State** (fundamental): a component's own memory, which changes over time; changing it makes React redraw what depends on it. `theme` and `notes` in `App.tsx`, `cleared` in `NotesEditor.tsx`
- **Redraw (re-render)**: React drawing a component again after its state or props change.
- **Data down, events up** (fundamental): state flows down as props; children report what happened by calling the function they were given. "Down go data and phone numbers, up go phone calls." The theme button: `App` → `Header` → `ThemeToggle`, and the click back up.
- **Event, event handler**: something that happened (a click, a keystroke) and the function that runs when it does (`onClick`, `onChange`).
- **Lifting state up** (fundamental): keep state in the nearest common parent of every component that needs it, and no higher. `notes` lives in `App` because the editor, the word meter, the draft saver and Generate all need it; the Undo clear text stays in `NotesEditor`.
- **Controlled component** (fundamental): an input box that shows exactly what state says and reports every change up. A secretary typing only what the doctor dictates. The notes `Textarea` in `NotesEditor.tsx`. A broken `onChange` gives a box you cannot type in.
- **Derived state** (fundamental): anything that can be calculated from state is calculated on every redraw, never stored. BMI from weight and height. `countWords(value)` in `NotesEditor.tsx`, `busy` in `App.tsx`
- **Hook**: a function whose name starts with `use` that gives a component a power such as memory (`useState`) or a side job (`useEffect`); Lucy's own hooks are in `frontend/src/hooks/`. Details in a later session.
- **Premature optimisation**: making code faster before measuring whether it is slow. Usually costs clarity for nothing.
- **StrictMode**: in development only, React runs each component's start-up work twice to expose hidden bugs; that is why `limits` appears twice in the Network tab. `frontend/src/main.tsx`

## 3. Across the wire

- **Path**: the part of an address after the server, such as `/api/limits`. Matched exactly, letter by letter.
- **Status code** (fundamental): the three-digit stamp on every response. 2xx it worked; 4xx the request was wrong (the ward's fault); 5xx the server broke (the lab's fault). It describes this one request, not the history of the job.
- **200 OK**: here is your answer now.
- **202 Accepted**: received, the answer comes later; here is your job ID. Used by `POST /api/sessions` and `POST /api/packs`.
- **404 Not Found**: no such thing here: a wrong address, or a job the server no longer knows.
- **422 Unprocessable Content**: the form is filled in wrong (too many slide files, notes too long).
- **No answer at all**: the server could not be reached (down, restarting, Wi-Fi drop). There is no status code because no response came back. In `api.ts` this is `status === null`.
- **GET vs POST** (fundamental): GET asks for something and changes nothing, so it is safe to repeat (polling sends the same GET again and again); POST sends something for the server to act on, and sending it twice can do the work twice.
- **PUT, PATCH, DELETE**: replace, update or remove something that exists. Lucy uses none of them.
- **Polling**: asking "is it ready yet?" on a timer; Lucy asks every 1.5 seconds, so a 6-second pack shows about 4 checks. `waitForJob` in `api.ts`
- **HTTP** (fundamental): the agreed format for messages between client and server. A protocol: agreed rules for a conversation, like SBAR for handovers.
- **Request line**: the first line of a request: method, path, protocol version (`GET /api/limits HTTP/1.1`).
- **Headers** (fundamental): labels on the outside of the envelope: what is inside, what formats are accepted, who sent it.
- **Body**: the letter inside the envelope. A GET has none.
- **Content-Type** (fundamental): the header saying what the body is, such as `application/json` or `multipart/form-data`.
- **REST** (fundamental): a style of API with nouns in the paths (`/api/packs`, `/api/jobs/{id}`), verbs as methods, and JSON in the bodies. A convention, not a law.
- **405 Method Not Allowed**: right address, wrong verb (`GET /api/packs`).
- **413 Content Too Large**: too big. Lucy uses it when the material is over the word budget.
- **422, two kinds**: Lucy's own rule written by hand ("nothing to write a study pack from"), or the automatic shape check before Lucy's code runs (`{"notes": 5}`, or a job ID that is not 32 hex characters).
- **429 Too Many Requests**: slow down. A 4xx that heals with time: the request was fine, just too soon. Groq sends it to Lucy when the per-minute limit is reached.
- **500 / 503**: the server's code broke / the server is overloaded or down for now. Retrying later may work.
- **4xx vs 5xx in practice** (fundamental): 4xx, change the request (except 429: wait); 5xx, retry later.
- **Exponential backoff**: retrying after waiting longer each time (1 s, 2 s, 4 s), so a jammed service is not jammed further. The `openai` library does it for Lucy (`max_retries=2` in `providers.py`), then Lucy tells the student to try again in a minute.
- **Regular expression (regex)**: a pattern for text, such as `^[0-9a-f]{32}$` (exactly 32 characters from 0-9 and a-f). Look up when needed.
- **Binary vs text**: a recording or PDF is raw bytes, not letters, so it cannot go into JSON as it is.
- **Base64**: a way to write bytes as text; makes them about a third bigger.
- **Multipart (`multipart/form-data`)** (fundamental): one request with separate labelled compartments, so text and files travel together. A sample bag with sealed pockets. Stage 1 (`sendSession` in `api.ts`).
- **Boundary**: the unique marker separating the compartments. The browser chooses it and writes the `Content-Type` header itself.
- **URL encoding**: how special characters are written in an address; a space becomes `%20`.
- **Developer tools, Network tab** (fundamental as a habit): F12 in the browser; lists every request with its method, status, headers, payload and response. The first place to look when a page misbehaves. The **Initiator** column shows what made each request.
- **Origin** (fundamental): scheme + host + port. `http://localhost:5173` and `http://localhost:8000` are different origins.
- **Same-origin policy** (fundamental): the browser's rule that a page may not read answers from another origin unless that origin allows it. Stops a dodgy site from reading your bank through your logged-in browser.
- **CORS (Cross-Origin Resource Sharing)** (fundamental): how a server names the origins allowed to read its answers. Enforced by the browser, not the server: `curl` and scripts ignore it, so it is not a lock on the API. The sign "results to Ward 5173 only", obeyed by honest porters. `CORSMiddleware` in `backend/app/main.py`
- **Preflight (OPTIONS)**: the browser phoning ahead before a non-simple request (`POST /api/packs` with `Content-Type: application/json`). Simple requests (GETs, form-style POSTs such as multipart) go straight out.
- **Access-Control-Max-Age**: how long the browser may remember a preflight answer; Lucy says 600 seconds, so a second pack within 10 minutes shows no OPTIONS row.
- **Proxy**: a go-between that forwards requests. A development proxy would have hidden CORS; Lucy calls the server directly so CORS is met on purpose.

## 4. The server

## 5. The AI layer

## 6. Storage and data ownership

## 7. Testing and security

- **Never trust the client** (fundamental): checks in the page are a courtesy (quick feedback); checks on the server are the safety, because anyone can send requests without the page. Both exist for the slide limit: `SlideDropZone.tsx` and `routes.py`.
- **Browser extensions**: run inside every page and can send requests of their own (a Google Fonts request appeared in Lucy's Network tab that Lucy's code never makes). We control Lucy's code, not the visitor's browser.
