# Platform profile — Webnovel.com (Qidian International)

Used by `/book-forge:book-export`. **[verified]** = from Webnovel's own
help/ask pages; **[unverified]** = not confirmed by research and the
author should check the current author portal before relying on it.

Sources: [How to submit a web novel](https://www.webnovel.com/ask/q332952734979108),
[Webnovel cover size](https://m.webnovel.com/ask/t341445940606103),
[How to upload a new chapter](https://www.webnovel.com/ask/q333353476537365).

## Listing fields

| Field | Requirement |
|---|---|
| Title | Required |
| Synopsis | Required. **[verified]** Reviewed for infringement and inappropriate content before the book goes live. |
| Cover | **[verified]** Must be **exactly 600×800 pixels**, **JPG**, and **no larger than 5 MB**. This is the strictest cover spec of the three platforms — unlike Royal Road's "400×600 or larger," an off-spec image here is rejected outright, so the cover brief should state these numbers exactly. |
| Target audience | **[verified]** Selectable by the author; affects content review. |
| Genres / tags | **[unverified]** — a tag taxonomy exists, but research did not confirm the count limit or the controlled vocabulary. Check the author portal; don't assume Royal Road's or Scribble Hub's limits transfer. |

## Submission review

**[verified]** Both the synopsis and the cover are reviewed for
infringement and inappropriate content. Chapters are additionally checked
for unsuitable content against the selected target audience before
publishing.

**[unverified]** Review turnaround time — not confirmed by research.

## Contracts and monetization

**[verified]** Webnovel approaches authors it considers professional
material and offers a contract; this is not something the author applies
for as part of ordinary submission.

**This matters more here than on the other two platforms.** A signed
platform contract typically carries exclusivity and rights terms. If the
author is considering one, that is a real legal decision about their IP,
not a publishing-workflow step — this profile deliberately does not
advise on contract terms, and `project.json`'s `monetization_allowed` /
`ip_status` fields should be revisited before signing anything.

## Chapter posting

**[verified]** Chapters are created with a title and body, and can be
saved as a draft or published.

**[unverified]** Native scheduled/timed release — not confirmed. If
scheduling isn't available in the author portal, the generated schedule
file is a manual checklist rather than something the platform executes.

## Export shape

```
exports/<project>-webnovel-<date>/
├── 00-listing.md          # title, synopsis, target audience, cover spec (600x800 JPG, <=5MB)
├── schedule.md            # chapter -> intended post date (manual unless scheduling is available)
└── chapters/
    ├── 0001-<slug>.txt
    └── ...
```
