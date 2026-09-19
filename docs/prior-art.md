# Prior art — what other AI novel-writing projects do, and what we took

A survey of comparable open-source projects, recorded so that future design
decisions can cite evidence rather than re-litigate from scratch.

**Provenance note.** Several of these are **AGPL-3.0**, which is one-way
compatible with this project's GPL v3: GPL code may flow *into* an AGPL
project, never out. Nothing in book-forge is copied from them. Architectural
ideas are not copyrightable, and what follows is a record of ideas, not code.

| Project | Licence | Borrowable? |
|---|---|---|
| [webnovel-writer](https://github.com/lingfengQAQ/webnovel-writer) | GPL v3 | Yes — book-forge is a fork of it |
| [MuMuAINovel](https://github.com/xiamuceer-j/MuMuAINovel) | GPL v3 | Yes |
| [chinese-novelist-skill](https://github.com/PenglongHuang/chinese-novelist-skill) | MIT | Yes, with attribution |
| [inkos](https://github.com/Narcooo/inkos) | AGPL-3.0 | **No** — ideas only |
| [AI_NovelGenerator](https://github.com/YILING0013/AI_NovelGenerator) | AGPL-3.0 | **No** — ideas only |
| [AI-Novel-Writing-Assistant](https://github.com/ExplosiveCoderflome/AI-Novel-Writing-Assistant) | AGPL-3.0 + commercial | **No** — ideas only |
| [Long-Novel-GPT](https://github.com/MaoXiaoYuZ/Long-Novel-GPT) | unstated in README | **No** — unlicensed means all rights reserved |

---

## What we took

### Exemplar seeding — from AI-Novel-Writing-Assistant

Its "Writing Style Engine" extracts techniques from existing text and binds
them as reusable assets that participate in generation, detection *and*
correction. The idea we took is narrower: our exemplar library only banks
passages from chapters that passed all seven reviewers first try, which is
the right bar and also means it is **empty at chapter one** — exactly where a
reader decides whether to continue.

`/book-forge:book-style` seeds it from material that already exists. We added
a constraint their design does not have: the split on ownership. Our
`context-agent` carries exemplars into the drafting brief *verbatim*, so a
copyrighted passage placed there becomes a standing instruction to imitate
one specific text on every later chapter. The author's own writing banks as
text; anyone else's becomes a technique description.

### Word-level vocabulary metrics — from inkos

Its anti-AI-detection layer includes vocabulary management. Our `craft.py`
matched only 4- and 5-word n-grams, so a manuscript could say *suddenly* two
hundred times in two hundred different sentences and pass completely. Added:
filter-word rate, adverb rate, over-used content words, and vocabulary
variety as a moving-average type-token ratio.

### Show-don't-tell as a blocking check — corroborated, not sourced

`chinese-novelist-skill` (MIT) makes "用动作和对话表现" — show through action
and dialogue — the first of its four core laws. GATE-002 already existed by
the time we read it, driven by a novelist's teardown of an AI-generated
novel. Worth recording that an independent project reached the same
conclusion about the same failure.

---

## What we deliberately did not take

### RAG / vector retrieval for continuity

`AI_NovelGenerator` and `AI-Novel-Writing-Assistant` both keep a vector store
and retrieve semantically similar prior passages before generating.

We use a story bible with a status-lifecycle Facts Log plus volume
compaction instead, for three reasons. It needs no embedding model or vector
database, so the whole system stays dependency-free. Retrieved *passages*
answer "what did the text say" where a Facts Log answers "what is true now" —
and a contradicted fact retrieved as a similar passage is actively
misleading. And a human can read and correct a Facts Log; nobody can audit an
embedding.

The honest cost: semantic retrieval would catch a callback to something the
bible never recorded. Volume compaction is the mitigation, and it is not a
complete one.

### Hierarchical expansion drafting

`Long-Novel-GPT` generates 50 chapters at ~200 words, expands each to 1,000,
then polishes to 2,000 — how it reaches million-word novels.

We plan hierarchically (skeleton → volume → chapter) but draft each chapter
at full length in one pass. Expansion drafting optimises for *volume*, and
the failure mode a professional reader described in an AI novel was precisely
padding: a story that "could have been run through in less than 10k words" at
five times that length. A pipeline whose core loop is "make this longer"
seems likely to produce that.

### A 37-dimension continuity audit

`inkos` audits continuity across 37 named dimensions. We have seven
reviewers. More dimensions are not obviously better: each is a dispatch or a
prompt section, every chapter, forever. Our seven were consolidated
deliberately, and two of them (GATE-001, GATE-002) exist because of evidence
about what makes readers *stop*, not because of what is easy to enumerate.

Worth revisiting if real use shows gaps — that would be evidence, which is
the bar everything else here had to meet.

### Multi-provider model routing

`inkos` routes different agents to different vendors (Moonshot/Kimi,
DeepSeek, Gemini). Not possible here: Claude Code's `model:` frontmatter
selects a Claude tier, and a plugin cannot reach an external API.

Not a real loss. Per-agent *tiering* does the work that matters, and mixing
vendors would fragment voice across one book. The one place it would help —
Chinese web-novel idiom — is not what this project writes.

---

## Not relevant despite the names

- **QuickNovel** — Android app for *reading* and downloading novels.
- **NovelAI-tag-generator** — prompt tags for *image* generation. Its licence
  also forbids commercial derivatives, so it could not be used regardless.
- **koishijs/novelai-bot** — *image* generation chat bot.
- **BookForge-Studio** — audiobook text-to-speech. Note the **name
  collision** with this project.

The "NovelAI" in three of those refers to the image-generation service, not
to novel writing.
