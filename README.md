# book-forge

A Claude Code plugin for writing complete novels and serialized web
novels with a multi-agent pipeline: research, outline, draft, and a
seven-check QA gate designed to catch plot holes, dropped threads,
voice bleed, robotic dialogue, and out-of-character behavior before a
chapter is finalized.

Forked and localized from
[webnovel-writer](https://github.com/lingfengQAQ/webnovel-writer)
(GPL v3), with a bundled copy of
[humanizer](https://github.com/blader/humanizer) (MIT).

## Status

Early scaffold. See `docs/design-spec.md` for the full architecture
and `docs/plans/` for what's built so far vs. planned.

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

A local React dashboard visualizes what you're working on — overview,
characters, plot threads with computed urgency, strand-balance pacing, and
per-project health. Run `/book-forge:book-dashboard` from Claude Code, or
see `dashboard/README.md` to run it manually.

## Install (local development)

This plugin isn't published to a public host yet, but it ships its own
single-plugin marketplace manifest, so it installs the same way any
Claude Code plugin does — no manual file copying or symlinks:

```bash
# From your writing workspace (e.g. C:\booq):
claude plugin marketplace add ../book-forge   # or the full path to this repo
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
