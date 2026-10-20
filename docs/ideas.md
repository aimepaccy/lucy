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

### Teach from credible sources (retrieval-augmented generation)
Lucy finds relevant passages in a trusted library (StatPearls, WHO and national guidelines) and gives them to the AI with the session, so the pack teaches around what was discussed instead of only reporting it. Context also helps resolve mishearings ("asinaa" next to "wheeze" and "salbutamol" is asthma).
- Two labelled voices: "From your session" (quoted and checked) and "From [source]" (cited). Never blend them; local guidance taught on the ward can differ from international sources, and the student should see the difference.
- Choosing the library is a clinical governance decision: open sources only (paid ones cannot be used), local before international.
- Retrieved passages cost tokens, which shortens the session that fits on the free tier.
- Corrections of misheard words stay visible ("heard as 'asinaa'").
- Phase 8's chat needs retrieval too; build the two together.

### Curriculum coverage
Compare what was discussed with a curriculum, week by week, and show the gaps.
- Start with the student: "this rotation you have covered 12 of 30 curriculum topics; not yet seen: ...". Private, no server needed, fits "organise by rotation".
- An institutional report is a different product: it needs content from many students on a server, consent from every teacher, ethics approval and role-based access. Reports must be opt-in, anonymised and topic-level, never about a named teacher.
- Selection bias: a report only sees what students chose to record, so a "gap" may mean nobody pressed record.

## Small technical fixes (found in learning sessions)
- Make the pack request strict (`extra='forbid'` on `PackRequest`), so a misspelled field fails loudly instead of silently dropping the transcript.
- Generate the front end's `types.ts` from the server's OpenAPI file, so the two cannot drift apart.
- Keep a finished job for a short grace period (or until the browser confirms it arrived), so a dropped connection does not lose the pack and show "server restarted" when it did not.
