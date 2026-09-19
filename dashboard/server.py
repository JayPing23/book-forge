#!/usr/bin/env python3
"""
book-forge dashboard server.

Stdlib-only HTTP server (no pip dependencies) that reads a book-forge
workspace's project folders directly from disk — Obsidian markdown
frontmatter, project.json, and .project-memory JSON files — and serves
derived JSON to the React frontend. Also serves the built frontend
(dashboard/frontend/dist) as static files, so one process is enough.

Usage:
    python server.py [--workspace PATH] [--port PORT]

Defaults: --workspace is the current working directory, --port is 5173.
"""

import argparse
import http.server
import json
import os
import re
import socketserver
from pathlib import Path
from urllib.parse import urlparse, parse_qs

import craft


def parse_frontmatter(text):
    """Minimal YAML-frontmatter parser for the simple key:value / list
    frontmatter our note templates use. Not a general YAML parser — it
    handles what character.md / plot-thread.md / world-element.md
    actually produce: scalar strings, booleans, numbers, and flat lists.
    """
    match = re.match(r"^---\s*\n(.*?)\n---\s*\n?", text, re.DOTALL)
    if not match:
        return {}, text
    fm_text = match.group(1)
    body = text[match.end():]
    data = {}
    for line in fm_text.split("\n"):
        line = line.rstrip()
        if not line or line.strip().startswith("#"):
            continue
        if ":" not in line:
            continue
        key, _, value = line.partition(":")
        key = key.strip()
        value = value.strip()
        if value.startswith("[") and value.endswith("]"):
            inner = value[1:-1].strip()
            data[key] = [] if not inner else [v.strip().strip('"').strip("'") for v in inner.split(",")]
        elif value.lower() in ("true", "false"):
            data[key] = value.lower() == "true"
        elif value.startswith('"') and value.endswith('"'):
            data[key] = value[1:-1]
        elif value.startswith("'") and value.endswith("'"):
            data[key] = value[1:-1]
        else:
            try:
                data[key] = int(value)
            except ValueError:
                data[key] = value
    return data, body


def read_note(path):
    try:
        text = path.read_text(encoding="utf-8")
    except OSError:
        return None
    fm, body = parse_frontmatter(text)
    fm["_body"] = body.strip()
    fm["_filename"] = path.stem
    return fm


def chapter_number(identifier):
    """Turn any chapter identifier into an int, or None if it isn't one.

    The single place that knows how a chapter is named. Handles the
    manuscript filename convention (`0042-the-broken-oath.md` -> 42), a
    bare zero-padded id (`"0042"` -> 42), and an int already. Returns
    None for anything genuinely unparseable so callers can distinguish
    "no chapter yet" from "chapter zero".
    """
    if identifier is None:
        return None
    if isinstance(identifier, int):
        return identifier
    match = re.match(r"^\s*(\d+)", str(identifier))
    return int(match.group(1)) if match else None


"""Image upload support.

This is the ONE place the dashboard writes to a project, so it is deliberately
narrow. The server binds to 127.0.0.1 only, but that is not treated as the
security boundary on its own:

  - File type is decided by MAGIC BYTES, never by the supplied filename or
    Content-Type. A caller can claim anything; the first bytes of the file
    cannot be faked as cheaply.
  - The stored filename is generated, never taken from the request, so a
    crafted name can't traverse out of the project.
  - Size is capped before anything touches disk.
  - Writes are confined to <project>/story-bible/images/.
"""

MAX_IMAGE_BYTES = 10 * 1024 * 1024  # 10 MB — above every platform's own cap

IMAGE_SIGNATURES = (
    (b"\x89PNG\r\n\x1a\n", "png", "image/png"),
    (b"\xff\xd8\xff", "jpg", "image/jpeg"),
    (b"GIF87a", "gif", "image/gif"),
    (b"GIF89a", "gif", "image/gif"),
)


def sniff_image(data):
    """Return (extension, mime) from the file's own bytes, or (None, None)."""
    for sig, ext, mime in IMAGE_SIGNATURES:
        if data.startswith(sig):
            return ext, mime
    # WEBP is RIFF....WEBP — the size field sits between the two markers.
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "webp", "image/webp"
    return None, None


def safe_slug(value):
    """A conservative slug for a filename component. Anything outside the
    allowlist is dropped, so '../../etc/passwd' reduces to 'etcpasswd'."""
    cleaned = re.sub(r"[^A-Za-z0-9_-]", "", (value or "").strip())
    return cleaned[:64]


