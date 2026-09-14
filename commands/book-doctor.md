---
description: Health check for the book-forge plugin and the current workspace
---

# book-doctor

Run these checks in order and report a pass/fail line for each. Do not
stop at the first failure — run all checks and report the full list, so
one broken thing doesn't hide the status of everything else.

1. **Plugin templates present**: confirm
   `${CLAUDE_PLUGIN_ROOT}/templates/standalone-project/project.json.template`
   and `${CLAUDE_PLUGIN_ROOT}/templates/series-project/series-bible/.gitkeep`
   both exist. Report the exact path checked and whether it was found.

2. **Bundled humanizer skill present**: confirm
   `${CLAUDE_PLUGIN_ROOT}/skills/humanizer/SKILL.md` exists and its first
   line contains YAML frontmatter (starts with `---`).

3. **Workspace `projects/` directory exists**: confirm `./projects` exists
   relative to the current working directory (create it if missing, and
   report that you created it — don't just fail silently).

4. **Workspace `vault/` directory exists**: confirm `./vault` exists
   relative to the current working directory (create it if missing, same
   reporting rule as above).

5. **Git repository check**: run `git rev-parse --is-inside-work-tree` in
   the current directory. Report whether the workspace is a git repo —
   this is informational, not a failure, since not every writer will use
   git for their personal workspace.

Summarize as:

```
book-forge doctor report
=========================
[PASS/FAIL] Plugin templates present
[PASS/FAIL] Bundled humanizer skill present
[PASS/FAIL] projects/ directory exists
[PASS/FAIL] vault/ directory exists
[INFO] Git repository: yes/no
```

If any check reports FAIL, explain specifically what's missing and what
file/directory to check — never just say "something's wrong."
