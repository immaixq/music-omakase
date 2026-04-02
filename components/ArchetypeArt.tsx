'use client'

import { useRef } from 'react'
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
    case 'late-night-driver':  return <LateNightDriverArt   color={color} size={s} animate={a} className={className} />
    case 'hype-architect':     return <HypeArchitectArt     color={color} size={s} animate={a} className={className} />
    case 'soft-launch':        return <SoftLaunchArt        color={color} size={s} animate={a} className={className} />
    case 'the-static':         return <TheStaticArt         color={color} size={s} animate={a} className={className} />
    case 'the-completionist':  return <TheCompletionistArt  color={color} size={s} animate={a} className={className} />
    case 'the-signal':         return <TheSignalArt         color={color} size={s} animate={a} className={className} />
    case 'the-mainframe':      return <TheMainframeArt      color={color} size={s} animate={a} className={className} />
    case 'the-time-capsule':   return <TheTimeCapsuleArt    color={color} size={s} animate={a} className={className} />
    default:                   return <SoftLaunchArt        color={color} size={s} animate={a} className={className} />
  }
}

// ─── Late Night Driver ────────────────────────────────────────────────────────
// Converging horizon lines — headlights pulling toward a vanishing point at night

function LateNightDriverArt({ color, size, animate, className }: InnerProps) {
  const cx = size / 2
  const cy = size * 0.52
  const lineCount = 9

  const lines = Array.from({ length: lineCount }, (_, i) => {
    const spread = size * 0.48
    const angle  = -spread + (i / (lineCount - 1)) * spread * 2
    return { x1: cx + angle, y1: size + 4, x2: cx + angle * 0.04, y2: cy, i }
  })

  const roadLines = [0.72, 0.82, 0.91, 1.0].map(t => ({
    y: cy + (size - cy) * t,
    w: size * t * 0.9,
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
      <circle cx={cx} cy={cy} r={size * 0.38} fill="url(#lnd-glow)" />
      {lines.map(({ x1, y1, x2, y2, i }) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
          stroke={color}
          strokeWidth={i === 0 || i === lineCount - 1 ? 1.5 : 0.75}
          opacity={0.2 + (i === Math.floor(lineCount / 2) ? 0.4 : 0)}
          className={animate ? 'lnd-line' : ''}
          style={animate ? { animationDelay: `${i * 0.15}s` } : {}}
        />
      ))}
      {roadLines.map(({ y, w }, i) => (
        <line key={i} x1={cx - w / 2} y1={y} x2={cx + w / 2} y2={y}
          stroke={color} strokeWidth="0.75" strokeDasharray="4 6"
          opacity={0.15 + i * 0.06}
          className={animate ? 'lnd-road' : ''}
          style={animate ? { animationDelay: `${i * 0.12}s` } : {}}
        />
      ))}
      <circle cx={cx} cy={cy} r="2.5" fill={color} opacity="0.7" />
      {animate && (
        <circle cx={cx} cy={cy} r="5" fill="none" stroke={color} strokeWidth="1" opacity="0.3">
          <animate attributeName="r"       values="3;10;3"     dur="3s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.4;0;0.4"  dur="3s" repeatCount="indefinite" />
        </circle>
      )}
    </svg>
  )
}

// ─── Hype Architect ───────────────────────────────────────────────────────────
// Precision dot grid — systematic, high-contrast, engineered

function HypeArchitectArt({ color, size, animate, className }: InnerProps) {
  const cols = 8
  const rows = 8
  const pad  = size * 0.1
  const stepX = (size - pad * 2) / (cols - 1)
  const stepY = (size - pad * 2) / (rows - 1)

  const dots = Array.from({ length: cols * rows }, (_, i) => {
    const col  = i % cols
    const row  = Math.floor(i / cols)
    const dx   = (col - (cols - 1) / 2) / (cols / 2)
    const dy   = (row - (rows - 1) / 2) / (rows / 2)
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
          fill={color} opacity={d.opacity}
          className={animate ? 'ha-dot' : ''}
          style={animate ? { ['--op' as string]: d.opacity, animationDelay: `${d.delay}s` } : {}}
        />
      ))}
      <line x1={size/2} y1={pad} x2={size/2} y2={size-pad}
        stroke={color} strokeWidth="0.5" opacity="0.15" />
      <line x1={pad} y1={size/2} x2={size-pad} y2={size/2}
        stroke={color} strokeWidth="0.5" opacity="0.15" />
    </svg>
  )
}

