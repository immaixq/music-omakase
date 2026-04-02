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

  // ─── Pairs involving new archetypes ──────────────────────────────────────

  [key('the-completionist', 'the-signal')]: {
    score:    58,
    verdict:  "one goes deep, the other keeps moving.",
    dynamic:  "The Completionist wants to finish an artist before moving on. The Signal has already found the next three. This creates a productive tension — the Completionist gives depth to discoveries the Signal makes too quickly, but the Signal's restlessness will eventually feel like a betrayal of everything the Completionist values.",
    warning:  "The Signal will move on before the Completionist has heard the whole discography.",
    chemistry: "When it works, the Signal makes the discovery and the Completionist makes it permanent.",
  },

  [key('the-mainframe', 'the-time-capsule')]: {
    score:    61,
    verdict:  "one is tuned to now, the other to then.",
    dynamic:  "The Mainframe moves with the cultural moment; the Time Capsule moves against it, or rather, stays in place. They share the quality of depth — neither is a casual listener — but their relationship to time is completely different. Good conversations about music. Disagreements about which eras matter.",
    warning:  "The Mainframe will play something new. The Time Capsule will quietly play the old version instead.",
    chemistry: "The Time Capsule gives the Mainframe a sense of history. The Mainframe shows the Time Capsule something worth keeping.",
  },

  [key('the-completionist', 'soft-launch')]: {
    score:    82,
    verdict:  "two people who know exactly what they want.",
    dynamic:  "Both archetypes are loyal. Both listen with intention. The difference: Soft Launch protects a vibe; Completionist protects an artist relationship. In practice, they understand each other's commitment without needing to explain it. Silences are comfortable. Recommendations are taken seriously.",
    warning:  "Neither of them will introduce the other to much that's new.",
    chemistry: "The best shared playlists of any pairing. No skips. Nothing misplaced.",
  },

  [key('the-signal', 'the-static')]: {
    score:    71,
    verdict:  "both underground, completely different reasons.",
    dynamic:  "The Signal is ahead because they're focused. The Static is chaotic because they contain multitudes. The result is two people who have heard things nobody else has heard, but via completely different paths. Great music conversations — until they disagree about whether a genre change counts as growth or betrayal.",
    warning:  "The Signal thinks the Static doesn't commit enough. The Static thinks the Signal takes it too seriously.",
    chemistry: "Combined, they've covered more musical territory than any other pairing.",
  },

  [key('the-mainframe', 'hype-architect')]: {
    score:    76,
    verdict:  "both functional, both popular, totally different energy.",
    dynamic:  "The Hype Architect uses music as infrastructure. The Mainframe uses it as calibration. Both end up listening to high-popularity artists, but for different reasons — one for performance, one for cultural alignment. They get along easily and rarely fight about what to put on.",
    warning:  "The Hype Architect will play something at 140 BPM over dinner. The Mainframe will let it go this once.",
    chemistry: "Neither is overthinking the music. That's actually refreshing.",
  },

  [key('the-time-capsule', 'late-night-driver')]: {
    score:    85,
    verdict:  "both of them are still inside old songs.",
    dynamic:  "The Late Night Driver makes emotional playlists for moments that haven't happened yet. The Time Capsule has playlists for moments that happened years ago. They operate in the same register — music as memory, as feeling, as evidence. Neither will rush through a song. Neither will play something just to fill space.",
    warning:  "Two people who will never finish talking about a song they both love.",
    chemistry: "The most emotionally honest pairing. No performance. Just music that means something.",
  },

  [key('the-completionist', 'the-static')]: {
    score:    44,
    verdict:  "one is all-in, the other is everywhere at once.",
    dynamic:  "The Completionist commits fully to one artist at a time. The Static commits to nothing for longer than six weeks. This pairing finds each other fascinating but exhausting. The Completionist can't understand why the Static keeps moving. The Static can't understand why the Completionist hasn't moved yet.",
    warning:  "The Static will have a new favorite artist before the Completionist has finished the first one's catalog.",
    chemistry: "When the Static accidentally discovers something the Completionist already knows deeply — that moment of recognition is rare and worth it.",
  },

  [key('the-signal', 'late-night-driver')]: {
    score:    77,
    verdict:  "the Signal finds it, the Late Night Driver makes it mean something.",
    dynamic:  "The Signal discovers artists before anyone else. The Late Night Driver absorbs music emotionally and completely. Together: new discoveries get felt properly instead of just catalogued. The Late Night Driver gives the Signal's finds a home. The Signal stops the Late Night Driver from cycling through the same five feelings forever.",
    warning:  "The Signal moves on before the Late Night Driver is done feeling it.",
    chemistry: "Every recommendation from the Signal lands harder than it should. That's the pairing working.",
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
