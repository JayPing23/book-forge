---
description: Mark chapters as published to your platform — advances the publication frontier, after which those chapters are treated as immutable
argument-hint: <project-name> <chapter-id>
---

# book-publish

You upload to the platform yourself; this command tells book-forge what's
actually live, so the rest of the pipeline can reason about it.

Advancing the frontier has one significant consequence: **published
chapters become immutable.** Readers have already read them. A
contradiction discovered later can no longer be fixed by editing the
earlier chapter — it has to be fixed forward, in the chapter being
drafted, or explicitly accepted. Every reviewer reads
`published_through` for exactly this reason.

## Process

1. Read `project.json`'s current `published_through` (null if nothing is
   published yet).
2. Confirm the chapter being marked is `finalized` — refuse to mark an
   unfinished or escalated chapter as published, and say why. If the
   author genuinely did post a chapter that isn't finalized here, that's
   a state mismatch worth surfacing, not silently recording.
3. Confirm there's no gap: marking `0050` when `published_through` is
   `0047` implies 0048 and 0049 also went live. Ask rather than assume —
   a wrong frontier makes every later immutability decision wrong.
4. Set `published_through` to the new chapter id.
5. Update each newly-published chapter file's frontmatter `status` from
   `finalized` to `published`.
6. Append to `.project-memory/session-log.md` under the current session
   entry — publication is progress worth recording.
7. Report the new frontier and the current buffer (last finalized
   chapter minus `published_through`).

## Buffer

Buffer = chapters finalized but not yet published. Human serial authors
typically keep 4-16 chapters (10-15 before launch is common advice);
drafting at AI speed the buffer can be far larger, which is an advantage
— a deep buffer means a plot problem found at chapter 60 can still be
fixed at chapter 55 if 55 hasn't posted yet.

Report the buffer, but don't editorialize about it unless it's zero or
negative-by-implication (published_through ahead of finalized), which is
a real state error.

## Hard rules

- Never advance `published_through` without the author saying those
  chapters are actually live. This command records reality; it doesn't
  decide it.
- Never move `published_through` backwards silently. Un-publishing is
  possible in real life (a chapter pulled for revision), but it's
  unusual enough to require the author to confirm explicitly.
- Never edit chapter prose here. This command only changes publication
  metadata.

## Error handling

| Situation | Handling |
|---|---|
| Chapter isn't finalized | Refuse and explain; offer to run `/book-forge:book-write` for it instead |
| Marking a chapter earlier than the current frontier | Ask whether this is an un-publish (rare, needs confirmation) or a mistake |
| `published_through` would skip chapters | List the implied chapters and confirm before setting |
