# Platform profile — Royal Road

Used by `/book-forge:book-export` to produce an upload-ready publishing
package. Everything marked **[verified]** came from Royal Road's own
knowledge base or support pages; **[community]** came from author forum
reports; **[unverified]** means this profile is guessing and the author
should check before relying on it.

Sources: [Royal Road Knowledge Base](https://www.royalroad.com/support/knowledgebase/84),
[Royal Road FAQ](https://www.royalroad.com/support/faq).

## Listing fields

| Field | Requirement |
|---|---|
| Title | Required |
| Description / synopsis | Required. **[verified]** Must NOT contain donation links, Patreon links, or shortened links to other sites (Discord etc.) — this is an explicit rejection reason, not a style note. |
| Genres + tags | Required. **[verified]** If the work is fanfiction, the fanfiction tag is mandatory — a submission judged to be fanfiction without it is rejected. |
| Cover | Optional. **[verified]** 400×600 pixels or larger. |
| First chapter or prologue | **[verified]** Required at submission — the fiction cannot be submitted on metadata alone. |

## Submission review

**[verified]** All new submissions are manually checked before going
live, typically 12-24 hours (**[community]** some authors report up to
48). Checked for: plagiarism, links in the synopsis, fanfiction tagging,
sexual content, political or religious content, and disturbing content.

Practical consequence for export: the synopsis this package generates is
scanned for URLs before it's written. A synopsis with a link in it will
cost the author a rejection and another day of waiting.

## Chapter posting

**[verified]** Each chapter can be published immediately, saved as a
draft, or scheduled to auto-post at a chosen time.

**[community]** Do not schedule on the hour or the half hour (`:00` /
`:30`) — those are the interface defaults, so a chapter posting then
competes with dozens of others hitting the front page in the same minute.
When this profile generates a posting schedule, it offsets to
off-default minutes.

## Per-chapter fields

| Field | Notes |
|---|---|
| Chapter title | Required |
| Chapter body | Required |
| Author's note | Optional; separate field from the body — keep it out of the prose |
| Scheduled time | Optional; see the `:00`/`:30` note above |

## Export shape

```
exports/<project>-royalroad-<date>/
├── 00-listing.md          # title, synopsis, tags, cover spec, content warnings
├── schedule.md            # chapter -> proposed post datetime
└── chapters/
    ├── 0001-<slug>.txt    # chapter title + body only, ready to paste
    └── ...
```

Chapter files are plain text rather than Markdown: Royal Road's editor
does not consume Markdown source, so `**bold**` would post literally.
Apply formatting in the editor after pasting, or keep the prose free of
markup — which the `light-novel-style` skill already favors.
