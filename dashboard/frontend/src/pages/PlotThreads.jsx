import React, { useEffect, useState } from "react";
import { api } from "../lib/api.js";
import { IconAlert, IconCheck, IconClock } from "../components/icons.jsx";
import { Card, StatTile, InfoTip, Empty } from "../components/ui.jsx";

const STATUS_ICON = { critical: IconAlert, warning: IconClock, normal: IconCheck };

/* Concurrent-open-thread ceiling, scaled by length tier.
   This MUST match thread-ledger-reviewer's table — a long serial legitimately
   sustains far more live threads than a standalone novel, and warning at the
   standalone number would fire on nearly every chapter past the opening arc,
   training you to ignore the one signal that catches dropped promises. */
function threadCeiling(project) {
  if (!project || project.project_type === "complete-book") return 5;
  return { short: 8, mid: 15, long: 25 }[project.length_tier] ?? 5;
}

function UrgencyBadge({ status, urgency }) {
  const Icon = STATUS_ICON[status] || IconCheck;
  const tone =
    status === "critical" ? "is-danger" : status === "warning" ? "is-warn" : "is-ok";
  return (
    <span className={`badge ${tone}`}>
      <Icon width={11} height={11} />
      {urgency ?? "—"} {status}
    </span>
  );
}

const URGENCY_HINT = (
  <>
    Computed, not guessed:{" "}
    <code>(chapters elapsed ÷ tier window) × tier weight</code>. Core threads
    weigh 3× and are expected to pay off over ~50–300 chapters, side 2× over
    ~30–100, decorative 1× over ~10–30. Above 1.0, or past an explicit payoff
    chapter, counts as overdue.
  </>
);

export default function PlotThreads({ project }) {
  const [threads, setThreads] = useState(null);
  const [overview, setOverview] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setThreads(null);
    setError(null);
    api.plotThreads(project).then(setThreads).catch((e) => setError(e.message));
    api.overview(project).then(setOverview).catch(() => {});
  }, [project]);

  if (error) {
    return <div className="error-banner" role="alert"><IconAlert /><span>{error}</span></div>;
  }

  if (!threads) {
    return (
      <div>
        <div className="eyebrow">Story bible</div>
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
        <div className="eyebrow">Story bible</div>
        <h1 className="page-title">Plot Threads</h1>
        <Empty>
          No plot threads logged yet — the Thread-Ledger Reviewer creates these
          automatically as chapters introduce setups.
        </Empty>
      </div>
    );
  }

  const open = threads.filter((t) => t.status === "open");
  const paidOff = threads.filter((t) => t.status !== "open");
  const critical = open.filter((t) => t.urgency_status === "critical").length;
  const ceiling = threadCeiling(overview);
  const tierLabel = overview?.length_tier && overview.length_tier !== "n-a"
    ? `${overview.length_tier}-tier serial`
    : "this project type";

  return (
    <div>
      <div className="eyebrow">Story bible</div>
      <h1 className="page-title">Plot Threads</h1>
      <p className="page-sub">
        Every promise the book has made to the reader, and whether it's been
        kept. A dropped thread is the failure mode this ledger exists to catch.
      </p>

      <div className="stat-row" style={{ marginTop: 20 }}>
        <StatTile
          label="Open"
          value={open.length}
          sub={`ceiling ${ceiling} for ${tierLabel}`}
          hint={<>Threads still owing a payoff. The ceiling scales with length: 5 for a standalone book, 8 / 15 / 25 for short / mid / long serials. A long serial genuinely sustains many live threads — that's the form working, not a defect.</>}
        />
        <StatTile
          label="Paid off"
          value={paidOff.length}
          hint={<>Threads whose setup has been answered. A payoff that answers a different question than the setup raised doesn't count — the reviewer flags that separately.</>}
        />
        <StatTile
          label="Overdue"
          value={critical}
          tone={critical ? "danger" : "ok"}
          hint={<>Past an explicit payoff chapter, or urgency above 1.0. These are blocking findings for the Thread-Ledger Reviewer, not soft suggestions.</>}
        />
      </div>

      {open.length > ceiling && (
        <div className="error-banner" role="status">
          <IconAlert />
          <span>
            {open.length} threads open at once, above the ceiling of {ceiling} for{" "}
            {tierLabel}. Past that, both readers and the review pipeline start
            losing track — consider paying some off.
          </span>
        </div>
      )}

      <Card title="Open threads, most urgent first" hint={URGENCY_HINT}>
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
                <th scope="col" className="num">Introduced</th>
                <th scope="col" className="num">Payoff due</th>
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
                    <td className="num">
                      {t.payoff_chapter || t.payoff_book || "open-ended"}
                    </td>
                    <td>
                      <UrgencyBadge status={t.urgency_status} urgency={t.urgency} />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Card>

      {paidOff.length > 0 && (
        <Card title="Paid off">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Tier</th>
                  <th scope="col" className="num">Introduced</th>
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
        </Card>
      )}
    </div>
  );
}
