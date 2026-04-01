import { type ArchetypeKey } from './archetypes'

export interface CompatibilityReport {
  score:    number   // 0–100
  verdict:  string   // one punchy line
  dynamic:  string   // longer description
  warning:  string   // the tension line
  chemistry: string  // what works
}

type PairKey = `${ArchetypeKey}+${ArchetypeKey}`

function key(a: ArchetypeKey, b: ArchetypeKey): PairKey {
  // Always sort so A+B === B+A
  return [a, b].sort().join('+') as PairKey
}

const REPORTS: Partial<Record<PairKey, CompatibilityReport>> = {
  [key('late-night-driver', 'hype-architect')]: {
    score:    62,
    verdict:  "one builds the vibe, the other is already three songs ahead.",
    dynamic:  "You're in the same room but different movies. The Late Night Driver needs the song to land — the Hype Architect has already catalogued it and moved on. This either creates a productive tension or a quiet resentment, depending on the day.",
    warning:  "The Hype Architect will skip a song before it ends. The Late Night Driver will remember that forever.",
    chemistry: "When it works, the Hype Architect finds new music and the Late Night Driver makes it mean something.",
  },
  [key('late-night-driver', 'soft-launch')]: {
    score:    88,
    verdict:  "two people who both think they're the more emotional one.",
    dynamic:  "This is a comfortable pairing that occasionally implodes when both of you are sad at the same time and neither wants to be the one to fix it. On good days: you share songs, you feel understood, you sit in silence and it's fine.",
    warning:  "Neither of you will say what the playlist is actually about.",
    chemistry: "Both of you listen in the same register. Silence between you is never awkward.",
  },
  [key('late-night-driver', 'the-static')]: {
    score:    74,
    verdict:  "chaotic but they get it.",
    dynamic:  "The Static keeps the Late Night Driver from getting stuck in one feeling too long. The Late Night Driver gives the Static's chaos an emotional anchor it didn't know it needed. This pairing is rarely boring.",
    warning:  "The Static moves on. The Late Night Driver keeps the playlist.",
    chemistry: "The broadest combined music knowledge of any pairing. Something for every version of the day.",
  },
  [key('hype-architect', 'soft-launch')]: {
    score:    55,
    verdict:  "one is engineering, the other is decorating.",
    dynamic:  "The Hype Architect builds systems. The Soft Launch builds atmospheres. In the best version of this: the Hype Architect respects the vibe without needing to optimise it. In the worst: they just put on a podcast.",
    warning:  "The Hype Architect will change the song before it ends. The Soft Launch chose that song for a reason.",
    chemistry: "The Soft Launch teaches the Hype Architect to actually listen. Occasionally it works.",
  },
  [key('hype-architect', 'the-static')]: {
    score:    79,
    verdict:  "both of you are always onto the next thing.",
    dynamic:  "Shared energy, different reasons. The Hype Architect skips because a song isn't useful anymore. The Static skips because something new arrived. The result is the same: a playlist that never settles. Whether that's exciting or exhausting depends on the week.",
    warning:  "You will never agree on what to put on at dinner.",
    chemistry: "Combined, you've heard everything. Nothing surprises this pairing.",
  },
  [key('soft-launch', 'the-static')]: {
    score:    68,
    verdict:  "the Soft Launch is the Static's one consistent thing.",
    dynamic:  "The Static, who moves through everything fast, tends to hold the Soft Launch closer than average — because the Soft Launch stays. The Soft Launch finds the Static exhausting and quietly fascinating in equal measure.",
    warning:  "The Static will blow up the shared playlist. The Soft Launch will rebuild it without saying anything.",
    chemistry: "The Static brings the discoveries. The Soft Launch decides what stays.",
  },
}

// Fallback for same-type pairs
const SAME_TYPE: CompatibilityReport = {
  score:    83,
  verdict:  "you are the same person at different volumes.",
  dynamic:  "This pairing understands each other without explanation. The risk is that you both have the same blind spots — no one to push back, no friction to grow from. You'll have the best playlists and the most comfortable silences.",
  warning:  "Nobody in this pairing will suggest anything new.",
  chemistry: "Complete mutual understanding. Occasionally suffocating.",
}

export function getCompatibilityReport(a: ArchetypeKey, b: ArchetypeKey): CompatibilityReport {
  if (a === b) return SAME_TYPE
  return REPORTS[key(a, b)] ?? SAME_TYPE
}
