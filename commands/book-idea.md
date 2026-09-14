---
description: For when you don't have a book concept yet — turn fragmented ideas (or nothing at all) into a structured premise, then hand off to /book-forge:book-new
argument-hint: "[optional: any fragment of an idea you already have]"
---

# book-idea

If `$ARGUMENTS` contains anything, treat it as a starting fragment and pass
it straight to `ideation-agent`. If empty, dispatch `ideation-agent` and let
it ask its Step 0 question (existing fragments, a reference work, or
nothing at all).

## Process

1. Dispatch `ideation-agent` with whatever starting material exists (from
   `$ARGUMENTS` or the Step 0 conversation).
2. Let it run its process: fragment collection, blank-page "what if"
   generation if nothing exists yet, five-dimension scoring once there are
   real candidates, combination techniques if 2+ fragments exist, gap
   analysis, and convergence to a structured premise.
3. Once the premise passes the sufficiency gate and is written to
   `projects/_ideation/<title-slug>-premise.md`, tell the author it's
   ready and ask if they want to proceed straight to
   `/book-forge:book-new <title>` now.
4. If they say yes, continue directly into `book-new`'s process (folder
   scaffolding, research-agent, outline agent, character creation) — but
   skip re-asking anything the premise already answers. Specifically:
   `project.json`'s `genre` comes from the premise; the protagonist's
   story-bible note (Voice Profile + Motivation Core) is seeded from the
   premise's `protagonist` and `special_advantage` fields rather than
   asked from scratch; the outline agent receives the premise's
   `core_conflict`, `constraints`, and `world` fields as its starting
   material alongside `research-agent`'s findings.
   Still ask what `book-new` asks that the premise doesn't cover:
   `project_type` (complete-book/web-novel), `depth_dial`,
   `platform_convention` if web-novel, `ip_status`, and
   `monetization_allowed`.

## Hard rules

- Don't skip straight to `book-new`'s scaffolding before the premise
  passes `ideation-agent`'s sufficiency gate — a half-formed premise
  handed to research/outline agents produces a half-formed outline.
- The premise document stays in `projects/_ideation/` even after handoff —
  don't delete it once the real project exists; it's a useful record of
  where the book's core ideas came from.

## Error handling

| Situation | Handling |
|---|---|
| Author abandons the session partway through ideation | The partial premise stays in `projects/_ideation/` — a later `/book-forge:book-idea` run can resume from it rather than starting over, if the author points back to the same title/slug |
| Author already ran `/book-forge:book-new` manually and wants ideation help mid-project (e.g., for a sequel's premise, or a stuck plot direction) | `ideation-agent` still works standalone for this — it doesn't require being run before `book-new`, just gets used before the *next* project or arc rather than the current one |
