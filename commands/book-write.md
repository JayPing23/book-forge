---
description: Draft, review, and finalize one chapter — full pipeline with a pre-draft validity check, the six-check QA gate, Override Contracts for soft findings, a revision loop with hard caps, and escalation on exhausted retries
argument-hint: <project-name> <chapter-id> [--compete=N]
---

# book-write

Drives one chapter through the full pipeline as a persistent state machine.
State lives at `projects/<project-name>/.project-memory/chapter-state/<chapter-id>.json`
— read it first; if it exists and isn't `finalized`, resume from its
`current_step` rather than starting over. This is what makes a chapter
resumable from a fresh session with no conversation history.

Load the `qa-standards` skill before running the QA gate (step 5) — it
defines the Hard Invariants and the Override Contract system this pipeline
enforces.

## State file shape

```json
{
  "chapter_id": "0012",
  "current_step": "precheck | draft | qa | revise | humanize | finalize | escalated | finalized",
  "attempts": { "continuity-reviewer": 0, "thread-ledger-reviewer": 0, "outline-adherence-reviewer": 0, "voice-consistency-reviewer": 0, "motivation-agency-reviewer": 0, "clarity-reviewer": 0 },
  "max_attempts_per_check": 3,
  "last_verdicts": {},
  "quality_score": null,
  "provenance": { "ai_drafted_pct": null, "human_revised_pct": 0 },
  "escalation": null,
  "override_contracts": []
}
```

## Pipeline

1. **Load or initialize state.** If `.project-memory/chapter-state/<id>.json`
   doesn't exist, create it fresh at `current_step: "precheck"`. If it exists
   and `current_step` is `finalized`, tell the user this chapter is already
   done and stop — don't silently re-run a finished chapter.

2. **Beat validity pre-check** (cheap, before any prose is drafted — catches
   a broken plan before paying for a full draft-and-review cycle on it).
   Read this chapter's planned beat from `outline/` and check it, in
   isolation, against four things: does it contradict a story-bible
   fact or world rule; does it ignore or contradict the prior chapter's
   ending; does it repeat a beat already used recently (pattern fatigue);
   does it actually connect to this chapter's stated goal in the volume
   outline. This is a quick read-through, not a full review pass — if
   something looks wrong, send it back to the appropriate outline agent to
   adjust the beat before drafting starts, rather than drafting a full
   chapter against a plan that was already broken. Record the outcome;
   don't block on this step exceeding an attempt cap the way the QA gate
   does — a beat that can't be fixed after a couple of tries is an
   authorial decision, not a pipeline failure, so escalate to the author
   directly rather than looping.

