"""Mechanical craft analysis across a whole manuscript.

These are the craft problems that are *measurable* — no taste judgement, no
LLM call, no per-chapter token cost. Two families live here.

**Cross-chapter defects** (echoes, opening patterns) are here because a
per-chapter check cannot catch them by construction. Each chapter looks fine
on its own; the defect only exists in the relationship between chapters. That
is the same insight behind the longitudinal voice-drift check — a reviewer
reading chapter 40 in isolation has no way to know the phrase in front of it
has appeared in thirty earlier chapters.

**Dialogue shape** is different: a reviewer *can* see it in one chapter, and
`dialogue-naturalness-reviewer` does. It is computed here anyway for two
reasons. Counting is free and exact where a reviewer is neither, so the
reviewer should spend its judgement on whether a line sounds human rather
than on arithmetic it will do badly. And the per-chapter series shows drift
a single verdict cannot — a manuscript that loosens up after chapter 80 is
telling you its early chapters are the ones losing readers, which is exactly
where readers decide whether to keep going.

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


# Verbs that make a clause a speech tag. `light-novel-style` caps tags at
# roughly 30% of dialogue lines, preferring an action beat instead ("He
# ground out his cigarette. 'Fine.'"), so this set exists to measure that
# ratio, not to forbid the construction.
SPEECH_TAGS = {
    "said", "says", "say", "asked", "asks", "ask", "replied", "replies",
    "answered", "answers", "muttered", "murmured", "whispered", "shouted",
    "yelled", "added", "continued", "noted", "observed", "remarked",
    "stated", "declared", "responded", "called", "breathed", "growled",
    "snapped", "sighed", "laughed", "repeated", "offered", "admitted",
    "explained", "insisted", "agreed", "countered", "interrupted",
}

# Straight and curly double quotes. Single quotes are deliberately excluded:
# the apostrophe in "don't" would open a span and corrupt everything after it.
QUOTED = re.compile(u"[\"\u201c]([^\"\u201c\u201d]+)[\"\u201d]")

# The shape a reader calls "robots speaking": one complete sentence, closed
# with a full stop, long enough to be stating a position rather than reacting
# to one. The length floor matters — "No." is also one period-terminated
# sentence, and it is *good* dialogue. Without the floor this metric would
# punish exactly the blunt, clipped lines it should reward.
FLAT_MIN_WORDS = 4


# Filter words: the hedges and intensifiers that pad machine prose. Every one
# of these is a legitimate English word and appears in good writing — what
# matters is the *rate*, which is why this is measured per 1,000 words rather
# than flagged per occurrence. Drawn from the same family of tells that the
# `humanizer` skill removes at the phrase level.
FILTER_WORDS = {
    "just", "really", "very", "quite", "rather", "somewhat", "slightly",
    "suddenly", "somehow", "seemed", "seem", "seems", "felt", "feel",
    "feels", "began", "begin", "begins", "started", "start", "starts",
    "almost", "nearly", "perhaps", "maybe", "actually", "basically",
    "simply", "merely", "truly", "certainly", "definitely", "literally",
    "slowly", "carefully", "quietly", "softly",
}

# Window for the moving-average type-token ratio. Raw TTR falls as a text
# grows — a 3,000-word chapter will always look less varied than a 1,500-word
# one — so comparing chapters by raw TTR measures length, not vocabulary.
# MATTR averages the ratio over a sliding fixed-size window instead, which is
# length-invariant and therefore actually comparable between chapters.
MATTR_WINDOW = 400


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


# A speech tag that is only a speech tag runs about four words: "he said",
# "she asked quietly", "Mara replied". Longer than that and something is
# actually happening in the clause — "she said, folding the map" stages the
# line even though it also tags it. Text outside the quotes carrying no tag
# verb at all ("He ground out his cigarette.") is a beat by definition.
#
# This is a heuristic, and it is the shakiest number in this module: proper
# detection needs part-of-speech tagging, which stdlib does not provide. It
# is reported rather than enforced for exactly that reason.
TAG_ONLY_MAX_WORDS = 4


def has_beat(outside_words, has_tag):
    """Does the text around this line stage it, or merely attribute it?"""
    if not outside_words:
        return False
    if has_tag and len(outside_words) <= TAG_ONLY_MAX_WORDS:
        return False
    return True


def dialogue_stats(chapters):
    """Shape of the dialogue, per chapter and overall.

    Every number here is a count, not a verdict, and only two of them have a
    direction. `flat_pct` (lines that are one complete period-terminated
    sentence) and `tag_pct` (lines attributed with "said" rather than staged
    with an action) are the two the reviewers in those screenshots were
    describing — higher is worse, up to a point. `beat_pct` runs the other
    way. `bare_pct` has no direction at all: a bare volley with no attribution
    is a legitimate, fast technique, and a scene of nothing else is airless.
    Which one a given chapter needs is a judgement about that chapter, and it
    belongs to `dialogue-naturalness-reviewer`, which reads the prose. This
    function only makes the numbers available, so that the reviewer and the
    author argue about the same measurements.

    Speaker attribution is not attempted. Identifying who says each line
    reliably needs the story-bible and a model; guessing from proximity would
    produce confident nonsense on exactly the crowded scenes that matter most.
    Everything below is therefore speaker-agnostic.
    """
    per_chapter = []
    all_spans = []
    tot_paras = tot_tagged = tot_bare = tot_beats = tot_flat = 0

    for ch in chapters:
        prose = ch.get("prose") or ""
        paragraphs = [p.strip() for p in re.split(r"\n\s*\n", prose) if p.strip()]

        spans, dlg_paras, tagged, bare, beats = [], 0, 0, 0, 0

        for para in paragraphs:
            found = QUOTED.findall(para)
            if not found:
                continue
            dlg_paras += 1
            spans.extend(found)

            # Partition what sits outside the quote marks three ways: nothing
            # at all (a bare volley line), a bare speech tag, or an actual
            # action beat. See has_beat() for why the distinction matters.
            outside = tokenize(QUOTED.sub(" ", para))
            has_tag = any(w in SPEECH_TAGS for w in outside)
            if has_tag:
                tagged += 1
            if not outside:
                bare += 1
            elif has_beat(outside, has_tag):
                beats += 1

        if not spans:
            continue

        lengths = [len(tokenize(s)) for s in spans]
        flat = sum(
            1 for s in spans
            if len(split_sentences(s)) == 1
            and s.rstrip().endswith(".")
            and len(tokenize(s)) >= FLAT_MIN_WORDS
        )

        mean = sum(lengths) / len(lengths)
        variance = sum((n - mean) ** 2 for n in lengths) / len(lengths)

        all_spans.extend(spans)
        tot_paras += dlg_paras
        tot_tagged += tagged
        tot_bare += bare
        tot_beats += beats
        tot_flat += flat

        per_chapter.append({
            "chapter_id": ch.get("chapter_id"),
            "lines": len(spans),
            "flat_pct": round(100.0 * flat / len(spans)),
            "tag_pct": round(100.0 * tagged / dlg_paras),
            "beat_pct": round(100.0 * beats / dlg_paras),
            "bare_pct": round(100.0 * bare / dlg_paras),
            "mean_words": round(mean, 1),
            "stdev": round(variance ** 0.5, 1),
        })

    overall = None
    if all_spans:
        lengths = [len(tokenize(s)) for s in all_spans]
        mean = sum(lengths) / len(lengths)
        variance = sum((n - mean) ** 2 for n in lengths) / len(lengths)
        overall = {
            "lines": len(all_spans),
            "flat_pct": round(100.0 * tot_flat / len(all_spans)),
            "tag_pct": round(100.0 * tot_tagged / tot_paras) if tot_paras else 0,
            "beat_pct": round(100.0 * tot_beats / tot_paras) if tot_paras else 0,
            "bare_pct": round(100.0 * tot_bare / tot_paras) if tot_paras else 0,
            "mean_words": round(mean, 1),
            "stdev": round(variance ** 0.5, 1),
        }

    return {
        "per_chapter": per_chapter,
        "overall": overall,
        # Documented reference point, not a threshold this module enforces.
        # 30% is light-novel-style's stated tag ceiling. The other metrics
        # have no published number, so none is invented for them here.
        "reference": {"tag_pct_ceiling": 30},
    }


def _edit_distance(a, b):
    """Levenshtein distance. Small inputs only — this runs on names."""
    if a == b:
        return 0
    if not a or not b:
        return max(len(a), len(b))
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        cur = [i]
        for j, cb in enumerate(b, 1):
            cur.append(min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (ca != cb)))
        prev = cur
    return prev[-1]


def confusable_names(names, limit=40):
    """Character names a reader could mix up.

    A real reader review of an AI-generated novel noted that by chapter two it
    had both a Thomas and a Brother Thomas, and nothing in the pipeline saw a
    problem. That is a pure string comparison, so it costs nothing to check.

    Reported, never judged. Two similar names can be entirely deliberate —
    aliases for one character, a family sharing a surname, a title form and a
    familiar form of the same person. The point is to put the pair in front of
    the author, who knows which it is.
    """
    clean = []
    for n in names or []:
        n = (n or "").strip()
        if n:
            clean.append(n)

    out = []
    for i in range(len(clean)):
        for j in range(i + 1, len(clean)):
            a, b = clean[i], clean[j]
            la, lb = a.lower(), b.lower()
            if la == lb:
                out.append({"names": [a, b], "reason": "identical", "severity": "high"})
                continue

            ta, tb = la.split(), lb.split()
            # "Thomas" vs "Brother Thomas": every word of the shorter name
            # appears in the longer one, in order.
            short, long_ = (ta, tb) if len(ta) <= len(tb) else (tb, ta)
            if len(short) < len(long_) and all(w in long_ for w in short):
                out.append({
                    "names": [a, b],
                    "reason": "one name contains the other",
                    "severity": "high",
                })
                continue

            # Near-identical single names: Aldric / Aldrik, Maren / Marek.
            if len(ta) == 1 and len(tb) == 1 and min(len(la), len(lb)) >= 4:
                d = _edit_distance(la, lb)
                if d <= 2:
                    out.append({
                        "names": [a, b],
                        "reason": "differ by %d character%s" % (d, "" if d == 1 else "s"),
                        "severity": "high" if d == 1 else "medium",
                    })
                    continue

            # Shared opening: Thalen / Thane / Thaddeus all start "Tha".
            pre = 0
            for ca, cb in zip(la, lb):
                if ca != cb:
                    break
                pre += 1
            if pre >= 3 and min(len(la), len(lb)) >= 4:
                out.append({
                    "names": [a, b],
                    "reason": "share the first %d letters" % pre,
                    "severity": "medium",
                })

    order = {"high": 0, "medium": 1}
    out.sort(key=lambda r: (order.get(r["severity"], 9), r["names"][0].lower()))
    return out[:limit]


def repeated_dialogue(chapters, min_words=4, min_chapters=2, limit=30):
    """Spoken lines that recur across chapters.

    Distinct from find_echoes, which works on narration n-grams: this matches
    whole spoken lines, so it catches a character restating the same thing
    verbatim in chapter 6 and chapter 14. A reader review of an AI novel named
    exactly this — dialogue repeated across chapters, characters restating
    their goals — as a reason the book felt padded.

    It only catches *verbatim* repetition. A goal restated in fresh words each
    time is the same defect and is invisible here; that needs a reader, and is
    the reviewers' job.
    """
    seen = defaultdict(list)
    display = {}
    for ch in chapters:
        cid = ch.get("chapter_id")
        for span in QUOTED.findall(ch.get("prose") or ""):
            words = tokenize(span)
            if len(words) < min_words:
                continue
            key = " ".join(words)
            if cid not in seen[key]:
                seen[key].append(cid)
            display.setdefault(key, span.strip())

    out = []
    for key, chs in seen.items():
        if len(chs) >= min_chapters:
            out.append({
                "line": display[key],
                "chapters": sorted(chs),
                "count": len(chs),
            })
    out.sort(key=lambda r: (-r["count"], r["line"]))
    return out[:limit]


def _mattr(tokens, window=MATTR_WINDOW):
    """Moving-average type-token ratio — vocabulary variety, length-invariant.

    Returns None when the text is shorter than one window, rather than
    falling back to raw TTR: a number that means something different from the
    one beside it is worse than no number.
    """
    if len(tokens) < window:
        return None
    ratios = []
    for i in range(len(tokens) - window + 1):
        chunk = tokens[i:i + window]
        ratios.append(len(set(chunk)) / float(window))
    return round(100.0 * sum(ratios) / len(ratios), 1)


def vocabulary_stats(chapters, min_chapters=3, limit=25):
    """Word-level repetition: the tic a phrase-level echo check cannot see.

    `find_echoes` matches 4- and 5-word sequences, so a manuscript that says
    "suddenly" two hundred times in two hundred different sentences passes it
    completely. Single-word overuse is the other half of the same defect and
    is just as countable.

    As everywhere else in this module, these are counts with no verdict
    attached. A high filter-word rate in a tense internal-monologue chapter
    may be exactly right. What the per-chapter series is good for is spotting
    a rate that is uniform across the whole book, which is the signature of a
    habit rather than a choice.
    """
    per_chapter = []
    all_tokens = []
    content_chapters = defaultdict(set)
    content_counts = Counter()

    for ch in chapters:
        tokens = tokenize(ch.get("prose"))
        if not tokens:
            continue
        cid = ch.get("chapter_id")
        n = len(tokens)
        filt = sum(1 for t in tokens if t in FILTER_WORDS)
        # -ly adverbs, excluding words that merely end in "ly" (only, reply).
        adv = sum(1 for t in tokens
                  if t.endswith("ly") and len(t) > 4 and t not in ("only", "early", "reply", "apply", "imply"))

        for t in tokens:
            if t not in STOPWORDS and len(t) > 3:
                content_counts[t] += 1
                content_chapters[t].add(cid)

        all_tokens.extend(tokens)
        per_chapter.append({
            "chapter_id": cid,
            "words": n,
            "mattr": _mattr(tokens),
            "filter_per_1k": round(1000.0 * filt / n, 1),
            "adverb_per_1k": round(1000.0 * adv / n, 1),
        })

    overall = None
    if all_tokens:
        n = len(all_tokens)
        filt = sum(1 for t in all_tokens if t in FILTER_WORDS)
        adv = sum(1 for t in all_tokens
                  if t.endswith("ly") and len(t) > 4 and t not in ("only", "early", "reply", "apply", "imply"))
        overall = {
            "words": n,
            "mattr": _mattr(all_tokens),
            "filter_per_1k": round(1000.0 * filt / n, 1),
            "adverb_per_1k": round(1000.0 * adv / n, 1),
        }

    # Content words spread across many chapters at a high rate. Restricted to
    # words appearing in several chapters so that a word central to one
    # chapter's subject matter does not look like a tic.
    overused = []
    total_words = len(all_tokens) or 1
    for word, count in content_counts.most_common(400):
        chs = content_chapters[word]
        if len(chs) < min_chapters:
            continue
        rate = 1000.0 * count / total_words
        if rate >= 1.0:
            overused.append({
                "word": word,
                "count": count,
                "chapters": len(chs),
                "per_1k": round(rate, 2),
            })
    overused.sort(key=lambda r: -r["per_1k"])

    return {
        "per_chapter": per_chapter,
        "overall": overall,
        "overused": overused[:limit],
        "reference": {"mattr_window": MATTR_WINDOW},
    }


def hook_variety(chapters, run_threshold=3, window=10, window_threshold=4):
    """Distribution of chapter-ending hooks, and runs of the same one.

    `thread-ledger-reviewer` classifies every chapter's ending in order to
    check HARD-002, and `book-write` records the answer in the chapter's
    frontmatter. This reads it back.

    It is the cheapest possible closure of a real gap: hook monotony is
    invisible inside any single chapter — each ending is individually fine —
    and only exists in the sequence. That is the same class of defect as
    repeated phrasing, and like that check it needs no model to see.

    Chapters with no recorded hook are counted as `unclassified` rather than
    guessed at. A wrong label would corrupt exactly the distribution this
    exists to report.
    """
    seq = []
    for ch in chapters:
        seq.append({
            "chapter_id": ch.get("chapter_id"),
            "type": (ch.get("hook_type") or "unclassified"),
            "technique": (ch.get("hook_technique") or None),
        })

    types = Counter(s["type"] for s in seq)
    techniques = Counter(s["technique"] for s in seq if s["technique"])

    # Consecutive repeats of the same hook type.
    runs = []
    i = 0
    while i < len(seq):
        j = i
        while j + 1 < len(seq) and seq[j + 1]["type"] == seq[i]["type"]:
            j += 1
        length = j - i + 1
        if length >= run_threshold and seq[i]["type"] != "unclassified":
            runs.append({
                "type": seq[i]["type"],
                "length": length,
                "from": seq[i]["chapter_id"],
                "to": seq[j]["chapter_id"],
            })
        i = j + 1

    # Over-concentration inside any rolling window.
    crowded = []
    if len(seq) >= window:
        for start in range(len(seq) - window + 1):
            chunk = seq[start:start + window]
            local = Counter(s["type"] for s in chunk if s["type"] != "unclassified")
            for t, n in local.items():
                if n >= window_threshold:
                    crowded.append({
                        "type": t,
                        "count": n,
                        "window": window,
                        "from": chunk[0]["chapter_id"],
                        "to": chunk[-1]["chapter_id"],
                    })
        # Collapse overlapping windows reporting the same type.
        seen = set()
        deduped = []
        for c in sorted(crowded, key=lambda r: (-r["count"], r["from"])):
            if c["type"] in seen:
                continue
            seen.add(c["type"])
            deduped.append(c)
        crowded = deduped

    classified = sum(n for t, n in types.items() if t != "unclassified")
    return {
        "sequence": seq,
        "by_type": [{"type": t, "count": n} for t, n in types.most_common()],
        "by_technique": [{"technique": t, "count": n} for t, n in techniques.most_common()],
        "runs": runs,
        "crowded": crowded,
        "classified": classified,
        "reference": {"run_threshold": run_threshold,
                      "window": window,
                      "window_threshold": window_threshold},
    }


def scene_variety(chapters, run_threshold=3, window=10, window_threshold=5):
    """Repetition in the *shape* of chapters, not their content.

    `context-agent` determines which scene types a chapter calls for in order
    to retrieve matching style exemplars, and `book-write` records the answer.
    This reads it back — the same zero-cost pattern as `hook_variety`.

    What it catches: a serial where every chapter is action-then-tension, or
    where `description` has not appeared in thirty chapters. Each chapter is
    individually fine; the monotony exists only in the sequence, which is why
    no per-chapter reviewer can see it.

    What it does not catch: whether the drafted prose actually delivered those
    scene types. These are the types the chapter was *planned* around. That is
    the more useful end of the problem — structural repetition originates in
    planning, and an outline is cheaper to change than a chapter.
    """
    seq = []
    for ch in chapters:
        types = ch.get("scene_types") or []
        if isinstance(types, str):
            types = [t.strip() for t in types.strip("[]").split(",") if t.strip()]
        seq.append({
            "chapter_id": ch.get("chapter_id"),
            "types": sorted(set(t.lower() for t in types if t)),
        })

    flat = Counter(t for s_ in seq for t in s_["types"])
    shapes = Counter(" + ".join(s_["types"]) for s_ in seq if s_["types"])

    # Consecutive chapters built from the identical set of scene types.
    runs = []
    i = 0
    while i < len(seq):
        j = i
        while (j + 1 < len(seq) and seq[j + 1]["types"] == seq[i]["types"]
               and seq[i]["types"]):
            j += 1
        length = j - i + 1
        if length >= run_threshold:
            runs.append({
                "shape": " + ".join(seq[i]["types"]),
                "length": length,
                "from": seq[i]["chapter_id"],
                "to": seq[j]["chapter_id"],
            })
        i = j + 1

    # Scene types the book has stopped using: present early, absent since.
    ALL = ["dialogue", "action", "description", "transition",
           "emotion", "tension", "comedy"]
    classified = [s_ for s_ in seq if s_["types"]]
    dormant = []
    if len(classified) >= window:
        recent = classified[-window:]
        recent_types = set(t for s_ in recent for t in s_["types"])
        for t in ALL:
            if flat.get(t) and t not in recent_types:
                dormant.append({"type": t,
                                "total_uses": flat[t],
                                "absent_for": len(recent)})

    return {
        "by_type": [{"type": t, "count": n} for t, n in flat.most_common()],
        "by_shape": [{"shape": k, "count": n} for k, n in shapes.most_common(10)],
        "runs": runs,
        "dormant": dormant,
        "classified": len(classified),
        "chapters": len(seq),
        "reference": {"run_threshold": run_threshold, "window": window},
    }


def analyze(chapters, character_names=None):
    return {
        "chapters_analyzed": len(chapters),
        "echoes": find_echoes(chapters),
        "openings": opening_patterns(chapters),
        "sentences": sentence_stats(chapters),
        "dialogue": dialogue_stats(chapters),
        "repeated_dialogue": repeated_dialogue(chapters),
        "confusable_names": confusable_names(character_names),
        "vocabulary": vocabulary_stats(chapters),
        "hooks": hook_variety(chapters),
        "scenes": scene_variety(chapters),
    }
