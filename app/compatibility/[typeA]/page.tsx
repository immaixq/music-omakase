'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { archetypes, type ArchetypeKey } from '@/lib/archetypes'
import { getCompatibilityReport } from '@/lib/compatibility'

const ALL_TYPES: ArchetypeKey[] = [
  'late-night-driver',
  'hype-architect',
  'soft-launch',
  'the-static',
]

export default function CompatibilityPage() {
  const params   = useParams<{ typeA: string }>()
  const router   = useRouter()
  const typeA    = params.typeA as ArchetypeKey
  const archetypeA = archetypes[typeA]

  const [typeB, setTypeB]     = useState<ArchetypeKey | null>(null)
  const [revealed, setRevealed] = useState(false)

  if (!archetypeA) { router.replace('/'); return null }

  const report = typeB ? getCompatibilityReport(typeA, typeB) : null
  const archetypeB = typeB ? archetypes[typeB] : null

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-16">
      <div className="max-w-lg w-full">
        <button
          onClick={() => router.back()}
          className="text-xs opacity-30 hover:opacity-60 transition-opacity mb-10 uppercase tracking-widest"
          style={{ fontFamily: 'Courier New, monospace' }}
        >
          ← back
        </button>

        <p className="text-xs tracking-[0.3em] uppercase opacity-40 mb-6"
          style={{ fontFamily: 'Courier New, monospace' }}>
          COMPATIBILITY REPORT
        </p>

        {/* Type A — locked */}
        <div className="mb-8">
          <p className="text-xs opacity-35 uppercase tracking-widest mb-2"
            style={{ fontFamily: 'Courier New, monospace' }}>
            you
          </p>
          <p className="text-2xl font-bold"
            style={{ fontFamily: 'Georgia, serif', color: archetypeA.color }}>
            {archetypeA.name}
          </p>
        </div>

        {/* Type B — picker */}
        <div className="mb-10">
          <p className="text-xs opacity-35 uppercase tracking-widest mb-3"
            style={{ fontFamily: 'Courier New, monospace' }}>
            them — pick their type
          </p>
          <div className="grid grid-cols-2 gap-2">
            {ALL_TYPES.filter(t => t !== typeA).map(t => {
              const a = archetypes[t]
              const selected = typeB === t
              return (
                <button
                  key={t}
                  onClick={() => { setTypeB(t); setRevealed(false) }}
                  className="text-left px-4 py-3 border transition-all duration-200 text-sm"
                  style={{
                    fontFamily:  'Courier New, monospace',
                    borderColor: selected ? a.color : '#2a2a2a',
                    color:       selected ? a.color : '#f0ede6',
                    background:  selected ? 'rgba(255,255,255,0.03)' : 'transparent',
                  }}
                >
                  {a.name}
                </button>
              )
            })}
            {/* Same type */}
            <button
              onClick={() => { setTypeB(typeA); setRevealed(false) }}
              className="text-left px-4 py-3 border transition-all duration-200 text-sm col-span-2"
              style={{
                fontFamily:  'Courier New, monospace',
                borderColor: typeB === typeA ? archetypeA.color : '#2a2a2a',
                color:       typeB === typeA ? archetypeA.color : '#f0ede6',
                background:  typeB === typeA ? 'rgba(255,255,255,0.03)' : 'transparent',
              }}
            >
              {archetypeA.name} (same type)
            </button>
          </div>
        </div>

        {/* Reveal button */}
        <AnimatePresence>
          {typeB && !revealed && (
            <motion.button
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              onClick={() => setRevealed(true)}
              className="group w-full flex items-center justify-between border border-[#f0ede6] px-8 py-4 text-sm tracking-[0.15em] uppercase transition-all hover:bg-[#f0ede6] hover:text-[#0d0d0d] mb-10"
              style={{ fontFamily: 'Courier New, monospace' }}
            >
              Read the report
              <span className="opacity-40 group-hover:opacity-100 transition-opacity">→</span>
            </motion.button>
          )}
        </AnimatePresence>

        {/* Report */}
        <AnimatePresence>
          {revealed && report && archetypeB && (
            <motion.div
              key={typeB}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              {/* Score */}
              <div className="flex items-end gap-4 mb-2">
                <span className="text-5xl font-bold"
                  style={{ fontFamily: 'Georgia, serif', color: archetypeA.color }}>
                  {report.score}
                </span>
                <span className="text-sm opacity-40 mb-2" style={{ fontFamily: 'Courier New, monospace' }}>
                  / 100 compatibility
                </span>
              </div>

              {/* Score bar */}
              <div className="h-px bg-[#1f1f1f] relative mb-6">
                <motion.div
                  className="absolute inset-y-0 left-0"
                  initial={{ width: 0 }}
                  animate={{ width: `${report.score}%` }}
                  transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
                  style={{ background: archetypeA.color }}
                />
              </div>

              {/* Verdict */}
              <p className="text-xl italic leading-snug"
                style={{ fontFamily: 'Georgia, serif' }}>
                &ldquo;{report.verdict}&rdquo;
              </p>

              {/* Dynamic */}
              <p className="text-sm leading-7 opacity-65"
                style={{ fontFamily: 'Courier New, monospace' }}>
                {report.dynamic}
              </p>

              {/* Warning + Chemistry */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="border border-[#2a2a2a] px-4 py-4">
                  <p className="text-xs uppercase tracking-widest opacity-35 mb-2"
                    style={{ fontFamily: 'Courier New, monospace' }}>
                    tension
                  </p>
                  <p className="text-xs leading-5 opacity-60 italic"
                    style={{ fontFamily: 'Georgia, serif' }}>
                    {report.warning}
                  </p>
                </div>
                <div className="border border-[#2a2a2a] px-4 py-4">
                  <p className="text-xs uppercase tracking-widest opacity-35 mb-2"
                    style={{ fontFamily: 'Courier New, monospace' }}>
                    chemistry
                  </p>
                  <p className="text-xs leading-5 opacity-60 italic"
                    style={{ fontFamily: 'Georgia, serif' }}>
                    {report.chemistry}
                  </p>
                </div>
              </div>

              {/* Share nudge */}
              <div className="pt-6 border-t border-[#1f1f1f]">
                <p className="text-xs opacity-30 text-center"
                  style={{ fontFamily: 'Courier New, monospace' }}>
                  Screenshot this. Tag them. Let them disagree.
                </p>
              </div>

              <button
                onClick={() => router.replace('/')}
                className="w-full text-xs opacity-20 hover:opacity-50 transition-opacity underline pt-2"
                style={{ fontFamily: 'Courier New, monospace' }}
              >
                start a new audit
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  )
}
