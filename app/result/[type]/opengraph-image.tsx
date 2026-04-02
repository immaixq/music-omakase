import { ImageResponse } from 'next/og'
import { archetypes, type ArchetypeKey } from '@/lib/archetypes'

export const size        = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({
  params,
}: {
  params: Promise<{ type: string }>
}) {
  const { type }  = await params
  const archetype = archetypes[type as ArchetypeKey]

  // Fallback gracefully for unknown routes
  if (!archetype) {
    return new ImageResponse(
      <div
        style={{
          width: '100%', height: '100%',
          background: '#0d0d0d',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <span style={{ color: '#f0ede6', fontSize: 32, fontFamily: 'monospace' }}>VIBE·ID</span>
      </div>,
      { ...size }
    )
  }

  const defaultConfession = archetype.confessions.find(c => c.condition === 'default')?.line ?? ''

  return new ImageResponse(
    <div
      style={{
        width: '100%', height: '100%',
        background: '#0d0d0d',
        display: 'flex', flexDirection: 'column',
        padding: '0',
        position: 'relative',
      }}
    >
      {/* Color accent bar at top */}
      <div style={{
        width: '100%', height: 4,
        background: archetype.color,
        flexShrink: 0,
      }} />

      {/* Main content */}
      <div style={{
        display: 'flex', flexDirection: 'column',
        flex: 1,
        padding: '56px 80px 48px',
        justifyContent: 'space-between',
      }}>

        {/* Top row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <span style={{
            color: '#f0ede6', opacity: 0.35,
            fontSize: 14, letterSpacing: '0.3em',
            fontFamily: 'monospace', textTransform: 'uppercase',
          }}>
            VIBE·ID
          </span>
          <span style={{
            color: archetype.color, opacity: 0.5,
            fontSize: 12, letterSpacing: '0.2em',
            fontFamily: 'monospace', textTransform: 'uppercase',
          }}>
            MUSIC IDENTITY
          </span>
        </div>

        {/* Center — archetype name */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          <span style={{
            color: archetype.color,
            fontSize: 88,
            fontFamily: 'Georgia, serif',
            fontWeight: 700,
            lineHeight: 1,
            letterSpacing: '-0.02em',
          }}>
            {archetype.name}
          </span>
          <span style={{
            color: '#f0ede6', opacity: 0.45,
            fontSize: 22,
            fontFamily: 'monospace',
            marginTop: 20,
            lineHeight: 1.5,
          }}>
            {archetype.tagline}
          </span>
        </div>

        {/* Bottom row — confession + domain */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <span style={{
            color: '#f0ede6', opacity: 0.6,
            fontSize: 18,
            fontFamily: 'Georgia, serif',
            fontStyle: 'italic',
            maxWidth: 700,
            lineHeight: 1.5,
          }}>
            &ldquo;{defaultConfession}&rdquo;
          </span>
          <span style={{
            color: '#f0ede6', opacity: 0.15,
            fontSize: 14,
            fontFamily: 'monospace',
            flexShrink: 0,
            marginLeft: 32,
          }}>
            vibe-id.app
          </span>
        </div>
      </div>
    </div>,
    { ...size }
  )
}
