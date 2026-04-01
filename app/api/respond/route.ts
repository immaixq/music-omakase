import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '')

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))

  const {
    archetype,
    quadrant,
    listenerProfile,
    chosenWord,
    dataLine,
    trend,
    topArtistNames,
  } = body

  if (!archetype || !quadrant || !chosenWord) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const archetypeLabel: Record<string, string> = {
    'late-night-driver': 'Late Night Driver (wide emotional range, introspective)',
    'hype-architect':    'Hype Architect (high energy, consistent tempo, driven)',
    'soft-launch':       'Soft Launch (warm, loyal to few artists, low urgency)',
    'the-static':        'The Static (genre-wide, unpredictable, restless curiosity)',
  }

  const quadrantDesc: Record<string, string> = {
    alive:    'high energy + high valence — something is starting or working',
    soft:     'low energy + high valence — comfortable, not asking much from the music',
    restless: 'high energy + low valence — moving through something without resolution',
    heavy:    'low energy + low valence — inward, still, sitting with something',
  }

  const systemInstruction = `You write short, precise responses for a music personality app.
Rules:
- Describe what the music data does, not what the person should feel
- Never say "it seems like", "it sounds like", "I notice", "perhaps", or anything therapeutic
- Never mention mental health, wellness, or emotions as problems to fix
- Use the specific numbers provided — avoid vague claims
- Tone: honest, observational, slightly literary. Like a music critic who has seen your data
- Exactly 2 sentences. No more.`

  const artistsLine = Array.isArray(topArtistNames) && topArtistNames.length > 0
    ? `Their most-played artists right now: ${topArtistNames.slice(0, 3).join(', ')}.`
    : ''

  const prompt = `Listener archetype: ${archetypeLabel[archetype] ?? archetype}
Current mood quadrant: ${quadrantDesc[quadrant] ?? quadrant}
Trend: ${trend ?? 'stable'}
They picked the word: "${chosenWord}"
Backing data: ${dataLine}
${artistsLine}
Listener profile — discovery ${listenerProfile?.discovery ?? 50}/100, loyalty ${listenerProfile?.loyalty ?? 50}/100, emotional range ${listenerProfile?.emotionalRange ?? 50}/100, intensity ${listenerProfile?.intensity ?? 50}/100

Write exactly 2 sentences responding to their word choice. If artist names are provided, you may reference one by name to ground the observation. Reference a specific number from the backing data. Do not repeat the word back to them verbatim.`

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction,
    })

    const result = await model.generateContent(prompt)
    const text = result.response.text().trim()
    return NextResponse.json({ line: text })
  } catch (err) {
    console.error('[respond]', err)
    return NextResponse.json({ line: dataLine ?? 'Your listening data backs that up.' })
  }
}
