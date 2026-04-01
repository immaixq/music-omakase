'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { CurrentState, MoodQuadrant } from '@/lib/currentState'
import { getResonanceLine } from '@/lib/currentState'

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

interface Props {
  state:        CurrentState
  accentColor:  string
}

export function CurrentStateReveal({ state, accentColor }: Props) {
  const [unlocked,      setUnlocked]      = useState(false)
  const [pickedWord,    setPickedWord]    = useState<string | null>(null)
  const [resonanceLine, setResonanceLine] = useState<string | null>(null)

  const meta = QUADRANT_META[state.quadrant]

  function pickWord(word: string) {
    if (pickedWord) return
    setPickedWord(word)
    setResonanceLine(getResonanceLine(state.quadrant, word))
  }

  return (
    <div className="border-t border-[#1f1f1f] pt-8 mt-2">
      {/* Header */}
      <p className="text-xs tracking-[0.25em] uppercase opacity-35 mb-4"
        style={{ fontFamily: 'Courier New, monospace' }}>
        right now
      </p>

      {!unlocked ? (
        /* Locked state — teaser */
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
              Show me what's happening right now
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
            {/* Mood quadrant badge + trend */}
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

              {/* Resonance response */}
              <AnimatePresence>
                {resonanceLine && (
                  <motion.p
                    key="resonance"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.15 }}
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
                {state.vsBaseline === 'brighter'    && 'Note: this is brighter than your 6-month average.'}
                {state.vsBaseline === 'darker'      && 'Note: this is darker than your 6-month average.'}
                {state.vsBaseline === 'more_intense' && 'Note: the intensity here is higher than your usual baseline.'}
                {state.vsBaseline === 'quieter'     && 'Note: this is quieter than your usual baseline.'}
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  )
}
