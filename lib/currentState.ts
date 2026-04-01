import type { AudioFeature } from './scoring'

export type MoodQuadrant = 'alive' | 'soft' | 'restless' | 'heavy'
export type MoodTrend    = 'rising' | 'falling' | 'stable'

export interface CurrentState {
  quadrant:     MoodQuadrant
  trend:        MoodTrend
  vsBaseline:   'brighter' | 'darker' | 'more_intense' | 'quieter' | 'same'
  headline:     string          // one honest sentence about right now
  description:  string          // 2-3 sentences — what the music is doing
  feelingWords: [string, string, string]  // 3 words to choose from
  dataLine:     string          // the specific data point backing it
}

// ─── Quadrant definitions ─────────────────────────────────────────────────────

const QUADRANT_CONTENT: Record<MoodQuadrant, {
  headline:    string
  description: string
  words:       [string, string, string]
}> = {
  alive: {
    headline:    "Your music is running right now.",
    description: "Not from anything — toward something. The energy is high, the feeling underneath it is broadly positive, and the tracks you've been reaching for lately reflect that. Something is working or something is starting.",
    words:       ['charged', 'expansive', 'ready'],
  },
  soft: {
    headline:    "Your music is just company right now.",
    description: "You're in a good enough place that you don't need it to do much. High warmth, low urgency. The tracks are pleasant, unhurried — not because nothing is happening, but because you're not asking the music to carry anything heavy right now.",
    words:       ['settled', 'warm', 'unhurried'],
  },
  restless: {
    headline:    "Your music is pushing hard, but the feeling underneath isn't light.",
    description: "High energy, lower warmth. You're moving through something. The songs you've been playing lately are driven, intense — the kind of music that keeps you moving before you've decided where you're going.",
    words:       ['driven', 'unsettled', 'searching'],
  },
  heavy: {
    headline:    "Your music has gotten quieter. That's different from peaceful.",
    description: "Low energy, low valence. Not empty — just inward. The tracks you've been reaching for lately aren't asking you to feel better or move faster. They're just there with you, which is its own kind of statement.",
    words:       ['still', 'processing', 'inward'],
  },
}

// Reflection when the user picks a feeling word
const RESONANCE_LINES: Record<MoodQuadrant, Record<string, string>> = {
  alive: {
    charged:   "Your data agrees. The energy average in the last month is running above your 6-month baseline.",
    expansive: "The genre spread in your recent listening is wider than usual. You're reaching further right now.",
    ready:     "Your recent tracks are shorter on average — less patience for slow builds. Something is waiting.",
  },
  soft: {
    settled:   "Your valence has been stable for weeks. No big swings. That consistency is its own signal.",
    warm:      "The acousticness in your recent listening is up. You're reaching for something warmer than usual.",
    unhurried: "Your average track length is longer lately. You're letting things finish. That's not nothing.",
  },
  restless: {
    driven:    "BPM in your recent listening is running above your baseline. Your body knows something.",
    unsettled: "The valence variance in your last month is high — you're not in one consistent place.",
    searching: "You've played more new artists in the last 4 weeks than the 2 months before. Looking for something.",
  },
  heavy: {
    still:      "Your recent listening sessions are longer than usual. You're not skipping. You're sitting in it.",
    processing: "The instrumentalness in your recent tracks is higher. Less words. More space to think.",
    inward:     "Your late-night listening ratio is up recently. The end-of-day music is where the real data lives.",
  },
}

// What to say when the user's word choice slightly contradicts the data
const MISMATCH_LINES: Record<MoodQuadrant, string> = {
  alive:    "Interesting — your data skews a little lighter than that word. But data doesn't catch everything.",
  soft:     "Your music is saying something warmer. Maybe you know something the playlist doesn't yet.",
  restless: "The energy in your recent tracks leans heavier than that. Music tends to be honest before we are.",
  heavy:    "Your listening is running a little lighter than that word. Either you're further along than you think, or the music is aspirational.",
}

