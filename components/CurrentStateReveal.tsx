'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { CurrentState, MoodQuadrant } from '@/lib/currentState'
import { getResonanceLine } from '@/lib/currentState'
import type { ListenerProfile } from '@/lib/scoring'

const QUADRANT_META: Record<MoodQuadrant, { label: string; color: string }> = {
  alive:    { label: 'ALIVE',    color: '#c8a96e' },
  soft:     { label: 'SOFT',     color: '#7a9e7e' },
  restless: { label: 'RESTLESS', color: '#9b7fd4' },
  heavy:    { label: 'HEAVY',    color: '#6a8aad' },
}

const TREND_COPY: Record<string, string> = {
  rising:  '↑ trending lighter',
  falling: '↓ trending darker',
  stable:  '— holding steady',
}

// MoodMap: 2D valence × energy grid
function MoodMap({ quadrant, color }: { quadrant: MoodQuadrant; color: string }) {
  // Approximate center coordinates per quadrant (in 0–1 space)
  const positions: Record<MoodQuadrant, { x: number; y: number }> = {
    alive:    { x: 0.72, y: 0.28 }, // right, top  (high val, high energy — energy on Y inverted)
    soft:     { x: 0.72, y: 0.72 }, // right, bottom (high val, low energy)
    restless: { x: 0.28, y: 0.28 }, // left, top
    heavy:    { x: 0.28, y: 0.72 }, // left, bottom
  }
  const size = 160
  const pad  = 20
  const inner = size - pad * 2
  const pos = positions[quadrant]
  const cx = pad + pos.x * inner
  const cy = pad + pos.y * inner

  return (
    <div className="select-none">
      <p className="text-xs tracking-[0.2em] uppercase opacity-30 mb-3"
        style={{ fontFamily: 'Courier New, monospace' }}>
        mood map
      </p>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background */}
        <rect x={pad} y={pad} width={inner} height={inner} fill="none" stroke="#1f1f1f" strokeWidth={1} />

        {/* Quadrant dividers */}
        <line x1={pad + inner / 2} y1={pad} x2={pad + inner / 2} y2={pad + inner} stroke="#1f1f1f" strokeWidth={1} />
        <line x1={pad} y1={pad + inner / 2} x2={pad + inner} y2={pad + inner / 2} stroke="#1f1f1f" strokeWidth={1} />

        {/* Quadrant labels */}
        <text x={pad + inner * 0.25} y={pad - 5} fill="#f0ede6" opacity={0.15} fontSize={7} textAnchor="middle" fontFamily="Courier New">restless</text>
        <text x={pad + inner * 0.75} y={pad - 5} fill="#f0ede6" opacity={0.15} fontSize={7} textAnchor="middle" fontFamily="Courier New">alive</text>
        <text x={pad + inner * 0.25} y={pad + inner + 12} fill="#f0ede6" opacity={0.15} fontSize={7} textAnchor="middle" fontFamily="Courier New">heavy</text>
        <text x={pad + inner * 0.75} y={pad + inner + 12} fill="#f0ede6" opacity={0.15} fontSize={7} textAnchor="middle" fontFamily="Courier New">soft</text>

        {/* Axis labels */}
        <text x={pad + inner / 2} y={size - 2} fill="#f0ede6" opacity={0.2} fontSize={6} textAnchor="middle" fontFamily="Courier New">valence →</text>
        <text x={4} y={pad + inner / 2} fill="#f0ede6" opacity={0.2} fontSize={6} textAnchor="middle" fontFamily="Courier New" transform={`rotate(-90, 4, ${pad + inner / 2})`}>energy ↑</text>

        {/* User position — pulsing dot */}
        <motion.circle
          cx={cx} cy={cy} r={5}
          fill={color}
          opacity={0.9}
          animate={{ r: [5, 7, 5], opacity: [0.9, 0.5, 0.9] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Outer ring */}
        <motion.circle
          cx={cx} cy={cy} r={10}
          fill="none"
          stroke={color}
          strokeWidth={1}
          opacity={0.3}
          animate={{ r: [10, 16, 10], opacity: [0.3, 0, 0.3] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      </svg>
    </div>
  )
}

// Ambient background bars — thin animated lines reacting to quadrant
function AmbientBars({ quadrant, color }: { quadrant: MoodQuadrant; color: string }) {
  const configs: Record<MoodQuadrant, { count: number; speedMs: number; opacity: number }> = {
    alive:    { count: 12, speedMs: 900,  opacity: 0.06 },
    soft:     { count: 6,  speedMs: 2200, opacity: 0.04 },
    restless: { count: 16, speedMs: 600,  opacity: 0.07 },
    heavy:    { count: 4,  speedMs: 3500, opacity: 0.03 },
  }
  const cfg = configs[quadrant]

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {Array.from({ length: cfg.count }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute left-0 right-0 h-px"
          style={{
            top: `${5 + (i / cfg.count) * 90}%`,
            background: color,
            opacity: cfg.opacity,
          }}
          animate={{ scaleX: [0.3, 1, 0.3], opacity: [cfg.opacity * 0.5, cfg.opacity, cfg.opacity * 0.5] }}
          transition={{
            duration: cfg.speedMs / 1000,
            repeat: Infinity,
            delay: i * (cfg.speedMs / 1000 / cfg.count),
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

interface Props {
  state:           CurrentState
  accentColor:     string
  archetype?:      string
  listenerProfile?: ListenerProfile
}

export function CurrentStateReveal({ state, accentColor, archetype, listenerProfile }: Props) {
  const [unlocked,      setUnlocked]      = useState(false)
  const [pickedWord,    setPickedWord]    = useState<string | null>(null)
  const [resonanceLine, setResonanceLine] = useState<string | null>(null)
  const [loading,       setLoading]       = useState(false)

  const meta = QUADRANT_META[state.quadrant]

  async function pickWord(word: string) {
    if (pickedWord) return
    setPickedWord(word)
    setLoading(true)

    // Try AI-generated response; fall back to static template
    try {
      const res = await fetch('/api/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          archetype:       archetype ?? 'late-night-driver',
          quadrant:        state.quadrant,
          listenerProfile: listenerProfile ?? null,
          chosenWord:      word,
          dataLine:        state.dataLine,
          trend:           state.trend,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setResonanceLine(data.line ?? getResonanceLine(state.quadrant, word))
      } else {
        setResonanceLine(getResonanceLine(state.quadrant, word))
      }
    } catch {
      setResonanceLine(getResonanceLine(state.quadrant, word))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative border-t border-[#1f1f1f] pt-8 mt-2 overflow-hidden">
      {/* Header */}
      <p className="text-xs tracking-[0.25em] uppercase opacity-35 mb-4"
        style={{ fontFamily: 'Courier New, monospace' }}>
        right now
      </p>

      {!unlocked ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <p className="text-sm opacity-50 mb-5 leading-6"
            style={{ fontFamily: 'Courier New, monospace' }}>
            Your music is also saying something about this specific moment —
            not who you are in general, but where you are right now.
          </p>
          <button
            onClick={() => setUnlocked(true)}
            className="group inline-flex items-center gap-3 border border-[#2a2a2a] px-5 py-3 text-sm hover:border-[#f0ede6] transition-all duration-200"
            style={{ fontFamily: 'Courier New, monospace' }}
          >
            <span className="opacity-50 group-hover:opacity-90 transition-opacity">
              Show me what&apos;s happening right now
            </span>
            <span className="opacity-25 group-hover:opacity-70 transition-opacity">→</span>
          </button>
        </motion.div>
      ) : (
        <AnimatePresence>
          <motion.div
            key="unlocked"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            {/* Ambient background */}
            <AmbientBars quadrant={state.quadrant} color={meta.color} />

            {/* Top row: badge + trend + mood map */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-4">
                  <span
                    className="text-xs tracking-[0.2em] px-3 py-1 border"
                    style={{
                      fontFamily:  'Courier New, monospace',
                      borderColor: meta.color,
                      color:       meta.color,
                    }}
                  >
                    {meta.label}
                  </span>
                  <span className="text-xs opacity-30"
                    style={{ fontFamily: 'Courier New, monospace' }}>
                    {TREND_COPY[state.trend]}
                  </span>
                </div>

                {/* Headline */}
                <p className="text-xl italic leading-snug"
                  style={{ fontFamily: 'Georgia, serif' }}>
                  {state.headline}
                </p>
              </div>

              {/* Mood map — desktop only */}
              <div className="hidden sm:block flex-shrink-0">
                <MoodMap quadrant={state.quadrant} color={meta.color} />
              </div>
            </div>

            {/* Mood map — mobile (full width) */}
            <div className="sm:hidden">
              <MoodMap quadrant={state.quadrant} color={meta.color} />
            </div>

            {/* Description */}
            <p className="text-sm leading-7 opacity-65"
              style={{ fontFamily: 'Courier New, monospace' }}>
              {state.description}
            </p>

            {/* Data backing */}
            <div className="border-l-2 pl-4 py-1"
              style={{ borderColor: meta.color }}>
              <p className="text-xs opacity-40"
                style={{ fontFamily: 'Courier New, monospace' }}>
                {state.dataLine}
              </p>
            </div>

            {/* Feeling word check */}
            <div>
              <p className="text-xs tracking-[0.2em] uppercase opacity-35 mb-4"
                style={{ fontFamily: 'Courier New, monospace' }}>
                {pickedWord ? 'you said:' : 'which of these lands closest?'}
              </p>

              <div className="flex flex-wrap gap-2">
                {state.feelingWords.map(word => {
                  const isPicked   = pickedWord === word
                  const isDisabled = !!pickedWord && !isPicked
                  return (
                    <button
                      key={word}
                      onClick={() => pickWord(word)}
                      disabled={!!pickedWord}
                      className="px-4 py-2 border text-sm tracking-widest uppercase transition-all duration-300"
                      style={{
                        fontFamily:  'Courier New, monospace',
                        borderColor: isPicked ? accentColor : '#2a2a2a',
                        color:       isPicked ? accentColor : '#f0ede6',
                        opacity:     isDisabled ? 0.2 : 1,
                        background:  isPicked ? 'rgba(255,255,255,0.03)' : 'transparent',
                      }}
                    >
                      {word}
                    </button>
                  )
                })}
              </div>

              {/* AI response or loading state */}
              <AnimatePresence mode="wait">
                {loading && (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="mt-5 flex items-center gap-2"
                  >
                    {[0, 1, 2].map(i => (
                      <motion.div
                        key={i}
                        className="w-1 h-1 rounded-full"
                        style={{ background: accentColor }}
                        animate={{ opacity: [0.2, 1, 0.2] }}
                        transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                      />
                    ))}
                    <span className="text-xs opacity-25" style={{ fontFamily: 'Courier New, monospace' }}>
                      reading your data
                    </span>
                  </motion.div>
                )}

                {resonanceLine && !loading && (
                  <motion.p
                    key="resonance"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="mt-5 text-sm leading-6 opacity-60 italic"
                    style={{ fontFamily: 'Georgia, serif' }}
                  >
                    {resonanceLine}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Vs baseline note — only if something changed */}
            {state.vsBaseline !== 'same' && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-xs opacity-30 pt-2"
                style={{ fontFamily: 'Courier New, monospace' }}
              >
                {state.vsBaseline === 'brighter'     && 'Note: this is brighter than your 6-month average.'}
                {state.vsBaseline === 'darker'       && 'Note: this is darker than your 6-month average.'}
                {state.vsBaseline === 'more_intense' && 'Note: the intensity here is higher than your usual baseline.'}
                {state.vsBaseline === 'quieter'      && 'Note: this is quieter than your usual baseline.'}
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  )
}
