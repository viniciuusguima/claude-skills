// Builds the pane's scene as one SVG document: a little orange pixel Claude
// on a grey background. Every skill used gives him one more piece of a
// disguise (sunglasses, a hat, a moustache, a gold earring), every
// agent is another little Claude in costume standing behind him, and when a
// usage limit (5h or 7 days) runs out he turns grey. Everything moves with
// SMIL inside the SVG, so the surface animates it with no redraws from the
// mod and no model calls.

export type SceneAgent = {
  type: string
  description: string
  isRunning: boolean
  tokens: number
}

export type SceneSkill = { name: string; count: number }

export type SceneLimit = { kind: string; percentUsed: number; resetsAt?: string }

/** Present when a usage limit is used up: Claude is drawn grey. */
export type SceneBroken = {
  /** The windows at 100%: `five_hour`, `seven_day`, ... */
  kinds: string[]
  /** "4h 57min" until the last of them resets, when the account says. */
  resetIn?: string
}

export type SceneData = {
  totalTokens: number
  input: number
  output: number
  cache: number
  mainTokens: number
  agentTokens: number
  contextTokens?: number
  contextWindow?: number
  contextPercent?: number
  usd?: number
  limits: SceneLimit[]
  /** In the order they started: the first wears the first costume. */
  agents: SceneAgent[]
  /** In the order they were first used: the first gets the first accessory. */
  skills: SceneSkill[]
  broken?: SceneBroken
}

const W = 300
const H = 640
const CX = W / 2

export const SCENE = { width: W, height: H }

/** One piece of the disguise per skill, handed out in the order the skills are first used. */
export const ACCESSORIES = [
  { key: 'oculos', name: 'óculos escuros', emoji: '🕶️' },
  { key: 'chapeu', name: 'chapéu', emoji: '🎩' },
  { key: 'bigode', name: 'bigode', emoji: '🥸' },
  { key: 'brinco', name: 'brinco de argola', emoji: '💍' },
] as const

export type AccessoryKey = (typeof ACCESSORIES)[number]['key']

/** The accessory the skill at this position (first-use order) gives; none past the last. */
export const accessoryFor = (index: number) => ACCESSORIES[index]

/**
 * The agents' costumes, handed out in the order the agents start: the first
 * agent wears the first, the fourth starts over. To customise them, change an
 * entry here and its case in `costume`, or add both for a new one.
 */
export const FIGURINOS = [
  { key: 'social', name: 'camisa social verde, calça cáqui, óculos escuros e chapéu preto', emoji: '🕴️' },
  { key: 'couro', name: 'casaco longo de couro vermelho, camiseta cinza, máscara prateada de olhos vermelhos e toca-fitas azul', emoji: '🎭' },
  { key: 'boina', name: 'boina xadrez, cachecol azul, sobretudo e charuto', emoji: '🚬' },
] as const

export type FigurinoKey = (typeof FIGURINOS)[number]['key']

/** The costume the agent at this position (start order) wears. */
export const figurinoFor = (index: number) => FIGURINOS[index % FIGURINOS.length]!

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s)

export const fmt = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  if (n >= 10_000) return `${Math.round(n / 1000)}k`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(Math.round(n))
}

const levelColor = (p: number): string => (p >= 80 ? '#ff6b6b' : p >= 50 ? '#ffb547' : '#5ad1ff')

const LIMIT_LABEL: Record<string, string> = {
  five_hour: '5h',
  seven_day: '7 dias',
  spend_limit: 'gasto',
}

export const limitName = (kind: string) => LIMIT_LABEL[kind] ?? kind

/**
 * Which limits are used up right now: at 100% or more and not yet past their
 * reset time. Undefined while every limit still has room.
 */
export const limitState = (limits: SceneLimit[], now: number): SceneBroken | undefined => {
  const hit = limits.filter(l => {
    if (l.percentUsed < 100) return false
    const at = l.resetsAt ? Date.parse(l.resetsAt) : NaN
    return Number.isNaN(at) || at > now
  })
  if (hit.length === 0) return undefined

  const times = hit.map(l => (l.resetsAt ? Date.parse(l.resetsAt) : NaN)).filter(t => !Number.isNaN(t))
  let resetIn: string | undefined
  if (times.length) {
    const min = Math.max(1, Math.ceil((Math.max(...times) - now) / 60_000))
    const d = Math.floor(min / 1440)
    const h = Math.floor((min % 1440) / 60)
    const m = min % 60
    resetIn = d > 0 ? `${d}d ${h}h` : h > 0 ? `${h}h ${String(m).padStart(2, '0')}min` : `${m}min`
  }

  return { kinds: hit.map(l => l.kind), resetIn }
}

// Claude's colours
const ORANGE = '#D97757'
const ORANGE_DARK = '#B85F42'
const ORANGE_LIGHT = '#EC9A7C'
const EYE = '#2A1A14'
const MINI_TINTS = ['#D97757', '#E3885F', '#CC6A4E', '#E89B74', '#D47A62', '#DE8A6A']

const n = (v: number) => Number(v.toFixed(1))

/**
 * A pixel Claude, 12 by 8 units: body, two arm stubs, four legs, two eyes.
 * (x, y) is the top-left of the body; u is the size of one pixel.
 */
