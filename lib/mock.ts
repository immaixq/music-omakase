import type { ArchetypeKey } from './archetypes'
import { SHADOW_LINES } from './shadowLines'
import type { ListenerProfile, DriftSignal } from './scoring'
import { mockCurrentState, type CurrentState } from './currentState'

export interface AnalyzeResult {
  archetype:       ArchetypeKey
  shadowArchetype: ArchetypeKey
  confessionLine:  string
  shadowLine:      string
  highlight:       string
  handle:          string
  listenerProfile: ListenerProfile
  drift:           DriftSignal
  letter:          [string, string, string]
  waveformData:    { valence: number[]; energy: number[] }
  currentState:    CurrentState
}

const CONFESSION_LINES: Record<ArchetypeKey, string> = {
  'late-night-driver': "still has playlists named after people who don't know it.",
  'hype-architect':    "has already decided whether they like a song before it ends.",
  'soft-launch':       "curates the vibe for everyone else, rarely for themselves.",
  'the-static':        "fell asleep to metal and woke up to bossa nova. on purpose.",
}

const HIGHLIGHTS: Record<ArchetypeKey, string> = {
  'late-night-driver': "Your mood range is wider than 87% of users. You don't pick a lane.",
  'hype-architect':    "Average BPM: 134. You move faster than 91% of listeners.",
  'soft-launch':       "You return to the same 6 artists more than anyone. That's a comfort, not a rut.",
  'the-static':        "31 distinct genres this year. Most people stay inside 4.",
}

const MOCK_LETTERS: Record<ArchetypeKey, [string, string, string]> = {
  'late-night-driver': [
    "You've been coming back to the same songs again.",
    "Not because they're the best ones — you know they're not. Because they were already there during the other times. You don't listen to music casually. You listen to it like you're building evidence.",
    "There are playlists in your history nobody else will hear. The data doesn't know why. It just knows you keep playing them.",
  ],
  'hype-architect': [
    "You use music the way some people use caffeine.",
    "The audio features on your top tracks are remarkably consistent: high energy, above-average tempo, low acousticness. You've found a formula and you stay inside it.",
    "What you listen to when the formula fails — that's the part this data doesn't capture. But it exists.",
  ],
  'soft-launch': [
    "You've built something consistent here.",
    "The same artists, the same pocket of sound, the same lean toward something warm. You know what works for you and you haven't needed to look further.",
    "Your playlist is a room you've arranged exactly the way you want it. Not everyone gets invited in.",
  ],
  'the-static': [
    "You are genuinely hard to read.",
    "Not as a person — as a listener. 31 distinct genres in the last six months. Most people stay inside four.",
    "There's no pattern here that holds for longer than six weeks. You keep outrunning it. That's intentional.",
  ],
}

const MOCK_PROFILES: Record<ArchetypeKey, ListenerProfile> = {
  'late-night-driver': { discovery: 61, loyalty: 72, emotionalRange: 84, intensity: 58 },
  'hype-architect':    { discovery: 44, loyalty: 38, emotionalRange: 52, intensity: 91 },
  'soft-launch':       { discovery: 29, loyalty: 87, emotionalRange: 31, intensity: 42 },
  'the-static':        { discovery: 88, loyalty: 21, emotionalRange: 79, intensity: 65 },
}

const NO_DRIFT: DriftSignal = {
  detected: false, direction: null, weeksAgo: 4,
  valenceDelta: 0, energyDelta: 0, line: '',
}

// Plausible mock waveforms per archetype
const MOCK_WAVEFORMS: Record<ArchetypeKey, { valence: number[]; energy: number[] }> = {
  'late-night-driver': {
    valence: [0.4,0.6,0.3,0.7,0.2,0.8,0.35,0.65,0.25,0.55,0.45,0.75,0.3,0.5,0.4,0.6,0.2,0.7,0.45,0.35,0.6,0.5,0.3,0.65],
    energy:  [0.5,0.6,0.45,0.7,0.4,0.65,0.55,0.75,0.4,0.6,0.5,0.7,0.45,0.6,0.5,0.65,0.4,0.7,0.55,0.5,0.6,0.55,0.45,0.65],
  },
  'hype-architect': {
    valence: [0.7,0.8,0.75,0.85,0.7,0.9,0.75,0.8,0.72,0.88,0.76,0.82,0.7,0.85,0.78,0.83,0.71,0.87,0.74,0.81,0.77,0.84,0.73,0.86],
    energy:  [0.85,0.9,0.88,0.92,0.87,0.95,0.89,0.91,0.86,0.93,0.88,0.9,0.87,0.94,0.89,0.92,0.86,0.93,0.88,0.91,0.87,0.9,0.89,0.94],
  },
  'soft-launch': {
    valence: [0.6,0.65,0.58,0.62,0.67,0.61,0.64,0.59,0.66,0.63,0.6,0.65,0.57,0.64,0.61,0.66,0.59,0.63,0.62,0.67,0.6,0.64,0.58,0.65],
    energy:  [0.35,0.4,0.32,0.38,0.42,0.36,0.39,0.33,0.41,0.37,0.35,0.4,0.31,0.38,0.36,0.41,0.34,0.39,0.37,0.42,0.35,0.39,0.33,0.4],
  },
  'the-static': {
    valence: [0.3,0.8,0.2,0.9,0.4,0.7,0.1,0.85,0.5,0.25,0.75,0.45,0.6,0.15,0.95,0.35,0.55,0.8,0.2,0.65,0.4,0.9,0.3,0.7],
    energy:  [0.8,0.2,0.9,0.35,0.7,0.15,0.85,0.4,0.6,0.9,0.25,0.75,0.45,0.85,0.3,0.65,0.5,0.2,0.8,0.4,0.7,0.25,0.9,0.55],
  },
}

const PAIRS: [ArchetypeKey, ArchetypeKey][] = [
  ['late-night-driver', 'the-static'],
  ['hype-architect',    'late-night-driver'],
  ['soft-launch',       'late-night-driver'],
  ['the-static',        'soft-launch'],
]

export function getMockResult(handle: string): AnalyzeResult {
  const [archetype, shadowArchetype] = PAIRS[Math.floor(Math.random() * PAIRS.length)]
  return {
    archetype,
    shadowArchetype,
    confessionLine:  CONFESSION_LINES[archetype],
    shadowLine:      SHADOW_LINES[shadowArchetype],
    highlight:       HIGHLIGHTS[archetype],
    handle:          handle || 'you',
    listenerProfile: MOCK_PROFILES[archetype],
    drift:           NO_DRIFT,
    letter:          MOCK_LETTERS[archetype],
    waveformData:    MOCK_WAVEFORMS[archetype],
    currentState:    mockCurrentState(),
  }
}
