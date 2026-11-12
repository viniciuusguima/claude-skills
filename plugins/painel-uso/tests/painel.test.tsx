import { expect, mock, test } from 'claude-code/testing'

const PANE = {
  plugin: 'painel-uso',
  component: 'Pane',
  requestId: 'painel-uso',
  props: {
    title: 'Uso da sessão',
    isFocused: false,
    bodyColumns: 50,
    placement: 'dock',
    scroll: { offset: 0, bodyRows: 30 },
    view: {},
  },
} as const

const usage = {
  input_tokens: 1000,
  output_tokens: 500,
  cache_read_input_tokens: 2000,
  cache_creation_input_tokens: 500,
  model: 'claude-opus-5-5',
}

test('conta tokens, agentes e skills em todas as superfícies', async ($, on) => {
  mock.clock(on, { now: NOW })
  on('command.register', () => ({ value: { command: 'uso' } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('turn.complete', () => ({ text: 'ok' }))
  on('turn.start', (_, e) => ({ turnId: e.turnId }))
  on('agent.spawn', () => ({ model: 'claude-haiku-5-5', agentId: 'ag1' }))
  on('ui.toast', () => ({ value: undefined }))
  on('skill.prompt', (_, e) => ({ text: e.text }))

  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  await $.turn.complete({ turnId: 't1', reason: 'answer', answer: 'oi', durationMs: 1, isAborted: false, usage } as never)
  await $.agent.spawn({
    tool_use_id: 'tu1',
    prompt: 'procure',
    description: 'buscar arquivos',
    subagentType: 'Explore',
  } as never)
  await $.turn.complete({ turnId: 't2', agentId: 'ag1', reason: 'answer', answer: 'x', durationMs: 1, isAborted: false, usage } as never)
  await $.skill.prompt({ skill: 'tdd', text: '...', frontmatter: {} } as never)
  await $.skill.prompt({ skill: 'tdd', text: '...', frontmatter: {} } as never)

  const term = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect((await term.find({ type: 'Text', text: /^Total:/ }))?.text).toBe('Total: 8.0k')
  expect((await term.find({ type: 'Text', text: /Explore/ }))?.text).toContain('buscar arquivos')
  expect((await term.find({ type: 'Text', text: /tdd/ }))?.text).toBe('🕶️ tdd ×2')
  await term.unmount()

  for (const surface of ['desktop', 'vscode', 'mobile'] as const) {
    const ui = await $.ui.mount({ ...PANE, surface })
    const svg = await ui.find({ type: 'Svg' })
    expect(svg).toBeDefined()
    expect(JSON.stringify(svg)).toContain('8.0k')
    expect(JSON.stringify(svg)).toContain('animateTransform')
    // the first skill gives sunglasses; the agent is a little Claude behind
    expect(JSON.stringify(svg)).toContain('acc-oculos')
    expect(JSON.stringify(svg)).toContain('class=\\"mini\\"')
    expect((await ui.find({ type: 'Text', text: /tdd/ }))?.text).toBe('🕶️ tdd ×2')

    await ui.press({ key: 'pause' })
    const still = await ui.find({ type: 'Svg' })
    expect(JSON.stringify(still)).not.toContain('animateTransform')
    await ui.press({ key: 'pause' })
    await ui.unmount()
  }
})

test('conta skills pela ferramenta Skill e por /nome, sem contar duas vezes', async ($, on) => {
  mock.clock(on, { now: NOW })
  on('command.register', () => ({ value: { command: 'uso' } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('command.list', () => ({
    value: [
      { name: 'universo-simulado', description: 'vídeo', source: 'user' },
      { name: 'uso', description: 'painel', source: 'plugin', plugin: 'painel-uso' },
      { name: 'clear', description: 'limpa a conversa', source: 'builtin' },
    ],
  }))
  on('command.run', () => ({ text: 'ok' }))
  on('tool.call', () => ({ result: 'ok' }) as never)
  on('skill.prompt', (_, e) => ({ text: e.text }))

  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  // o modelo chama uma skill; o skill.prompt desse mesmo uso vem logo depois
  await $.tool.call({ tool: 'Skill', skill: 'mattpocock-skills:tdd' } as never)
  await $.skill.prompt({ skill: 'mattpocock-skills:tdd', text: '...', frontmatter: {} } as never)
  // a pessoa digita uma skill, um comando embutido e o /uso do próprio mod
  await $.command.run({ command: 'universo-simulado', args: 'enterrado' } as never)
  await $.command.run({ command: 'clear', args: '' } as never)
  await $.command.run({ command: 'uso', args: '' } as never)
  // uma skill pré-carregada num subagente só passa pelo skill.prompt
  await $.skill.prompt({ skill: 'research', text: '...', frontmatter: {} } as never)
  // a mesma skill chamada de novo conta de novo
  await $.tool.call({ tool: 'Skill', skill: 'mattpocock-skills:tdd' } as never)

  const term = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect((await term.find({ type: 'Text', text: /^Skills/ }))?.text).toBe('Skills (3)')
  expect((await term.find({ type: 'Text', text: /tdd/ }))?.text).toBe('🕶️ mattpocock-skills:tdd ×2')
  expect((await term.find({ type: 'Text', text: /universo-simulado/ }))?.text).toBe('💍 universo-simulado')
  expect((await term.find({ type: 'Text', text: /research/ }))?.text).toBe('🎩 research')
  expect(await term.find({ type: 'Text', text: /clear/ })).toBeUndefined()
  await term.unmount()
})

const NOW = Date.parse('2026-11-11T22:00:00Z')

const measure = (fiveHour: number, sevenDay: number) =>
  ({
    context: { tokens: 103_000, window: 1_000_000, percent: 10 },
    rateLimits: [
      { kind: 'five_hour', percentUsed: fiveHour, resetsAt: '2026-11-12T00:30:00Z' },
      { kind: 'seven_day', percentUsed: sevenDay, resetsAt: '2026-11-17T17:00:00Z' },
    ],
    cost: { usd: 0.67 },
    changed: ['context', 'rateLimits', 'cost'],
  }) as never

const setup = async ($: any, on: any) => {
  mock.clock(on, { now: NOW })
  const statuses: (string | undefined)[] = []
  const toasts: string[] = []
  on('command.register', () => ({ value: { command: 'uso' } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('session.start', (_: unknown, e: any) => ({ cwd: e.cwd }))
  on('session.measure', (_: unknown, e: any) => ({ changed: e.changed }))
  on('ui.status', (_: unknown, e: any) => (statuses.push(e.text), { value: undefined }))
  on('ui.toast', (_: unknown, e: any) => (toasts.push(e.text), { value: undefined }))
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  return { statuses, toasts }
}

const svgOf = async ($: any, surface: 'desktop' | 'vscode' | 'mobile') => {
  const ui = await $.ui.mount({ ...PANE, surface })
  const svg = JSON.stringify(await ui.find({ type: 'Svg' }))
  await ui.unmount()
  return svg
}

test('abaixo de 100% o Claude continua laranja', async ($, on) => {
  const { toasts } = await setup($, on)
  await $.session.measure(measure(99.9, 50))

  for (const surface of ['desktop', 'vscode', 'mobile'] as const) {
    const svg = await svgOf($, surface)
    expect(svg).not.toContain('CLAUDE ESGOTADO')
    expect(svg).toContain('TOKENS DA SESSÃO')
    expect(svg).toContain('99.9%')
    expect(svg).not.toContain('url(#gray)')
  }
  expect(toasts.some(t => t.includes('cinza'))).toBe(false)
})

for (const [nome, five, seven, texto] of [
  ['5 horas', 100, 50, 'limite 5h acabou'],
  ['semanal', 40, 100, 'limite 7 dias acabou'],
] as const) {
  test(`limite ${nome} em 100% deixa o Claude cinza`, async ($, on) => {
    const { statuses, toasts } = await setup($, on)
    await $.session.measure(measure(five, seven))

    for (const surface of ['desktop', 'vscode', 'mobile'] as const) {
      const svg = await svgOf($, surface)
      expect(svg).toContain('CLAUDE ESGOTADO')
      expect(svg).toContain(texto)
      expect(svg).toContain('LIMITE ATINGIDO')
      expect(svg).toContain('url(#gray)')
    }
    expect(toasts.filter(t => t.includes('cinza')).length).toBe(1)
    expect(statuses.at(-1)).toContain('Claude ficou cinza')

    const term = await $.ui.mount({ ...PANE, surface: 'terminal' })
    expect(await term.find({ type: 'Text', text: /CLAUDE ESGOTADO/ })).toBeDefined()
    await term.unmount()
  })
}

test('passado o horário de reset o Claude volta ao normal', async ($, on) => {
  await setup($, on)
  await $.session.measure({
    ...(measure(100, 50) as object),
    rateLimits: [{ kind: 'five_hour', percentUsed: 100, resetsAt: '2026-11-11T21:00:00Z' }],
  } as never)
  expect(await svgOf($, 'desktop')).not.toContain('CLAUDE ESGOTADO')
})

test('/uso quebrado liga e desliga a simulação', async ($, on) => {
  await setup($, on)
  await $.session.measure(measure(10, 20))
  expect(await svgOf($, 'desktop')).not.toContain('CLAUDE ESGOTADO')

  const on1 = await $.command.run({ command: 'uso', args: 'quebrado' } as never)
  expect(JSON.stringify(on1)).toContain('Simulação ligada')
  expect(await svgOf($, 'desktop')).toContain('CLAUDE ESGOTADO')

  await $.command.run({ command: 'uso', args: 'quebrado' } as never)
  expect(await svgOf($, 'desktop')).not.toContain('CLAUDE ESGOTADO')
})
