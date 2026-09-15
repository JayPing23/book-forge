import React, { useEffect, useState } from "react";
import { api } from "../lib/api.js";
import { IconAlert } from "../components/icons.jsx";

export default function Overview({ project }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setData(null);
    setError(null);
    api.overview(project).then(setData).catch((e) => setError(e.message));
  }, [project]);

  if (error) return <div className="error-banner" role="alert"><IconAlert /><span>{error}</span></div>;

  if (!data) {
    return (
      <div>
        <h1 className="page-title">{project}</h1>
        <div className="stat-row" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton skeleton-tile" />)}
        </div>
        <span className="visually-hidden" role="status">Loading project overview</span>
      </div>
    );
  }

  const escalated = data.escalated_chapters.length;

  return (
    <div>
      <h1 className="page-title">{project}</h1>

      <div className="stat-row">
        <div className="stat-tile">
          <div className="label">Chapters</div>
          <div className="value">{data.chapter_count}</div>
        </div>
        <div className="stat-tile">
          <div className="label">Total words</div>
          <div className="value">{data.total_words.toLocaleString()}</div>
        </div>
        <div className="stat-tile">
          <div className="label">Latest chapter</div>
          <div className="value">{data.latest_chapter || "—"}</div>
        </div>
        <div className="stat-tile">
          <div className="label">Escalated</div>
          <div className={`value ${escalated ? "is-danger" : "is-ok"}`}>{escalated}</div>
        </div>
      </div>

      {/* Publication frontier — only meaningful once something is published. */}
      {data.published_through && (
        <div className="stat-row">
          <div className="stat-tile">
            <div className="label">Published through</div>
            <div className="value">{data.published_through}</div>
          </div>
          <div className="stat-tile">
            <div className="label">Buffer (unpublished)</div>
            <div className={`value ${data.buffer === 0 ? "is-danger" : ""}`}>
              {data.buffer ?? "—"}
            </div>
          </div>
        </div>
      )}

      <section className="card">
        <h2>Project settings</h2>
        <table className="kv">
          <tbody>
            <tr><td>Project type</td><td>{data.project_type || "—"}</td></tr>
            <tr><td>Genre</td><td>{data.genre || "—"}</td></tr>
            <tr><td>Depth dial</td><td>{data.depth_dial || "—"}</td></tr>
            <tr><td>Platform convention</td><td>{data.platform_convention || "—"}</td></tr>
            <tr><td>Length tier</td><td>{data.length_tier || "—"}</td></tr>
            <tr>
              <td>Target chapter words</td>
              <td className="num">
                {data.target_chapter_words
                  ? Number(data.target_chapter_words).toLocaleString()
                  : "—"}
              </td>
            </tr>
            <tr><td>IP status</td><td>{data.ip_status || "—"}</td></tr>
            <tr>
              <td>Monetization allowed</td>
              <td>
                <span className={`badge ${data.monetization_allowed ? "is-warn" : "is-neutral"}`}>
                  {String(data.monetization_allowed)}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      {escalated > 0 && (
        <section className="card">
          <h2>Chapters awaiting your decision</h2>
          <p className="card-note">
            These hit a QA check's retry cap and stopped rather than forcing
            through. Each chapter's state file holds the specific failure and
            its evidence.
          </p>
          <ul>
            {data.escalated_chapters.map((c) => (
              <li key={c} className="num">Chapter {c}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
