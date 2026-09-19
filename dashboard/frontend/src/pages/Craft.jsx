import React, { useEffect, useState } from "react";
import { api } from "../lib/api.js";
import { IconAlert } from "../components/icons.jsx";
import { Card, StatTile, Spinner, Empty, InfoTip } from "../components/ui.jsx";

const ECHO_HINT = (
  <>
    Distinctive phrases recurring across chapters — the signature failure of
    long machine-drafted fiction. No per-chapter reviewer can catch these: each
    chapter reads fine alone, and the problem only exists in the relationship
    between them. Counted, not judged — pure phrase frequency, no model
    involved. Phrases repeated inside a single chapter are ignored, since
    that's usually deliberate.
  </>
);

const OPENING_HINT = (
  <>
    The first word of each chapter's first sentence. Serials drift into opening
    every chapter the same way — invisible while writing one, obvious to
    someone reading ten in a row. Flagged at three or more shared openings.
  </>
);

const DIALOGUE_HINT = (
  <>
    The shape of the dialogue — not whether it's good. This is the one thing
    readers of AI-assisted fiction complain about most, ahead of any plot
    defect: <em>"it sounds like robots speaking rather than people."</em> Three
    of these numbers have a direction, one doesn't. Counted from the text, no
    model involved; the judgement of whether a chapter's numbers are wrong
    <em>for that chapter</em> belongs to the dialogue-naturalness reviewer,
    which actually reads the scene.
  </>
);

const FLAT_HINT = (
  <>
    Share of spoken lines that are exactly one complete sentence closed with a
    full stop, and at least four words long. That's the shape of speech written
    as a report. The length floor matters — <code>"No."</code> is also one
    period-terminated sentence, and it's <em>good</em> dialogue, so it isn't
    counted here. Higher is worse, but a briefing or courtroom scene should
    score high and that's correct.
  </>
);

const TAG_HINT = (
  <>
    Share of dialogue paragraphs attributed with a speech verb — said, asked,
    replied. The light-novel-style skill puts the ceiling near 30% and prefers
    a preceding action beat instead. Over the ceiling reads as attribution
    carrying a scene that nobody is physically in.
  </>
);

const BEAT_HINT = (
  <>
    Share of dialogue paragraphs carrying an actual action beat rather than
    just a tag — <em>"He ground out his cigarette. 'Fine.'"</em> Higher is
    generally better: it's what keeps an exchange from reading as floating
    heads in a void. This is the shakiest number here, since telling a beat
    from a tag properly needs grammar analysis the dashboard doesn't have; it
    estimates from clause length.
  </>
);

const BARE_HINT = (
  <>
    Share of dialogue paragraphs with nothing at all outside the quotes.
    <strong> This one has no good or bad direction.</strong> A bare volley is
    a legitimate, fast technique, and readers track speakers by rhythm. A
    chapter at or near 100% is airless; a chapter at 0% never lets an exchange
    run. Shown because it's informative, not because a number is wrong.
  </>
);

const REPEAT_DLG_HINT = (
  <>
    Spoken lines repeated word-for-word in two or more chapters. Different
    from repeated phrasing above, which works on narration: this matches whole
    lines, so it catches a character restating the same thing in chapter 6 and
    again in chapter 14. A reader review of an AI novel named exactly this —
    characters repeating their goals, dialogue recurring across chapters — as
    why the book felt padded to five times its necessary length. Lines under
    four words are ignored, since <code>"Yes."</code> is supposed to recur.
    Only <em>verbatim</em> repeats show here; a goal restated in fresh words
    every time is the same defect and needs a reader to catch.
  </>
);

const NAMES_HINT = (
  <>
    Character names from the story bible that a reader could confuse. A reader
    reviewing an AI-generated novel noted it had both a <em>Thomas</em> and a
    <em> Brother Thomas</em> by chapter two, and nothing in the pipeline saw a
    problem. Pure string comparison, so it costs nothing. Reported, never
    judged — two similar names are often deliberate: aliases for one person, a
    family sharing a surname, a formal and a familiar form of the same
    character. This just puts the pair in front of you.
  </>
);

const VOCAB_HINT = (
  <>
    Word-level repetition, which the repeated-phrasing check above cannot see:
    it matches four- and five-word sequences, so a manuscript that says
    <em> suddenly</em> two hundred times in two hundred different sentences
    sails straight past it. Counted, not judged — a high filter-word rate in
    a tense internal-monologue chapter may be exactly right. What the
    per-chapter column is good for is spotting a rate that barely moves across
    the whole book, which is the signature of a habit rather than a choice.
  </>
);

