# book-forge

A Claude Code plugin for writing complete novels and serialized web
novels with a multi-agent pipeline: research, outline, draft, and a
seven-check QA gate designed to catch plot holes, dropped threads,
voice bleed, robotic dialogue, chapters that report their events instead
of staging them, and out-of-character behavior before a chapter is
finalized.

Forked and localized from
[webnovel-writer](https://github.com/lingfengQAQ/webnovel-writer)
(GPL v3), with a bundled copy of
[humanizer](https://github.com/blader/humanizer) (MIT).

## Status

**Built, but not yet proven.** Everything described below is implemented —
15 agents, 14 commands, 4 skills, a seven-check QA gate and a local
dashboard — and the mechanical parts have unit and integration tests. What
it does *not* have yet is a finished book. No full novel has been written
with it end to end, so the review thresholds are reasoned rather than
calibrated, and the two blocking "gating" checks in particular may need
tuning against real prose.

Treat it as a working system that wants real use, not a finished product.
If you write with it, findings that fire wrongly are the most useful thing
you can report.

See `docs/design-spec.md` for the full architecture and the reasoning
behind each check.

## Why the QA gate is shaped this way

Most checks in the gate ask whether a chapter is *wrong* — contradicted
facts, dropped threads, outline drift, out-of-character behaviour. Two do
something different, and they exist because of what readers actually
complain about in AI-assisted fiction rather than what is easy to measure:

- **GATE-001 (dialogue naturalness)** — readers of AI-written serials
  rarely say "the plot had a hole." They say the dialogue sounds like
  robots rather than people, and stop reading. Note this is *not* the same
  question as voice consistency: a cast can be perfectly distinct from one
  another and uniformly robotic.
- **GATE-002 (told, not shown)** — a novelist reviewing a 50,000-word
  AI-generated novel named this as its single biggest failure: the
  narration reports each event in sequence instead of staging any of it.

Both are *blocking but contract-eligible*: they stop a chapter finalizing,
but can be released with a stated rationale, because a formal briefing
scene or a deliberate time-skip is legitimate and a check with no way
through would flatten every chapter toward the same safe middle.

There is deliberately **no reader-simulation and no automated verdict on
taste**. Mechanically countable craft problems (repeated phrasing, uniform
chapter openings, dialogue shape, recurring spoken lines, confusable
character names) are computed without a model in `dashboard/craft.py` and
reported as counts, never scores. Whether a scene *works* stays with you.

## Quick start

**`/book-forge:book` is the only command you need.** Run it with an idea,
a project name, or nothing at all. It works out where your book is and does
the next right thing — starting from scratch, resuming a chapter it left
mid-pipeline, briefing you back in after weeks away, drafting, compacting a
closed volume, publishing, or building an upload package — asking only the
questions that shape the book, never which command to run.

Every other command below is machinery `book` drives. They all still work
standalone if you'd rather run one stage deliberately.

## Serialized web novels

A long serial runs for months across many sessions, so four commands
exist for that shape specifically:

- `/book-forge:book-resume` — returning after a gap: what was decided,
  what's unresolved, what's next, without re-reading chapters.
- `/book-forge:book-publish` — record what's actually live on your
  platform. Past that frontier chapters are treated as immutable, so
  reviewers propose fix-forward solutions instead of edits you can't make.
- `/book-forge:book-compact` — compress a closed volume and consolidate
  story-bible Facts Logs, so context cost stays flat at chapter 950 as at
  chapter 50. This is what makes a 1,000-chapter project feasible.
- `/book-forge:book-revise` — read a chapter, decide it isn't working, and
  say so. Your note re-enters the pipeline as a binding constraint and the
  full QA gate re-runs. Refuses on a published chapter, which is immutable.
- `/book-forge:book-export` — an upload-ready package: listing document
  (blurb, tags, characters, cover spec), plain-text chapter files, and a
  posting schedule, built against a real platform profile (Royal Road,
  Webnovel/Qidian, Scribble Hub). For a `complete-book` project it
  instead produces front/back matter, an assembled manuscript, and a KDP
  metadata document.

## Dashboard

A local dashboard visualizes what you're working on — a cover-grid library,
an in-page chapter reader, characters, plot threads with computed urgency,
strand-balance pacing, mechanical craft analysis, and per-project health.
Run `/book-forge:book-dashboard` from Claude Code, or see
`dashboard/README.md` to run it manually.

The backend is Python **standard library only** — no pip install, no
dependencies. The frontend is React built with Vite, and the built output
is not committed, so a fresh clone needs one `npm install && npm run build`
inside `dashboard/frontend/` before the dashboard will serve. After that,
Node isn't needed again — the Python server serves the built files.

## Install

It ships its own single-plugin marketplace manifest, so it installs the
same way any Claude Code plugin does — no manual file copying or symlinks:

```bash
# From your writing workspace, install straight from GitHub:
claude plugin marketplace add JayPing23/book-forge
claude plugin install book-forge@book-forge --scope project
```

To hack on it instead, clone the repo and point the marketplace at your
local copy — the manifest is the same either way:

```bash
claude plugin marketplace add /path/to/your/clone
claude plugin install book-forge@book-forge --scope project
```

Then restart Claude Code in your workspace and run `/book-forge:book-doctor`
to confirm the plugin loaded. Commands from a plugin are namespaced by
plugin name (`/book-forge:book-doctor`, `/book-forge:book-new`), not bare
`/book-doctor` — worth knowing before assuming a command failed to load.

## License

GPL v3 — see `LICENSE`. The bundled `humanizer` skill retains its own
MIT license — see `skills/humanizer/LICENSE`. See `NOTICE` for full
attribution.

## Contributing

See `CONTRIBUTING.md`.