const claude = (
  x: number,
  y: number,
  u: number,
  opts: { color: string; shade: string; light: string; eyes: 'open' | 'x'; blink: boolean; blinkDelay?: number },
) => {
  const R = (a: number, b: number, w: number, h: number, f: string, extra = '') =>
    `<rect x="${n(x + a * u)}" y="${n(y + b * u)}" width="${n(w * u)}" height="${n(h * u)}" fill="${f}"${extra}/>`
  const parts = [
    R(1, 0, 10, 6, opts.color),
    R(1, 0, 10, 0.6, opts.light),
    R(1, 5.4, 10, 0.6, opts.shade),
    R(0, 2, 1, 2, opts.color),
    R(11, 2, 1, 2, opts.color),
    R(2, 6, 1, 2, opts.shade),
    R(4, 6, 1, 2, opts.shade),
    R(7, 6, 1, 2, opts.shade),
    R(9, 6, 1, 2, opts.shade),
  ]
  if (opts.eyes === 'open') {
    const eye = (a: number) => {
      const anim = opts.blink
        ? `<animate attributeName="height" values="${n(2 * u)};${n(2 * u)};${n(0.3 * u)};${n(2 * u)}" keyTimes="0;0.92;0.96;1" dur="4.2s" begin="-${opts.blinkDelay ?? 0}s" repeatCount="indefinite"/>
           <animate attributeName="y" values="${n(y + 2 * u)};${n(y + 2 * u)};${n(y + 2.85 * u)};${n(y + 2 * u)}" keyTimes="0;0.92;0.96;1" dur="4.2s" begin="-${opts.blinkDelay ?? 0}s" repeatCount="indefinite"/>`
        : ''
      return `<rect x="${n(x + a * u)}" y="${n(y + 2 * u)}" width="${n(u)}" height="${n(2 * u)}" fill="${EYE}">${anim}</rect>`
    }
    parts.push(eye(3), eye(8))
  } else {
    // Knocked-out eyes: an X over each.
    const xEye = (a: number) => {
      const x0 = x + (a - 0.3) * u
      const y0 = y + 1.9 * u
      const s = 1.6 * u
      return `<path d="M${n(x0)},${n(y0)} L${n(x0 + s)},${n(y0 + s)} M${n(x0 + s)},${n(y0)} L${n(x0)},${n(y0 + s)}" stroke="${EYE}" stroke-width="${n(0.45 * u)}" stroke-linecap="square"/>`
    }
    parts.push(xEye(3), xEye(8))
  }
  return parts.join('')
}

/** Drawing in a Claude's own units, as `claude` lays him out: (x, y) is the top-left of his body, u one pixel. */
const pen = (x: number, y: number, u: number) => {
  const X = (a: number) => n(x + a * u)
  const Y = (b: number) => n(y + b * u)
  const S = (v: number) => n(v * u)
  const R = (a: number, b: number, w: number, h: number, f: string, extra = '') =>
    `<rect x="${X(a)}" y="${Y(b)}" width="${S(w)}" height="${S(h)}" fill="${f}"${extra}/>`
  const P = (points: [number, number][], f: string) =>
    `<polygon points="${points.map(([a, b]) => `${X(a)},${Y(b)}`).join(' ')}" fill="${f}"/>`
  return { X, Y, S, R, P }
}

type Pen = ReturnType<typeof pen>

/** The left edge of each of his four tentacles. */
const LEGS = [2, 4, 7, 9]

/** Sunglasses whose lenses cover each eye whole (the eyes are 3–4 and 8–9 across, 2–4 down). */
const oculos = ({ R, S }: Pen) => {
  const rx = ` rx="${S(0.35)}"`
  return (
    R(2.1, 1.7, 2.8, 2.6, '#111', rx) +
    R(7.1, 1.7, 2.8, 2.6, '#111', rx) +
    R(4.9, 2.25, 2.2, 0.45, '#111') +
    R(1.0, 2.1, 1.1, 0.35, '#111') +
    R(9.9, 2.1, 1.1, 0.35, '#111') +
    R(2.45, 2.0, 0.8, 0.35, '#fff', ' opacity="0.55"') +
    R(7.45, 2.0, 0.8, 0.35, '#fff', ' opacity="0.55"')
  )
}

/** A fedora sitting on top of his head. */
const fedora = ({ R }: Pen, c: { crown: string; brim: string; band: string }) =>
  R(3.0, -2.9, 6.0, 2.6, c.crown) +
  R(5.2, -2.9, 1.6, 0.4, c.brim) +
  R(3.0, -1.05, 6.0, 0.6, c.band) +
  R(1.4, -0.45, 9.2, 0.65, c.brim) +
  R(3.25, -2.6, 0.45, 1.4, '#fff', ' opacity="0.14"')

/** A handlebar moustache under the eyes: high in the middle, drooping, tips curled up. */
const bigode = ({ R }: Pen) => {
  const c = '#3A2418'
  return (
    R(4.1, 4.55, 3.8, 0.7, c) +
    R(3.3, 4.85, 0.9, 0.6, c) +
    R(7.8, 4.85, 0.9, 0.6, c) +
    R(2.7, 4.55, 0.65, 0.6, c) +
    R(8.65, 4.55, 0.65, 0.6, c) +
    R(4.4, 4.62, 1.2, 0.16, '#fff', ' opacity="0.15"')
  )
}

