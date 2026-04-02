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
import type { ExportPayload } from '@/lib/exportParser'

export async function POST(req: NextRequest) {
  const body        = await req.json().catch(() => ({}))
  const token       = typeof body.token  === 'string' ? body.token  : null
  const handle      = typeof body.handle === 'string' ? body.handle : 'you'
  const exportData  = body.exportData as ExportPayload | undefined

  if (exportData) return NextResponse.json(await analyseExport(exportData, handle))
  if (!token)     return NextResponse.json(getMockResult(handle))

  try {
    const [me, shortTracks, mediumTracks, longTracks, topArtists, recentlyPlayed] =
      await Promise.all([
        getMe(token).catch(e => { throw new Error(`getMe: ${e.message}`) }),
        getTopTracks(token, 'short_term').catch(e => { throw new Error(`top_tracks_short: ${e.message}`) }),
        getTopTracks(token, 'medium_term').catch(e => { throw new Error(`top_tracks_medium: ${e.message}`) }),
        getTopTracks(token, 'long_term').catch(e => { throw new Error(`top_tracks_long: ${e.message}`) }),
        getTopArtists(token).catch(e => { throw new Error(`top_artists: ${e.message}`) }),
        getRecentlyPlayed(token).catch(e => { throw new Error(`recently_played: ${e.message}`) }),
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
      lateNightPct:    result.dataHighlight.lateNightPct,
    })

    const letterFilled = letter.map(p =>
      p.replace('{BPM}', '—')
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
    // Use filter to guard against tracks with undefined popularity
    const safeNum = (v: unknown) => typeof v === 'number' && isFinite(v) ? v : null
    const shortPops  = shortTracks.map(t => safeNum(t.popularity)).filter((v): v is number => v !== null)
    const mediumPops = mediumTracks.map(t => safeNum(t.popularity)).filter((v): v is number => v !== null)
    const shortPopAvg  = shortPops.length  ? shortPops.reduce((s, v)  => s + v, 0) / shortPops.length  : 50
    const mediumPopAvg = mediumPops.length ? mediumPops.reduce((s, v) => s + v, 0) / mediumPops.length : 50
    const popRatio = (shortPopAvg - mediumPopAvg) / 100

    const baseValence = safeNum(result.scores.valenceAvg) ?? 0.55
    const baseEnergy  = safeNum(result.scores.energyAvg)  ?? 0.55
    const shortProxy = [{ ...proxyFeatures[0],
      valence: Math.max(0, Math.min(1, baseValence + popRatio * 0.3)),
      energy:  baseEnergy,
    }]
    const mediumProxy = [{ ...proxyFeatures[0], valence: baseValence, energy: baseEnergy }]

    const currentState = computeCurrentState(shortProxy, mediumProxy)

    return NextResponse.json({
      archetype:       result.archetype,
      shadowArchetype: result.shadowArchetype,
      confessionLine,
      shadowLine,
      highlight,
      handle:          displayHandle,
      listenerProfile: result.listenerProfile,
      listenerDNA:     result.listenerDNA,
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

// ─── Export data path ─────────────────────────────────────────────────────────

async function analyseExport(data: ExportPayload, handle: string) {
  try {
    const artists: SpotifyArtist[] = data.artists.map(a => ({
      id:         a.id,
      name:       a.name,
      genres:     a.genres,
      popularity: a.popularity,
    }))

    const lateNightRatio = computeLateNightRatio(data.recentPlays)

    const result = classify(
      artists,
      data.shortTracks,
      data.mediumTracks,
      data.longTracks,
      lateNightRatio,
      data.skipRate,
    )

    const confessionLine = getConfessionLine(result.archetype, result.signals)
    const shadowLine     = SHADOW_LINES[result.shadowArchetype]
    const archetype      = archetypes[result.archetype]
    const highlight      = buildHighlight(archetype.dataHighlightTemplate, result.dataHighlight)

    const letter = selectLetter({
      archetype:       result.archetype,
      valenceAvg:      result.scores.valenceAvg,
      listenerProfile: result.listenerProfile,
      drift:           result.drift,
      genreCount:      result.dataHighlight.genres,
      lateNight:       result.signals.lateNight,
      handle,
      lateNightPct:    result.dataHighlight.lateNightPct,
    })
    const letterFilled = letter.map(p => p.replace('{BPM}', '—')) as [string, string, string]

    const proxyFeatures = [{
      id: 'proxy', energy: result.scores.energyAvg, valence: result.scores.valenceAvg,
      acousticness: result.scores.acousticAvg, instrumentalness: 0, tempo: 0, speechiness: 0, danceability: 0,
    }]
    const safeNum = (v: unknown) => typeof v === 'number' && isFinite(v) ? v : null
    const shortPops   = data.shortTracks.map(t => safeNum(t.popularity)).filter((v): v is number => v !== null)
    const mediumPops  = data.mediumTracks.map(t => safeNum(t.popularity)).filter((v): v is number => v !== null)
    const shortPopAvg  = shortPops.length  ? shortPops.reduce((s, v) => s + v, 0) / shortPops.length  : 50
    const mediumPopAvg = mediumPops.length ? mediumPops.reduce((s, v) => s + v, 0) / mediumPops.length : 50
    const popRatio     = (shortPopAvg - mediumPopAvg) / 100

    const baseValence = safeNum(result.scores.valenceAvg) ?? 0.55
    const baseEnergy  = safeNum(result.scores.energyAvg)  ?? 0.55
    const shortProxy  = [{ ...proxyFeatures[0], valence: Math.max(0, Math.min(1, baseValence + popRatio * 0.3)), energy: baseEnergy }]
    const mediumProxy = [{ ...proxyFeatures[0], valence: baseValence, energy: baseEnergy }]
    const currentState = computeCurrentState(shortProxy, mediumProxy)

    return {
      archetype:       result.archetype,
      shadowArchetype: result.shadowArchetype,
      confessionLine,
      shadowLine,
      highlight,
      handle,
      listenerProfile: result.listenerProfile,
      listenerDNA:     result.listenerDNA,
      drift:           result.drift,
      letter:          letterFilled,
      waveformData:    result.waveformData,
      currentState,
      topArtistNames:  result.topArtistNames,
      topGenres:       result.topGenres,
      // Export-only extras shown on result page
      exportMeta: {
        totalHours:  data.totalHours,
        historyDays: data.historyDays,
        skipRate:    Math.round(data.skipRate * 100),
      },
    }
  } catch (err) {
    console.error('[analyze/export]', err)
    return getMockResult(handle)
  }
}

function buildHighlight(
  template: string,
  data: { genres: number; energyPct: number; loyaltyPct: number; lateNightPct: number }
): string {
  const pct   = Math.min(99, Math.max(51, data.energyPct))
  const count = Math.max(3, Math.round(data.genres * 0.2))
  return template
    .replace('{genres}',      String(data.genres))
    .replace('{pct}',         String(pct))
    .replace('{count}',       String(count))
    .replace('{loyalty}',     String(data.loyaltyPct))
    .replace('{lateNight}',   String(data.lateNightPct))
}
