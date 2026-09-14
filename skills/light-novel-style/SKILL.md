---
name: light-novel-style
description: Use when drafting or revising fiction prose in this workspace — light novel, web novel, or complete-book chapters. Loaded before drafting (not after) so the prose is written right the first time rather than patched afterward. Complements the general-purpose humanizer skill with fiction-specific anti-AI-tell guidance; run humanizer for broader phrasing/rhythm cleanup, run this for the patterns specific to scene and dialogue writing.
---

# Light Novel Style — Anti-AI Prose Guide

Core idea: write it right the first time. Catching these patterns after a
full chapter is drafted costs more than avoiding them during drafting.

## Your most deeply-trained bad habits

As an LLM, you default to these patterns unless you deliberately fight them:

1. **Closing every paragraph's loop.** You default to cause → process →
   result → reflection, every time. Cut the reflection. Leave the emotional
   residue unresolved — the reader supplies it.
2. **Modifying everything with adverbs.** "Said slowly," "said softly,"
   "nodded slightly." Cut the adverb, replace it with a specific action.
3. **Giving every character the same reactions.** You default to universal
   tells — "eyes narrowed," "heart tightened" — for every character
   regardless of who they are. Design a distinct micro-gesture per
   character (see the character's Voice Profile).
4. **Writing dialogue like a debate.** Characters fully and rationally state
   their position. Real dialogue carries subtext, contradicts the
   speaker's actions, gets interrupted, and leaves things unsaid.
5. **Labeling emotion instead of showing it.** "He felt angry." Replace with
   physiological response + micro-action; let the reader do the inferring.
6. **Spreading information evenly.** Every paragraph carries roughly the
   same information density. Deliberately vary it — some paragraphs are one
   sentence.
7. **Landing safely.** You default to resolving every conflict by chapter's
   end. Deliberately leave at least one thing unresolved.
8. **Showing, then explaining what you just showed.** An action followed by
   a sentence explaining what it meant. Cut the explanatory sentence —
   trust the reader.

## Five checks while drafting (not after)

Run these on every paragraph as you write it, not in a separate cleanup pass:

1. **Closed-loop check**: does this paragraph walk cause → process → result
   → reflection all the way through? → Cut the closing reflection/summary
   sentence.
2. **Adverb check**: have the last three action beats used "slowly,"
   "softly," "slightly," "gently"? → Cut the adverb, replace with a
   sensory detail from a different channel (sound, texture, not another
   visual cue).
3. **Emotion check**: is the character's emotion *told* or *shown*? →
   Replace "he felt X" with physiological response + micro-action.
4. **Dialogue check**: is this line advancing conflict, or explaining
   backstory? → Cut the backstory explanation; give the character's real
   intent instead.
5. **Rhythm check**: has the last ~500 words had uniform pacing? → Insert a
   short-sentence burst, a silence, or a sudden action.

## Substitution table

| AI tic | Replace with | Example |
|---|---|---|
| "He felt angry" | Physiology + micro-action + decision | "Knuckles white, the taste of copper on his tongue. One more second and he'd move." |
| "Said slowly" | Cut adverb, add a preceding action | "He set the cup down. 'You're sure?'" |
| "A flicker crossed her eyes" | Individualized behavior | "She bit the inside of her lip" (nervous) / "He started twisting the pen cap" (anxious) |
| "He thought to himself" | Just the thought, no framing | Delete the framing words, keep the thought as direct interior text |
| Four-beat closed loop | Cut at the high point | Delete the closing reflection sentence; let the reader sit with it |
| Everyone speaks in complete sentences | Add verbal tics, interruptions, elision | "You sure?" / "—Whatever." / a cut-off mid-sentence |
| Summary sentence at paragraph end | Cut it | End on action or dialogue, not "and then he understood" |
| Show then explain | Cut the explanation | After "she slammed the door," don't add "she was clearly furious" |
| "More importantly..." | Just say the thing | Cut transition-template phrases, state the information directly |
| Instant emotional pivots | Add a beat of transition | "He forced the anger down, but his voice still came out a half-step rough" |

## Dialogue specifics

Good dialogue:
- Someone talks over someone else; someone goes silent; someone answers a
  different question than the one asked.
- Characters never fully disclose what they actually think.
- Different characters have different rhythms — some are talkative, some
  spare with words.
- Dialogue tags stay under ~30% of lines; prefer a preceding action beat
  instead ("He ground out his cigarette. 'Fine.'").

Bad dialogue (your default):
- Strict A-says, B-says, A-says alternation.
- Every line fully answers the previous line.
- "X said," "X said flatly" runs through the whole scene.
- Characters talk like they're giving a report.

## Pacing specifics

Good pacing:
- Some paragraphs are one sentence; others run a dozen.
- Sentences shorten and fragment under tension.
- Calm moments can carry long descriptive passages.
- Dense and sparse paragraphs alternate.

Bad pacing (your default):
- Every paragraph runs 3-5 sentences of similar length.
- Constant information density, no peaks or valleys.
- Every scene transition leans on "time passed" / "before he knew it."

## Relationship to other skills

- **`humanizer`**: broader, genre-agnostic AI-tell removal (filler words,
  hedging, em-dash overuse, generic "in conclusion" endings). Run it after
  this skill's drafting-time checks, as the final prose pass — it catches
  what this skill doesn't (this skill is fiction-scene-specific: dialogue,
  pacing, character reaction patterns).
- **Voice-Consistency Reviewer**: checks each character's dialogue against
  their individual Voice Profile. This skill's "give every character a
  distinct micro-gesture" guidance is what the Voice Profile actually
  encodes per character — this skill is how you write to that profile
  while drafting, the reviewer is how a chapter gets checked against it
  afterward.
