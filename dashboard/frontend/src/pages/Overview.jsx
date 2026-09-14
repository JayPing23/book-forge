import React, { useEffect, useState } from "react";
import { api } from "../lib/api.js";

export default function Overview({ project }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setData(null);
    setError(null);
    api.overview(project).then(setData).catch((e) => setError(e.message));
  }, [project]);

  if (error) return <div className="error-banner">{error}</div>;
  if (!data) return <div className="empty-state">Loading…</div>;

  return (
    <div>
      <h2>{project}</h2>
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
          <div className="value" style={{ color: data.escalated_chapters.length ? "var(--red)" : "var(--green)" }}>
            {data.escalated_chapters.length}
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Project settings</h3>
        <table>
          <tbody>
            <tr><td>Project type</td><td>{data.project_type || "—"}</td></tr>
            <tr><td>Genre</td><td>{data.genre || "—"}</td></tr>
            <tr><td>Depth dial</td><td>{data.depth_dial || "—"}</td></tr>
            <tr><td>Platform convention</td><td>{data.platform_convention || "—"}</td></tr>
            <tr><td>IP status</td><td>{data.ip_status || "—"}</td></tr>
            <tr>
              <td>Monetization allowed</td>
              <td>
                <span className={`badge ${data.monetization_allowed ? "warning" : "normal"}`}>
                  {String(data.monetization_allowed)}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {data.escalated_chapters.length > 0 && (
        <div className="card">
          <h3>Chapters awaiting your action</h3>
          <p style={{ color: "var(--text-dim)" }}>
            These chapters hit a QA check's retry cap and stopped rather
            than forcing through — see each chapter's state file for the
            specific failure and evidence.
          </p>
          <ul>
            {data.escalated_chapters.map((c) => (
              <li key={c}>Chapter {c}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
