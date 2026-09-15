import React, { useEffect, useState } from "react";
import { api } from "../lib/api.js";
import { IconAlert, IconCheck, IconX } from "../components/icons.jsx";

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
    <section className="card">
      <h2>Override Contract debt</h2>
      <table className="kv" style={{ marginBottom: debt.patterns.length ? 14 : 0 }}>
        <tbody>
          <tr><td>Open contracts</td><td className="num">{debt.contracts_count}</td></tr>
          <tr><td>Total debt weight</td><td className="num">{debt.total_debt_weight}</td></tr>
        </tbody>
      </table>

      {debt.patterns.length > 0 && (
        <>
          <p className="card-note">
            The same reviewer + rationale accepted 3 or more times — per the
            <code> qa-standards</code> skill, this means either a standing
            authorial choice belongs in the story-bible/genre-template (so it
            stops tripping the check at all) or it's a real recurring
            weakness worth fixing.
          </p>
          <ul className="check-list" style={{ listStyle: "none", margin: 0, padding: 0 }}>
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
    </section>
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
        <h1 className="page-title">System Health</h1>
        <div className="skeleton skeleton-tile" aria-hidden="true" />
        <span className="visually-hidden" role="status">Running health checks</span>
      </div>
    );
  }

  const failed = data.checks.filter((c) => !c.pass);
  const allPass = failed.length === 0;

  return (
    <div>
      <h1 className="page-title">System Health</h1>

      <section className="card">
        <h2>
          {allPass
            ? `All ${data.checks.length} checks pass`
            : `${failed.length} of ${data.checks.length} checks need attention`}
        </h2>
        <ul className="check-list" style={{ listStyle: "none", margin: 0, padding: 0 }}>
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
      </section>

      <OverrideDebt project={project} />

      <p className="card-note">
        This page checks the current project's own files. For plugin-level
        health (bundled agents, skills, templates), run{" "}
        <code>/book-forge:book-doctor</code> in Claude Code.
      </p>
    </div>
  );
}
