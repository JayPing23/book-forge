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

This plugin isn't published to a marketplace yet. To use it locally:

1. Clone this repo somewhere on disk.
2. In your writing workspace, create a Windows directory junction (or
   symlink on macOS/Linux) from `.claude/plugins/book-forge` to this
   repo's path.
3. Restart Claude Code in your workspace and run `/book-doctor` to
   confirm the plugin loaded.

## License

GPL v3 — see `LICENSE`. The bundled `humanizer` skill retains its own
MIT license — see `skills/humanizer/LICENSE`. See `NOTICE` for full
attribution.

## Contributing

See `CONTRIBUTING.md`.
