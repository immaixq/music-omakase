'use client'

import { useEffect, useRef } from 'react'
import type { ArchetypeKey } from '@/lib/archetypes'

interface Props {
  archetype:  ArchetypeKey
  color:      string
  size?:      number
  animate?:   boolean
  className?: string
}

interface InnerProps {
  color:      string
  size:       number
  animate:    boolean
  className?: string
}

export function ArchetypeArt({ archetype, color, size = 120, animate = true, className }: Props) {
  const s = size
  const a = animate
  switch (archetype) {
    case 'late-night-driver': return <LateNightDriverArt color={color} size={s} animate={a} className={className} />
    case 'hype-architect':    return <HypeArchitectArt   color={color} size={s} animate={a} className={className} />
    case 'soft-launch':       return <SoftLaunchArt      color={color} size={s} animate={a} className={className} />
    case 'the-static':        return <TheStaticArt       color={color} size={s} animate={a} className={className} />
  }
}

// ─── Late Night Driver ────────────────────────────────────────────────────────
// Converging horizon lines — like headlights in a tunnel at night

function LateNightDriverArt({ color, size, animate, className }: InnerProps) {
  const cx = size / 2
  const cy = size * 0.52   // vanishing point slightly below center
  const lineCount = 9

  const lines = Array.from({ length: lineCount }, (_, i) => {
    const spread = size * 0.48
    const angle  = -spread + (i / (lineCount - 1)) * spread * 2
    const x1 = cx + angle
    const y1 = size + 4
    const x2 = cx + angle * 0.04
    const y2 = cy
    return { x1, y1, x2, y2, i }
  })

  // Horizontal "road" lines — perspective
  const roadLines = [0.72, 0.82, 0.91, 1.0].map(t => ({
    y:  cy + (size - cy) * t,
    w:  size * t * 0.9,
  }))

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
      className={className} aria-hidden>
      <defs>
        <radialGradient id="lnd-glow" cx="50%" cy="52%" r="50%">
          <stop offset="0%"   stopColor={color} stopOpacity="0.12" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
        {animate && (
          <style>{`
            @keyframes lnd-pulse { 0%,100%{opacity:.55} 50%{opacity:.9} }
            @keyframes lnd-road  { 0%{stroke-dashoffset:0} 100%{stroke-dashoffset:-24} }
            .lnd-line { animation: lnd-pulse 3.2s ease-in-out infinite }
            .lnd-road { animation: lnd-road  1.8s linear infinite }
          `}</style>
        )}
      </defs>

      {/* Glow at vanishing point */}
      <circle cx={cx} cy={cy} r={size * 0.38} fill="url(#lnd-glow)" />

      {/* Perspective lines */}
      {lines.map(({ x1, y1, x2, y2, i }) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
          stroke={color}
          strokeWidth={i === 0 || i === lineCount - 1 ? 1.5 : 0.75}
          opacity={0.2 + (i === Math.floor(lineCount / 2) ? 0.4 : 0)}
          className={animate ? 'lnd-line' : ''}
          style={animate ? { animationDelay: `${i * 0.15}s` } : {}}
        />
      ))}

      {/* Road depth lines */}
      {roadLines.map(({ y, w }, i) => (
        <line key={i}
          x1={cx - w / 2} y1={y} x2={cx + w / 2} y2={y}
          stroke={color} strokeWidth="0.75"
          strokeDasharray="4 6"
          opacity={0.15 + i * 0.06}
          className={animate ? 'lnd-road' : ''}
          style={animate ? { animationDelay: `${i * 0.12}s` } : {}}
        />
      ))}

      {/* Vanishing point dot */}
      <circle cx={cx} cy={cy} r="2.5" fill={color} opacity="0.7" />
      {animate && (
        <circle cx={cx} cy={cy} r="5" fill="none" stroke={color} strokeWidth="1" opacity="0.3">
          <animate attributeName="r" values="3;10;3" dur="3s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.4;0;0.4" dur="3s" repeatCount="indefinite" />
        </circle>
      )}
    </svg>
  )
}

// ─── Hype Architect ───────────────────────────────────────────────────────────
// Precision dot grid — perfect, systematic, high-contrast

