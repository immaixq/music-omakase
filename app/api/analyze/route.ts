import { NextRequest, NextResponse } from 'next/server'
import { getMockResult } from '@/lib/mock'
import { getTopTracks, getTopArtists, getMe, getRecentlyPlayed } from '@/lib/spotify'
import {
  classify, computeLateNightRatio,
  type SpotifyArtist,
} from '@/lib/scoring'
import { getConfessionLine, archetypes } from '@/lib/archetypes'
import { SHADOW_LINES } from '@/lib/shadowLines'
import { selectLetter } from '@/lib/letter'
import { computeCurrentState } from '@/lib/currentState'

export async function POST(req: NextRequest) {
  const body   = await req.json().catch(() => ({}))
  const token  = typeof body.token  === 'string' ? body.token  : null
  const handle = typeof body.handle === 'string' ? body.handle : 'you'

  if (!token) return NextResponse.json(getMockResult(handle))

  try {
    const [me, shortTracks, mediumTracks, longTracks, topArtists, recentlyPlayed] =
      await Promise.all([
        getMe(token),
        getTopTracks(token, 'short_term'),
        getTopTracks(token, 'medium_term'),
        getTopTracks(token, 'long_term'),
        getTopArtists(token),
        getRecentlyPlayed(token),
      ])

    const artists: SpotifyArtist[] = topArtists.map(a => ({
      id: a.id, name: a.name, genres: a.genres, popularity: a.popularity,
    }))

    const lateNightRatio = computeLateNightRatio(recentlyPlayed)

    const result = classify(
      artists,
      shortTracks,
      mediumTracks,
      longTracks,
      lateNightRatio,
    )

    const confessionLine = getConfessionLine(result.archetype, result.signals)
    const shadowLine     = SHADOW_LINES[result.shadowArchetype]
    const archetype      = archetypes[result.archetype]
    const highlight      = buildHighlight(archetype.dataHighlightTemplate, result.dataHighlight)
    const displayHandle  = me.display_name || handle

    const letter = selectLetter({
      archetype:       result.archetype,
      valenceAvg:      result.scores.valenceAvg,
      listenerProfile: result.listenerProfile,
      drift:           result.drift,
      genreCount:      result.dataHighlight.genres,
      lateNight:       result.signals.lateNight,
      handle:          displayHandle,
    })

    // BPM not available without audio features — omit placeholder
    const letterFilled = letter.map(p =>
      p.replace('{BPM}', result.topGenres[0] ?? 'your top genres')
    ) as [string, string, string]

    // currentState: derive from genre-inferred features as a proxy for short/medium features
    const proxyFeatures = [{
      id: 'proxy',
      energy: result.scores.energyAvg,
      valence: result.scores.valenceAvg,
      acousticness: result.scores.acousticAvg,
      instrumentalness: 0,
      tempo: 0,
      speechiness: 0,
      danceability: 0,
    }]
    // Short-term proxy: slightly shift based on recent vs medium popularity delta
    const shortPopAvg  = shortTracks.length  ? shortTracks.reduce((s, t)  => s + t.popularity, 0) / shortTracks.length  : 50
    const mediumPopAvg = mediumTracks.length ? mediumTracks.reduce((s, t) => s + t.popularity, 0) / mediumTracks.length : 50
    const popRatio = (shortPopAvg - mediumPopAvg) / 100  // small delta, [-0.5, 0.5]
    const shortProxy = [{ ...proxyFeatures[0], valence: Math.max(0, Math.min(1, result.scores.valenceAvg + popRatio * 0.3)) }]

    const currentState = computeCurrentState(shortProxy, proxyFeatures)

    return NextResponse.json({
      archetype:       result.archetype,
      shadowArchetype: result.shadowArchetype,
      confessionLine,
      shadowLine,
      highlight,
      handle:          displayHandle,
      listenerProfile: result.listenerProfile,
      drift:           result.drift,
      letter:          letterFilled,
      waveformData:    result.waveformData,
      currentState,
      topArtistNames:  result.topArtistNames,
      topGenres:       result.topGenres,
    })
  } catch (err) {
    console.error('[analyze]', err)
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