TIER_WEIGHTS = {"core": 3.0, "side": 2.0, "decorative": 1.0}
TIER_WINDOWS = {"core": 175, "side": 65, "decorative": 20}  # midpoint of the guide's recovery windows


def compute_urgency(thread, current_chapter):
    tier = thread.get("tier", "side")
    introduced_num = chapter_number(thread.get("introduced_chapter"))
    current_num = chapter_number(current_chapter)
    if introduced_num is None or current_num is None:
        return None
    elapsed = max(current_num - introduced_num, 0)
    window = TIER_WINDOWS.get(tier, TIER_WINDOWS["side"])
    weight = TIER_WEIGHTS.get(tier, TIER_WEIGHTS["side"])
    return round((elapsed / window) * weight, 2)


def urgency_status(urgency, thread, current_chapter):
    payoff_num = chapter_number(thread.get("payoff_chapter"))
    current_num = chapter_number(current_chapter)
    if payoff_num is not None and current_num is not None:
        if current_num > payoff_num and thread.get("status") == "open":
            return "critical"
    if urgency is None:
        return "normal"
    if urgency > 1.0:
        return "critical"
    if urgency > 0.8:
        return "warning"
    return "normal"


class Workspace:
    def __init__(self, root: Path):
        self.root = root

    def projects_dir(self):
        return self.root / "projects"

    def list_projects(self):
        pdir = self.projects_dir()
        if not pdir.exists():
            return []
        return sorted(
            p.name for p in pdir.iterdir()
            if p.is_dir() and not p.name.startswith("_") and (p / "project.json").exists()
        )

    def project_dir(self, name):
        d = self.projects_dir() / name
        if not d.exists() or not d.is_dir():
            raise FileNotFoundError(name)
        return d

    def read_project_json(self, name):
        p = self.project_dir(name) / "project.json"
        if not p.exists():
            return {}
        try:
            return json.loads(p.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            return {}

    def chapters(self, name):
        """Parsed manuscript chapters, sorted by chapter number.

        Word counts are computed from the prose body with frontmatter and
        heading lines excluded — the prose is the source of truth, never a
        stored count, which goes stale the moment the author hand-edits a
        chapter.
        """
        manuscript = self.project_dir(name) / "manuscript"
        if not manuscript.exists():
            return []
        out = []
        for path in manuscript.glob("*.md"):
            try:
                text = path.read_text(encoding="utf-8")
            except OSError:
                continue
            fm, body = parse_frontmatter(text)
            # Prefer the frontmatter id; fall back to the filename prefix
            # so chapters written before the format was specified still work.
            number = chapter_number(fm.get("chapter_id")) or chapter_number(path.stem)
            prose = "\n".join(ln for ln in body.split("\n") if not ln.lstrip().startswith("#"))
            out.append({
                "chapter_id": fm.get("chapter_id") or path.stem,
                "number": number,
                "title": fm.get("title"),
                "status": fm.get("status"),
                "word_count": len(prose.split()),
            })
        return sorted(out, key=lambda c: (c["number"] is None, c["number"]))

    def latest_chapter_id(self, name):
        chapters = self.chapters(name)
        return chapters[-1]["chapter_id"] if chapters else None

    def overview(self, name):
        info = self.read_project_json(name)
        chapter_files = self.chapters(name)
        total_words = sum(c["word_count"] for c in chapter_files)
        chapter_state_dir = self.project_dir(name) / ".project-memory" / "chapter-state"
        escalated = []
        if chapter_state_dir.exists():
            for f in chapter_state_dir.glob("*.json"):
                try:
                    state = json.loads(f.read_text(encoding="utf-8"))
                except (OSError, json.JSONDecodeError):
                    continue
                if state.get("current_step") == "escalated":
                    escalated.append(state.get("chapter_id", f.stem))
        published_through = info.get("published_through")
        published_num = chapter_number(published_through)
        latest_num = chapter_number(chapter_files[-1]["chapter_id"]) if chapter_files else None
        buffer = None
        if latest_num is not None:
            buffer = latest_num - (published_num or 0)

        return {
            "name": name,
            "project_type": info.get("project_type"),
            "genre": info.get("genre"),
            "depth_dial": info.get("depth_dial"),
            "platform_convention": info.get("platform_convention"),
            "ip_status": info.get("ip_status"),
            "monetization_allowed": info.get("monetization_allowed"),
            "length_tier": info.get("length_tier"),
            "target_chapter_words": info.get("target_chapter_words"),
            "chapter_count": len(chapter_files),
            "total_words": total_words,
            "latest_chapter": self.latest_chapter_id(name),
            "published_through": published_through,
            # Chapters finalized but not yet published — the serial author's
            # safety margin. None for a project that has published nothing.
            "buffer": buffer,
            "escalated_chapters": escalated,
        }

    def characters(self, name):
        cdir = self.project_dir(name) / "story-bible" / "characters"
        if not cdir.exists():
            return []
        out = []
        for f in sorted(cdir.glob("*.md")):
            note = read_note(f)
            if not note:
                continue
            out.append({
                "name": note.get("name", note["_filename"]),
                # Stable key for the portrait image — the note's filename, not
                # the display name, so renaming a character in frontmatter
                # doesn't orphan their picture.
                "slug": note["_filename"],
                "is_protagonist": note.get("is_protagonist", False),
                "speech_register": note.get("speech_register"),
                "want": note.get("want"),
                "need": note.get("need"),
                "fear": note.get("fear"),
                "current_status": note.get("current_status"),
            })
        return out

    def plot_threads(self, name, current_chapter=None):
        tdir = self.project_dir(name) / "story-bible" / "plot-threads"
        if current_chapter is None:
            current_chapter = self.latest_chapter_id(name) or "0000"
        out = []
        if tdir.exists():
            for f in sorted(tdir.glob("*.md")):
                note = read_note(f)
                if not note:
                    continue
                urgency = compute_urgency(note, current_chapter)
                out.append({
                    "name": note.get("name", note["_filename"]),
                    "status": note.get("status", "open"),
                    "tier": note.get("tier", "side"),
                    "introduced_chapter": note.get("introduced_chapter"),
                    "payoff_chapter": note.get("payoff_chapter"),
                    "payoff_book": note.get("payoff_book"),
                    "urgency": urgency,
                    "urgency_status": urgency_status(urgency, note, current_chapter),
                })
        return out

    def pacing(self, name):
        mem = self.project_dir(name) / ".project-memory"
        strand_tracker = {}
        st_path = mem / "strand_tracker.json"
        if st_path.exists():
            try:
                strand_tracker = json.loads(st_path.read_text(encoding="utf-8"))
            except (OSError, json.JSONDecodeError):
                pass
        review_metrics = []
        rm_path = mem / "review-metrics.json"
        if rm_path.exists():
            try:
                content = json.loads(rm_path.read_text(encoding="utf-8"))
                review_metrics = content if isinstance(content, list) else content.get("entries", [])
            except (OSError, json.JSONDecodeError):
                pass
        return {"strand_tracker": strand_tracker, "review_metrics": review_metrics}

    def chapter_detail(self, name, chapter_id):
        """One chapter's prose plus its neighbours, for the reader view."""
        target = chapter_number(chapter_id)
        chapters = self.chapters(name)
        idx = next((i for i, c in enumerate(chapters) if c["number"] == target), None)
        if idx is None:
            raise FileNotFoundError(f"chapter {chapter_id}")

        manuscript = self.project_dir(name) / "manuscript"
        path = next(
            (p for p in manuscript.glob("*.md")
             if chapter_number(p.stem) == target), None
        )
        if path is None:
            raise FileNotFoundError(f"chapter {chapter_id}")

        fm, body = parse_frontmatter(path.read_text(encoding="utf-8"))
        # Drop a leading H1 — the reader renders its own chapter header, and
        # showing both reads as a duplicated title.
        lines = body.strip().split("\n")
        while lines and (not lines[0].strip() or lines[0].lstrip().startswith("# ")):
            lines.pop(0)

        meta = chapters[idx]
        return {
            "chapter_id": meta["chapter_id"],
            "number": meta["number"],
            "title": meta["title"] or f"Chapter {meta['number']}",
            "status": meta["status"],
            "word_count": meta["word_count"],
            "body": "\n".join(lines).strip(),
            "prev": chapters[idx - 1]["chapter_id"] if idx > 0 else None,
            "next": chapters[idx + 1]["chapter_id"] if idx + 1 < len(chapters) else None,
        }

    def library(self):
        """Enriched project cards for the library home."""
        out = []
        for name in self.list_projects():
            try:
                info = self.read_project_json(name)
                chapters = self.chapters(name)
                pdir = self.project_dir(name)
                mtimes = [p.stat().st_mtime for p in pdir.rglob("*.md")]
                out.append({
                    "name": name,
                    "project_type": info.get("project_type"),
                    "genre": info.get("genre"),
                    "length_tier": info.get("length_tier"),
                    "chapter_count": len(chapters),
                    "total_words": sum(c["word_count"] for c in chapters),
                    "published_through": info.get("published_through"),
                    "last_activity": max(mtimes) if mtimes else None,
                })
            except (OSError, FileNotFoundError):
                continue
        return out

    def images_dir(self, name):
        d = self.project_dir(name) / "story-bible" / "images"
        d.mkdir(parents=True, exist_ok=True)
        return d

    def image_stem(self, kind, slug=None):
        """Generated stem — never derived from the uploaded filename."""
        if kind == "cover":
            return "cover"
        if kind == "portrait" and slug:
            return f"portrait-{safe_slug(slug)}"
        raise ValueError("unknown image kind")

    def find_image(self, name, kind, slug=None):
        stem = self.image_stem(kind, slug)
        for ext in ("png", "jpg", "gif", "webp"):
            p = self.images_dir(name) / f"{stem}.{ext}"
            if p.exists():
                return p
        return None

    def save_image(self, name, kind, slug, data):
        ext, mime = sniff_image(data)
        if not ext:
            raise ValueError("not a recognised image (expected PNG, JPEG, GIF or WEBP)")
        stem = self.image_stem(kind, slug)
        # Remove any prior extension for this slot so we never leave two files
        # claiming the same role.
        for old in ("png", "jpg", "gif", "webp"):
            prior = self.images_dir(name) / f"{stem}.{old}"
            if prior.exists():
                prior.unlink()
        path = self.images_dir(name) / f"{stem}.{ext}"
        path.write_bytes(data)
        return {"path": path.name, "mime": mime, "bytes": len(data)}

    def delete_image(self, name, kind, slug=None):
        p = self.find_image(name, kind, slug)
        if p:
            p.unlink()
            return True
        return False

    def craft_analysis(self, name):
        """Mechanical craft checks across the whole manuscript.

        Deliberately whole-manuscript: these defects (repeated phrasing,
        uniform chapter openings) don't exist inside any single chapter, so no
        per-chapter reviewer can see them. Computed here rather than asked of
        a model — it's counting, and counting shouldn't cost tokens or invite
        a judgement call.
        """
        manuscript = self.project_dir(name) / "manuscript"
        if not manuscript.exists():
            return craft.analyze([], character_names=[])

        entries = []
        for path in manuscript.glob("*.md"):
            try:
                text = path.read_text(encoding="utf-8")
            except OSError:
                continue
            fm, _ = parse_frontmatter(text)
            entries.append({
                "chapter_id": fm.get("chapter_id") or path.stem,
                "number": chapter_number(fm.get("chapter_id")) or chapter_number(path.stem),
                "prose": craft.extract_prose(text),
                # Recorded by thread-ledger-reviewer at finalize; absent on
                # older chapters, which hook_variety counts as unclassified.
                "hook_type": fm.get("hook_type"),
                "hook_technique": fm.get("hook_technique"),
                "scene_types": fm.get("scene_types"),
            })
        entries.sort(key=lambda c: (c["number"] is None, c["number"]))
        # Character names come from the story bible so the confusable-name
        # check compares real cast entries rather than guessing at
        # capitalised tokens in the prose, which would flag every place name.
        names = [c["name"] for c in self.characters(name) if c.get("name")]
        return craft.analyze(entries, character_names=names)

    def override_debt(self, name):
        mem = self.project_dir(name) / ".project-memory"
        path = mem / "override-contracts.json"
        contracts = []
        if path.exists():
            try:
                content = json.loads(path.read_text(encoding="utf-8"))
                contracts = content if isinstance(content, list) else content.get("entries", [])
            except (OSError, json.JSONDecodeError):
                pass

        # Increased debt weight for EDITORIAL_INTENT per the qa-standards
        # taxonomy; standard for everything else except the two explicitly
        # reduced-weight rationales.
        WEIGHT = {
            "EDITORIAL_INTENT": 2.0,
            "LOGIC_INTEGRITY": 0.5,
            "CHARACTER_CREDIBILITY": 0.5,
            "WORLD_RULE_CONSTRAINT": 0.5,
        }
        DEFAULT_WEIGHT = 1.0

        by_combo = {}
        total_weight = 0.0
        for c in contracts:
            reviewer = c.get("reviewer", "unknown")
            rationale = c.get("rationale_type", "unknown")
            weight = WEIGHT.get(rationale, DEFAULT_WEIGHT)
            total_weight += weight
            key = (reviewer, rationale)
            by_combo.setdefault(key, []).append(c)

        patterns = [
            {
                "reviewer": reviewer,
                "rationale_type": rationale,
                "count": len(entries),
                "chapters": [e.get("chapter") for e in entries],
            }
            for (reviewer, rationale), entries in sorted(by_combo.items())
            if len(entries) >= 3
        ]

        return {
            "contracts_count": len(contracts),
            "total_debt_weight": round(total_weight, 2),
            "patterns": patterns,  # same reviewer+rationale_type used 3+ times — a self-improvement signal, not just a count
            "contracts": contracts,
        }

    def doctor(self, name):
        pdir = self.project_dir(name)
        checks = []
        checks.append({"label": "project.json present and parses", "pass": bool(self.read_project_json(name))})
        for sub in ["story-bible/characters", "story-bible/world", "story-bible/plot-threads", "outline", "manuscript", "reviews", ".story-system", ".project-memory"]:
            checks.append({"label": f"{sub}/ exists", "pass": (pdir / sub).exists()})
        protagonist_exists = any(
            read_note(f) and read_note(f).get("is_protagonist")
            for f in (pdir / "story-bible" / "characters").glob("*.md")
        ) if (pdir / "story-bible" / "characters").exists() else False
        checks.append({"label": "at least one protagonist character note", "pass": protagonist_exists})
        overview = self.overview(name)
        checks.append({"label": "no escalated chapters awaiting author action", "pass": len(overview["escalated_chapters"]) == 0})
        return {"checks": checks, "escalated_chapters": overview["escalated_chapters"]}


class Handler(http.server.SimpleHTTPRequestHandler):
    workspace: Workspace = None  # set by main()
    frontend_dist: Path = None  # set by main()

    def _send_image(self, path):
        data = path.read_bytes()
        _, mime = sniff_image(data)
        self.send_response(200)
        self.send_header("Content-Type", mime or "application/octet-stream")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def _image_target(self, parts):
        """Map a URL to (project, kind, slug), or None if it isn't an image route."""
        if parts[:2] != ["api", "projects"]:
            return None
        if len(parts) == 4 and parts[3] == "cover":
            return parts[2], "cover", None
        if len(parts) == 5 and parts[3] == "portrait":
            return parts[2], "portrait", parts[4]
        return None

    def _read_body(self):
        """Read the raw body with a hard size cap.

        The client posts the file bytes directly rather than multipart: we
        control both ends, and Python 3.13 removed the `cgi` module that used
        to parse multipart, so this avoids hand-rolling a parser for no gain.
        """
        length = int(self.headers.get("Content-Length") or 0)
        if length <= 0:
            raise ValueError("empty upload")
        if length > MAX_IMAGE_BYTES:
            raise ValueError(
                f"file is {length // 1024 // 1024} MB; the limit is "
                f"{MAX_IMAGE_BYTES // 1024 // 1024} MB"
            )
        return self.rfile.read(length)

    def do_POST(self):
        parts = [p for p in urlparse(self.path).path.split("/") if p]
        target = self._image_target(parts)
        if not target:
            return self._json({"error": "not found"}, 404)
        name, kind, slug = target
        try:
            data = self._read_body()
            return self._json(self.workspace.save_image(name, kind, slug, data))
        except FileNotFoundError:
            return self._json({"error": f"project not found: {name}"}, 404)
        except ValueError as e:
            return self._json({"error": str(e)}, 400)
        except Exception as e:  # noqa: BLE001
            return self._json({"error": str(e)}, 500)

    def do_DELETE(self):
        parts = [p for p in urlparse(self.path).path.split("/") if p]
        target = self._image_target(parts)
        if not target:
            return self._json({"error": "not found"}, 404)
        name, kind, slug = target
        try:
            removed = self.workspace.delete_image(name, kind, slug)
            return self._json({"removed": removed})
        except FileNotFoundError:
            return self._json({"error": f"project not found: {name}"}, 404)
        except Exception as e:  # noqa: BLE001
            return self._json({"error": str(e)}, 500)

    def _json(self, payload, status=200):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        parsed = urlparse(self.path)
        parts = [p for p in parsed.path.split("/") if p]
        query = parse_qs(parsed.query)

        try:
            if parts[:2] == ["api", "projects"] and len(parts) == 2:
                return self._json({"projects": self.workspace.list_projects()})

            # Image routes come first: /cover and /portrait/<slug> serve bytes,
            # not JSON, so they must not fall through to the endpoint table.
            target = self._image_target(parts)
            if target:
                name, kind, slug = target
                found = self.workspace.find_image(name, kind, slug)
                if not found:
                    return self._json({"error": "no image"}, 404)
                return self._send_image(found)

            if parts == ["api", "library"]:
                return self._json({"books": self.workspace.library()})

            # /api/projects/<name>/chapters/<chapter_id>
            if parts[:2] == ["api", "projects"] and len(parts) == 5 and parts[3] == "chapters":
                return self._json(self.workspace.chapter_detail(parts[2], parts[4]))

            if parts[:2] == ["api", "projects"] and len(parts) == 4:
                name, endpoint = parts[2], parts[3]
                if endpoint == "overview":
                    return self._json(self.workspace.overview(name))
                if endpoint == "characters":
                    return self._json({"characters": self.workspace.characters(name)})
                if endpoint == "plot-threads":
                    current = query.get("current_chapter", [None])[0]
                    return self._json({"threads": self.workspace.plot_threads(name, current)})
                if endpoint == "pacing":
                    return self._json(self.workspace.pacing(name))
                if endpoint == "doctor":
                    return self._json(self.workspace.doctor(name))
                if endpoint == "override-debt":
                    return self._json(self.workspace.override_debt(name))
                if endpoint == "chapters":
                    return self._json({"chapters": self.workspace.chapters(name)})
                if endpoint == "craft":
                    return self._json(self.workspace.craft_analysis(name))
                return self._json({"error": "unknown endpoint"}, 404)

            if parts and parts[0] == "api":
                return self._json({"error": "not found"}, 404)

        except FileNotFoundError as e:
            return self._json({"error": f"project not found: {e}"}, 404)
        except Exception as e:  # noqa: BLE001 - dashboard is read-only, never crash the server on a bad file
            return self._json({"error": str(e)}, 500)

        # Static frontend
        if self.frontend_dist and self.frontend_dist.exists():
            self.directory = str(self.frontend_dist)
            return super().do_GET()

        self._json({
            "error": "Frontend not built yet. Run: cd dashboard/frontend && npm install && npm run build",
        }, 503)

    def end_headers(self):
        # index.html must never be cached: Vite fingerprints the JS/CSS
        # filenames, so a cached shell keeps pointing at the previous build's
        # assets and a rebuild appears to do nothing. The fingerprinted assets
        # are themselves safe to cache, since their names change on rebuild.
        path = urlparse(self.path).path
        last = path.rsplit("/", 1)[-1]
        if path.endswith(".html") or path == "/" or "." not in last:
            self.send_header("Cache-Control", "no-store, must-revalidate")
        super().end_headers()

    def log_message(self, format, *args):  # noqa: A002 - quiet by default
        pass


def main():
    parser = argparse.ArgumentParser(description="book-forge dashboard server")
    parser.add_argument("--workspace", default=os.getcwd(), help="Path to the writer's workspace (contains projects/ and vault/)")
    parser.add_argument("--port", type=int, default=5173)
    args = parser.parse_args()

    workspace = Workspace(Path(args.workspace).resolve())
    frontend_dist = Path(__file__).parent / "frontend" / "dist"

    Handler.workspace = workspace
    Handler.frontend_dist = frontend_dist

    with socketserver.TCPServer(("127.0.0.1", args.port), Handler) as httpd:
        print(f"book-forge dashboard: http://127.0.0.1:{args.port}")
        print(f"Reading workspace: {workspace.root}")
        if not frontend_dist.exists():
            print("NOTE: frontend not built yet — run `cd dashboard/frontend && npm install && npm run build` first.")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nStopped.")


if __name__ == "__main__":
    main()
