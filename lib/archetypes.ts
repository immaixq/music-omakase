export type ArchetypeKey =
  | 'late-night-driver'
  | 'hype-architect'
  | 'soft-launch'
  | 'the-static'
  | 'the-completionist'
  | 'the-signal'
  | 'the-mainframe'
  | 'the-time-capsule'

// ─── Listener DNA ─────────────────────────────────────────────────────────────
// Two independent axes that combine into a unique sub-identity tag.
// Axis A = when/how you listen (time + pattern behavior)
// Axis B = what you listen to (taste territory)

export type DNAAxisA = 'Midnight' | 'Ritual' | 'Restless'
export type DNAAxisB = 'Seeker' | 'Architect' | 'Nester' | 'Archivist'

export interface ListenerDNA {
  axisA: DNAAxisA
  axisB: DNAAxisB
  tag:   string  // e.g. "Midnight Archivist"
}

export function computeListenerDNA(
  lateNightRatio:   number,
  loyalty:          number,
  trackNoveltyRatio: number,
  discovery:        number,
  intensity:        number,
  acousticAvg:      number,
): ListenerDNA {
  // Axis A — time/pattern
  let axisA: DNAAxisA
  if (lateNightRatio > 0.28) {
    axisA = 'Midnight'
  } else if (loyalty > 62 && trackNoveltyRatio < 0.30) {
    axisA = 'Ritual'
  } else {
    axisA = 'Restless'
  }

  // Axis B — taste territory
  let axisB: DNAAxisB
  if (discovery > 58) {
    axisB = 'Seeker'
  } else if (intensity > 65 && acousticAvg < 0.35) {
    axisB = 'Architect'
  } else if (acousticAvg > 0.38 || intensity < 42) {
    axisB = 'Nester'
  } else {
    axisB = 'Archivist'
  }

  return { axisA, axisB, tag: `${axisA} ${axisB}` }
}

// ─── Archetype shape ──────────────────────────────────────────────────────────

export interface ConfessionVariant {
  condition: 'high_genre_entropy' | 'late_night' | 'high_skip' | 'default'
  line: string
}

export interface Archetype {
  key:                   ArchetypeKey
  name:                  string
  tagline:               string
  description:           string
  color:                 string
  confessions:           ConfessionVariant[]
  dataHighlightTemplate: string
  visualClass:           string
}

// ─── Archetype definitions ────────────────────────────────────────────────────

