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

## What it reads (read-only — this dashboard never writes to your project)

| Page | Source files |
|---|---|
| Overview | `project.json`, `manuscript/*.md` (word count), `.project-memory/chapter-state/*.json` (escalations) |
| Characters | `story-bible/characters/*.md` frontmatter |
| Plot Threads | `story-bible/plot-threads/*.md` frontmatter, urgency computed from the tier/formula in the design spec |
| Pacing | `.project-memory/strand_tracker.json`, `.project-memory/review-metrics.json` |
| System Health | presence/parseability of the above, project-scoped (distinct from `/book-forge:book-doctor`, which checks the plugin install itself) |

## Dependencies

Backend: Python standard library only, no `pip install` needed. Frontend:
React + Vite (see `frontend/package.json`) — the only two runtime
dependencies are `react` and `react-dom`.
