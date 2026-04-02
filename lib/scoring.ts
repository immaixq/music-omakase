import type { ArchetypeKey, ListenerDNA } from './archetypes'
import { computeListenerDNA } from './archetypes'

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
  discovery:      number  // 0–100: how far outside mainstream you reach
  loyalty:        number  // 0–100: how consistently you return to same artists
  emotionalRange: number  // 0–100: how wide a mood spectrum you cover
  intensity:      number  // 0–100: how much your music demands of you
}

export interface DriftSignal {
  detected:     boolean
  direction:    'lighter' | 'darker' | 'energised' | 'quieter' | null
  weeksAgo:     number
  valenceDelta: number
  energyDelta:  number
  line:         string
}

export interface ScoringResult {
  archetype:       ArchetypeKey
  shadowArchetype: ArchetypeKey
  scores: {
    energyAvg:    number
    valenceAvg:   number
    acousticAvg:  number
    genreEntropy: number
    matchRate:    number
  }
  signals: {
    highGenreEntropy: boolean
    lateNight:        boolean
    highSkip:         boolean
  }
  listenerProfile: ListenerProfile
  listenerDNA:     ListenerDNA
  drift:           DriftSignal
  dataHighlight: {
    genres:       number
    energyPct:    number
    loyaltyPct:   number
    lateNightPct: number
  }
  waveformData: {
    valence: number[]
    energy:  number[]
  }
  topArtistNames: string[]
  topGenres:      string[]
}

// ─── Math helpers ─────────────────────────────────────────────────────────────

function avg(arr: number[]): number {
  const clean = arr.filter(v => typeof v === 'number' && isFinite(v))
  if (clean.length === 0) return 0
  return clean.reduce((s, v) => s + v, 0) / clean.length
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
  for (const genre of safeGenres(artists)) {
    counts[genre] = (counts[genre] ?? 0) + 1
  }
  return Object.values(counts)
}

// ─── Genre → feature inference ────────────────────────────────────────────────

// [keyword, energy 0-1, valence 0-1, acoustic 0-1]
const GENRE_SCORE_MAP: [string, number, number, number][] = [
  ['edm',                0.92, 0.78, 0.05],
  ['hard dance',         0.90, 0.72, 0.05],
  ['drum and bass',      0.90, 0.55, 0.05],
  ['hardstyle',          0.92, 0.55, 0.05],
  ['dubstep',            0.88, 0.50, 0.05],
  ['techno',             0.87, 0.42, 0.05],
  ['industrial',         0.82, 0.28, 0.05],
  ['metal',              0.88, 0.22, 0.06],
  ['hardcore',           0.88, 0.25, 0.05],
  ['hard rock',          0.80, 0.32, 0.08],
  ['punk',               0.80, 0.35, 0.08],
  ['grunge',             0.68, 0.28, 0.12],
  ['house',              0.82, 0.72, 0.05],
  ['dance',              0.82, 0.80, 0.05],
  ['disco',              0.78, 0.85, 0.06],
  ['funk',               0.74, 0.82, 0.12],
  ['electro',            0.76, 0.58, 0.05],
  ['electronic',         0.70, 0.55, 0.05],
  ['k-pop',              0.75, 0.80, 0.08],
  ['pop',                0.68, 0.78, 0.10],
  ['trap',               0.74, 0.40, 0.06],
  ['hip hop',            0.72, 0.52, 0.06],
  ['hip-hop',            0.72, 0.52, 0.06],
  ['rap',                0.70, 0.48, 0.06],
  ['r&b',                0.58, 0.72, 0.10],
  ['reggaeton',          0.75, 0.70, 0.06],
  ['latin',              0.68, 0.72, 0.10],
  ['afrobeats',          0.72, 0.78, 0.08],
  ['rock',               0.68, 0.44, 0.10],
  ['alternative',        0.60, 0.45, 0.14],
  ['emo',                0.64, 0.24, 0.10],
  ['post-punk',          0.60, 0.30, 0.10],
  ['new wave',           0.62, 0.48, 0.10],
  ['indie rock',         0.60, 0.50, 0.18],
  ['indie pop',          0.55, 0.65, 0.20],
  ['indie',              0.52, 0.55, 0.22],
  ['soul',               0.55, 0.75, 0.18],
  ['gospel',             0.55, 0.82, 0.20],
  ['reggae',             0.52, 0.78, 0.22],
  ['country',            0.52, 0.68, 0.45],
  ['blues',              0.46, 0.40, 0.35],
  ['jazz',               0.42, 0.58, 0.38],
  ['bossa nova',         0.35, 0.72, 0.65],
  ['folk',               0.34, 0.62, 0.72],
  ['acoustic',           0.30, 0.60, 0.85],
  ['singer-songwriter',  0.28, 0.58, 0.80],
  ['americana',          0.40, 0.62, 0.60],
  ['bluegrass',          0.48, 0.65, 0.75],
  ['bedroom pop',        0.34, 0.66, 0.45],
  ['dream pop',          0.38, 0.62, 0.35],
  ['shoegaze',           0.45, 0.38, 0.22],
  ['post-rock',          0.42, 0.36, 0.20],
  ['slowcore',           0.22, 0.28, 0.40],
  ['lo-fi',              0.28, 0.55, 0.42],
  ['chillout',           0.25, 0.60, 0.38],
  ['downtempo',          0.26, 0.52, 0.30],
  ['ambient',            0.18, 0.52, 0.50],
  ['classical',          0.28, 0.55, 0.90],
  ['orchestra',          0.35, 0.52, 0.90],
  ['piano',              0.25, 0.55, 0.92],
  ['chamber',            0.22, 0.52, 0.92],
  ['new age',            0.18, 0.62, 0.55],
  ['dark',               0.42, 0.22, 0.15],
  ['doom',               0.40, 0.18, 0.10],
  ['gothic',             0.44, 0.22, 0.12],
  ['sad',                0.28, 0.20, 0.35],
  ['wave',               0.50, 0.35, 0.10],
]

