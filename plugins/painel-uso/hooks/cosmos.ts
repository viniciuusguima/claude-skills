// Builds the animated "solar system of the session" as one SVG document.
// Everything moves with SMIL and CSS inside the SVG itself, so the surface
// animates it with no redraws from the mod and no model calls.

export type CosmosAgent = {
  type: string
  description: string
  isRunning: boolean
  tokens: number
}

export type CosmosSkill = { name: string; count: number }

export type CosmosLimit = { kind: string; percentUsed: number }

export type CosmosData = {
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
  limits: CosmosLimit[]
  agents: CosmosAgent[]
  skills: CosmosSkill[]
}

const W = 440
const H = 500
const CX = W / 2
const CY = 285
const PLANET_R = 66

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s)

export const fmt = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  if (n >= 10_000) return `${Math.round(n / 1000)}k`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(Math.round(n))
}

const levelColor = (p: number): [string, string] =>
  p >= 80 ? ['#ff5a5f', '#ff9a6b'] : p >= 50 ? ['#ffb547', '#ffe08a'] : ['#2fd6ff', '#7b8cff']

const AGENT_COLORS = ['#9b7bff', '#3ee6b0', '#ff7bd5', '#5cc8ff', '#ffd25c', '#ff8a5c', '#7bffa1', '#c07bff']

const LIMIT_LABEL: Record<string, string> = {
  five_hour: '5h',
  seven_day: '7d',
  spend_limit: 'gasto',
}

