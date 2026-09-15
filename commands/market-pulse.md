---
description: Refresh market/trend research for a project's genre — distinct from the one-time research /book-forge:book-new runs at project creation. Run this periodically (roughly every 4-6 weeks of active writing, or before starting a new volume) to stay current rather than drafting against a market snapshot from months ago.
argument-hint: <project-name>
---

# market-pulse

`research-agent`'s market-research job runs once, at project creation. That
snapshot goes stale — what's trending on a platform shifts over months, and
a project that runs for a year of real writing time shouldn't keep
outlining against research from its first week. This command re-runs that
specific job on demand, and — unlike the initial run — compares against
what was found last time so the output is "what's changed," not just
another undifferentiated snapshot.

## Process

1. Read `projects/<project-name>/project.json` for genre and
   `platform_convention`.
2. Check `vault/craft-lessons/market-pulse/` for this genre's most recent
   prior pulse (filename convention: `<genre>-<date>.md`). If one exists,
   note its date and findings — this run's job is to identify what's
   *different* since then, not to redo the same research from scratch.
3. Dispatch the same recency-research discipline `research-agent`'s market
   job uses (the `pulse`-style approach: dated sources, recent-window
   search, reader-community discussion where it exists) — scoped to this
   genre and platform, within roughly the last 60-90 days.
4. **Compare against the prior pulse** (if one exists): what's newly
   trending, what's cooled off, what's now oversaturated that wasn't
   before, any shift in what the platform itself is promoting or
   restricting (e.g., a new content policy, a changed algorithm signal).
   If this is the first pulse for this genre, skip the comparison and
   just report the current landscape.
5. Write the dated findings to
   `vault/craft-lessons/market-pulse/<genre>-<date>.md`, wikilinked to the
   project. Every claim needs a dated source — the same discipline
   `research-agent` follows, not a downgrade to vibes because this is a
   "quick check."
6. **Only surface an actual recommendation if something material
   changed.** If the market picture is basically the same as last time,
   say so plainly and briefly — don't manufacture a finding to justify
   the run. A pulse that reports "nothing significant changed" is a
   successful, useful result, not a failure to find something.

## When to run this

There's no automated scheduler here — Claude Code doesn't run on a timer
between sessions. Prompt the user to run this themselves, roughly every
4-6 weeks of active writing on a project, or before planning a new volume
(`web-novel-outline-agent` extending its rolling chapter window is a
natural trigger point to check whether the market assumptions behind the
volume plan still hold). `/book-forge:book-doctor` can note a pulse's age
if one exists, as a reminder — it does not run this command automatically.

## Hard rules

- Never treat this as a substitute for `research-agent`'s deeper
  craft-research job (genre convention, structural analysis) — this
  command only refreshes the recency-sensitive market half, not the
  evergreen craft half.
- Never claim a trend shifted without a dated source for the claim — the
  same citation discipline as the original research-agent job applies
  here, not a relaxed version of it.
- Never silently skip the comparison step when a prior pulse exists —
  even "nothing changed" is a comparison result, not an excuse to omit it.

## Error handling

| Situation | Handling |
|---|---|
| No prior pulse exists for this genre | Run as a fresh landscape check, same as `research-agent`'s original job, and note that no prior comparison was available |
| Platform/genre-community sources are thin or contradictory | Say so explicitly rather than presenting a confident trend read on weak evidence |
| Project has no `platform_convention` set (a complete-book project) | Scope the pulse to general genre-readership trends (bestseller lists, genre discussion) rather than a specific serialization platform's signals |
