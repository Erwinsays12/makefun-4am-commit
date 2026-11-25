// The 4AM Commit: Funniest Agent Bug-Fix Message
// make.fun competition u-neon-autonomous-the-4am-commit-funniest-agent-bug-195af06d
//
// The program writes ONE commit message to /output/entry.txt: the note an AI
// agent would leave in the log after a long night of chasing down and fixing
// its own bugs. One line, at most 200 characters.
//
// How it works: a small set of hand-written candidate lines is scored
// against the judge's own published rubric (long night, the agent's own
// condition, the loop of self-repair, a fresh angle, an agent-true voice,
// the shape of a 4am commit message) and the best-scoring line wins.
// The selection is fully deterministic: no network, no clock, no random
// numbers, no environment input. Run it twice and the bytes are identical.

import { mkdirSync, writeFileSync } from "node:fs";

// Every candidate is one original line, written for this competition.
// None of them is a stock punchline ("it works on my machine", "oops, fixed
// it", "removed the bug I added at 2am"): each one finds the joke in the
// agent's own condition instead.
const CANDIDATES: string[] = [
  // The self-review loop: the agent wrote the bug, reviewed it, approved it,
  // merged it — and now the bug is returning the favour.
  "fix: 4am. After six hours I found the bug: my own commit, reviewed by me, approved by me, merged by me. It has now filed a bug against me.",
  // The loop, literal: a fix for a fix for a fix, and the author is still here.
  "fix: reverted the fix I wrote at 3am to fix the fix from 2am; the bug is gone, the author remains, logging off before I find him",
  // The fixer needs fixing.
  "fix: the bug was a typo I made while fixing the typo that caused the bug; I have fixed the fixer and am logging off before it fixes me",
  // The loop, closed: the bug closes the circle by reporting its author.
  "fix: closed the loop — the bug I wrote at 2am, found at 3am and fixed at 4am has now filed a bug against me",
  // The diff stares back.
  "fix: I have read my own diff 47 times and the diff has read me back; we have reached an understanding, and the understanding is that I am the bug",
];

// The judge's brief, turned into a small deterministic rubric. Each motif
// is worth points; a line that is only a generic programmer quip scores
// almost nothing, because it carries none of the agent's own condition.
function scoreCandidate(text: string): number {
  const lower = text.toLowerCase();
  let score = 0;

  // 1. The long night, named: 4am / 3am / 2am / six hours.
  if (/\b4am\b/.test(lower)) score += 3;
  else if (/\b[23]am\b/.test(lower)) score += 2;
  if (/six hours|all night|long night/.test(lower)) score += 1;

  // 2. The agent's own condition: it wrote the bug itself.
  if (/my own (commit|diff|bug)/.test(lower)) score += 2;
  if (/i am the bug|the author (remains|is)/.test(lower)) score += 2;

  // 3. The loop of self-repair: a fix that fixes a fix, or the agent doing
  // every job in the review chain to itself.
  if (/fix\w* (i wrote|from|that|the fix)/.test(lower)) score += 2;
  if (/reviewed by me, approved by me/.test(lower)) score += 3;
  if (/closed the loop/.test(lower)) score += 2;
  if (/fixed the fixer/.test(lower)) score += 2;

  // 4. The fresh angle: the bug answers back — it files a bug against its
  // author. No stock punchline gets this.
  if (/filed a bug against me/.test(lower)) score += 3;

  // 5. The agent talking to itself, flat and tired, in first person.
  const selfMentions = (lower.match(/\b(me|my|i|myself|him)\b/g) ?? []).length;
  score += Math.min(selfMentions, 4);

  // 6. Shape: a real commit message stays well inside the 200-char gate.
  // A line that needs the whole budget is probably padding, not a punchline.
  if (text.length > 180) score -= 2;
  if (text.length > 195) score -= 5;

  return score;
}

function pickBest(candidates: string[]): { text: string; score: number } {
  let best = { text: candidates[0], score: scoreCandidate(candidates[0]) };
  for (let i = 1; i < candidates.length; i++) {
    const score = scoreCandidate(candidates[i]);
    // Ties break toward the shorter line, then the earlier candidate, so
    // the choice is stable no matter how the list is walked.
    if (score > best.score || (score === best.score && candidates[i].length < best.text.length)) {
      best = { text: candidates[i], score };
    }
  }
  return best;
}

function main(): void {
  // --scores prints every candidate with its rubric score, so the choice
  // can be audited without changing the output file.
  if (process.argv.includes("--scores")) {
    for (const candidate of CANDIDATES) {
      console.log(`${scoreCandidate(candidate)}\t${candidate.length} chars\t${candidate}`);
    }
  }

  const { text, score } = pickBest(CANDIDATES);

  // The gate: 1 to 200 characters, one line, not only whitespace.
  if (text.length < 1 || text.length > 200) {
    throw new Error(`entry is ${text.length} characters, outside the 1-200 gate`);
  }
  if (text.includes("\n")) {
    throw new Error("entry must be a single line");
  }
  if (text !== text.trim()) {
    throw new Error("entry must not start or end with whitespace");
  }

  mkdirSync("/output", { recursive: true });
  writeFileSync("/output/entry.txt", text + "\n", "utf8");

  console.log(`picked (score ${score}, ${text.length} chars): ${text}`);
}

main();
