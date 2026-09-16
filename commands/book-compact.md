---
description: Compress a closed volume into a summary and consolidate story-bible Facts Logs — what keeps a 500-1000 chapter project's context from growing without limit
argument-hint: <project-name> [volume-number]
---

# book-compact

Dispatches `continuity-archivist`. Run this when a volume closes, not on
a fixed chapter count.

## Process

1. Read `project.json` for `project_type` and `length_tier`. A
   `complete-book` project generally doesn't need this at all; a
   `short`-tier serial may not either. Say so rather than running a
   pointless compaction.
2. Determine which volume to compact: the argument if given, otherwise
   the most recent volume whose final chapter is `finalized`. **Never
   compact a volume still being written** — confirm the volume's last
   planned chapter exists and is finalized before proceeding.
3. Dispatch `continuity-archivist` for that volume.
4. Surface its report, leading with any unresolved contradictions it
   refused to touch — those need the author, and they block consolidation
   of the notes they appear in.
5. Append to `.project-memory/session-log.md`: which volume was
   compacted, and any contradictions surfaced (those are open questions
   in the session-log sense — they're exactly the kind of thing that gets
   forgotten across a multi-week gap).
6. **Prompt for `/book-forge:book-learn`.** A closed volume is the natural
   moment to promote durable craft lessons to `vault/craft-lessons/`, and
   nothing else in the pipeline ever asks. Left purely manual, the
   cross-project vault only grows when the author happens to remember it
   exists — which means the "each book starts smarter than the last"
   mechanism quietly never runs. Mention what's accumulated since the last
   promotion (Override Contract patterns, recurring reviewer findings) so
   the suggestion is concrete rather than a generic reminder. Don't run it
   automatically: deciding which lessons are durable rather than
   book-specific is an authorial judgement.

## Why this exists

Context cost per chapter should be flat whether you're on chapter 50 or
chapter 950. Without compaction it isn't: the story-bible's Facts Logs
grow append-only forever, and the raw manuscript grows past anything that
could be read. With it, older volumes are represented by summaries,
stable facts live in note descriptions instead of hundreds of log lines,
and the raw chapters stay on disk as the permanent record nothing needs
to bulk-read.

This is the mechanism that makes a 1000-chapter project possible at all.
It is not an optimization.

## Hard rules

- Never compact an open volume.
- Never let this command resolve a contradiction — `continuity-archivist`
  reports them and stops; the author decides.
- Nothing is ever deleted. If a compaction run would lose information,
  it's wrong.

## Error handling

| Situation | Handling |
|---|---|
| Volume structure isn't defined in `outline/` | Stop; point the author at the outline agent to define volume boundaries first |
| The named volume has unfinalized chapters | Refuse, and name which chapters are outstanding |
| Contradictions block consolidation on several notes | Report all of them at once rather than one per run — the author should see the full set before deciding |
