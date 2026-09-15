import React, { useEffect, useId, useRef, useState } from "react";

/*
 * InfoTip — the "what is this number?" affordance.
 *
 * A real button in the tab order with aria-expanded, not a title= tooltip:
 * title attributes are invisible to touch, unreliable for screen readers, and
 * can't hold more than a few words. Every metric in this dashboard is derived
 * from something non-obvious (urgency formulas, debt weights, buffers), so the
 * explanation has to be reachable without leaving the page.
 */
export function InfoTip({ label, children }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <span className="infotip" ref={wrapRef}>
      <button
        type="button"
        className="infotip-btn"
        aria-expanded={open}
        aria-controls={id}
        aria-label={`What is ${label}?`}
        onClick={() => setOpen((v) => !v)}
      >
        ?
      </button>
      {open && (
        <span className="infotip-pop" id={id} role="note">
          <strong>{label}</strong>
          {children}
        </span>
      )}
    </span>
  );
}

/* A metric with its explanation attached, so the grid never needs a legend. */
export function StatTile({ label, value, hint, tone, sub }) {
  return (
    <div className="stat-tile">
      <div className="label">
        {label}
        {hint && <InfoTip label={label}>{hint}</InfoTip>}
      </div>
      <div className={`value ${tone ? `is-${tone}` : ""}`}>{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

export function Card({ title, hint, note, children, actions }) {
  return (
    <section className="card">
      {(title || actions) && (
        <div className="card-head">
          <h2>
            {title}
            {hint && <InfoTip label={title}>{hint}</InfoTip>}
          </h2>
          {actions && <div className="card-actions">{actions}</div>}
        </div>
      )}
      {note && <p className="card-note">{note}</p>}
      {children}
    </section>
  );
}

/*
 * CoverArt — a generated typographic cover.
 *
 * book-forge produces a cover *brief* (text art direction), never an image,
 * so there is no artwork to show. Rather than a grey placeholder box, derive a
 * stable hue from the title so each book is visually recognisable in the grid
 * the way a real cover would be. Deterministic: the same book always gets the
 * same colour across reloads and machines.
 */
export function CoverArt({ title, genre, size = "grid" }) {
  let h = 0;
  for (let i = 0; i < title.length; i++) h = (h * 31 + title.charCodeAt(i)) % 360;
  const h2 = (h + 38) % 360;
  const words = title.split(/[\s_-]+/).filter(Boolean);

  return (
    <div
      className={`cover cover-${size}`}
      style={{
        background: `linear-gradient(150deg,
          oklch(0.42 0.13 ${h}) 0%,
          oklch(0.28 0.10 ${h2}) 62%,
          oklch(0.20 0.06 ${h2}) 100%)`,
      }}
      aria-hidden="true"
    >
      <div className="cover-rule" />
      <div className="cover-title">
        {words.slice(0, 4).map((w, i) => (
          <span key={i}>{w}</span>
        ))}
      </div>
      {genre && <div className="cover-genre">{genre}</div>}
    </div>
  );
}

export function Empty({ children }) {
  return <div className="empty-state">{children}</div>;
}

export function Spinner({ label }) {
  return (
    <>
      <div className="skeleton skeleton-tile" aria-hidden="true" />
      <span className="visually-hidden" role="status">{label}</span>
    </>
  );
}
