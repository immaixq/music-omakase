'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

const STEPS = [
  'scanning your last 6 months...',
  'finding the 2am patterns...',
  'reading the songs you played on repeat...',
  'cross-referencing what you skip...',
  'running the audit...',
  'almost done profiling you...',
]

const STEP_MS = 1100

function getTimeNote(): string | null {
  const hour = new Date().getHours()
  if (hour >= 22 || hour < 3)  return "it's late. this feels right."
  if (hour >= 3  && hour < 6)  return "it's very late. the data noticed."
  if (hour >= 6  && hour < 9)  return "starting the day with data."
  return null
}

export default function LoadingPage() {
  const router              = useRouter()
  const [step, setStep]     = useState(0)
  const [timeNote]          = useState<string | null>(getTimeNote)
  const analyzed            = useRef(false)

  useEffect(() => {
    if (step >= STEPS.length - 1) return
    const t = setTimeout(() => setStep(s => s + 1), STEP_MS)
    return () => clearTimeout(t)
  }, [step])

  useEffect(() => {
    if (analyzed.current) return
    analyzed.current = true

    const handle        = sessionStorage.getItem('handle') ?? 'you'
    const token         = sessionStorage.getItem('spotify_token') ?? null
    const exportPayload = sessionStorage.getItem('export_payload') ?? null

    const body = exportPayload
      ? { handle, exportData: JSON.parse(exportPayload) }
      : { handle, token }

    const minDelay    = new Promise(r => setTimeout(r, STEP_MS * STEPS.length))
    const fetchResult = fetch('/api/analyze', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    }).then(r => r.json())

    Promise.all([minDelay, fetchResult])
      .then(([, data]) => {
        sessionStorage.setItem('vibe_result', JSON.stringify(data))
        router.replace(`/result/${data.archetype}`)
      })
      .catch(() => router.replace('/'))
  }, [router])

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="max-w-sm w-full">
        <p
          className="text-xs tracking-[0.3em] uppercase mb-2 opacity-30"
          style={{ fontFamily: 'Courier New, monospace' }}
        >
          VIBE-ID · AUDIT IN PROGRESS
        </p>
        {timeNote && (
          <p
            className="text-xs mb-8 opacity-25 italic"
            style={{ fontFamily: 'Courier New, monospace' }}
          >
            {timeNote}
          </p>
        )}
        {!timeNote && <div className="mb-10" />}

        <div className="space-y-3">
          {STEPS.map((s, i) => (
            <p
              key={s}
              className="text-sm transition-all duration-500"
              style={{
                fontFamily: 'Courier New, monospace',
                opacity:    i < step ? 0.25 : i === step ? 1 : 0.1,
                transform:  i === step ? 'translateX(4px)' : 'none',
              }}
            >
              {i < step ? '✓ ' : i === step ? '> ' : '  '}
              {s}
            </p>
          ))}
        </div>

        <div className="mt-10 h-px bg-[#1f1f1f] relative overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-[#f0ede6] transition-all duration-700"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>
    </main>
  )
}
