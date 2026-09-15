import React, { useEffect, useState } from "react";
import { api } from "../lib/api.js";
import { IconAlert } from "../components/icons.jsx";

const STRAND_LETTER = { quest: "Q", fire: "F", constellation: "C" };

/*
 * Strand history. Each segment carries its initial letter and a distinct
 * fill pattern (see .strand-seg in index.css) in addition to hue, so the
 * sequence stays readable without color perception. A text summary and the
 * per-chapter table below act as the non-visual fallback.
 */
function StrandHistory({ history }) {
  if (!history || history.length === 0) {
    return <div className="empty-state">No strand history recorded yet.</div>;
  }
  const recent = history.slice(-30);

  return (
    <>
      <div className="strand-bar" role="img" aria-label={strandSummary(recent)}>
        {recent.map((h, i) => (
          <div
            key={i}
            className={`strand-seg ${h.dominant}`}
            title={`Chapter ${h.chapter}: ${h.dominant}`}
          >
            {STRAND_LETTER[h.dominant] || "?"}
          </div>
        ))}
      </div>

      <ul className="legend">
        <li className="legend-item">
          <span className="legend-swatch strand-seg quest" /> Q — Quest (plot)
        </li>
        <li className="legend-item">
          <span className="legend-swatch strand-seg fire" /> F — Fire (relationships)
        </li>
        <li className="legend-item">
          <span className="legend-swatch strand-seg constellation" /> C — Constellation (world)
        </li>
      </ul>
    </>
  );
}

function strandSummary(recent) {
  const counts = recent.reduce((acc, h) => {
    acc[h.dominant] = (acc[h.dominant] || 0) + 1;
    return acc;
  }, {});
  const parts = Object.entries(counts).map(([k, v]) => `${v} ${k}`);
  return `Strand mix over the last ${recent.length} chapters: ${parts.join(", ")}.`;
}

/* Threshold warnings from the outline agents' enforcement rules. */
function StrandWarnings({ tracker }) {
  const warnings = [];
  const current = Math.max(
    tracker.last_quest_chapter ?? 0,
    tracker.last_fire_chapter ?? 0,
    tracker.last_constellation_chapter ?? 0
  );

  if ((tracker.chapters_since_switch ?? 0) > 5 && tracker.current_dominant === "quest") {
    warnings.push(`Quest has run ${tracker.chapters_since_switch} chapters without a switch (threshold: 5).`);
  }
  if (tracker.last_fire_chapter != null && current - tracker.last_fire_chapter > 10) {
    warnings.push(`Fire absent for ${current - tracker.last_fire_chapter} chapters (threshold: 10).`);
  }
  if (tracker.last_constellation_chapter != null && current - tracker.last_constellation_chapter > 15) {
    warnings.push(`Constellation absent for ${current - tracker.last_constellation_chapter} chapters (threshold: 15).`);
  }

  if (warnings.length === 0) return null;

  return (
    <div className="error-banner" role="status">
      <IconAlert />
      <span>
        {warnings.map((w) => (
          <div key={w}>{w}</div>
        ))}
      </span>
    </div>
  );
}

function QualityTrend({ metrics }) {
  if (!metrics || metrics.length === 0) {
    return <div className="empty-state">No review history yet.</div>;
  }
  const recent = metrics.slice(-20);
  const max = Math.max(...recent.map((m) => m.quality_score ?? 0), 1);

  return (
    <>
      <div className="trend" role="img" aria-label={trendSummary(recent)}>
        {recent.map((m, i) => {
          const score = m.quality_score ?? 0;
          return (
            <div className="trend-col" key={i} title={`Chapter ${m.chapter}: ${score}`}>
              <div
                className={`trend-bar ${score < 60 ? "is-low" : ""}`}
                style={{ height: `${Math.max((score / max) * 100, 4)}%` }}
              />
            </div>
          );
        })}
      </div>

      {/* Non-visual fallback: the same data as a table */}
      <details>
        <summary>View as table</summary>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th scope="col">Chapter</th>
                <th scope="col">Quality score</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((m, i) => (
                <tr key={i}>
                  <td className="num">{m.chapter}</td>
                  <td className="num">{m.quality_score ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </>
  );
}

function trendSummary(recent) {
  const scores = recent.map((m) => m.quality_score ?? 0);
  const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  const low = scores.filter((s) => s < 60).length;
  return `Quality scores across the last ${recent.length} chapters average ${avg}. ${low} chapter${low === 1 ? "" : "s"} scored below 60.`;
}

export default function Pacing({ project }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setData(null);
    setError(null);
    api.pacing(project).then(setData).catch((e) => setError(e.message));
  }, [project]);

  if (error) return <div className="error-banner" role="alert"><IconAlert /><span>{error}</span></div>;

  if (!data) {
    return (
      <div>
        <h1 className="page-title">Pacing</h1>
        <div className="skeleton skeleton-tile" aria-hidden="true" />
        <span className="visually-hidden" role="status">Loading pacing data</span>
      </div>
    );
  }

  const tracker = data.strand_tracker || {};
  const hasTracker = Object.keys(tracker).length > 0;

  return (
    <div>
      <h1 className="page-title">Pacing</h1>

      {hasTracker && <StrandWarnings tracker={tracker} />}

      <section className="card">
        <h2>Strand balance — recent chapters</h2>
        <StrandHistory history={tracker.history} />

        {hasTracker && (
          <table className="kv" style={{ marginTop: 14 }}>
            <tbody>
              <tr><td>Current dominant strand</td><td>{tracker.current_dominant || "—"}</td></tr>
              <tr><td>Chapters since last switch</td><td className="num">{tracker.chapters_since_switch ?? "—"}</td></tr>
              <tr><td>Last Quest chapter</td><td className="num">{tracker.last_quest_chapter ?? "—"}</td></tr>
              <tr><td>Last Fire chapter</td><td className="num">{tracker.last_fire_chapter ?? "—"}</td></tr>
              <tr><td>Last Constellation chapter</td><td className="num">{tracker.last_constellation_chapter ?? "—"}</td></tr>
            </tbody>
          </table>
        )}
      </section>

      <section className="card">
        <h2>Quality score trend — last 20 chapters</h2>
        <p className="card-note">
          Trend observation only. This score never gates a chapter — that's
          always the six reviewers' pass/fail verdicts.
        </p>
        <QualityTrend metrics={data.review_metrics} />
      </section>
    </div>
  );
}