// ─── Soft Launch ──────────────────────────────────────────────────────────────
// Concentric ellipses — warm, organic, breathing slowly

function SoftLaunchArt({ color, size, animate, className }: InnerProps) {
  const cx   = size / 2
  const cy   = size / 2
  const rings = [0.18, 0.30, 0.40, 0.47].map((r, i) => ({
    rx:      size * r,
    ry:      size * r * 0.72,
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
          strokeWidth={r.width} opacity={r.opacity}
          className={animate ? 'sl-ring' : ''}
          style={animate ? { animationDelay: `${r.delay}s` } : {}}
        />
      ))}
      <circle cx={cx} cy={cy} r="2" fill={color} opacity="0.6" />
    </svg>
  )
}

// ─── The Static ───────────────────────────────────────────────────────────────
// Interference field — scattered rectangles at random sizes/rotations, flickering

function TheStaticArt({ color, size, animate, className }: InnerProps) {
  const ref = useRef<SVGSVGElement>(null)

  function rand(seed: number) {
    let s = seed
    return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff }
  }
  const r = rand(42)

  const rects = Array.from({ length: 28 }, () => ({
    x: r() * size, y: r() * size,
    w: 2 + r() * 14, h: 1 + r() * 4,
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
          x={rec.x - rec.w / 2} y={rec.y - rec.h / 2}
          width={rec.w} height={rec.h}
          fill={color} opacity={rec.opacity}
          transform={`rotate(${rec.angle} ${rec.x} ${rec.y})`}
          className={animate ? 'st-rect' : ''}
          style={animate ? {
            ['--op' as string]: rec.opacity,
            ['--dur' as string]: `${rec.dur}s`,
            animationDelay: `${rec.delay}s`,
          } : {}}
        />
      ))}
      {[0.25, 0.5, 0.75].map((t, i) => (
        <line key={i} x1={0} y1={size * t} x2={size} y2={size * t}
          stroke={color} strokeWidth="0.5" opacity="0.1" />
      ))}
    </svg>
  )
}

// ─── The Completionist ────────────────────────────────────────────────────────
// Tight concentric rings — like tree rings, LP grooves, the depth of a catalog.
// Inner rings glow strongest; every layer is a chapter you finished.

function TheCompletionistArt({ color, size, animate, className }: InnerProps) {
  const cx = size / 2
  const cy = size / 2
  const rings = [0.07, 0.13, 0.19, 0.26, 0.33, 0.39, 0.44, 0.48].map((r, i, arr) => ({
    r:      size * r,
    opacity: 0.70 - (i / arr.length) * 0.52,
    width:   i < 2 ? 1.75 : i < 4 ? 1.25 : 0.75,
    delay:   i * 0.35,
  }))

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
      className={className} aria-hidden>
      <defs>
        <radialGradient id="comp-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
        {animate && (
          <style>{`
            @keyframes comp-pulse { 0%,100%{opacity:var(--op)} 50%{opacity:calc(var(--op)*1.5)} }
            .comp-ring { animation: comp-pulse 5s ease-in-out infinite }
          `}</style>
        )}
      </defs>
      <circle cx={cx} cy={cy} r={size * 0.45} fill="url(#comp-glow)" />
      {rings.map((ring, i) => (
        <circle key={i} cx={cx} cy={cy} r={ring.r}
          fill="none" stroke={color}
          strokeWidth={ring.width} opacity={ring.opacity}
          className={animate ? 'comp-ring' : ''}
          style={animate ? { ['--op' as string]: ring.opacity, animationDelay: `${ring.delay}s` } : {}}
        />
      ))}
      <circle cx={cx} cy={cy} r="2.5" fill={color} opacity="0.95" />
    </svg>
  )
}

// ─── The Signal ───────────────────────────────────────────────────────────────
// Single source broadcasting outward — sonar, radio tower, stone in still water.
// You were transmitting before anyone else tuned in.

