---
name: qa-standards
description: Shared single source of truth for the QA gate's hard/soft violation taxonomy and the Override Contract system. Loaded by the six reviewers and by /book-forge:book-write's escalation handling — do not copy this taxonomy into an individual reviewer's own file, reference this skill instead, so there's one place to update it.
---

# QA Standards — Hard Invariants and the Override Contract

Adapted from webnovel-writer's reading-power-taxonomy.md constraint-layer
standard. Two tiers, with different consequences.

## Hard Invariants — never overridable, always blocking

A violation here means the chapter isn't ready, full stop. No rationale
justifies shipping it; the primary agent revises, the revision loop
applies (see `book-write`'s retry cap), and exhausting the cap escalates
to you exactly like any other blocking failure.

| ID | Name | Definition | Owning reviewer |
|---|---|---|---|
| HARD-001 | Readability floor | A reader can't tell what happened, who did it, or why | `clarity-reviewer` |
| HARD-002 | Broken promise | The prior chapter's ending hook gets zero response in this chapter | `thread-ledger-reviewer` |
| HARD-003 | Pacing disaster | N consecutive chapters with no progression at all — no new information, no relationship change, no ability/resource change, no situational change (N is genre-dependent; default 3, tune per project if the genre profile says otherwise) | `clarity-reviewer` |
| HARD-004 | Conflict vacuum | The whole chapter has no identifiable problem, goal, or stakes | `clarity-reviewer` |

These are distinct from — and do not replace — the five original QA
checks (continuity, thread-ledger, outline-adherence, voice-consistency,
motivation-agency). They catch a different failure class: a chapter can
pass all five original checks and still fail HARD-003, because none of
the five checks ask "did anything actually change this chapter."

## Soft Guidance — appealable, but never free

Examples: a chapter-end hook that's weaker than the moment calls for, a
missing micro-payoff, a flat emotional arc, pattern fatigue (the same
cool-point pattern three times running), paragraphs long enough to hurt
readability.

A soft-guidance violation can be accepted rather than fixed — but only
through an explicit **Override Contract**, never a silent pass. Creating
one requires a `rationale_type`:

| rationale_type | Meaning | Debt weight |
|---|---|---|
| `TRANSITIONAL_SETUP` | This chapter is deliberately doing setup/transition work | standard |
| `LOGIC_INTEGRITY` | Plot logic or fair-play-clue integrity wins over the guidance here | reduced |
| `CHARACTER_CREDIBILITY` | The character's established pace/behavior wins over the guidance | reduced |
| `WORLD_RULE_CONSTRAINT` | An established world rule makes the guidance's ask impossible here | reduced |
| `ARC_TIMING` | This is deliberate pacing for a longer payoff arc — must name the specific chapter/volume window it pays off in | standard |
| `GENRE_CONVENTION` | The project's genre template justifies this — must cite the specific template section | standard |
| `EDITORIAL_INTENT` | The author simply wants it this way | **increased** — see debt below |

`EDITORIAL_INTENT` costs more deliberately: it's the only rationale with
no external check (no cited world rule, no cited genre section, no named
payoff window) — it's pure assertion, and pure assertions are the
easiest category to hide a real problem behind.

## Debt tracking

Every Override Contract is logged to
`.project-memory/override-contracts.json` (array of `{chapter, reviewer,
issue, rationale_type, debt_weight, note}`), never silently discarded once
the chapter is finalized. `/book-forge:book-write` reads this log before
creating a new contract:

- **Same `reviewer` + same `rationale_type` used 3+ times in the current
  project**: don't create a fourth silent contract. Surface it to the
  author as a pattern — either this is a genuine, recurring authorial
  choice that belongs in the story-bible or a genre-template note (so
  future chapters stop tripping the same guidance at all), or it's a real
  recurring weakness worth fixing rather than re-excusing. This is the
  mechanism that turns repeated friction into an actual improvement
  instead of an accumulating pile of overrides — see the design spec's
  self-improvement loop section.
- **Accumulated debt weight above a project-configurable threshold**
  (default: soft-cap at 10 standard-weight-equivalent contracts open at
  once): new `EDITORIAL_INTENT` contracts require the author's explicit
  confirmation before creation, even for a single instance — high debt is
  a signal to escalate readily, not to keep extending credit.

## Relationship to the five original reviewers

Nothing here replaces `continuity-reviewer`, `thread-ledger-reviewer`,
`outline-adherence-reviewer`, `voice-consistency-reviewer`, or
`motivation-agency-reviewer`. This taxonomy adds a sixth reviewer
(`clarity-reviewer`) for the two Hard Invariants no existing reviewer
covers, sharpens `thread-ledger-reviewer`'s scope to explicitly own
HARD-002, and gives every reviewer a shared, structured way to escalate a
soft finding as an Override Contract instead of an ad hoc note.
