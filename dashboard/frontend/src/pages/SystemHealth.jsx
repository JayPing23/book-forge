import React, { useEffect, useState } from "react";
import { api } from "../lib/api.js";
import { IconAlert, IconCheck, IconX } from "../components/icons.jsx";

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

      <p className="card-note">
        This page checks the current project's own files. For plugin-level
        health (bundled agents, skills, templates), run{" "}
        <code>/book-forge:book-doctor</code> in Claude Code.
      </p>
    </div>
  );
}
