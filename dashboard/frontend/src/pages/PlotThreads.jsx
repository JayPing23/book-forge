import React, { useEffect, useState } from "react";
import { api } from "../lib/api.js";
import { IconAlert, IconCheck, IconClock } from "../components/icons.jsx";

const STATUS_ICON = {
  critical: IconAlert,
  warning: IconClock,
  normal: IconCheck,
};

function UrgencyBadge({ status, urgency }) {
  const Icon = STATUS_ICON[status] || IconCheck;
  const tone = status === "critical" ? "is-danger" : status === "warning" ? "is-warn" : "is-ok";
  return (
    <span className={`badge ${tone}`}>
      <Icon width={11} height={11} />
      {urgency ?? "—"} {status}
    </span>
  );
}

export default function PlotThreads({ project }) {
  const [threads, setThreads] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setThreads(null);
    setError(null);
    api.plotThreads(project).then(setThreads).catch((e) => setError(e.message));
  }, [project]);

  if (error) return <div className="error-banner" role="alert"><IconAlert /><span>{error}</span></div>;

  if (!threads) {
    return (
      <div>
        <h1 className="page-title">Plot Threads</h1>
        <div aria-hidden="true">
          {[0, 1, 2].map((i) => <div key={i} className="skeleton skeleton-row" />)}
        </div>
        <span className="visually-hidden" role="status">Loading plot threads</span>
      </div>
    );
  }

  if (threads.length === 0) {
    return (
      <div>
        <h1 className="page-title">Plot Threads</h1>
        <div className="empty-state">
          No plot threads logged yet — the Thread-Ledger Reviewer creates
          these automatically as chapters introduce setups.
        </div>
      </div>
    );
  }

  const open = threads.filter((t) => t.status === "open");
  const paidOff = threads.filter((t) => t.status !== "open");
  const critical = open.filter((t) => t.urgency_status === "critical").length;

  return (
    <div>
      <h1 className="page-title">Plot Threads</h1>

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
          <div className="label">Overdue</div>
          <div className={`value ${critical ? "is-danger" : "is-ok"}`}>{critical}</div>
        </div>
      </div>

      {open.length > 5 && (
        <div className="error-banner" role="status">
          <IconAlert />
          <span>
            {open.length} threads open at once. Past roughly 5, both readers and
            the review pipeline start losing track — consider paying some off.
          </span>
        </div>
      )}

      <section className="card">
        <h2>Open threads, most urgent first</h2>
        <div className="table-scroll">
          <table>
            <caption className="visually-hidden">
              Open plot threads sorted by urgency, showing tier, introduction
              chapter, payoff due chapter, and urgency status.
            </caption>
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Tier</th>
                <th scope="col">Introduced</th>
                <th scope="col">Payoff due</th>
                <th scope="col">Urgency</th>
              </tr>
            </thead>
            <tbody>
              {[...open]
                .sort((a, b) => (b.urgency ?? 0) - (a.urgency ?? 0))
                .map((t) => (
                  <tr key={t.name}>
                    <td>{t.name}</td>
                    <td>{t.tier}</td>
                    <td className="num">{t.introduced_chapter || "—"}</td>
                    <td className="num">{t.payoff_chapter || t.payoff_book || "open-ended"}</td>
                    <td>
                      <UrgencyBadge status={t.urgency_status} urgency={t.urgency} />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>

      {paidOff.length > 0 && (
        <section className="card">
          <h2>Paid off</h2>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Tier</th>
                  <th scope="col">Introduced</th>
                </tr>
              </thead>
              <tbody>
                {paidOff.map((t) => (
                  <tr key={t.name}>
                    <td>{t.name}</td>
                    <td>{t.tier}</td>
                    <td className="num">{t.introduced_chapter || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
