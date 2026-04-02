import type { ArchetypeKey } from './archetypes'
import type { ListenerProfile, DriftSignal } from './scoring'

export interface LetterContext {
  archetype:       ArchetypeKey
  valenceAvg:      number
  listenerProfile: ListenerProfile
  drift:           DriftSignal
  genreCount:      number
  lateNight:       boolean
  handle:          string
  lateNightPct?:   number
}

interface LetterTemplate {
  // Conditions that must match for this template to be selected
  archetype:     ArchetypeKey
  valenceHigh:   boolean | null   // null = don't care
  loyaltyHigh:   boolean | null
  driftDetected: boolean | null
  lateNight:     boolean | null
  paragraphs:    [string, string, string]
}

const TEMPLATES: LetterTemplate[] = [
  // ─── Late Night Driver ────────────────────────────────────────────────────
  {
    archetype: 'late-night-driver', valenceHigh: false, loyaltyHigh: true,
    driftDetected: null, lateNight: null,
    paragraphs: [
      `You've been coming back to the same songs again.`,
      `Not because they're the best ones — you know they're not. Because they were already there during the other times. You don't listen to music casually. You listen to it like you're building evidence.`,
      `{GENRE_COUNT} genres over six months. But the ones you return to fit in a much smaller room. That room has been the same for a while.`,
    ],
  },
  {
    archetype: 'late-night-driver', valenceHigh: null, loyaltyHigh: null,
    driftDetected: null, lateNight: true,
    paragraphs: [
      `Most of your recent listening happens after 10pm.`,
      `That's not a judgment. It's just what the timestamps say. The music you play when you're alone at the end of the day is different from what you'd put on for other people — quieter, more specific, more honest.`,
      `You've made playlists nobody else will hear. The data doesn't know why. It just knows you keep playing them.`,
    ],
  },
  {
    archetype: 'late-night-driver', valenceHigh: true, loyaltyHigh: null,
    driftDetected: null, lateNight: null,
    paragraphs: [
      `You listen to music like you're feeling it on behalf of someone else.`,
      `Your valence average sits high — the songs lean toward something good. But the variance is wide. You move through the full range in a way most listeners don't. You're not consistent, you're complete.`,
      `There are playlists in your history that don't fit the archetype. That's the honest part. Those are the ones that count.`,
    ],
  },

  // ─── Hype Architect ──────────────────────────────────────────────────────
  {
    archetype: 'hype-architect', valenceHigh: null, loyaltyHigh: null,
    driftDetected: true, lateNight: null,
    paragraphs: [
      `Something changed about four weeks ago.`,
      `The energy average shifted. The songs you're reaching for now are running harder than your six-month baseline. You've added something to your routine, or you're trying to outpace something.`,
      `Your average BPM is {BPM}. That's not background music. That's infrastructure.`,
    ],
  },
  {
    archetype: 'hype-architect', valenceHigh: null, loyaltyHigh: false,
    driftDetected: null, lateNight: null,
    paragraphs: [
      `You don't get attached to songs. You use them.`,
      `Your loyalty score is low — not because you're fickle, but because a song that doesn't deliver stops being useful. The artists you were listening to six months ago and the ones you listen to now barely overlap. That's a feature.`,
      `Average BPM: {BPM}. You've been consistent about one thing: pace.`,
    ],
  },
  {
    archetype: 'hype-architect', valenceHigh: null, loyaltyHigh: null,
    driftDetected: null, lateNight: null,
    paragraphs: [
      `You use music the way some people use caffeine.`,
      `The audio features on your top tracks are remarkably consistent: high energy, above-average tempo, low acousticness. You've found a formula and you stay inside it. The formula works, which is why you don't change it.`,
      `What you listen to when the formula fails — that's the part this data doesn't capture. But it exists.`,
    ],
  },

  // ─── Soft Launch ─────────────────────────────────────────────────────────
  {
    archetype: 'soft-launch', valenceHigh: true, loyaltyHigh: true,
    driftDetected: null, lateNight: null,
    paragraphs: [
      `You've built something consistent here.`,
      `The same artists, the same pocket of sound, the same lean toward something warm. You know what works for you and you haven't needed to look further. That's not a lack of curiosity — it's knowing what you came for.`,
      `Your valence average is high. You listen to music that knows how to hold still. That's a choice you make every time you hit play, even when it doesn't feel like a choice.`,
    ],
  },
  {
    archetype: 'soft-launch', valenceHigh: null, loyaltyHigh: null,
    driftDetected: true, lateNight: null,
    paragraphs: [
      `Something shifted recently. The acoustic tracks went up.`,
      `For most of the last six months your listening was consistent — settled, comfortable, intentional. The last four weeks changed the texture of it. You've been reaching for something quieter.`,
      `The data doesn't say why. It just notices what you've been playing.`,
    ],
  },
  {
    archetype: 'soft-launch', valenceHigh: null, loyaltyHigh: null,
    driftDetected: null, lateNight: null,
    paragraphs: [
      `You curate carefully. For yourself, not for anyone else.`,
      `{GENRE_COUNT} genres, but the ones you return to form a much smaller, more deliberate set. There's a specific sound you keep coming back to — not because it's popular, because it's right. Your discovery score reflects this: you're not chasing new things. You're deepening the things you've already found.`,
      `Your playlist is a room you've arranged exactly the way you want it. Not everyone gets invited in.`,
    ],
  },

  // ─── The Static ──────────────────────────────────────────────────────────
  {
    archetype: 'the-static', valenceHigh: null, loyaltyHigh: null,
    driftDetected: null, lateNight: null,
    paragraphs: [
      `You are genuinely hard to read.`,
      `Not as a person — as a listener. {GENRE_COUNT} distinct genres in the last six months. Most people stay inside four. Your emotional range score is in the top tier — the valence on your tracks swings from very dark to very bright, sometimes in the same session.`,
      `There's no pattern here that holds for longer than six weeks. You keep outrunning it. That's intentional.`,
    ],
  },
  {
    archetype: 'the-static', valenceHigh: null, loyaltyHigh: false,
    driftDetected: null, lateNight: null,
    paragraphs: [
      `You move through artists the way some people move through cities.`,
      `The overlap between who you were listening to last month and six months ago is low. Not because you forget — because something new arrived and demanded your full attention. That's how it always works with you.`,
      `The algorithm doesn't know what to recommend. That's not a problem. That's the whole point.`,
    ],
  },
  {
    archetype: 'the-static', valenceHigh: null, loyaltyHigh: null,
    driftDetected: true, lateNight: null,
    paragraphs: [
      `Even by your standards, the last four weeks look different.`,
      `Your listening is always varied, but recently the energy shifted in a specific direction. The data caught it. You might not have noticed — with you, the changes are subtle because there was never a baseline to begin with.`,
      `Whatever changed, the music changed with it. It always does.`,
    ],
  },

  // ─── The Completionist ────────────────────────────────────────────────────
  {
    archetype: 'the-completionist', valenceHigh: null, loyaltyHigh: true,
    driftDetected: null, lateNight: null,
    paragraphs: [
      `You haven't finished with these artists yet.`,
      `Your loyalty scores sit in the top range — you return to the same names across every time window, not because you're stuck, but because there's still more to find. Most listeners skim the surface of an artist's catalog. You go all the way down.`,
      `There are tracks in your history that most fans of the same artists have never played. You found them. You went back.`,
    ],
  },
  {
    archetype: 'the-completionist', valenceHigh: null, loyaltyHigh: null,
    driftDetected: null, lateNight: true,
    paragraphs: [
      `Late at night, you replay the same songs.`,
      `Not because nothing else exists — because you're still inside them. Your track novelty is remarkably low. You are not restless. You are thorough. There's a difference, and most people can't tell them apart.`,
      `The artists you know best, you know better than most people who claim to love them.`,
    ],
  },
  {
    archetype: 'the-completionist', valenceHigh: null, loyaltyHigh: null,
    driftDetected: null, lateNight: null,
    paragraphs: [
      `You commit to artists the way some people commit to places.`,
      `Your new artist discovery rate is among the lowest we see — not because nothing interests you, but because you're not done with what you already have. Every album, every B-side, every live version that surfaced five years ago and never got enough plays.`,
      `When you finally move on from an artist, it means something. The bar is very high. Most of them don't clear it.`,
    ],
  },

  // ─── The Signal ──────────────────────────────────────────────────────────
  {
    archetype: 'the-signal', valenceHigh: null, loyaltyHigh: null,
    driftDetected: null, lateNight: null,
    paragraphs: [
      `You are not trying to be ahead of the curve.`,
      `You just are. Your average artist popularity sits well below the mainstream — not because you're making a point, but because something real caught your attention before anyone else got there. The algorithm doesn't know what to do with you, which is why it keeps recommending you to people.`,
      `In six months, a few of these artists will be everywhere. You'll remember when it was just yours.`,
    ],
  },
  {
    archetype: 'the-signal', valenceHigh: null, loyaltyHigh: null,
    driftDetected: true, lateNight: null,
    paragraphs: [
      `Something new arrived in the last four weeks.`,
      `Your popularity average dropped, which means you've been digging further than usual — artists with smaller followings, newer releases, things the algorithm hasn't indexed yet. This is what you do when something shifts internally. The music gets more specific.`,
      `The data calls it a drift. You'd just call it finding the next thing.`,
    ],
  },
  {
    archetype: 'the-signal', valenceHigh: null, loyaltyHigh: null,
    driftDetected: null, lateNight: true,
    paragraphs: [
      `Most of your discoveries happen at night.`,
      `That's when you're actually listening — not in the background, not on shuffle, but deliberately, in sequence, the way the artist intended. Your underground score reflects a consistent reach toward things most people haven't found. That's not a personality — it's a practice.`,
      `The artists you love right now will be someone else's discovery eventually. You won't resent it. You'll just already be somewhere else.`,
    ],
  },

  // ─── The Mainframe ────────────────────────────────────────────────────────
  {
    archetype: 'the-mainframe', valenceHigh: null, loyaltyHigh: null,
    driftDetected: null, lateNight: null,
    paragraphs: [
      `Your taste is synchronized with the cultural moment.`,
      `Not because you're following it — because you're part of it. The artists you listen to sit at peak popularity. The genres you gravitate toward are the ones everyone ends up listening to. You're not chasing the wave; you're just already on it, naturally, without trying.`,
      `If your Spotify history were public, it would look like a cultural index. The algorithm loves you. You are its ideal case.`,
    ],
  },
  {
    archetype: 'the-mainframe', valenceHigh: null, loyaltyHigh: true,
    driftDetected: null, lateNight: null,
    paragraphs: [
      `You return to what works, and what works happens to be popular.`,
      `Your loyalty score is high — you're not constantly chasing new things. When you find an artist who resonates, you stay. And the artists you stay with tend to have large audiences, not because you sought them out for that reason, but because real resonance tends to reach a lot of people.`,
      `There's a version of this archetype that's cynical. Yours isn't. The mainstream, when it's good, is good for a reason.`,
    ],
  },
  {
    archetype: 'the-mainframe', valenceHigh: null, loyaltyHigh: null,
    driftDetected: true, lateNight: null,
    paragraphs: [
      `Something shifted, and you moved with it.`,
      `Your recent listening has tracked toward higher popularity artists than your six-month baseline. You didn't resist it — why would you? When something becomes culturally significant, you're already there. The shift wasn't trend-chasing. It was alignment.`,
      `The data says your taste is calibrated. That's not a criticism. It takes a certain kind of ear to track the moment accurately.`,
    ],
  },

  // ─── The Time Capsule ─────────────────────────────────────────────────────
  {
    archetype: 'the-time-capsule', valenceHigh: null, loyaltyHigh: true,
    driftDetected: null, lateNight: null,
    paragraphs: [
      `The artists you're listening to today are the same ones you were listening to a year ago.`,
      `That overlap between your short-term and long-term listening is significant. Most people cycle through artists faster than this. You don't. When you find something real, it stays. Not as a habit — as a relationship.`,
      `There are probably songs in your history that take you back to a specific moment immediately, without warning. That's not nostalgia. That's a high-fidelity emotional record.`,
    ],
  },
  {
    archetype: 'the-time-capsule', valenceHigh: null, loyaltyHigh: null,
    driftDetected: null, lateNight: true,
    paragraphs: [
      `At night, you go back.`,
      `Your long-term and short-term listening overlap in a way that's unusual — the same artists, the same songs, across months and months. Late at night, those songs do something specific. They hold a version of you that still exists somewhere in the data.`,
      `You're not stuck. You're keeping something alive that most people let go of too quickly.`,
    ],
  },
  {
    archetype: 'the-time-capsule', valenceHigh: null, loyaltyHigh: null,
    driftDetected: null, lateNight: null,
    paragraphs: [
      `Some of your favorite songs, you've heard hundreds of times.`,
      `You're still finding things in them. That's what the high long-term retention rate means — you're not replaying out of inertia, you're going deeper. Most listeners treat songs as disposable. You treat them as documents. The same document, revisited, says something different depending on when you open it.`,
      `Your music didn't forget who you were. Neither did you.`,
    ],
  },
]