function TheSignalArt({ color, size, animate, className }: InnerProps) {
  const cx = size / 2
  const cy = size / 2

  const arcs = [
    { r: size * 0.08, opacity: 0.85, width: 1.75 },
    { r: size * 0.18, opacity: 0.55, width: 1.25 },
    { r: size * 0.29, opacity: 0.28, width: 0.75 },
    { r: size * 0.38, opacity: 0.13, width: 0.5 },
    { r: size * 0.46, opacity: 0.06, width: 0.5 },
  ]

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
      className={className} aria-hidden>
      {arcs.map((arc, i) => (
        <circle key={i} cx={cx} cy={cy} r={arc.r}
          fill="none" stroke={color}
          strokeWidth={arc.width} opacity={arc.opacity}
        />
      ))}
      {/* Outgoing transmission wave */}
      {animate && (
        <circle cx={cx} cy={cy} r={size * 0.06}
          fill="none" stroke={color} strokeWidth="1.25" opacity="0.7">
          <animate attributeName="r"
            values={`${size*0.06};${size*0.48};${size*0.06}`}
            dur="3.2s" repeatCount="indefinite" />
          <animate attributeName="opacity"
            values="0.7;0;0.7" dur="3.2s" repeatCount="indefinite" />
        </circle>
      )}
      {/* Source dot */}
      <circle cx={cx} cy={cy} r="3.5" fill={color} opacity="0.95" />
      {animate && (
        <circle cx={cx} cy={cy} r="3.5" fill={color} opacity="0.35">
          <animate attributeName="r"       values="3.5;7;3.5"  dur="3.2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.35;0;0.35" dur="3.2s" repeatCount="indefinite" />
        </circle>
      )}
    </svg>
  )
}

// ─── The Mainframe ────────────────────────────────────────────────────────────
// Network graph — a dense connected core with outer satellites.
// Your taste maps the cultural web; you are always near the centre.

function TheMainframeArt({ color, size, animate, className }: InnerProps) {
  function rand(seed: number) {
    let s = seed
    return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff }
  }
  const r = rand(17)
  const cx = size / 2
  const cy = size / 2

  const coreNodes = [
    { x: cx,                    y: cy,                    radius: 3,   opacity: 0.95 },
    { x: cx - size * 0.09,      y: cy - size * 0.06,      radius: 2.5, opacity: 0.80 },
    { x: cx + size * 0.10,      y: cy - size * 0.04,      radius: 2.5, opacity: 0.80 },
    { x: cx + size * 0.06,      y: cy + size * 0.11,      radius: 2,   opacity: 0.70 },
    { x: cx - size * 0.07,      y: cy + size * 0.10,      radius: 2,   opacity: 0.70 },
  ]

  const outerNodes = Array.from({ length: 10 }, () => {
    const angle = r() * Math.PI * 2
    const dist  = size * (0.22 + r() * 0.22)
    return {
      x:       cx + Math.cos(angle) * dist,
      y:       cy + Math.sin(angle) * dist,
      radius:  1 + r() * 1.5,
      opacity: 0.18 + r() * 0.30,
    }
  })

  // Edges: each outer node connects to its nearest core
  const outerEdges = outerNodes.map(outer => {
    let minDist = Infinity
    let nearest = coreNodes[0]
    for (const core of coreNodes) {
      const d = Math.hypot(outer.x - core.x, outer.y - core.y)
      if (d < minDist) { minDist = d; nearest = core }
    }
    return { x1: nearest.x, y1: nearest.y, x2: outer.x, y2: outer.y, opacity: 0.12 + r() * 0.12 }
  })

  const coreEdges = [
    { x1: coreNodes[0].x, y1: coreNodes[0].y, x2: coreNodes[1].x, y2: coreNodes[1].y, opacity: 0.30 },
    { x1: coreNodes[0].x, y1: coreNodes[0].y, x2: coreNodes[2].x, y2: coreNodes[2].y, opacity: 0.30 },
    { x1: coreNodes[0].x, y1: coreNodes[0].y, x2: coreNodes[3].x, y2: coreNodes[3].y, opacity: 0.22 },
    { x1: coreNodes[0].x, y1: coreNodes[0].y, x2: coreNodes[4].x, y2: coreNodes[4].y, opacity: 0.22 },
    { x1: coreNodes[1].x, y1: coreNodes[1].y, x2: coreNodes[2].x, y2: coreNodes[2].y, opacity: 0.18 },
    { x1: coreNodes[3].x, y1: coreNodes[3].y, x2: coreNodes[4].x, y2: coreNodes[4].y, opacity: 0.18 },
  ]

  const allEdges = [...coreEdges, ...outerEdges]

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
      className={className} aria-hidden>
      {animate && (
        <style>{`
          @keyframes mf-edge { 0%,100%{opacity:var(--op)} 50%{opacity:calc(var(--op)*0.3)} }
          .mf-edge { animation: mf-edge 3.5s ease-in-out infinite }
        `}</style>
      )}
      {allEdges.map((e, i) => (
        <line key={i} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
          stroke={color} strokeWidth="0.75" opacity={e.opacity}
          className={animate ? 'mf-edge' : ''}
          style={animate ? { ['--op' as string]: e.opacity, animationDelay: `${i * 0.12}s` } : {}}
        />
      ))}
      {[...coreNodes, ...outerNodes].map((n, i) => (
        <circle key={i} cx={n.x} cy={n.y} r={n.radius}
          fill={color} opacity={n.opacity} />
      ))}
    </svg>
  )
}

