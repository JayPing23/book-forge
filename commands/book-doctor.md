---
description: Health check for the book-forge plugin and the current workspace
---

# book-doctor

Run these checks in order and report a pass/fail line for each. Do not
stop at the first failure — run all checks and report the full list, so
one broken thing doesn't hide the status of everything else.

1. **Plugin templates present**: confirm
   `${CLAUDE_PLUGIN_ROOT}/templates/standalone-project/project.json.template`,
   `${CLAUDE_PLUGIN_ROOT}/templates/standalone-project/story-bible/plot-threads.base`,
   `${CLAUDE_PLUGIN_ROOT}/templates/note-templates/character.md`, and
   `${CLAUDE_PLUGIN_ROOT}/templates/series-project/series-bible/.gitkeep`
   all exist. Report each exact path checked and whether it was found.

2. **Bundled humanizer skill present**: confirm
   `${CLAUDE_PLUGIN_ROOT}/skills/humanizer/SKILL.md` exists and its first
   line contains YAML frontmatter (starts with `---`).

3. **light-novel-style, payoff-craft, and qa-standards skills present**:
   confirm `${CLAUDE_PLUGIN_ROOT}/skills/light-novel-style/SKILL.md`,
   `${CLAUDE_PLUGIN_ROOT}/skills/payoff-craft/SKILL.md`, and
   `${CLAUDE_PLUGIN_ROOT}/skills/qa-standards/SKILL.md` all exist.

4. **Core agents present**: confirm all fifteen exist under
   `${CLAUDE_PLUGIN_ROOT}/agents/`: `context-agent.md`, `research-agent.md`,
   `ideation-agent.md`, `deconstruction-agent.md`,
   `web-novel-outline-agent.md`, `complete-book-outline-agent.md`,
   `continuity-reviewer.md`, `thread-ledger-reviewer.md`,
   `outline-adherence-reviewer.md`, `voice-consistency-reviewer.md`,
   `motivation-agency-reviewer.md`, `clarity-reviewer.md`,
   `dialogue-naturalness-reviewer.md`, `cover-brief-agent.md`,
   `continuity-archivist.md`. List any missing by
   exact filename — don't just report a pass/fail count.

5. **Genre templates present**: confirm at least one file exists under
   `${CLAUDE_PLUGIN_ROOT}/templates/genres/`; list how many are found.

5a. **Single entry point present**: confirm
   `${CLAUDE_PLUGIN_ROOT}/commands/book.md` exists. This is the command
   the author actually uses; every other command is machinery it drives.
   If it's missing, the workflow still functions but only for someone who
   remembers all fourteen commands — report it as a failure, not a note.

5b. **Platform profiles present**: confirm `royal-road.md`,
   `webnovel-qidian.md`, and `scribble-hub.md` exist under
   `${CLAUDE_PLUGIN_ROOT}/templates/platforms/` — `/book-forge:book-export`
   falls back to a generic package without them, which is a silent
   quality loss rather than an error.

6. **Workspace `projects/` directory exists**: confirm `./projects` exists
   relative to the current working directory (create it if missing, and
   report that you created it — don't just fail silently).

7. **Workspace `vault/` directory exists**: confirm `./vault` exists
   relative to the current working directory, along with its
   `craft-lessons/`, `canvas/`, and `bases/` subfolders (create any missing
   ones, same reporting rule as above).

8. **Git repository check**: run `git rev-parse --is-inside-work-tree` in
   the current directory. Report whether the workspace is a git repo —
   this is informational, not a failure, since not every writer will use
   git for their personal workspace.

9. **Market-pulse freshness** (informational, not a failure): for each
   project under `./projects`, read its genre and check
   `vault/craft-lessons/market-pulse/` for the most recent pulse matching
   that genre. If the newest one (or the project's original
   research-agent init research, if no pulse has ever run) is older than
   roughly 6 weeks, note it as a reminder to run
   `/book-forge:market-pulse <project>` — don't block on this, just
   surface it.

Summarize as:

```
book-forge doctor report
=========================
[PASS/FAIL] Plugin templates present
[PASS/FAIL] Bundled humanizer skill present
[PASS/FAIL] light-novel-style, payoff-craft, qa-standards skills present
[PASS/FAIL] Core agents present (N/14 found)
[PASS/FAIL] Genre templates present (N found)
[PASS/FAIL] Platform profiles present (N/3 found)
[PASS/FAIL] projects/ directory exists
[PASS/FAIL] vault/ directory (+ subfolders) exists
[INFO] Git repository: yes/no
[INFO] Market-pulse freshness: per-project, flag anything >6 weeks stale
```

If any check reports FAIL, explain specifically what's missing and what
file/directory to check — never just say "something's wrong."
