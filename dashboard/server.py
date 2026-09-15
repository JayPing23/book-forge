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
        return {
            "name": name,
            "project_type": info.get("project_type"),
            "genre": info.get("genre"),
            "depth_dial": info.get("depth_dial"),
            "platform_convention": info.get("platform_convention"),
            "ip_status": info.get("ip_status"),
            "monetization_allowed": info.get("monetization_allowed"),
            "chapter_count": len(chapter_files),
            "total_words": total_words,
            "latest_chapter": self.latest_chapter_id(name),
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
