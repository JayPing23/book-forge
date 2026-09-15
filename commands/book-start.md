---
description: Single entry point for a new book — chains ideation, scaffolding, research, outline, character creation, and a first drafted-and-QA'd chapter into one continuous flow, pausing only for real content decisions
argument-hint: "[optional: any idea, fragment, or reference-work description you already have]"
---

# book-start

This is the "just call one thing" entry point: run this once and it drives
the project from wherever the author's starting point actually is —
nothing, a fragment, a fully-formed premise, or a reference work whose
premise is good but execution wasn't — all the way through a first drafted
chapter that's passed the full QA gate. It does this by chaining the
existing commands' own documented handoffs continuously instead of
stopping at each one to ask permission to proceed. It still asks plenty of
questions — every question that shapes the actual book — it just doesn't
ask "should I continue to the next stage" at each handoff.

## Process

1. **Ideation.** Dispatch `ideation-agent` with `$ARGUMENTS` as starting
   material, exactly as `/book-forge:book-idea` does — including its Step 0
   (existing fragments / a reference work / nothing at all) and, when a
   reference work is named, its two-part question (what worked, what
   didn't — see that agent's Step 0 for why both matter). Run its full
   process through the sufficiency gate.
2. **Continue directly into scaffolding — do not ask permission first.**
   Once the premise passes the sufficiency gate, proceed straight into
   `/book-forge:book-new`'s process using that premise (folder scaffold,
   `research-agent`, the matching outline agent, character creation),
   skipping anything the premise already answered, same as
   `book-idea`'s own handoff describes. The only questions asked here are
   the ones `book-new` itself asks that the premise doesn't cover
   (`project_type`, `depth_dial`, `platform_convention` if web-novel,
   `ip_status`, `monetization_allowed`) plus protagonist creation if the
   premise didn't fully seed it.
3. **Continue directly into chapter 0001 — do not ask permission first.**
   Once scaffolding, research, outline, and the protagonist's story-bible
   note exist, run `/book-forge:book-write $ARGUMENTS 0001`'s full
   pipeline: pre-draft check, grounding, draft, the six-reviewer QA gate,
   the revision loop, prose pass, finalize, post-finalize extraction.
4. **Stop after chapter 0001.** Whether it finalizes or escalates, stop
   there and report. Do not continue into chapter 0002 automatically —
   the author should see real drafted output and react to it before this
   flow commits to a direction across many chapters. Continuing past
   chapter 1 is always `/book-forge:book-write $ARGUMENTS 0002` (or
   later), run explicitly.

## What this changes vs. running the commands separately

Nothing about what each stage does — `ideation-agent`, `book-new`,
`book-write`, and the six reviewers are unchanged. What changes is only
the handoff behavior between stages: the "ready to proceed?" checkpoints
those commands have when run standalone are skipped here, because running
`book-start` *is* the author's standing "yes, keep going" for this
session.

## Hard rules

- Never skip a content-shaping question to preserve continuity — the
  difference this command makes is skipping *procedural* confirmations
  ("continue to the next stage?"), never skipping the actual questions
  that decide what the book is (genre, protagonist, constraints,
  `ip_status`, etc.).
- If any stage hits its own hard stop (ideation's sufficiency gate not
  met after reasonable effort, a QA escalation on chapter 0001), stop
  there and report — don't force past a stage's own escalation path just
  because this command's purpose is continuity.

## Error handling

| Situation | Handling |
|---|---|
| `./projects/<title-slug>` already exists | Same as `book-new`: stop and tell the author, never overwrite silently |
| Author interrupts mid-flow (e.g. answers ideation questions, then leaves) | The partial premise stays in `projects/_ideation/` per `book-idea`'s own behavior — a later `/book-forge:book-start` or `/book-forge:book-idea` run with the same title can resume |
| Chapter 0001 escalates | Report exactly which check is stuck and the evidence, same as `book-write` does standalone — this command doesn't hide or retry past an escalation |
| Author only wants the idea/premise, not a full project yet | Tell them `/book-forge:book-idea` alone does just that step, if they'd rather not commit to the full chain |
