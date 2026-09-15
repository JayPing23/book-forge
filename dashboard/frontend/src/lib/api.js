const BASE = "/api";

async function getJSON(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  listProjects: () => getJSON("/projects").then((d) => d.projects),
  overview: (name) => getJSON(`/projects/${encodeURIComponent(name)}/overview`),
  characters: (name) => getJSON(`/projects/${encodeURIComponent(name)}/characters`).then((d) => d.characters),
  plotThreads: (name) => getJSON(`/projects/${encodeURIComponent(name)}/plot-threads`).then((d) => d.threads),
  pacing: (name) => getJSON(`/projects/${encodeURIComponent(name)}/pacing`),
  doctor: (name) => getJSON(`/projects/${encodeURIComponent(name)}/doctor`),
  overrideDebt: (name) => getJSON(`/projects/${encodeURIComponent(name)}/override-debt`),
};
