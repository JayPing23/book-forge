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

3. **light-novel-style skill present**: confirm
   `${CLAUDE_PLUGIN_ROOT}/skills/light-novel-style/SKILL.md` exists.

4. **Core agents present**: confirm all ten exist under
   `${CLAUDE_PLUGIN_ROOT}/agents/`: `context-agent.md`, `research-agent.md`,
   `deconstruction-agent.md`, `web-novel-outline-agent.md`,
   `complete-book-outline-agent.md`, `continuity-reviewer.md`,
   `thread-ledger-reviewer.md`, `outline-adherence-reviewer.md`,
   `voice-consistency-reviewer.md`, `motivation-agency-reviewer.md`. List
   any missing by exact filename — don't just report a pass/fail count.

5. **Genre templates present**: confirm at least one file exists under
   `${CLAUDE_PLUGIN_ROOT}/templates/genres/`; list how many are found.

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

Summarize as:

```
book-forge doctor report
=========================
[PASS/FAIL] Plugin templates present
[PASS/FAIL] Bundled humanizer skill present
[PASS/FAIL] light-novel-style skill present
[PASS/FAIL] Core agents present (N/10 found)
[PASS/FAIL] Genre templates present (N found)
[PASS/FAIL] projects/ directory exists
[PASS/FAIL] vault/ directory (+ subfolders) exists
[INFO] Git repository: yes/no
```

If any check reports FAIL, explain specifically what's missing and what
file/directory to check — never just say "something's wrong."