// Deterministic pseudo-random numbers, so the starfield does not jump.
const rand = (seed: number) => {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

const ellipsePath = (rx: number, ry: number) =>
  `M${CX + rx},${CY} A${rx},${ry} 0 1 1 ${CX - rx},${CY} A${rx},${ry} 0 1 1 ${CX + rx},${CY}`

/** One body on a tilted orbit, drawn twice: behind the planet and in front. */
type Orbiter = {
  id: string
  rx: number
  ry: number
  tilt: number
  period: number
  phase: number // 0..1 of the orbit
  body: string // drawn around (0,0)
  title: string
}

const orbitLayer = (o: Orbiter, isFront: boolean, animate: boolean): string => {
  const clipAttr = isFront ? ` clip-path="url(#front-${o.id})"` : ''
  let placed: string

  if (animate) {
    const begin = -(o.phase * o.period)
    placed = `<g><title>${esc(o.title)}</title>
      <animateMotion dur="${o.period}s" begin="${begin}s" repeatCount="indefinite" path="${ellipsePath(o.rx, o.ry)}"/>
      <g>${o.body}
        <animateTransform attributeName="transform" type="scale" dur="${o.period}s" begin="${begin}s" repeatCount="indefinite"
          values="1;1.35;1;0.62;1" keyTimes="0;0.25;0.5;0.75;1" calcMode="spline"
          keySplines="0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1"/>
        <animate attributeName="opacity" dur="${o.period}s" begin="${begin}s" repeatCount="indefinite"
          values="1;1;0.85;0.45;0.85" keyTimes="0;0.25;0.5;0.75;1"/>
      </g></g>`
  } else {
    const a = o.phase * Math.PI * 2
    const x = CX + o.rx * Math.cos(a)
    const y = CY + o.ry * Math.sin(a)
    const s = 1 + 0.35 * Math.sin(a)
    placed = `<g transform="translate(${x.toFixed(1)},${y.toFixed(1)}) scale(${s.toFixed(2)})" opacity="${(0.7 + 0.3 * Math.sin(a)).toFixed(2)}"><title>${esc(o.title)}</title>${o.body}</g>`
  }

  return `<g transform="rotate(${o.tilt},${CX},${CY})"${clipAttr}>${placed}</g>`
}

const orbitClip = (o: Orbiter) =>
  `<clipPath id="front-${o.id}" clipPathUnits="userSpaceOnUse"><rect x="0" y="${CY}" width="${W}" height="${H}"/></clipPath>`

const orbitTrack = (o: Orbiter, color: string, opacity: number) =>
  `<ellipse cx="${CX}" cy="${CY}" rx="${o.rx}" ry="${o.ry}" transform="rotate(${o.tilt},${CX},${CY})" fill="none" stroke="${color}" stroke-opacity="${opacity}" stroke-width="1" stroke-dasharray="2 5"/>`

export const buildCosmos = (d: CosmosData, animate: boolean): string => {
  const pct = d.contextPercent
  const p = Math.max(0, Math.min(100, pct ?? 0))
  const [liq1, liq2] = levelColor(p)
  const level = CY + PLANET_R - (2 * PLANET_R * p) / 100
  const r = rand(7)

  // Starfield
  const stars: string[] = []
  for (let i = 0; i < 70; i++) {
    const x = r() * W
    const y = r() * H
    const size = 0.4 + r() * 1.3
    const delay = (r() * 4).toFixed(2)
    stars.push(
      `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${size.toFixed(2)}" fill="#fff" class="${animate ? 'tw' : ''}" style="animation-delay:-${delay}s" opacity="${(0.3 + r() * 0.6).toFixed(2)}"/>`,
    )
  }

  // Limit rings (Saturn-like), back half behind the planet, front half over it.
  const ringParts = d.limits.slice(0, 3).map((l, i) => {
    const rx = PLANET_R + 22 + i * 16
    const ry = rx * 0.26
    const lp = Math.max(0, Math.min(100, l.percentUsed))
    const [c] = levelColor(lp)
    const label = `limite ${LIMIT_LABEL[l.kind] ?? l.kind}  ${'▰'.repeat(Math.round(lp / 10))}${'▱'.repeat(10 - Math.round(lp / 10))}  ${Math.round(lp)}%`
    const ring = (front: boolean) =>
      `<g transform="rotate(-12,${CX},${CY})" ${front ? `clip-path="url(#ringfront)"` : ''}>
        <ellipse cx="${CX}" cy="${CY}" rx="${rx}" ry="${ry}" fill="none" stroke="#ffffff" stroke-opacity="0.10" stroke-width="5"/>
        <ellipse cx="${CX}" cy="${CY}" rx="${rx}" ry="${ry}" fill="none" stroke="${c}" stroke-width="5" stroke-linecap="round"
          pathLength="100" stroke-dasharray="${lp.toFixed(1)} 100" opacity="0.9">
          ${animate ? `<animate attributeName="stroke-dashoffset" values="0;-100" dur="${40 + i * 15}s" repeatCount="indefinite"/>` : ''}
        </ellipse>
      </g>`
    return {
      back: ring(false),
      front: ring(true),
      label: `<text x="22" y="${112 + i * 15}" class="sm" fill="${c}"><title>Limite ${esc(l.kind)}: ${lp}% usado</title>${esc(label)}</text>`,
    }
  })

  // Agents: moons on tilted orbits.
  const agents = d.agents.slice(-8)
  const maxAgentTokens = Math.max(1, ...agents.map(a => a.tokens))
  const agentOrbits: Orbiter[] = agents.map((a, i) => {
    const color = a.isRunning ? AGENT_COLORS[i % AGENT_COLORS.length]! : '#8a8fa8'
    const size = 5 + 7 * Math.sqrt(a.tokens / maxAgentTokens)
    const halo = a.isRunning
      ? `<circle r="${size + 4}" fill="${color}" opacity="0.25" filter="url(#glow)">${
          animate ? `<animate attributeName="r" values="${size + 2};${size + 9};${size + 2}" dur="1.6s" repeatCount="indefinite"/>` : ''
        }</circle>`
      : ''
    const body = `${halo}<circle r="${size.toFixed(1)}" fill="url(#moon-${i})"/>
      <text y="${-size - 5}" text-anchor="middle" class="xs" fill="${color}">${esc(clip(a.type, 16))}${a.isRunning ? '' : ' ✓'}</text>`
    const rx = 112 + i * 12
    return {
      id: `a${i}`,
      rx,
      ry: rx * 0.5,
      tilt: [-8, 10, -18, 4, 16, -4, 22, -14][i % 8]!,
      period: a.isRunning ? 9 + i * 2 : 26 + i * 4,
      phase: (i * 0.37) % 1,
      body,
      title: `${a.type} — ${a.description}\n${fmt(a.tokens)} tokens · ${a.isRunning ? 'rodando' : 'terminou'}`,
    }
  })
  const moonGradients = agents
    .map((a, i) => {
      const c = a.isRunning ? AGENT_COLORS[i % AGENT_COLORS.length]! : '#8a8fa8'
      return `<radialGradient id="moon-${i}" cx="35%" cy="30%" r="75%"><stop offset="0%" stop-color="#ffffff"/><stop offset="35%" stop-color="${c}"/><stop offset="100%" stop-color="#0b0b1e"/></radialGradient>`
    })
    .join('')

  // Skills: golden satellites on the outer belt.
  const skills = d.skills.slice(-10)
  const skillOrbits: Orbiter[] = skills.map((s, i) => {
    const size = 3 + Math.min(5, s.count)
    const star = `<path d="M0,${-size * 1.6} L${size * 0.45},${-size * 0.45} L${size * 1.6},0 L${size * 0.45},${size * 0.45} L0,${size * 1.6} L${-size * 0.45},${size * 0.45} L${-size * 1.6},0 L${-size * 0.45},${-size * 0.45} Z" fill="#ffe27a" filter="url(#glow)">${
      animate ? `<animateTransform attributeName="transform" type="rotate" values="0;360" dur="${6 + (i % 3) * 2}s" repeatCount="indefinite"/>` : ''
    }</path>
      <text y="${size * 1.6 + 11}" text-anchor="middle" class="xs" fill="#ffe9a8">${esc(clip(s.name, 18))}${s.count > 1 ? ` ×${s.count}` : ''}</text>`
    return {
      id: `s${i}`,
      rx: 198,
      ry: 118,
      tilt: 6,
      period: 70,
      phase: skills.length ? i / skills.length : 0,
      body: star,
      title: `skill ${s.name} — usada ${s.count}×`,
    }
  })

  const all = [...agentOrbits, ...skillOrbits]
  const tracks = [
    ...agentOrbits.map((o, i) => orbitTrack(o, agents[i]!.isRunning ? AGENT_COLORS[i % AGENT_COLORS.length]! : '#8a8fa8', 0.35)),
    ...(skillOrbits.length ? [orbitTrack(skillOrbits[0]!, '#ffe27a', 0.25)] : []),
  ]

  // The planet: a glass sphere filling with liquid as the context fills.
  const wave = (amp: number, y: number, color: string, dur: number, opacity: number) => {
    const L = PLANET_R * 2
    let dPath = `M${CX - PLANET_R - L * 2},${y}`
    for (let k = 0; k < 6; k++) {
      const x0 = CX - PLANET_R - L * 2 + k * L
      dPath += ` Q${x0 + L / 4},${y - amp} ${x0 + L / 2},${y} T${x0 + L},${y}`
    }
    dPath += ` V${CY + PLANET_R + 10} H${CX - PLANET_R - L * 2} Z`
    return `<path d="${dPath}" fill="${color}" opacity="${opacity}">${
      animate ? `<animateTransform attributeName="transform" type="translate" values="0,0;${L},0" dur="${dur}s" repeatCount="indefinite"/>` : ''
    }</path>`
  }

  const meridians = [0, 1, 2]
    .map(
      k =>
        `<ellipse cx="${CX}" cy="${CY}" rx="${PLANET_R}" ry="${PLANET_R}" fill="none" stroke="#bfe9ff" stroke-opacity="0.18" stroke-width="1">${
          animate
            ? `<animate attributeName="rx" values="${PLANET_R};0;${PLANET_R}" dur="9s" begin="-${k * 3}s" repeatCount="indefinite"/>`
            : ''
        }</ellipse>`,
    )
    .join('')

  const ctxLine =
    pct === undefined
      ? 'aguardando a 1ª resposta'
      : `${fmt(d.contextTokens ?? 0)} / ${fmt(d.contextWindow ?? 0)}`

  const planet = `
    <circle cx="${CX}" cy="${CY}" r="${PLANET_R + 18}" fill="url(#atmo)"/>
    <circle cx="${CX}" cy="${CY}" r="${PLANET_R}" fill="url(#sphere)"/>
    <g clip-path="url(#planetclip)">
      ${wave(5, level, liq2, 7, 0.45)}
      ${wave(4, level + 3, liq1, 4.5, 0.85)}
      ${meridians}
      <ellipse cx="${CX}" cy="${CY}" rx="${PLANET_R}" ry="${PLANET_R * 0.22}" fill="none" stroke="#bfe9ff" stroke-opacity="0.15"/>
    </g>
    <circle cx="${CX}" cy="${CY}" r="${PLANET_R}" fill="url(#shade)"/>
    <ellipse cx="${CX - PLANET_R * 0.35}" cy="${CY - PLANET_R * 0.45}" rx="${PLANET_R * 0.32}" ry="${PLANET_R * 0.18}" fill="#fff" opacity="0.22" transform="rotate(-30,${CX - PLANET_R * 0.35},${CY - PLANET_R * 0.45})"/>
    <circle cx="${CX}" cy="${CY}" r="${PLANET_R}" fill="none" stroke="${liq1}" stroke-opacity="0.6" stroke-width="1.5"/>
    <text x="${CX}" y="${CY - 2}" text-anchor="middle" class="big">${pct === undefined ? '—' : `${Math.round(p)}%`}</text>
    <text x="${CX}" y="${CY - 30}" text-anchor="middle" class="xs" fill="#e6f4ff">CONTEXTO</text>
    <title>Contexto: ${ctxLine}</title>`

  const header = `
    <text x="22" y="34" class="label">TOKENS DA SESSÃO</text>
    <text x="22" y="68" class="huge">${fmt(d.totalTokens)}</text>
    <text x="22" y="88" class="sm" fill="#a9b4d6">entrada ${fmt(d.input)} · saída ${fmt(d.output)} · cache ${fmt(d.cache)}</text>
    <text x="${W - 22}" y="34" text-anchor="end" class="label">CONTEXTO</text>
    <text x="${W - 22}" y="56" text-anchor="end" class="sm" fill="${liq1}">${esc(ctxLine)}</text>
    ${d.usd !== undefined ? `<text x="${W - 22}" y="74" text-anchor="end" class="sm" fill="#a9b4d6">US$ ${d.usd.toFixed(2)}</text>` : ''}
    <text x="${W - 22}" y="${d.usd !== undefined ? 92 : 74}" text-anchor="end" class="sm" fill="#a9b4d6">chat ${fmt(d.mainTokens)} · agentes ${fmt(d.agentTokens)}</text>`

  const running = d.agents.filter(a => a.isRunning).length
  const legend = `
    <g class="sm">
      <circle cx="26" cy="${H - 22}" r="5" fill="#9b7bff"/>
      <text x="36" y="${H - 18}" fill="#c9c2ff">agentes ${d.agents.length}${running ? ` (${running} rodando)` : ''}</text>
      <path transform="translate(${W / 2 - 34},${H - 22})" d="M0,-7 L2,-2 L7,0 L2,2 L0,7 L-2,2 L-7,0 L-2,-2 Z" fill="#ffe27a"/>
      <text x="${W / 2 - 22}" y="${H - 18}" fill="#ffe9a8">skills ${d.skills.length}</text>
      <ellipse cx="${W - 120}" cy="${H - 22}" rx="9" ry="3" fill="none" stroke="#2fd6ff" stroke-width="2"/>
      <text x="${W - 106}" y="${H - 18}" fill="#bfe9ff">${d.limits.length ? 'limites de uso' : 'sem limites'}</text>
    </g>`

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" font-family="Inter, Segoe UI, system-ui, sans-serif">
  <defs>
    <radialGradient id="space" cx="50%" cy="55%" r="75%"><stop offset="0%" stop-color="#1b1640"/><stop offset="55%" stop-color="#0b0b22"/><stop offset="100%" stop-color="#05050f"/></radialGradient>
    <radialGradient id="nebula" cx="30%" cy="70%" r="60%"><stop offset="0%" stop-color="#6a3cff" stop-opacity="0.28"/><stop offset="100%" stop-color="#6a3cff" stop-opacity="0"/></radialGradient>
    <radialGradient id="nebula2" cx="80%" cy="25%" r="50%"><stop offset="0%" stop-color="#00c2ff" stop-opacity="0.18"/><stop offset="100%" stop-color="#00c2ff" stop-opacity="0"/></radialGradient>
    <radialGradient id="sphere" cx="38%" cy="32%" r="80%"><stop offset="0%" stop-color="#2a3a7a"/><stop offset="60%" stop-color="#121a44"/><stop offset="100%" stop-color="#060918"/></radialGradient>
    <radialGradient id="shade" cx="35%" cy="30%" r="85%"><stop offset="55%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity="0.65"/></radialGradient>
    <radialGradient id="atmo" cx="50%" cy="50%" r="50%"><stop offset="70%" stop-color="${liq1}" stop-opacity="0.35"/><stop offset="100%" stop-color="${liq1}" stop-opacity="0"/></radialGradient>
    <clipPath id="planetclip"><circle cx="${CX}" cy="${CY}" r="${PLANET_R}"/></clipPath>
    <clipPath id="ringfront" clipPathUnits="userSpaceOnUse"><rect x="0" y="${CY}" width="${W}" height="${H}"/></clipPath>
    <filter id="glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    ${moonGradients}
    ${all.map(orbitClip).join('')}
  </defs>
  <style>
    .huge{font-size:34px;font-weight:800;fill:#fff;letter-spacing:-0.5px}
    .big{font-size:28px;font-weight:800;fill:#fff}
    .label{font-size:10px;font-weight:700;fill:#8f9bd0;letter-spacing:1.6px}
    .sm{font-size:11px}
    .xs{font-size:9.5px;font-weight:600}
    .tw{animation:tw 3.6s ease-in-out infinite}
    @keyframes tw{0%,100%{opacity:.25}50%{opacity:1}}
  </style>
  <rect width="${W}" height="${H}" rx="18" fill="url(#space)"/>
  <rect width="${W}" height="${H}" rx="18" fill="url(#nebula)"/>
  <rect width="${W}" height="${H}" rx="18" fill="url(#nebula2)"/>
  ${stars.join('')}
  ${header}
  ${tracks.join('')}
  ${ringParts.map(x => x.back).join('')}
  ${all.map(o => orbitLayer(o, false, animate)).join('')}
  ${planet}
  ${ringParts.map(x => x.front).join('')}
  ${all.map(o => orbitLayer(o, true, animate)).join('')}
  ${ringParts.map(x => x.label).join('')}
  ${agents.length === 0 && skills.length === 0 ? `<text x="${CX}" y="${CY + PLANET_R + 95}" text-anchor="middle" class="sm" fill="#7f88b0">nenhum agente ou skill ainda — eles entram em órbita aqui</text>` : ''}
  ${legend}
</svg>`
}
