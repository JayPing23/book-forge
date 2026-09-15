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
};