/** A gold hoop earring hanging from the right side of his head, with a glint while the scene moves. */
const brinco = ({ X, Y, S, R }: Pen, lively: boolean) =>
  R(10.85, 0.9, 0.3, 0.3, '#FFD43B') +
  `<circle cx="${X(11)}" cy="${Y(1.6)}" r="${S(0.45)}" fill="none" stroke="#FFD43B" stroke-width="${S(0.18)}" shape-rendering="geometricPrecision"/>` +
  (lively
    ? `<rect x="${X(11.2)}" y="${Y(1.85)}" width="${S(0.22)}" height="${S(0.22)}" fill="#fff" opacity="0"><animate attributeName="opacity" values="0;0;1;0" keyTimes="0;0.7;0.85;1" dur="2.6s" repeatCount="indefinite"/></rect>`
    : '')

/** One accessory drawn on the main Claude. */
const accessory = (key: AccessoryKey, p: Pen, lively: boolean): string => {
  switch (key) {
    case 'oculos':
      return `<g class="acc-oculos"><title>óculos escuros</title>${oculos(p)}</g>`
    case 'chapeu':
      return `<g class="acc-chapeu"><title>chapéu</title>${fedora(p, { crown: '#6B4E37', brim: '#553B28', band: '#1E1A17' })}</g>`
    case 'bigode':
      return `<g class="acc-bigode"><title>bigode</title>${bigode(p)}</g>`
    case 'brinco':
      return `<g class="acc-brinco"><title>brinco de argola</title>${brinco(p, lively)}</g>`
  }
}

/** Sleeves over the arms, the sides up to the shoulders and a band from `neck` down: a top that leaves the face clear. */
const torso = ({ R }: Pen, c: string, shade: string, bottom: number, neck = 4.1) =>
  R(0, 2, 1, 2, c) +
  R(11, 2, 1, 2, c) +
  R(1, 2, 1.1, neck - 1.9, c) +
  R(9.9, 2, 1.1, neck - 1.9, c) +
  R(1, neck, 10, bottom - neck, c) +
  R(1, bottom - 0.3, 10, 0.3, shade)

/**
 * One patch of khaki plaid with brown and green bands, filling the rectangle
 * (a, b, w, h). The bands sit at fixed places, so patches side by side line up
 * into one cloth.
 */
const xadrez = ({ R }: Pen, a: number, b: number, w: number, h: number) => {
  const BROWN = [2.7, 4.3, 5.9, 7.5, 9.1, 10.2]
  const GREEN = [-1.55, -0.95, -0.4]
  const across = BROWN.filter(x => x < a + w && x + 0.5 > a).map(x => {
    const x0 = Math.max(a, x)
    return R(x0, b, Math.min(a + w, x + 0.5) - x0, h, '#6B4A2B', ' opacity="0.7"')
  })
  const down = GREEN.filter(y => y < b + h && y + 0.28 > b).map(y => {
    const y0 = Math.max(b, y)
    return R(a, y0, w, Math.min(b + h, y + 0.28) - y0, '#4F7A3A', ' opacity="0.75"')
  })
  return R(a, b, w, h, '#C2A878') + across.join('') + down.join('')
}

/** Music notes rising from the tape player while the scene moves. */
const notas = ({ X, Y, S }: Pen) =>
  [0, 1]
    .map(k => {
      const t = `dur="2.4s" begin="-${(k * 1.2).toFixed(1)}s" repeatCount="indefinite"`
      return `<text x="${X(11)}" y="${Y(-0.6)}" font-size="${S(1.9)}" fill="#FFD3DA" opacity="0">${k ? '♫' : '♪'}
        <animate attributeName="y" values="${Y(-0.6)};${Y(-4.2)}" ${t}/>
        <animate attributeName="x" values="${X(11)};${X(12.2)};${X(11.4)}" ${t}/>
        <animate attributeName="opacity" values="0;1;0" ${t}/></text>`
    })
    .join('')

/** Cigar smoke: puffs that rise, swell and fade while the scene moves, a still wisp when paused. */
const fumaca = ({ X, Y, S }: Pen, lively: boolean) => {
  if (!lively) {
    const at = (a: number, b: number, r: number, o: number) =>
      `<circle cx="${X(a)}" cy="${Y(b)}" r="${S(r)}" fill="#E9ECEF" opacity="${o}"/>`
    return `<g class="fumaca" shape-rendering="geometricPrecision">${at(11.2, 2.9, 0.45, 0.5)}${at(11.6, 1.4, 0.7, 0.35)}${at(11.2, -0.3, 0.95, 0.2)}</g>`
  }
  const dur = 3.6
  const puffs = [0, 1, 2]
    .map(k => {
      const t = `dur="${dur}s" begin="-${((k * dur) / 3).toFixed(1)}s" repeatCount="indefinite"`
      return `<circle cx="${X(11.1)}" cy="${Y(3.8)}" r="${S(0.3)}" fill="#E9ECEF" opacity="0">
        <animate attributeName="cy" values="${Y(3.8)};${Y(-2.8)}" ${t}/>
        <animate attributeName="cx" values="${X(11.1)};${X(11.8)};${X(10.9)};${X(11.6)}" ${t}/>
        <animate attributeName="r" values="${S(0.3)};${S(1.3)}" ${t}/>
        <animate attributeName="opacity" values="0;0.7;0" keyTimes="0;0.15;1" ${t}/></circle>`
    })
    .join('')
  return `<g class="fumaca" shape-rendering="geometricPrecision">${puffs}</g>`
}