function score(template: LetterTemplate, ctx: LetterContext): number {
  let s = 0
  if (template.archetype !== ctx.archetype) return -1  // hard exclude

  if (template.valenceHigh !== null) {
    const isHigh = ctx.valenceAvg > 0.50
    s += template.valenceHigh === isHigh ? 2 : -2
  }
  if (template.loyaltyHigh !== null) {
    const isHigh = ctx.listenerProfile.loyalty > 55
    s += template.loyaltyHigh === isHigh ? 2 : -2
  }
  if (template.driftDetected !== null) {
    s += template.driftDetected === ctx.drift.detected ? 3 : -3
  }
  if (template.lateNight !== null) {
    s += template.lateNight === ctx.lateNight ? 2 : -2
  }
  return s
}

function fill(text: string, ctx: LetterContext): string {
  return text
    .replace('{GENRE_COUNT}',    String(ctx.genreCount))
    .replace('{LATE_NIGHT_PCT}', ctx.lateNightPct != null ? `${ctx.lateNightPct}%` : 'a notable chunk')
    .replace('{BPM}', '—')
}

export function selectLetter(ctx: LetterContext): [string, string, string] {
  const candidates = TEMPLATES
    .map(t => ({ t, s: score(t, ctx) }))
    .filter(({ s }) => s >= 0)
    .sort((a, b) => b.s - a.s)

  const best = candidates[0]?.t ?? TEMPLATES.find(t => t.archetype === ctx.archetype)!

  return best.paragraphs.map(p => fill(p, ctx)) as [string, string, string]
}
