# Platform profile — Scribble Hub

Used by `/book-forge:book-export`. **[verified]** = from Scribble Hub's
own posting guide; **[community]** = author forum consensus;
**[unverified]** = not confirmed by research.

Sources: [Writing Guide Part I: How To Publish Your Own Story](https://forum.scribblehub.com/threads/writing-guide-part-i-how-to-publish-your-own-story.1014/),
[Cover size discussion](https://forum.scribblehub.com/threads/is-there-a-better-size-for-cover-art-than-the-recommended-250x350-or-is-there-some-tips-you-guys-could-share-on-having-a-sharper-one-atleast.5608/).

## Listing fields

| Field | Requirement |
|---|---|
| Title | Required |
| Description | Required |
| Genres | Required |
| Tags | **[verified]** Up to **25 tags** — substantially more than the other two platforms allow, so the export should generate a fuller tag set here rather than reusing a short Royal Road list. **[verified]** Tags and genre can be changed after publishing, so an imperfect initial set is low-risk. |
| Cover | **[verified]** Displayed at **250×350**. **[community]** Author the source art much larger — at least 1250×1750 at 300 DPI — and let the platform downscale, since uploading at display size looks soft. **[verified]** Must be under **3 MB**. |
| Content warnings | **[unverified]** — Scribble Hub hosts mature content and has a tagging/warning system, but research did not confirm which warnings are mandatory. Check the posting form. |

## Submission review

**[verified]** Each cover is manually approved before it is publicly
visible. **[unverified]** Whether story text itself is pre-moderated.

## Chapter posting

**[unverified]** Scheduling behavior was not confirmed by research. Treat
the generated schedule as a manual checklist until verified.

## Export shape

```
exports/<project>-scribblehub-<date>/
├── 00-listing.md          # title, description, genres, up to 25 tags, cover spec (250x350 display, <3MB)
├── schedule.md
└── chapters/
    ├── 0001-<slug>.txt
    └── ...
```

## Tag generation note

Because this platform allows 25 tags where Royal Road allows a much
smaller set, don't just copy the Royal Road tag list across. Generate a
fuller set from the project's genre, `story-bible/characters` (character
archetypes readers filter on), and world/power-system elements — then let
the author cut. Over-tagging is cheap to fix here; the tags are editable
after publication.
