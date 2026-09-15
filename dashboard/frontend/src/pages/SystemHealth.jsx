import React, { useEffect, useState } from "react";
import { api } from "../lib/api.js";
import { IconAlert, IconCheck, IconX } from "../components/icons.jsx";
import { Card, InfoTip, Spinner } from "../components/ui.jsx";

const DEBT_HINT = (
  <>
    An Override Contract is a soft QA finding you accepted instead of fixing —
    logged with a reason, never a silent pass. Debt weight reflects how much
    each reason costs: <code>EDITORIAL_INTENT</code> counts double because it's
    the only rationale with no external check behind it, while reasons grounded
    in world rules or character logic count half.
  </>
);

const PATTERN_HINT = (
  <>
    The same reviewer plus the same reason, accepted three or more times. That
    usually means one of two things: a standing authorial choice that belongs in
    the story-bible so it stops tripping the check at all, or a real recurring
    weakness. Either way it's a prompt to change something rather than keep
    excusing it — this is the loop that turns repeated friction into a fix.
  </>
);

function OverrideDebt({ project }) {
  const [debt, setDebt] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setDebt(null);
    setError(null);
    api.overrideDebt(project).then(setDebt).catch((e) => setError(e.message));
  }, [project]);

  if (error) return null; // non-critical section, fail quiet rather than blocking the page
  if (!debt) return <div className="skeleton skeleton-tile" aria-hidden="true" />;

  return (
    <Card title="Override Contract debt" hint={DEBT_HINT}>
      <table className="kv" style={{ marginBottom: debt.patterns.length ? 14 : 0 }}>
        <tbody>
          <tr><td>Open contracts</td><td className="num">{debt.contracts_count}</td></tr>
          <tr><td>Total debt weight</td><td className="num">{debt.total_debt_weight}</td></tr>
        </tbody>
      </table>

      {debt.patterns.length > 0 && (
        <>
          <p className="card-note">
            Recurring patterns worth acting on
            <InfoTip label="Recurring pattern">{PATTERN_HINT}</InfoTip>
          </p>
          <ul className="check-list">
            {debt.patterns.map((p) => (
              <li className="check-row is-fail" key={`${p.reviewer}-${p.rationale_type}`}>
                <IconAlert width={15} height={15} />
                <span>
                  {p.reviewer} × {p.rationale_type} — {p.count}× (chapters {p.chapters.join(", ")})
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      {debt.contracts_count === 0 && (
        <p className="card-note">No Override Contracts logged yet.</p>
      )}
    </Card>
  );
}

export default function SystemHealth({ project }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setData(null);
    setError(null);
    api.doctor(project).then(setData).catch((e) => setError(e.message));
  }, [project]);

  if (error) return <div className="error-banner" role="alert"><IconAlert /><span>{error}</span></div>;

  if (!data) {
    return (
      <div>
        <div className="eyebrow">Diagnostics</div>
        <h1 className="page-title">System Health</h1>
        <Spinner label="Running health checks" />
      </div>
    );
  }

  const failed = data.checks.filter((c) => !c.pass);
  const allPass = failed.length === 0;

  return (
    <div>
      <div className="eyebrow">Diagnostics</div>
      <h1 className="page-title">System Health</h1>
      <p className="page-sub">
        Structural checks on this project's own files — whether the folders and
        notes the pipeline depends on are actually present.
      </p>

      <Card
        title={
          allPass
            ? `All ${data.checks.length} checks pass`
            : `${failed.length} of ${data.checks.length} checks need attention`
        }
        hint={<>These check structure, not quality: that <code>story-bible/</code>, <code>outline/</code> and <code>manuscript/</code> exist, that a protagonist note is present, and that no chapter is sitting escalated. A failure here means something the pipeline reads is missing, not that the writing is weak.</>}
      >
        <ul className="check-list">
          {data.checks.map((c) => (
            <li className={`check-row ${c.pass ? "" : "is-fail"}`} key={c.label}>
              {/* Icon + color, never color alone */}
              {c.pass ? (
                <IconCheck width={15} height={15} style={{ color: "var(--ok)" }} />
              ) : (
                <IconX width={15} height={15} />
              )}
              <span>{c.label}</span>
              <span className="visually-hidden">{c.pass ? "— passing" : "— failing"}</span>
            </li>
          ))}
        </ul>
      </Card>

      <OverrideDebt project={project} />

      <p className="card-note">
        This page checks the current project's own files. For plugin-level
        health (bundled agents, skills, templates), run{" "}
        <code>/book-forge:book-doctor</code> in Claude Code.
      </p>
    </div>
  );
}