3. **Grounding (parallel)**: dispatch `context-agent` (reads this project's
   story-bible/outline/plot-threads, produces the five-paragraph writing
   brief) and a vault lookup (read relevant notes from `vault/craft-lessons/`
   for this project's genre) at the same time — both are read-only, nothing
   here depends on the other finishing first.

4. **Draft.** Using the writing brief plus the vault craft-lessons, draft
   the chapter. Load the `light-novel-style` skill before drafting (not
   after) so anti-AI-tell patterns are avoided at write-time, per that
   skill's own guidance. For web-novel projects, also check
   `.project-memory/strand_tracker.json` against the outline agent's
   enforcement thresholds (Quest ≤5 chapters unswitched, Fire absent ≤10,
   Constellation absent ≤15) and load `payoff-craft` when this chapter's
   planned beat calls for a payoff moment — don't improvise payoff
   structure from scratch when a worked methodology exists for it.

   **Optional `--compete=N`**: if passed, draft N independent versions in
   isolated git worktrees (the agenthub pattern) and run an LLM-judge pass
   ranking them for coherence and voice before picking one to proceed with.
   Reserve this for the opening chapter, the climax, or chapters in the
   middle third of the book/arc (40-60% through) — published error-clustering
   data puts consistency failures there, not concentrated at the bookends
   intuition suggests. Not default behavior; skip this step entirely when
   the flag isn't passed.

5. **QA gate — six independent checks, dispatched in parallel.** Each
   reviewer reads the story-bible/outline/plot-threads directly — none of
   them read the Writer's own account of what it did. This is the
   never-self-adjudicated rule: the Writer does not get to mark its own
   chapter clean.

   Dispatch `continuity-reviewer`, `thread-ledger-reviewer`,
   `outline-adherence-reviewer`, `voice-consistency-reviewer`,
   `motivation-agency-reviewer`, and `clarity-reviewer` together. Record
   each verdict in the state file's `last_verdicts`.

6. **Weighted quality score** (a seventh signal, not a pass/fail gate):
   assess coherence, insight/scene-craft quality, and readability, each
   roughly equally weighted, as a 0-100 score. This doesn't block
   finalization the way a failed check does — a low score flags the
   chapter for the human author's review even when all six checks
   technically passed, since none of them are designed to catch
   "technically correct but bland." Record it in `quality_score`.

7. **Revision loop, with a hard cap.** For each reviewer that returned
   `verdict: fail`:
   - **If the finding is a Hard Invariant** (HARD-001 through HARD-004,
     per `qa-standards`): it is never eligible for an Override Contract.
     Increment that reviewer's counter in `attempts`. If the counter is
     now over `max_attempts_per_check` (3): set `current_step:
     "escalated"`, write the specific failure and its evidence into
     `escalation`, save the state file, and **stop**. Do not force the
     chapter through. Do not keep looping.
   - **If the finding is soft guidance**: before spending a revision
     attempt, check whether an Override Contract is the right move (see
     "Override Contracts" below) — deliberate, defensible trade-offs
     don't need to be revised away. If accepted, log the contract and
     treat that specific finding as resolved without consuming a revision
     attempt. If not accepted (or the author wants it fixed), revise
     normally and it counts toward the attempt cap like any other finding.
   - Otherwise: revise the draft to address that specific reviewer's
     issues, then re-run **only that reviewer** (not the whole QA gate) —
     the other five reviewers' passing verdicts stand unless the revision
     could plausibly have affected something they check (e.g., a
     continuity fix that changes dialogue should also re-trigger
     voice-consistency). Use judgment on cross-effects rather than
     mechanically re-running everything or nothing.
   - Loop back to this step until all six checks pass (or are resolved via
     contract) or one escalates.

8. **Prose pass.** Once all six checks pass or are resolved: run
   `humanizer`, then the `light-novel-style` skill's drafting-time checks
   as a final pass (style polish only — this step doesn't re-litigate
   plot/continuity, which already passed).

9. **Finalize.** Write the chapter to `manuscript/`, update the versioned
   chapter chain in `.story-system/`. Record provenance in the state
   file: `ai_drafted_pct` (near 100 for a first draft with no human edits)
   and `human_revised_pct` (0 unless the human author edited the finalized
   text — update this later if they do). This is for future Amazon KDP
   AI-disclosure compliance, not used anywhere yet.

10. **Post-finalize.** Dispatch `deconstruction-agent` to extract facts
    into story-bible notes (per its status-lifecycle protocol — see that
    agent's spec) and, when this chapter's quality score is high, to
    capture strong passages into the style-exemplar library (see
    `deconstruction-agent`). For web-novel projects, update
    `.project-memory/strand_tracker.json` with this chapter's dominant
    strand and append to its `history`. Append this chapter's QA outcome
    (issue counts by severity, quality score) to
    `.project-memory/review-metrics.json` — a running trend log the
    dashboard reads, kept separate from the per-chapter state files since
    it's for trend observation, never for gating (gating is always the raw
    `verdict`/`blocking` fields from step 5, never a derived trend number).
    Set `current_step: "finalized"`, save the state file.

## Hard rules

- Never skip the state file. Every step's completion is recorded before
  moving to the next, so a session interruption mid-chapter resumes
  correctly rather than restarting from scratch.
- Never let a reviewer's revision loop exceed `max_attempts_per_check`.
  Exhausting the cap is escalation, never silent success.
- Never run `deconstruction-agent` on a chapter that hasn't passed all six
  checks — extraction assumes the chapter is settled fact, not a draft that
  might still change.
- Never create an Override Contract for a Hard Invariant. The taxonomy in
  `qa-standards` is not a suggestion.

## Override Contracts (soft-guidance findings only)

Full taxonomy and debt rules live in the `qa-standards` skill — load it
before creating a contract. Summary of the mechanics here:

1. A soft-guidance finding (weak hook, missing micro-payoff, flat
   emotional arc, pattern fatigue, long paragraphs, or a deliberate
   pacing/voice/outline deviation) can be accepted instead of revised,
   through an explicit contract — never a silent pass.
2. Creating one requires a `rationale_type` from the `qa-standards` enum
   (`TRANSITIONAL_SETUP`, `LOGIC_INTEGRITY`, `CHARACTER_CREDIBILITY`,
   `WORLD_RULE_CONSTRAINT`, `ARC_TIMING`, `GENRE_CONVENTION`, or
   `EDITORIAL_INTENT`) and a short note. `ARC_TIMING` requires naming the
   specific chapter/volume the deferred payoff lands in; `GENRE_CONVENTION`
   requires citing the specific genre-template section.
3. Append the contract to the state file's `override_contracts` array and
   to the project-level `.project-memory/override-contracts.json` log.
4. **Before creating a new contract**, check the project-level log for the
   same reviewer + same `rationale_type` combination. Three or more prior
   instances: don't silently create a fourth. Surface the pattern to the
   author instead — this usually means either a story-bible/genre-template
   note is missing (the "violation" is actually a standing authorial
   choice that should stop tripping the guidance at all) or there's a real
   recurring weakness worth fixing rather than re-excusing each time. See
   the design spec's self-improvement loop for how this feeds back into
   the story-bible or `/book-forge:book-learn`.
5. `EDITORIAL_INTENT` contracts always require the author's explicit
   confirmation before creation — this rationale has no external check to
   validate it, so it doesn't get created on the primary agent's own
   judgment the way the other six rationales can.

## Escalation: what can and can't be offered as an override

**Never offer an Override Contract for**: any Hard Invariant
(HARD-001 through HARD-004 — readability floor, broken promise, pacing
disaster, conflict vacuum), a world-rule/setting conflict, a timeline
conflict, a factual error (a character who died reappearing without
explanation, a destroyed item recurring), or a continuity break. These
need the underlying fact fixed — either the draft or the story-bible is
wrong, and a contract would just launder the contradiction forward rather
than resolve it.

**Override Contracts are reasonable for**: the soft-guidance categories
listed above, per the `qa-standards` taxonomy and its rationale-type
requirements.

An override is never "the issue doesn't exist" — it's "the author reviewed
it and accepts it, on the record." Log every contract in full, and keep
the original reviewer finding intact rather than clearing it.

## Output

On success: report the chapter is finalized, its quality score, any
Override Contracts created (and whether any are approaching the
repeated-pattern threshold), and flag if the score was low enough to
warrant a read despite passing QA. On escalation: report exactly which
check(s) are stuck, the evidence from the last failed attempt, whether
this category of issue is eligible for a contract at all (per the taxonomy
above), and ask the author how to proceed.
