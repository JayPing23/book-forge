# book-forge dashboard

A local React dashboard for visualizing what you're working on — project
overview, characters, plot threads with computed urgency, strand-balance
pacing, quality-score trends, and per-project health checks. Reads your
workspace's actual files directly (project.json, story-bible Obsidian
notes, `.project-memory` state) — no separate database, nothing to sync.

Adapted from `webnovel-writer`'s own dashboard concept (Overview/
Characters/Foreshadowing/Pacing/System pages), rebuilt to read book-forge's
Obsidian-note file format instead of a SQLite backend.

## One-time setup

```bash
cd dashboard/frontend
npm install
npm run build
```

## Running it

```bash
python dashboard/server.py --workspace /path/to/your/workspace --port 5173
```

Then open `http://127.0.0.1:5173`. One process serves both the API and the
built frontend — nothing else to start. `--workspace` defaults to the
current directory, so running it from your workspace root needs no flag.

Use `/book-forge:book-dashboard` from Claude Code to do this for you.

## Development

For frontend changes with hot reload: run the backend on port 5173
(`python dashboard/server.py --port 5173`) and the frontend dev server
separately (`cd dashboard/frontend && npm run dev`, serves on 5174 and
proxies `/api` to 5173). Rebuild with `npm run build` when done.

## Easiest way to run it

Copy `start-dashboard.bat` into your workspace root (next to `projects/`
and `vault/`), rename it to `dashboard.bat`, and double-click it. It finds
Python, builds the frontend once if needed, starts the server, and opens
your browser. Close the window to stop it. Pass a port to use a different
one: `dashboard.bat 5174`.

Edit `PLUGIN_DIR` at the top of the file if the book-forge repo isn't at
`C:\book-forge`.

**Node.js is only needed for the one-time build.** After that, the server
serves the prebuilt `frontend/dist` directly and the dashboard is a single
Python process with no dependencies outside the standard library.

## Images (the one thing it writes)

Cover art and character portraits can be uploaded from the dashboard — drag
and drop, or pick a file. They're stored in
`projects/<name>/story-bible/images/` and shown on the library shelf and in
the sidebar. An uploaded cover replaces the generated typographic one.

Uploading is the **only** write this dashboard performs; everything else
below is strictly read-only. Because it is a write path, it is deliberately
narrow:

- File type is decided by **magic bytes**, never the filename or the
  `Content-Type` header — a `.png` that is actually a script is rejected.
- The stored filename is **generated**, never taken from the request, so a
  crafted name cannot traverse out of the project.
- Size is capped at 10 MB before anything touches disk.
- Writes are confined to `story-bible/images/`.

Portraits are for your own reference while writing. **No agent reads them**
and they are never included in an export.

The upload panel checks your image against the target platform's own rule
(Royal Road 400×600+, Webnovel exactly 600×800, Scribble Hub 250×350 display,
KDP 1600×2560 at 1.6:1) and tells you when it doesn't match. That check is
advisory — it never blocks an upload, since a work-in-progress cover is a
perfectly reasonable thing to have on the shelf.

## What it reads (read-only — this dashboard never writes to your project)

| Page | Source files |
|---|---|
| Overview | `project.json`, `manuscript/*.md` (word count from the prose body only — frontmatter and heading lines excluded), `.project-memory/chapter-state/*.json` (escalations) |
| Characters | `story-bible/characters/*.md` frontmatter |
| Plot Threads | `story-bible/plot-threads/*.md` frontmatter, urgency computed from the tier/formula in the design spec |
| Pacing | `.project-memory/strand_tracker.json`, `.project-memory/review-metrics.json` |
| System Health | presence/parseability of the above, plus `.project-memory/override-contracts.json` for Override Contract debt and repeated-pattern detection. Project-scoped — distinct from `/book-forge:book-doctor`, which checks the plugin install itself |

Chapter files are read as `<chapter_id>-<title-slug>.md` (see
`commands/book-write.md`'s finalize step), but the chapter number is
parsed from the frontmatter `chapter_id` with a fallback to the filename's
numeric prefix — so chapters written before that format was specified
(`0007.md`) still resolve correctly.

## Dependencies

Backend: Python standard library only, no `pip install` needed. Frontend:
React + Vite (see `frontend/package.json`) — the only two runtime
dependencies are `react` and `react-dom`.
