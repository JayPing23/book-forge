import React, { useEffect, useState } from "react";
import { api } from "../lib/api.js";

export default function Characters({ project }) {
  const [characters, setCharacters] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setCharacters(null);
    setError(null);
    api.characters(project).then(setCharacters).catch((e) => setError(e.message));
  }, [project]);

  if (error) return <div className="error-banner">{error}</div>;
  if (!characters) return <div className="empty-state">Loading…</div>;
  if (characters.length === 0) {
    return (
      <div>
        <h2>Characters</h2>
        <div className="empty-state">
          No character notes yet. Create one during{" "}
          <code>/book-forge:book-new</code> or add a note under{" "}
          <code>story-bible/characters/</code>.
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2>Characters</h2>
      {characters.map((c) => (
        <div className="card" key={c.name}>
          <h3>
            {c.name} {c.is_protagonist && <span className="badge normal">protagonist</span>}
          </h3>
          <table>
            <tbody>
              <tr><td style={{ width: 140 }}>Speech register</td><td>{c.speech_register || "—"}</td></tr>
              <tr><td>Want</td><td>{c.want || "—"}</td></tr>
              <tr><td>Need</td><td>{c.need || "—"}</td></tr>
              <tr><td>Fear</td><td>{c.fear || "—"}</td></tr>
              <tr><td>Current status</td><td>{c.current_status || "—"}</td></tr>
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
