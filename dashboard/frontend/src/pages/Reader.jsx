import React, { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../lib/api.js";
import { Empty, InfoTip } from "../components/ui.jsx";
import { IconAlert, IconBook } from "../components/icons.jsx";
import { parseProse, proseToText, downloadFile, slugify } from "../lib/prose.js";

/* Reader preferences, modelled on what serialized-fiction readers actually
   expose: theme (incl. sepia), text size, typeface, line spacing, column
   width, paragraph indent. Persisted per browser. */
const PREF_KEY = "book-forge.reader";
const DEFAULTS = {
  theme: "sepia",
  size: 18,
  family: "serif",
  leading: 1.75,
  width: 72,
  indent: false,
};

function loadPrefs() {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(PREF_KEY) || "{}") };
  } catch {
    return { ...DEFAULTS }; // private window / blocked storage — never fatal
  }
}

const FAMILIES = {
  serif: '"Crimson Pro", "Iowan Old Style", Georgia, serif',
  sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  // Used if installed locally; falls back cleanly if not. Not loaded from a
  // CDN — this dashboard runs offline.
  hyperlegible: '"Atkinson Hyperlegible", "OpenDyslexic", Verdana, sans-serif',
};

/* Spans -> React nodes. No innerHTML anywhere in the reading path, so chapter
   text can never inject markup regardless of what a file contains. */
function Line({ spans }) {
  return spans.map((s, i) => {
    if (s.strong) return <strong key={i}>{s.text}</strong>;
    if (s.em) return <em key={i}>{s.text}</em>;
    return <React.Fragment key={i}>{s.text}</React.Fragment>;
  });
}

function Prose({ blocks }) {
  return blocks.map((b, i) => {
    if (b.type === "break") return <hr key={i} className="scene-break" />;
    const inner = b.lines.map((spans, j) => (
      <React.Fragment key={j}>
        {j > 0 && <br />}
        <Line spans={spans} />
      </React.Fragment>
    ));
    if (b.type === "label") return <p key={i} className="scene-label">{inner}</p>;
    return <p key={i}>{inner}</p>;
  });
}

