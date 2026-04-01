import type { ArchetypeKey } from './archetypes'

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface AudioFeature {
  id:               string
  energy:           number
  valence:          number
  acousticness:     number
  instrumentalness: number
  tempo:            number
  speechiness:      number
  danceability:     number
}

export interface SpotifyArtist {
  id:         string
  name:       string
  genres:     string[]
  popularity: number
}

export interface ListenerProfile {
  discovery:     number  // 0–100: how far outside mainstream you reach
  loyalty:       number  // 0–100: how consistently you return to same artists
  emotionalRange: number // 0–100: how wide a mood spectrum you cover
  intensity:     number  // 0–100: how much your music demands of you
}

export interface DriftSignal {
  detected:    boolean
  direction:   'lighter' | 'darker' | 'energised' | 'quieter' | null
  weeksAgo:    number   // 4 = short_term boundary
  valenceDelta: number
  energyDelta:  number
  line:         string  // ready-to-display copy
}

export interface ScoringResult {
  archetype:       ArchetypeKey
  shadowArchetype: ArchetypeKey
  scores: {
    energyAvg:       number
    valenceAvg:      number
    valenceVariance: number
    acousticAvg:     number
    bpmAvg:          number
    genreEntropy:    number
  }
  signals: {
    highGenreEntropy: boolean
    lateNight:        boolean
    highSkip:         boolean
  }
  listenerProfile: ListenerProfile
  drift:           DriftSignal
  dataHighlight: {
    bpm:         number
    genres:      number
    energyPct:   number
    variancePct: number
  }
  waveformData: {
    valence: number[]
    energy:  number[]
  }
}

// ─── Math helpers ─────────────────────────────────────────────────────────────

function avg(arr: number[]): number {
  if (arr.length === 0) return 0
  return arr.reduce((s, v) => s + v, 0) / arr.length
}

function variance(arr: number[]): number {
  const mean = avg(arr)
  return avg(arr.map(v => (v - mean) ** 2))
}

function stdDev(arr: number[]): number {
  return Math.sqrt(variance(arr))
}

function clamp(n: number): number {
  return Math.max(0, Math.min(1, n))
}

function clamp100(n: number): number {
  return Math.round(Math.max(1, Math.min(99, n)))
}

// ─── Genre entropy ────────────────────────────────────────────────────────────

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

// ─── Archetype scoring (per-type 0–1) ────────────────────────────────────────

function scoreHypeArchitect(energy: number, bpm: number, acoustic: number): number {
  return (clamp((energy - 0.5) / 0.5) + clamp((bpm - 100) / 60) + clamp((0.3 - acoustic) / 0.3)) / 3
}

function scoreSoftLaunch(acoustic: number, entropy: number): number {
  return (clamp(acoustic / 0.6) + clamp((3.5 - entropy) / 3.5)) / 2
}

function scoreLateNightDriver(variance: number, energy: number): number {
  return (clamp(variance / 0.08) + clamp((energy - 0.3) / 0.5)) / 2
}

function scoreTheStatic(entropy: number, variance: number): number {
  return clamp(entropy / 5) * 0.7 + clamp(variance / 0.08) * 0.3
}

// ─── Listener profile ─────────────────────────────────────────────────────────

export function computeListenerProfile(
  shortTracks:  { id: string; popularity: number }[],
  mediumTracks: { id: string; popularity: number }[],
  longTracks:   { id: string; popularity: number }[],
  topArtists:   SpotifyArtist[],
  audioFeatures: AudioFeature[],
): ListenerProfile {
  // Discovery — inverse of average popularity (artists + tracks weighted)
  const artistPopAvg = avg(topArtists.map(a => a.popularity))
  const trackPopAvg  = avg(mediumTracks.map(t => t.popularity))
  const discovery    = clamp100(100 - (artistPopAvg * 0.6 + trackPopAvg * 0.4))

  // Loyalty — Jaccard overlap between short-term and long-term artists
  const shortIds = new Set(shortTracks.map(t => t.id))
  const longIds  = new Set(longTracks.map(t => t.id))
  const intersection = [...shortIds].filter(id => longIds.has(id)).length
  const union        = new Set([...shortIds, ...longIds]).size
  const loyalty      = clamp100(union > 0 ? (intersection / union) * 100 * 3.5 : 50)
  // ×3.5 because top-50 overlap across years is naturally low — scale to feel meaningful

  // Emotional range — valence std dev + energy std dev
  const valStd = stdDev(audioFeatures.map(f => f.valence))
  const engStd = stdDev(audioFeatures.map(f => f.energy))
  const valRange = Math.max(...audioFeatures.map(f => f.valence)) - Math.min(...audioFeatures.map(f => f.valence))
  const emotionalRange = clamp100((valStd * 0.5 + engStd * 0.3 + valRange * 0.2) * 200)

  // Intensity — energy + vocals + speechiness
  const energyAvg       = avg(audioFeatures.map(f => f.energy))
  const instrumentalAvg = avg(audioFeatures.map(f => f.instrumentalness))
  const speechAvg       = avg(audioFeatures.map(f => f.speechiness))
  const intensity       = clamp100((energyAvg * 0.4 + (1 - instrumentalAvg) * 0.35 + speechAvg * 0.25) * 100)

  return { discovery, loyalty, emotionalRange, intensity }
}

// ─── Drift detection ──────────────────────────────────────────────────────────

