'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { archetypes, type ArchetypeKey } from '@/lib/archetypes'
import type { AnalyzeResult } from '@/lib/mock'

type Phase = 'name' | 'confession' | 'shadow' | 'full' | 'card'

const OPPOSITE: Record<ArchetypeKey, ArchetypeKey> = {
  'late-night-driver': 'hype-architect',
  'hype-architect':    'late-night-driver',
  'soft-launch':       'the-static',
  'the-static':        'soft-launch',
}

export default function ResultPage() {
  const params    = useParams<{ type: string }>()
  const router    = useRouter()
  const key       = params.type as ArchetypeKey
  const archetype = archetypes[key]

  const [result, setResult] = useState<AnalyzeResult | null>(null)
  const [phase,  setPhase]  = useState<Phase>('name')

  useEffect(() => {
    if (!archetype) { router.replace('/'); return }
    const stored = sessionStorage.getItem('vibe_result')
    if (!stored)  { router.replace('/'); return }

    const parsed = JSON.parse(stored) as AnalyzeResult
    // Stale data guard — redirect back if shape is missing required fields
    if (!parsed.shadowArchetype || !archetypes[parsed.shadowArchetype]) {
      sessionStorage.removeItem('vibe_result')
      router.replace('/')
      return
    }
    setResult(parsed)

    const timers = [
      setTimeout(() => setPhase('confession'), 1000),
      setTimeout(() => setPhase('shadow'),     2400),
      setTimeout(() => setPhase('full'),       3600),
      setTimeout(() => setPhase('card'),       4800),
    ]
    return () => timers.forEach(clearTimeout)
  }, [archetype, router])

  if (!archetype || !result) return null

  const shadow   = archetypes[result.shadowArchetype] ?? archetypes['the-static']
  const opposite = archetypes[OPPOSITE[key]]          ?? archetypes['hype-architect']
  const handle   = result.handle !== 'you' ? `@${result.handle}` : null

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-16 relative">
      <div aria-hidden className="absolute top-0 left-0 right-0 h-px" style={{ background: archetype.color, opacity: 0.6 }} />

      <div className="max-w-lg w-full">
        {/* Label */}
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} transition={{ duration: 0.6 }}
          className="text-xs tracking-[0.3em] uppercase mb-2"
          style={{ fontFamily: 'Courier New, monospace' }}
        >
          AUDIT COMPLETE
        </motion.p>

        {handle && (
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} transition={{ duration: 0.6, delay: 0.2 }}
            className="text-sm mb-6 opacity-60"
            style={{ fontFamily: 'Courier New, monospace' }}
          >
            {handle}
          </motion.p>
        )}

        {/* Primary type */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="text-5xl sm:text-6xl font-bold leading-none mb-8"
          style={{ fontFamily: 'Georgia, serif', letterSpacing: '-0.02em', color: archetype.color }}
        >
          {archetype.name}
        </motion.h1>

        {/* Confession line */}
        <AnimatePresence>
          {(['confession', 'shadow', 'full', 'card'] as Phase[]).includes(phase) && (
            <motion.p
              key="confession"
              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="text-lg sm:text-xl mb-8 italic"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              &ldquo;{result.confessionLine}&rdquo;
            </motion.p>
          )}
        </AnimatePresence>

        {/* Shadow type */}
        <AnimatePresence>
          {(['shadow', 'full', 'card'] as Phase[]).includes(phase) && (
            <motion.div
              key="shadow"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-8 border border-[#2a2a2a] px-5 py-4"
            >
              <p className="text-xs tracking-[0.2em] uppercase opacity-35 mb-2"
                style={{ fontFamily: 'Courier New, monospace' }}>
                shadow type
              </p>
              <p className="text-base font-semibold mb-1"
                style={{ fontFamily: 'Georgia, serif', color: shadow.color }}>
                {shadow.name}
              </p>
              <p className="text-xs opacity-50 italic"
                style={{ fontFamily: 'Georgia, serif' }}>
                &ldquo;{result.shadowLine}&rdquo;
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Full description + highlight */}
        <AnimatePresence>
          {(['full', 'card'] as Phase[]).includes(phase) && (
            <motion.div
              key="full"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-5 mb-10"
            >
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

        {/* Card + actions */}
        <AnimatePresence>
          {phase === 'card' && (
            <motion.div
              key="card"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <ShareCard
                archetypeName={archetype.name}
                shadowName={shadow.name}
                confession={result.confessionLine}
                color={archetype.color}
                shadowColor={shadow.color}
                handle={result.handle}
              />

              <p className="mt-4 text-xs opacity-40 text-center"
                style={{ fontFamily: 'Courier New, monospace' }}>
                Screenshot this. Post it. See if your friends can guess your type.
              </p>

              {/* Compatibility CTA */}
              <div className="mt-10 pt-8 border-t border-[#1f1f1f] space-y-4">
                <p className="text-xs opacity-40 uppercase tracking-widest"
                  style={{ fontFamily: 'Courier New, monospace' }}>
                  How compatible are you?
                </p>
                <button
                  onClick={() => router.push(`/compatibility/${key}`)}
                  className="group w-full flex items-center justify-between border border-[#2a2a2a] px-5 py-3 text-sm hover:border-[#f0ede6] transition-colors"
                  style={{ fontFamily: 'Courier New, monospace' }}
                >
                  <span className="opacity-60">Check compatibility with a friend</span>
                  <span className="opacity-30 group-hover:opacity-80 transition-opacity">→</span>
                </button>

                <p className="text-xs opacity-25"
                  style={{ fontFamily: 'Courier New, monospace' }}>
                  Your opposite type: <span style={{ color: opposite.color }}>{opposite.name}</span>
                </p>
              </div>

              <button
                onClick={() => { sessionStorage.clear(); router.replace('/') }}
                className="mt-8 text-xs opacity-20 hover:opacity-50 transition-opacity underline"
                style={{ fontFamily: 'Courier New, monospace' }}
              >
                run a new audit
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  )
}

function ShareCard({
  archetypeName, shadowName, confession, color, shadowColor, handle,
}: {
  archetypeName: string
  shadowName:    string
  confession:    string
  color:         string
  shadowColor:   string
  handle:        string
}) {
  return (
    <div
      id="vibe-card"
      className="relative w-full flex flex-col justify-between p-8 border border-[#2a2a2a] overflow-hidden"
      style={{ background: '#0d0d0d', minHeight: '320px' }}
    >
      <div>
        <p className="text-xs tracking-[0.25em] uppercase opacity-40 mb-1"
          style={{ fontFamily: 'Courier New, monospace' }}>
          VIBE-ID
        </p>
        {handle !== 'you' && (
          <p className="text-xs opacity-30 mb-1" style={{ fontFamily: 'Courier New, monospace' }}>
            @{handle}
          </p>
        )}
      </div>

      <div className="my-6">
        <p className="text-xs tracking-[0.2em] uppercase opacity-35 mb-3"
          style={{ fontFamily: 'Courier New, monospace' }}>
          primary type
        </p>
        <h2 className="text-3xl sm:text-4xl font-bold leading-none mb-4"
          style={{ fontFamily: 'Georgia, serif', color, letterSpacing: '-0.02em' }}>
          {archetypeName}
        </h2>
        <p className="text-sm italic leading-relaxed opacity-80 mb-5"
          style={{ fontFamily: 'Georgia, serif' }}>
          &ldquo;{confession}&rdquo;
        </p>
        <div className="flex items-center gap-2">
          <p className="text-xs opacity-30 uppercase tracking-widest"
            style={{ fontFamily: 'Courier New, monospace' }}>
            shadow:
          </p>
          <p className="text-xs font-medium"
            style={{ fontFamily: 'Courier New, monospace', color: shadowColor }}>
            {shadowName}
          </p>
        </div>
      </div>

      {/* Dot constellation */}
      <div className="flex items-end gap-1 opacity-20 mb-4" aria-hidden>
        {Array.from({ length: 12 }, (_, i) => (
          <div key={i} className="rounded-full"
            style={{
              width:           i % 3 === 0 ? 6 : i % 2 === 0 ? 4 : 3,
              height:          i % 3 === 0 ? 6 : i % 2 === 0 ? 4 : 3,
              backgroundColor: i > 6 ? shadowColor : color,
              opacity:         0.3 + (i / 12) * 0.7,
            }}
          />
        ))}
      </div>

      <p className="text-xs opacity-20" style={{ fontFamily: 'Courier New, monospace' }}>
        vibe-id.app
      </p>
    </div>
  )
}
