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
  topArtistNames: string[]
  topGenres:      string[]
}

// ─── Math helpers ─────────────────────────────────────────────────────────────

function avg(arr: number[]): number {
  if (arr.length === 0) return 0
  return arr.reduce((s, v) => s + v, 0) / arr.length
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
// Since Spotify deprecated audio features for new apps, we infer energy/valence
// from genre keywords. Each genre is matched against keyword lists and contributes
// a score in [0, 1]. The final values are the weighted average across all genres.

const ENERGY_HIGH = ['edm','electronic','dance','house','techno','drum and bass','metal','punk',
  'hip hop','rap','trap','dubstep','hardstyle','rave','club','bass','electro','industrial']
const ENERGY_LOW  = ['ambient','acoustic','classical','folk','bossa nova','chamber','meditation',
  'sleep','piano','instrumental','new age','drone','lo-fi','chillout','downtempo']
const VALENCE_HIGH = ['pop','dance','disco','funk','soul','reggae','latin','samba','tropical',
  'happy','party','feel-good','upbeat','afrobeat','sunshine']
const VALENCE_LOW  = ['emo','post-punk','gothic','doom','black metal','dark','melancholic',
  'sad','shoegaze','slowcore','post-rock','cold wave','darkwave','funeral']
const ACOUSTIC_HIGH = ['acoustic','folk','singer-songwriter','country','bluegrass','americana',
  'fingerstyle','classical','flamenco','bossa nova','unplugged']

function safeGenres(artists: SpotifyArtist[]): string[] {
  return artists
    .flatMap(a => Array.isArray(a.genres) ? a.genres : [])
    .filter((g): g is string => typeof g === 'string' && g.length > 0)
}

function genreMatchScore(genre: string, keywords: string[]): number {
  const g = genre.toLowerCase()
  return keywords.some(k => g.includes(k)) ? 1 : 0
}

interface InferredFeatures {
  energy:       number  // 0–1
  valence:      number  // 0–1
  acousticness: number  // 0–1
}

function inferFeaturesFromGenres(artists: SpotifyArtist[]): InferredFeatures {
  const allGenres = safeGenres(artists)
  if (allGenres.length === 0) return { energy: 0.5, valence: 0.5, acousticness: 0.3 }

  const energyScores  = allGenres.map(g => {
    const hi = genreMatchScore(g, ENERGY_HIGH)
    const lo = genreMatchScore(g, ENERGY_LOW)
    return hi ? 0.8 : lo ? 0.2 : 0.5  // unmatched → neutral
  })
  const valenceScores = allGenres.map(g => {
    const hi = genreMatchScore(g, VALENCE_HIGH)
    const lo = genreMatchScore(g, VALENCE_LOW)
    return hi ? 0.8 : lo ? 0.25 : 0.5
  })
  const acousticScores = allGenres.map(g => genreMatchScore(g, ACOUSTIC_HIGH) ? 0.8 : 0.2)

  return {
    energy:       avg(energyScores),
    valence:      avg(valenceScores),
    acousticness: avg(acousticScores),
  }
}

// ─── Archetype scoring ────────────────────────────────────────────────────────

function scoreHypeArchitect(energy: number, acoustic: number, avgPopularity: number): number {
  // High energy + low acoustic + mainstream popularity (hype needs an audience)
  return (
    clamp((energy - 0.45) / 0.4)   * 0.45 +
    clamp((0.4 - acoustic) / 0.4)  * 0.30 +
    clamp(avgPopularity / 80)       * 0.25
  )
}

function scoreSoftLaunch(acoustic: number, genreEntropy: number, loyalty: number): number {
  // High acoustic + narrow genre range + returning to same artists
  return (
    clamp(acoustic / 0.6)              * 0.40 +
    clamp((3.0 - genreEntropy) / 3.0)  * 0.35 +
    clamp(loyalty / 80)                * 0.25
  )
}

function scoreLateNightDriver(
  valence: number, energy: number,
  lateNightRatio: number, genreEntropy: number
): number {
  // Mid-low valence + moderate energy + late night listening + some genre spread
  const moodMix = clamp((0.6 - valence) / 0.4) * 0.3 + clamp((energy - 0.35) / 0.4) * 0.2
  const lateNight = clamp(lateNightRatio / 0.25) * 0.35
  const breadth   = clamp(genreEntropy / 4.0) * 0.15
  return moodMix + lateNight + breadth
}

function scoreTheStatic(genreEntropy: number, totalGenres: number, avgPopularity: number): number {
  // Primary: raw genre count + entropy; secondary: low popularity (obscure taste)
  return (
    clamp(genreEntropy / 4.5)    * 0.45 +
    clamp(totalGenres / 25)      * 0.35 +
    clamp((60 - avgPopularity) / 60) * 0.20
  )
}

// ─── Listener profile ─────────────────────────────────────────────────────────

export function computeListenerProfile(
  shortTracks:  { id: string; popularity: number }[],
  mediumTracks: { id: string; popularity: number }[],
  longTracks:   { id: string; popularity: number }[],
  topArtists:   SpotifyArtist[],
): ListenerProfile {
  // Discovery — inverse of average popularity
  const artistPopAvg = avg(topArtists.map(a => a.popularity))
  const trackPopAvg  = avg(mediumTracks.map(t => t.popularity))
  const discovery    = clamp100(100 - (artistPopAvg * 0.6 + trackPopAvg * 0.4))

  // Loyalty — Jaccard overlap between short-term and long-term track ids
  const shortIds = new Set(shortTracks.map(t => t.id))
  const longIds  = new Set(longTracks.map(t => t.id))
  const intersection = [...shortIds].filter(id => longIds.has(id)).length
  const union        = new Set([...shortIds, ...longIds]).size
  const loyalty      = clamp100(union > 0 ? (intersection / union) * 100 * 3.5 : 50)

  // Emotional range — genre diversity as a proxy (more genres = wider palette)
  const allGenres = new Set(safeGenres(topArtists))
  const emotionalRange = clamp100(Math.min(allGenres.size * 3.5, 99))

  // Intensity — popularity inversion + genre energy score
  const inferred = inferFeaturesFromGenres(topArtists)
  const intensity = clamp100((inferred.energy * 0.6 + (1 - artistPopAvg / 100) * 0.4) * 100)

  return { discovery, loyalty, emotionalRange, intensity }
}

// ─── Drift detection (genre-based) ───────────────────────────────────────────
// Compare short-term vs medium-term top tracks by popularity + artist overlap

export function detectDrift(
  shortTracks:  { id: string; popularity: number; artists: { id: string; name: string }[] }[],
  mediumTracks: { id: string; popularity: number; artists: { id: string; name: string }[] }[],
): DriftSignal {
  if (shortTracks.length < 5 || mediumTracks.length < 5) {
    return { detected: false, direction: null, weeksAgo: 4, valenceDelta: 0, energyDelta: 0, line: '' }
  }

  const shortPop  = avg(shortTracks.map(t => t.popularity))
  const mediumPop = avg(mediumTracks.map(t => t.popularity))
  const popDelta  = shortPop - mediumPop  // positive = trending more mainstream recently

  // Artist novelty: how many short-term artists aren't in medium-term
  const medArtistIds = new Set(mediumTracks.flatMap(t => t.artists.map(a => a.id)))
  const newArtistCount = shortTracks.filter(t => t.artists.some(a => !medArtistIds.has(a.id))).length
  const noveltyRatio = newArtistCount / shortTracks.length

  const popShift    = Math.abs(popDelta) > 8
  const artistShift = noveltyRatio > 0.35

  const detected = popShift && artistShift

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

  return {
    detected: true,
    direction,
    weeksAgo:     4,
    valenceDelta: popDelta / 100,
    energyDelta:  noveltyRatio,
    line,
  }
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
): ScoringResult {
  const inferred      = inferFeaturesFromGenres(topArtists)
  const genreCounts   = extractGenreCounts(topArtists)
  const genreEntropy  = shannonEntropy(genreCounts)
  const totalGenres   = genreCounts.length
  const avgPopularity = avg(topArtists.map(a => a.popularity))

  const listenerProfile = computeListenerProfile(shortTracks, mediumTracks, longTracks, topArtists)

  const signals = {
    highGenreEntropy: genreEntropy > 3.5,
    lateNight:        lateNightRatio > 0.25,
    highSkip:         false,
  }

  // Score all four archetypes
  const typeScores: Record<ArchetypeKey, number> = {
    'hype-architect':    scoreHypeArchitect(inferred.energy, inferred.acousticness, avgPopularity),
    'soft-launch':       scoreSoftLaunch(inferred.acousticness, genreEntropy, listenerProfile.loyalty),
    'late-night-driver': scoreLateNightDriver(inferred.valence, inferred.energy, lateNightRatio, genreEntropy),
    'the-static':        scoreTheStatic(genreEntropy, totalGenres, avgPopularity),
  }

  const ranked = (Object.entries(typeScores) as [ArchetypeKey, number][])
    .sort(([, a], [, b]) => b - a)

  let archetype       = ranked[0][0]
  let shadowArchetype = ranked[1][0]

  // Stable tiebreak when top two are very close (prevents noise flips)
  const margin = ranked[0][1] - ranked[1][1]
  if (margin < 0.05) {
    if (
      (archetype === 'late-night-driver' || archetype === 'the-static') &&
      (shadowArchetype === 'late-night-driver' || shadowArchetype === 'the-static')
    ) {
      archetype       = genreEntropy > 3.8 ? 'the-static' : 'late-night-driver'
      shadowArchetype = genreEntropy > 3.8 ? 'late-night-driver' : 'the-static'
    }
  }

  // Top artist names + top genres
  const topArtistNames = topArtists.slice(0, 5).map(a => a.name)
  const genreFreq: Record<string, number> = {}
  for (const genre of safeGenres(topArtists)) {
    genreFreq[genre] = (genreFreq[genre] ?? 0) + 1
  }
  const topGenres = Object.entries(genreFreq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([g]) => g)

  // Waveform — use popularity curve of medium-term tracks as a proxy for mood variation
  const waveformTracks = mediumTracks.slice(0, 24)
  const waveformValence = waveformTracks.map(t => clamp(t.popularity / 100 * 0.6 + inferred.valence * 0.4))
  const waveformEnergy  = waveformTracks.map((_, i) =>
    clamp(inferred.energy * 0.7 + Math.sin(i * 0.8) * 0.15 + 0.15)
  )

  return {
    archetype,
    shadowArchetype,
    scores: {
      energyAvg:       inferred.energy,
      valenceAvg:      inferred.valence,
      valenceVariance: 0,  // not computable without audio features
      acousticAvg:     inferred.acousticness,
      bpmAvg:          0,
      genreEntropy,
    },
    signals,
    listenerProfile,
    drift: detectDrift(shortTracks, mediumTracks),
    dataHighlight: {
      bpm:         0,
      genres:      totalGenres,
      energyPct:   Math.round(inferred.energy * 100),
      variancePct: 0,
    },
    waveformData: {
      valence: waveformValence,
      energy:  waveformEnergy,
    },
    topArtistNames,
    topGenres,
  }
}
