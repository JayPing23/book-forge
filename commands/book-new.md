---
description: Create a new book project — scaffold, research, and outline
argument-hint: <project-name>
---

# book-new

If the author doesn't have a concept yet (no title, genre, or protagonist
idea in mind), point them to `/book-forge:book-idea` first rather than
pushing through this command's questions on a blank slate — that command
converges fragments (or nothing at all) into a structured premise this
command can then consume directly.

Given a project name as `$ARGUMENTS`:

1. If `$ARGUMENTS` is empty, ask for a project name before doing anything
   else — do not guess one. If the author seems unsure what to name it
   because they don't have a concept yet, that's the `/book-forge:book-idea`
   signal — suggest it rather than pressing forward.
2. Check whether `projects/_ideation/$ARGUMENTS-premise.md` exists (a
   premise from a prior `/book-forge:book-idea` session). If so, use it
   directly per that command's handoff process instead of asking the
   protagonist/genre questions in step 5 from scratch.
3. Check whether `./projects/$ARGUMENTS` already exists. If it does, stop
   and tell the user — never overwrite an existing project silently.
4. Copy the entire tree from
   `${CLAUDE_PLUGIN_ROOT}/templates/standalone-project/` into
   `./projects/$ARGUMENTS/`, including the `.gitkeep` files, the
   `story-bible/characters|world|plot-threads|style-exemplars|archive/`

   Character notes carry, in addition to the motivation and voice fields:
   a **`possessions`** list (what they carry, wear or own that the story has
   named, each with its current state) and a **`relationships`** map (other
   named characters, and where the two currently stand in one line). Both
   are maintained by `deconstruction-agent` from finalized chapters and
   checked by `continuity-reviewer`.

   They exist because objects and relationships are the two things a long
   serial loses track of most reliably, and for the same reason: each
   individual mention feels too small to record, so nothing records it, and
   the contradiction only becomes visible fifty chapters later when it is
   expensive to fix.
   subfolders, `outline/volume-summaries/`, the `plot-threads.base` and
   `style-exemplars.base` views, and the
   `.story-system`/`.project-memory` dot-directories.
5. Rename the copied `project.json.template` to `project.json`.
6. Ask the user, one question at a time, for each field (skip any already
   answered by an `_ideation/` premise):
   - `project_type`: `complete-book` or `web-novel`.
   - `genre`.
   - `depth_dial`: `popcorn`, `balanced`, or `literary-deep`.
   - `platform_convention`: only if `project_type` is `web-novel`
     (`royal-road`, `webnovel-qidian`, `scribble-hub`, or `custom`) —
     otherwise `"n/a"`. Each has a profile in
     `${CLAUDE_PLUGIN_ROOT}/templates/platforms/` that
     `/book-forge:book-export` reads; `custom` means no profile and a
     generic export.
   - `ip_status`: `original` or `fan-fiction`.
   - `monetization_allowed`: must default to `false` and stay `false` if
     `ip_status` is `fan-fiction` — do not let the user set it to `true` in
     that case without an explicit acknowledgment that this is their own
     informed call, not a recommendation.
   - `length_tier` (web-novel only; `"n/a"` for complete-book):
     `short` (~100-250 chapters), `mid` (~500), or `long` (~1000). This
     is not cosmetic — it scales the concurrent-open-thread threshold,
     the volume count the outline agent plans for, and how often
     `/book-forge:book-compact` needs to run. Getting it wrong means
     either constant false alarms or none at all.
   - `target_chapter_words`: **ask, never assume.** Typical web-novel
     chapters run 2,000-3,000 words, but that's a starting point for the
     conversation, not a default to write in silently. Offer the typical
     range, let the author name their own number.
   - `target_total_words` (complete-book only; `null` for web-novel):
     ask for the target length. Genre norms vary widely enough that
     guessing is worse than asking.
7. Write the answers into `project.json`, replacing every `REPLACE: ...`
   value with the real one.
8. **Dispatch `research-agent`** automatically (this is not optional —
   per the design spec, every project starts with craft + market research
   before outlining). Pass it the project's genre, project_type, and
   platform_convention. Its craft-research and market-research findings
   feed the outline agent in the next step; its reference-novel pattern
   extraction writes to `vault/craft-lessons/` as usual.
