import React, { useEffect, useState } from "react";
import { api } from "../lib/api.js";

export default function SystemHealth({ project }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setData(null);
    setError(null);
    api.doctor(project).then(setData).catch((e) => setError(e.message));
  }, [project]);

  if (error) return <div className="error-banner">{error}</div>;
  if (!data) return <div className="empty-state">Loading…</div>;

  const allPass = data.checks.every((c) => c.pass);

  return (
    <div>
      <h2>System Health</h2>
      <div className="card">
        <h3>{allPass ? "All checks pass" : "Some checks need attention"}</h3>
        <div className="check-list">
          {data.checks.map((c) => (
            <div className="check-row" key={c.label}>
              <span className={`dot ${c.pass ? "pass" : "fail"}`} />
              {c.label}
            </div>
          ))}
        </div>
      </div>
      <p style={{ color: "var(--text-dim)", fontSize: 12 }}>
        For plugin-level health (bundled agents, skills, templates), run{" "}
        <code>/book-forge:book-doctor</code> in Claude Code — this page
        checks the current project's own files, not the plugin install.
      </p>
    </div>
  );
}
