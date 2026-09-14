import React, { useEffect, useState } from "react";
import { api } from "../lib/api.js";

export default function PlotThreads({ project }) {
  const [threads, setThreads] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setThreads(null);
    setError(null);
    api.plotThreads(project).then(setThreads).catch((e) => setError(e.message));
  }, [project]);

  if (error) return <div className="error-banner">{error}</div>;
  if (!threads) return <div className="empty-state">Loading…</div>;
  if (threads.length === 0) {
    return (
      <div>
        <h2>Plot Threads</h2>
        <div className="empty-state">
          No plot threads logged yet — they get created automatically by
          the Thread-Ledger Reviewer as chapters introduce setups.
        </div>
      </div>
    );
  }

  const open = threads.filter((t) => t.status === "open");
  const paidOff = threads.filter((t) => t.status !== "open");

  return (
    <div>
      <h2>Plot Threads</h2>
      <div className="stat-row">
        <div className="stat-tile">
          <div className="label">Open</div>
          <div className="value">{open.length}</div>
        </div>
        <div className="stat-tile">
          <div className="label">Paid off</div>
          <div className="value">{paidOff.length}</div>
        </div>
        <div className="stat-tile">
          <div className="label">Overdue / critical</div>
          <div className="value" style={{ color: "var(--red)" }}>
            {open.filter((t) => t.urgency_status === "critical").length}
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Open threads (by urgency)</h3>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Tier</th>
              <th>Introduced</th>
              <th>Payoff due</th>
              <th>Urgency</th>
            </tr>
          </thead>
          <tbody>
            {[...open]
              .sort((a, b) => (b.urgency ?? 0) - (a.urgency ?? 0))
              .map((t) => (
                <tr key={t.name}>
                  <td>{t.name}</td>
                  <td>{t.tier}</td>
                  <td>{t.introduced_chapter || "—"}</td>
                  <td>{t.payoff_chapter || t.payoff_book || "open-ended"}</td>
                  <td>
                    <span className={`badge ${t.urgency_status}`}>
                      {t.urgency ?? "—"} {t.urgency_status}
                    </span>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {paidOff.length > 0 && (
        <div className="card">
          <h3>Paid off</h3>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Tier</th>
                <th>Introduced</th>
              </tr>
            </thead>
            <tbody>
              {paidOff.map((t) => (
                <tr key={t.name}>
                  <td>{t.name}</td>
                  <td>{t.tier}</td>
                  <td>{t.introduced_chapter || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
