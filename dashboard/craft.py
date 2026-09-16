"""Mechanical craft analysis across a whole manuscript.

These are the craft problems that are *measurable* — no taste judgement, no
LLM call, no per-chapter token cost. They share one property that makes them
worth computing rather than reviewing: **a per-chapter check cannot catch
them by construction.** Each chapter looks fine on its own; the defect only
exists in the relationship between chapters.

That's the same insight behind the longitudinal voice-drift check. A reviewer
reading chapter 40 in isolation has no way to know the phrase in front of it
has appeared in thirty earlier chapters.

Deliberately NOT here: whether dialogue carries subtext, whether description
is evocative, whether a scene moves anyone. Those are taste, they need
judgement, and a confident-sounding score for them would be worse than
silence.
"""

import re
from collections import Counter, defaultdict

# Function words. An n-gram made only of these ("out of the corner of") is
# ordinary English connective tissue, not a distinctive authorial echo.
STOPWORDS = {
    "a", "about", "above", "after", "again", "all", "am", "an", "and", "any",
    "are", "as", "at", "back", "be", "been", "before", "being", "below",
    "between", "both", "but", "by", "can", "could", "did", "do", "does",
    "doing", "down", "during", "each", "few", "for", "from", "further", "had",
    "has", "have", "having", "he", "her", "here", "hers", "herself", "him",
    "himself", "his", "how", "i", "if", "in", "into", "is", "it", "its",
    "itself", "just", "me", "more", "most", "my", "myself", "no", "nor",
    "not", "now", "of", "off", "on", "once", "only", "or", "other", "our",
    "ours", "out", "over", "own", "same", "she", "should", "so", "some",
    "such", "than", "that", "the", "their", "theirs", "them", "themselves",
    "then", "there", "these", "they", "this", "those", "through", "to", "too",
    "under", "until", "up", "very", "was", "we", "were", "what", "when",
    "where", "which", "while", "who", "whom", "why", "will", "with", "would",
    "you", "your", "yours", "yourself",
}

FRONTMATTER = re.compile(r"^---\s*\n.*?\n---\s*\n?", re.DOTALL)
WORD = re.compile(r"[a-z']+")


def extract_prose(text):
    """Strip frontmatter and heading lines, leaving the prose body."""
    body = FRONTMATTER.sub("", text or "")
    lines = [ln for ln in body.split("\n") if not ln.lstrip().startswith("#")]
    return "\n".join(lines).strip()


def tokenize(prose):
    return WORD.findall((prose or "").lower())


def split_sentences(prose):
    parts = re.split(r"(?<=[.!?])[\s\"']+", (prose or "").strip())
    return [p.strip() for p in parts if p.strip()]


def find_echoes(chapters, n_values=(4, 5), min_count=3, min_chapters=2, limit=40):
    """Distinctive phrases repeating across the manuscript.

    `chapters` is [{"chapter_id": str, "prose": str}, ...].

    An n-gram counts only if at least two of its tokens are non-stopwords —
    that is what separates a real authorial tic ("a muscle worked in his jaw")
    from unavoidable connective grammar ("one of the men").

    Requires the phrase to span `min_chapters` distinct chapters: three uses
    inside a single scene is usually deliberate repetition for effect, which
    is a craft choice and not this function's business.
    """
    occurrences = defaultdict(list)

    for ch in chapters:
        tokens = tokenize(ch.get("prose"))
        for n in n_values:
            for i in range(len(tokens) - n + 1):
                gram = tuple(tokens[i:i + n])
                if sum(1 for t in gram if t not in STOPWORDS) < 2:
                    continue
                occurrences[gram].append(ch.get("chapter_id"))

    results = []
    for gram, chapter_ids in occurrences.items():
        distinct = sorted(set(chapter_ids))
        if len(chapter_ids) >= min_count and len(distinct) >= min_chapters:
            results.append({
                "phrase": " ".join(gram),
                "count": len(chapter_ids),
                "chapters": distinct,
                "length": len(gram),
            })

    # One repeated phrase surfaces as several overlapping n-grams: the same
    # tic yields "a muscle worked in his" AND "muscle worked in his jaw",
    # neither of which contains the other. Reporting both reads as two
    # separate problems. Collapse windows that slide over the same phrase —
    # same chapters, same count, and sharing all but one token.
    def same_phenomenon(a, b):
        if a["chapters"] != b["chapters"] or a["count"] != b["count"]:
            return False
        ta, tb = a["phrase"].split(), b["phrase"].split()
        overlap = min(len(ta), len(tb)) - 1
        return (
            " ".join(ta[-overlap:]) == " ".join(tb[:overlap])
            or " ".join(tb[-overlap:]) == " ".join(ta[:overlap])
            or a["phrase"] in b["phrase"]
            or b["phrase"] in a["phrase"]
        )

    results.sort(key=lambda r: (-r["length"], -r["count"]))
    kept = []
    for r in results:
        if not any(same_phenomenon(r, k) for k in kept):
            kept.append(r)

    kept.sort(key=lambda r: (-r["count"], -r["length"]))
    return kept[:limit]


def opening_patterns(chapters, limit=12):
    """How chapters begin.

    Serials drift into opening every chapter the same way — the same first
    word, the same construction. Invisible while writing one chapter, obvious
    to anyone reading ten in a row.
    """
    firsts = []
    for ch in chapters:
        sentences = split_sentences(ch.get("prose"))
        if not sentences:
            continue
        first = sentences[0]
        tokens = tokenize(first)
        firsts.append({
            "chapter_id": ch.get("chapter_id"),
            "opening": first[:120],
            "first_word": tokens[0] if tokens else "",
        })

    counts = Counter(f["first_word"] for f in firsts if f["first_word"])
    repeated = [
        {
            "word": w,
            "count": c,
            "chapters": [f["chapter_id"] for f in firsts if f["first_word"] == w],
        }
        for w, c in counts.most_common(limit)
        if c >= 3
    ]
    return {"openings": firsts, "repeated_first_words": repeated}


def sentence_stats(chapters):
    """Sentence-length variation, per chapter and overall.

    Uniform sentence length is the texture of machine prose. This reports the
    spread; it does not judge it, because the right spread depends on the
    scene — a tense action beat *should* run short and flat.
    """
    per_chapter = []
    all_lengths = []
    for ch in chapters:
        lengths = [len(tokenize(s)) for s in split_sentences(ch.get("prose"))]
        lengths = [n for n in lengths if n > 0]
        if not lengths:
            continue
        mean = sum(lengths) / len(lengths)
        variance = sum((n - mean) ** 2 for n in lengths) / len(lengths)
        all_lengths.extend(lengths)
        per_chapter.append({
            "chapter_id": ch.get("chapter_id"),
            "sentences": len(lengths),
            "mean_length": round(mean, 1),
            "stdev": round(variance ** 0.5, 1),
            "longest": max(lengths),
            "shortest": min(lengths),
        })

    overall = None
    if all_lengths:
        mean = sum(all_lengths) / len(all_lengths)
        variance = sum((n - mean) ** 2 for n in all_lengths) / len(all_lengths)
        overall = {
            "sentences": len(all_lengths),
            "mean_length": round(mean, 1),
            "stdev": round(variance ** 0.5, 1),
        }
    return {"per_chapter": per_chapter, "overall": overall}


def analyze(chapters):
    return {
        "chapters_analyzed": len(chapters),
        "echoes": find_echoes(chapters),
        "openings": opening_patterns(chapters),
        "sentences": sentence_stats(chapters),
    }
