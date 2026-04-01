import { NextRequest, NextResponse } from 'next/server'
import { getTopTracks, getTopArtists, getMe, getRecentlyPlayed } from '@/lib/spotify'
import { classify, computeLateNightRatio, type SpotifyArtist } from '@/lib/scoring'
import { getConfessionLine, archetypes } from '@/lib/archetypes'
import { SHADOW_LINES } from '@/lib/shadowLines'
import { selectLetter } from '@/lib/letter'
import { computeCurrentState } from '@/lib/currentState'

// Same logic as /api/analyze but returns the error at each step instead of falling back to mock
export async function POST(req: NextRequest) {
  const { token } = await req.json().catch(() => ({}))
  if (!token) return NextResponse.json({ error: 'no token' }, { status: 400 })

  const steps: { step: string; ok: boolean; detail?: string }[] = []

  function pass(step: string, detail?: string) {
    steps.push({ step, ok: true, detail })
  }
  function fail(step: string, err: unknown): NextResponse {
    steps.push({ step, ok: false, detail: String(err) })
    return NextResponse.json({ steps }, { status: 200 })
  }

  // Step 1: fetch all Spotify data
  let me, shortTracks, mediumTracks, longTracks, topArtists, recentlyPlayed
  try {
    ;[me, shortTracks, mediumTracks, longTracks, topArtists, recentlyPlayed] = await Promise.all([
      getMe(token),
      getTopTracks(token, 'short_term'),
      getTopTracks(token, 'medium_term'),
      getTopTracks(token, 'long_term'),
      getTopArtists(token),
      getRecentlyPlayed(token),
    ])
    pass('fetch_spotify', `me=${me.display_name}, short=${shortTracks.length}, medium=${mediumTracks.length}, long=${longTracks.length}, artists=${topArtists.length}, recent=${recentlyPlayed.length}`)
  } catch (e) {
    return fail('fetch_spotify', e)
  }

  // Step 2: classify
  let result
  try {
    const artists: SpotifyArtist[] = topArtists.map(a => ({
      id: a.id, name: a.name, genres: a.genres, popularity: a.popularity,
    }))
    const lateNightRatio = computeLateNightRatio(recentlyPlayed)
    result = classify(artists, shortTracks, mediumTracks, longTracks, lateNightRatio)
    pass('classify', [
      `archetype=${result.archetype}`,
      `shadow=${result.shadowArchetype}`,
      `genres=${result.topGenres.slice(0,3).join(',') || '(none)'}`,
      `matchRate=${Math.round(result.scores.matchRate * 100)}%`,
      `energy=${Math.round(result.scores.energyAvg * 100)}`,
      `valence=${Math.round(result.scores.valenceAvg * 100)}`,
      `discovery=${result.listenerProfile.discovery}`,
      `loyalty=${result.listenerProfile.loyalty}`,
      `intensity=${result.listenerProfile.intensity}`,
    ].join(' | '))
  } catch (e) {
    return fail('classify', e)
  }

  // Step 3: confession + shadow + highlight
  let confessionLine, shadowLine, highlight
  try {
    confessionLine = getConfessionLine(result.archetype, result.signals)
    shadowLine     = SHADOW_LINES[result.shadowArchetype]
    highlight      = archetypes[result.archetype].dataHighlightTemplate
    pass('content', `confessionLine length=${confessionLine?.length}, shadowLine=${!!shadowLine}`)
  } catch (e) {
    return fail('content', e)
  }

  // Step 4: letter
  let letter
  try {
    letter = selectLetter({
      archetype:       result.archetype,
      valenceAvg:      result.scores.valenceAvg,
      listenerProfile: result.listenerProfile,
      drift:           result.drift,
      genreCount:      result.dataHighlight.genres,
      lateNight:       result.signals.lateNight,
      handle:          me.display_name ?? 'you',
      lateNightPct:    result.dataHighlight.lateNightPct,
    })
    pass('letter', `paragraphs=${letter.length}`)
  } catch (e) {
    return fail('letter', e)
  }

  // Step 5: currentState
  try {
    const proxyFeatures = [{
      id: 'proxy', energy: result.scores.energyAvg, valence: result.scores.valenceAvg,
      acousticness: result.scores.acousticAvg, instrumentalness: 0, tempo: 0, speechiness: 0, danceability: 0,
    }]
    const shortPopAvg  = shortTracks.reduce((s, t) => s + t.popularity, 0) / (shortTracks.length || 1)
    const mediumPopAvg = mediumTracks.reduce((s, t) => s + t.popularity, 0) / (mediumTracks.length || 1)
    const popRatio     = (shortPopAvg - mediumPopAvg) / 100
    const shortProxy   = [{ ...proxyFeatures[0], valence: Math.max(0, Math.min(1, result.scores.valenceAvg + popRatio * 0.3)) }]
    computeCurrentState(shortProxy, proxyFeatures)
    pass('currentState')
  } catch (e) {
    return fail('currentState', e)
  }

  pass('DONE')
  return NextResponse.json({ steps, topArtistNames: result.topArtistNames, topGenres: result.topGenres, archetype: result.archetype })
}
