/*
 * Minimal prose parser for chapter text.
 *
 * Returns a structured block list that the reader renders as real React
 * elements — deliberately NOT an HTML string, so there is no innerHTML
 * anywhere in the reading path and therefore no XSS surface, whatever ends up
 * in a chapter file. React escapes every text node on the way out.
 *
 * Also deliberately not a full markdown parser: chapter files are fiction
 * prose — paragraphs, scene breaks, occasional emphasis. A markdown library
 * would add a dependency and would happily render headings, tables and raw
 * HTML that have no business inside a chapter.
 */

const SCENE_BREAK = /^\s*(\*\s*\*\s*\*|-{3,}|\*{3,}|_{3,})\s*$/;
const INLINE = /\*\*([^*]+)\*\*|\*([^*\n]+)\*|_([^_\n]+)_/g;

/* Split one line into plain / emphasised spans. */
function parseInline(text) {
  const spans = [];
  let last = 0;
  for (const m of text.matchAll(INLINE)) {
    if (m.index > last) spans.push({ text: text.slice(last, m.index) });
    if (m[1] !== undefined) spans.push({ text: m[1], strong: true });
    else spans.push({ text: m[2] ?? m[3], em: true });
    last = m.index + m[0].length;
  }
  if (last < text.length) spans.push({ text: text.slice(last) });
  return spans.length ? spans : [{ text }];
}

export function parseProse(body) {
  return (body || "")
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      if (SCENE_BREAK.test(block)) return { type: "break" };
      if (/^#{1,6}\s+/.test(block)) {
        return { type: "label", lines: [parseInline(block.replace(/^#{1,6}\s+/, ""))] };
      }
      // A soft line break inside a paragraph stays a line break.
      return { type: "p", lines: block.split("\n").map(parseInline) };
    });
}

/* Plain text, for export and word counting. */
export function proseToText(body) {
  return (body || "")
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter((b) => b && !SCENE_BREAK.test(b))
    .map((b) => b.replace(/^#{1,6}\s+/, "").replace(/\*\*|\*|_/g, ""))
    .join("\n\n");
}

export function countWords(body) {
  return proseToText(body).split(/\s+/).filter(Boolean).length;
}

/* Browser download — works because this is a local page, not a sandboxed frame. */
export function downloadFile(filename, contents, mime) {
  const blob = new Blob([contents], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function slugify(s) {
  return (s || "chapter")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}
