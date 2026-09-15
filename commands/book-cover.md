---
description: Generate a cover art-direction brief for a project (text brief only — no image is generated)
argument-hint: <project-name>
---

# book-cover

Dispatch `cover-brief-agent` for `projects/$ARGUMENTS/`. Before dispatching,
confirm the project has at least an outline skeleton and a protagonist
story-bible note — if either is missing, tell the user what's missing and
point them to `/book-forge:book-new` rather than dispatching the agent on
thin material.

Once written, tell the user the brief is at
`projects/$ARGUMENTS/story-bible/cover-brief.md` and that it's an input for
an artist or an image-generation tool — this command does not produce a
rendered image, since no image-generation tool is available in this
environment.

## Error handling

| Situation | Handling |
|---|---|
| `$ARGUMENTS` is empty | Ask for a project name |
| Project doesn't exist | Say so, point to `/book-forge:book-new` |
| A cover brief already exists | Ask whether to regenerate (e.g. after major outline changes) or leave it — don't silently overwrite |
