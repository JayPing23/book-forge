import React, { useEffect, useState } from "react";
import { api } from "../lib/api.js";
import { IconAlert } from "../components/icons.jsx";
import { Card, StatTile, Spinner, InfoTip } from "../components/ui.jsx";
import ImageUpload, { specForProject } from "../components/ImageUpload.jsx";

export default function Overview({ project }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setData(null);
    setError(null);
    api.overview(project).then(setData).catch((e) => setError(e.message));
  }, [project]);

  if (error) {
    return <div className="error-banner" role="alert"><IconAlert /><span>{error}</span></div>;
  }

  if (!data) {
    return (
      <div>
        <div className="eyebrow">Overview</div>
        <h1 className="page-title">{project}</h1>
        <Spinner label="Loading project overview" />
      </div>
    );
  }

  const escalated = data.escalated_chapters.length;
  const target = Number(data.target_chapter_words) || null;
  const avgWords = data.chapter_count ? Math.round(data.total_words / data.chapter_count) : 0;

  return (
    <div>
      <div className="eyebrow">Overview</div>
      <h1 className="page-title">{project}</h1>
      <p className="page-sub">
        Where this project stands right now. Every number is computed from your
        own files — nothing is estimated.
      </p>

      <div className="stat-row" style={{ marginTop: 20 }}>
        <StatTile
          label="Chapters"
          value={data.chapter_count}
          hint={<>Files in <code>manuscript/</code>. One file per chapter — that's how the pipeline writes them, so this is a true count, not a guess.</>}
        />
        <StatTile
          label="Total words"
          value={data.total_words.toLocaleString()}
          sub={avgWords ? `${avgWords.toLocaleString()} avg/chapter` : null}
          hint={<>Prose only. Frontmatter and chapter headings are excluded, so this is the word count a publisher would see — not the raw file size.</>}
        />
        <StatTile
          label="Latest chapter"
          value={data.latest_chapter || "—"}
          hint={<>Highest-numbered chapter on disk. Drafted, not necessarily published — see Buffer.</>}
        />
        <StatTile
          label="Escalated"
          value={escalated}
          tone={escalated ? "danger" : "ok"}
          hint={<>Chapters that hit a QA check's retry cap and <em>stopped</em> rather than being forced through. Anything above zero is waiting on a decision from you.</>}
        />
      </div>

      {data.published_through && (
        <div className="stat-row">
          <StatTile
            label="Published through"
            value={data.published_through}
            hint={<>The publication frontier, set by <code>/book-forge:book-publish</code>. Chapters at or below it are treated as <strong>immutable</strong> — readers have seen them, so QA proposes fix-forward solutions instead of edits you can't make.</>}
          />
          <StatTile
            label="Buffer"
            value={data.buffer ?? "—"}
            tone={data.buffer === 0 ? "danger" : undefined}
            sub="chapters drafted, not yet posted"
            hint={<>Finalized minus published. Your safety margin: a plot problem found at chapter 60 can still be fixed at 55 if 55 hasn't posted. Human serial authors typically keep 4–16; drafting at AI speed yours can run far deeper.</>}
          />
          {target && (
            <StatTile
              label="Target length"
              value={`${target.toLocaleString()}w`}
              sub="per chapter"
              hint={<>Set at project creation and never assumed — the pipeline asks rather than defaulting. Used to flag chapters that land well under or over.</>}
            />
          )}
        </div>
      )}

      <Card
        title="Cover"
        hint={<>Stored in <code>story-bible/images/</code> and shown on the library shelf. The dimension check below is the target platform's own rule — advisory, never enforced, since you may be uploading a work in progress.</>}
        note={
          <>
            book-forge writes a cover <em>brief</em> (art direction —
            composition, palette, mood) via <code>/book-forge:book-cover</code>,
            not an image. Take that brief to an illustrator or an image tool,
            then upload the result here to see it on the shelf.
          </>
        }
      >
        <ImageUpload
          project={data}
          kind="cover"
          aspect={data.project_type === "complete-book" ? "1 / 1.6" : "3 / 4"}
          spec={specForProject(data)}
        />
      </Card>

      <Card
        title="Project settings"
        hint={<>Read from <code>project.json</code>. These drive real behaviour: the length tier scales the open-thread ceiling and compaction cadence, and the platform sets which export profile is used.</>}
      >
        <table className="kv">
          <tbody>
            <tr><td>Project type</td><td>{data.project_type || "—"}</td></tr>
            <tr><td>Genre</td><td>{data.genre || "—"}</td></tr>
            <tr><td>Depth dial</td><td>{data.depth_dial || "—"}</td></tr>
            <tr>
              <td>
                Length tier{" "}
                <InfoTip label="Length tier">
                  short ≈100–250 chapters, mid ≈500, long ≈1000. Not cosmetic: it
                  sets how many plot threads can be open at once before the
                  reviewer complains, and how often volumes need compacting.
                </InfoTip>
              </td>
              <td>{data.length_tier || "—"}</td>
            </tr>
            <tr><td>Platform</td><td>{data.platform_convention || "—"}</td></tr>
            <tr><td>IP status</td><td>{data.ip_status || "—"}</td></tr>
            <tr>
              <td>Monetization allowed</td>
              <td>{String(data.monetization_allowed)}</td>
            </tr>
          </tbody>
        </table>
      </Card>

      {escalated > 0 && (
        <Card
          title="Chapters awaiting your decision"
          note="These hit a QA check's retry cap and stopped rather than forcing through. Each chapter's state file holds the specific failure and its evidence."
        >
          <ul className="check-list">
            {data.escalated_chapters.map((c) => (
              <li key={c} className="check-row is-fail">
                <IconAlert width={15} height={15} />
                <span>Chapter {c}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