/**
 * An agent's costume, drawn over his body. `top` is the highest unit it
 * reaches (a hat, the headphones), so his name tag goes above it.
 */
const costume = (key: FigurinoKey, p: Pen, lively: boolean): { svg: string; top: number } => {
  const { X, Y, S, R, P } = p

  switch (key) {
    case 'social': {
      // light green dress shirt, khaki trousers, a goatee, sunglasses and a black hat
      const G = '#69DB7C'
      const GD = '#40C057'
      const GL = '#B2F2BB'
      const K = '#C8B48A'
      const KD = '#A8956F'
      const BEARD = '#5C3A21'
      return {
        top: -2.9,
        svg:
          torso(p, G, GD, 5.5, 4.5) +
          P([[4.6, 4.5], [6, 4.5], [5.55, 5.15]], GL) +
          P([[6, 4.5], [7.4, 4.5], [6.45, 5.15]], GL) +
          R(5.92, 4.95, 0.16, 0.55, GD) +
          R(5.85, 5.0, 0.3, 0.18, '#F1F3F5') +
          // goatee: a short moustache and a tuft on the chin
          R(5.1, 3.6, 1.8, 0.3, BEARD) +
          R(5.4, 3.95, 1.2, 0.75, BEARD) +
          R(5.55, 4.0, 0.4, 0.15, '#fff', ' opacity="0.15"') +
          R(1, 5.5, 10, 0.5, K) +
          R(1, 5.5, 10, 0.18, '#5C3D24') +
          R(5.55, 5.44, 0.9, 0.3, '#E0B03A') +
          LEGS.map(l => R(l, 6, 1, 1.6, K) + R(l + 0.65, 6, 0.35, 1.6, KD) + R(l - 0.15, 7.6, 1.3, 0.4, '#1D1D1F')).join('') +
          oculos(p) +
          fedora(p, { crown: '#1C1C1F', brim: '#0E0E10', band: '#55555C' }),
      }
    }

    case 'couro': {
      // long open red leather coat over a grey t-shirt, a strap across the
      // chest, a silver mask with glowing red eyes, and a blue tape player in
      // his hand wired to the mask
      const COAT = '#9B2335'
      const COAT_D = '#6B1424'
      const COAT_L = '#D0566A'
      const SHINE = ' opacity="0.35"'
      const SHIRT = '#8D949C'
      const SHIRT_D = '#6C737B'
      const STRAP = '#2B2B2E'
      const PANTS = '#3B3B42'
      const SILVER = '#9AA0A6'
      const SILVER_L = '#C9CDD2'
      const SILVER_D = '#5F6368'
      const GOLD = '#B8962E'
      const GOLD_D = '#8C7020'
      // a red eye with a glow and a little lens flare, pulsing while the scene moves
      const eye = (a: number) => {
        const pulse = lively ? `<animate attributeName="opacity" values="0.35;0.8;0.35" dur="1.6s" repeatCount="indefinite"/>` : ''
        return `<g shape-rendering="geometricPrecision">
          <circle cx="${X(a)}" cy="${Y(2.5)}" r="${S(1.05)}" fill="#FF2D2D" opacity="0.5">${pulse}</circle>
          <rect x="${X(a - 1.4)}" y="${Y(2.45)}" width="${S(2.8)}" height="${S(0.1)}" fill="#FF9A9A" opacity="0.8"/>
          <rect x="${X(a - 0.05)}" y="${Y(1.25)}" width="${S(0.1)}" height="${S(2.5)}" fill="#FF9A9A" opacity="0.6"/>
          <circle cx="${X(a)}" cy="${Y(2.5)}" r="${S(0.5)}" fill="#FF4D4D"/>
          <circle cx="${X(a)}" cy="${Y(2.5)}" r="${S(0.22)}" fill="#FFF0F0"/></g>`
      }
      const buttons = (a: number) => [1.0, 1.5, 2.0].map(b => R(a, b, 0.75, 0.25, SILVER_D)).join('')
      return {
        top: -1.2,
        svg:
          // sleeves, and the coat's sides from the shoulders down
          R(0, 2, 1, 2, COAT) +
          R(11, 2, 1, 2, COAT) +
          R(0, 3.6, 1, 0.4, COAT_D) +
          R(11, 3.6, 1, 0.4, COAT_D) +
          R(0.15, 2.15, 0.2, 1.2, '#fff', SHINE) +
          R(1, 3.0, 1.1, 1.1, COAT) +
          R(9.9, 3.0, 1.1, 1.1, COAT) +
          R(1, 4.1, 3.4, 1.5, COAT) +
          R(7.6, 4.1, 3.4, 1.5, COAT) +
          P([[3.3, 4.1], [4.4, 4.1], [4.4, 5.1]], COAT_D) +
          P([[7.6, 4.1], [8.7, 4.1], [7.6, 5.1]], COAT_D) +
          R(1.3, 4.3, 1.6, 0.15, '#fff', SHINE) +
          R(9.1, 4.3, 1.6, 0.15, '#fff', SHINE) +
          // grey t-shirt in the open front, with the belt over it
          R(4.4, 4.1, 3.2, 1.5, SHIRT) +
          R(5.3, 4.1, 1.4, 0.25, SHIRT_D) +
          R(4.4, 5.35, 3.2, 0.28, STRAP) +
          R(5.7, 5.3, 0.6, 0.38, '#ADB5BD') +
          // a strap across the chest with a gold buckle
          P([[1.4, 4.1], [2.5, 4.1], [9.6, 5.6], [8.5, 5.6]], STRAP) +
          R(5.45, 4.62, 0.75, 0.45, '#C9A227') +
          // the coat's long skirt, open over dark trousers and boots
          R(3.9, 5.6, 4.2, 0.4, PANTS) +
          R(4, 6, 1, 1.6, PANTS) +
          R(7, 6, 1, 1.6, PANTS) +
          R(0.8, 5.6, 3.1, 1.9, COAT) +
          R(8.1, 5.6, 3.1, 1.9, COAT) +
          R(0.8, 7.25, 3.1, 0.25, COAT_D) +
          R(8.1, 7.25, 3.1, 0.25, COAT_D) +
          R(1.1, 5.8, 0.2, 1.3, '#fff', SHINE) +
          R(10.6, 5.8, 0.2, 1.3, '#fff', SHINE) +
          LEGS.map(l => R(l - 0.15, 7.6, 1.3, 0.4, '#1A1A1A')).join('') +
          // silver mask over his whole face: fins at the top, gold faceplate,
          // buttons on the sides, a breathing grille and two canisters at the jaw
          R(1, -0.5, 10, 4.6, SILVER) +
          R(1, -0.5, 10, 0.35, SILVER_L) +
          R(0.7, -1.2, 1.9, 1.4, SILVER_D) +
          R(9.4, -1.2, 1.9, 1.4, SILVER_D) +
          R(0.9, -1.05, 1.4, 0.3, SILVER_L) +
          R(9.7, -1.05, 1.4, 0.3, SILVER_L) +
          R(4.3, -0.85, 3.4, 0.45, SILVER_D) +
          R(2.0, 1.25, 8.0, 2.3, GOLD) +
          R(2.0, 3.25, 8.0, 0.3, GOLD_D) +
          buttons(1.15) +
          buttons(10.1) +
          R(4.4, 2.9, 3.2, 1.5, SILVER_L) +
          R(4.7, 3.05, 2.6, 1.2, '#2F3236') +
          [3.2, 3.55, 3.9].map(b => R(4.85, b, 2.3, 0.12, '#6C7076')).join('') +
          R(1.6, 3.6, 2.2, 0.8, SILVER_L) +
          R(1.35, 3.65, 0.5, 0.7, '#2B2D31') +
          R(8.2, 3.6, 2.2, 0.8, SILVER_L) +
          R(10.15, 3.65, 0.5, 0.7, '#2B2D31') +
          eye(3.5) +
          eye(8.5) +
          // the blue tape player in his right hand, wired to the side of the mask
          `<path d="M${X(12.6)},${Y(3.1)} Q${X(13.2)},${Y(2.2)} ${X(11)},${Y(2.3)}" fill="none" stroke="#343A40" stroke-width="${S(0.14)}" shape-rendering="geometricPrecision"/>` +
          R(11.05, 3.1, 1.9, 1.5, '#1C7ED6', ` rx="${S(0.2)}"`) +
          R(11.05, 4.25, 1.9, 0.35, '#1864AB') +
          R(11.3, 3.35, 1.4, 0.75, '#A5D8FF') +
          R(11.4, 3.62, 1.2, 0.2, '#1D3557') +
          R(11.3, 2.9, 0.5, 0.2, '#ADB5BD') +
          (lively ? notas(p) : ''),
      }
    }

    case 'boina': {
      // beret, blue scarf, a long overcoat and a cigar that smokes
      const C = '#9C6B43'
      const CD = '#7A5233'
      const B = '#2F6FDE'
      const BD = '#1F4FB0'
      const BL = '#74A4F5'
      const BERET = '#4A3423'
      const BTN = '#3A2A1C'
      const ember = lively
        ? `<rect x="${X(10.65)}" y="${Y(4.02)}" width="${S(0.3)}" height="${S(0.47)}" fill="#E8590C"><animate attributeName="fill" values="#C2410C;#FFB020;#E8590C;#C2410C" keyTimes="0;0.12;0.3;1" dur="3.6s" repeatCount="indefinite"/></rect>`
        : R(10.65, 4.02, 0.3, 0.47, '#E8590C')
      return {
        top: -2.1,
        svg:
          // overcoat from the scarf down, with a long skirt over the tentacles
          // (nothing up by his head: the arms stay his own colour)
          R(1, 4.6, 10, 1.1, C) +
          R(0.7, 5.6, 10.6, 1.35, C) +
          R(0.7, 5.7, 10.6, 0.3, CD) +
          R(0.7, 6.7, 10.6, 0.25, CD) +
          R(5.95, 6.0, 0.1, 0.95, CD) +
          R(5.25, 6.15, 0.35, 0.35, BTN) +
          R(6.4, 6.15, 0.35, 0.35, BTN) +
          LEGS.map(l => R(l, 6.95, 1, 0.65, '#2B2B30') + R(l - 0.15, 7.6, 1.3, 0.4, '#151515')).join('') +
          // scarf round his neck, knotted on his right so the cigar shows, its ends hanging over the coat
          R(1, 4.6, 10, 0.75, B) +
          R(1, 4.6, 10, 0.15, BL) +
          R(1, 5.2, 10, 0.15, BD) +
          R(2.6, 4.55, 1.4, 0.95, BD) +
          R(2.7, 5.35, 0.85, 2.0, B) +
          R(3.65, 5.35, 0.8, 1.6, B) +
          R(2.7, 6.05, 0.85, 0.18, BL) +
          R(2.7, 7.15, 0.85, 0.2, BL) +
          R(3.65, 6.75, 0.8, 0.2, BL) +
          // plaid beret in khaki, brown and green, slouching to his left
          xadrez(p, 2.4, -1.15, 7.4, 1.25) +
          xadrez(p, 3.2, -1.65, 5.8, 0.55) +
          xadrez(p, 8.6, -0.85, 1.9, 0.9) +
          R(5.75, -2.1, 0.45, 0.5, BERET) +
          R(2.6, -0.1, 7.0, 0.3, BERET) +
          R(3.5, -1.5, 1.3, 0.2, '#fff', ' opacity="0.18"') +
          // cigar in his mouth, its tip glowing with each puff
          R(6.4, 3.98, 3.9, 0.55, '#7B4A26') +
          R(6.4, 3.98, 3.9, 0.15, '#A0673A') +
          R(7.1, 3.98, 0.45, 0.55, '#D4A72C') +
          R(10.3, 3.98, 0.35, 0.55, '#9A9A9A') +
          ember +
          fumaca(p, lively),
      }
    }
  }
}

