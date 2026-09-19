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

### Hook taxonomy — from chinese-novelist-skill (MIT)

Its `hook-techniques.md` catalogues thirteen chapter-ending techniques and
seven chapter-opening ones. Our `payoff-craft` had five hook *mechanisms*
(crisis, mystery, desire, emotion, choice) and almost nothing on openings.

Taken: six closing *techniques* that cut across the mechanisms — unfinished
action, ticking clock, subtext, image, echo, withholding — and the seven
opening moves, restated in our terms and credited in `NOTICE`. The openings
matter more than they look: `craft.py` already *measured* opening monotony
(our own test manuscript opened four consecutive chapters with "The") while
nothing taught opening variety.

The larger win was second-order. Naming the taxonomy made hook repetition
**mechanically trackable**, and `thread-ledger-reviewer` was already
classifying every chapter's ending to check HARD-002 and discarding the
answer. Recording it closed part of the long-orphaned "pattern fatigue"
soft-guidance item at no per-chapter cost.

### The specificity test — from inkos's de-slop rubric

`inkos-story-deslop/references/semantic-cleanup.md` asks seven diagnostic
questions of suspect prose. Most map onto checks we already had. One did not:
**"could the sentence fit any character or story unchanged?"**

That is sharper than anything we were asking. `voice-consistency-reviewer`
tests a line against its speaker's recorded profile — a line can pass that
perfectly and still be a line anyone could have said in any book. The
specificity test needs no record at all; it asks whether the prose is
attached to this story. It now sits with `clarity-reviewer` alongside
GATE-002, together with its companion question about whether a given detail
carries evidence, relationship, pressure or voice, or is merely furniture.

The rubric's closing warning was the more valuable half, because it names a
risk this project created for itself: *do not mechanically delete
transitions, metaphors, three-part lists, or every occurrence of a flagged
word.* Our `craft.py` reports filter-word and over-use rates, and the obvious
response to a bad number is a find-and-replace that makes the prose worse.
`book-write` now says so explicitly — the repair for a high filter-word rate
is restoring concrete cause and character-specific behaviour, which removes
the hedges as a side-effect.

### Character state: possessions and relationships — from AI_NovelGenerator and MuMuAINovel

Two independent projects model per-character state we did not.
`AI_NovelGenerator`'s character-state schema tracks **items** (each named
possession with its condition) and a **relationship network** (named, pairwise,
with current standing); `MuMuAINovel` ships relationship mapping as a headline
feature. Our character notes held motivation and voice in isolation, and
`continuity-reviewer` checked quantities — money, distances, ages — but never
objects or relationship state.

Both are now tracked on character notes, maintained by `deconstruction-agent`
and checked by `continuity-reviewer`. These are the two things a long serial
loses track of most reliably, and for the same reason: each mention feels too
small to record, so nothing records it, and the contradiction surfaces fifty
chapters later when it is expensive to fix. Relationships are written to
**both** characters' notes, because a relationship recorded asymmetrically is
worse than one not recorded at all.

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

### ~~A 37-dimension continuity audit~~ — the number was wrong

Recorded here as a correction. An earlier pass refused a "37-dimension
continuity audit" from `inkos` on cost grounds. Reading the actual artifact —
`packages/core/skills/inkos-story-review/references/review-matrix.md` — it is
a **seven-item** matrix, almost exactly the size of our own gate. The refusal
was made against a number that does not exist.

Mapped against our reviewers, five of its seven are covered: continuity and
causal coherence, character motivation and voice, information and evidence
consistency, prose clarity and viewpoint stability, and scene function.

Two were not, and both have been acted on:

- **"User intent and durable constraints"** as a standing dimension. Closest
  match here is the drafting brief, which now orders itself by what the
  chapter most needs to get right rather than by category.
- **"Promised versus delivered emotion."** This was our long-orphaned "flat
  emotional arc" item, and an independent project treating it as *always
  inspected* was the argument for finally giving it an owner. **Now built**,
  on `motivation-agency-reviewer`.

  The phrasing carried the whole design. *Is this scene moving?* is the
  reader-simulation this project refuses — taste varies by reader and a
  confident verdict would be invention. But **promised versus delivered** is
  a consistency question of exactly the same kind as HARD-002's broken
  promise: the story spent chapters establishing that something mattered,
  this chapter resolved it, and the only question is whether the response
  was proportionate to *the story's own* valuation. That is answerable from
  the record, and it never asks whether the writing is good.

  Soft and never blocking, because deliberate flatness is a real technique —
  shock, dissociation, a character who cannot afford to feel it yet — and a
  check that could block would punish precisely the restraint that makes
  those scenes work.

Its genuinely new idea was not a dimension at all: the matrix **adapts by
form**. Comedy may accept coincidence; mystery demands fair-play evidence;
literary work may trade velocity for perception "but not for empty
repetition". That is now stated in `qa-standards` — soft findings are judged
against the project's genre and Depth Dial, while Hard Invariants and the
gating tier stay fixed.

### Multi-provider model routing

`inkos` routes different agents to different vendors (Moonshot/Kimi,
DeepSeek, Gemini). Not possible here: Claude Code's `model:` frontmatter
selects a Claude tier, and a plugin cannot reach an external API.

Not a real loss. Per-agent *tiering* does the work that matters, and mixing
vendors would fragment voice across one book. The one place it would help —
Chinese web-novel idiom — is not what this project writes.

---

## Not about novel writing — but not useless

These four are not novel-writing tools. Filed as irrelevant on a first pass,
then re-read, because a tool that sits *next to* the problem often knows
something about it. Three yielded a concrete change. None of their code is
used; the licence on NovelAI-tag-generator forbids commercial derivatives,
which is a further reason nothing was taken from it but the observation.

**NovelAI-tag-generator** and **koishijs/novelai-bot** — prompt tags and a
bot for *image* generation. Their shared premise: generators weight terms by
**position**, so tag order changes the output. `cover-brief-agent` wrote
beautiful prose for a human artist and the author was expected to paste it
into an image tool, where the leading paragraph is genre throat-clearing
rather than the subject. It now also emits an ordered prompt block — subject,
composition, lighting, palette, medium, negatives — capped at 40-60 terms,
because each extra term dilutes the ones that mattered. Comp titles stay in
the prose section: naming a work as a reference point for a human and naming
it as a style token in a generator are different acts.

The same insight generalised inward. `context-agent` now orders the writing
brief by what the chapter most needs to get right rather than by tidy
category order, for exactly the reason tag order matters.

**BookForge-Studio** — audiobook text-to-speech, built on reusable voice
"actors" assigned to characters. It needs the same facts our Voice Profiles
already hold, which existed only so `voice-consistency-reviewer` could check
dialogue against a record. `/book-forge:book-export --cast` now assembles
them into a casting reference. It deliberately stops short of line-level
speaker attribution, for the same reason `craft.py` reports dialogue
speaker-agnostically: guessing from proximity fails worst on crowded scenes.

Also worth knowing: it is a **name collision** with this project.

**QuickNovel** — an Android app for *reading* novels, aggregating 40+ sites
including Royal Road and Scribble Hub. Nothing taken, but it is a useful
reminder of where a finished serial ends up and what a reader's app expects
of it. Our platform profiles cover three sites; its source list is a ready
survey of the rest if more are ever wanted.

The "NovelAI" in two of these refers to the image-generation service, not to
novel writing.
