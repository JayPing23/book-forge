---
description: Draft, review, and finalize one chapter — full pipeline with the five-check QA gate, revision loop with hard caps, and escalation on exhausted retries
argument-hint: <project-name> <chapter-id> [--compete=N]
---

# book-write

Drives one chapter through the full pipeline as a persistent state machine.
State lives at `projects/<project-name>/.project-memory/chapter-state/<chapter-id>.json`
— read it first; if it exists and isn't `finalized`, resume from its
`current_step` rather than starting over. This is what makes a chapter
resumable from a fresh session with no conversation history.

## State file shape

```json
{
  "chapter_id": "0012",
  "current_step": "draft | qa | revise | humanize | finalize | escalated | finalized",
  "attempts": { "continuity-reviewer": 0, "thread-ledger-reviewer": 0, "outline-adherence-reviewer": 0, "voice-consistency-reviewer": 0, "motivation-agency-reviewer": 0 },
  "max_attempts_per_check": 3,
  "last_verdicts": {},
  "quality_score": null,
  "provenance": { "ai_drafted_pct": null, "human_revised_pct": 0 },
  "escalation": null
}
```

## Pipeline

1. **Load or initialize state.** If `.project-memory/chapter-state/<id>.json`
   doesn't exist, create it fresh at `current_step: "draft"`. If it exists
   and `current_step` is `finalized`, tell the user this chapter is already
   done and stop — don't silently re-run a finished chapter.

2. **Grounding (parallel)**: dispatch `context-agent` (reads this project's
   story-bible/outline/plot-threads, produces the five-paragraph writing
   brief) and a vault lookup (read relevant notes from `vault/craft-lessons/`
   for this project's genre) at the same time — both are read-only, nothing
   here depends on the other finishing first.

3. **Draft.** Using the writing brief plus the vault craft-lessons, draft
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

4. **QA gate — five independent checks, dispatched in parallel.** Each
   reviewer reads the story-bible/outline/plot-threads directly — none of
   them read the Writer's own account of what it did. This is the
   never-self-adjudicated rule: the Writer does not get to mark its own
   chapter clean.

   Dispatch `continuity-reviewer`, `thread-ledger-reviewer`,
   `outline-adherence-reviewer`, `voice-consistency-reviewer`, and
   `motivation-agency-reviewer` together. Record each verdict in the state
   file's `last_verdicts`.

5. **Weighted quality score** (a sixth signal, not a pass/fail gate): assess
   coherence, insight/scene-craft quality, and readability, each roughly
   equally weighted, as a 0-100 score. This doesn't block finalization the
   way a failed check does — a low score flags the chapter for the human
   author's review even when all five checks technically passed, since none
   of the five checks are designed to catch "technically correct but bland."
   Record it in `quality_score`.

6. **Revision loop, with a hard cap.** For each reviewer that returned
   `verdict: fail`:
   - Increment that reviewer's counter in `attempts`.
   - If the counter is now over `max_attempts_per_check` (3): set
     `current_step: "escalated"`, write the specific failure and its
     evidence into `escalation`, save the state file, and **stop** — report
     to the user exactly what's failing and why, with the reviewer's
     evidence quoted. Do not force the chapter through. Do not keep looping.
   - Otherwise: revise the draft to address that specific reviewer's
     issues, then re-run **only that reviewer** (not the whole QA gate) —
     the other four reviewers' passing verdicts stand unless the revision
     could plausibly have affected something they check (e.g., a
     continuity fix that changes dialogue should also re-trigger
     voice-consistency). Use judgment on cross-effects rather than
     mechanically re-running everything or nothing.
   - Loop back to this step until all five checks pass or one escalates.

7. **Prose pass.** Once all five checks pass: run `humanizer`, then the
   `light-novel-style` skill's drafting-time checks as a final pass (style
   polish only — this step doesn't re-litigate plot/continuity, which
   already passed).

8. **Finalize.** Write the chapter to `manuscript/`, update the versioned
   chapter chain in `.story-system/`. Record provenance in the state
   file: `ai_drafted_pct` (near 100 for a first draft with no human edits)
   and `human_revised_pct` (0 unless the human author edited the finalized
   text — update this later if they do). This is for future Amazon KDP
   AI-disclosure compliance, not used anywhere yet.

9. **Post-finalize.** Dispatch `deconstruction-agent` to extract facts into
   story-bible notes. For web-novel projects, update
   `.project-memory/strand_tracker.json` with this chapter's dominant
   strand and append to its `history`. Append this chapter's QA outcome
   (issue counts by severity, quality score) to
   `.project-memory/review-metrics.json` — a running trend log the
   dashboard reads, kept separate from the per-chapter state files since
   it's for trend observation, never for gating (gating is always the raw
   `verdict`/`blocking` fields from step 4, never a derived trend number).
   Set `current_step: "finalized"`, save the state file.

## Hard rules

- Never skip the state file. Every step's completion is recorded before
  moving to the next, so a session interruption mid-chapter resumes
  correctly rather than restarting from scratch.
- Never let a reviewer's revision loop exceed `max_attempts_per_check`.
  Exhausting the cap is escalation, never silent success.
- Never run `deconstruction-agent` on a chapter that hasn't passed all five
  checks — extraction assumes the chapter is settled fact, not a draft that
  might still change.

## Escalation: what can and can't be offered as an override

When escalating (step 6), the options presented to the author depend on
what kind of issue is stuck — don't offer a blanket "override" choice for
everything alike:

**Never offer override for**: a world-rule/setting conflict (a character's
ability or a faction relationship contradicting the story-bible), a
timeline conflict (event order or elapsed time contradicting prior
chapters), a factual error (a character who died reappearing without
explanation, a destroyed item recurring), or a continuity break (this
chapter's opening doesn't connect to the prior chapter's ending). These
need the underlying fact fixed — either the draft or the story-bible is
wrong, and override would just launder the contradiction forward.

**Override is reasonable to offer, with the author's explicit confirmation,
for**: a deliberate pacing deviation (a chapter is intentionally slower as
a planned lull, and the Outline-Adherence Reviewer flagged the pace
without knowing it was deliberate), a soft character-voice deviation that
the author judges still fits the character (e.g., a scholarly character's
dialogue reads as more formal than their profile's floor, but that's
plausible for this specific scene), or an optional/flexible outline node
that's implicitly covered but not explicitly dramatized.

An override is never "the issue doesn't exist" — it's "the author reviewed
it and accepts it." Log every override in the state file's `escalation`
field with the author's stated reason, and keep the original reviewer
finding intact rather than clearing it.

## Output

On success: report the chapter is finalized, its quality score, and flag if
the score was low enough to warrant a read despite passing QA. On
escalation: report exactly which check(s) are stuck, the evidence from the
last failed attempt, whether this category of issue can reasonably be
overridden (per the taxonomy above), and ask the author how to proceed.
