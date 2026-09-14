import React, { useEffect, useState } from "react";
import { api } from "./lib/api.js";
import Overview from "./pages/Overview.jsx";
import Characters from "./pages/Characters.jsx";
import PlotThreads from "./pages/PlotThreads.jsx";
import Pacing from "./pages/Pacing.jsx";
import SystemHealth from "./pages/SystemHealth.jsx";

const PAGES = [
  { key: "overview", label: "Overview", Component: Overview },
  { key: "characters", label: "Characters", Component: Characters },
  { key: "threads", label: "Plot Threads", Component: PlotThreads },
  { key: "pacing", label: "Pacing", Component: Pacing },
  { key: "system", label: "System Health", Component: SystemHealth },
];

export default function App() {
  const [projects, setProjects] = useState([]);
  const [selected, setSelected] = useState(null);
  const [page, setPage] = useState("overview");
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .listProjects()
      .then((list) => {
        setProjects(list);
        if (list.length > 0) setSelected(list[0]);
      })
      .catch((e) => setError(e.message));
  }, []);

  const ActivePage = PAGES.find((p) => p.key === page)?.Component;

  return (
    <div className="app">
      <div className="sidebar">
        <h1>book-forge</h1>
        {projects.length > 0 ? (
          <select value={selected || ""} onChange={(e) => setSelected(e.target.value)}>
            {projects.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        ) : (
          <select disabled>
            <option>No projects yet</option>
          </select>
        )}
        {PAGES.map((p) => (
          <div
            key={p.key}
            className={`nav-item ${page === p.key ? "active" : ""}`}
            onClick={() => setPage(p.key)}
          >
            {p.label}
          </div>
        ))}
      </div>
      <div className="main">
        {error && <div className="error-banner">{error}</div>}
        {!error && !selected && (
          <div className="empty-state">
            No projects found. Run <code>/book-forge:book-new</code> in your
            workspace to create one.
          </div>
        )}
        {!error && selected && ActivePage && <ActivePage project={selected} />}
      </div>
    </div>
  );
}
