# Book Workspace: Multi-Agent Novel & Web Novel Writing System

**Status:** Draft for review
**Date:** 2026-09-14

## Purpose

`C:\booq` becomes a standing workspace for producing original fiction — complete
novels for Kindle/KDP and serialized web novels for platforms like Webnovel/Qidian —
with a multi-agent pipeline that actively fights the two failure modes that make AI
fiction read as "sloppy": plot holes / continuity drift, and flat, interchangeable
characters. Depth of characterization and theme is a tunable dial per project;
plot integrity, voice consistency, and continuity are never optional, at any dial
setting.

The system draws capability from six reference projects (below) but is not a
straight install of any one of them — it's a purpose-built pipeline that borrows
the strongest piece of each.

## Source material and what's actually used

| Project | What it is | Role in this system |
|---|---|---|
| [webnovel-writer](https://github.com/lingfengQAQ/webnovel-writer) | Claude Code plugin: 4 agents, RAG memory, versioned chapter chain, built for Chinese web novels | **Forked and localized** as `book-forge` — becomes the chapter-chain, RAG memory, and QA-gate substrate for the Web Novel project type. All Chinese directory names, UI text, and 37 genre templates are translated/rebuilt for English content. |
| [OpenViking](https://github.com/volcengine/OpenViking) | Self-hosted agent context database (`viking://` virtual filesystem, vector search, MCP integration) | **Not used.** Originally planned as the shared vault; replaced by an Obsidian vault (below) after review — OpenViking is AGPLv3 (stricter than GPL: copyleft triggers on network use, not just distribution — a real concern only if a future hosted/multi-user version modified its source), its Claude Code MCP wiring is under-documented and would have needed a validation spike, and it requires running a server. Obsidian achieves the same cross-project memory role with none of those costs. |
| [humanizer](https://github.com/blader/humanizer) | Claude Skill: rewrites text to remove 25 AI-writing tells | **Installed as-is** as a Claude Skill, run as the final prose pass on every chapter. |
| [ai-book-writer](https://github.com/adamwlarson/ai-book-writer) | Python/AutoGen 6-agent book pipeline (Planner, World-builder, Memory-keeper, Writer, Editor, Outliner) | **Architectural reference only** — the Planner/Outliner role split informs the new Complete-Book outline agent. The AutoGen framework/code is not reused; everything runs as Claude Code agents/skills. |
| [AI-Novel-Writer](https://github.com/EthanYoQ/AI-Novel-Writer) | Electron desktop app, no agents, no memory system | **Not used.** Doesn't fit the orchestration/memory model; a GUI app is a separate concern from this pipeline. |
| [agentmemory](https://github.com/rohitg00/agentmemory) | Generic local memory MCP server for coding agents | **Not used** — superseded by the Obsidian vault, which is a better fit for human-browsable creative memory than code-agent context. |
| [obsidian-skills](https://github.com/kepano/obsidian-skills) (installed plugin) | Claude Code skills for Obsidian: `obsidian-markdown` (wikilinks/properties/callouts), `obsidian-bases` (filterable structured views over notes), `json-canvas` (visual node/edge diagrams), `obsidian-cli`, `defuddle` (clean web-content extraction) | **Installed and used directly** — becomes the vault backend (story bible, plot-thread ledger, cross-project craft lessons), the structured-view layer over that data, and visual relationship/timeline maps. `defuddle` cleans Research Agent web pages before the copyright-filtering step. |
| [agenthub](installed plugin) | N parallel agents compete on one task in isolated git worktrees, ranked by metric or LLM-judge, winner merged | **Adopted narrowly, opt-in**: `/book-write --compete=N` for high-stakes chapters (opening, climax) and for cross-checking the Research Agent's reference analysis, where independent attempts genuinely reduce hallucination risk. Not default behavior — too expensive to run on every chapter once the QA gate is solid. |
| [agent-harness](installed plugin) | Goal → plan → verify → close bounded loop: independent verification (never self-adjudicated), retry with hard caps, mandatory escalation on exhausted budget, persistent state for session-resumability | **Adopted as the QA-gate discipline** — see Orchestration flow below. Fixes a real gap in the original design (no retry cap, no escalation path, no persistent per-chapter state). |
| [deep-research](installed plugin) | Disciplined multi-source investigation: falsifiable hypotheses, ≥3-source triangulation per claim, adversarial pass, per-source files with verbatim quotes | **Adopted for the Research Agent's craft-research job**, scaled down from its full 9-phase pipeline — see Research Agent section. |
| [pulse](installed plugin) | Recency-oriented Reddit/HN/web research within a time window, rate-limited and citation-tracked | **Adopted for the Research Agent's market-research job** — see Research Agent section. |
| [memory-engineering](installed plugin) | Audits/prices agent memory systems; blocks a design with no explicit forgetting policy | **Adopted as the vault's forgetting policy** — see Vault forgetting policy section below. |
| [context-engineering:x-to-book-system](installed plugin, worked example) | A full worked design for a multi-agent book-production system: supervisor pattern, per-agent context budgets, file-system coordination, weighted multi-dimensional evaluation | **Adopted for context management and the QA gate's quality score** — see Context management and Orchestration flow sections. |

Net-new work not covered by any reference project: the **Research Agent**'s live
market/craft research (built on Claude Code's WebSearch), the **plot-thread
ledger**, **character voice profiles**, **character motivation cores**, the
**world iceberg** tier, and the **Depth Dial** setting.

## Workspace layout

`C:\booq` is itself the Obsidian vault root (opening this folder in Obsidian is
the entire setup — no separate vault location). `.claude/` and `.story-system/`
etc. sit alongside the note content; Obsidian's "excluded files" setting keeps
non-note folders out of its index, which is a config detail, not an
architecture concern.

```
C:\booq\                          # Obsidian vault root
├── vault\                        # shared cross-project layer (was OpenViking's role)
│   ├── craft-lessons\            # notes: what worked/didn't, prose patterns, humanizer tuning
│   ├── canvas\                   # json-canvas maps that span projects
│   └── bases\                    # obsidian-bases structured rollup views
├── .claude\
│   ├── plugins\book-forge\       # forked + English-localized webnovel-writer
│   ├── skills\humanizer\         # installed as-is
│   ├── skills\light-novel-style\ # new: accessible-prose conventions layered on humanizer
│   └── commands\                 # /book-start, /book-idea, /book-new, /book-write, /book-export,
│   │                             # /book-cover, /book-learn, /book-doctor, /book-dashboard, /market-pulse
└── projects\
    ├── <standalone-book-name>\   # a single, unconnected book — layout as below
    │   ├── project.json          # project type, genre, depth dial, platform convention,
    │   │                         # ip_status (original|fan-fiction), monetization_allowed
    │   ├── story-bible\          # notes: characters (voice + motivation), world (+ iceberg),
    │   │   │                     # rules, plot-threads — see Story bible schema below
    │   │   └── plot-threads.base # obsidian-bases filterable ledger view over thread notes
    │   ├── outline\               # volume/chapter plan
    │   ├── manuscript\           # chapter text
    │   ├── reviews\              # QA reports per chapter
    │   ├── canvas\               # json-canvas: character relationship map, timeline
    │   ├── .story-system\        # versioned chapter chain (kept from the fork)
    │   └── .project-memory\      # chapter-state\<id>.json — per-chapter QA state machine
    └── <series-name>\            # optional grouping for a trilogy/series of linked books
        ├── series-bible\         # world + recurring-character notes shared across all books
        ├── series-memory\        # plot-thread notes for threads spanning multiple books
        ├── book-1\               # ordinary project folder, same layout as a standalone book
        ├── book-2\
        └── book-3\
```

## Project types

Chosen at `/book-new`, this fork changes which outline agent and pacing rules apply:

| | Complete Book | Web Novel |
|---|---|---|
| Structure | Fixed-length, three-act / genre beat-sheet, no padding | Arc-based, chapter-by-chapter, sustained length, per-chapter hook required |
| Outline agent | New Planner/Outliner (ai-book-writer role split, native implementation) | Forked `book-forge` chapter chain |
| Outline granularity | Scene-level, not just chapter-level beats — see Grounding in published research below | Scene-level, same reasoning |
| Platform convention | N/A — manuscript for KDP/Kindle | Configurable setting at project creation (Webnovel/Qidian, Royal Road, or custom) — drives chapter length and cliffhanger cadence |
| Genre templates | Western genre beat sheets | English-localized versions of the fork's templates |

## Depth Dial

A project-level setting, chosen at `/book-new` alongside project type:

- **Popcorn** — plot-forward, emotion-immediate (laughs, scares, tears), minimal introspection
- **Balanced**
- **Literary/Deep** — rich interiority, slower burn, thematic weight

This scales how much the Research Agent and character-creation step invest in
motivation cores and world-iceberg depth, and how much interior monologue the
Writer includes per chapter. **It does not scale down** plot-hole checking, voice
consistency, or continuity enforcement — those run identically at every depth
setting.

## Story bible schema (new/expanded fields)

Every character, world element, and plot thread is an individual Obsidian note
(`obsidian-markdown`): YAML frontmatter properties carry the structured fields
an agent parses directly; prose sections carry the narrative detail; wikilinks
connect a character to the world elements, other characters, and threads they
touch. A `.base` file per project (`obsidian-bases`) gives a filterable table
view over each note type — the "ledger" is a query, not a hand-maintained file.

- **Character Voice Profile** (per named character note with dialogue):
  frontmatter properties for speech register, vocabulary ceiling/floor,
  verbal tics/catchphrases; prose section for how background surfaces in
  syntax and word choice (not phonetic accent spelling), how emotion shifts
  baseline register, what they would never say.
- **Character Motivation Core** (same character note, set at creation before
  any plot touches them): want, need, fear, unhealed wound, worldview, default
  decision-making pattern. Exists independent of any specific scene.
- **World Iceberg** (world notes): unstated world logic, history, and cultural
  norms — most never directly told to the reader, but what makes character
  behavior read as *their normal* rather than authorial convenience.
- **Plot-thread ledger**: each thread is its own note in `story-bible\` with
  frontmatter properties `status` (open/paid-off), `introduced_chapter`, and
  `payoff_chapter` (or `payoff_book` for series-spanning threads), wikilinked
  to the characters/world elements involved. `plot-threads.base` renders all
  of them as a sortable, filterable table — open threads, overdue payoffs,
  threads per character — without any custom parsing code.

## Series / trilogy support

A book can stand alone (`projects\<book-name>\`) or belong to a series
(`projects\<series-name>\book-N\`). Series grouping adds two shared layers above
the individual books:

- **`series-bible\`**: world and recurring-character notes that hold across
  every book in the series, same note format as book-level `story-bible\`.
  Book-level notes are checked first; wikilink resolution falls back to
  `series-bible\` when a character or world element isn't defined locally.
  New notes default to book-local scope — an explicit promotion step (part of
  a book's finalization, alongside `/book-learn`) moves notes that should
  persist series-wide up into `series-bible\`.
- **`series-memory\`**: plot-thread notes for threads that span multiple books
  (a mystery seeded in book 1, paid off in book 3) use `payoff_book` instead
  of `payoff_chapter` in frontmatter. The Thread-Ledger Reviewer checks a
  book's chapters against both its own local thread notes and the
  series-level ones (a series-wide `.base` view can union both folders).

A standalone book has no series-bible/series-memory layer — its own story-bible
and `.project-memory` are the only source of truth.

## Research Agent

Runs automatically at `/book-new`, before the outline agent starts. Two jobs,
each borrowing discipline from a different reference skill rather than running
undifferentiated WebSearch:

1. **Craft research** (borrows `deep-research`'s discipline, scaled down from
   its full 9-phase pipeline): how the chosen genre is actually structured
   (e.g., for a detective novel: whodunit fair-play-clue convention vs.
   hardboiled/noir vs. cozy). Every claim about genre convention is
   triangulated across ≥3 independent sources before being treated as fact,
   an adversarial pass questions the chosen convention before it's locked in,
   and each source is saved with a verbatim, attributed quote rather than a
   paraphrase — a genre-convention claim should be defensible, not a
   confident guess.
2. **Market research** (borrows `pulse`'s discipline): what's currently
   popular vs. oversaturated vs. niche on the target platform, right now —
   not evergreen genre facts, current landscape. Reddit + web search within a
   recent time window (web-novel/light-novel reader communities discuss
   trends there directly), rate-limited and citation-tracked, distinct from
   the craft research above because this question is inherently time-bound
   and needs recency, not triangulated permanence.

For every project, the agent also selects **3-5 fresh genre-appropriate reference
novels** (chosen per-project, not from a fixed list) and analyzes their
*structure and technique only*: pacing, chapter-hook technique, how they seed and
pay off plot threads, and how they differentiate character voice by
class/background/personality through dialogue patterns. Source pages are
cleaned via `defuddle` before analysis. This analysis is stored as
structural/stylistic notes in `vault\craft-lessons\`, wikilinked to the genre
and project that produced them.

**Hard constraint:** this analysis is never storage or reproduction of the
copyrighted source text — only structural and technique-level notes, the same
level of abstraction a human author studying their genre would take away. No
full-text ingestion of copyrighted novels.

## Grounding in published research

A web-search pass (not the full `deep-research` skill — that's gated to
explicit user invocation and can be run separately for deeper rigor) checked
this design against published work on long-form LLM fiction generation. The
overall architecture — orchestrator + specialized agents, outline-first
generation, retrieval-grounded drafting — matches [Agents' Room (DeepMind,
ICLR 2025)](https://arxiv.org/abs/2410.02603), which found exactly this shape
outperforms monolithic generation for long narratives. Four concrete
refinements came out of this pass, applied below:

1. **Outline granularity** ([DOC, ACL 2023](https://arxiv.org/abs/2212.10077)):
   detailed, hierarchical, scene-level outlines built *before* drafting reduce
   plot-incoherence more than catching it after the fact (22.5% absolute
   gain in the paper's evaluation). The Outline Agent's output must reach
   scene-level detail, not stop at chapter-level beats — the
   Outline-Adherence Reviewer is a safety net, not the primary mechanism.
2. **Reviewer scope, sharpened by an actual error taxonomy**
   ([ConStory-Bench, Microsoft Research](https://arxiv.org/html/2603.05890v1)):
   its 5-category/19-subtype taxonomy names two failure modes our five
   reviewers didn't explicitly cover — world-rule/setting violations (a
   magic-system rule established in chapter 3, broken in chapter 12) and
   small detail mismatches (nomenclature, appearance, quantities changing
   without explanation). Both now belong explicitly to the Continuity
   Reviewer's checklist, not left implicit under "contradicts established
   facts."
3. **Errors cluster at 40-60% of narrative length, not the opening/climax.**
   The same taxonomy work found this empirically, which cuts against the
   intuitive assumption that bookend chapters need the most scrutiny. The
   QA gate runs identically on every chapter regardless of position (already
   true in this design), but `--compete=N`'s guidance is corrected below —
   the middle of a book is evidence-backed as at least as failure-prone as
   the opening or climax, not less.
4. **Motivation/Agency checking at action granularity, not just per-chapter**
   ([persona-grounded generation, 2025](https://arxiv.org/html/2607.00918)):
   this paper's critic-revision loop evaluates each proposed character
   action against their persona *before* it's accepted into the scene, not
   once against a finished chapter. Where a chapter has a pivotal
   character decision, the Motivation/Agency Reviewer should be able to
   flag it as failing at the specific paragraph/beat, not just the chapter
   as a whole — sharper localization, same check.

## Orchestration flow

**`/book-start`** is the single entry point for a new book: it chains
`/book-idea` → `/book-new` → chapter 0001's full `/book-write` pipeline
continuously, skipping the "ready to continue?" checkpoint each of those
commands has when run standalone, while still asking every question that
actually shapes the book (genre, protagonist, constraints, `ip_status`,
etc.). It stops after chapter 0001 finalizes or escalates — the intent is
one command producing real drafted, QA'd output the author can react to,
not unattended multi-chapter drafting. Running the three commands
separately still works identically to before; `/book-start` only changes
the handoff behavior between them. See `commands/book-start.md`.

**`/book-new`** (optionally preceded by `/book-idea` for a blank-page
start — see the Ideation Agent section):
1. Pick project type (complete-book / web-novel), genre, depth dial, and (if
   web-novel) platform convention.
2. Research Agent runs automatically (craft + market research, reference
   selection and structural analysis).
3. Outline agent (type-dependent) produces the volume/chapter plan, seeded by
   research output.
4. Character creation: voice profiles and motivation cores set before any
   chapter is drafted.

**`/book-write <chapter>`:** driven as an agent-harness-style state machine,
persisted to `.project-memory\chapter-state\<id>.json` at every step — a fresh
session can resume a chapter mid-pipeline by reading that file alone, with no
conversation history required. Current implementation: see
`commands/book-write.md` for the authoritative step-by-step (this section
is a summary, kept in sync but not a substitute for it).

1. **Beat validity pre-check** (cheap, pre-draft): the planned beat is
   checked against story-bible facts, the prior chapter's ending, and
   recent-beat repetition *before* any prose is written — catches a broken
   outline beat before paying for a full draft-and-review cycle on it.
2. **Context Agent** (project continuity from `.project-memory`) and a
   **vault lookup** (relevant notes from `vault\craft-lessons\`) run in
   parallel — both are read-only grounding lookups.
3. Primary agent drafts the chapter using that grounding plus the chapter's
   planned beat. Optionally, `--compete=N` runs N independent drafts in
   isolated git worktrees (agenthub pattern) and an LLM-judge pass picks the
   winner — opt-in, not default behavior. Reserve it for chapters that
   actually carry more risk: the opening (first-impression risk), the
   climax, *and* chapters in the middle third of the book/arc — published
   error-clustering data (see Grounding in published research) puts
   consistency errors at 40-60% of narrative length, not concentrated at the
   bookends intuition suggests.
4. **Six** independent, parallelizable checks run against the draft, each
   reading the story-bible/ledger notes directly rather than trusting the
   Writer's own account of what it did (no check is self-adjudicated):
   - **Continuity Reviewer** — contradicts established story-bible facts (reading each note's status-lifecycle Facts Log), world rules/setting (a magic-system rule broken, a geography contradiction), or small details (nomenclature, appearance, quantities changing without explanation)? Pass/fail with citation, not a subjective score.
   - **Thread-Ledger Reviewer** — owns HARD-002 (broken promise: does this chapter respond to the prior chapter's ending hook?); also introduces an unlogged setup, or drops a thread that owed a payoff (urgency computed from tier weight × elapsed/recovery-window)?
   - **Outline-Adherence Reviewer** — diffs the chapter against its planned scene-level beats, catching drift before it compounds.
   - **Voice-Consistency Reviewer** — checks each dialogue line against its speaker's voice profile, flags voice bleed, POV/perspective slips, and tone shifts.
   - **Motivation/Agency Reviewer** — checks whether each character action traces to their motivation core and the world's internal logic, or only makes sense because the outline needed them there; flags the specific paragraph/beat responsible, not just the chapter as a whole.
   - **Clarity Reviewer** (added after a gap was found — no other reviewer checked this) — owns HARD-001 (readability floor: can a reader tell what happened, who, and why), HARD-003 (pacing disaster: N consecutive chapters with zero progression), and HARD-004 (conflict vacuum: does this chapter have an identifiable problem/goal/stakes).
5. **Humanizer + light-novel-style skills** run last, as a prose pass on a
   draft that has already passed structural QA — style polish is not asked to
   also catch plot holes.
6. **Weighted quality score** (a seventh signal, distinct from the six
   pass/fail checks): coherence, insight/scene-craft quality, and readability,
   scored and weighted the way `x-to-book-system`'s evaluation stage does.
   The six checks above catch binary violations — plot holes, voice bleed,
   dropped threads, unreadable/static chapters. None of them catch a chapter
   that passes every check and is still just bland. A score below threshold
   doesn't block finalization the way a failed check does, but it does flag
   the chapter for your review rather than silently shipping
   mediocre-but-technically-correct prose.
7. **Revision loop with a hard cap, and Override Contracts for soft findings**:
   a **Hard Invariant** failure (HARD-001 through HARD-004, per the
   `qa-standards` skill) is never overridable — the primary agent revises
   and only the failing check re-runs, up to 3 attempts, then escalates. A
   **soft-guidance** finding (weak hook, missing micro-payoff, a deliberate
   pacing/voice/outline deviation) can instead be resolved via an **Override
   Contract** — a logged, reasoned trade-off with a `rationale_type` from a
   fixed taxonomy, tracked as debt. Three or more contracts with the same
   reviewer + rationale_type in one project trigger a prompt to either fix
   the recurring issue or promote it to a standing story-bible/
   genre-template rule — see the Self-improvement loop section. Exhausting
   the Hard Invariant attempt cap is never a pass: the chapter's state moves
   to `escalated`, the specific failure and evidence are surfaced to you,
   and the pipeline stops rather than forcing the chapter through or
   looping indefinitely.
8. Chapter commits to the versioned chapter chain (`.story-system`), with
   provenance metadata (AI-drafted vs. human-revised proportion) recorded
   alongside it for future KDP AI-disclosure compliance.
9. **Deconstruction Agent** extracts new facts into each affected note's
   status-lifecycle **Facts Log** (active/outdated/contradicted/tentative —
   an update never silently overwrites a prior value, a genuine
   contradiction is flagged rather than resolved unilaterally) and, for
   chapters scoring ≥80, captures 1-3 strong passages into
   `story-bible/style-exemplars/` classified by scene type — this book only,
   plot- and voice-specific, not durable cross-project craft knowledge.
10. `/book-learn` pushes durable craft lessons (what worked, what didn't,
    prose patterns, humanizer tuning) — not plot facts — up to
    `vault\craft-lessons\`, so the next project, any genre, starts smarter.
    `/book-forge:market-pulse` separately refreshes the market-research half
    of Research Agent's job on demand, since that snapshot goes stale over a
    project's real timeline in a way craft lessons don't.

## Context management (borrowed from `x-to-book-system`)

Two rules, adopted directly from `context-engineering`'s own worked example
for a multi-agent book-production system:

- **Raw output never flows through the primary agent's context wholesale.**
  Research Agent's web-search results, full chapter drafts, and reviewer
  evidence logs are written to files (story-bible notes, `.project-memory`,
  `vault\craft-lessons\`); the primary agent reads summaries or specific
  files it needs, not a firehose of everything every subagent produced. This
  is what keeps a hundred-chapter project from degrading the primary agent's
  context over time.
- **Progressive disclosure**: the outline loads first and stays lightweight;
  a chapter's full story-bible/vault grounding loads only when that specific
  chapter is being drafted or reviewed, not the whole project's history on
  every `/book-write` call.

## Vault forgetting policy (required, per `memory-engineering`)

`vault\craft-lessons\` accumulates indefinitely across every project unless
this is designed in now — `memory-engineering`'s core finding is that a
memory design isn't done without an explicit forgetting rule, and more raw
memory can make an agent *worse*, not better. Three rules for the
cross-project vault specifically:

- **Classify before storing.** A craft-lesson note is either a durable
  *fact/skill* (a technique that generalizes: "chapter-opening hooks that
  ask a question outperform ones that describe a setting") or a project-local
  *log* (a one-off observation that doesn't generalize). Only facts/skills
  get promoted to `vault\craft-lessons\` via `/book-learn`; logs stay in the
  originating project's `.project-memory`.
- **Never auto-merge contradictions.** If a new craft lesson conflicts with
  an existing vault note, both are kept and the conflict is surfaced as a
  flagged note for you to resolve — never silently overwritten or averaged.
  This is a natural fit for Obsidian: a `#needs-review` tag and a
  backlink between the two conflicting notes, not a merge.
- **Prune, don't just accumulate.** Vault notes get revisited periodically
  (not specified further here — a candidate for its own small spec once the
  vault has enough real content to audit) rather than assumed permanent by
  default.

## Self-improvement loop

The system is meant to actually get better at writing *for this author*
the more it's used — not just accumulate files. Four mechanisms do this,
each addressing a different dimension of "better," plus one piece
deliberately deferred:

1. **Fact accuracy** — the Facts Log status-lifecycle
   (active/outdated/contradicted/tentative) on every character/world note.
   A contradiction between chapters becomes visible and flagged instead of
   silently overwritten, so the story-bible's reliability doesn't quietly
   degrade over a long project the way a flat "current state" field would.
2. **Voice-matching** — the style-exemplar library
   (`story-bible/style-exemplars/`). Chapters scoring ≥80 on the QA gate's
   quality score contribute 1-3 passages, classified by scene type, that
   future drafting retrieves as models of this author's actual demonstrated
   voice — not abstract craft advice, but "here's what *your* good dialogue
   scenes actually read like." This is genuinely per-author: two writers
   using book-forge on the same genre accumulate different exemplar
   libraries and drift toward different voices, because they're each
   modeling their own best work.
3. **Craft calibration** — two feeding paths into `vault/craft-lessons/`:
   `/book-forge:book-learn`'s periodic, deliberate promotion of durable
   technique (existing mechanism), and the Override Contract system's
   repeated-pattern detection (`qa-standards`): three or more Override
   Contracts for the same reviewer + rationale_type in one project is a
   signal that either a standing story-bible/genre-template rule is
   missing (the "violation" is actually a consistent authorial choice
   that should stop tripping the guidance at all) or there's a genuine
   recurring weakness worth fixing. Either way, repeated friction becomes
   a prompt to actually adapt the system, not an accumulating pile of
   individually-approved exceptions.
4. **Market awareness** — `/book-forge:market-pulse`, run periodically
   (book-doctor flags staleness past ~6 weeks) rather than the one-time
   research `research-agent` does at project creation. Each run compares
   against the prior pulse to surface what's actually changed.

**Reference-work "fix the execution" workflow.** `ideation-agent`'s Step 0
asks two questions when a reference work is named, not one: what worked
(the premise/hook to preserve) and what didn't (specific execution
problems — pacing, an undercutting genre convention, tonal baggage like
heavy-handed ideological framing common to a market) the author wants
this book to actively avoid. The second answer feeds directly into the
premise's `anti_trope_rule`/`hard_constraints` fields, which
`context-agent` now reads at every chapter's grounding step (not just
outline creation) and folds into the writing brief every time — a
standing constraint like "no propaganda-style framing" has to reach the
drafting agent on every chapter to actually hold, not just the chapter
where it was first set.

**Model tiering.** The four QA reviewers doing comparatively mechanical
pattern-matching against a fixed reference (`continuity-reviewer`,
`thread-ledger-reviewer`, `outline-adherence-reviewer`,
`voice-consistency-reviewer`) run on a cheaper/faster model
(`model: haiku` in their agent frontmatter). `clarity-reviewer` and
`motivation-agency-reviewer` — which require more interpretive judgment
(readability, pacing, whether an action traces to a character's actual
motivation) — and every creative/drafting agent stay on whatever model
the author's session is running (no `model:` override, i.e. inherit).
This is a cost lever, not a quality one: since every chapter runs all six
reviewers, this is the highest-volume call site in the whole pipeline.

**Cover art.** `cover-brief-agent` (via `/book-forge:book-cover`) produces
a text art-direction brief — subject, composition, palette, mood,
typography direction, comp titles — grounded in the project's story-bible
and outline. It does not render an image; no image-generation tool is
available in this environment, and the agent says so explicitly rather
than faking one. The brief is the input to a separate step (a commissioned
artist, or an image-generation tool run outside book-forge) — see
`commands/book-cover.md`.

**Manuscript file format.** `manuscript/` holds one Markdown file per
chapter (`<chapter_id>-<title-slug>.md`, frontmatter + prose), never one
growing book-length file — this holds for every project type, including
`complete-book`, so the revision loop, QA gate, and git history all stay
scoped to the chapter actually being touched. `/book-forge:book-export`
is the one place that assembles finalized chapters into a single document
(for submission, or a web-novel "everything published so far" snapshot);
it reads `manuscript/`, never writes to it. Paragraph formatting is
platform-conditional: `web-novel` projects default to short paragraphs
(1-4 sentences, blank-line separated) for phone-screen scanability, on
top of `light-novel-style`'s rhythm guidance, not instead of it;
`complete-book` projects use ordinary prose paragraphing. In-world
system/status-window formatting (LitRPG-style `[System]` popups, stat
blocks) is deliberately left unspecified here — it's a per-project
stylistic choice the author records as a `hard_constraint` when ready,
not a platform default this pipeline imposes. See
`commands/book-write.md`'s finalize step.

**Opening-chapter and longitudinal checks.** Three QA-gate checks
activate conditionally rather than on every chapter, each grounded in a
structural pattern rather than any claim about individual reader taste:
`thread-ledger-reviewer`'s opening-hook-intensity check and
`clarity-reviewer`'s opening-scene-positioning check (chapters 0001-0003)
target the opening drop-off; `voice-consistency-reviewer`'s
longitudinal-drift check (every 20th chapter) compares current dialogue
against early style-exemplars rather than only the static Voice Profile
note, catching slow drift that per-chapter checks miss by design. All
three are soft guidance (Override-Contract eligible), not new Hard
Invariants — see each reviewer's own spec.

**Two different curves, not a contradiction.** The `--compete=N` guidance
above says error-clustering data puts *consistency failures* at 40-60% of
narrative length, "not concentrated at the bookends intuition suggests" —
while the opening-chapter checks target the *opening*. These describe
different phenomena and both hold at once: **where the writing breaks**
(consistency/continuity errors, per ConStory-Bench, mid-book) is not
**where the reader leaves** (retention drop-off, per platform author
reports, chapter 1 → 2). Mid-book gets the expensive independent-draft
treatment; the opening gets a cheap extra check on hook strength and
conflict positioning. Note the evidence tiers differ too: the
mid-book clustering claim comes from published research, the opening
retention claim from platform-community self-reports — weaker, and
labeled as such at the point of use.

**Manuscript auto-backup.** `/book-forge:book-write`'s finalize step
commits the finalized chapter, its state file, and everything the
post-finalize step touched to git, if the workspace is a git repo — a
disaster-recovery safety net, never a push to a remote, and silently
skipped for a non-git workspace.

**Pre-outline interrogation pass.** Before the outline agent locks a
plan, `/book-forge:book-new` runs a `grill-me`-style one-question-at-a-time
coherence pass across the premise's own fields (does the special
advantage trivialize the core conflict, does the protagonist's flaw
actually create friction against their desire, etc.) — required for
`complete-book` projects (a fixed-length outline is expensive to
restructure once chapters are drafted against it), optional for
`web-novel` (the rolling outline is cheaper to patch as you go). This
catches cross-field incoherence the ideation sufficiency gate doesn't —
that gate confirms fields are filled, not that they agree with each
other.

**Override Contract debt visibility.** The dashboard's System Health page
now reads `.project-memory/override-contracts.json` directly and surfaces
the same 3+-same-reviewer-plus-rationale pattern `qa-standards` already
detects at write time, so it's visible without re-deriving it from the
raw log. Deliberately not built: a per-chapter cost/token-usage panel —
nothing in the pipeline currently records actual token spend, and a
fabricated number would be worse than no panel at all.

**Deliberately deferred: reader-feedback ingestion.** Learning from actual
published-book reviews/comments once a book is live (external platform
review scraping, sentiment analysis feeding back into craft lessons or
story-bible decisions) is out of scope for this spec. It was raised
explicitly during design and set aside as a distinct, later problem —
integrating with external publishing-platform APIs is its own scope
(auth, rate limits, platform-specific review formats) and belongs with
the publishing-pipeline follow-up spec, not bolted onto the writing loop
described here. Noting it here so it isn't lost: the natural integration
point, when that spec gets written, is a new ingestion path feeding into
the same `/book-forge:book-learn` promotion mechanism already described
above — reader feedback would become another *source* of candidate craft
lessons, subject to the same classify/never-auto-merge/prune discipline
the vault already applies to everything else.

## Risks and open technical unknowns

- **Localizing `book-forge` is real translation work**, not a config flip —
  four agents' prompts and 37 genre templates need rebuilding for English
  content, not just directory renames.
- **GPL v3** (webnovel-writer's license) is fine for private local use. Only
  relevant if the customized `book-forge` fork is ever redistributed publicly.
- **Obsidian vault**: no server, no MCP integration to validate, no copyleft
  license exposure — using the desktop app to browse the vault is optional
  (the notes are just markdown files either way); Claude Code reads/writes
  them directly via the installed `obsidian-*` skills.
- **Copyright**: reference-novel analysis is structural/technique-level only,
  never full-text storage — see Research Agent section above. This also
  applies to material entering via WebSearch: fan wikis and quote-aggregation
  pages routinely embed verbatim copyrighted passages, so the Research
  Agent's ingestion step must strip direct quotations from source pages
  before anything is written to the vault — the constraint is "no verbatim
  copyrighted text in the vault," not just "no full novels."
- **Not legal advice.** This section surfaces licensing/IP exposure worth a
  qualified IP/copyright attorney's review before any commercial publishing,
  particularly anything built on the fan-fiction path below.

## Packaging & distribution

This system is now built to be shared, not just used privately — other
writers should be able to clone it, use it, and suggest improvements. That
splits the workspace into two repositories:

- **`book-forge`** (new, separate git repo): the reusable plugin. Every
  agent (Research, Ideation, Context, the six QA reviewers, Deconstruction,
  both outline agents), the `light-novel-style`/`payoff-craft`/
  `qa-standards` skills, `humanizer` bundled
  in-repo (MIT license, attribution notice preserved), every slash command,
  project-scaffolding templates (empty skeletons, not real content), and
  this design spec itself — recast as the plugin's own architecture
  documentation, since that's what a contributor needs to read, not a
  planning artifact for one user's private project. Structured as an
  installable Claude Code plugin (its own `.claude-plugin/` manifest,
  following the same convention `webnovel-writer` itself uses), so it
  installs via the standard marketplace mechanism rather than being copied
  by hand.
- **License: GPL v3, not a preference — a requirement.** `book-forge`
  derives from `webnovel-writer` (GPL v3); GPL's copyleft means the whole
  combined distributed work must carry the same license. The repo carries a
  `LICENSE` file, attribution to the original `webnovel-writer` project, and
  a `NOTICE` for the bundled MIT-licensed `humanizer` skill.
- **`C:\booq`** stays the personal instance: installs `book-forge` as a
  plugin; `projects\` (manuscripts, story bibles) and `vault\` (craft
  lessons, personal notes) remain private and are never part of the plugin
  repo's history.
- **Contribution path**: README + `CONTRIBUTING.md` in the `book-forge` repo
  describe how to suggest changes (issues/PRs once it has a public host).
  Publishing to any public or shared host is a separate, explicit decision —
  not assumed by this spec.

## Available but not adopted

- **`book-to-skill`**: if you own actual craft/writing-technique books
  (rather than relying on web research), this plugin converts them into a
  queryable skill the Outline/Research agents can consult — extracts
  structure, never reproduces text at length, and has its own rights gate
  before any packaging/redistribution. Not built into the default pipeline;
  available to invoke yourself against a specific owned book whenever you
  want deeper craft grounding than web research provides.
- **`content-humanizer`** (marketing-skills): a different tool than
  `blader/humanizer`, oriented at brand/marketing voice with a numeric
  AI-tell score. Not a fit for chapter prose — the right fit later for the
  deferred publishing pipeline's back-cover copy and platform descriptions.

## Explicitly out of scope (deferred to a future spec)

- Publishing/export pipeline: Webnovel chapter formatting, KDP/Kindle
  formatting and metadata.
- Fan-fiction commercial-use handling (Amazon KDP does not allow monetizing
  copyrighted-IP fanfiction; posting free fan content is a separate, unaddressed
  question here). **Data-model guardrail added now, even though the pipeline is
  deferred**: `project.json` gains `ip_status: "original" | "fan-fiction"` and
  `monetization_allowed: boolean` (defaults `false` when `ip_status` is
  `fan-fiction`). This costs nothing today and prevents a fan-fiction project
  from silently reaching a monetized publishing path once that pipeline exists,
  without anyone having to remember to add the check later.
- Amazon KDP's AI-content disclosure requirement (KDP requires declaring
  AI-generated vs. AI-assisted content at upload). Not building the publishing
  pipeline yet, but **chapter metadata now tracks provenance** — AI-drafted vs.
  human-revised proportion, logged at finalization — so accurate disclosure is
  possible later without reconstructing history across a full backlog.
- Confirm Webnovel/Qidian's current ToS on fan-fiction and on AI-generated/
  AI-assisted content directly before relying on that platform for monetized
  web-novel publishing — platform policies shift and haven't been verified here.
- **A dedicated desktop application** (project-based UI, similar in spirit to
  AI-Novel-Writer's Electron app but purpose-built) **and multi-model routing
  between Claude and Gemini** (e.g., Sonnet/Opus for research and heavy
  reasoning, Gemini's free tier for cheaper/high-volume tasks). This is
  deliberately deferred to its own follow-up spec: everything in this document
  runs as Claude Code plugins/skills/agents inside a Claude Code session, but
  genuine multi-model routing requires an orchestration layer outside Claude
  Code that calls the Anthropic and Gemini APIs directly — Claude Code
  subagents only run on Claude. Building that (and the app around it) before
  the writing/QA pipeline is validated risks a rebuild once real chapter output
  shows what the agent roles and QA gates actually need. Sequencing: prove this
  spec's pipeline produces good chapters first, then design the desktop app +
  multi-model orchestration as a follow-up architectural spec built on top of a
  known-good pipeline.

## Suggested implementation phasing

This spec is too large for one implementation plan; it's expected to become
several sequential plans. Dropping OpenViking removes the validation-spike
phase entirely — Obsidian's skills are already installed and verified.

1. **Scaffold**: `C:\booq` as an Obsidian vault, workspace layout, `book-forge`
   fork installed and directory/UI-text localized to English (genre template
   rebuild can lag).
2. **Core writing loop**: `/book-new` → outline → `/book-write` → one chapter
   out, no QA reviewers yet — proves the basic pipeline end-to-end.
3. **QA gate** *(done — grew from five reviewers to six; see Orchestration
   flow above)*: the reviewers, built as an agent-harness-style state
   machine with the persistent per-chapter state file, retry caps, and
   escalation path.
4. **Research Agent** *(done)*: craft/market research, per-project reference
   selection and structural analysis, feeding `vault\craft-lessons\`.
5. **Cross-project learning** *(done)*: `/book-learn` writing durable craft
   lessons to the shared vault, and later projects reading them back.
6. **Optional — competing drafts** *(done)*: `/book-write --compete=N` via
   the agenthub pattern, for high-stakes chapters only.
7. **Self-improvement loop** *(done, added after the original six phases)*:
   status-lifecycle Facts Log, style-exemplar capture, Override Contract
   repeated-pattern detection, ongoing market-pulse research. See that
   section above.

This list is kept as a historical record of the original phasing — several
items grew in scope well past their original one-line description as the
design continued (most notably phase 3's QA gate). The Orchestration flow
and Self-improvement loop sections above are the current, authoritative
description; this list should not be read as still-accurate detail.

## Testing / validation approach

This is a content pipeline, not application code — there is no traditional unit
test suite. Validation is:
- `/book-doctor` (carried over from the fork): confirms the vault folder
  structure is intact, `obsidian-*` skills are available, plugin commands
  resolve, and (as of the self-improvement loop) flags stale market-pulse
  research per project.
- The six-check QA gate on every chapter *is* the test suite equivalent — a
  chapter that fails a Hard Invariant (readability, broken promise, pacing
  disaster, conflict vacuum) or any of the other structural checks does not
  get finalized, and repeated failure escalates to you rather than silently
  passing. A soft-guidance finding can be resolved via a logged Override
  Contract instead of a revision — but never silently, and never for a
  Hard Invariant.
