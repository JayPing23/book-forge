const BASE = "/api";

async function getJSON(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

const enc = encodeURIComponent;

export const api = {
  listProjects: () => getJSON("/projects").then((d) => d.projects),
  library: () => getJSON("/library").then((d) => d.books),
  overview: (name) => getJSON(`/projects/${enc(name)}/overview`),
  characters: (name) => getJSON(`/projects/${enc(name)}/characters`).then((d) => d.characters),
  plotThreads: (name) => getJSON(`/projects/${enc(name)}/plot-threads`).then((d) => d.threads),
  pacing: (name) => getJSON(`/projects/${enc(name)}/pacing`),
  doctor: (name) => getJSON(`/projects/${enc(name)}/doctor`),
  overrideDebt: (name) => getJSON(`/projects/${enc(name)}/override-debt`),
  chapters: (name) => getJSON(`/projects/${enc(name)}/chapters`).then((d) => d.chapters),
  chapter: (name, id) => getJSON(`/projects/${enc(name)}/chapters/${enc(id)}`),

  /* Images. The URL is stable, so <img> can point straight at it and fall back
     on error rather than us probing with a HEAD request first. The cache-buster
     is how a freshly replaced image shows up without a reload. */
  imageUrl: (name, kind, slug, v) =>
    `${BASE}/projects/${enc(name)}/` +
    (kind === "cover" ? "cover" : `portrait/${enc(slug)}`) +
    (v ? `?v=${v}` : ""),

  uploadImage: async (name, kind, slug, file) => {
    const path =
      `${BASE}/projects/${enc(name)}/` +
      (kind === "cover" ? "cover" : `portrait/${enc(slug)}`);
    // Raw bytes, not multipart: we own both ends, and Python 3.13 dropped the
    // stdlib multipart parser. The server decides the type from magic bytes
    // regardless of what we send here.
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": file.type || "application/octet-stream" },
      body: file,
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || `Upload failed: ${res.status}`);
    return body;
  },

  deleteImage: async (name, kind, slug) => {
    const path =
      `${BASE}/projects/${enc(name)}/` +
      (kind === "cover" ? "cover" : `portrait/${enc(slug)}`);
    const res = await fetch(path, { method: "DELETE" });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || `Delete failed: ${res.status}`);
    return body;
  },
};
