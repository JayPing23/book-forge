import React, { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../lib/api.js";
import { InfoTip } from "./ui.jsx";

/*
 * Platform cover specs. Sourced from each platform's own docs during the
 * platform-profile research; see templates/platforms/*.md for the citations
 * and for which fields were verified vs. unconfirmed.
 *
 * `check` returns null when fine, or a human sentence describing the mismatch.
 * Advisory only — nothing here blocks an upload, because these are the
 * platform's rules, not ours, and the author may be uploading a work in
 * progress.
 */
export const COVER_SPECS = {
  "royal-road": {
    label: "Royal Road",
    rule: "400 × 600 px or larger",
    check: (w, h) =>
      w < 400 || h < 600 ? `${w}×${h} is below Royal Road's 400×600 minimum.` : null,
  },
  "webnovel-qidian": {
    label: "Webnovel / Qidian",
    rule: "exactly 600 × 800 px, JPG, ≤ 5 MB",
    check: (w, h) =>
      w !== 600 || h !== 800
        ? `${w}×${h} — Webnovel requires exactly 600×800, and rejects anything else.`
        : null,
  },
  "scribble-hub": {
    label: "Scribble Hub",
    rule: "shown at 250 × 350; supply ~1250 × 1750, under 3 MB",
    check: (w, h) =>
      w < 250 || h < 350
        ? `${w}×${h} is below the 250×350 display size.`
        : w < 1000
        ? `${w}×${h} will work, but authoring larger (~1250×1750) stays sharper after downscaling.`
        : null,
  },
  kdp: {
    label: "Amazon KDP",
    rule: "1600 × 2560 px (1.6:1), JPEG, sRGB",
    check: (w, h) => {
      if (w < 1000 || h < 625) return `${w}×${h} is below KDP's 1000×625 minimum.`;
      const ratio = h / w;
      if (Math.abs(ratio - 1.6) > 0.12)
        return `${w}×${h} is ${ratio.toFixed(2)}:1 — KDP expects roughly 1.6:1, so this may letterbox.`;
      return null;
    },
  },
};

export function specForProject(project) {
  if (!project) return null;
  if (project.project_type === "complete-book") return COVER_SPECS.kdp;
  return COVER_SPECS[project.platform_convention] || null;
}

/*
 * ImageUpload — drop zone + picker + preview, for a cover or a character
 * portrait. The preview is the uploaded file itself (served back by the API),
 * so what you see is exactly what is on disk.
 */
export default function ImageUpload({
  project, kind, slug, spec, aspect = "3 / 4", title, hint,
}) {
  const [version, setVersion] = useState(() => Date.now());
  const [hasImage, setHasImage] = useState(true); // assume, let onError correct it
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [dims, setDims] = useState(null);
  const inputRef = useRef(null);

  const src = api.imageUrl(project.name, kind, slug, version);

  useEffect(() => { setHasImage(true); setError(null); }, [project.name, slug]);

  const upload = useCallback(async (file) => {
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      await api.uploadImage(project.name, kind, slug, file);
      setVersion(Date.now());   // cache-bust so the new file actually shows
      setHasImage(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }, [project.name, kind, slug]);

  const remove = async () => {
    setBusy(true);
    try {
      await api.deleteImage(project.name, kind, slug);
      setHasImage(false);
      setDims(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    upload(e.dataTransfer.files?.[0]);
  };

  const mismatch = dims && spec?.check ? spec.check(dims.w, dims.h) : null;

  return (
    <div className="uploader">
      {title && (
        <div className="label uploader-title">
          {title}
          {hint && <InfoTip label={title}>{hint}</InfoTip>}
        </div>
      )}

      <div
        className={`dropzone ${dragging ? "is-dragging" : ""} ${hasImage ? "has-image" : ""}`}
        style={{ aspectRatio: aspect }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        {hasImage ? (
          <img
            className="dropzone-img"
            src={src}
            alt={kind === "cover" ? `Cover for ${project.name}` : `Portrait of ${slug}`}
            onLoad={(e) =>
              setDims({ w: e.target.naturalWidth, h: e.target.naturalHeight })
            }
            onError={() => setHasImage(false)}
          />
        ) : (
          <button
            type="button"
            className="dropzone-empty"
            onClick={() => inputRef.current?.click()}
          >
            <span className="dropzone-plus" aria-hidden="true">+</span>
            <span className="dropzone-text">
              Drop an image, or <u>choose a file</u>
            </span>
            {spec && <span className="dropzone-spec">{spec.rule}</span>}
          </button>
        )}

        {busy && <div className="dropzone-busy" role="status">Uploading…</div>}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp"
        className="visually-hidden"
        onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ""; }}
      />

      <div className="uploader-actions">
        <button type="button" className="btn btn-sm" disabled={busy}
                onClick={() => inputRef.current?.click()}>
          {hasImage ? "Replace" : "Upload"}
        </button>
        {hasImage && (
          <button type="button" className="btn btn-sm btn-ghost" disabled={busy}
                  onClick={remove}>
            Remove
          </button>
        )}
        {dims && <span className="uploader-dims">{dims.w} × {dims.h}</span>}
      </div>

      {spec && hasImage && (
        <p className={`uploader-spec ${mismatch ? "is-warn" : "is-ok"}`}>
          {mismatch || `Meets ${spec.label}: ${spec.rule}.`}
        </p>
      )}

      {error && <p className="uploader-error" role="alert">{error}</p>}
    </div>
  );
}