// Where the agents' little Claudes stand, behind the main one: the bottom
// centre of each (feet), front pair first.
const MINI_SLOTS: [number, number][] = [
  [44, 420],
  [256, 420],
  [98, 352],
  [202, 352],
  [36, 350],
  [264, 350],
]

export const buildScene = (d: SceneData, animate: boolean): string => {
  const broken = d.broken
  const isBroken = broken !== undefined
  const pct = d.contextPercent
  const p = Math.max(0, Math.min(100, pct ?? 0))
  const lively = animate && !isBroken

  // ── Header: tokens, context and the limit bars ──
  const T = isBroken ? '#9a9a9a' : '#f4f4f5'
  const SUB = isBroken ? '#7c7c7c' : '#c4c4cc'
  const LABEL = isBroken ? '#777' : '#a8a8b3'
  const ctxLine =
    pct === undefined ? 'aguardando a 1ª resposta' : `${fmt(d.contextTokens ?? 0)} / ${fmt(d.contextWindow ?? 0)} · ${Math.round(p)}%`

  const header = `
    <text x="18" y="30" class="label" fill="${isBroken ? '#ff6b6b' : LABEL}">${isBroken ? '⚠ LIMITE ATINGIDO' : 'TOKENS DA SESSÃO'}</text>
    <text x="18" y="72" class="huge" fill="${T}">${fmt(d.totalTokens)}</text>
    <text x="18" y="94" class="sm" fill="${SUB}">entrada ${fmt(d.input)} · saída ${fmt(d.output)}</text>
    <text x="18" y="112" class="sm" fill="${SUB}">cache ${fmt(d.cache)}${d.usd !== undefined ? ` · US$ ${d.usd.toFixed(2)}` : ''}</text>
    <text x="18" y="130" class="sm" fill="${SUB}">chat ${fmt(d.mainTokens)} · agentes ${fmt(d.agentTokens)}</text>
    <text x="18" y="156" class="label" fill="${LABEL}">CONTEXTO</text>
    <text x="${W - 18}" y="156" text-anchor="end" class="sm b" fill="${isBroken ? SUB : levelColor(p)}">${esc(ctxLine)}</text>`

  const BAR_Y = 182
  const limits = d.limits.slice(0, 3)
  const limitRows = limits.length
    ? limits
        .map((l, i) => {
          const y = BAR_Y + i * 32
          const lp = Math.max(0, Math.min(100, l.percentUsed))
          const isOut = l.percentUsed >= 100
          const c = isOut ? '#ff6b6b' : isBroken ? '#6f6f6f' : levelColor(lp)
          const bw = W - 36
          const right = isOut ? `${Math.round(l.percentUsed)}% · ESGOTADO` : `${Number(lp.toFixed(1))}%`
          return `<g><title>Limite ${esc(limitName(l.kind))}: ${l.percentUsed}% usado</title>
            <text x="18" y="${y + 2}" class="sm" fill="${isOut ? '#ffb3b3' : SUB}">limite ${esc(limitName(l.kind))}</text>
            <text x="${W - 18}" y="${y + 2}" text-anchor="end" class="sm b" fill="${c}">${right}</text>
            <rect x="18" y="${y + 8}" width="${bw}" height="7" rx="3.5" fill="#ffffff" fill-opacity="0.12"/>
            <rect x="18" y="${y + 8}" width="${n((bw * lp) / 100)}" height="7" rx="3.5" fill="${c}"/></g>`
        })
        .join('')
    : `<text x="18" y="${BAR_Y + 2}" class="sm" fill="${LABEL}">limites de uso: sem leitura ainda</text>`

  // ── The stage: agents in costume behind, Claude in front in his disguise ──
  const agents = d.agents.slice(-MINI_SLOTS.length)
  const hiddenAgents = d.agents.length - agents.length
  const MU = 5
  const minis = agents
    .map((a, i) => {
      const [sx, base] = MINI_SLOTS[i]!
      const x = sx - 6 * MU
      const y = base - 8 * MU
      const pp = pen(x, y, MU)
      const fig = figurinoFor(hiddenAgents + i)
      const dress = costume(fig.key, pp, lively)
      const tint = MINI_TINTS[i % MINI_TINTS.length]!
      const color = a.isRunning ? tint : '#C9A296'
      const bob =
        lively && a.isRunning
          ? `<animateTransform attributeName="transform" type="translate" values="0,0;0,-5;0,0" dur="${(0.55 + (i % 3) * 0.12).toFixed(2)}s" repeatCount="indefinite"/>`
          : ''
      return `<g class="mini"><title>${esc(a.type)} — ${esc(a.description)}\n${esc(fig.name)}\n${fmt(a.tokens)} tokens · ${a.isRunning ? 'rodando' : 'terminou'}</title>
        <ellipse cx="${sx}" cy="${base + 2}" rx="${n(5.5 * MU)}" ry="3" fill="#000" opacity="0.22"/>
        <g opacity="${a.isRunning ? 1 : 0.75}">${bob}
          ${claude(x, y, MU, { color, shade: a.isRunning ? ORANGE_DARK : '#A8857A', light: a.isRunning ? ORANGE_LIGHT : '#D9B9AE', eyes: isBroken ? 'x' : 'open', blink: lively, blinkDelay: i * 0.7 })}
          <g class="fig-${fig.key}">${dress.svg}</g>
          <text x="${sx}" y="${n(pp.Y(dress.top) - 4)}" text-anchor="middle" class="xs" fill="${a.isRunning ? '#ffd3c2' : '#bdbdbd'}">${esc(clip(a.type, 9))}${a.isRunning ? '' : ' ✓'}</text>
        </g></g>`
    })
    .join('')
  const moreAgents = hiddenAgents > 0 ? `<text x="${W - 18}" y="252" text-anchor="end" class="xs" fill="${SUB}">+${hiddenAgents} agentes</text>` : ''

  const U = 11
  const MX = CX - 6 * U
  const MY = 330
  const skills = d.skills.slice(0, ACCESSORIES.length)
  const worn = skills.map((_, i) => accessory(ACCESSORIES[i]!.key, pen(MX, MY, U), lively))

  const body = claude(MX, MY, U, {
    color: ORANGE,
    shade: ORANGE_DARK,
    light: ORANGE_LIGHT,
    eyes: isBroken ? 'x' : 'open',
    blink: lively,
  })
  const mainBob = lively
    ? `<animateTransform attributeName="transform" type="translate" values="0,0;0,-4;0,0" dur="1.9s" repeatCount="indefinite"/>`
    : ''
  const main = `<g class="claude"><title>Claude${skills.length ? ` com ${skills.length} peça(s) do disfarce` : ''}</title>
    <ellipse cx="${CX}" cy="${MY + 8 * U + 4}" rx="${6.2 * U}" ry="6" fill="#000" opacity="0.28"/>
    <g ${isBroken ? `transform="rotate(-5,${CX},${MY + 8 * U})"` : ''}>${mainBob}
      ${body}
      ${worn.join('')}
    </g></g>`

  // Speech bubble: the context, or how he feels when the limit is gone. It
  // sits right under the limit bars, clear of the name tags of the agents
  // behind him, and points at his head (or his hat).
  const BY = limits.length >= 3 ? 266 : 240
  const bubbleText = isBroken ? 'zzz… sem energia' : pct === undefined ? 'oi!' : `contexto ${Math.round(p)}%`
  const bubble = `<g class="bubble">
    <rect x="12" y="${BY}" width="104" height="26" rx="9" fill="${isBroken ? '#3a3a3a' : '#f4f4f5'}"/>
    <polygon points="96,${BY + 25} 108,${BY + 25} 118,${BY + 52}" fill="${isBroken ? '#3a3a3a' : '#f4f4f5'}"/>
    <text x="64" y="${BY + 17}" text-anchor="middle" class="xs" fill="${isBroken ? '#9a9a9a' : '#2a2a2e'}">${esc(bubbleText)}</text></g>`

  // A little rain cloud over him when the limit is gone.
  const drops = [0, 1, 2, 3, 4]
    .map(k => {
      const x = CX - 26 + k * 13
      return animate
        ? `<rect x="${x}" y="268" width="2" height="7" rx="1" fill="#8fa3b8"><animate attributeName="y" values="266;318" dur="${(0.9 + (k % 3) * 0.15).toFixed(2)}s" begin="-${(k * 0.27).toFixed(2)}s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.9;0" dur="${(0.9 + (k % 3) * 0.15).toFixed(2)}s" begin="-${(k * 0.27).toFixed(2)}s" repeatCount="indefinite"/></rect>`
        : `<rect x="${x}" y="${276 + (k % 2) * 12}" width="2" height="7" rx="1" fill="#8fa3b8" opacity="0.7"/>`
    })
    .join('')
  const cloud = isBroken
    ? `<g class="cloud"><title>sem energia: limite esgotado</title>
        <ellipse cx="${CX}" cy="252" rx="40" ry="13" fill="#6b6b70"/>
        <circle cx="${CX - 16}" cy="244" r="14" fill="#6b6b70"/>
        <circle cx="${CX + 12}" cy="241" r="17" fill="#77777c"/>
        ${drops}</g>`
    : ''

  // ── Below the stage: which skill gave which piece of the disguise ──
  const ACC_Y = 454
  const accList = skills.length
    ? `<text x="18" y="${ACC_Y}" class="label" fill="${LABEL}">DISFARCE · SKILLS</text>
       ${skills
         .map((s, i) => {
           const col = i % 2
           const row = Math.floor(i / 2)
           return `<text x="${18 + col * 136}" y="${ACC_Y + 20 + row * 17}" class="sm" fill="${SUB}"><title>${esc(ACCESSORIES[i]!.name)}: skill ${esc(s.name)}, usada ${s.count}×</title>${ACCESSORIES[i]!.emoji} ${esc(clip(s.name, 12))}${s.count > 1 ? ` ×${s.count}` : ''}</text>`
         })
         .join('')}
       ${d.skills.length > skills.length ? `<text x="${W - 18}" y="${ACC_Y}" text-anchor="end" class="xs" fill="${SUB}">+${d.skills.length - skills.length} skills</text>` : ''}`
    : `<text x="${CX}" y="${ACC_Y + 6}" text-anchor="middle" class="sm" fill="${LABEL}">cada skill usada vira uma peça do disfarce</text>
       <text x="${CX}" y="${ACC_Y + 24}" text-anchor="middle" class="sm" fill="${LABEL}">cada agente, um Claudezinho fantasiado</text>`

  const kindsText = broken ? broken.kinds.map(limitName).join(' e ') : ''
  const brokenMsg = isBroken
    ? `<rect x="14" y="554" width="${W - 28}" height="58" rx="10" fill="#000" opacity="0.35"/>
       <text x="${CX}" y="575" text-anchor="middle" class="title" fill="#e9e9e9">CLAUDE ESGOTADO</text>
       <text x="${CX}" y="592" text-anchor="middle" class="sm" fill="#ffb3b3">limite ${esc(kindsText)} acabou</text>
       <text x="${CX}" y="606" text-anchor="middle" class="xs" fill="#9a9a9a">${
         broken!.resetIn ? `nada funciona até voltar: ~${esc(broken!.resetIn)}` : 'nada mais vai funcionar por enquanto'
       }</text>`
    : ''

  const running = d.agents.filter(a => a.isRunning).length
  const legend = isBroken
    ? ''
    : `<text x="18" y="${H - 18}" class="sm" fill="${SUB}">agentes ${d.agents.length}${running ? ` (${running} rodando)` : ''}</text>
       <text x="${W - 18}" y="${H - 18}" text-anchor="end" class="sm" fill="${SUB}">skills ${d.skills.length}</text>`

  const bg = isBroken ? ['#2b2b2d', '#1b1b1c', '#111112'] : ['#4a4a51', '#38383e', '#2a2a2f']

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" font-family="Inter, Segoe UI, system-ui, sans-serif">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${bg[0]}"/><stop offset="60%" stop-color="${bg[1]}"/><stop offset="100%" stop-color="${bg[2]}"/></linearGradient>
    <radialGradient id="spot" cx="50%" cy="58%" r="45%"><stop offset="0%" stop-color="#fff" stop-opacity="${isBroken ? 0.03 : 0.1}"/><stop offset="100%" stop-color="#fff" stop-opacity="0"/></radialGradient>
    <filter id="gray"><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncR type="linear" slope="0.85"/><feFuncG type="linear" slope="0.85"/><feFuncB type="linear" slope="0.85"/></feComponentTransfer></filter>
  </defs>
  <style>
    .huge{font-size:40px;font-weight:800;letter-spacing:-0.5px}
    .title{font-size:16px;font-weight:900;letter-spacing:2px}
    .label{font-size:11px;font-weight:700;letter-spacing:1.6px}
    .sm{font-size:12.5px}
    .b{font-weight:700}
    .xs{font-size:10px;font-weight:600}
  </style>
  <rect width="${W}" height="${H}" rx="18" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" rx="18" fill="url(#spot)"/>
  ${header}
  ${limitRows}
  <g shape-rendering="crispEdges"${isBroken ? ' filter="url(#gray)"' : ''}>
    ${minis}
    ${main}
  </g>
  ${moreAgents}
  ${bubble}
  ${cloud}
  ${accList}
  ${brokenMsg}
  ${legend}
</svg>`
}
