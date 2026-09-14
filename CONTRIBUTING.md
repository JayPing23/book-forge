# Contributing to book-forge

This is an early-stage project — the architecture is still settling.
Before proposing a large change, open an issue describing the
problem you're hitting, not just the fix, so the design conversation
happens before the code does.

## What's useful right now

- Reports of a chapter the QA gate should have caught but didn't (or
  a false positive it flagged incorrectly) — include the story-bible
  entry and the chapter text involved.
- Genre template contributions for the Web Novel project type.
- Translation/localization fixes — this plugin is a full re-localization
  of a Chinese-language tool, and some conventions may not have
  translated cleanly.

## What to avoid

- Pull requests that change the QA gate's pass/fail behavior without
  a specific failure example that motivated the change.
- New agents or commands that duplicate an existing one under a
  different name — check `docs/design-spec.md` first.

## License

By contributing, you agree your contribution is licensed under this
project's GPL v3 license (see `LICENSE`).
