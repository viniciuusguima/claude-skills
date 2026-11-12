import { expect, test } from 'claude-code/testing'

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

  for (const surface of ['terminal', 'desktop', 'vscode', 'mobile'] as const) {
    const ui = await $.ui.mount({ ...PANE, surface })
    expect((await ui.find({ type: 'Text', text: /^Total:/ }))?.text).toBe('Total: 8.0k')
    expect((await ui.find({ type: 'Text', text: /Explore/ }))?.text).toContain('buscar arquivos')
    expect((await ui.find({ type: 'Text', text: /tdd/ }))?.text).toBe('tdd ×2')
    await ui.unmount()
  }
})
