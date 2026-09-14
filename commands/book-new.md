---
description: Scaffold a new book project's folder structure (Phase 1 — no outline/research agents yet)
argument-hint: <project-name>
---

# book-new

**Phase 1 scope**: this command only creates the folder structure and a
`project.json` you fill in by hand. It does not run the Research Agent,
the outline agent, or any QA reviewer — those arrive in later phases.
Say so explicitly to the user before scaffolding, so nobody expects a
full outline to appear.

Given a project name as `$ARGUMENTS`:

1. If `$ARGUMENTS` is empty, ask for a project name before doing anything
   else — do not guess one.
2. Check whether `./projects/$ARGUMENTS` already exists. If it does, stop
   and tell the user — never overwrite an existing project silently.
3. Copy the entire tree from
   `${CLAUDE_PLUGIN_ROOT}/templates/standalone-project/` into
   `./projects/$ARGUMENTS/`, including the `.gitkeep` files and the
   `.story-system` and `.project-memory` dot-directories.
4. Rename the copied `project.json.template` to `project.json`.
5. Ask the user, one question at a time, for each field
   `project.json` needs: `project_type` (complete-book or web-novel),
   `genre`, `depth_dial` (popcorn, balanced, or literary-deep),
   `platform_convention` (only if project_type is web-novel — otherwise
   set to `"n/a"`), `ip_status` (original or fan-fiction), and
   `monetization_allowed` (must default to `false` and stay `false` if
   `ip_status` is `fan-fiction` — do not let the user set it to `true`
   in that case without an explicit acknowledgment that this is their
   own informed call, not a recommendation).
6. Write the answers into `project.json`, replacing every `REPLACE: ...`
   value with the real one.
7. Report the final folder tree that was created and the `project.json`
   contents, then stop — remind the user that outline generation and
   chapter writing aren't built yet (Phase 2+).
