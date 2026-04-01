'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { buildAuthUrl, generatePKCE } from '@/lib/spotify'

export default function Landing() {
  const router  = useRouter()
  const [handle, setHandle]   = useState('')
  const [loading, setLoading] = useState(false)

  async function connectSpotify() {
    if (loading) return
    setLoading(true)
    sessionStorage.clear()
    sessionStorage.setItem('handle', handle.trim() || 'you')

    const state = crypto.randomUUID()
    const { verifier, challenge } = await generatePKCE()
    sessionStorage.setItem('pkce_verifier', verifier)
    sessionStorage.setItem('oauth_state',   state)

    window.location.href = buildAuthUrl(challenge, state)
  }

  function tryDemo() {
    sessionStorage.clear()
    sessionStorage.setItem('handle', handle.trim() || 'you')
    router.push('/loading')
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 39px, #1a1a1a 40px)',
          opacity: 0.4,
        }}
      />

      <div className="relative z-10 max-w-lg w-full">
        <p
          className="text-xs tracking-[0.3em] uppercase mb-16 opacity-50"
          style={{ fontFamily: 'Courier New, monospace' }}
        >
          VIBE-ID · AUDIT SYSTEM
        </p>

        <h1
          className="text-4xl sm:text-5xl font-bold leading-tight mb-3"
          style={{ fontFamily: 'Georgia, serif', letterSpacing: '-0.02em' }}
        >
          Your music has been
          <br />
          keeping a diary.
        </h1>

        <p className="text-xl mb-12 opacity-60" style={{ fontFamily: 'Courier New, monospace' }}>
          We read it.
        </p>

        {/* Name input */}
        <div className="mb-4">
          <label
            className="block text-xs tracking-[0.2em] uppercase opacity-40 mb-2"
            style={{ fontFamily: 'Courier New, monospace' }}
            htmlFor="handle"
          >
            Who's getting audited?
          </label>
          <input
            id="handle"
            type="text"
            value={handle}
            onChange={e => setHandle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && connectSpotify()}
            placeholder="your name or @handle"
            maxLength={32}
            className="w-full bg-transparent border border-[#2a2a2a] px-4 py-3 text-sm outline-none focus:border-[#f0ede6] transition-colors placeholder:opacity-20"
            style={{ fontFamily: 'Courier New, monospace' }}
          />
        </div>

        {/* Primary CTA — real Spotify */}
        <button
          onClick={connectSpotify}
          disabled={loading}
          className="group w-full flex items-center justify-between border border-[#f0ede6] px-8 py-4 text-sm tracking-[0.15em] uppercase transition-all duration-200 hover:bg-[#f0ede6] hover:text-[#0d0d0d] disabled:opacity-40 mb-3"
          style={{ fontFamily: 'Courier New, monospace' }}
        >
          {loading ? 'Connecting...' : 'Connect Spotify'}
          <span className="opacity-40 group-hover:opacity-100 transition-opacity">→</span>
        </button>

        {/* Secondary CTA — demo */}
        <button
          onClick={tryDemo}
          className="w-full text-xs opacity-30 hover:opacity-60 transition-opacity py-2 tracking-widest uppercase"
          style={{ fontFamily: 'Courier New, monospace' }}
        >
          or try demo first
        </button>

        <p className="mt-8 text-xs opacity-20" style={{ fontFamily: 'Courier New, monospace' }}>
          No questions. No self-reporting. Just your data.
        </p>
      </div>

      <div
        className="absolute bottom-8 left-6 right-6 flex justify-between text-xs opacity-10"
        style={{ fontFamily: 'Courier New, monospace' }}
        aria-hidden
      >
        <span>THE LATE NIGHT DRIVER</span>
        <span>THE HYPE ARCHITECT</span>
        <span className="hidden sm:block">THE SOFT LAUNCH</span>
        <span className="hidden sm:block">THE STATIC</span>
      </div>
    </main>
  )
}
