// Builds the pane's scene as one SVG document: a little orange pixel Claude
// on a grey background. Every skill used gives him an accessory (sunglasses,
// a ring, a top hat...), every agent is another little Claude standing
// behind him, and when a usage limit (5h or 7 days) runs out he turns grey.
// Everything moves with SMIL and CSS inside the SVG, so the surface animates
// it with no redraws from the mod and no model calls.

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
  agents: SceneAgent[]
  /** In the order they were first used: the first gets the first accessory. */
  skills: SceneSkill[]
  broken?: SceneBroken
}

const W = 300
const H = 640
const CX = W / 2

export const SCENE = { width: W, height: H }

/** One accessory per skill, handed out in the order the skills are first used. */
export const ACCESSORIES = [
  { key: 'oculos', name: 'óculos escuros', emoji: '🕶️' },
  { key: 'anel', name: 'anel de ouro', emoji: '💍' },
  { key: 'cartola', name: 'cartola', emoji: '🎩' },
  { key: 'gravata', name: 'gravata borboleta', emoji: '🎀' },
  { key: 'relogio', name: 'relógio', emoji: '⌚' },
  { key: 'tenis', name: 'tênis vermelho', emoji: '👟' },
  { key: 'balao', name: 'balão', emoji: '🎈' },
  { key: 'capa', name: 'capa de herói', emoji: '🦸' },
  { key: 'aureola', name: 'auréola', emoji: '😇' },
  { key: 'corrente', name: 'corrente de ouro', emoji: '📿' },
] as const

export type AccessoryKey = (typeof ACCESSORIES)[number]['key']

/** The accessory the skill at this position (first-use order) gives. */
export const accessoryFor = (index: number) => ACCESSORIES[index]

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

