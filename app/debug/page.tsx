'use client'

import { useState } from 'react'
import { buildAuthUrl, generatePKCE } from '@/lib/spotify'

export default function DebugPage() {
  const [authUrl,       setAuthUrl]       = useState<string | null>(null)
  const [apiResults,    setApiResults]    = useState<unknown[] | null>(null)
  const [apiLoading,    setApiLoading]    = useState(false)
  const [analyzeSteps,   setAnalyzeSteps]   = useState<AnalyzeStep[] | null>(null)
  const [analyzeLoading, setAnalyzeLoading] = useState(false)
  const [geminiResult,   setGeminiResult]   = useState<{ok: boolean; text?: string; error?: string} | null>(null)
  const [geminiLoading,  setGeminiLoading]  = useState(false)

  const clientId    = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID
  const redirectUri = process.env.NEXT_PUBLIC_REDIRECT_URI
  const origin      = typeof window !== 'undefined' ? window.location.origin : null

  async function generate() {
    const { challenge } = await generatePKCE()
    const url = buildAuthUrl(challenge, 'debug-state')
    setAuthUrl(url)
  }

  async function runGeminiProbe() {
    setGeminiLoading(true)
    try {
      const res = await fetch('/api/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          archetype: 'late-night-driver',
          quadrant: 'restless',
          listenerProfile: { discovery: 60, loyalty: 40, emotionalRange: 70, intensity: 65 },
          chosenWord: 'searching',
          dataLine: 'Energy avg: 71/100. Valence avg: 43/100.',
          trend: 'stable',
          topArtistNames: ['Test Artist'],
        }),
      })
      const data = await res.json()
      if (data.line && !data.error) {
        setGeminiResult({ ok: true, text: data.line })
      } else {
        setGeminiResult({ ok: false, error: data.error ?? 'Empty response' })
      }
    } catch (e) {
      setGeminiResult({ ok: false, error: String(e) })
    } finally {
      setGeminiLoading(false)
    }
  }

  async function runAnalyzeDebug() {
    const token = sessionStorage.getItem('spotify_token')
    if (!token) { alert('No spotify_token in sessionStorage. Login first.'); return }
    setAnalyzeLoading(true)
    try {
      const res  = await fetch('/api/debug-analyze', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const data = await res.json()
      setAnalyzeSteps(data.steps)
    } finally {
      setAnalyzeLoading(false)
    }
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

        {/* Full analysis debug */}
        <div className="mt-10 pt-8 border-t border-[#1f1f1f]">
          <p className="text-xs tracking-widest uppercase opacity-40 mb-4">Full analysis trace</p>
          <p className="text-xs opacity-50 mb-4">Runs the same logic as the real analysis, step by step. Shows exactly where it fails.</p>
          <button
            onClick={runAnalyzeDebug}
            disabled={analyzeLoading}
            className="border border-[#9b7fd4] px-4 py-2 text-xs tracking-widest uppercase hover:bg-[#9b7fd4] hover:text-[#0d0d0d] transition-colors disabled:opacity-40"
            style={{ color: '#9b7fd4' }}
          >
            {analyzeLoading ? 'Running...' : 'Trace full analysis'}
          </button>
          {analyzeSteps && (
            <div className="mt-4 space-y-2">
              {analyzeSteps.map((s, i) => (
                <div key={i} className="border px-3 py-2 text-xs"
                  style={{ borderColor: s.ok ? '#7a9e7e' : '#9b3a3a' }}>
                  <span style={{ color: s.ok ? '#7a9e7e' : '#cf6679' }}>
                    {s.ok ? '✓' : '✗'} {s.step}
                  </span>
                  {s.detail && <span className="opacity-40 ml-3">{s.detail}</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Gemini probe */}
        <div className="mt-10 pt-8 border-t border-[#1f1f1f]">
          <p className="text-xs tracking-widest uppercase opacity-40 mb-4">Gemini API</p>
          <p className="text-xs opacity-50 mb-4">Sends a test prompt to /api/respond. Does not need Spotify login.</p>
          <button
            onClick={runGeminiProbe}
            disabled={geminiLoading}
            className="border border-[#6a8aad] px-4 py-2 text-xs tracking-widest uppercase hover:bg-[#6a8aad] hover:text-[#0d0d0d] transition-colors disabled:opacity-40"
            style={{ color: '#6a8aad' }}
          >
            {geminiLoading ? 'Calling Gemini...' : 'Test Gemini response'}
          </button>
          {geminiResult && (
            <div className="mt-4 border px-4 py-3 text-xs"
              style={{ borderColor: geminiResult.ok ? '#7a9e7e' : '#9b3a3a' }}>
              <span style={{ color: geminiResult.ok ? '#7a9e7e' : '#cf6679' }}>
                {geminiResult.ok ? '✓ Gemini is working' : '✗ Gemini failed'}
              </span>
              <p className="mt-2 opacity-60 italic leading-5">
                {geminiResult.ok ? geminiResult.text : geminiResult.error}
              </p>
            </div>
          )}
        </div>

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

interface AnalyzeStep {
  step:    string
  ok:      boolean
  detail?: string
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