function HypeArchitectArt({ color, size, animate, className }: InnerProps) {
  const cols = 8
  const rows = 8
  const pad  = size * 0.1
  const stepX = (size - pad * 2) / (cols - 1)
  const stepY = (size - pad * 2) / (rows - 1)

  const dots = Array.from({ length: cols * rows }, (_, i) => {
    const col = i % cols
    const row = Math.floor(i / cols)
    // Distance from center — closer = brighter
    const dx = (col - (cols - 1) / 2) / (cols / 2)
    const dy = (row - (rows - 1) / 2) / (rows / 2)
    const dist = Math.sqrt(dx * dx + dy * dy)
    return {
      x:       pad + col * stepX,
      y:       pad + row * stepY,
      r:       dist < 0.3 ? 2.5 : dist < 0.7 ? 1.5 : 1,
      opacity: Math.max(0.15, 1 - dist * 0.65),
      delay:   (col + row) * 0.04,
    }
  })

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
      className={className} aria-hidden>
      {animate && (
        <style>{`
          @keyframes ha-dot { 0%,100%{opacity:var(--op)} 50%{opacity:calc(var(--op)*1.6)} }
          .ha-dot { animation: ha-dot 2.4s ease-in-out infinite }
        `}</style>
      )}
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={d.r}
          fill={color}
          opacity={d.opacity}
          className={animate ? 'ha-dot' : ''}
          style={animate ? {
            ['--op' as string]: d.opacity,
            animationDelay: `${d.delay}s`,
          } : {}}
        />
      ))}
      {/* Cross-hair lines through center */}
      <line x1={size/2} y1={pad} x2={size/2} y2={size-pad}
        stroke={color} strokeWidth="0.5" opacity="0.15" />
      <line x1={pad} y1={size/2} x2={size-pad} y2={size/2}
        stroke={color} strokeWidth="0.5" opacity="0.15" />
    </svg>
  )
}

// ─── Soft Launch ──────────────────────────────────────────────────────────────
// Concentric ellipses — soft, organic, expanding slowly

function SoftLaunchArt({ color, size, animate, className }: InnerProps) {
  const cx  = size / 2
  const cy  = size / 2
  const rings = [0.18, 0.30, 0.40, 0.47].map((r, i) => ({
    rx:      size * r,
    ry:      size * r * 0.72,  // slightly squashed = warmer
    opacity: 0.55 - i * 0.1,
    delay:   i * 0.4,
    width:   i === 0 ? 2 : 1,
  }))

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
      className={className} aria-hidden>
      <defs>
        <radialGradient id="sl-fill" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
        {animate && (
          <style>{`
            @keyframes sl-breathe { 0%,100%{transform:scale(1)} 50%{transform:scale(1.04)} }
            .sl-ring { transform-origin: center; animation: sl-breathe 4s ease-in-out infinite }
          `}</style>
        )}
      </defs>

      <ellipse cx={cx} cy={cy} rx={size*0.44} ry={size*0.38} fill="url(#sl-fill)" />

      {rings.map((r, i) => (
        <ellipse key={i} cx={cx} cy={cy} rx={r.rx} ry={r.ry}
          fill="none" stroke={color}
          strokeWidth={r.width}
          opacity={r.opacity}
          className={animate ? 'sl-ring' : ''}
          style={animate ? { animationDelay: `${r.delay}s` } : {}}
        />
      ))}

      {/* Small center point */}
      <circle cx={cx} cy={cy} r="2" fill={color} opacity="0.6" />
    </svg>
  )
}

// ─── The Static ───────────────────────────────────────────────────────────────
// Interference field — scattered rectangles at random sizes/rotations

function TheStaticArt({ color, size, animate, className }: InnerProps) {
  const ref = useRef<SVGSVGElement>(null)

  // Seeded pseudo-random for consistent layout
  function rand(seed: number) {
    let s = seed
    return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff }
  }
  const r = rand(42)

  const rects = Array.from({ length: 28 }, (_, i) => ({
    x:       r() * size,
    y:       r() * size,
    w:       2 + r() * 14,
    h:       1 + r() * 4,
    angle:   r() * 360,
    opacity: 0.08 + r() * 0.45,
    delay:   r() * 2,
    dur:     1.2 + r() * 1.6,
  }))

  return (
    <svg ref={ref} width={size} height={size} viewBox={`0 0 ${size} ${size}`}
      className={className} aria-hidden style={{ overflow: 'hidden' }}>
      {animate && (
        <style>{`
          @keyframes st-flicker { 0%,100%{opacity:var(--op)} 45%{opacity:0} 55%{opacity:var(--op)} }
          .st-rect { animation: st-flicker var(--dur) step-end infinite }
        `}</style>
      )}
      {rects.map((rec, i) => (
        <rect key={i}
          x={rec.x - rec.w / 2}
          y={rec.y - rec.h / 2}
          width={rec.w}
          height={rec.h}
          fill={color}
          opacity={rec.opacity}
          transform={`rotate(${rec.angle} ${rec.x} ${rec.y})`}
          className={animate ? 'st-rect' : ''}
          style={animate ? {
            ['--op'  as string]: rec.opacity,
            ['--dur' as string]: `${rec.dur}s`,
            animationDelay: `${rec.delay}s`,
          } : {}}
        />
      ))}
      {/* Horizontal scan line */}
      {[0.25, 0.5, 0.75].map((t, i) => (
        <line key={i}
          x1={0} y1={size * t} x2={size} y2={size * t}
          stroke={color} strokeWidth="0.5"
          opacity="0.1"
        />
      ))}
    </svg>
  )
}
