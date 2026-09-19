# -*- coding: utf-8 -*-
"""Does dialogue_stats actually discriminate robotic dialogue from human?

Run with: python test_craft_dialogue.py   (from dashboard/)

These metrics only earn their place if they separate the two samples below,
which are the same scene written twice. The ROBOT sample is built from what
readers actually complain about in AI-assisted serials; the HUMAN sample is
the same beats with interruption, silence, and action beats restored.
"""
import sys, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import craft

# The failure mode the readers described: strict A-B-A-B, every utterance one
# complete period-terminated sentence, tags everywhere, nothing staged.
ROBOT = u'''"We should proceed to the eastern checkpoint immediately." he said.

"I agree that the eastern checkpoint is the correct destination." she replied.

"The enemy forces will arrive within three hours." he said.

"We must therefore complete our preparations before that time." she answered.

"I will inform the commander of our decision now." he stated.
'''

# Same scene, written like people: interruption, silence, a fragment, an
# answer to a different question, action beats instead of tags.
HUMAN = u'''Mara didn't look up from the map. "East."

"East is three hours of open ground\u2014"

"I know what east is."

He waited. She kept not looking up, and that was answer enough.

"You're going to get us killed," he said finally.

"Probably." She folded the map along its old creases, slow, deliberate.
"Bring the radio."
'''

# Apostrophes and curly quotes must not corrupt span detection.
TRICKY = u'''\u201cDon\u2019t touch it,\u201d she said. \u201cI mean it.\u201d

He didn\u2019t touch it.
'''

def show(label, prose):
    out = craft.dialogue_stats([{"chapter_id": "0001", "prose": prose}])
    pc = out["per_chapter"]
    print("--- %s ---" % label)
    if not pc:
        print("  NO DIALOGUE DETECTED")
        return None
    print("  " + json.dumps(pc[0], sort_keys=True))
    return pc[0]

r = show("ROBOT", ROBOT)
h = show("HUMAN", HUMAN)
t = show("TRICKY (curly quotes + apostrophes)", TRICKY)

print()
ok = True

def check(name, cond, detail):
    global ok
    print("%-46s %s  %s" % (name, "PASS" if cond else "FAIL", detail))
    if not cond:
        ok = False

check("robot flat_pct > human flat_pct",
      r["flat_pct"] > h["flat_pct"], "%d vs %d" % (r["flat_pct"], h["flat_pct"]))
check("robot tag_pct > human tag_pct",
      r["tag_pct"] > h["tag_pct"], "%d vs %d" % (r["tag_pct"], h["tag_pct"]))
check("robot tag_pct exceeds 30%% ceiling",
      r["tag_pct"] > 30, "%d" % r["tag_pct"])
check("human has action beats, robot has none",
      h["beat_pct"] > r["beat_pct"], "%d vs %d" % (h["beat_pct"], r["beat_pct"]))
check("robot beat_pct is zero (tags only, never staged)",
      r["beat_pct"] == 0, "%d" % r["beat_pct"])
check("robot dialogue length spread is flatter",
      r["stdev"] < h["stdev"], "%.1f vs %.1f" % (r["stdev"], h["stdev"]))
check("tricky: both spans found despite apostrophes",
      t["lines"] == 2, "lines=%d" % t["lines"])
check("tricky: apostrophe did not split a span",
      t["mean_words"] >= 3, "mean_words=%.1f" % t["mean_words"])
check("bare volley counted, not penalised as a defect",
      h["bare_pct"] > 0, "human bare_pct=%d" % h["bare_pct"])
check("human: interruption/fragment not counted flat",
      h["flat_pct"] < 50, "%d" % h["flat_pct"])


# --- confusable names ------------------------------------------------------
# The Thomas / Brother Thomas collision a reader spotted in an AI novel by
# chapter two, plus a near-miss pair and a control pair that must stay quiet.
cn = craft.confusable_names(
    ["Thomas", "Brother Thomas", "Aldric", "Aldrik", "Mara", "Vance"])
pairs = {" / ".join(sorted(r["names"])): r for r in cn}
print()
print("--- CONFUSABLE NAMES ---")
for r in cn:
    print("  %-7s %-26s %s" % (r["severity"], " / ".join(r["names"]), r["reason"]))

check("Thomas / Brother Thomas flagged",
      "Brother Thomas / Thomas" in pairs, "%d pairs" % len(cn))
check("containment reported as such",
      pairs.get("Brother Thomas / Thomas", {}).get("reason", "").startswith("one name"),
      pairs.get("Brother Thomas / Thomas", {}).get("reason", "-"))
check("Aldric / Aldrik flagged high",
      pairs.get("Aldric / Aldrik", {}).get("severity") == "high",
      pairs.get("Aldric / Aldrik", {}).get("severity", "-"))
check("unrelated names NOT flagged",
      "Mara / Vance" not in pairs, "control pair absent")
check("empty cast is not an error",
      craft.confusable_names([]) == [] and craft.confusable_names(None) == [],
      "returns []")

# --- repeated dialogue -----------------------------------------------------
# "Every character just kept repeating their goals over and over."
GOAL = u'"I will take back the city my father lost."'
chs = [{"chapter_id": "%04d" % i,
        "prose": GOAL + u' he said.' + chr(10)*2 + u'"Yes." she said.'}
       for i in (1, 6, 14)]
