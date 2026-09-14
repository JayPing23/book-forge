---
description: Create a new book project — scaffold, research, and outline
argument-hint: <project-name>
---

# book-new

Given a project name as `$ARGUMENTS`:

1. If `$ARGUMENTS` is empty, ask for a project name before doing anything
   else — do not guess one.
2. Check whether `./projects/$ARGUMENTS` already exists. If it does, stop
   and tell the user — never overwrite an existing project silently.
3. Copy the entire tree from
   `${CLAUDE_PLUGIN_ROOT}/templates/standalone-project/` into
   `./projects/$ARGUMENTS/`, including the `.gitkeep` files, the
   `story-bible/characters|world|plot-threads/` subfolders, the
   `plot-threads.base` view, and the `.story-system`/`.project-memory`
   dot-directories.
4. Rename the copied `project.json.template` to `project.json`.
5. Ask the user, one question at a time, for each field:
   - `project_type`: `complete-book` or `web-novel`.
   - `genre`.
   - `depth_dial`: `popcorn`, `balanced`, or `literary-deep`.
   - `platform_convention`: only if `project_type` is `web-novel`
     (`webnovel-qidian`, `royal-road`, or `custom`) — otherwise `"n/a"`.
   - `ip_status`: `original` or `fan-fiction`.
   - `monetization_allowed`: must default to `false` and stay `false` if
     `ip_status` is `fan-fiction` — do not let the user set it to `true` in
     that case without an explicit acknowledgment that this is their own
     informed call, not a recommendation.
6. Write the answers into `project.json`, replacing every `REPLACE: ...`
   value with the real one.
7. **Dispatch `research-agent`** automatically (this is not optional —
   per the design spec, every project starts with craft + market research
   before outlining). Pass it the project's genre, project_type, and
   platform_convention. Its craft-research and market-research findings
   feed the outline agent in the next step; its reference-novel pattern
   extraction writes to `vault/craft-lessons/` as usual.
8. **Dispatch the outline agent matching `project_type`**:
   `complete-book-outline-agent` for `complete-book`,
   `web-novel-outline-agent` for `web-novel`. Pass it the research
   findings from step 7 and the project's `depth_dial` (which sets the
   Quest/Fire/Constellation strand-balance default). It writes the
   skeleton/volume/(chapter) outline into `outline/`.
9. **Character creation**: before any chapter is drafted, walk the user
   through creating at least the protagonist's story-bible note, using
   `${CLAUDE_PLUGIN_ROOT}/templates/note-templates/character.md` as the
   starting structure. Set the Voice Profile and Motivation Core fields
   explicitly — these are foundational and don't get inferred later from
   chapter content. Ask one question at a time rather than a long form.
10. Report the final project structure, the outline summary, and the
    character(s) created, then tell the user they're ready to run
    `/book-forge:book-write $ARGUMENTS 0001`.

## Hard rules

- Steps 7-8 are not optional and not deferred — research and outlining
  happen before any chapter gets written, per the design spec's
  orchestration flow.
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
