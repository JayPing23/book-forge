import React, { useEffect, useState } from "react";
import { api } from "./lib/api.js";
import Overview from "./pages/Overview.jsx";
import Characters from "./pages/Characters.jsx";
import PlotThreads from "./pages/PlotThreads.jsx";
import Pacing from "./pages/Pacing.jsx";
import SystemHealth from "./pages/SystemHealth.jsx";
import {
  IconOverview,
  IconCharacters,
  IconThreads,
  IconPacing,
  IconHealth,
  IconAlert,
} from "./components/icons.jsx";

const PAGES = [
  { key: "overview", label: "Overview", Icon: IconOverview, Component: Overview },
  { key: "characters", label: "Characters", Icon: IconCharacters, Component: Characters },
  { key: "threads", label: "Plot Threads", Icon: IconThreads, Component: PlotThreads },
  { key: "pacing", label: "Pacing", Icon: IconPacing, Component: Pacing },
  { key: "system", label: "System Health", Icon: IconHealth, Component: SystemHealth },
];

export default function App() {
  const [projects, setProjects] = useState([]);
  const [selected, setSelected] = useState(null);
  const [page, setPage] = useState("overview");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .listProjects()
      .then((list) => {
        setProjects(list);
        if (list.length > 0) setSelected(list[0]);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const ActivePage = PAGES.find((p) => p.key === page)?.Component;

  return (
    <div className="app">
      <a className="skip-link" href="#main">Skip to content</a>

      <nav className="sidebar" aria-label="Dashboard sections">
        <div className="brand">book-forge</div>

        <div className="project-picker">
          <label htmlFor="project-select">Project</label>
          <select
            id="project-select"
            value={selected || ""}
            onChange={(e) => setSelected(e.target.value)}
            disabled={projects.length === 0}
          >
            {projects.length === 0 ? (
              <option>No projects yet</option>
            ) : (
              projects.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))
            )}
          </select>
        </div>

        {PAGES.map(({ key, label, Icon }) => (
          <button
            key={key}
            type="button"
            className="nav-item"
            aria-current={page === key ? "page" : undefined}
            onClick={() => setPage(key)}
          >
            <Icon />
            <span>{label}</span>
            <span className="visually-hidden">{page === key ? " (current section)" : ""}</span>
          </button>
        ))}
      </nav>

      <main className="main" id="main" tabIndex={-1}>
        {error && (
          <div className="error-banner" role="alert">
            <IconAlert />
            <span>{error}</span>
          </div>
        )}

        {!error && loading && <div className="empty-state">Loading projects…</div>}

        {!error && !loading && !selected && (
          <div className="empty-state">
            No projects found in this workspace. Run <code>/book-forge:book-new</code> in
            Claude Code to create one, then reload this page.
          </div>
        )}

        {!error && selected && ActivePage && <ActivePage project={selected} />}
      </main>
    </div>
  );
}