function safeGenres(artists: SpotifyArtist[]): string[] {
  return artists
    .flatMap(a => Array.isArray(a.genres) ? a.genres : [])
    .filter((g): g is string => typeof g === 'string' && g.length > 0)
}

interface InferredFeatures {
  energy:       number
  valence:      number
  acousticness: number
  matchRate:    number
}

function inferFeaturesFromGenres(artists: SpotifyArtist[]): InferredFeatures {
  const allGenres = safeGenres(artists)
  if (allGenres.length === 0) {
    return { energy: 0.55, valence: 0.55, acousticness: 0.25, matchRate: 0 }
  }

  const energyVals:   number[] = []
  const valenceVals:  number[] = []
  const acousticVals: number[] = []
  let matched = 0

  for (const genre of allGenres) {
    const g = genre.toLowerCase()
    const hits = GENRE_SCORE_MAP.filter(([kw]) => g.includes(kw))
    if (hits.length > 0) {
      matched++
      energyVals.push(avg(hits.map(h => h[1])))
      valenceVals.push(avg(hits.map(h => h[2])))
      acousticVals.push(avg(hits.map(h => h[3])))
    }
  }

  if (energyVals.length === 0) {
    return { energy: 0.55, valence: 0.55, acousticness: 0.25, matchRate: 0 }
  }

  return {
    energy:       avg(energyVals),
    valence:      avg(valenceVals),
    acousticness: avg(acousticVals),
    matchRate:    matched / allGenres.length,
  }
}

// ─── Original four archetype scoring ─────────────────────────────────────────

function scoreHypeArchitect(
  avgPopularity: number, loyalty: number,
  genreEnergy: number, matchRate: number,
): number {
  const behavior = clamp(avgPopularity / 100) * 0.55 + clamp((60 - loyalty) / 60) * 0.45
  const genre = matchRate > 0.2 ? clamp((genreEnergy - 0.5) / 0.5) : 0
  return behavior * (1 - matchRate * 0.4) + genre * (matchRate * 0.4)
}

function scoreSoftLaunch(
  loyalty: number, avgPopularity: number,
  genreAcoustic: number, matchRate: number,
): number {
  const behavior = clamp(loyalty / 100) * 0.60 + clamp((75 - Math.abs(avgPopularity - 55)) / 75) * 0.40
  const genre = matchRate > 0.2 ? clamp(genreAcoustic / 0.7) : 0
  return behavior * (1 - matchRate * 0.35) + genre * (matchRate * 0.35)
}

