'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { archetypes, type ArchetypeKey } from '@/lib/archetypes'
import type { AnalyzeResult } from '@/lib/mock'
import type { ListenerProfile, DriftSignal } from '@/lib/scoring'

type Phase = 'name' | 'confession' | 'shadow' | 'full' | 'profile' | 'letter' | 'card'

const OPPOSITE: Record<ArchetypeKey, ArchetypeKey> = {
  'late-night-driver': 'hype-architect',
  'hype-architect':    'late-night-driver',
  'soft-launch':       'the-static',
  'the-static':        'soft-launch',
}

const PROFILE_LABELS: Record<keyof ListenerProfile, { label: string; low: string; high: string }> = {
  discovery:      { label: 'Discovery',       low: 'comfort zone',     high: 'underground' },
  loyalty:        { label: 'Loyalty',         low: 'always moving on', high: 'always returning' },
  emotionalRange: { label: 'Emotional Range', low: 'one mood',         high: 'full spectrum' },
  intensity:      { label: 'Intensity',       low: 'background noise', high: 'demands attention' },
}

export default function ResultPage() {
  const params    = useParams<{ type: string }>()
  const router    = useRouter()
  const key       = params.type as ArchetypeKey
  const archetype = archetypes[key]

  const [result, setResult] = useState<AnalyzeResult | null>(null)
  const [phase,  setPhase]  = useState<Phase>('name')
  const [quizMode, setQuizMode] = useState(false)

  useEffect(() => {
    if (!archetype) { router.replace('/'); return }
    const stored = sessionStorage.getItem('vibe_result')
    if (!stored)  { router.replace('/'); return }

    const parsed = JSON.parse(stored) as AnalyzeResult
    if (!parsed.shadowArchetype || !archetypes[parsed.shadowArchetype]) {
      sessionStorage.removeItem('vibe_result')
      router.replace('/')
      return
    }
    setResult(parsed)

    const timers = [
      setTimeout(() => setPhase('confession'), 1000),
      setTimeout(() => setPhase('shadow'),     2200),
      setTimeout(() => setPhase('full'),       3200),
      setTimeout(() => setPhase('profile'),    4200),
      setTimeout(() => setPhase('letter'),     5000),
      setTimeout(() => setPhase('card'),       6000),
    ]
    return () => timers.forEach(clearTimeout)
  }, [archetype, router])

  if (!archetype || !result) return null

  const shadow   = archetypes[result.shadowArchetype] ?? archetypes['the-static']
  const opposite = archetypes[OPPOSITE[key]]          ?? archetypes['hype-architect']
  const handle   = result.handle !== 'you' ? `@${result.handle}` : null
  const phases   = (...ps: Phase[]) => ps.includes(phase)

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-16 relative">
      <div aria-hidden className="absolute top-0 left-0 right-0 h-px"
        style={{ background: archetype.color, opacity: 0.6 }} />

      <div className="max-w-lg w-full">
        {/* Label + handle */}
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} transition={{ duration: 0.6 }}
          className="text-xs tracking-[0.3em] uppercase mb-2"
          style={{ fontFamily: 'Courier New, monospace' }}>
          AUDIT COMPLETE
        </motion.p>
        {handle && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} transition={{ duration: 0.6, delay: 0.2 }}
            className="text-sm mb-6" style={{ fontFamily: 'Courier New, monospace' }}>
            {handle}
          </motion.p>
        )}

        {/* Primary archetype */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="text-5xl sm:text-6xl font-bold leading-none mb-8"
          style={{ fontFamily: 'Georgia, serif', letterSpacing: '-0.02em', color: archetype.color }}>
          {archetype.name}
        </motion.h1>

        {/* Confession */}
        <AnimatePresence>
          {phases('confession','shadow','full','profile','letter','card') && (
            <motion.p key="confession"
              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="text-lg sm:text-xl mb-8 italic"
              style={{ fontFamily: 'Georgia, serif' }}>
              &ldquo;{result.confessionLine}&rdquo;
            </motion.p>
          )}
        </AnimatePresence>

        {/* Shadow type */}
        <AnimatePresence>
          {phases('shadow','full','profile','letter','card') && (
            <motion.div key="shadow"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-8 border border-[#2a2a2a] px-5 py-4">
              <p className="text-xs tracking-[0.2em] uppercase opacity-35 mb-2"
                style={{ fontFamily: 'Courier New, monospace' }}>shadow type</p>
              <p className="text-base font-semibold mb-1"
                style={{ fontFamily: 'Georgia, serif', color: shadow.color }}>
                {shadow.name}
              </p>
              <p className="text-xs opacity-50 italic" style={{ fontFamily: 'Georgia, serif' }}>
                &ldquo;{result.shadowLine}&rdquo;
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Description + highlight */}
        <AnimatePresence>
          {phases('full','profile','letter','card') && (
            <motion.div key="full"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-5 mb-10">
              <p className="text-sm leading-7 opacity-70"
                style={{ fontFamily: 'Courier New, monospace' }}>
                {archetype.description}
              </p>
              <div className="border-l-2 pl-4 py-1 text-sm opacity-50"
                style={{ borderColor: archetype.color, fontFamily: 'Courier New, monospace' }}>
                {result.highlight}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Listener Profile */}
        <AnimatePresence>
          {phases('profile','letter','card') && (
            <motion.div key="profile"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-10">
              <p className="text-xs tracking-[0.25em] uppercase opacity-35 mb-5"
                style={{ fontFamily: 'Courier New, monospace' }}>
                listener profile
              </p>
              <div className="space-y-4">
                {(Object.entries(result.listenerProfile) as [keyof ListenerProfile, number][]).map(([dim, val]) => (
                  <ProfileBar key={dim} dim={dim} value={val} color={archetype.color} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Drift panel */}
        {phases('letter','card') && result.drift.detected && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-10 border border-[#2a2a2a] px-5 py-4">
            <p className="text-xs tracking-[0.2em] uppercase mb-2"
              style={{ fontFamily: 'Courier New, monospace', color: archetype.color, opacity: 0.7 }}>
              SHIFT DETECTED · ~{result.drift.weeksAgo} weeks ago
            </p>
            <p className="text-sm leading-6 opacity-65 italic"
              style={{ fontFamily: 'Georgia, serif' }}>
              {result.drift.line}
            </p>
          </motion.div>
        )}

        {/* The Letter */}
        <AnimatePresence>
          {phases('letter','card') && (
            <motion.div key="letter"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-12 space-y-4 border-t border-[#1f1f1f] pt-8">
              <p className="text-xs tracking-[0.25em] uppercase opacity-35 mb-4"
                style={{ fontFamily: 'Courier New, monospace' }}>
                a note from your music
              </p>
              {result.letter.map((para, i) => (
                <p key={i} className="text-sm leading-7 opacity-70"
                  style={{ fontFamily: i === 0 ? 'Georgia, serif' : 'Courier New, monospace',
                           fontStyle: i === 0 ? 'italic' : 'normal' }}>
                  {para}
                </p>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cards + actions */}
        <AnimatePresence>
          {phase === 'card' && (
            <motion.div key="card"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}>

              {/* Card toggle */}
              <div className="flex gap-3 mb-4">
                <button
                  onClick={() => setQuizMode(false)}
                  className="text-xs tracking-widest uppercase px-3 py-1 border transition-colors"
                  style={{
                    fontFamily:  'Courier New, monospace',
                    borderColor: !quizMode ? archetype.color : '#2a2a2a',
                    color:       !quizMode ? archetype.color : '#f0ede6',
                    opacity:     !quizMode ? 1 : 0.4,
                  }}>
                  Your card
                </button>
                <button
                  onClick={() => setQuizMode(true)}
                  className="text-xs tracking-widest uppercase px-3 py-1 border transition-colors"
                  style={{
                    fontFamily:  'Courier New, monospace',
                    borderColor: quizMode ? archetype.color : '#2a2a2a',
                    color:       quizMode ? archetype.color : '#f0ede6',
                    opacity:     quizMode ? 1 : 0.4,
                  }}>
                  Quiz card
                </button>
              </div>

              <ShareCard
                archetypeName={archetype.name}
                shadowName={shadow.name}
                confession={result.confessionLine}
                color={archetype.color}
                shadowColor={shadow.color}
                handle={result.handle}
                waveformData={result.waveformData}
                driftDetected={result.drift.detected}
                quizMode={quizMode}
              />

              <p className="mt-3 text-xs opacity-40 text-center"
                style={{ fontFamily: 'Courier New, monospace' }}>
                {quizMode
                  ? "Share this. See if they can guess your type."
                  : "Screenshot this. Post it. See if your friends can guess your type."}
              </p>

              {/* Opposite type CTA */}
              <div className="mt-10 pt-8 border-t border-[#1f1f1f]">
                <p className="text-xs opacity-35 uppercase tracking-widest mb-3"
                  style={{ fontFamily: 'Courier New, monospace' }}>
                  Your opposite
                </p>
                <p className="text-base font-semibold mb-1"
                  style={{ fontFamily: 'Georgia, serif', color: opposite.color }}>
                  {opposite.name}
                </p>
                <p className="text-xs opacity-50 mb-4 leading-5"
                  style={{ fontFamily: 'Courier New, monospace' }}>
                  {opposite.tagline}
                </p>
                <button
                  onClick={() => router.push(`/compatibility/${key}`)}
                  className="group w-full flex items-center justify-between border border-[#2a2a2a] px-5 py-3 text-sm hover:border-[#f0ede6] transition-colors"
                  style={{ fontFamily: 'Courier New, monospace' }}>
                  <span className="opacity-60">Check compatibility with a friend</span>
                  <span className="opacity-30 group-hover:opacity-80 transition-opacity">→</span>
                </button>
              </div>

              <button
                onClick={() => { sessionStorage.clear(); router.replace('/') }}
                className="mt-8 text-xs opacity-20 hover:opacity-50 transition-opacity underline w-full"
                style={{ fontFamily: 'Courier New, monospace' }}>
                run a new audit
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  )
}

// ─── Listener profile bar ─────────────────────────────────────────────────────

function ProfileBar({ dim, value, color }: {
  dim:   keyof ListenerProfile
  value: number
  color: string
}) {
  const meta = PROFILE_LABELS[dim]
  return (
    <div>
      <div className="flex justify-between text-xs opacity-40 mb-1"
        style={{ fontFamily: 'Courier New, monospace' }}>
        <span>{meta.label}</span>
        <span>{value}</span>
      </div>
      <div className="h-px bg-[#1f1f1f] relative">
        <motion.div
          className="absolute inset-y-0 left-0"
          style={{ background: color, opacity: 0.7 }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
        />
      </div>
      <div className="flex justify-between text-xs opacity-20 mt-1"
        style={{ fontFamily: 'Courier New, monospace' }}>
        <span>{meta.low}</span>
        <span>{meta.high}</span>
      </div>
    </div>
  )
}

// ─── Waveform SVG ─────────────────────────────────────────────────────────────

function Waveform({ valence, energy, color, width = 280, height = 48 }: {
  valence: number[]
  energy:  number[]
  color:   string
  width?:  number
  height?: number
}) {
  function toPath(values: number[]): string {
    if (values.length < 2) return ''
    const step = width / (values.length - 1)
    const pts  = values.map((v, i) => [i * step, (1 - v) * height])

    let d = `M ${pts[0][0]} ${pts[0][1]}`
    for (let i = 1; i < pts.length; i++) {
      const [x1, y1] = pts[i - 1]
      const [x2, y2] = pts[i]
      const cx = (x1 + x2) / 2
      d += ` C ${cx} ${y1} ${cx} ${y2} ${x2} ${y2}`
    }
    return d
  }

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}
      style={{ overflow: 'visible' }}>
      <path d={toPath(energy)}  fill="none" stroke={color} strokeWidth="1.5" opacity="0.25" />
      <path d={toPath(valence)} fill="none" stroke={color} strokeWidth="2"   opacity="0.6" />
    </svg>
  )
}

// ─── Share card ───────────────────────────────────────────────────────────────

function ShareCard({ archetypeName, shadowName, confession, color, shadowColor,
  handle, waveformData, driftDetected, quizMode }: {
  archetypeName: string
  shadowName:    string
  confession:    string
  color:         string
  shadowColor:   string
  handle:        string
  waveformData:  { valence: number[]; energy: number[] }
  driftDetected: boolean
  quizMode:      boolean
}) {
  const now   = new Date()
  const stamp = now.toLocaleString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div id="vibe-card"
      className="relative w-full flex flex-col justify-between p-8 border border-[#2a2a2a] overflow-hidden"
      style={{ background: '#0d0d0d', minHeight: '340px' }}>

      {/* Top */}
      <div>
        <p className="text-xs tracking-[0.25em] uppercase opacity-40 mb-1"
          style={{ fontFamily: 'Courier New, monospace' }}>VIBE-ID</p>
        {handle !== 'you' && (
          <p className="text-xs opacity-25" style={{ fontFamily: 'Courier New, monospace' }}>
            @{handle}
          </p>
        )}
      </div>

      {/* Main */}
      <div className="my-6">
        <p className="text-xs tracking-[0.2em] uppercase opacity-35 mb-3"
          style={{ fontFamily: 'Courier New, monospace' }}>
          {quizMode ? 'music type:' : 'primary type'}
        </p>

        {quizMode ? (
          <div className="text-3xl sm:text-4xl font-bold leading-none mb-4 tracking-widest"
            style={{ fontFamily: 'Georgia, serif', color, letterSpacing: '-0.01em',
                     filter: 'blur(8px)', userSelect: 'none' }}>
            {archetypeName}
          </div>
        ) : (
          <h2 className="text-3xl sm:text-4xl font-bold leading-none mb-4"
            style={{ fontFamily: 'Georgia, serif', color, letterSpacing: '-0.02em' }}>
            {archetypeName}
          </h2>
        )}

        <p className="text-sm italic leading-relaxed opacity-80 mb-4"
          style={{ fontFamily: 'Georgia, serif' }}>
          &ldquo;{confession}&rdquo;
        </p>

        {!quizMode && (
          <div className="flex items-center gap-2">
            <p className="text-xs opacity-30 uppercase tracking-widest"
              style={{ fontFamily: 'Courier New, monospace' }}>shadow:</p>
            <p className="text-xs font-medium"
              style={{ fontFamily: 'Courier New, monospace', color: shadowColor }}>
              {shadowName}
            </p>
            {driftDetected && (
              <p className="text-xs ml-auto opacity-40 tracking-widest"
                style={{ fontFamily: 'Courier New, monospace', color }}>
                SHIFT DETECTED
              </p>
            )}
          </div>
        )}

        {quizMode && (
          <p className="text-xs opacity-35 tracking-widest uppercase mt-2"
            style={{ fontFamily: 'Courier New, monospace' }}>
            what type am i? → vibe-id.app
          </p>
        )}
      </div>

      {/* Waveform */}
      <div className="mb-4">
        <Waveform
          valence={waveformData.valence}
          energy={waveformData.energy}
          color={color}
        />
      </div>

      {/* Footer */}
      <div className="flex justify-between items-end">
        <p className="text-xs opacity-20" style={{ fontFamily: 'Courier New, monospace' }}>
          vibe-id.app
        </p>
        <p className="text-xs opacity-15" style={{ fontFamily: 'Courier New, monospace' }}>
          {stamp}
        </p>
      </div>
    </div>
  )
}
