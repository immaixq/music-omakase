import { NextRequest, NextResponse } from 'next/server'
import { getMockResult } from '@/lib/mock'
import { getTopTracks, getAudioFeatures, getTopArtists, getMe } from '@/lib/spotify'
import { classify, type AudioFeature, type SpotifyArtist } from '@/lib/scoring'
import { getConfessionLine, archetypes } from '@/lib/archetypes'
import { SHADOW_LINES } from '@/lib/shadowLines'

export async function POST(req: NextRequest) {
  const body   = await req.json().catch(() => ({}))
  const token  = typeof body.token  === 'string' ? body.token  : null
  const handle = typeof body.handle === 'string' ? body.handle : 'you'

  // Demo mode — no Spotify token
  if (!token) return NextResponse.json(getMockResult(handle))

  try {
    const [me, mediumTracks, shortTracks, topArtists] = await Promise.all([
      getMe(token),
      getTopTracks(token, 'medium_term'),
      getTopTracks(token, 'short_term'),
      getTopArtists(token),
    ])

    // Deduplicate tracks
    const trackMap = new Map<string, (typeof mediumTracks)[0]>()
    for (const t of [...mediumTracks, ...shortTracks]) trackMap.set(t.id, t)
    const allTracks = Array.from(trackMap.values())

    const rawFeatures = await getAudioFeatures(token, allTracks.map(t => t.id))

    const features: AudioFeature[] = rawFeatures.map(f => ({
      id: f.id, energy: f.energy, valence: f.valence,
      acousticness: f.acousticness, instrumentalness: f.instrumentalness,
      tempo: f.tempo, speechiness: f.speechiness, danceability: f.danceability,
    }))

    const artists: SpotifyArtist[] = topArtists.map(a => ({
      id: a.id, name: a.name, genres: a.genres,
    }))

    const result        = classify(features, artists)
    const confessionLine = getConfessionLine(result.archetype, result.signals)
    const shadowLine    = SHADOW_LINES[result.shadowArchetype]
    const archetype     = archetypes[result.archetype]
    const highlight     = buildHighlight(archetype.dataHighlightTemplate, result.dataHighlight)
    const displayHandle = me.display_name || handle

    return NextResponse.json({
      archetype:       result.archetype,
      shadowArchetype: result.shadowArchetype,
      confessionLine,
      shadowLine,
      highlight,
      handle: displayHandle,
    })
  } catch (err) {
    console.error('[analyze]', err)
    // Fall back to demo rather than crashing
    return NextResponse.json(getMockResult(handle))
  }
}

function buildHighlight(
  template: string,
  data: { bpm: number; genres: number; energyPct: number; variancePct: number }
): string {
  const pct = Math.min(99, Math.max(50, Math.round(data.energyPct * 1.1)))
  return template
    .replace('{bpm}',    String(data.bpm))
    .replace('{genres}', String(data.genres))
    .replace('{pct}',    String(pct))
    .replace('{count}',  String(Math.max(3, Math.round(data.genres * 0.2))))
}
