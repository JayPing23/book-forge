import React, { useEffect, useState } from "react";
import { api } from "../lib/api.js";
import { IconAlert, IconStar } from "../components/icons.jsx";

export default function Characters({ project }) {
  const [characters, setCharacters] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setCharacters(null);
    setError(null);
    api.characters(project).then(setCharacters).catch((e) => setError(e.message));
  }, [project]);

  if (error) return <div className="error-banner" role="alert"><IconAlert /><span>{error}</span></div>;

  if (!characters) {
    return (
      <div>
        <h1 className="page-title">Characters</h1>
        <div className="skeleton skeleton-tile" aria-hidden="true" />
        <span className="visually-hidden" role="status">Loading characters</span>
      </div>
    );
  }

  if (characters.length === 0) {
    return (
      <div>
        <h1 className="page-title">Characters</h1>
        <div className="empty-state">
          No character notes yet. They're created during{" "}
          <code>/book-forge:book-new</code>, or add one under{" "}
          <code>story-bible/characters/</code>.
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="page-title">Characters</h1>
      {characters.map((c) => (
        <section className="card" key={c.name}>
          <h2>
            {c.name}{" "}
            {c.is_protagonist && (
              <span className="badge is-ok">
                <IconStar width={11} height={11} />
                protagonist
              </span>
            )}
          </h2>
          <table className="kv">
            <tbody>
              <tr><td>Speech register</td><td>{c.speech_register || "—"}</td></tr>
              <tr><td>Want</td><td>{c.want || "—"}</td></tr>
              <tr><td>Need</td><td>{c.need || "—"}</td></tr>
              <tr><td>Fear</td><td>{c.fear || "—"}</td></tr>
              <tr><td>Current status</td><td>{c.current_status || "—"}</td></tr>
            </tbody>
          </table>
        </section>
      ))}
    </div>
  );
}
