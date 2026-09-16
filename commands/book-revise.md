---
description: Revise an already-finalized chapter against your own note — re-enters the full QA pipeline with your feedback as a binding constraint
argument-hint: <project-name> <chapter-id> "<what's wrong with it>"
---

# book-revise

`/book-forge:book-write` refuses to re-run a finalized chapter, by design —
it protects settled work from being silently redrafted. But once you can
actually *read* chapters in the dashboard, you will read one and want it
changed. This is that path: your judgement re-enters the pipeline as a
first-class constraint rather than as a hand-edit the system never learns
about.

Your note is the point. Everything else here exists to make sure acting on
it doesn't quietly break something else in the book.

## Refuse when the chapter is published

Check `project.json`'s `published_through` **first**. If this chapter is at
or below the frontier, it is live and has been read — **stop and say so**.
Revising it would put the story-bible, the chapters that follow, and what
your readers actually saw permanently out of sync.

Offer the two real options instead:
- **Fix forward** — carry the correction into the next unpublished chapter.
- **Deliberately amend a live chapter** — possible, but it's a publishing
  decision with consequences beyond this pipeline (readers who already read
  it won't re-read it), so it needs an explicit "yes, amend the live
  chapter" from you, and the story-bible must be reconciled to whatever
  the published text now says.

Never treat an unpublished-but-finalized chapter as protected. That's the
ordinary case this command exists for.

## Process

1. Read the chapter's state file and the chapter text. Confirm it's
   `finalized` (not mid-pipeline — if it's unfinished, `/book-forge:book`
   resumes it instead).
2. **Take the author's note as binding.** It is not a suggestion to weigh
   against the outline — if the note conflicts with the planned beat, the
   note wins and the *outline* is what changes, logged through the outline
   agent's changelog. You read the chapter; the outline is a plan written
   before anyone had.
3. Re-run the grounding step (`context-agent`) so the revision drafts
   against current story-bible state, not the state as it was when the
   chapter was first written — facts may have moved since.
4. Revise, holding the note as an explicit constraint alongside the
   chapter's original planned beat.
5. **Re-run the full seven-reviewer QA gate.** Not a subset. A revision can
   break continuity with neighbouring chapters, drop a thread the original
   paid off, or shift a character's voice — the whole point of re-running
   everything is that you can't predict which.
6. Prose pass, then re-finalize to the same chapter file.
7. **Update provenance**: raise `human_revised_pct` to reflect that this
   revision was author-directed. This is the field that makes the
   AI-disclosure record honest, and a revision driven by your judgement is
   exactly what it's meant to capture.
8. Append to `.project-memory/session-log.md`: what you asked for and what
   changed. Weeks later this is the only record of *why* the chapter reads
   the way it does.

## Style exemplars

A revised chapter is **not** eligible for style-exemplar capture, and this
needs no special handling — it falls out of the entry bar in
`deconstruction-agent`'s Job 2, which requires a clean first pass. A chapter
that had to be argued into shape isn't a model of how you write at your
best, and shouldn't be taught back to later chapters as though it were.

## Hard rules

- Never revise a published chapter without the explicit confirmation
  described above.
- Never skip the re-run of the full QA gate to save time.
- Never silently change the outline to match the revision — if the beat
  changed, log it through the outline changelog, or chapter 40 will be
  checked against a plan that no longer describes chapter 12.
- Never discard the prior version: the versioned chapter chain in
  `.story-system/` keeps it, which is what makes this safe to run on a
  chapter you might decide you preferred before.

## Error handling

| Situation | Handling |
|---|---|
| Chapter is published | Refuse; offer fix-forward or explicit amend (see above) |
| Chapter isn't finalized yet | Point at `/book-forge:book`, which resumes an in-flight chapter from its current step |
| Note is vague ("make it better") | Ask what specifically isn't working — a binding constraint has to be concrete enough to revise against, and the QA gate can't check "better" |
| Revision escalates on a Hard Invariant | Report it exactly as `book-write` would; the original chapter stays finalized and untouched until the revision actually passes |
