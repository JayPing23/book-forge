---
description: The only command you need — figures out where your book is and does the next right thing, whether that's starting from nothing, resuming after weeks away, drafting, publishing, or compacting
argument-hint: "[project name, or an idea, or nothing at all]"
---

# book

**This is the single entry point.** Every other `/book-forge:*` command is
machinery this one drives. You should never need to remember which of them
to run — that's this command's job.

Run it with a project name, with a raw idea, or with nothing. It reads the
current state and routes accordingly, asking only questions that shape the
book, never "which command should I run next."

## Step 1: Work out where we are

Before doing anything, establish state. Cheap reads only — never scan the
manuscript:

1. `./projects/` — which projects exist? If `$ARGUMENTS` names one, use it.
   If exactly one exists and `$ARGUMENTS` doesn't name a project, use it.
   If several exist and it's ambiguous, ask which one — that's a real
   question, not a procedural one.
2. `project.json` — type, genre, `length_tier`, `target_chapter_words`,
   `published_through`.
3. `.project-memory/session-log.md` — the most recent 2-3 entries.
4. `.project-memory/chapter-state/*.json` — any chapter not `finalized`.
5. `outline/` — how many chapters of scene-level detail remain past the
   last finalized chapter.
6. `manuscript/` — chapter count and the latest chapter id (filenames
   only; don't read the prose).

## Step 2: Route

Take the **first** row that matches. Announce what you're doing and why in
one sentence, then do it — don't present a menu unless genuinely ambiguous.

| State | What to do |
|---|---|
| No project exists, and `$ARGUMENTS` is empty or an idea fragment | New-project flow (Step 3) |
| A chapter is `escalated` | **Stop and surface it first.** Report which check is stuck and its evidence, and ask how to proceed. Never route around an escalation to go draft something else — that's how a known problem gets buried under twenty more chapters. |
| A chapter is mid-pipeline (state exists, not `finalized`) | Resume that chapter from its `current_step` via `/book-forge:book-write`'s pipeline. Finish what's open before starting anything new. |
| Returning after a gap (newest session-log entry isn't from today, and work exists) | Give the `/book-forge:book-resume` briefing **first** — what was decided, what's unresolved, what's due — then continue to the next matching row. |
| Rolling outline window has <5 chapters of detail left | Extend it via the matching outline agent before drafting. Drafting must never outrun planning. |
| A volume closed and compaction is due (`mid`/`long` tier) | Offer `/book-forge:book-compact`. Don't force it, but don't let it slide indefinitely on a `long`-tier project — that's the mechanism keeping context flat. |
| Brand-new project, no chapters drafted yet, and `story-bible/style-exemplars/` is empty | Offer `/book-forge:book-style` once, before the first draft. The exemplar library is emptiest exactly when it matters most — at chapter one. Offer, don't force: an author with nothing to seed from should just start writing |
| Author says a finalized chapter is wrong ("chapter 12 is flat", "the fight doesn't land") | `/book-forge:book-revise` flow — their note becomes a binding constraint and the full QA gate re-runs. Refuse only if the chapter is published; then offer fix-forward |
| Author asked to publish / mark chapters live | `/book-forge:book-publish` flow |
| Author asked to export / upload / package | `/book-forge:book-export` flow |
| Everything current, ready to write | Drafting loop (Step 4) |

## Step 3: New project

Run the full chain continuously — ideation → scaffold + research + outline
+ protagonist → first chapter — without stopping to ask permission between
stages. Ask only the questions that decide what the book *is*
(`ideation-agent`'s own questions, then `project_type`, `genre`,
`depth_dial`, `platform_convention`, `length_tier`,
`target_chapter_words`, `ip_status`, `monetization_allowed`), plus the
pre-outline interrogation pass for `complete-book` projects.

Then draft chapter 0001 through the full QA gate and **stop there** —
before committing a direction across many chapters, you should see real
prose and be able to redirect.

## Step 4: Drafting loop

For an established project, ask once how many chapters to do this session
(default 1), then run `/book-forge:book-write`'s full pipeline per chapter
in sequence.

Between chapters, check cheaply: did a chapter escalate (stop and surface),
did the outline window run low (extend), did a volume just close (offer
compaction). After the last one, report and update the session log.

**Respect the token reality.** What costs money is agent *dispatches*, not the length of anything anyone types. Each dispatch is a fresh context that re-reads files of its own. The pipeline is tiered so only the three judgement reviewers inherit the session model; everything else runs on `sonnet` or `haiku`.

If the author reports burning through their allowance unexpectedly fast, the cause is almost always one of two things, and neither is a single chapter: a **parallel fan-out of `research-agent`** at project setup (each copy reads the open web — dispatch it once, sequentially), or a **long uninterrupted drafting batch**. On a plan with a rolling 5-hour window rather than a large monthly budget, several short sessions beat one long one.

A long web novel is months of work across
many sessions — nobody finishes 1,000 chapters in one sitting, and trying
to burns the session's budget without a clean stopping point. If the
author asks for a large batch, say plainly how far you expect to get, and
make sure every finished chapter is fully committed to state and session
log before continuing, so the stopping point is wherever the session ends
rather than a half-finished chapter.

## Step 5: Always close the session cleanly

Before the session ends — or any time you've finished a meaningful stretch
— make sure `.project-memory/session-log.md` carries: what was done, any
decisions made, anything unresolved, and an explicit "resume here." This
is what lets the next session (days or weeks later) pick up cold.

A session that produced work but left no log entry is the one failure mode
that costs the most later, because nothing on disk records *why* things
were decided.

## Hard rules

- **Never present a command menu.** The author asked for one agent; make
  the routing decision and say what you're doing. If several things are
  due, do the one the table ranks first and mention the others are queued.
- **Never route around an escalation.** A stuck chapter is surfaced
  immediately, before any new work.
- **Never skip a content question to preserve flow.** What's skipped here
  is procedural confirmation, never a decision about the book.
- **Never let drafting outrun the outline** or a `long`-tier project go
  indefinitely without compaction.
- Every underlying command's own hard rules still apply in full — this
  command changes *routing*, never the pipeline's standards.

## Error handling

| Situation | Handling |
|---|---|
| Several projects and the argument is ambiguous | Ask which — listing them with their last-activity date so the choice is easy |
| Project exists but has no outline or protagonist yet (interrupted setup) | Resume setup where it stopped rather than treating it as a new project |
| `project.json` is missing or unparseable | Stop and report; almost everything downstream reads it, so guessing would produce confidently wrong routing |
| Author explicitly names a command they want | Do that — this command routes by default, it doesn't override an explicit request |