function scoreLateNightDriver(
  lateNightRatio: number, loyalty: number, avgPopularity: number,
  genreValence: number, matchRate: number,
): number {
  const lateNight = clamp(lateNightRatio / 0.3) * 0.50
  const behavior  = clamp((70 - Math.abs(loyalty - 45)) / 70) * 0.25 +
                    clamp((80 - Math.abs(avgPopularity - 45)) / 80) * 0.25
  const genre = matchRate > 0.2 ? clamp((0.65 - genreValence) / 0.5) : 0
  return (lateNight + behavior) * (1 - matchRate * 0.3) + genre * (matchRate * 0.3)
}

function scoreTheStatic(
  loyalty: number, avgPopularity: number,
  trackNoveltyRatio: number,
  genreEntropy: number, totalGenres: number, matchRate: number,
): number {
  const behavior = clamp((50 - loyalty) / 50) * 0.40 +
                   clamp(trackNoveltyRatio)    * 0.35 +
                   clamp((65 - avgPopularity) / 65) * 0.25
  const genre = matchRate > 0.2
    ? clamp(genreEntropy / 4.5) * 0.5 + clamp(totalGenres / 25) * 0.5
    : 0
  return behavior * (1 - matchRate * 0.45) + genre * (matchRate * 0.45)
}

// ─── New four archetype scoring ───────────────────────────────────────────────

// Completionist: extreme loyalty + near-zero track novelty, genre-agnostic depth
function scoreCompletionist(
  loyalty: number,
  trackNoveltyRatio: number,
  avgPopularity: number,
): number {
  const loyaltyScore   = clamp(loyalty / 100)
  const stabilityScore = clamp(1 - trackNoveltyRatio * 5)  // strongly penalises novelty > 0.2
  const underground    = clamp((70 - avgPopularity) / 70)
  return loyaltyScore * 0.55 + stabilityScore * 0.35 + underground * 0.10
}

// Signal: low popularity + moderate genre cohesion (underground but not chaotic)
function scoreSignal(
  avgPopularity: number,
  genreEntropy:  number,
  trackNoveltyRatio: number,
  matchRate: number,
): number {
  const underground = clamp((45 - avgPopularity) / 45)
  const cohesion    = matchRate > 0.2 ? clamp((3.5 - genreEntropy) / 3.5) : 0.35
  const stability   = clamp(1 - trackNoveltyRatio)
  return underground * 0.55 + cohesion * 0.30 + stability * 0.15
}

// Mainframe: high popularity + focused genre taste (calibrated to the cultural moment)
function scoreMainframe(
  avgPopularity: number,
  genreEntropy:  number,
  trackNoveltyRatio: number,
  matchRate: number,
): number {
  const mainstream = clamp((avgPopularity - 50) / 50)
  const focused    = matchRate > 0.2 ? clamp((3.0 - genreEntropy) / 3.0) : 0
  const stability  = clamp(1 - trackNoveltyRatio)
  return mainstream * 0.55 + focused * 0.30 + stability * 0.15
}

// Time Capsule: same artists persist from short-term all the way to long-term
function scoreTimeCapsule(
  loyalty: number,
  longShortArtistOverlap: number,
  trackNoveltyRatio: number,
): number {
  const persistence  = clamp(longShortArtistOverlap * 3)  // 0.33 overlap → score 1.0
  const loyaltyBoost = clamp(loyalty / 100)
  const stability    = clamp(1 - trackNoveltyRatio)
  return persistence * 0.55 + loyaltyBoost * 0.25 + stability * 0.20
}

// ─── Listener profile ─────────────────────────────────────────────────────────