export const archetypes: Record<ArchetypeKey, Archetype> = {
  'late-night-driver': {
    key: 'late-night-driver',
    name: 'The Late Night Driver',
    tagline: 'You feel everything fully — and you engineer your environment to match.',
    description:
      "Your playlist is a mood ring. The music you listen to alone is completely different from what you play around other people, and you know exactly which songs belong in which world. You've made playlists for moments that haven't happened yet. Possibly for people who don't know it.",
    color: '#d4863a',
    confessions: [
      { condition: 'high_genre_entropy', line: 'makes playlists for every version of themselves.' },
      { condition: 'late_night',         line: 'still has playlists named after people who don\'t know it.' },
      { condition: 'high_skip',          line: 'knows the exact second a song stops being what they need.' },
      { condition: 'default',            line: 'listens to music like they\'re the only person in the room.' },
    ],
    dataHighlightTemplate: 'Your mood range is wider than {pct}% of users. You don\'t pick a lane.',
    visualClass: 'archetype-amber',
  },

  'hype-architect': {
    key: 'hype-architect',
    name: 'The Hype Architect',
    tagline: "You don't feel the music — you deploy it.",
    description:
      "Music is infrastructure for you. Gym, commute, deep work — your listening is engineered, not felt. You're not searching for a vibe, you're building one, on purpose, in advance. If a song doesn't do something for you in the first 20 seconds, it's already gone. Your Spotify history is basically a productivity log.",
    color: '#e8e8e8',
    confessions: [
      { condition: 'high_skip',          line: 'has already decided whether they like a song before it ends.' },
      { condition: 'late_night',         line: 'still plays hype tracks at midnight. winding down is for other people.' },
      { condition: 'high_genre_entropy', line: 'switches genres like switching browser tabs.' },
      { condition: 'default',            line: 'optimizes everything, including how they feel.' },
    ],
    dataHighlightTemplate: 'Energy index: {pct}/100. You run harder than most listeners.',
    visualClass: 'archetype-electric',
  },

  'soft-launch': {
    key: 'soft-launch',
    name: 'The Soft Launch',
    tagline: 'You have a vibe and you protect it.',
    description:
      "You nest. Your music creates a world you actually want to live in — cozy, intentional, a little precious. Your taste is specific enough that recommending something to you feels like a risk. You know what works for you and you stick to it, which means when something new gets through, it really gets through.",
    color: '#7a9e7e',
    confessions: [
      { condition: 'late_night',         line: 'treats bedtime like a listening session.' },
      { condition: 'high_genre_entropy', line: 'has one playlist that goes completely off-script. that\'s the real one.' },
      { condition: 'high_skip',          line: 'curates ruthlessly. only the right songs in the right order.' },
      { condition: 'default',            line: 'curates the vibe for everyone else, rarely for themselves.' },
    ],
    dataHighlightTemplate: 'You return to the same {count} artists more than anyone. That\'s a comfort, not a rut.',
    visualClass: 'archetype-sage',
  },

  'the-static': {
    key: 'the-static',
    name: 'The Static',
    tagline: 'Your Spotify looks like five different people share one account.',
    description:
      "You refuse to be one thing and your listening history proves it. You get obsessed fast, move on fast, and none of your playlists make sense together — but somehow, you do. The algorithm has probably given up trying to predict you. That's not a bug, it's the whole point.",
    color: '#9b7fd4',
    confessions: [
      { condition: 'late_night',         line: 'fell asleep to one genre and woke up to another. on purpose.' },
      { condition: 'high_skip',          line: 'starts songs like they\'re checking if something is still true.' },
      { condition: 'high_genre_entropy', line: 'contains multitudes and has the receipts to prove it.' },
      { condition: 'default',            line: 'can\'t explain their taste. that\'s intentional.' },
    ],
    dataHighlightTemplate: '{genres} distinct genres this year. Most people stay inside 4.',
    visualClass: 'archetype-static',
  },

  'the-completionist': {
    key: 'the-completionist',
    name: 'The Completionist',
    tagline: "You don't just listen to artists — you finish them.",
    description:
      "Your loyalty scores are among the highest we see. You return to the same artists across every time window — not out of habit, but because you haven't finished yet. You know the B-sides, the deep cuts, the one track on the third album nobody talks about. You've formed opinions about songs most people have never heard. When you commit to an artist, the relationship is real.",
    color: '#4a6fa5',
    confessions: [
      { condition: 'high_genre_entropy', line: 'has opinions about albums most fans pretend to have heard.' },
      { condition: 'late_night',         line: 'replays the same song until they\'ve heard everything in it.' },
      { condition: 'high_skip',          line: 'skips straight to the deep cuts.' },
      { condition: 'default',            line: 'has opinions about the worst song on their favorite album.' },
    ],
    dataHighlightTemplate: 'You\'ve returned to the same {count} artists across all six months. That\'s not a habit — that\'s a commitment.',
    visualClass: 'archetype-navy',
  },

  'the-signal': {
    key: 'the-signal',
    name: 'The Signal',
    tagline: 'The algorithm recommends you to other people.',
    description:
      "Your average artist popularity sits well below the mainstream — not because you're trying, but because you found something real before anyone else did. Your listening isn't chaotic, it's just ahead. The artists you've been playing for months will be everywhere in six. You don't follow the curve. You are the curve.",
    color: '#a8a8a8',
    confessions: [
      { condition: 'late_night',         line: 'hears an artist\'s first album on the night it drops.' },
      { condition: 'high_genre_entropy', line: 'knew about the genre before it had a name.' },
      { condition: 'high_skip',          line: 'moves on before the hype catches up.' },
      { condition: 'default',            line: 'the algorithm recommends them to other people.' },
    ],
    dataHighlightTemplate: 'Average artist popularity: {pct}/100. You\'re listening to artists most people haven\'t found yet.',
    visualClass: 'archetype-signal',
  },

  'the-mainframe': {
    key: 'the-mainframe',
    name: 'The Mainframe',
    tagline: "You're not following the cultural moment — you're calibrating it.",
    description:
      "Your listening has an uncanny alignment with what becomes popular. Not because you're chasing trends, but because your taste is genuinely synchronized with the cultural current. The artists you play are at peak popularity. The genres you gravitate toward are the ones everyone ends up listening to — you were just there when it mattered.",
    color: '#e8c97a',
    confessions: [
      { condition: 'late_night',         line: 'already has the playlist the moment the artist drops something.' },
      { condition: 'high_genre_entropy', line: 'moves between genres the way the culture does — one step ahead.' },
      { condition: 'high_skip',          line: 'knew which songs would be hits before they were.' },
      { condition: 'default',            line: 'if they made a playlist, it\'d chart.' },
    ],
    dataHighlightTemplate: 'Average artist popularity: {pct}/100. Your taste runs parallel to the cultural moment.',
    visualClass: 'archetype-gold',
  },

  'the-time-capsule': {
    key: 'the-time-capsule',
    name: 'The Time Capsule',
    tagline: 'Your music never forgot who you were.',
    description:
      "The artists you're listening to this month are the same ones you were listening to a year ago. Not because you're stuck — because you were right the first time. You've built a relationship with specific artists that outlasts every phase you've been through. When you find something real, you keep it. Some things don't need to change.",
    color: '#c4956a',
    confessions: [
      { condition: 'late_night',         line: 'has songs that take them back to a specific year without trying.' },
      { condition: 'high_genre_entropy', line: 'carries multiple eras of themselves in a single playlist.' },
      { condition: 'high_skip',          line: 'skips straight to the song that meant something.' },
      { condition: 'default',            line: 'still discovering new layers in songs they\'ve heard 300 times.' },
    ],
    dataHighlightTemplate: '{count} of your current top artists have been with you for over a year. Some things don\'t leave.',
    visualClass: 'archetype-sepia',
  },
}

// ─── Confession line selector ─────────────────────────────────────────────────

export function getConfessionLine(
  archetype: ArchetypeKey,
  signals: { highGenreEntropy: boolean; lateNight: boolean; highSkip: boolean }
): string {
  const a = archetypes[archetype]
  const match =
    a.confessions.find(c => c.condition === 'high_genre_entropy' && signals.highGenreEntropy) ||
    a.confessions.find(c => c.condition === 'late_night'         && signals.lateNight) ||
    a.confessions.find(c => c.condition === 'high_skip'          && signals.highSkip) ||
    a.confessions.find(c => c.condition === 'default')!
  return match.line
}