// ─── The Time Capsule ─────────────────────────────────────────────────────────
// Geological strata — layers of time, each one a different era of who you were.
// A single vertical thread cuts through all of them: still here, still listening.

function TheTimeCapsuleArt({ color, size, animate, className }: InnerProps) {
  const cx = size / 2

  const layers = [
    { y: size * 0.16, w: size * 0.50, width: 1.75, opacity: 0.60 },
    { y: size * 0.24, w: size * 0.62, width: 1.25, opacity: 0.48 },
    { y: size * 0.32, w: size * 0.70, width: 0.75, opacity: 0.36 },
    { y: size * 0.40, w: size * 0.58, width: 0.75, opacity: 0.30 },
    { y: size * 0.50, w: size * 0.78, width: 2.00, opacity: 0.62 }, // present — strongest
    { y: size * 0.60, w: size * 0.62, width: 0.75, opacity: 0.28 },
    { y: size * 0.68, w: size * 0.52, width: 0.75, opacity: 0.22 },
    { y: size * 0.76, w: size * 0.42, width: 0.50, opacity: 0.16 },
    { y: size * 0.84, w: size * 0.32, width: 0.50, opacity: 0.10 },
  ]

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
      className={className} aria-hidden>
      <defs>
        {animate && (
          <style>{`
            @keyframes tc-stratum { 0%,100%{opacity:var(--op)} 50%{opacity:calc(var(--op)*1.6)} }
            .tc-stratum { animation: tc-stratum 6s ease-in-out infinite }
          `}</style>
        )}
      </defs>

      {/* Strata */}
      {layers.map((layer, i) => (
        <line key={i}
          x1={cx - layer.w / 2} y1={layer.y}
          x2={cx + layer.w / 2} y2={layer.y}
          stroke={color} strokeWidth={layer.width} opacity={layer.opacity}
          className={animate ? 'tc-stratum' : ''}
          style={animate ? { ['--op' as string]: layer.opacity, animationDelay: `${i * 0.4}s` } : {}}
        />
      ))}

      {/* Vertical time thread */}
      <line x1={cx} y1={size * 0.10} x2={cx} y2={size * 0.90}
        stroke={color} strokeWidth="0.5" opacity="0.18"
        strokeDasharray="2 5" />

      {/* Present-moment anchor */}
      <circle cx={cx} cy={size * 0.50} r="3" fill={color} opacity="0.85" />
      {animate && (
        <circle cx={cx} cy={size * 0.50} r="5"
          fill="none" stroke={color} strokeWidth="1" opacity="0.3">
          <animate attributeName="r"       values="3;11;3"    dur="4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.3;0;0.3" dur="4s" repeatCount="indefinite" />
        </circle>
      )}
    </svg>
  )
}
