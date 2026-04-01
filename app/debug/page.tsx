'use client'

import { useState } from 'react'
import { buildAuthUrl, generatePKCE } from '@/lib/spotify'

export default function DebugPage() {
  const [authUrl,      setAuthUrl]      = useState<string | null>(null)
  const [apiResults,   setApiResults]   = useState<unknown[] | null>(null)
  const [apiLoading,   setApiLoading]   = useState(false)

  const clientId    = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID
  const redirectUri = process.env.NEXT_PUBLIC_REDIRECT_URI
  const origin      = typeof window !== 'undefined' ? window.location.origin : null

  async function generate() {
    const { challenge } = await generatePKCE()
    const url = buildAuthUrl(challenge, 'debug-state')
    setAuthUrl(url)
  }

  async function runApiProbe() {
    const token = sessionStorage.getItem('spotify_token')
    if (!token) {
      alert('No spotify_token found in sessionStorage. Complete the login flow first.')
      return
    }
    setApiLoading(true)
    try {
      const res  = await fetch('/api/debug', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token }),
      })
      const data = await res.json()
      setApiResults(data.results)
    } finally {
      setApiLoading(false)
    }
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
          </div>
        )}

        {/* API probe section */}
        <div className="mt-10 pt-8 border-t border-[#1f1f1f]">
          <p className="text-xs tracking-widest uppercase opacity-40 mb-4">Spotify API probe</p>
          <p className="text-xs opacity-50 mb-4">
            Login via the main flow first, then come back here and click Probe.
            This calls each Spotify endpoint with your stored token and shows what works.
          </p>
          <button
            onClick={runApiProbe}
            disabled={apiLoading}
            className="border border-[#c8a96e] px-4 py-2 text-xs tracking-widest uppercase hover:bg-[#c8a96e] hover:text-[#0d0d0d] transition-colors disabled:opacity-40"
            style={{ color: '#c8a96e' }}
          >
            {apiLoading ? 'Probing...' : 'Probe Spotify endpoints'}
          </button>

          {apiResults && (
            <div className="mt-6 space-y-3">
              {(apiResults as ApiProbeResult[]).map((r) => (
                <div key={r.label}
                  className="border px-4 py-3"
                  style={{ borderColor: r.ok ? '#7a9e7e' : '#9b3a3a' }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs tracking-widest uppercase"
                      style={{ color: r.ok ? '#7a9e7e' : '#cf6679' }}>
                      {r.ok ? '✓' : '✗'} {r.label}
                    </span>
                    <span className="text-xs opacity-40">HTTP {r.status}</span>
                  </div>
                  {r.count !== undefined && (
                    <p className="text-xs opacity-50">items returned: {r.count}</p>
                  )}
                  {r.sample && (
                    <p className="text-xs opacity-40 mt-1 truncate">
                      e.g. {r.sample.map((s: {name?: string}) => s.name).filter(Boolean).join(', ')}
                    </p>
                  )}
                  {r.error && (
                    <p className="text-xs mt-1" style={{ color: '#cf6679' }}>
                      {typeof r.error === 'string' ? r.error : JSON.stringify(r.error)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

interface ApiProbeResult {
  label:  string
  status: number
  ok:     boolean
  count?: number
  sample?: {name?: string}[]
  error?: string | Record<string, unknown>
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
        {value ?? <span className="opacity-30">{'not set'}</span>}
      </p>
    </div>
  )
}
