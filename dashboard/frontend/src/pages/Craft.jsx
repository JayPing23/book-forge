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

  return (
    <div>
      <div className="eyebrow">Prose</div>
      <h1 className="page-title">Craft</h1>
      <p className="page-sub">
        Whole-manuscript checks that no single-chapter review can perform.
        Everything here is counted rather than judged — questions of taste
        (is this dialogue good?) are deliberately absent, because a confident
        score for them would be worse than silence.
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
    </div>
  );
}
