import { NextRequest, NextResponse } from 'next/server'

const SPOTIFY_API = 'https://api.spotify.com/v1'

async function probe(label: string, token: string, path: string) {
  try {
    const res = await fetch(`${SPOTIFY_API}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const body = await res.json().catch(() => null)
    return {
      label,
      status:  res.status,
      ok:      res.ok,
      // Only expose non-sensitive shape info
      count:   Array.isArray(body?.items) ? body.items.length : undefined,
      sample:  res.ok && Array.isArray(body?.items) ? body.items.slice(0, 2).map((i: Record<string, unknown>) => ({
        id:         i.id,
        name:       i.name,
        popularity: i.popularity,
        genres:     (i.genres as string[] | undefined)?.slice(0, 3),
      })) : undefined,
      error:   !res.ok ? (body?.error ?? { status: res.status }) : undefined,
    }
  } catch (e) {
    return { label, status: 0, ok: false, error: String(e) }
  }
}

export async function POST(req: NextRequest) {
  const { token } = await req.json().catch(() => ({}))
  if (!token) return NextResponse.json({ error: 'No token provided' }, { status: 400 })

  const results = await Promise.all([
    probe('me',              token, '/me'),
    probe('top_tracks_short',  token, '/me/top/tracks?limit=5&time_range=short_term'),
    probe('top_tracks_medium', token, '/me/top/tracks?limit=5&time_range=medium_term'),
    probe('top_tracks_long',   token, '/me/top/tracks?limit=5&time_range=long_term'),
    probe('top_artists',       token, '/me/top/artists?limit=5&time_range=medium_term'),
    probe('recently_played',   token, '/me/player/recently-played?limit=5'),
  ])

  return NextResponse.json({ results })
}
