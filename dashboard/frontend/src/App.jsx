import React, { useEffect, useState } from "react";
import { useRoute, href } from "./lib/router.js";
import Library from "./pages/Library.jsx";
import Reader from "./pages/Reader.jsx";
import Overview from "./pages/Overview.jsx";
import Characters from "./pages/Characters.jsx";
import PlotThreads from "./pages/PlotThreads.jsx";
import Pacing from "./pages/Pacing.jsx";
import SystemHealth from "./pages/SystemHealth.jsx";
import { CoverArt } from "./components/ui.jsx";
import {
  IconOverview, IconCharacters, IconThreads, IconPacing,
  IconHealth, IconBook, IconSun, IconMoon, IconLibrary,
} from "./components/icons.jsx";

const SECTIONS = [
  { key: "overview", label: "Overview", Icon: IconOverview, Component: Overview },
  { key: "characters", label: "Characters", Icon: IconCharacters, Component: Characters },
  { key: "threads", label: "Plot Threads", Icon: IconThreads, Component: PlotThreads },
  { key: "pacing", label: "Pacing", Icon: IconPacing, Component: Pacing },
  { key: "system", label: "System Health", Icon: IconHealth, Component: SystemHealth },
];

const THEME_KEY = "book-forge.theme";

function useTheme() {
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem(THEME_KEY) || "system"; } catch { return "system"; }
  });

  useEffect(() => {
    const root = document.documentElement;
    // "system" removes the attribute entirely so the prefers-color-scheme
    // media query in the stylesheet takes over, rather than us snapshotting
    // the OS value once and going stale when the user flips their OS theme.
    if (theme === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", theme);
    try { localStorage.setItem(THEME_KEY, theme); } catch { /* non-fatal */ }
  }, [theme]);

  return [theme, setTheme];
}

function ThemeToggle({ theme, setTheme }) {
  const order = ["system", "light", "dark"];
  const next = order[(order.indexOf(theme) + 1) % order.length];
  const Icon = theme === "dark" ? IconMoon : IconSun;
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={() => setTheme(next)}
      aria-label={`Theme: ${theme}. Switch to ${next}.`}
      title={`Theme: ${theme} — click for ${next}`}
    >
      <Icon width={13} height={13} />
      {theme}
    </button>
  );
}

function BookShell({ project, section, navigate }) {
  const active = SECTIONS.find((s) => s.key === section) || SECTIONS[0];
  const ActivePage = active.Component;

  return (
    <div className="book-shell">
      <nav className="sidebar" aria-label={`${project} sections`}>
        <div className="sidebar-book">
          <CoverArt title={project} size="wide" />
          <h2 className="sidebar-title">{project}</h2>
          <p className="sidebar-note">
            Everything below reads this project's own files. Nothing here writes
            to your manuscript.
          </p>
        </div>

        <div className="sidebar-section">
          <div className="eyebrow" style={{ padding: "0 9px 6px" }}>Read</div>
          <button type="button" className="nav-item"
                  onClick={() => navigate({ view: "reader", project })}>
            <IconBook />
            <span>Chapters</span>
          </button>
        </div>

        <div className="sidebar-section">
          <div className="eyebrow" style={{ padding: "0 9px 6px" }}>Analyse</div>
          {SECTIONS.map(({ key, label, Icon }) => (
            <button
              key={key}
              type="button"
              className="nav-item"
              aria-current={section === key ? "page" : undefined}
              onClick={() => navigate({ view: "book", project, section: key })}
            >
              <Icon />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </nav>

      <main className="main" id="main" tabIndex={-1}>
        <ActivePage project={project} />
      </main>
    </div>
  );
}

export default function App() {
  const { route, navigate } = useRoute();
  const [theme, setTheme] = useTheme();

  const inBook = route.view === "book" || route.view === "reader";

  return (
    <div className="app">
      <a className="skip-link" href="#main">Skip to content</a>

      <header className="topbar">
        <a className="wordmark" href="#/"
           onClick={(e) => { e.preventDefault(); navigate({ view: "library" }); }}>
          <b>book-forge</b>
          <span>writing desk</span>
        </a>

        <nav className="topbar-nav" aria-label="Primary">
          <a href="#/" aria-current={route.view === "library" ? "page" : undefined}
             onClick={(e) => { e.preventDefault(); navigate({ view: "library" }); }}>
            Library
          </a>
          {inBook && (
            <>
              <a href={href({ view: "book", project: route.project, section: "overview" })}
                 aria-current={route.view === "book" ? "page" : undefined}
                 onClick={(e) => {
                   e.preventDefault();
                   navigate({ view: "book", project: route.project, section: "overview" });
                 }}>
                Dashboard
              </a>
              <a href={href({ view: "reader", project: route.project })}
                 aria-current={route.view === "reader" ? "page" : undefined}
                 onClick={(e) => {
                   e.preventDefault();
                   navigate({ view: "reader", project: route.project });
                 }}>
                Read
              </a>
            </>
          )}
        </nav>

        <span className="topbar-spacer" />
        {inBook && <span className="reader-crumb">{route.project}</span>}
        <ThemeToggle theme={theme} setTheme={setTheme} />
      </header>

      {route.view === "library" && (
        <main id="main" tabIndex={-1}>
          <Library navigate={navigate} />
        </main>
      )}

      {route.view === "reader" && (
        <main id="main" tabIndex={-1}>
          <Reader project={route.project} chapterId={route.chapterId} navigate={navigate} />
        </main>
      )}

      {route.view === "book" && (
        <BookShell project={route.project} section={route.section} navigate={navigate} />
      )}
    </div>
  );
}