const FILTER_HINT = (
  <>
    Hedges and intensifiers per 1,000 words — <em>just, really, slightly,
    suddenly, seemed, began to</em>. Every one is a real English word that
    appears in good writing, which is why this is a rate rather than a list of
    offences. It's the same family of tell the <code>humanizer</code> skill
    removes at the phrase level.
  </>
);

const ADVERB_HINT = (
  <>
    Words ending in <em>-ly</em> per 1,000 words, excluding ones that only
    look adverbial (<em>only, early, reply</em>). Heavy adverb use usually
    marks a verb doing too little work — <em>walked slowly</em> where
    <em> trudged</em> was available. No target number; compare chapters
    against each other rather than against a rule.
  </>
);

const MATTR_HINT = (
  <>
    Vocabulary variety: the share of unique words in a sliding fixed-size
    window, averaged. <strong>Not</strong> a plain unique-over-total ratio —
    that figure falls automatically as a text gets longer, so it would make
    every long chapter look repetitive when it is only <em>longer</em>.
    Averaging over a fixed window removes the length effect, so these numbers
    are genuinely comparable between chapters. Blank means the chapter is
    shorter than one window, where no honest figure exists.
  </>
);

const HOOKS_HINT = (
  <>
    How each chapter ends, and whether the book keeps reaching for the same
    move. The thread-ledger reviewer already classifies every chapter's ending
    to check the broken-promise invariant — this reads back what it recorded,
    so it costs nothing extra. Hook monotony is invisible inside any one
    chapter (each ending is individually fine) and only exists in the
    sequence, which is why no per-chapter review can catch it. Chapters
    written before this was recorded show as <em>unclassified</em> rather than
    being guessed at.
  </>
);

const SENTENCE_HINT = (
  <>
    Spread of sentence lengths. Uniform length is the texture of machine prose;
    a low spread is worth a look. This is reported, <em>not</em> judged — a
    tense action beat should run short and flat, and that's correct, not a
    defect.
  </>
);

