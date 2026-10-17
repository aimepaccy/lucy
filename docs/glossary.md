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

## 3. Across the wire

- **Path**: the part of an address after the server, such as `/api/limits`. Matched exactly, letter by letter.
- **Status code** (fundamental): the three-digit stamp on every response. 2xx it worked; 4xx the request was wrong (the ward's fault); 5xx the server broke (the lab's fault). It describes this one request, not the history of the job.
- **200 OK**: here is your answer now.
- **202 Accepted**: received, the answer comes later; here is your job ID. Used by `POST /api/sessions` and `POST /api/packs`.
- **404 Not Found**: no such thing here: a wrong address, or a job the server no longer knows.
- **422 Unprocessable Content**: the form is filled in wrong (too many slide files, notes too long).
- **No answer at all**: the server could not be reached (down, restarting, Wi-Fi drop). There is no status code because no response came back. In `api.ts` this is `status === null`.
- **GET vs POST** (fundamental): GET asks for something and changes nothing; POST sends something to the server. Details in session 3.
- **Polling**: asking "is it ready yet?" on a timer; Lucy asks every 1.5 seconds. `waitForJob` in `api.ts`

## 4. The server

## 5. The AI layer

## 6. Storage and data ownership

## 7. Testing and security

- **Never trust the client** (fundamental): checks in the page are a courtesy (quick feedback); checks on the server are the safety, because anyone can send requests without the page. Both exist for the slide limit: `SlideDropZone.tsx` and `routes.py`.
