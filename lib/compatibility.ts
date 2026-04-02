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

  // ─── Remaining pairs ──────────────────────────────────────────────────────

  [key('late-night-driver', 'the-completionist')]: {
    score:    75,
    verdict:  "one goes deep emotionally, the other goes deep catalogically.",
    dynamic:  "The Late Night Driver wants to feel a song completely. The Completionist wants to hear everything an artist has ever recorded. The axis is different — one is vertical (emotion), one is horizontal (breadth) — but both refuse to be casual listeners. They understand each other's commitment without needing to explain it.",
    warning:  "The Late Night Driver will attach meaning to a song the Completionist has already categorised and filed.",
    chemistry: "Both of them finish what they start. That's rare and they both know it.",
  },

  [key('late-night-driver', 'the-mainframe')]: {
    score:    70,
    verdict:  "the Mainframe plays it first, the Late Night Driver plays it until it means something.",
    dynamic:  "The Mainframe is culturally synchronized — they're on the right artists at the right time. The Late Night Driver is emotionally synchronized — they're in the right mood for the right song. Together: the Mainframe provides the music, the Late Night Driver provides the feeling. This works better than either expected.",
    warning:  "The Late Night Driver will still be processing a song the Mainframe stopped playing three weeks ago.",
    chemistry: "When the Mainframe's recommendation hits the Late Night Driver at exactly the right moment — that's the whole pairing in one exchange.",
  },

  [key('hype-architect', 'the-completionist')]: {
    score:    40,
    verdict:  "one is already at the next song, the other hasn't finished the first album.",
    dynamic:  "The Hype Architect evaluates a song in 20 seconds and moves on. The Completionist won't skip a B-side. This pairing operates in completely different time scales, and both will find the other slightly baffling. The Hype Architect thinks the Completionist is stuck. The Completionist thinks the Hype Architect has never really listened to anything.",
    warning:  "The Hype Architect will skip the deep cut the Completionist considers essential.",
    chemistry: "The Hype Architect will occasionally stumble onto something great fast — and the Completionist will make it last.",
  },

  [key('hype-architect', 'the-signal')]: {
    score:    55,
    verdict:  "both underground, completely different motivations.",
    dynamic:  "The Signal ends up ahead because they're genuinely curious and focused. The Hype Architect ends up ahead because they move so fast they skip mainstream entirely. Both find themselves listening to things most people haven't heard yet — but via different mechanisms. Respect, but low trust. They don't fully understand each other's process.",
    warning:  "The Signal will take the Hype Architect's taste less seriously once they learn why they're listening.",
    chemistry: "Combined, they've heard more new music in the last month than most people hear in a year.",
  },

  [key('hype-architect', 'the-time-capsule')]: {
    score:    35,
    verdict:  "one is always ahead, the other is permanently somewhere else.",
    dynamic:  "The Hype Architect has already decided about the future. The Time Capsule is still living in a specific past. They share almost no musical overlap, and their relationship to time is opposite in every way. What one values — speed, newness, performance — the other doesn't register as relevant at all.",
    warning:  "The Time Capsule will play a song from six years ago. The Hype Architect will not understand why.",
    chemistry: "The Hype Architect can occasionally jolt the Time Capsule into the present. That's the value — rare, but real.",
  },

  [key('soft-launch', 'the-signal')]: {
    score:    60,
    verdict:  "the Signal keeps knocking on a door the Soft Launch has decided is closed.",
    dynamic:  "The Soft Launch has a vibe and protects it. The Signal constantly has new music to introduce. This creates a gentle, persistent friction — the Signal isn't wrong, but the Soft Launch isn't wrong either. The Soft Launch will come around eventually, on their own terms, which the Signal finds maddening.",
    warning:  "The Soft Launch will reject three recommendations before eventually admitting the fourth is perfect.",
    chemistry: "When the Signal finds something that actually fits the Soft Launch's world — it stays there forever.",
  },

  [key('soft-launch', 'the-mainframe')]: {
    score:    55,
    verdict:  "one curates a world, the other calibrates to the culture.",
    dynamic:  "The Soft Launch is specific and somewhat resistant to mainstream. The Mainframe is synchronized with what the culture is doing. This pairing will agree on almost nothing to put on — but the disagreements are polite and interesting. The Soft Launch finds the Mainframe's taste a little obvious. The Mainframe finds the Soft Launch a little precious.",
    warning:  "The Mainframe will play something on the charts. The Soft Launch will change the subject.",
    chemistry: "The Soft Launch shows the Mainframe what curation actually looks like. Sometimes that sticks.",
  },

  [key('soft-launch', 'the-time-capsule')]: {
    score:    80,
    verdict:  "two people who know exactly what they're protecting.",
    dynamic:  "The Soft Launch guards a vibe. The Time Capsule guards a relationship with specific artists across years. Neither is in a hurry. Neither plays something by accident. There's a mutual respect here that doesn't require much explanation — both understand that music is something you choose carefully, not something that just happens to you.",
    warning:  "Neither of them will push the other to hear anything new. That's comfortable and occasionally limiting.",
    chemistry: "The most deliberate pairing. Every song that makes it to a shared playlist was earned.",
  },

  [key('the-static', 'the-mainframe')]: {
    score:    58,
    verdict:  "both curious, pointed in completely different directions.",
    dynamic:  "The Static explores everything chaotically — six genres in a week, no consistent thread. The Mainframe explores the cultural mainstream with precision. They share the quality of curiosity but have no overlap in what they find interesting. Good conversations about why they listen to what they listen to. Difficult conversations about what to actually put on.",
    warning:  "The Static's chaos will exhaust the Mainframe's need for coherence.",
    chemistry: "The Static occasionally stumbles into something mainstream that the Mainframe already knows. That moment of accidental alignment is oddly satisfying.",
  },

  [key('the-static', 'the-time-capsule')]: {
    score:    42,
    verdict:  "one contains every era simultaneously, the other lives in one era completely.",
    dynamic:  "The Static moves through everything — past, present, obscure, mainstream — without settling anywhere. The Time Capsule has found their artists and stayed. They're both loyal in a sense, but to completely different things: the Static is loyal to the idea of music, the Time Capsule is loyal to specific artists. Neither can fully follow the other.",
    warning:  "The Static will move on from something the Time Capsule still considers essential.",
    chemistry: "If the Static's exploration accidentally overlaps with the Time Capsule's artists — that recognition is surprising and genuine.",
  },

  [key('the-completionist', 'the-mainframe')]: {
    score:    65,
    verdict:  "both go deep — just into different territory.",
    dynamic:  "The Completionist goes deep into artists nobody talks about enough. The Mainframe goes deep into artists everyone is talking about right now. The depth is the same; the direction is different. Surprisingly compatible in practice — both bring real knowledge to the conversation, neither is skimming. The Completionist will expand the Mainframe's catalog history. The Mainframe will keep the Completionist from missing the present.",
    warning:  "The Completionist will consider the Mainframe's artists too obvious. The Mainframe will find the Completionist's artists too niche.",
    chemistry: "Both of them have opinions worth listening to. That's rarer than it sounds.",
  },

  [key('the-completionist', 'the-time-capsule')]: {
    score:    87,
    verdict:  "two kinds of devotion, pointing in the same direction.",
    dynamic:  "The Completionist commits to finishing an artist's entire catalog. The Time Capsule commits to carrying artists across years. The form is different but the substance is identical: both believe that real listening means returning, deepening, not moving on until you've heard everything it has to say. This is the highest-loyalty pairing on the board.",
    warning:  "Neither of them will ever suggest anything new. They'll need outside interference to discover anything after month three.",
    chemistry: "Every shared playlist is a work of care. No skip. No filler. No accident.",
  },

  [key('the-signal', 'the-mainframe')]: {
    score:    45,
    verdict:  "opposite ends of the same spectrum, both convinced they're right.",
    dynamic:  "The Signal tracks artists before they're known. The Mainframe tracks artists at peak cultural relevance. They're measuring the same thing — quality — but from opposite sides of the popularity curve. The Signal thinks the Mainframe is late. The Mainframe thinks the Signal is too ahead of the room to be useful.",
    warning:  "The Signal will claim they heard it first. The Mainframe will say it doesn't matter when you heard it, only whether it's good now.",
    chemistry: "The Signal shows the Mainframe what's coming. Sometimes the Mainframe is the first mainstream person to listen. That moment — the Signal's discovery meeting the Mainframe's timing — is when they actually understand each other.",
  },

  [key('the-signal', 'the-time-capsule')]: {
    score:    52,
    verdict:  "one is always arriving, the other is never leaving.",
    dynamic:  "The Signal is perpetually ahead — discovering, moving, not looking back. The Time Capsule found their artists and stayed. Neither is wrong. The Signal finds the future first; the Time Capsule knows the past better than anyone. They don't share music often, but when they do, it's always deliberate.",
    warning:  "The Signal will recommend something new. The Time Capsule will listen once and return to what they already know.",
    chemistry: "If the Signal discovers an artist the Time Capsule already loved years ago — that convergence across time is surprisingly meaningful to both of them.",
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

const UNKNOWN_PAIR: CompatibilityReport = {
  score:    60,
  verdict:  "different worlds, probably interesting.",
  dynamic:  "These types don't share obvious signals, which is exactly when things get interesting. Neither is predictable to the other. The listening styles are different enough that there's genuine curiosity in both directions — if both are willing to stay with it.",
  warning:  "You'll need patience to find the overlap. It's there, but it takes work.",
  chemistry: "When it clicks, it's because you stopped expecting the other person to listen the way you do.",
}

export function getCompatibilityReport(a: ArchetypeKey, b: ArchetypeKey): CompatibilityReport {
  if (a === b) return SAME_TYPE
  return REPORTS[key(a, b)] ?? UNKNOWN_PAIR
}