export function computeListenerProfile(
  shortTracks:  { id: string; popularity: number }[],
  mediumTracks: { id: string; popularity: number }[],
  longTracks:   { id: string; popularity: number }[],
  topArtists:   SpotifyArtist[],
): ListenerProfile {
  const artistPopAvg = avg(topArtists.map(a => a.popularity))
  const trackPopAvg  = avg(mediumTracks.map(t => t.popularity))
  const discovery    = clamp100(100 - (artistPopAvg * 0.6 + trackPopAvg * 0.4))

  const shortIds = new Set(shortTracks.map(t => t.id))
  const longIds  = new Set(longTracks.map(t => t.id))
  const intersection = [...shortIds].filter(id => longIds.has(id)).length
  const union        = new Set([...shortIds, ...longIds]).size
  const loyalty      = clamp100(union > 0 ? (intersection / union) * 100 * 3.5 : 50)

  const allGenres      = new Set(safeGenres(topArtists))
  const emotionalRange = clamp100(Math.min(allGenres.size * 3.5, 99))

  const inferred  = inferFeaturesFromGenres(topArtists)
  const intensity = clamp100((inferred.energy * 0.6 + (1 - artistPopAvg / 100) * 0.4) * 100)

  return { discovery, loyalty, emotionalRange, intensity }
}

// ─── Drift detection ──────────────────────────────────────────────────────────

export function detectDrift(
  shortTracks:  { id: string; popularity: number; artists: { id: string; name: string }[] }[],
  mediumTracks: { id: string; popularity: number; artists: { id: string; name: string }[] }[],
): DriftSignal {
  if (shortTracks.length < 5 || mediumTracks.length < 5) {
    return { detected: false, direction: null, weeksAgo: 4, valenceDelta: 0, energyDelta: 0, line: '' }
  }

  const shortPop  = avg(shortTracks.map(t => t.popularity))
  const mediumPop = avg(mediumTracks.map(t => t.popularity))
  const popDelta  = shortPop - mediumPop

  const medArtistIds   = new Set(mediumTracks.flatMap(t => t.artists.map(a => a.id)))
  const newArtistCount = shortTracks.filter(t => t.artists.some(a => !medArtistIds.has(a.id))).length
  const noveltyRatio   = newArtistCount / shortTracks.length

  const detected = Math.abs(popDelta) > 8 && noveltyRatio > 0.35

  if (!detected) {
    return { detected: false, direction: null, weeksAgo: 4, valenceDelta: popDelta / 100, energyDelta: noveltyRatio, line: '' }
  }

  let direction: DriftSignal['direction'] = null
  let line = ''

  if (popDelta > 8 && noveltyRatio > 0.35) {
    direction = 'lighter'
    line = `Something shifted about 4 weeks ago. You're reaching toward bigger, more familiar names than usual.`
  } else if (popDelta < -8 && noveltyRatio > 0.35) {
    direction = 'darker'
    line = `Your recent listening is pulling away from the mainstream. New artists, lower profile. The data notices.`
  } else if (noveltyRatio > 0.4) {
    direction = 'energised'
    line = `You've added more new artists in the last month than the 5 months before combined.`
  } else {
    direction = 'quieter'
    line = `You've been returning to familiar names lately — fewer new discoveries, more depth on what you know.`
  }

  return { detected: true, direction, weeksAgo: 4, valenceDelta: popDelta / 100, energyDelta: noveltyRatio, line }
}

// ─── Late-night ratio ─────────────────────────────────────────────────────────

export function computeLateNightRatio(recentItems: { played_at: string }[]): number {
  if (recentItems.length === 0) return 0
  const lateNight = recentItems.filter(item => {
    const hour = new Date(item.played_at).getHours()
    return hour >= 22 || hour < 3
  })
  return lateNight.length / recentItems.length
}

// ─── Main classify ────────────────────────────────────────────────────────────

