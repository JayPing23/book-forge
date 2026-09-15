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

**Close the loop**: once they have artwork from that brief, it can be
uploaded in the dashboard (`/book-forge:book-dashboard` → the project's
Overview → Cover), which stores it in `story-bible/images/` and puts it on
the library shelf. Mention this — the brief is a means to a cover, not the
deliverable, and the author shouldn't have to guess where the finished
image goes.

If the target platform is known, include its exact cover spec in the brief
so the artwork comes back the right size first time — the numbers differ
sharply and are not interchangeable (Royal Road 400×600 *or larger*;
Webnovel/Qidian *exactly* 600×800 JPG ≤5 MB; Scribble Hub displays at
250×350, author larger, under 3 MB; Amazon KDP 1600×2560 at 1.6:1, JPEG,
sRGB). See `templates/platforms/` for which of these were verified.

## Error handling

| Situation | Handling |
|---|---|
| `$ARGUMENTS` is empty | Ask for a project name |
| Project doesn't exist | Say so, point to `/book-forge:book-new` |
| A cover brief already exists | Ask whether to regenerate (e.g. after major outline changes) or leave it — don't silently overwrite |