export function detectDrift(
  shortFeatures:  AudioFeature[],
  mediumFeatures: AudioFeature[],
): DriftSignal {
  if (shortFeatures.length < 5 || mediumFeatures.length < 5) {
    return { detected: false, direction: null, weeksAgo: 4, valenceDelta: 0, energyDelta: 0, line: '' }
  }

  const valShort  = avg(shortFeatures.map(f => f.valence))
  const valMedium = avg(mediumFeatures.map(f => f.valence))
  const engShort  = avg(shortFeatures.map(f => f.energy))
  const engMedium = avg(mediumFeatures.map(f => f.energy))
  const acoShort  = avg(shortFeatures.map(f => f.acousticness))
  const acoMedium = avg(mediumFeatures.map(f => f.acousticness))

  const valDelta = valShort - valMedium
  const engDelta = engShort - engMedium
  const acoDelta = acoShort - acoMedium

  // Require two signals crossing threshold simultaneously
  const valSignal = Math.abs(valDelta) > 0.10
  const engSignal = Math.abs(engDelta) > 0.12
  const acoSignal = Math.abs(acoDelta) > 0.15

  const detected = [valSignal, engSignal, acoSignal].filter(Boolean).length >= 2

  if (!detected) {
    return { detected: false, direction: null, weeksAgo: 4, valenceDelta: valDelta, energyDelta: engDelta, line: '' }
  }

  // Determine direction — valence is primary signal
  let direction: DriftSignal['direction'] = null
  let line = ''

  if (valDelta < -0.10 && engDelta < -0.08) {
    direction = 'darker'
    line = `Your music got quieter in the last month. Not in volume — in what it's asking for.`
  } else if (valDelta > 0.10 && engDelta > 0.08) {
    direction = 'lighter'
    line = `Something shifted about 4 weeks ago. Your music got brighter. The data doesn't say why.`
  } else if (engDelta > 0.12) {
    direction = 'energised'
    line = `Your recent tracks are running harder than your 6-month average. Something changed.`
  } else if (engDelta < -0.12 || (valDelta < -0.10 && acoSignal)) {
    direction = 'quieter'
    line = `You've been reaching for something slower lately. The acoustic tracks went up. The data notices.`
  }

  return { detected: !!direction, direction, weeksAgo: 4, valenceDelta: valDelta, energyDelta: engDelta, line }
}

// ─── Late-night ratio from recently played ────────────────────────────────────

export function computeLateNightRatio(recentItems: { played_at: string }[]): number {
  if (recentItems.length === 0) return 0
  const lateNight = recentItems.filter(item => {
    const hour = new Date(item.played_at).getHours()
    return hour >= 22 || hour < 2
  })
  return lateNight.length / recentItems.length
}

// ─── Main classify ────────────────────────────────────────────────────────────

export function classify(
  audioFeatures:  AudioFeature[],
  topArtists:     SpotifyArtist[],
  shortTracks:    { id: string; popularity: number }[],
  mediumTracks:   { id: string; popularity: number }[],
  longTracks:     { id: string; popularity: number }[],
  shortFeatures:  AudioFeature[],
  lateNightRatio: number = 0,
): ScoringResult {
  const energyAvg       = avg(audioFeatures.map(f => f.energy))
  const valenceAvg      = avg(audioFeatures.map(f => f.valence))
  const valenceVariance = variance(audioFeatures.map(f => f.valence))
  const acousticAvg     = avg(audioFeatures.map(f => f.acousticness))
  const bpmAvg          = avg(audioFeatures.map(f => f.tempo))
  const genreCounts     = extractGenreCounts(topArtists)
  const genreEntropy    = shannonEntropy(genreCounts)
  const totalGenres     = genreCounts.length

  const signals = {
    highGenreEntropy: genreEntropy > 3.5,
    lateNight:        lateNightRatio > 0.3,
    highSkip:         false,
  }

  // Score all four types, pick top two
  const typeScores: Record<ArchetypeKey, number> = {
    'hype-architect':    scoreHypeArchitect(energyAvg, bpmAvg, acousticAvg),
    'soft-launch':       scoreSoftLaunch(acousticAvg, genreEntropy),
    'late-night-driver': scoreLateNightDriver(valenceVariance, energyAvg),
    'the-static':        scoreTheStatic(genreEntropy, valenceVariance),
  }

  const ranked = (Object.entries(typeScores) as [ArchetypeKey, number][]).sort(([, a], [, b]) => b - a)
  const archetype       = ranked[0][0]
  const shadowArchetype = ranked[1][0]

  // Medium-term features for drift comparison
  const mediumFeatures = audioFeatures

  return {
    archetype,
    shadowArchetype,
    scores: { energyAvg, valenceAvg, valenceVariance, acousticAvg, bpmAvg, genreEntropy },
    signals,
    listenerProfile: computeListenerProfile(shortTracks, mediumTracks, longTracks, topArtists, audioFeatures),
    drift:           detectDrift(shortFeatures, mediumFeatures),
    dataHighlight: {
      bpm:         Math.round(bpmAvg),
      genres:      totalGenres,
      energyPct:   Math.round(energyAvg * 100),
      variancePct: Math.round(valenceVariance * 1000),
    },
    waveformData: {
      valence: audioFeatures.slice(0, 24).map(f => f.valence),
      energy:  audioFeatures.slice(0, 24).map(f => f.energy),
    },
  }
}
