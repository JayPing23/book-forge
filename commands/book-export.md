---
description: Assemble a project's finalized chapters into one manuscript file (for submission, or a web-novel "everything published so far" snapshot)
argument-hint: <project-name> [--through=<chapter-id>]
---

# book-export

`manuscript/` holds one file per chapter by design (see
`commands/book-write.md`'s finalize step) — this command is the one place
that concatenates them into a single document. It never writes back into
`manuscript/` itself; the assembled file is a derived export, not a source
of truth.

Takes a project name as the first argument and an optional
`--through=<chapter-id>` flag.

## Process

1. List every file in `projects/<project-name>/manuscript/`, sorted by
   the numeric chapter-id prefix (`0042-the-broken-oath.md` sorts as 42).
   If `--through=<chapter-id>` is passed, include only chapters up to and
   including that id; otherwise include every finalized chapter present.
2. Read each chapter file's frontmatter (`chapter_id`, `title`,
   `status`). Skip any file whose `status` isn't `finalized` and say
   which ones were skipped and why — never include a draft-in-progress in
   an export silently.
3. Create `projects/<project-name>/exports/` if it doesn't exist (it's
   derived output, so it's deliberately not in the project template and
   not checked by `/book-forge:book-doctor`).
4. Concatenate in chapter order into
   `exports/<project-name>-through-<chapter-id>-<YYYY-MM-DD>.md`: a
   single H1 with the book/volume title, then each chapter as an H2
   (`## Chapter <N>: <Title>`) followed by its prose, chapters separated
   by a horizontal rule. Strip each source file's own frontmatter block —
   the assembled export carries one combined header instead, not N
   repeated frontmatter blocks.
5. Report the export's path, chapter count, and total word count (count
   the prose only, excluding frontmatter and heading lines, so the number
   matches what the dashboard reports).

## Hard rules

- Never modify a `manuscript/` chapter file — read-only for this command.
- Never silently include a non-finalized chapter — report skips, don't
  hide them.
- This produces a single Markdown file, not a `.docx`/`.epub`/PDF —
  format conversion for a specific submission target is a separate,
  later concern, not something to improvise here.

## Error handling

| Situation | Handling |
|---|---|
| `manuscript/` is empty | Say so, don't create an empty export file |
| `--through=<chapter-id>` names a chapter that doesn't exist yet | Export through the latest chapter that does exist, and say so |
| Two chapter files share the same numeric prefix (shouldn't happen, but) | Stop and flag it — don't guess which one is authoritative |
