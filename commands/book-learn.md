---
description: Push durable craft lessons from this project to the shared vault, so the next project (any genre) starts smarter
argument-hint: <project-name>
---

# book-learn

Run this periodically (after a volume, or when something notably worked or
didn't) — not after every single chapter, since most chapters don't produce
a durable, cross-project lesson.

## Process

1. Review recent chapters' QA history (`.project-memory/chapter-state/`) and
   any manual notes from the author about what worked or didn't.
2. **Classify every candidate lesson before writing anything** (per the
   vault's forgetting policy — see the design spec):
   - **Fact/skill** (durable, generalizes beyond this project): a technique
     that would help drafting in a different book, different genre — e.g.
     "chapter-opening hooks phrased as a question outperformed ones that
     open on scene description, across this project's reader-facing
     chapters." → eligible for the vault.
   - **Log** (a one-off observation specific to this project): "chapter 12's
     pacing felt slow" with no generalizable cause identified. → stays in
     this project's own `.project-memory`, never promoted to the vault.
3. **Check for contradictions before writing.** If a candidate fact/skill
   conflicts with an existing note in `vault/craft-lessons/`, do not merge
   or overwrite. Write both, cross-linked, with a `#needs-review` tag on
   each, and tell the author there's a conflict to resolve — the
   disagreement itself is signal, not noise to average away.
4. Write accepted fact/skill lessons as notes in `vault/craft-lessons/`,
   wikilinked to the genre and project that produced them.
5. Report what was promoted, what was classified as project-local and left
   alone, and any contradictions flagged.

## Hard rules

- Never promote a plot fact, character detail, or anything project-specific
  to the shared vault — only durable craft technique that would help a
  *different* book.
- Never auto-merge a contradiction with an existing vault note — surface it.
- Never run this automatically after every chapter — it's a periodic,
  deliberate step, not part of the `/book-write` pipeline.

## Error handling

| Situation | Handling |
|---|---|
| Nothing durable to promote this run | Say so plainly — an empty result is a valid, common outcome, not a failure |
| Vault has accumulated many notes and it's unclear if this duplicates one | Search `vault/craft-lessons/` first; if a near-duplicate exists, strengthen that note's evidence instead of creating a redundant one |
