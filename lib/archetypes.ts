export type ArchetypeKey = 'late-night-driver' | 'hype-architect' | 'soft-launch' | 'the-static'

export interface ConfessionVariant {
  condition: 'high_genre_entropy' | 'late_night' | 'high_skip' | 'default'
  line: string
}

export interface Archetype {
  key: ArchetypeKey
  name: string
  tagline: string
  description: string
  color: string
  confessions: ConfessionVariant[]
  dataHighlightTemplate: string
  visualClass: string
}

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
}

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
