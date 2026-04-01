import { type ArchetypeKey } from './archetypes'
import { SHADOW_LINES } from './shadowLines'

export interface AnalyzeResult {
  archetype:       ArchetypeKey
  shadowArchetype: ArchetypeKey
  confessionLine:  string
  shadowLine:      string
  highlight:       string
  handle:          string
}

const PAIRS: [ArchetypeKey, ArchetypeKey][] = [
  ['late-night-driver', 'the-static'],
  ['hype-architect',    'late-night-driver'],
  ['soft-launch',       'late-night-driver'],
  ['the-static',        'soft-launch'],
]

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

export function getMockResult(handle: string): AnalyzeResult {
  const [archetype, shadowArchetype] = PAIRS[Math.floor(Math.random() * PAIRS.length)]
  return {
    archetype,
    shadowArchetype,
    confessionLine: CONFESSION_LINES[archetype],
    shadowLine:     SHADOW_LINES[shadowArchetype],
    highlight:      HIGHLIGHTS[archetype],
    handle:         handle || 'you',
  }
}