export default function Craft({ project }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setData(null);
    setError(null);
    api.craft(project).then(setData).catch((e) => setError(e.message));
  }, [project]);

  if (error) {
    return <div className="error-banner" role="alert"><IconAlert /><span>{error}</span></div>;
  }

  if (!data) {
    return (
      <div>
        <div className="eyebrow">Prose</div>
        <h1 className="page-title">Craft</h1>
        <Spinner label="Analysing manuscript" />
      </div>
    );
  }

  if (!data.chapters_analyzed) {
    return (
      <div>
        <div className="eyebrow">Prose</div>
        <h1 className="page-title">Craft</h1>
        <Empty>
          No chapters to analyse yet. These checks compare chapters against
          each other, so they need a few finalized before they say anything
          useful.
        </Empty>
      </div>
    );
  }

  const echoes = data.echoes || [];
  const repeatedOpenings = data.openings?.repeated_first_words || [];
  const overall = data.sentences?.overall;
  const dlg = data.dialogue?.overall;
  const tagCeiling = data.dialogue?.reference?.tag_pct_ceiling ?? 30;
  const repeatedLines = data.repeated_dialogue || [];
  const nameClashes = data.confusable_names || [];
  const vocab = data.vocabulary?.overall;
  const overused = data.vocabulary?.overused || [];
  const hooks = data.hooks;
  const hookRuns = hooks?.runs || [];
  const hookCrowded = hooks?.crowded || [];

  return (
    <div>
      <div className="eyebrow">Prose</div>
      <h1 className="page-title">Craft</h1>
      <p className="page-sub">
        Mechanical checks over the whole manuscript. Everything here is
        <em> counted</em> rather than judged — questions of taste (is this
        dialogue <em>good</em>?) are deliberately absent, because a confident
        score for them would be worse than silence. Phrasing and openings are
        here because no single-chapter review can see them at all; dialogue
        shape is here because counting it exactly is free, and the per-chapter
        trend shows drift that one verdict can't.
      </p>

      <div className="stat-row" style={{ marginTop: 20 }}>
        <StatTile
          label="Chapters analysed"
          value={data.chapters_analyzed}
          hint={<>Every chapter in <code>manuscript/</code>, prose only — frontmatter and headings excluded.</>}
        />
        <StatTile
          label="Repeated phrases"
          value={echoes.length}
          tone={echoes.length > 12 ? "danger" : undefined}
          hint={ECHO_HINT}
        />
        <StatTile
          label="Repeated openings"
          value={repeatedOpenings.length}
          tone={repeatedOpenings.length ? "danger" : "ok"}
          hint={OPENING_HINT}
        />
        {overall && (
          <StatTile
            label="Sentence spread"
            value={overall.stdev}
            sub={`mean ${overall.mean_length} words`}
            hint={SENTENCE_HINT}
          />
        )}
        {dlg && (
          <StatTile
            label="Report-shaped lines"
            value={`${dlg.flat_pct}%`}
            sub={`of ${dlg.lines} spoken lines`}
            hint={FLAT_HINT}
          />
        )}
        {dlg && (
          <StatTile
            label="Dialogue tagged"
            value={`${dlg.tag_pct}%`}
            tone={dlg.tag_pct > tagCeiling ? "warn" : "ok"}
            sub={`ceiling ${tagCeiling}%`}
            hint={TAG_HINT}
          />
        )}
        <StatTile
          label="Repeated lines"
          value={repeatedLines.length}
          tone={repeatedLines.length ? "warn" : "ok"}
          hint={REPEAT_DLG_HINT}
        />
        <StatTile
          label="Confusable names"
          value={nameClashes.length}
          tone={nameClashes.length ? "warn" : "ok"}
          hint={NAMES_HINT}
        />
        {vocab && (
          <StatTile
            label="Filter words"
            value={vocab.filter_per_1k}
            sub="per 1,000 words"
            hint={FILTER_HINT}
          />
        )}
      </div>

      <Card title="Repeated phrasing" hint={ECHO_HINT}>
        {echoes.length === 0 ? (
          <p className="card-note">
            Nothing recurring across chapters. With only a few chapters written
            that's expected — this check gets useful as the manuscript grows.
          </p>
        ) : (
          <div className="table-scroll">
            <table>
              <caption className="visually-hidden">
                Phrases repeated across multiple chapters, with occurrence count
                and the chapters they appear in.
              </caption>
              <thead>
                <tr>
                  <th scope="col">Phrase</th>
                  <th scope="col" className="num">Uses</th>
                  <th scope="col">Chapters</th>
                </tr>
              </thead>
              <tbody>
                {echoes.map((e) => (
                  <tr key={e.phrase}>
                    <td className="echo-phrase">{e.phrase}</td>
                    <td className="num">{e.count}</td>
                    <td className="echo-chapters">{e.chapters.join(", ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="Chapter openings" hint={OPENING_HINT}>
        {repeatedOpenings.length > 0 && (
          <ul className="check-list">
            {repeatedOpenings.map((o) => (
              <li className="check-row is-fail" key={o.word}>
                <IconAlert width={15} height={15} />
                <span>
                  {o.count} chapters open with “{o.word}” — {o.chapters.join(", ")}
                </span>
              </li>
            ))}
          </ul>
        )}
        <details style={{ marginTop: repeatedOpenings.length ? 12 : 0 }}>
          <summary>Every chapter's first line</summary>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th scope="col" className="num">Chapter</th>
                  <th scope="col">Opens with</th>
                </tr>
              </thead>
              <tbody>
                {(data.openings?.openings || []).map((o) => (
                  <tr key={o.chapter_id}>
                    <td className="num">{o.chapter_id}</td>
                    <td>{o.opening}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </Card>

      <Card
        title="Sentence rhythm"
        hint={SENTENCE_HINT}
        note="Spread (standard deviation) matters more than the mean — it's the variation that reads as human."
      >
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th scope="col" className="num">Chapter</th>
                <th scope="col" className="num">Sentences</th>
                <th scope="col" className="num">Mean</th>
                <th scope="col" className="num">Spread</th>
                <th scope="col" className="num">Range</th>
              </tr>
            </thead>
            <tbody>
              {(data.sentences?.per_chapter || []).map((s) => (
                <tr key={s.chapter_id}>
                  <td className="num">{s.chapter_id}</td>
                  <td className="num">{s.sentences}</td>
                  <td className="num">{s.mean_length}</td>
                  <td className="num">{s.stdev}</td>
                  <td className="num">{s.shortest}–{s.longest}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card
        title="Dialogue shape"
        hint={DIALOGUE_HINT}
        note="Speaker attribution isn't attempted — identifying who says each line reliably needs the story-bible and a model, and guessing from proximity would produce confident nonsense on exactly the crowded scenes that matter most. Every figure here is speaker-agnostic."
      >
        {!dlg ? (
          <Empty>
            No dialogue found in the manuscript. That's a legitimate result for
            pure-action or pure-interiority chapters, not an error.
          </Empty>
        ) : (
          <>
            <div className="stat-row" style={{ marginBottom: 18 }}>
              <StatTile label="Report-shaped" value={`${dlg.flat_pct}%`} hint={FLAT_HINT} />
              <StatTile
                label="Tagged"
                value={`${dlg.tag_pct}%`}
                tone={dlg.tag_pct > tagCeiling ? "warn" : "ok"}
                sub={`ceiling ${tagCeiling}%`}
                hint={TAG_HINT}
              />
              <StatTile label="With action beat" value={`${dlg.beat_pct}%`} hint={BEAT_HINT} />
              <StatTile
                label="Bare lines"
                value={`${dlg.bare_pct}%`}
                sub="no direction"
                hint={BARE_HINT}
              />
              <StatTile
                label="Line-length spread"
                value={dlg.stdev}
                sub={`mean ${dlg.mean_words} words`}
                hint={<>Variation in how long spoken lines are. Uniform line length is
                  the same tell as uniform sentence length — real exchanges are ragged,
                  with one-word answers next to run-ons.</>}
              />
            </div>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th scope="col" className="num">Chapter</th>
                    <th scope="col" className="num">Lines</th>
                    <th scope="col" className="num">Report-shaped</th>
                    <th scope="col" className="num">Tagged</th>
                    <th scope="col" className="num">Action beat</th>
                    <th scope="col" className="num">Bare</th>
                    <th scope="col" className="num">Spread</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.dialogue?.per_chapter || []).map((d) => (
                    <tr key={d.chapter_id}>
                      <td className="num">{d.chapter_id}</td>
                      <td className="num">{d.lines}</td>
                      <td className="num">{d.flat_pct}%</td>
                      <td className={`num${d.tag_pct > tagCeiling ? " is-warn" : ""}`}>
                        {d.tag_pct}%
                      </td>
                      <td className="num">{d.beat_pct}%</td>
                      <td className="num">{d.bare_pct}%</td>
                      <td className="num">{d.stdev}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>

      <Card title="Repeated dialogue" hint={REPEAT_DLG_HINT}>
        {!repeatedLines.length ? (
          <Empty>
            No spoken line of four words or more repeats across chapters.
          </Empty>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th scope="col">Line</th>
                  <th scope="col" className="num">Chapters</th>
                  <th scope="col" className="num">Times</th>
                </tr>
              </thead>
              <tbody>
                {repeatedLines.map((r, i) => (
                  <tr key={i}>
                    <td>{r.line}</td>
                    <td className="num">{r.chapters.join(", ")}</td>
                    <td className="num">{r.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card
        title="Confusable names"
        hint={NAMES_HINT}
        note="Compared against the cast in story-bible/characters/, not against capitalised words in the prose — otherwise every place name would appear here."
      >
        {!nameClashes.length ? (
          <Empty>
            No two character names are close enough to be mistaken for each
            other. If your story bible is empty, this check has nothing to
            compare and will stay quiet.
          </Empty>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th scope="col">Pair</th>
                  <th scope="col">Why it's flagged</th>
                  <th scope="col">Severity</th>
                </tr>
              </thead>
              <tbody>
                {nameClashes.map((n, i) => (
                  <tr key={i}>
                    <td>{n.names.join("  /  ")}</td>
                    <td>{n.reason}</td>
                    <td className={n.severity === "high" ? "is-warn" : ""}>
                      {n.severity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card
        title="Vocabulary"
        hint={VOCAB_HINT}
        note="None of these have a target value. They are worth reading as a series across chapters, not as a score on any one."
      >
        {!vocab ? (
          <Empty>No prose analysed yet.</Empty>
        ) : (
          <>
            <div className="stat-row" style={{ marginBottom: 18 }}>
              <StatTile
                label="Filter words"
                value={vocab.filter_per_1k}
                sub="per 1,000 words"
                hint={FILTER_HINT}
              />
              <StatTile
                label="-ly adverbs"
                value={vocab.adverb_per_1k}
                sub="per 1,000 words"
                hint={ADVERB_HINT}
              />
              <StatTile
                label="Vocabulary variety"
                value={vocab.mattr === null ? "\u2014" : vocab.mattr + "%"}
                sub={`${data.vocabulary?.reference?.mattr_window ?? 400}-word window`}
                hint={MATTR_HINT}
              />
              <StatTile
                label="Words analysed"
                value={vocab.words.toLocaleString()}
                hint={<>Prose only — frontmatter and headings excluded, same as everywhere else on this page.</>}
              />
            </div>

            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th scope="col" className="num">Chapter</th>
                    <th scope="col" className="num">Words</th>
                    <th scope="col" className="num">Filter /1k</th>
                    <th scope="col" className="num">Adverbs /1k</th>
                    <th scope="col" className="num">Variety</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.vocabulary?.per_chapter || []).map((v) => (
                    <tr key={v.chapter_id}>
                      <td className="num">{v.chapter_id}</td>
                      <td className="num">{v.words}</td>
                      <td className="num">{v.filter_per_1k}</td>
                      <td className="num">{v.adverb_per_1k}</td>
                      <td className="num">{v.mattr === null ? "\u2014" : v.mattr + "%"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {overused.length > 0 && (
              <>
                <p className="page-sub" style={{ marginTop: 22, marginBottom: 10 }}>
                  Content words carrying an unusual share of the manuscript,
                  across three or more chapters. A word central to one chapter's
                  subject is filtered out by that spread requirement; a word that
                  is everywhere is a habit.
                </p>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th scope="col">Word</th>
                        <th scope="col" className="num">Uses</th>
                        <th scope="col" className="num">Chapters</th>
                        <th scope="col" className="num">Per 1k</th>
                      </tr>
                    </thead>
                    <tbody>
                      {overused.map((w) => (
                        <tr key={w.word}>
                          <td>{w.word}</td>
                          <td className="num">{w.count}</td>
                          <td className="num">{w.chapters}</td>
                          <td className="num">{w.per_1k}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}
      </Card>

      <Card
        title="Chapter endings"
        hint={HOOKS_HINT}
        note="A run or a crowded window is an observation, not a verdict. A siege arc that ends five chapters running on escalating danger may be exactly right — the question is whether it was chosen."
      >
        {!hooks || !hooks.classified ? (
          <Empty>
            No chapter has a recorded hook type yet. These are written at
            finalize, so they appear once chapters go through the full pipeline.
          </Empty>
        ) : (
          <>
            <div className="stat-row" style={{ marginBottom: 18 }}>
              <StatTile
                label="Classified"
                value={hooks.classified}
                sub={`of ${hooks.sequence.length} chapters`}
                hint={<>Chapters carrying a recorded hook type. The rest are counted as unclassified and excluded from every figure here.</>}
              />
              <StatTile
                label="Distinct types"
                value={hooks.by_type.filter((t) => t.type !== "unclassified").length}
                sub="of 5 possible"
                hint={<>Crisis, mystery, desire, emotion and choice. Using only one or two across a long stretch is what a run or crowded window is pointing at.</>}
              />
              <StatTile
                label="Repeat runs"
                value={hookRuns.length}
                tone={hookRuns.length ? "warn" : "ok"}
                hint={<>Stretches of {hooks.reference.run_threshold}+ consecutive chapters ending on the same hook type.</>}
              />
              <StatTile
                label="Crowded windows"
                value={hookCrowded.length}
                tone={hookCrowded.length ? "warn" : "ok"}
                hint={<>One hook type used {hooks.reference.window_threshold}+ times inside any {hooks.reference.window}-chapter window, even when not consecutive.</>}
              />
            </div>

            {(hookRuns.length > 0 || hookCrowded.length > 0) && (
              <div className="table-scroll" style={{ marginBottom: 18 }}>
                <table>
                  <thead>
                    <tr>
                      <th scope="col">Pattern</th>
                      <th scope="col">Hook type</th>
                      <th scope="col" className="num">Count</th>
                      <th scope="col">Chapters</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hookRuns.map((r, i) => (
                      <tr key={"r" + i}>
                        <td>consecutive run</td>
                        <td className="is-warn">{r.type}</td>
                        <td className="num">{r.length}</td>
                        <td>{r.from}–{r.to}</td>
                      </tr>
                    ))}
                    {hookCrowded.map((c, i) => (
                      <tr key={"c" + i}>
                        <td>crowded window</td>
                        <td className="is-warn">{c.type}</td>
                        <td className="num">{c.count}</td>
                        <td>{c.from}–{c.to}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Hook type</th>
                    <th scope="col" className="num">Chapters</th>
                    <th scope="col">Closing technique</th>
                    <th scope="col" className="num">Uses</th>
                  </tr>
                </thead>
                <tbody>
                  {hooks.by_type.map((t, i) => (
                    <tr key={t.type}>
                      <td>{t.type}</td>
                      <td className="num">{t.count}</td>
                      <td>{hooks.by_technique[i]?.technique ?? ""}</td>
                      <td className="num">{hooks.by_technique[i]?.count ?? ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
