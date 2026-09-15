import { useEffect, useState, useCallback } from "react";

/*
 * Hash router, no dependencies.
 *
 * Routes:
 *   #/                        library (home)
 *   #/b/<project>/<section>   a book's dashboard section
 *   #/b/<project>/read        chapter list
 *   #/b/<project>/read/<id>   one chapter in the reader
 *
 * Hash routing rather than the History API because the dashboard is served
 * by a stdlib Python server with no SPA rewrite rule — a real path like
 * /b/foo/read would 404 on refresh. Hashes never hit the server.
 */

export function parseHash(hash) {
  const raw = (hash || "#/").replace(/^#/, "");
  const parts = raw.split("/").filter(Boolean).map(decodeURIComponent);
  if (parts[0] !== "b" || !parts[1]) return { view: "library" };
  const project = parts[1];
  if (parts[2] === "read") {
    return { view: "reader", project, chapterId: parts[3] || null };
  }
  return { view: "book", project, section: parts[2] || "overview" };
}

export function href(route) {
  if (route.view === "library") return "#/";
  const p = encodeURIComponent(route.project);
  if (route.view === "reader") {
    return route.chapterId
      ? `#/b/${p}/read/${encodeURIComponent(route.chapterId)}`
      : `#/b/${p}/read`;
  }
  return `#/b/${p}/${route.section || "overview"}`;
}

/*
 * Scroll positions are keyed by hash and restored on return, so going back
 * from a chapter lands where you left the list instead of at the top.
 * Saved on every navigation away rather than on scroll (cheaper, and the
 * only moment the value actually matters).
 */
const scrollPositions = new Map();

export function useRoute() {
  const [hash, setHash] = useState(() => window.location.hash || "#/");

  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash || "#/");
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const navigate = useCallback((route) => {
    scrollPositions.set(window.location.hash || "#/", window.scrollY);
    const next = href(route);
    if (next === window.location.hash) return;
    window.location.hash = next;
  }, []);

  useEffect(() => {
    const saved = scrollPositions.get(hash);
    // Two frames: the first paints the new view, the second has real layout
    // height to scroll within. One frame lands at 0 on longer pages.
    requestAnimationFrame(() =>
      requestAnimationFrame(() => window.scrollTo(0, saved ?? 0))
    );
  }, [hash]);

  return { route: parseHash(hash), navigate, hash };
}
