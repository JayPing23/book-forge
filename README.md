# book-forge

A Claude Code plugin for writing complete novels and serialized web
novels with a multi-agent pipeline: research, outline, draft, and a
five-check QA gate designed to catch plot holes, dropped threads,
voice bleed, and out-of-character behavior before a chapter is
finalized.

Forked and localized from
[webnovel-writer](https://github.com/lingfengQAQ/webnovel-writer)
(GPL v3), with a bundled copy of
[humanizer](https://github.com/blader/humanizer) (MIT).

## Status

Early scaffold. See `docs/design-spec.md` for the full architecture
and `docs/plans/` for what's built so far vs. planned.

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
