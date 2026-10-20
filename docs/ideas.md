# Ideas for Lucy (long term)

A backlog of ideas for after the MVP. Add, change or delete freely. An idea here is not a promise: each one gets a privacy check and a cost check before it is planned into a phase.

Already scheduled, so not repeated here: automatic packs from recordings (before learning session 6, see `PROGRESS.md`) and phase 8, "Ask about my session".

## Features

### Student accounts
Each student signs in and finds their packs on any device.
- Changes a founding decision: study content would be stored on a server, not only in the browser. Needs a privacy design (what is stored, where, for how long, who can see it, how to delete it) before any code.
- Brings in authentication (who you are) and authorisation (what you may see), password resets and account deletion.
- A free hosted option such as Supabase (used in an earlier project) would cover sign-in and a database.

### Organise packs by topic, day, week and rotation
Packs grouped and filtered by date, week, rotation (medicine, surgery, paediatrics...) and topic, with a clear, calm layout.
- Can be built in the browser with what exists now (IndexedDB indexes); no accounts needed.
- The AI could suggest topic tags when it writes a pack; the student confirms or changes them.

### Weekly reminders
A weekly nudge: "You have 12 flashcards due" or "Review this week's rounds".
- Email needs an address, so it follows accounts. Web push notifications work without accounts but need extra browser setup and are limited on iPhones.
- Could follow spaced repetition (cards come back just before they would be forgotten), which has good evidence behind it.

### Simulation debriefs
Record a simulation session (audio, perhaps later video) and get a structured debrief: what went well, what was missed, what to improve, measured against the protocols and frameworks Lucy is given (for example a resuscitation algorithm, a handover format such as ISBAR, or a debriefing model).
- Fits the "no patient data" rule well: simulations use manikins and actors.
- Needs consent from everyone recorded, and approval from the simulation centre.
- Every point should point to evidence (a timestamp and a quote) and to the protocol step it relates to, so facilitators can check it.
- Lucy supports the facilitator's debrief; it does not grade students.
- Video needs a model that can watch video and is much heavier to process; start with audio.

## Small technical fixes (found in learning sessions)
- Make the pack request strict (`extra='forbid'` on `PackRequest`), so a misspelled field fails loudly instead of silently dropping the transcript.
- Generate the front end's `types.ts` from the server's OpenAPI file, so the two cannot drift apart.
- Keep a finished job for a short grace period (or until the browser confirms it arrived), so a dropped connection does not lose the pack and show "server restarted" when it did not.