export function classify(
  topArtists:     SpotifyArtist[],
  shortTracks:    { id: string; name: string; popularity: number; artists: { id: string; name: string }[] }[],
  mediumTracks:   { id: string; name: string; popularity: number; artists: { id: string; name: string }[] }[],
  longTracks:     { id: string; name: string; popularity: number; artists: { id: string; name: string }[] }[],
  lateNightRatio: number,
  skipRate = 0,   // fraction of plays that ended with a skip; 0 when unavailable (Spotify API path)
): ScoringResult {
  const inferred     = inferFeaturesFromGenres(topArtists)
  const genreCounts  = extractGenreCounts(topArtists)
  const genreEntropy = shannonEntropy(genreCounts)
  const totalGenres  = genreCounts.length
  const avgPopularity = avg(topArtists.map(a => a.popularity))

  const listenerProfile = computeListenerProfile(shortTracks, mediumTracks, longTracks, topArtists)

  // Track novelty: fraction of short-term artists absent from medium-term
  const medArtistIds      = new Set(mediumTracks.flatMap(t => t.artists.map(a => a.id)))
  const trackNoveltyRatio = shortTracks.length > 0
    ? shortTracks.filter(t => t.artists.some(a => !medArtistIds.has(a.id))).length / shortTracks.length
    : 0

  // Long-short artist overlap: how many short-term artists also appear in long-term
  const longArtistIds          = new Set(longTracks.flatMap(t => t.artists.map(a => a.id)))
  const shortArtistList        = shortTracks.flatMap(t => t.artists.map(a => a.id))
  const longShortArtistOverlap = shortArtistList.length > 0
    ? shortArtistList.filter(id => longArtistIds.has(id)).length / shortArtistList.length
    : 0

  const signals = {
    highGenreEntropy: genreEntropy > 3.5,
    lateNight:        lateNightRatio > 0.25,
    highSkip:         skipRate > 0.30,
  }

  const mr = inferred.matchRate

  const typeScores: Record<ArchetypeKey, number> = {
    'hype-architect':    scoreHypeArchitect(avgPopularity, listenerProfile.loyalty, inferred.energy, mr),
    'soft-launch':       scoreSoftLaunch(listenerProfile.loyalty, avgPopularity, inferred.acousticness, mr),
    'late-night-driver': scoreLateNightDriver(lateNightRatio, listenerProfile.loyalty, avgPopularity, inferred.valence, mr),
    'the-static':        scoreTheStatic(listenerProfile.loyalty, avgPopularity, trackNoveltyRatio, genreEntropy, totalGenres, mr),
    'the-completionist': scoreCompletionist(listenerProfile.loyalty, trackNoveltyRatio, avgPopularity),
    'the-signal':        scoreSignal(avgPopularity, genreEntropy, trackNoveltyRatio, mr),
    'the-mainframe':     scoreMainframe(avgPopularity, genreEntropy, trackNoveltyRatio, mr),
    'the-time-capsule':  scoreTimeCapsule(listenerProfile.loyalty, longShortArtistOverlap, trackNoveltyRatio),
  }

  const ranked = (Object.entries(typeScores) as [ArchetypeKey, number][])
    .sort(([, a], [, b]) => b - a)

  const archetype       = ranked[0][0]
  const shadowArchetype = ranked[1][0]

  const listenerDNA = computeListenerDNA(
    lateNightRatio,
    listenerProfile.loyalty,
    trackNoveltyRatio,
    listenerProfile.discovery,
    listenerProfile.intensity,
    inferred.acousticness,
  )

  const topArtistNames = topArtists.slice(0, 5).map(a => a.name)
  const genreFreq: Record<string, number> = {}
  for (const genre of safeGenres(topArtists)) {
    genreFreq[genre] = (genreFreq[genre] ?? 0) + 1
  }
  const topGenres = Object.entries(genreFreq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([g]) => g)

  const waveformTracks  = mediumTracks.slice(0, 24)
  const waveformValence = waveformTracks.map(t => clamp(t.popularity / 100 * 0.6 + inferred.valence * 0.4))
  const waveformEnergy  = waveformTracks.map((_, i) =>
    clamp(inferred.energy * 0.7 + Math.sin(i * 0.8) * 0.15 + 0.15)
  )

  return {
    archetype,
    shadowArchetype,
    scores: {
      energyAvg:    inferred.energy,
      valenceAvg:   inferred.valence,
      acousticAvg:  inferred.acousticness,
      genreEntropy,
      matchRate:    inferred.matchRate,
    },
    signals,
    listenerProfile,
    listenerDNA,
    drift: detectDrift(shortTracks, mediumTracks),
    dataHighlight: {
      genres:       totalGenres,
      energyPct:    Math.round(inferred.energy * 100),
      loyaltyPct:   listenerProfile.loyalty,
      lateNightPct: Math.round(lateNightRatio * 100),
    },
    waveformData: {
      valence: waveformValence,
      energy:  waveformEnergy,
    },
    topArtistNames,
    topGenres,
  }
}
