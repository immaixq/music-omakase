const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize'
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token'
const SPOTIFY_API = 'https://api.spotify.com/v1'

const SCOPES = [
  'user-top-read',
  'user-read-recently-played',
].join(' ')

// ─── PKCE helpers ────────────────────────────────────────────────────────────

function base64url(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

export async function generatePKCE(): Promise<{ verifier: string; challenge: string }> {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  const verifier = base64url(array.buffer)
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
  const challenge = base64url(hash)
  return { verifier, challenge }
}

export function buildAuthUrl(challenge: string, state: string): string {
  const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!
  const redirectUri = process.env.NEXT_PUBLIC_REDIRECT_URI!
  const params = new URLSearchParams({
    client_id:             clientId,
    response_type:         'code',
    redirect_uri:          redirectUri,
    code_challenge_method: 'S256',
    code_challenge:        challenge,
    state,
    scope:                 SCOPES,
  })
  return `${SPOTIFY_AUTH_URL}?${params}`
}

export async function exchangeToken(code: string, verifier: string): Promise<string> {
  const clientId   = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!
  const redirectUri = process.env.NEXT_PUBLIC_REDIRECT_URI!

  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'authorization_code',
      code,
      redirect_uri:  redirectUri,
      client_id:     clientId,
      code_verifier: verifier,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Token exchange failed: ${err}`)
  }

  const data = await res.json()
  return data.access_token as string
}

// ─── API helpers ──────────────────────────────────────────────────────────────

async function get<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${SPOTIFY_API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Spotify API error ${res.status}: ${path}`)
  return res.json() as Promise<T>
}

export async function getTopTracks(token: string, timeRange: 'short_term' | 'medium_term') {
  const data = await get<{ items: SpotifyTrack[] }>(
    `/me/top/tracks?limit=50&time_range=${timeRange}`,
    token
  )
  return data.items
}

export async function getAudioFeatures(token: string, ids: string[]) {
  // Spotify allows max 100 per request
  const chunks: string[][] = []
  for (let i = 0; i < ids.length; i += 100) chunks.push(ids.slice(i, i + 100))

  const results = await Promise.all(
    chunks.map(chunk =>
      get<{ audio_features: AudioFeatureRaw[] }>(
        `/audio-features?ids=${chunk.join(',')}`,
        token
      )
    )
  )
  return results.flatMap(r => r.audio_features).filter(Boolean)
}

export async function getTopArtists(token: string) {
  const data = await get<{ items: SpotifyArtistRaw[] }>(
    '/me/top/artists?limit=50&time_range=medium_term',
    token
  )
  return data.items
}

// ─── Raw types (minimal) ─────────────────────────────────────────────────────

export interface SpotifyTrack {
  id: string
  name: string
  artists: { id: string; name: string }[]
}

export interface AudioFeatureRaw {
  id: string
  energy: number
  valence: number
  acousticness: number
  instrumentalness: number
  tempo: number
  speechiness: number
  danceability: number
}

export interface SpotifyArtistRaw {
  id: string
  name: string
  genres: string[]
}

export async function getMe(token: string): Promise<{ display_name: string; id: string }> {
  return get<{ display_name: string; id: string }>('/me', token)
}