// ─── Compute ──────────────────────────────────────────────────────────────────

function avg(arr: number[]): number {
  return arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0
}

export function computeCurrentState(
  shortFeatures:  AudioFeature[],
  mediumFeatures: AudioFeature[],
): CurrentState {
  if (shortFeatures.length < 1) return mockCurrentState()

  const valShort = avg(shortFeatures.map(f => f.valence))
  const engShort = avg(shortFeatures.map(f => f.energy))
  const valMed   = avg(mediumFeatures.map(f => f.valence))
  const engMed   = avg(mediumFeatures.map(f => f.energy))

  // Quadrant — primary classification
  const quadrant: MoodQuadrant =
    valShort >= 0.5 && engShort >= 0.55 ? 'alive'    :
    valShort >= 0.5 && engShort <  0.55 ? 'soft'     :
    valShort <  0.5 && engShort >= 0.55 ? 'restless' : 'heavy'

  // Trend — short vs medium valence direction
  const valDelta = valShort - valMed
  const trend: MoodTrend =
    valDelta >  0.07 ? 'rising'  :
    valDelta < -0.07 ? 'falling' : 'stable'

  // Vs baseline — what changed
  const engDelta = engShort - engMed
  let vsBaseline: CurrentState['vsBaseline'] = 'same'
  if      (valDelta >  0.08 && engDelta >  0.06) vsBaseline = 'brighter'
  else if (valDelta < -0.08 && engDelta < -0.06) vsBaseline = 'darker'
  else if (engDelta >  0.10)                     vsBaseline = 'more_intense'
  else if (engDelta < -0.10)                     vsBaseline = 'quieter'

  const content = QUADRANT_CONTENT[quadrant]

  // Data line — specific number that backs this up
  const dataLine = buildDataLine(quadrant, valShort, engShort, valDelta, engDelta)

  return {
    quadrant,
    trend,
    vsBaseline,
    headline:     content.headline,
    description:  content.description,
    feelingWords: content.words,
    dataLine,
  }
}

function fmt(n: number): string {
  return isFinite(n) ? String(Math.round(n * 100)) : '—'
}

function buildDataLine(
  q: MoodQuadrant, val: number, eng: number,
  valDelta: number, engDelta: number
): string {
  switch (q) {
    case 'alive':
      return `Recent avg energy: ${fmt(eng)}/100. Valence: ${fmt(val)}/100. Both running above your 6-month norm.`
    case 'soft':
      return `Valence avg: ${fmt(val)}/100. Energy avg: ${fmt(eng)}/100. Lower pressure than usual${engDelta < -0.05 ? ' — energy dropped recently' : ''}.`
    case 'restless':
      return `Energy avg: ${fmt(eng)}/100 — elevated. Valence avg: ${fmt(val)}/100 — below center${valDelta < -0.05 ? ', and falling' : ''}.`
    case 'heavy':
      return `Valence avg: ${fmt(val)}/100. Energy avg: ${fmt(eng)}/100.${isFinite(valDelta) && valDelta < -0.06 ? ` That's ${Math.round(Math.abs(valDelta) * 100)} points lower than your 6-month average.` : ' Both below your baseline.'}`
  }
}

export function getResonanceLine(quadrant: MoodQuadrant, word: string): string {
  return RESONANCE_LINES[quadrant]?.[word] ?? MISMATCH_LINES[quadrant]
}

// ─── Mock fallback ────────────────────────────────────────────────────────────

export function mockCurrentState(): CurrentState {
  return {
    quadrant:     'restless',
    trend:        'stable',
    vsBaseline:   'same',
    headline:     QUADRANT_CONTENT.restless.headline,
    description:  QUADRANT_CONTENT.restless.description,
    feelingWords: QUADRANT_CONTENT.restless.words,
    dataLine:     'Energy avg: 71/100. Valence avg: 43/100. Running above baseline on intensity.',
  }
}
