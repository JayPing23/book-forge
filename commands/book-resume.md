---
description: Pick up a project after time away — reads the session log and current state, and tells you exactly where you left off and what's next
argument-hint: <project-name>
---

# book-resume

A long web novel takes weeks or months of real time across many separate
sessions. `.project-memory/chapter-state/<id>.json` makes a single
*chapter* resumable; this command makes the *project* resumable — what
was decided, what's unresolved, and what to do next, without re-reading
chapters to reconstruct it.

Run this first when returning to a project after any meaningful gap.

## The session log

Lives at `projects/<project-name>/.project-memory/session-log.md`,
append-only, newest entry at the bottom. Any command may append to it;
nothing ever rewrites or prunes it (it's the record of how the book was
actually made, and it stays cheap — text, a few lines per session).

Entry format:

```markdown
## Session — 2026-09-16

**Progress**: drafted and finalized chapters 0045-0052. Chapter 0049
escalated on continuity, resolved by correcting the story-bible (the
draft was right, the note was stale).

**Decisions**:
- The rival's betrayal moves from volume 4 to volume 3 — the setup was
  landing too early and the delay was costing tension.
- Locked the system-window convention: square brackets for system
  messages, curly braces for stat blocks.

**Open questions**:
- Does the mentor survive volume 3? Affects the chapter 0061 outline
  either way, so this needs deciding before the rolling window extends
  past 0060.

**Resume here**: next chapter is 0053. Rolling outline window runs
through 0060. Volume 3 compaction is due once 0060 finalizes.
```

Only `**Progress**` and `**Resume here**` are required. Omit
`**Decisions**` or `**Open questions**` when a session genuinely had
none — an empty heading is noise, and a fabricated decision is worse.

## Process

1. Read `project.json` — type, genre, depth dial, `length_tier`,
   `target_chapter_words`, `published_through`.
2. Read the session log's most recent 2-3 entries. Older entries are
   history; don't read the whole file on a long project.
3. Read `.project-memory/chapter-state/` for any chapter not
   `finalized` — an interrupted chapter is the single most important
   thing to surface, since it's resumable mid-pipeline and easy to
   forget.
4. Check the rolling outline window: how many chapters of scene-level
   detail remain past the last finalized chapter? Below ~5, the outline
   agent needs to extend it before drafting continues.
5. Check whether volume compaction is due (see
   `/book-forge:book-compact`).
6. Check `published_through` against the last finalized chapter to
   report the current buffer.

## Output

A short briefing, not a file dump:

- Where the project stands: last finalized chapter, total chapters,
  published-through and buffer size.
- Any chapter stuck mid-pipeline or escalated, and on what.
- Unresolved open questions carried from recent sessions — these are the
  things most likely to have been forgotten, so lead with them if any
  exist.
- What's due: outline window extension, volume compaction, market-pulse
  refresh if stale.
- The single concrete next action.

## Hard rules

- Never rewrite or prune the session log — append only.
- Never invent a decision or open question that isn't recorded. If the
  log is thin, say it's thin; reconstructing intent from chapter text is
  guessing, and a confident wrong summary of "what we decided" is worse
  than admitting the record is incomplete.
- Don't read the whole manuscript to build this briefing. The point is
  that the log and state files make that unnecessary.

## Error handling

| Situation | Handling |
|---|---|
| No session log exists yet (project predates it, or is brand new) | Say so, build the briefing from `project.json` + chapter-state + outline alone, and start the log with this session |
| Session log's newest entry is very old relative to the work since | Flag the gap — sessions happened without logging, so the record is incomplete and decisions may be missing |
| A chapter is mid-pipeline and its state file is corrupt/unreadable | Report it explicitly rather than treating the chapter as un-started — re-running a half-finished chapter silently can duplicate work or overwrite a draft |