function ReaderSettings({ prefs, setPrefs, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    const onDown = (e) => ref.current && !ref.current.contains(e.target) && onClose();
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [onClose]);

  const set = (k) => (v) => setPrefs({ ...prefs, [k]: v });

  return (
    <div className="reader-settings" ref={ref} role="dialog" aria-label="Reading settings">
      <div className="rs-row">
        <span className="rs-label">Theme</span>
        <div className="seg">
          {["light", "sepia", "dark"].map((t) => (
            <button key={t} type="button" className="seg-btn"
                    aria-pressed={prefs.theme === t} onClick={() => set("theme")(t)}>
              {t[0].toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="rs-row">
        <span className="rs-label">Typeface</span>
        <div className="seg">
          {[["serif", "Serif"], ["sans", "Sans"], ["hyperlegible", "Legible"]].map(([k, lbl]) => (
            <button key={k} type="button" className="seg-btn"
                    aria-pressed={prefs.family === k} onClick={() => set("family")(k)}>
              {lbl}
            </button>
          ))}
        </div>
      </div>

      <label className="rs-row">
        <span className="rs-label">Text size</span>
        <input type="range" min="14" max="28" step="1" value={prefs.size}
               onChange={(e) => set("size")(Number(e.target.value))} />
        <span className="rs-value">{prefs.size}px</span>
      </label>

      <label className="rs-row">
        <span className="rs-label">Spacing</span>
        <input type="range" min="1.4" max="2.2" step="0.05" value={prefs.leading}
               onChange={(e) => set("leading")(Number(e.target.value))} />
        <span className="rs-value">{prefs.leading.toFixed(2)}</span>
      </label>

      <label className="rs-row">
        <span className="rs-label">Width</span>
        <input type="range" min="48" max="100" step="2" value={prefs.width}
               onChange={(e) => set("width")(Number(e.target.value))} />
        <span className="rs-value">{prefs.width}ch</span>
      </label>

      <label className="rs-row rs-check">
        <input type="checkbox" checked={prefs.indent}
               onChange={(e) => set("indent")(e.target.checked)} />
        <span>Indent paragraphs</span>
      </label>

      <button type="button" className="btn btn-ghost rs-reset"
              onClick={() => setPrefs({ ...DEFAULTS })}>
        Reset to defaults
      </button>
    </div>
  );
}

function ChapterList({ chapters, project, navigate }) {
  if (!chapters.length) {
    return (
      <Empty>
        No chapters yet. Run <code>/book-forge:book</code> in Claude Code to draft
        the first one.
      </Empty>
    );
  }
  return (
    <ol className="chapter-list">
      {chapters.map((c) => (
        <li key={c.chapter_id}>
          <button type="button" className="chapter-row"
                  onClick={() => navigate({ view: "reader", project, chapterId: c.chapter_id })}>
            <span className="chapter-num">{c.chapter_id}</span>
            <span className="chapter-name">{c.title || `Chapter ${c.number}`}</span>
            <span className="chapter-words">{(c.word_count || 0).toLocaleString()}w</span>
            <span className={`chapter-status is-${c.status || "draft"}`}>
              {c.status || "draft"}
            </span>
          </button>
        </li>
      ))}
    </ol>
  );
}

export default function Reader({ project, chapterId, navigate }) {
  const [chapters, setChapters] = useState(null);
  const [chapter, setChapter] = useState(null);
  const [error, setError] = useState(null);
  const [prefs, setPrefs] = useState(loadPrefs);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    try { localStorage.setItem(PREF_KEY, JSON.stringify(prefs)); } catch { /* non-fatal */ }
  }, [prefs]);

  useEffect(() => {
    setError(null);
    api.chapters(project).then(setChapters).catch((e) => setError(e.message));
  }, [project]);

  useEffect(() => {
    if (!chapterId) { setChapter(null); return; }
    setChapter(null);
    api.chapter(project, chapterId).then(setChapter).catch((e) => setError(e.message));
  }, [project, chapterId]);

  useEffect(() => {
    if (!chapter) return;
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(h > 0 ? Math.min(100, Math.max(0, (window.scrollY / h) * 100)) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [chapter]);

  // Arrow-key chapter paging, the way a real reader behaves.
  useEffect(() => {
    if (!chapter) return;
    const onKey = (e) => {
      if (e.target.closest("input, textarea, select, [role='dialog']")) return;
      if (e.key === "ArrowRight" && chapter.next)
        navigate({ view: "reader", project, chapterId: chapter.next });
      if (e.key === "ArrowLeft" && chapter.prev)
        navigate({ view: "reader", project, chapterId: chapter.prev });
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [chapter, project, navigate]);

  const blocks = useMemo(() => (chapter ? parseProse(chapter.body) : []), [chapter]);

  const exportAs = (fmt) => {
    if (!chapter) return;
    const base = `${chapter.chapter_id}-${slugify(chapter.title)}`;
    const heading = `Chapter ${chapter.number}: ${chapter.title}`;
    if (fmt === "txt") {
      downloadFile(`${base}.txt`, `${heading}\n\n${proseToText(chapter.body)}\n`, "text/plain");
    } else if (fmt === "md") {
      downloadFile(`${base}.md`, `# ${heading}\n\n${chapter.body}\n`, "text/markdown");
    } else if (fmt === "pdf") {
      // The browser's own print dialog -> "Save as PDF". A bundled PDF writer
      // would mean shipping a library; print gives correct pagination and
      // selectable text for free, and the print stylesheet strips the chrome.
      window.print();
    }
  };

  if (error) {
    return <div className="error-banner" role="alert"><IconAlert /><span>{error}</span></div>;
  }

  return (
    <div className={`reader reader-${prefs.theme}`}>
      {chapter && (
        <div className="reading-progress" role="progressbar" aria-label="Reading progress"
             aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
          <div className="reading-progress-bar" style={{ width: `${progress}%` }} />
        </div>
      )}

      <div className="reader-bar">
        <div className="reader-bar-left">
          <button type="button" className="btn btn-ghost"
                  onClick={() => navigate({ view: "reader", project })}>
            <IconBook width={14} height={14} />
            Chapters
          </button>
          {chapter && (
            <span className="reader-crumb">
              {chapter.chapter_id} · {(chapter.word_count || 0).toLocaleString()} words
            </span>
          )}
        </div>

        <div className="reader-bar-right">
          {chapter && (
            <div className="export-group">
              <span className="rs-label">Export</span>
              {["txt", "md", "pdf"].map((f) => (
                <button key={f} type="button" className="btn btn-ghost btn-sm"
                        onClick={() => exportAs(f)}>
                  {f.toUpperCase()}
                </button>
              ))}
              <InfoTip label="Export">
                TXT and MD download straight away. PDF opens your browser's print
                dialog — choose “Save as PDF”. That keeps the text selectable and
                paginates properly, which a screenshot-style export wouldn't.
              </InfoTip>
            </div>
          )}
          <div className="settings-wrap">
            <button type="button" className="btn btn-ghost" aria-expanded={settingsOpen}
                    aria-label="Reading settings" onClick={() => setSettingsOpen((v) => !v)}>
              Aa
            </button>
            {settingsOpen && (
              <ReaderSettings prefs={prefs} setPrefs={setPrefs}
                              onClose={() => setSettingsOpen(false)} />
            )}
          </div>
        </div>
      </div>

      {!chapterId && (
        <div className="reader-toc">
          <div className="eyebrow">Contents</div>
          <h1 className="page-title">{project}</h1>
          <p className="page-sub">
            {chapters
              ? `${chapters.length} chapter${chapters.length === 1 ? "" : "s"} · click any to read here`
              : "Loading…"}
          </p>
          {chapters && <ChapterList chapters={chapters} project={project} navigate={navigate} />}
        </div>
      )}

      {chapterId && !chapter && (
        <div className="reader-page">
          <div className="skeleton skeleton-tile" aria-hidden="true" />
          <span className="visually-hidden" role="status">Loading chapter</span>
        </div>
      )}

      {chapter && (
        <>
          <article
            className={`reader-page ${prefs.indent ? "is-indented" : ""}`}
            style={{
              "--reader-size": `${prefs.size}px`,
              "--reader-leading": prefs.leading,
              "--reader-width": `${prefs.width}ch`,
              "--reader-font": FAMILIES[prefs.family],
            }}
          >
            <header className="reader-title">
              <div className="reader-eyebrow">Chapter {chapter.number}</div>
              <h1>{chapter.title}</h1>
            </header>
            <div className="reader-prose"><Prose blocks={blocks} /></div>
          </article>

          <nav className="reader-nav" aria-label="Chapter navigation">
            <button type="button" className="btn" disabled={!chapter.prev}
                    onClick={() => navigate({ view: "reader", project, chapterId: chapter.prev })}>
              ← Previous
            </button>
            <span className="reader-nav-hint">Arrow keys work too</span>
            <button type="button" className="btn" disabled={!chapter.next}
                    onClick={() => navigate({ view: "reader", project, chapterId: chapter.next })}>
              Next →
            </button>
          </nav>
        </>
      )}
    </div>
  );
}
