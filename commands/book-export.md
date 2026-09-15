---
description: Build an upload-ready publishing package — web-novel platform package (listing + tags + cover spec + scheduled chapter files) or book manuscript (front/back matter + KDP metadata)
argument-hint: <project-name> [--through=<chapter-id>] [--platform=<name>]
---

# book-export

`manuscript/` holds one file per chapter by design (see
`commands/book-write.md`'s finalize step). This is the one command that
assembles them into something you can actually publish. It reads
`manuscript/` and never writes to it.

What it produces depends on `project.json`'s `project_type` — a
serialized web novel and a finished book are different deliverables, not
the same file with different margins.

## Common to both: the listing/metadata document

This is the part that isn't chapters — the thing that introduces the work
before anyone reads a word of it. It is assembled from the project's own
records, not invented:

| Field | Source |
|---|---|
| Title | `project.json` / outline skeleton |
| Genre | `project.json` |
| Synopsis / blurb | Written from the outline skeleton's core conflict and opening hook — the story's actual promise, not a summary of events |
| Tags | Generated from genre, `story-bible/characters/` (archetypes readers filter on), and world/power-system elements |
| Character list | `story-bible/characters/` — protagonist first, then significant characters, with spoiler-free one-liners |
| Content warnings | From the story-bible and genre template; ask the author rather than guessing if the material is borderline |
| Cover | The spec from the platform profile, plus a pointer to `story-bible/cover-brief.md` if one exists (`/book-forge:book-cover`) |

**Spoiler discipline**: a public listing is read by people who haven't
read the book. Blurb, tags, and character lines must not spoil past
roughly the opening arc, no matter how central a later twist is to the
story. When in doubt, cut it.

## If `project_type` is `web-novel`

1. Load the platform profile for `project.json`'s `platform_convention`
   from `${CLAUDE_PLUGIN_ROOT}/templates/platforms/` (`royal-road`,
   `webnovel-qidian`, `scribble-hub`). `custom` or missing → generic
   package, and say which platform-specific requirements therefore
   weren't applied. `--platform=` overrides, for exporting the same work
   to a second platform.
2. **Honor the profile's hard constraints.** These differ meaningfully
   and getting them wrong costs a rejection and a re-submission wait:
   - Royal Road: cover 400×600 **or larger**; synopsis must contain **no
     Patreon/donation/shortened links** — scan the generated synopsis for
     URLs and strip them; fanfiction tag mandatory if `ip_status` is
     `fan-fiction`.
   - Webnovel/Qidian: cover **exactly 600×800, JPG, ≤5 MB** — state these
     exact numbers, not a range.
   - Scribble Hub: up to **25 tags** — generate a fuller set here rather
     than reusing a short Royal Road list; cover displays at 250×350,
     author it larger, must be **<3 MB**.
3. Select chapters: every `finalized` or `published` chapter, or up to
   `--through=` if given. **Mark which are already published** (per
   `published_through`) so the author doesn't re-upload them — the
   unpublished ones are the actual work queue.
4. Write chapter files as **plain text, not Markdown** — these editors
   don't render Markdown source, so `**bold**` would post literally.
5. Generate a posting schedule from the author's cadence. Ask for it if
   unknown (daily 1-2/day and weekly 5-8/week are the common patterns);
   don't assume. For Royal Road, **offset scheduled times off `:00` and
   `:30`** — those are the interface defaults, so posting then means
   competing with dozens of chapters hitting the front page in the same
   minute.

```
exports/<project>-<platform>-<date>/
├── 00-listing.md       # the metadata document above
├── schedule.md         # chapter -> proposed post datetime, published ones marked
└── chapters/
    ├── 0001-<slug>.txt
    └── ...
```

## If `project_type` is `complete-book`

1. **Front matter** — fiction uses a short set, not the full nonfiction
   sequence: title page, copyright page, dedication (if any). Skip
   half-title, foreword, and preface unless the author asks; most novels
   don't carry them.
2. **Manuscript body** — chapters in order, each opening on a chapter
   heading, with scene breaks marked consistently (a centered `***` or
   the author's chosen marker) rather than bare blank lines, which
   disappear in conversion.
3. **Back matter** — author's note, acknowledgements, about the author,
   also-by / newsletter call-to-action. Generate the structure; leave
   the author's personal content as clearly-marked placeholders rather
   than inventing biography.
4. **KDP metadata document** — separate file, since it's pasted into
   KDP's forms rather than into the book:
   - **Description**: up to 4,000 characters, basic HTML allowed. The
     **first ~140 characters are the hook** — that's what shows before
     "read more," so it carries the most weight. Draft it deliberately,
     not as the first sentences of a summary.
   - **Categories**: 3 browse categories per format.
   - **Keywords**: 7 fields, 50 characters each. They should describe
     things a reader would search that **aren't already in the title** —
     setting, character type, tone, theme. Not title words, not
     competitor names.

```
exports/<project>-manuscript-<date>/
├── manuscript.md       # front matter + chapters + back matter, assembled
└── kdp-metadata.md     # description, 3 categories, 7 keywords
```

**Boundary — no EPUB.** KDP ebooks need working NCX navigation embedded
in the EPUB. This command produces Markdown; converting to EPUB/DOCX with
correct navigation is a job for Calibre, Vellum, or Pandoc. Say so rather
than producing something that looks finished but won't ingest cleanly.

## Hard rules

- Never modify a `manuscript/` chapter file — read-only.
- Never silently include a non-finalized chapter. Report skips.
- Never invent author-personal content (bio, acknowledgements,
  dedication) — placeholders, clearly marked.
- Never let a spoiler past the opening arc into the public-facing blurb,
  tags, or character list.
- Create `exports/` if missing — it's derived output, deliberately not in
  the project template and not checked by `/book-forge:book-doctor`.

## Error handling

| Situation | Handling |
|---|---|
| `manuscript/` is empty | Say so; don't create an empty export |
| `--through=` names a chapter that doesn't exist | Export through the latest that does, and say so |
| `platform_convention` is set to a platform with no profile file | Generic export; name which platform-specific requirements were therefore not applied |
| A platform profile field is marked `[unverified]` | Pass that caveat through into the listing document — the author should know which requirements were confirmed and which weren't, rather than trusting all of them equally |
| Two chapter files share a numeric prefix | Stop and flag — don't guess which is authoritative |
