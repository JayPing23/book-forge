import React, { useEffect, useState } from "react";
import { api } from "../lib/api.js";

function StrandHistory({ history }) {
  if (!history || history.length === 0) {
    return <div className="empty-state">No strand history recorded yet.</div>;
  }
  const recent = history.slice(-30);
  return (
    <div className="strand-bar">
      {recent.map((h, i) => (
        <div
          key={i}
          className={`seg ${h.dominant}`}
          style={{ flex: 1 }}
          title={`Chapter ${h.chapter}: ${h.dominant}`}
        />
      ))}
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
    <div className="mini-bars">
      {recent.map((m, i) => (
        <div
          key={i}
          className="bar"
          title={`Chapter ${m.chapter}: score ${m.quality_score}`}
          style={{
            height: `${Math.max(((m.quality_score ?? 0) / max) * 100, 4)}%`,
            background: (m.quality_score ?? 0) < 60 ? "var(--yellow)" : "var(--accent)",
          }}
        />
      ))}
    </div>
  );
}

export default function Pacing({ project }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setData(null);
    setError(null);
    api.pacing(project).then(setData).catch((e) => setError(e.message));
  }, [project]);

  if (error) return <div className="error-banner">{error}</div>;
  if (!data) return <div className="empty-state">Loading…</div>;

  const tracker = data.strand_tracker || {};

  return (
    <div>
      <h2>Pacing</h2>

      <div className="card">
        <h3>Strand balance — recent chapters</h3>
        <StrandHistory history={tracker.history} />
        <div style={{ display: "flex", gap: 16, marginTop: 10, fontSize: 12, color: "var(--text-dim)" }}>
          <span><span className="seg quest" style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2 }} /> Quest</span>
          <span><span className="seg fire" style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2 }} /> Fire</span>
          <span><span className="seg constellation" style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2 }} /> Constellation</span>
        </div>
        <table style={{ marginTop: 16 }}>
          <tbody>
            <tr><td>Current dominant strand</td><td>{tracker.current_dominant || "—"}</td></tr>
            <tr><td>Chapters since last switch</td><td>{tracker.chapters_since_switch ?? "—"}</td></tr>
            <tr><td>Last Quest chapter</td><td>{tracker.last_quest_chapter ?? "—"}</td></tr>
            <tr><td>Last Fire chapter</td><td>{tracker.last_fire_chapter ?? "—"}</td></tr>
            <tr><td>Last Constellation chapter</td><td>{tracker.last_constellation_chapter ?? "—"}</td></tr>
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3>Quality score trend (last 20 chapters)</h3>
        <p style={{ color: "var(--text-dim)", fontSize: 12, marginTop: -6 }}>
          Trend observation only — this score never gates a chapter's
          finalization; that's always the five reviewers' pass/fail verdicts.
        </p>
        <QualityTrend metrics={data.review_metrics} />
      </div>
    </div>
  );
}
