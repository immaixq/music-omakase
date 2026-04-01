'use client'

import { useState } from 'react'
import { buildAuthUrl, generatePKCE } from '@/lib/spotify'

export default function DebugPage() {
  const [authUrl, setAuthUrl] = useState<string | null>(null)

  const clientId    = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID
  const redirectUri = process.env.NEXT_PUBLIC_REDIRECT_URI
  const origin      = typeof window !== 'undefined' ? window.location.origin : null

  async function generate() {
    const { challenge } = await generatePKCE()
    const url = buildAuthUrl(challenge, 'debug-state')
    setAuthUrl(url)
  }

  const parsed = authUrl ? new URL(authUrl) : null

  return (
    <main className="min-h-screen p-10 font-mono text-sm" style={{ fontFamily: 'Courier New, monospace' }}>
      <p className="text-xs tracking-widest uppercase opacity-40 mb-8">VIBE-ID · Debug</p>

      <div className="space-y-6 max-w-2xl">
        <Row label="NEXT_PUBLIC_SPOTIFY_CLIENT_ID" value={clientId} />
        <Row label="NEXT_PUBLIC_REDIRECT_URI"      value={redirectUri} />
        <Row label="window.location.origin (fallback)" value={origin} />
        <Row label="redirect_uri that will be used"
             value={redirectUri ?? (origin ? `${origin}/callback` : null)}
             highlight />

        <button
          onClick={generate}
          className="border border-[#f0ede6] px-4 py-2 text-xs tracking-widest uppercase hover:bg-[#f0ede6] hover:text-[#0d0d0d] transition-colors"
        >
          Generate auth URL
        </button>

        {parsed && (
          <div className="space-y-4 mt-6">
            <p className="opacity-40 uppercase tracking-widest text-xs">Parsed auth URL params:</p>
            {Array.from(parsed.searchParams.entries()).map(([k, v]) => (
              <Row key={k} label={k} value={v} highlight={k === 'redirect_uri'} />
            ))}

            <div className="mt-6 pt-6 border-t border-[#1f1f1f]">
              <p className="opacity-40 text-xs mb-2 uppercase tracking-widest">
                Copy the redirect_uri value above and paste it exactly into:
              </p>
              <p className="opacity-70">
                Spotify Dashboard → Your App → Edit Settings → Redirect URIs
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

function Row({ label, value, highlight = false }: { label: string; value?: string | null; highlight?: boolean }) {
  return (
    <div>
      <p className="text-xs opacity-40 mb-1">{label}</p>
      <p
        className="break-all px-3 py-2 border text-xs"
        style={{
          borderColor: highlight ? '#d4863a' : '#1f1f1f',
          color:       highlight ? '#d4863a' : '#f0ede6',
          background:  '#111',
        }}
      >
        {value ?? <span className="opacity-30">not set</span>}
      </p>
    </div>
  )
}
