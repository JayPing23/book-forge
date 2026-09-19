---
description: Seed the style-exemplar library before you have chapters — from your own earlier writing, or as technique notes drawn from work you admire — so the first chapters draft toward a voice instead of toward generic craft advice
argument-hint: "[project name, optional]"
---

# book-style

The style-exemplar library is what lets later chapters draft *toward how this
author demonstrably writes* rather than toward generic craft advice.
`deconstruction-agent` fills it automatically — but only from chapters that
passed all seven reviewers on the first try, with no Override Contract and no
unresolved soft finding.

That bar is correct and deliberately strict. It also means the library is
**empty exactly when it would help most**: at chapter one, where a reader
decides whether to keep going, `context-agent` has nothing to pull and the
drafting brief falls back to generic guidance.

This command closes that gap. It seeds the library from material that already
exists — before a single chapter is written.

## Step 1: Establish the project

Resolve the project the same way `/book-forge:book` does. If none exists yet,
say so and stop: exemplars live in a project's `story-bible/`, so there has to
be a project to seed. Seeding right after `/book-forge:book-new` and before
the first draft is the intended moment.

Read `project.json` for `genre`, `depth_dial` and `project_type` — a seeded
exemplar that fights the project's register is worse than none.

## Step 2: Ask where the material comes from

This is the question that decides everything downstream, so ask it plainly and
do not guess:

**"Is this your own writing, or someone else's?"**

Those two paths are handled completely differently and must never be blended
in one note. If the author offers a mix, split it and process each separately.

## Step 3a: The author's own writing

The author owns it, so it can be banked exactly as `deconstruction-agent`
banks a captured passage — verbatim.

Ask for passages and, for each one, which scene type it best demonstrates:
`dialogue`, `action`, `description`, `transition`, `emotion`, `tension`, or
`comedy` — the same taxonomy `deconstruction-agent` uses, because
`context-agent` matches on it.

Do not accept a passage without a scene type. An unclassified exemplar can
never be retrieved, so banking one is the same as discarding it while
appearing to have done something.

Write each to `story-bible/style-exemplars/seeded-<scene-type>-<n>.md`:

```markdown
---
type: style-exemplar
scene_type: dialogue
source: author-seeded
origin: "{where it came from — an earlier book, a short story, a draft}"
tags: [style-exemplar, seeded]
---
> {the passage, verbatim}

**Why this works**: {one or two sentences on what this demonstrates about
this scene type specifically}
```

The `seeded-` filename prefix and the `source` field both matter — they are
what lets `context-agent` prefer the book's own captured exemplars once real
chapters start producing them.

## Step 3b: Someone else's writing

**Never store the passage.** Not in the note, not in the frontmatter, not as
a quote in the "why this works" line.

This is not caution for its own sake. `context-agent` carries exemplars
through into the writing brief **verbatim**, as a model to write toward. A
copyrighted passage placed there becomes an instruction to imitate a
specific author's specific text on every subsequent chapter — which is both
an infringement risk and, in a long serial, a reliable way to produce prose
that reads like a pastiche of one book.

Instead, read what the author points at and write a **technique note**: a
description of the mechanism, in your own words, with no reproduced text.

```markdown
---
type: style-technique
scene_type: action
source: reference-derived
origin: "{author / title, for the author's own reference}"
tags: [style-exemplar, seeded, technique]
---
**Technique**: {what the writing actually does — sentence length under
pressure, where the camera sits, what gets withheld, how a beat lands}

**How to apply it here**: {how it would work in *this* project's genre and
Depth Dial, in concrete terms}
```

If the author pastes a long copyrighted extract, do not refuse the task —
read it, extract the technique, and tell them plainly that the note records
the method rather than the text, and why. If they ask you to store the
passage anyway, decline that specific part and offer the technique note.

**A short quotation is acceptable only inside `**Technique**`, under about
fifteen words, when no paraphrase could convey the mechanism** — a
distinctive rhythm, say. Never a whole paragraph, never a scene.

## Step 4: Report what was banked

List each note written, its scene type, and which path it took. Then say
which of the seven scene types still have **no** exemplar — those are the
chapters that will still fall back to generic guidance, and the author may
want to seed them before drafting.

## Hard rules

- **Ask the ownership question before writing anything.** It is not
  procedural confirmation; it decides whether a file may contain text at all.
- **Never blend the two paths in one note.**
- **Never seed an exemplar without a scene type.**
- **Seeded exemplars never expire, but they do yield.** They are a starting
  voice, not a permanent one. Once the project's own chapters produce
  captured exemplars, those win — see `context-agent`.
- **Do not seed from this project's own drafted chapters.** That is
  `deconstruction-agent`'s job and it has a quality gate this command
  deliberately does not; routing around it would let an unreviewed chapter
  become a model for every later one.
- This command only ever writes to `story-bible/style-exemplars/`. Promotion
  to the shared vault remains `/book-forge:book-learn`'s decision.

## Error handling

| Situation | Handling |
|---|---|
| No project exists | Stop and say so; suggest `/book-forge:book` first. Exemplars have nowhere to live without one |
| Author offers a passage but no scene type, and won't pick | Read it and propose one, then confirm. Never file it unclassified |
| Passage is very short (a line or two) | Bank it, but say it is thin — a single line demonstrates phrasing, not scene handling, and `context-agent` pulls whole passages |
| Author's own writing is from a different genre entirely | Bank it and flag the mismatch. Voice can transfer across genre; register often doesn't, and they should know which they're seeding |
| Unclear whether the author wrote it | Treat it as someone else's and take path 3b. The technique note is useful either way, and the reverse mistake is not recoverable |
