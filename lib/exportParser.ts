import { unzipSync } from 'fflate'

// ─── Raw entry shape from Spotify's StreamingHistory_music_*.json ─────────────

interface RawEntry {
  ts:                                    string
  ms_played:                             number
  master_metadata_track_name:            string | null
  master_metadata_album_artist_name:     string | null
  reason_end:                            string | null
  shuffle:                               boolean | null
  skipped:                               boolean | null
}

// ─── Normalised shapes matching what classify() expects ──────────────────────

export interface ExportArtist {
  id:         string
  name:       string
  genres:     string[]   // empty — inferred by scoring from GENRE_SCORE_MAP name matching
  popularity: number     // synthetic 50 — global popularity unknown from export alone
}

export interface ExportTrack {
  id:         string
  name:       string
  popularity: number
  artists:    { id: string; name: string }[]
}

export interface ExportPayload {
  artists:      ExportArtist[]    // top artists by play count, all-time
  shortTracks:  ExportTrack[]     // last 4 weeks
  mediumTracks: ExportTrack[]     // last 6 months
  longTracks:   ExportTrack[]     // all available history
  recentPlays:  { played_at: string }[]  // for late-night ratio (last 200)
  skipRate:     number            // 0–1, fraction of qualifying plays that were skipped
  totalHours:   number
  historyDays:  number            // how many days of history the export covers
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

function buildTracks(
  entries: RawEntry[],
  after:   Date,
): ExportTrack[] {
  const playCount: Record<string, { track: ExportTrack; count: number }> = {}

  for (const e of entries) {
    if (!e.master_metadata_track_name || !e.master_metadata_album_artist_name) continue
    const ts = new Date(e.ts)
    if (ts < after) continue

    const artistId  = slugify(e.master_metadata_album_artist_name)
    const trackKey  = `${slugify(e.master_metadata_track_name)}-${artistId}`

    if (!playCount[trackKey]) {
      playCount[trackKey] = {
        track: {
          id:       trackKey,
          name:     e.master_metadata_track_name,
          popularity: 50,
          artists:  [{ id: artistId, name: e.master_metadata_album_artist_name }],
        },
        count: 0,
      }
    }
    playCount[trackKey].count++
  }

  // Sort by play count, assign synthetic popularity by rank
  const sorted = Object.values(playCount).sort((a, b) => b.count - a.count)
  const total  = sorted.length

  return sorted.slice(0, 50).map(({ track }, i) => ({
    ...track,
    // Top rank ≈ 70 popularity, bottom ≈ 20 — a rough mainstream proxy by user play rank
    popularity: Math.round(70 - (i / Math.max(total - 1, 1)) * 50),
  }))
}

// ─── Main parser ──────────────────────────────────────────────────────────────

export class ExportParseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ExportParseError'
  }
}

export async function parseSpotifyExport(file: File): Promise<ExportPayload> {
  // Read ZIP
  const buffer = await file.arrayBuffer()
  let unzipped: ReturnType<typeof unzipSync>

  try {
    unzipped = unzipSync(new Uint8Array(buffer))
  } catch {
    throw new ExportParseError(
      'Could not read ZIP file. Make sure you\'re uploading the file Spotify sent you, not an extracted folder.'
    )
  }

  // Find all StreamingHistory_music_*.json files (may be nested in a subfolder)
  const historyFiles = Object.entries(unzipped).filter(
    ([name]) => /StreamingHistory_music_\d+\.json$/i.test(name)
  )

  if (historyFiles.length === 0) {
    throw new ExportParseError(
      'No streaming history found in this ZIP. Make sure you requested "Extended streaming history" from Spotify — not "Account data".'
    )
  }

  // Decode and merge all history files
  const allEntries: RawEntry[] = []
  for (const [, bytes] of historyFiles) {
    try {
      const text    = new TextDecoder('utf-8').decode(bytes)
      const parsed  = JSON.parse(text) as RawEntry[]
      allEntries.push(...parsed)
    } catch {
      // Skip malformed files rather than failing entirely
      continue
    }
  }

  // Filter: must have artist name + at least 30 seconds played
  const MIN_MS = 30_000
  const qualifying = allEntries.filter(
    e => e.master_metadata_album_artist_name !== null &&
         e.master_metadata_track_name !== null &&
         e.ms_played >= MIN_MS
  )

  if (qualifying.length < 20) {
    throw new ExportParseError(
      'Not enough listening history found. Your export may be empty or only contain podcast/non-music data.'
    )
  }

  // Sort chronologically
  qualifying.sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime())

  const earliest    = new Date(qualifying[0].ts)
  const latest      = new Date(qualifying[qualifying.length - 1].ts)
  const historyDays = Math.round((latest.getTime() - earliest.getTime()) / (1000 * 60 * 60 * 24))
  const totalHours  = Math.round(qualifying.reduce((s, e) => s + e.ms_played, 0) / 3_600_000)

  // Skip rate — entries where reason_end is "fwdbtn" (forward button = user skipped)
  const skipped  = qualifying.filter(e => e.reason_end === 'fwdbtn').length
  const skipRate = qualifying.length > 0 ? skipped / qualifying.length : 0

  // Time windows
  const shortAfter  = daysAgo(28)
  const mediumAfter = daysAgo(180)

  // Build top artists (all-time) by play count
  const artistPlayCount: Record<string, { name: string; count: number }> = {}
  for (const e of qualifying) {
    const name = e.master_metadata_album_artist_name!
    const id   = slugify(name)
    if (!artistPlayCount[id]) artistPlayCount[id] = { name, count: 0 }
    artistPlayCount[id].count++
  }

  const sortedArtists = Object.entries(artistPlayCount)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 50)

  const artists: ExportArtist[] = sortedArtists.map(([id, { name }]) => ({
    id,
    name,
    genres:     [],   // enrichment via GENRE_SCORE_MAP name matching happens in scoring
    popularity: 50,   // global popularity unknown from export; neutral so behavior signals dominate
  }))

  // Build track lists per time window
  const longTracks   = buildTracks(qualifying, new Date(0))
  const mediumTracks = buildTracks(qualifying, mediumAfter)
  const shortTracks  = buildTracks(qualifying, shortAfter)

  // Recent plays for late-night ratio (last 200 qualifying entries)
  const recentPlays = qualifying
    .slice(-200)
    .map(e => ({ played_at: e.ts }))

  return {
    artists,
    shortTracks,
    mediumTracks,
    longTracks,
    recentPlays,
    skipRate,
    totalHours,
    historyDays,
  }
}