9. **Interrogation pass — before the outline locks, not after.** Skip this
   step entirely if no `_ideation/` premise exists (nothing decided yet
   beyond `project.json`'s own minimal fields to cross-check — point the
   author to `/book-forge:book-idea` first if they want this level of
   rigor). When a premise does exist, walk it one question at a time,
   grill-me style: state the tension, give your own recommended answer
   and why, then ask the author to confirm or override — never bundle
   multiple questions into one message. This is a coherence pass across
   fields that are individually complete but might conflict with each
   other, which the ideation sufficiency gate doesn't check (it confirms
   fields are *filled*, not that they're *consistent*). Always required
   for `complete-book` projects (the outline will be fixed-length and
   expensive to restructure once chapters are written against it — a gap
   found at chapter 50 costs far more than one found now); offer it as
   optional for `web-novel` projects (the rolling outline is cheaper to
   patch as you go, so ask whether the author wants the extra rigor or
   would rather start writing sooner).

   Forcing questions to walk, using the premise's own fields — skip any
   that don't apply to this premise, don't force a question onto a field
   combination that isn't actually in tension:
   - Does `special_advantage` make `core_conflict` trivially easy to
     resolve? If so, what's the counterbalancing cost or limitation —
     `special_advantage.irreversible_cost` should already answer this;
     if it's thin or generic, push on it here.
   - Does the protagonist's `flaw` actually create friction against their
     `desire`, or are they unrelated traits that happen to both be true?
   - Is `antagonist_tiers`' top tier meaningfully above what the
     protagonist's `special_advantage.growth_rhythm` gets them to by the
     story's climax — or does the power curve flatten the threat?
   - Does any entry in `hard_constraints` quietly undercut an entry in
     `core_selling_points`?
   - If `special_advantage.visibility` is hidden, what happens if it's
     discovered — is that consequence decided, or left to be improvised
     mid-draft?
   - Given `target_scale`, does `core_conflict` plus the antagonist
     structure generate enough material to fill it without padding — or
     is there an unstated second conflict layer the author has in mind
     that never made it into the premise?

   Record the author's answers as amendments to the premise file in
   `projects/_ideation/` before proceeding — don't just resolve them in
   conversation and let the written premise fall out of sync with what
   was actually decided.

10. **Dispatch the outline agent matching `project_type`**:
    `complete-book-outline-agent` for `complete-book`,
    `web-novel-outline-agent` for `web-novel`. Pass it the research
    findings from step 8, the project's `depth_dial` (which sets the
    Quest/Fire/Constellation strand-balance default), and — if a premise
    exists — its `core_conflict`, `constraints`, and `world` fields
    (amended per step 9's interrogation pass, if it ran) as starting
    material. It writes the skeleton/volume/(chapter) outline into
    `outline/`.
11. **Character creation**: before any chapter is drafted, walk the user
    through creating at least the protagonist's story-bible note, using
    `${CLAUDE_PLUGIN_ROOT}/templates/note-templates/character.md` as the
    starting structure. If a premise exists, seed the Voice Profile and
    Motivation Core from its `protagonist` and `special_advantage` fields
    instead of asking from scratch — confirm with the user rather than
    silently accepting the premise's draft. These fields are foundational
    and don't get inferred later from chapter content. Ask one question
    at a time for anything not already answered.
12. Report the final project structure, the outline summary, and the
    character(s) created.
13. **Offer to continue straight into drafting.** If this command was
    invoked directly (the author typed `/book-forge:book-new`), ask
    whether they want to draft chapter 0001 now via
    `/book-forge:book-write $ARGUMENTS 0001`, or stop here so they can
    review the outline and character(s) first — either is fine, just
    don't default silently. If this command was invoked as part of
    `/book-forge:book`'s chained flow, skip the ask and continue
    directly into chapter 0001's full pipeline — that continuity is the
    entire point of that entry point. Either way, when chapter 0001 runs,
    stop after it finalizes or escalates and report the result; don't
    auto-continue into chapter 0002 without the author asking.

## Hard rules

- Steps 8 and 10 are not optional and not deferred — research and
  outlining happen before any chapter gets written, per the design
  spec's orchestration flow. Step 9 (interrogation pass) is required for
  `complete-book` projects with a premise, optional for `web-novel`.
- Character Voice Profile and Motivation Core must be set at creation, not
  left blank for the Deconstruction Agent to fill in later — that agent
  only updates `current_status` and relationships, never these foundational
  fields.
- A `fan-fiction` project's `monetization_allowed` field requires an
  explicit, logged acknowledgment to set `true` — never silently default it
  that way even if the user seems to want it, given what's at stake (see
  the design spec's IP/licensing guardrails).

## Error handling

| Situation | Handling |
|---|---|
| Research Agent finds conflicting signals about genre convention | Surface both to the user before outlining commits to one, rather than silently picking |
| User wants to skip character creation and jump straight to writing | Explain that `/book-write` requires at least the protagonist's Voice Profile and Motivation Core to function — the Motivation/Agency and Voice-Consistency reviewers have nothing to check against otherwise. Don't hard-block, but make the consequence explicit. |
