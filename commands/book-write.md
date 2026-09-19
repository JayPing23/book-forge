---
description: Draft, review, and finalize one chapter — full pipeline with a pre-draft validity check, the seven-check QA gate, Override Contracts for soft and gating findings, a revision loop with hard caps, and escalation on exhausted retries
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
  "override_contracts": [],
  "open_soft_findings": []
}
```

`open_soft_findings` holds non-blocking findings that haven't been
dispositioned yet (see step 7). It exists because a reviewer can return
`verdict: "pass"` and still have reported real findings — without
somewhere to hold them, those findings are computed and thrown away.

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

5. **QA gate — seven independent checks, dispatched in parallel.** Each
   reviewer reads the story-bible/outline/plot-threads directly — none of
   them read the Writer's own account of what it did. This is the
   never-self-adjudicated rule: the Writer does not get to mark its own
   chapter clean.

   Dispatch `continuity-reviewer`, `thread-ledger-reviewer`,
   `outline-adherence-reviewer`, `voice-consistency-reviewer`,
   `motivation-agency-reviewer`, `clarity-reviewer`, and
   `dialogue-naturalness-reviewer` together. Record each verdict in the
   state file's `last_verdicts`.

Two of the seven carry gating invariants: `dialogue-naturalness-reviewer`
   owns GATE-001 and `clarity-reviewer` owns GATE-002. Both catch chapters
   that are technically correct and still unreadable, which no correctness
   check can reach. See `qa-standards`.

   `dialogue-naturalness-reviewer` is the one that most looks like a
   duplicate and is not. `voice-consistency-reviewer` asks whether a line
   sounds like **its speaker**; naturalness asks whether it sounds like **a
   person**. A cast can be perfectly distinct and uniformly robotic, pass
   voice-consistency with zero findings, and still be the chapter a reader
   drops. Keeping them as separate reviewers also keeps their `attempts`
   counters separate, so revising stiff dialogue never consumes the retry
   budget for voice bleed.

   **Three checks activate conditionally, not on every chapter** — tell
   the relevant reviewer whether its conditional check is active when
   dispatching it, rather than leaving it to infer from the chapter
   number alone:
   - `thread-ledger-reviewer`'s opening-hook-intensity check and
     `clarity-reviewer`'s opening-scene-positioning check are active only
     for `chapter_id` `0001`-`0003` (see each reviewer's own spec).
   - `voice-consistency-reviewer`'s longitudinal-drift check is active
     only when `chapter_id` is a multiple of 20 (`0020`, `0040`, …).

6. **Weighted quality score** (a separate signal, not a pass/fail gate):
   assess coherence, insight/scene-craft quality, and readability, each
   roughly equally weighted, as a 0-100 score. This doesn't block
   finalization the way a failed check does — a low score flags the
   chapter for the human author's review even when all seven checks
   technically passed, since none of them are designed to catch
   "technically correct but bland." Record it in `quality_score`.

   **Know what this number is and isn't.** It is the one assessment in this
   pipeline made by the same context that produced the work — the single
   exception to the never-self-adjudicated rule everything else runs on.
   Treat it as a weak hint for the author's attention, never as evidence.

   **Assume it runs high on exactly the wrong chapters.** A novelist who read
   a 50,000-word AI-generated novel end to end gave it credit for precisely
   the three things this score measures: the language was dynamic and
   expressive, the flow was good, and it was recognisably a story. He also
   called it unreadable, a "massive exposition dump" that could have been
   told in a fifth of the words. Another reader put it as: all the
   ingredients are there, but it tastes like grass. A book can score well on
   coherence, scene-craft and readability while failing as a book, because
   those three are surface properties and a surface read is what this score
   performs. A *high* score is therefore not evidence of anything. Only a low
   one carries information, and only as a prompt for the author to look.
   Specifically: it is **not sufficient on its own** to qualify a chapter
   for style-exemplar capture, because those exemplars get read back into
   later chapters' writing briefs — letting a self-assessed score decide
   what the model is later taught by would close a loop with nothing
   external in it. The objective signal for that decision is a clean first
   pass across all seven reviewers; see `deconstruction-agent`'s Job 2.

7. **Disposition every finding.** Findings come in three classes and are
   handled differently, but **no class is ever silently dropped**.
   Collect findings from *all seven* reviewers here, not just the failing
   ones — a reviewer returning `verdict: "pass"` can still report real
   non-blocking findings (`medium`/`low` severity, or the conditional
   opening-chapter and longitudinal-drift checks, which are soft by
   design and so *always* arrive on a passing verdict). Findings from
   passing reviewers are exactly the ones most easily lost.

   **7a. Non-blocking findings — from any reviewer, passing or failing.**
   Write them to `open_soft_findings` in the state file first, so they
   survive a session interruption, then disposition each one:
   - Revise it, if the fix is small and low-risk. A non-blocking finding
     gets **at most one** revision attempt — it does not consume the
     `attempts` cap (that's for blocking findings), but it also doesn't
     get to loop. Polish loops are how a pipeline burns tokens forever on
     a chapter that was already acceptable.
   - Or accept it as an **Override Contract** (see below), which logs it
     with a `rationale_type` and a note.
   - Or, if it survives one revision attempt and no contract rationale
     honestly applies, surface it to the author in the step-10 report as
     an unresolved soft finding. That is a valid outcome — it is *not* a
     reason to block the chapter.

   Remove each finding from `open_soft_findings` as it's dispositioned.
   Anything still in that array at finalize time gets reported, never
   quietly cleared.

   **7b. Blocking findings — revision loop with a hard cap.** For each
   reviewer that returned `verdict: fail`. Note that a failing reviewer's
   *non*-blocking findings still go through 7a — 7b handles only the
   blocking findings that caused the failure.

   Blocking findings split by tier (see `qa-standards`), and the split
   decides whether a contract is available at all:
   - **Hard Invariants** (HARD-001–HARD-004) are **never** eligible for an
     Override Contract. There is no way through except fixing them.
   - **Gating findings** (GATE-001) are blocking *and* contract-eligible.
     They are the only findings that are both.
   - **If the finding is a Hard Invariant** (HARD-001 through HARD-004,
     per `qa-standards`): increment that reviewer's counter in
     `attempts`. If the counter is now over `max_attempts_per_check`
     (3): set `current_step: "escalated"`, write the specific failure and
     its evidence into `escalation`, save the state file, and **stop**.
     Do not force the chapter through. Do not keep looping.
   - **If the finding is a gating finding** (GATE-001, GATE-002): increment that
     reviewer's counter in `attempts` and revise, exactly as above — but
     an Override Contract is also a legitimate resolution here, and
     resolving by contract clears the block immediately without a further
     revision pass. Use the normal contract machinery and rationale types
     (`CHARACTER_CREDIBILITY` citing the Voice Profile, `GENRE_CONVENTION`
     citing the template section, or `EDITORIAL_INTENT`). **What is not
     available is reporting it and moving on** — that disposition exists
     only in 7a, and its absence here is the entire difference between the
     gating tier and soft guidance. If the retry cap is exhausted with the
     finding neither fixed nor contracted, escalate exactly as for a Hard
     Invariant.
   - Otherwise: revise the draft to address that specific reviewer's
     issues, then re-run **only that reviewer** (not the whole QA gate) —
     the other five reviewers' passing verdicts stand unless the revision
     could plausibly have affected something they check (e.g., a
     continuity fix that changes dialogue should also re-trigger
     voice-consistency). Use judgment on cross-effects rather than
     mechanically re-running everything or nothing.
   - Loop back to 7b until all seven checks pass (or are resolved via
     contract) or one escalates.

8. **Prose pass.** Once all seven checks pass or are resolved: run
   `humanizer`, then the `light-novel-style` skill's drafting-time checks
   as a final pass (style polish only — this step doesn't re-litigate
   plot/continuity, which already passed).

   **Never revise by deleting flagged words.** `dashboard/craft.py` reports
   filter-word rates, adverb rates and over-used words, and the tempting
   response to a high number is to strip every occurrence. Do not. Those
   figures are counts with no verdict attached, and prose edited to satisfy
   a counter reads worse than prose that scored badly — transitions,
   metaphors and three-part lists are legitimate and each flagged word is a
   real English word that appears in good writing.

   The repair for a high filter-word rate is to restore concrete cause and
   character-specific behaviour, which usually removes the hedges as a
   side-effect. The repair is never a find-and-replace.

   **Do not treat this step as the dialogue safety net.** `humanizer`
   carries no dialogue guidance at all — it is phrasing and rhythm at the
   prose level. `light-novel-style` does carry the dialogue rules, but by
   step 8 the chapter is already drafted, and stiff dialogue is a structural
   property of an exchange rather than something a polish pass repairs
   line by line. That is why the rules are loaded before drafting in step 4
   and enforced by a reviewer in step 5; this step only catches what
   survived both.

9. **Finalize.** Write the chapter as **one file per chapter** — never one
   growing book-length file — to `manuscript/<chapter_id>-<title-slug>.md`
   (e.g. `manuscript/0012-the-broken-oath.md`; the numeric prefix keeps
   chapters sorted correctly in any file browser or Obsidian regardless of
   title). This holds for every project type, including complete-book: one
   file per chapter keeps the revision loop, QA gate, and git history all
   scoped to the chapter actually being touched. A single assembled
   manuscript (for submission, or a web-novel "everything published so
   far" snapshot) is a separate, later concern — see
   `/book-forge:book-export`, never built by concatenating files here.

   Carry `scene_types` through from `context-agent`'s brief, and
   `hook_type` / `hook_technique` from `thread-ledger-reviewer`'s output. It classifies the chapter's ending
   anyway in order to check HARD-002, so recording the answer costs nothing
   and is what makes hook repetition visible across the manuscript — a
   defect no per-chapter review can see, because every chapter's hook is
   individually fine and the problem is that they are all the same one. If
   the reviewer was skipped or returned nothing, omit both fields rather
   than guessing; a wrong label is worse than a missing one, since the whole
   point is the distribution.

   File shape:
   ```markdown
   ---
   chapter_id: "0012"
   title: "The Broken Oath"
   status: finalized
   hook_type: crisis
   hook_technique: unfinished-action
   scene_types: [action, tension]
   provenance:
     ai_drafted_pct: 100
     human_revised_pct: 0
   ---

   # Chapter 12: The Broken Oath

   <prose>
   ```

   **Deliberately not in this frontmatter**: `word_count` (derivable from
   the prose, and stale the moment the author hand-edits the chapter — the
   dashboard computes it from the body, excluding frontmatter and heading
   lines) and `quality_score` (lives in
   `.project-memory/review-metrics.json`, the trend log; duplicating it
   here creates two numbers that can disagree). `provenance` *does* belong
   here rather than only in the state file, because it has to travel with
   the prose for AI-disclosure purposes if the manuscript is ever exported
   or submitted. General rule for this pipeline: a fact lives in exactly
   one place, and the place is whichever one still makes sense after the
   author edits a chapter by hand outside this pipeline.

   **Paragraph formatting is platform-conditional, not a single fixed
   rule**: for `web-novel` projects (especially `platform_convention:
   webnovel-qidian` or `royal-road`), default to short paragraphs —
   typically 1-4 sentences — each separated by a normal Markdown blank
   line, since these are read on phone screens where a dense block reads
   as a wall of text. This is a *visual scanability* rule, distinct from
   `light-novel-style`'s pacing guidance (which varies paragraph length
   *for rhythm/effect* within otherwise normal prose density) — for
   web-novel projects, apply both: vary length for effect, but keep the
   ceiling short regardless. `complete-book` projects use ordinary prose
   paragraphing (`light-novel-style`'s rhythm guidance alone, no short-form
   ceiling) unless the author's `depth_dial`/genre says otherwise. Dialogue
   uses standard double quotes; no other convention is assumed.

   **In-world system/status-window formatting (LitRPG-style `[System]`
   popups, stat blocks, etc.) is deliberately not hardcoded here** — it
   varies by project and is a stylistic choice the author makes, not a
   platform convention this pipeline should impose. If a project wants one
   locked in, record it as a `hard_constraint` in `project.json` (e.g.
   "system messages use square brackets, stat displays use curly braces")
   during `/book-forge:book-new` or `/book-forge:book` — `context-agent`
   already reads `hard_constraints` into every chapter's writing brief (see
   that agent's spec), so this needs no new plumbing, just a decision
   recorded when the author is ready to make it.

   Update the versioned chapter chain in `.story-system/`. Record
   provenance in the state file: `ai_drafted_pct` (near 100 for a first
   draft with no human edits) and `human_revised_pct` (0 unless the human
   author edited the finalized text — update this later if they do). This
   is for future Amazon KDP AI-disclosure compliance, not used anywhere
   yet.

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

    **Session log.** Append this chapter's outcome to
    `.project-memory/session-log.md` under today's session entry
    (create the entry if this is the session's first finalized chapter;
    otherwise extend the existing one rather than opening a second entry
    for the same day). Record it in the `**Progress**` line — chapter
    number, and anything notable like an escalation and how it resolved.
    If this chapter produced a decision that will matter later (a plot
    direction changed, a convention locked, a thread deliberately
    dropped), add it under `**Decisions**`; if it raised something
    unresolved, add it under `**Open questions**`. Always update
    `**Resume here**`. Format and rules: see `/book-forge:book-resume`.

    This is what makes a project that takes two months across dozens of
    sessions actually resumable — the per-chapter state files handle a
    single interrupted chapter, but nothing else records *why* things
    were decided the way they were.

    **Auto-backup**: if the workspace is a git repository (check
    `git rev-parse --is-inside-work-tree`; if not, skip this silently —
    not every writer uses git and that's fine), commit the finalized
    chapter file, its state file, and every story-bible/plot-thread/
    `.project-memory` file this step just touched, with message
    `book-forge: finalize <project-name> chapter <chapter_id>`. This is
    the only automatic commit this pipeline makes — a disaster-recovery
    safety net for drafted work, not a workflow change, and it never
    pushes to a remote.

    Three guards, because an automatic commit in someone else's
    repository is a place to be careful, not clever:
    - **Stage only this chapter's own files, by explicit path.** Never
      `git add -A`, `git add .`, or `git commit -a` — the writer may have
      unrelated work in progress (hand edits to another chapter, notes,
      a half-finished outline), and sweeping that into a
      "finalize chapter" commit is both wrong and confusing to untangle
      later.
    - **Skip if the repository is mid-operation** — a merge, rebase,
      cherry-pick, or unresolved conflict. Report that the backup was
      skipped and why; don't try to commit into a conflicted tree.
    - **Never** create a branch, switch branches, reset, force, or amend
      an existing commit. This step only ever adds one new commit on the
      current branch, or does nothing.

## Hard rules

- Never skip the state file. Every step's completion is recorded before
  moving to the next, so a session interruption mid-chapter resumes
  correctly rather than restarting from scratch.
- Never let a reviewer's revision loop exceed `max_attempts_per_check`.
  Exhausting the cap is escalation, never silent success.
- **Know what a chapter costs before promising a batch.** One chapter is the drafting pass plus up to nine dispatches — `context-agent`, seven reviewers, `deconstruction-agent` — each a fresh context reading files of its own. The dialogue pre-gate in step 5 removes one of the three most expensive on any chapter without dialogue. Revision loops re-run only the failing reviewer, never the whole gate, for the same reason.
- Never run `deconstruction-agent` on a chapter that hasn't passed all seven
  checks — extraction assumes the chapter is settled fact, not a draft that
  might still change.
- **Never drop a finding because the reviewer's verdict was `pass`.** A
  verdict answers "must this chapter be revised before it ships," not
  "did this reviewer find anything." Non-blocking findings go through
  step 7a — revised, contracted, or reported — never discarded. This
  matters beyond the individual chapter: the Override Contract log is
  what feeds the repeated-pattern detection in `qa-standards`, which is
  the system's main self-improvement mechanism. Findings that never reach
  the contract flow are findings the system can never learn from.
- Never create an Override Contract for a Hard Invariant. The taxonomy in
  `qa-standards` is not a suggestion.

## Override Contracts (soft-guidance findings only)

Full taxonomy and debt rules live in the `qa-standards` skill — load it
before creating a contract. Summary of the mechanics here:

1. A soft-guidance finding (weak hook, missing micro-payoff, flat
   emotional arc, pattern fatigue, long paragraphs, a deliberate
   pacing/voice/outline deviation, an under-strength opening hook in
   chapters 0001-0003, opening-scene conflict positioning in chapter
   0001, or longitudinal voice drift) can be accepted instead of revised,
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

**This list can't be escaped through severity.** `continuity-reviewer`
deliberately marks a *plausible-but-unconfirmed* inconsistency `medium`
or `low` (non-blocking) rather than `critical`, so it routes to step 7a
like any other soft finding. That routing is about **confirming it, not
excusing it**: check the story-bible and resolve whether the
contradiction is real. If it is, it's a factual error — fix the fact, in
the draft or in the story-bible. It does not become contractable just
because it arrived non-blocking. The only thing a contract can ever
accept is a *craft* trade-off (hook strength, pacing, payoff timing,
voice), never a question of what is true in the story.

**Override Contracts are reasonable for**: the soft-guidance categories
listed above, per the `qa-standards` taxonomy and its rationale-type
requirements.

An override is never "the issue doesn't exist" — it's "the author reviewed
it and accepts it, on the record." Log every contract in full, and keep
the original reviewer finding intact rather than clearing it.

## Output

On success: report the chapter is finalized, its quality score, any
Override Contracts created (and whether any are approaching the
repeated-pattern threshold), **any soft findings still unresolved in
`open_soft_findings`** (these are the findings that survived a revision
attempt and got no contract — reporting them is the whole reason they're
tracked), and flag if the score was low enough to warrant a read despite
passing QA. On escalation: report exactly which
check(s) are stuck, the evidence from the last failed attempt, whether
this category of issue is eligible for a contract at all (per the taxonomy
above), and ask the author how to proceed.
