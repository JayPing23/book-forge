---
name: qa-standards
description: Shared single source of truth for the QA gate's hard/soft violation taxonomy and the Override Contract system. Loaded by the seven reviewers and by /book-forge:book-write's escalation handling — do not copy this taxonomy into an individual reviewer's own file, reference this skill instead, so there's one place to update it.
---

# QA Standards — Hard Invariants and the Override Contract

Adapted from webnovel-writer's reading-power-taxonomy.md constraint-layer
standard. Three tiers, with different consequences: Hard Invariants
(blocking, never overridable), Gating Guidance (blocking, releasable by
contract), and Soft Guidance (non-blocking, contract or report).

## Hard Invariants — never overridable, always blocking

A violation here means the chapter isn't ready, full stop. No rationale
justifies shipping it; the primary agent revises, the revision loop
applies (see `book-write`'s retry cap), and exhausting the cap escalates
to you exactly like any other blocking failure.

These are not the only blocking findings — see Gating Guidance below — but
they are the only ones with no way through except fixing them.

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

## Gating Guidance — blocking, but releasable by contract

A third tier, between the two above. A gating finding **stops the chapter
from finalizing**, like a Hard Invariant — but unlike one, it can be
released by an explicit Override Contract.

| ID | Name | Definition | Owning reviewer |
|---|---|---|---|
| GATE-001 | Dialogue naturalness | An exchange reads as machine-written rather than as people talking: report-speech, uniform line shape, attribution carrying the scene with nothing staged | `dialogue-naturalness-reviewer` |
| GATE-002 | Told, not shown | The chapter's load-bearing beats are summarised in narration rather than staged as scene — events reported to the reader in sequence instead of played out | `clarity-reviewer` |

Both gating invariants share a shape, and it is worth naming because it is
what the tier is for. Each describes a chapter that is **technically correct
and unreadable** — nothing is contradicted, no thread is dropped, no
character acts out of turn, and a reader still puts it down. Every other
check in this gate answers "is this chapter wrong." These two answer "is this
chapter worth reading," which is a different question and cannot be settled
by a correctness verdict.

The tier exists because the binary above cannot express what these need.
Taking GATE-001 as the worked example:
As Soft Guidance it would be ignorable, and the external evidence — reader
reviews of AI-assisted serials — says stiff dialogue is the single
most-cited reason readers drop a book, well ahead of any plot defect. As a
Hard Invariant it would be wrong in the other direction: a military briefing,
a courtroom, or a character whose Voice Profile establishes clipped precision
*should* read formally, and a check with no legitimate way through would push
every scene toward a generic mid-register chattiness — which is its own AI
tell, and a worse one because it would be systematic.

**The one operational difference from Soft Guidance** is that `report` is not
an available disposition. A blocking gating finding must be either revised or
contracted before the chapter finalizes; it cannot be noted and shipped. That
is the whole point — "noted and shipped" is how a check quietly stops
mattering.

Everything else follows the soft-guidance machinery unchanged: the same
`rationale_type` table below, the same contract log, the same debt weights,
and the same 3-strikes pattern prompt. A gating check that is wrong for a
given project will therefore announce itself as a pattern rather than as
permanent friction.

Retry and escalation follow the Hard Invariant path: each blocking gating
finding increments its reviewer's counter in `attempts`, and exhausting
`max_attempts_per_check` escalates to the author rather than forcing the
chapter through.

## Soft Guidance — appealable, but never free

Examples: a chapter-end hook that's weaker than the moment calls for, a
missing micro-payoff, a flat emotional arc, pattern fatigue (the same
cool-point pattern three times running), paragraphs long enough to hurt
readability. Three conditional checks are also soft by design, and only
run on certain chapters: opening-hook intensity (chapters 0001-0003,
`thread-ledger-reviewer`), opening-scene conflict positioning (chapter
0001, `clarity-reviewer`), and longitudinal voice drift (every 20th
chapter, `voice-consistency-reviewer`).

A soft-guidance violation can be accepted rather than fixed — but only
through an explicit **Override Contract**, never a silent pass.

**"Never a silent pass" includes findings on a passing verdict.** A
reviewer's `verdict` answers "must this chapter be revised before it
ships," not "did this reviewer find anything" — so a reviewer can return
`verdict: "pass"` while still reporting real non-blocking findings. Those
findings still need disposition (revise, contract, or report); see
`book-write`'s step 7a. This matters for more than the single chapter:
the debt tracking below is fed by the contract log, so findings that
never reach the contract flow are findings this system can never learn
from.

Creating a contract requires a `rationale_type`:

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

## A note on the soft-guidance examples

Three of the examples above — missing micro-payoff, flat emotional arc, and
pattern fatigue — historically had **no reviewer whose scope could raise
them**. They were named in this taxonomy as though they were checked, and
nothing checked them. All three now have an owner:

| Example | Owner | Shape of the check |
|---|---|---|
| Missing micro-payoff | `thread-ledger-reviewer` | A chapter containing **none** of `payoff-craft`'s seven micro-payoff types. A floor, not a quota — counting beats against the genre-tuned frequency guidance would turn advice into a target |
| Flat emotional arc | `motivation-agency-reviewer` | **Promised versus delivered weight**: did the chapter treat as mattering what the story already established as mattering |
| Pattern fatigue | `thread-ledger-reviewer` + `craft.py` | Hook type recorded per chapter; runs and crowded windows reported mechanically |

**Why "flat emotional arc" is phrased the way it is.** The obvious version of
that check — *is this scene moving?* — is the reader-simulation this project
deliberately does not do. Whether prose lands emotionally is taste, it varies
by reader, and a confident verdict would be invention wearing a reviewer's
frontmatter.

The version that is buildable asks a **consistency** question instead, of
exactly the same kind as HARD-002's broken promise: the story spent chapters
establishing that something mattered, then this chapter resolved it — was the
response proportionate to the story's *own* valuation? That is answerable
from the record. It never asks whether the writing is good.

All three are soft and never blocking. Deliberate flatness is a real
technique — shock, dissociation, a character who cannot afford to feel it yet
— and a breather chapter with no micro-payoff is a legitimate choice. A check
that could block would punish exactly the restraint that makes those work.

**Pattern fatigue is now partly closed**, for hooks specifically.
`thread-ledger-reviewer` already classified every chapter's ending in order
to check HARD-002 and then discarded the answer; it now records `hook_type`
and `hook_technique`, `book-write` writes them into the chapter's
frontmatter, and `dashboard/craft.py`'s `hook_variety` reports runs of the
same hook and over-concentration inside a rolling window. No model call, no
new reviewer, no per-chapter cost — the classification was already being
made.

That is the shape a fix here should take where possible: find the place the
judgement is already happening and stop throwing it away.

**Still unowned**: pattern fatigue in forms *other than* hook repetition — a
repeated scene shape, a recurring cool-point structure. Recorded as open
rather than quietly dropped, because a taxonomy that lists checks nobody
performs is worse than one that admits the gap.

## The standard adapts by form

The invariants above are fixed; what counts as a violation of the *soft*
guidance is not. A reviewer applying one register's standards to another
form produces confident, wrong findings — and an author who has to contract
around them every chapter learns to stop reading the findings at all.

- **Comedy** may accept coincidence and exaggeration where setup, rhythm and
  character logic carry the joke. A causal-logic finding against a punchline
  is usually the reviewer missing the form.
- **Romance** prioritises relationship movement, subtext and emotional
  credibility over plot velocity.
- **Mystery** requires evidence visibility and fair inference — a withheld
  clue the reader could not have seen is a real defect here and merely a
  pacing choice elsewhere.
- **Commercial serials** need continuation pressure, but not at the cost of
  a scene that completes.
- **Literary work** may trade plot velocity for perception, language or
  thematic movement — but not for empty repetition, which is not the same
  thing and is the excuse most often made for it.

Check `project.json`'s `genre` and `depth_dial` before deciding that a soft
finding applies. This does not soften the Hard Invariants or the gating
tier: a chapter nobody can follow is unreadable in every form.

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

## Relationship to the original reviewers

Nothing here replaces `continuity-reviewer`, `thread-ledger-reviewer`,
`outline-adherence-reviewer`, `voice-consistency-reviewer`, or
`motivation-agency-reviewer`. This taxonomy adds two reviewers to those five
and gives all of them a shared, structured way to escalate a finding as an
Override Contract instead of an ad hoc note.

- **`clarity-reviewer`** (sixth) owns the three Hard Invariants no original
  reviewer covers — HARD-001, HARD-003, HARD-004 — and this taxonomy also
  sharpens `thread-ledger-reviewer`'s scope to explicitly own HARD-002. It
  additionally owns **GATE-002** (told, not shown), which sits with it because
  a chapter reported rather than staged is a clarity failure at heart: the
  events are legible, but the reader is never placed anywhere to experience
  them. Note the difference in tier — its Hard Invariants ask whether the
  chapter is *comprehensible*, GATE-002 asks whether it is *inhabited*, and
  only the second is contract-eligible, because summary is a legitimate tool
  where an unreadable chapter never is.
- **`dialogue-naturalness-reviewer`** (seventh) owns GATE-001. It is easy to
  mistake for `voice-consistency-reviewer` and is not the same check:
  voice-consistency asks whether a line sounds like **its speaker**,
  naturalness asks whether it sounds like **a person**. Those are orthogonal.
  A cast that is perfectly distinct and uniformly stilted passes
  voice-consistency with zero findings — and that chapter is the one readers
  put down. Keeping them separate also keeps their `attempts` counters
  separate, so revising stiffness does not consume the budget for voice bleed,
  and an escalation names which of the two is actually stuck.
