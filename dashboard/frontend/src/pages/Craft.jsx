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
    </div>
  );
}
