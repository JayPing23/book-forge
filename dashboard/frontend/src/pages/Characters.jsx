import React, { useEffect, useState } from "react";
import { api } from "../lib/api.js";
import { IconAlert, IconStar } from "../components/icons.jsx";
import { Spinner, Empty, InfoTip } from "../components/ui.jsx";
import ImageUpload from "../components/ImageUpload.jsx";

export default function Characters({ project }) {
  const [characters, setCharacters] = useState(null);
  const [overview, setOverview] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setCharacters(null);
    setError(null);
    api.characters(project).then(setCharacters).catch((e) => setError(e.message));
    api.overview(project).then(setOverview).catch(() => {});
  }, [project]);

  if (error) {
    return <div className="error-banner" role="alert"><IconAlert /><span>{error}</span></div>;
  }

  if (!characters) {
    return (
      <div>
        <div className="eyebrow">Story bible</div>
        <h1 className="page-title">Characters</h1>
        <Spinner label="Loading characters" />
      </div>
    );
  }

  if (characters.length === 0) {
    return (
      <div>
        <div className="eyebrow">Story bible</div>
        <h1 className="page-title">Characters</h1>
        <Empty>
          No character notes yet. They're created during{" "}
          <code>/book-forge:book</code>, or add one under{" "}
          <code>story-bible/characters/</code>.
        </Empty>
      </div>
    );
  }

  const proj = overview || { name: project };

  return (
    <div>
      <div className="eyebrow">Story bible</div>
      <h1 className="page-title">Characters</h1>
      <p className="page-sub">
        Voice Profile and Motivation Core are set at creation and never inferred
        from chapter text — they're what the voice and motivation reviewers check
        every chapter against.
        <InfoTip label="Portraits">
          Optional, and purely for your own reference while writing — portraits
          are never read by any agent and never included in an export. They're
          stored alongside the book in <code>story-bible/images/</code>.
        </InfoTip>
      </p>

      {characters.map((c) => (
        <section className="card" key={c.slug || c.name}>
          <div className="character-row">
            <ImageUpload
              project={proj}
              kind="portrait"
              slug={c.slug || c.name}
              aspect="1 / 1"
              title="Portrait"
            />

            <div className="character-detail">
              <h2>
                {c.name}{" "}
                {c.is_protagonist && (
                  <span className="chip">
                    <IconStar width={10} height={10} /> protagonist
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
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
