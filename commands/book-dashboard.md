---
description: Start the local React dashboard for visualizing your projects (overview, characters, plot threads, pacing, health)
argument-hint: "[optional: port, default 5173]"
---

# book-dashboard

**Prefer the launcher if one exists.** Check for `dashboard.bat` in the
workspace root — if it's there, the author can just double-click it
(Windows) rather than going through Claude Code at all, and that's the
easier path for daily use. Mention it once rather than starting a second
server on top of one they may already have running.
`${CLAUDE_PLUGIN_ROOT}/dashboard/start-dashboard.bat` is the shippable
copy to place in a workspace that doesn't have one yet.

**Node is not needed for normal use.** `server.py` serves the prebuilt
`dashboard/frontend/dist` as static files, so once it's built, starting
the dashboard is a single Python process. npm is only required to
*rebuild* after the dashboard's own source changes.

1. Check whether `${CLAUDE_PLUGIN_ROOT}/dashboard/frontend/dist` exists. If
   not, this is a first run — tell the user you're building it once, then
   run:
   ```bash
   cd "${CLAUDE_PLUGIN_ROOT}/dashboard/frontend" && npm install && npm run build
   ```
   This only needs to happen once (or again after a plugin update that
   touches the dashboard).

2. Start the server, pointed at the current workspace (not the plugin
   directory) and running in the background so the conversation isn't
   blocked:
   ```bash
   python "${CLAUDE_PLUGIN_ROOT}/dashboard/server.py" --workspace "$(pwd)" --port "${ARGUMENTS:-5173}"
   ```

3. Tell the user the dashboard is running at
   `http://127.0.0.1:${ARGUMENTS:-5173}` and that it's read-only — it never
   writes to their project, safe to leave open while writing.

4. Explain how to stop it (Ctrl+C in the terminal it's running in, or
   whatever mechanism the harness uses for a backgrounded process) —
   don't leave the user without a way to shut it down.

## Error handling

| Situation | Handling |
|---|---|
| `npm`/`node` not available on this machine | Tell the user Node.js is required for the one-time dashboard build (point to nodejs.org) — the rest of book-forge doesn't need it, only this optional dashboard |
| Port already in use | Suggest a different port via `$ARGUMENTS`, don't silently pick one |
| No projects exist yet in this workspace | The dashboard itself handles this gracefully (empty state pointing at `/book-forge:book-new`) — still worth mentioning before starting it |
