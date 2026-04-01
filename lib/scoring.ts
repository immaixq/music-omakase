import type { ArchetypeKey } from './archetypes'

export interface AudioFeature {
  id: string
  energy: number
  valence: number
  acousticness: number
  instrumentalness: number
  tempo: number
  speechiness: number
  danceability: number
}

export interface ScoringResult {
  archetype:       ArchetypeKey
  shadowArchetype: ArchetypeKey
  scores: {
    energyAvg: number
    valenceVariance: number
    acousticAvg: number
    bpmAvg: number
    genreEntropy: number
  }
  signals: {
    highGenreEntropy: boolean
    lateNight: boolean
    highSkip: boolean
  }
  dataHighlight: {
    bpm: number
    genres: number
    energyPct: number
    variancePct: number
  }
}

function avg(arr: number[]): number {
  return arr.reduce((s, v) => s + v, 0) / arr.length
}

function variance(arr: number[]): number {
  const mean = avg(arr)
  return avg(arr.map(v => (v - mean) ** 2))
}

// Shannon entropy — higher = more genre diversity
export function shannonEntropy(counts: number[]): number {
  const total = counts.reduce((s, c) => s + c, 0)
  if (total === 0) return 0
  return counts
    .filter(c => c > 0)
    .reduce((sum, c) => {
      const p = c / total
      return sum - p * Math.log2(p)
    }, 0)
}

export function extractGenreCounts(artists: SpotifyArtist[]): number[] {
  const counts: Record<string, number> = {}
  for (const artist of artists) {
    for (const genre of artist.genres) {
      counts[genre] = (counts[genre] ?? 0) + 1
    }
  }
  return Object.values(counts)
}

export interface SpotifyArtist {
  id: string
  name: string
  genres: string[]
}

export function classify(
  audioFeatures: AudioFeature[],
  topArtists: SpotifyArtist[],
  lateNightRatio: number = 0  // 0–1, fraction of plays between 10pm–1am
): ScoringResult {
  const energyAvg      = avg(audioFeatures.map(f => f.energy))
  const valenceVariance = variance(audioFeatures.map(f => f.valence))
  const acousticAvg    = avg(audioFeatures.map(f => f.acousticness))
  const bpmAvg         = avg(audioFeatures.map(f => f.tempo))
  const genreCounts    = extractGenreCounts(topArtists)
  const genreEntropy   = shannonEntropy(genreCounts)
  const totalGenres    = genreCounts.length

  const signals = {
    highGenreEntropy: genreEntropy > 3.5,
    lateNight:        lateNightRatio > 0.3,
    highSkip:         false, // set by caller if skip data is available
  }

  // Score all four types 0–1, pick highest as primary, second as shadow
  const typeScores: Record<ArchetypeKey, number> = {
    'hype-architect':    scoreHypeArchitect(energyAvg, bpmAvg, acousticAvg),
    'soft-launch':       scoreSoftLaunch(acousticAvg, genreEntropy),
    'late-night-driver': scoreLateNightDriver(valenceVariance, energyAvg),
    'the-static':        scoreTheStatic(genreEntropy, valenceVariance),
  }

  const ranked = (Object.entries(typeScores) as [ArchetypeKey, number][])
    .sort(([, a], [, b]) => b - a)

  const archetype       = ranked[0][0]
  const shadowArchetype = ranked[1][0]

  return {
    archetype,
    shadowArchetype,
    scores: { energyAvg, valenceVariance, acousticAvg, bpmAvg, genreEntropy },
    signals,
    dataHighlight: {
      bpm:         Math.round(bpmAvg),
      genres:      totalGenres,
      energyPct:   Math.round(energyAvg * 100),
      variancePct: Math.round(valenceVariance * 1000),
    },
  }
}

// ─── Per-type scoring functions (0–1) ─────────────────────────────────────────

function scoreHypeArchitect(energy: number, bpm: number, acoustic: number): number {
  const e = clamp((energy - 0.5)  / 0.5)
  const b = clamp((bpm - 100)     / 60)
  const a = clamp((0.3 - acoustic) / 0.3)
  return (e + b + a) / 3
}

function scoreSoftLaunch(acoustic: number, entropy: number): number {
  const a = clamp(acoustic / 0.6)
  const e = clamp((3.5 - entropy) / 3.5)
  return (a + e) / 2
}

function scoreLateNightDriver(variance: number, energy: number): number {
  const v = clamp(variance / 0.08)
  const e = clamp((energy - 0.3) / 0.5)
  return (v + e) / 2
}

function scoreTheStatic(entropy: number, variance: number): number {
  const e = clamp(entropy / 5)
  const v = clamp(variance / 0.08)
  return (e * 0.7) + (v * 0.3)
}

function clamp(n: number): number {
  return Math.max(0, Math.min(1, n))
}
