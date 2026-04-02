import type { Metadata } from 'next'
import { archetypes, type ArchetypeKey } from '@/lib/archetypes'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ type: string }>
}): Promise<Metadata> {
  const { type }  = await params
  const archetype = archetypes[type as ArchetypeKey]

  if (!archetype) {
    return {
      title: 'VIBE-ID — Your Music Has Been Keeping a Diary',
    }
  }

  const defaultConfession = archetype.confessions.find(c => c.condition === 'default')?.line ?? ''

  return {
    title:       `I got ${archetype.name} — VIBE-ID`,
    description: `"${defaultConfession}" — ${archetype.tagline}. Find out your music type.`,
    openGraph: {
      title:       `I got ${archetype.name}`,
      description: `"${defaultConfession}"`,
      siteName:    'VIBE-ID',
      type:        'website',
    },
    twitter: {
      card:        'summary_large_image',
      title:       `I got ${archetype.name} — VIBE-ID`,
      description: `"${defaultConfession}"`,
    },
  }
}

export default function ResultLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