rd = craft.repeated_dialogue(chs)
print()
print("--- REPEATED DIALOGUE ---")
for r in rd:
    print("  x%d %s -> %s" % (r["count"], r["chapters"], r["line"]))

check("repeated goal line caught across chapters",
      len(rd) == 1 and rd[0]["count"] == 3, "%d entries" % len(rd))
check("short line 'Yes.' not treated as repetition",
      all("yes" not in r["line"].lower() for r in rd), "under the 4-word floor")
check("a line in only one chapter is not flagged",
      craft.repeated_dialogue([chs[0]]) == [], "single chapter -> []")

# --- vocabulary ------------------------------------------------------------
# Word-level repetition is what an n-gram echo check structurally cannot see.
import random
random.seed(11)
WIDE = ["soldier","bridge","smoke","radio","rifle","mud","frost","engine",
        "signal","trench","ash","wire","ridge","convoy","flare","crater",
        "boot","canvas","diesel","static","ration","helmet","shell","ravine"]
NARROW = ["soldier","bridge","smoke","radio"]
TICS = "he just suddenly felt slightly uneasy and really seemed very quietly tense".split()

def mk(pool, n):
    return " ".join(random.choice(pool) for _ in range(n))

wide = craft.vocabulary_stats([{"chapter_id": "0001", "prose": mk(WIDE, 1200)}])
narrow = craft.vocabulary_stats([{"chapter_id": "0001", "prose": mk(NARROW, 1200)}])
ticky = craft.vocabulary_stats([{"chapter_id": "0001", "prose": " ".join(TICS * 90)}])
clean = craft.vocabulary_stats([{"chapter_id": "0001", "prose": mk(WIDE, 1200)}])
short = craft.vocabulary_stats([{"chapter_id": "0001", "prose": "a very short chapter"}])

print()
print("--- VOCABULARY ---")
print("  wide mattr=%s  narrow mattr=%s" % (wide["overall"]["mattr"], narrow["overall"]["mattr"]))
print("  tic filter/1k=%s  clean filter/1k=%s" % (
    ticky["overall"]["filter_per_1k"], clean["overall"]["filter_per_1k"]))

check("MATTR: wide vocabulary scores above narrow",
      wide["overall"]["mattr"] > narrow["overall"]["mattr"],
      "%s vs %s" % (wide["overall"]["mattr"], narrow["overall"]["mattr"]))
check("MATTR is None below one window, not a fake number",
      short["per_chapter"][0]["mattr"] is None, "short text -> None")
check("filter-word rate separates tic-heavy from clean",
      ticky["overall"]["filter_per_1k"] > clean["overall"]["filter_per_1k"] + 100,
      "%s vs %s" % (ticky["overall"]["filter_per_1k"], clean["overall"]["filter_per_1k"]))
check("adverb rate excludes words that merely end in -ly",
      craft.vocabulary_stats(
          [{"chapter_id": "0001", "prose": "only early reply apply imply " * 40}]
      )["overall"]["adverb_per_1k"] == 0.0, "only/early/reply/apply/imply -> 0")
check("overused needs spread across chapters",
      craft.vocabulary_stats(
          [{"chapter_id": "0001", "prose": "artillery " * 300}]
      )["overused"] == [], "single chapter -> no overuse claim")
check("empty manuscript is not an error",
      craft.vocabulary_stats([])["overall"] is None, "returns None overall")

# --- hook variety ----------------------------------------------------------
# thread-ledger-reviewer classifies every chapter ending anyway; this reads it
# back. Monotony is invisible per-chapter and only exists in the sequence.
def _hch(i, t=None, tech=None):
    d = {"chapter_id": "%04d" % i, "prose": "text"}
    if t: d["hook_type"] = t
    if tech: d["hook_technique"] = tech
    return d

hseq = ([_hch(i, "crisis", "unfinished-action") for i in range(1, 6)] +
        [_hch(6, "mystery", "withholding"), _hch(7, "desire"), _hch(8, "emotion"),
         _hch(9, "choice"), _hch(10, "mystery", "echo"), _hch(11)])
hv = craft.hook_variety(hseq)
varied = craft.hook_variety([_hch(1, "crisis"), _hch(2, "mystery"),
                             _hch(3, "desire"), _hch(4, "emotion")])

print()
print("--- HOOK VARIETY ---")
print("  types:", [(r["type"], r["count"]) for r in hv["by_type"]])
print("  runs :", [(r["type"], r["length"]) for r in hv["runs"]])

check("consecutive same-hook run detected",
      any(r["length"] == 5 and r["type"] == "crisis" for r in hv["runs"]),
      "%d run(s)" % len(hv["runs"]))
check("crowded window flags the cluster",
      any(r["type"] == "crisis" for r in hv["crowded"]), "%d" % len(hv["crowded"]))
check("unrecorded hook counted as unclassified, not guessed",
      hv["classified"] == 10, "%d of %d" % (hv["classified"], len(hseq)))
check("unclassified never starts a run",
      all(r["type"] != "unclassified" for r in hv["runs"]), "ok")
check("a varied book reports no runs",
      varied["runs"] == [], "%d" % len(varied["runs"]))
check("empty manuscript is safe",
      craft.hook_variety([])["by_type"] == [], "ok")

print()
print("RESULT:", "ALL PASS" if ok else "FAILURES PRESENT")
sys.exit(0 if ok else 1)