/** One accessory drawn on the main Claude; `back` ones go behind his body. */
const accessory = (
  key: AccessoryKey,
  x: number,
  y: number,
  u: number,
  animate: boolean,
  has: Set<AccessoryKey>,
): { back?: string; front?: string } => {
  const X = (a: number) => n(x + a * u)
  const Y = (b: number) => n(y + b * u)
  const S = (v: number) => n(v * u)
  const R = (a: number, b: number, w: number, h: number, f: string, extra = '') =>
    `<rect x="${X(a)}" y="${Y(b)}" width="${S(w)}" height="${S(h)}" fill="${f}"${extra}/>`

  switch (key) {
    case 'oculos':
      return {
        front: `<g class="acc-oculos"><title>óculos escuros</title>
          ${R(2.2, 1.6, 2.6, 1.9, '#111')}${R(7.2, 1.6, 2.6, 1.9, '#111')}
          ${R(4.8, 2.0, 2.4, 0.4, '#111')}${R(0.9, 1.9, 1.3, 0.35, '#111')}${R(9.8, 1.9, 1.3, 0.35, '#111')}
          ${R(2.5, 1.85, 0.7, 0.35, '#fff', ' opacity="0.65"')}${R(7.5, 1.85, 0.7, 0.35, '#fff', ' opacity="0.65"')}</g>`,
      }
    case 'anel':
      return {
        front: `<g class="acc-anel"><title>anel de ouro</title>
          <circle cx="${X(11.5)}" cy="${Y(3.7)}" r="${S(0.42)}" fill="none" stroke="#FFD54A" stroke-width="${S(0.24)}"/>
          <circle cx="${X(11.5)}" cy="${Y(3.2)}" r="${S(0.24)}" fill="#7DF9FF">${
            animate ? `<animate attributeName="opacity" values="1;0.4;1" dur="1.4s" repeatCount="indefinite"/>` : ''
          }</circle></g>`,
      }
    case 'cartola':
      return {
        front: `<g class="acc-cartola"><title>cartola</title>
          ${R(3.6, -3.6, 4.8, 3.2, '#1B1B1D')}${R(3.6, -1.45, 4.8, 0.55, '#C0392B')}${R(2.4, -0.55, 7.2, 0.6, '#111')}
          ${R(3.8, -3.5, 0.5, 2.0, '#fff', ' opacity="0.12"')}</g>`,
      }
    case 'gravata':
      return {
        front: `<g class="acc-gravata"><title>gravata borboleta</title>
          <polygon points="${X(6)},${Y(5.0)} ${X(4.8)},${Y(4.4)} ${X(4.8)},${Y(5.6)}" fill="#3B5BDB"/>
          <polygon points="${X(6)},${Y(5.0)} ${X(7.2)},${Y(4.4)} ${X(7.2)},${Y(5.6)}" fill="#3B5BDB"/>
          ${R(5.7, 4.7, 0.6, 0.6, '#2B44B0')}</g>`,
      }
    case 'relogio':
      return {
        front: `<g class="acc-relogio"><title>relógio</title>
          ${R(-0.15, 3.35, 1.3, 0.55, '#333')}
          <circle cx="${X(0.5)}" cy="${Y(3.62)}" r="${S(0.4)}" fill="#F1F3F5" stroke="#333" stroke-width="${S(0.12)}"/>
          <path d="M${X(0.5)},${Y(3.62)} L${X(0.5)},${Y(3.38)}" stroke="#333" stroke-width="${S(0.08)}"/></g>`,
      }
    case 'tenis':
      return {
        front: `<g class="acc-tenis"><title>tênis vermelho</title>${[2, 4, 7, 9]
          .map(l => `${R(l - 0.25, 7.25, 1.5, 0.75, '#E03131')}${R(l - 0.25, 7.8, 1.5, 0.22, '#fff')}`)
          .join('')}</g>`,
      }
    case 'balao': {
      const sway = animate
        ? `<animateTransform attributeName="transform" type="rotate" values="-5,${X(12)},${Y(2.6)};6,${X(12)},${Y(2.6)};-5,${X(12)},${Y(2.6)}" dur="3.2s" repeatCount="indefinite"/>`
        : ''
      return {
        front: `<g class="acc-balao"><title>balão</title>${sway}
          <path d="M${X(11.9)},${Y(2.6)} Q${X(13.6)},${Y(0)} ${X(13.3)},${Y(-2.9)}" fill="none" stroke="#ddd" stroke-width="${S(0.1)}"/>
          <ellipse cx="${X(13.4)}" cy="${Y(-4.3)}" rx="${S(1.15)}" ry="${S(1.4)}" fill="#FF6B9D"/>
          <ellipse cx="${X(13.0)}" cy="${Y(-4.8)}" rx="${S(0.3)}" ry="${S(0.45)}" fill="#fff" opacity="0.5"/>
          <polygon points="${X(13.4)},${Y(-2.95)} ${X(13.1)},${Y(-2.6)} ${X(13.7)},${Y(-2.6)}" fill="#E0507F"/></g>`,
      }
    }
    case 'capa':
      return {
        back: `<g class="acc-capa"><title>capa de herói</title>
          <polygon points="${X(1.3)},${Y(0.6)} ${X(10.7)},${Y(0.6)} ${X(12.6)},${Y(7.8)} ${X(-0.6)},${Y(7.8)}" fill="#7B2FF7"/>
          <polygon points="${X(-0.6)},${Y(7.8)} ${X(12.6)},${Y(7.8)} ${X(12.2)},${Y(7.2)} ${X(-0.2)},${Y(7.2)}" fill="#5A1FC0"/></g>`,
      }
    case 'aureola': {
      const top = has.has('cartola') ? -4.5 : -1.2
      return {
        front: `<g class="acc-aureola"><title>auréola</title>
          <ellipse cx="${X(6)}" cy="${Y(top)}" rx="${S(2.6)}" ry="${S(0.55)}" fill="none" stroke="#FFE066" stroke-width="${S(0.32)}">${
            animate ? `<animate attributeName="stroke-opacity" values="1;0.55;1" dur="2s" repeatCount="indefinite"/>` : ''
          }</ellipse></g>`,
      }
    }
    case 'corrente':
      return {
        front: `<g class="acc-corrente"><title>corrente de ouro</title>
          <path d="M${X(2)},${Y(3.9)} Q${X(6)},${Y(5.7)} ${X(10)},${Y(3.9)}" fill="none" stroke="#FFD54A" stroke-width="${S(0.26)}" stroke-dasharray="${S(0.3)} ${S(0.15)}"/>
          <circle cx="${X(6)}" cy="${Y(4.85)}" r="${S(0.4)}" fill="#FFC107" stroke="#B8860B" stroke-width="${S(0.08)}"/></g>`,
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

  // ── The stage: agents behind, Claude in front, his accessories on him ──
  const agents = d.agents.slice(-MINI_SLOTS.length)
  const hiddenAgents = d.agents.length - agents.length
  const MU = 4.6
  const minis = agents
    .map((a, i) => {
      const [sx, base] = MINI_SLOTS[i]!
      const x = sx - 6 * MU
      const y = base - 8 * MU
      const tint = MINI_TINTS[i % MINI_TINTS.length]!
      const color = a.isRunning ? tint : '#C9A296'
      const bob =
        lively && a.isRunning
          ? `<animateTransform attributeName="transform" type="translate" values="0,0;0,-5;0,0" dur="${(0.55 + (i % 3) * 0.12).toFixed(2)}s" repeatCount="indefinite"/>`
          : ''
      return `<g class="mini"><title>${esc(a.type)} — ${esc(a.description)}\n${fmt(a.tokens)} tokens · ${a.isRunning ? 'rodando' : 'terminou'}</title>
        <ellipse cx="${sx}" cy="${base + 2}" rx="${n(5.5 * MU)}" ry="3" fill="#000" opacity="0.22"/>
        <g opacity="${a.isRunning ? 1 : 0.75}">${bob}
          ${claude(x, y, MU, { color, shade: a.isRunning ? ORANGE_DARK : '#A8857A', light: a.isRunning ? ORANGE_LIGHT : '#D9B9AE', eyes: isBroken ? 'x' : 'open', blink: lively, blinkDelay: i * 0.7 })}
          <text x="${sx}" y="${n(y - 4)}" text-anchor="middle" class="xs" fill="${a.isRunning ? '#ffd3c2' : '#bdbdbd'}">${esc(clip(a.type, 9))}${a.isRunning ? '' : ' ✓'}</text>
        </g></g>`
    })
    .join('')
  const moreAgents = hiddenAgents > 0 ? `<text x="${W - 18}" y="252" text-anchor="end" class="xs" fill="${SUB}">+${hiddenAgents} agentes</text>` : ''

  const U = 11
  const MX = CX - 6 * U
  const MY = 330
  const skills = d.skills.slice(0, ACCESSORIES.length)
  const keys = skills.map((_, i) => ACCESSORIES[i]!.key)
  const has = new Set<AccessoryKey>(keys)
  const worn = keys.map(k => accessory(k, MX, MY, U, lively, has))

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
  const main = `<g class="claude"><title>Claude${skills.length ? ` com ${skills.length} acessório(s)` : ''}</title>
    <ellipse cx="${CX}" cy="${MY + 8 * U + 4}" rx="${6.2 * U}" ry="6" fill="#000" opacity="0.28"/>
    <g ${isBroken ? `transform="rotate(-5,${CX},${MY + 8 * U})"` : ''}>${mainBob}
      ${worn.map(w => w.back ?? '').join('')}
      ${body}
      ${worn.map(w => w.front ?? '').join('')}
    </g></g>`

  // Speech bubble: the context, or how he feels when the limit is gone.
  const bubbleText = isBroken ? 'zzz… sem energia' : pct === undefined ? 'oi!' : `contexto ${Math.round(p)}%`
  const bubble = `<g class="bubble">
    <rect x="12" y="266" width="104" height="26" rx="9" fill="${isBroken ? '#3a3a3a' : '#f4f4f5'}"/>
    <polygon points="92,291 104,291 110,318" fill="${isBroken ? '#3a3a3a' : '#f4f4f5'}"/>
    <text x="64" y="283" text-anchor="middle" class="xs" fill="${isBroken ? '#9a9a9a' : '#2a2a2e'}">${esc(bubbleText)}</text></g>`

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

  // ── Below the stage: which skill gave which accessory ──
  const ACC_Y = 454
  const accList = skills.length
    ? `<text x="18" y="${ACC_Y}" class="label" fill="${LABEL}">ACESSÓRIOS · SKILLS</text>
       ${skills
         .map((s, i) => {
           const col = i % 2
           const row = Math.floor(i / 2)
           return `<text x="${18 + col * 136}" y="${ACC_Y + 20 + row * 17}" class="sm" fill="${SUB}"><title>${esc(ACCESSORIES[i]!.name)}: skill ${esc(s.name)}, usada ${s.count}×</title>${ACCESSORIES[i]!.emoji} ${esc(clip(s.name, 12))}${s.count > 1 ? ` ×${s.count}` : ''}</text>`
         })
         .join('')}
       ${d.skills.length > skills.length ? `<text x="${W - 18}" y="${ACC_Y}" text-anchor="end" class="xs" fill="${SUB}">+${d.skills.length - skills.length} skills</text>` : ''}`
    : `<text x="${CX}" y="${ACC_Y + 6}" text-anchor="middle" class="sm" fill="${LABEL}">cada skill usada vira um acessório</text>
       <text x="${CX}" y="${ACC_Y + 24}" text-anchor="middle" class="sm" fill="${LABEL}">cada agente, um Claudezinho atrás dele</text>`

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
