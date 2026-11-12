import { atom, read, update } from 'claude-code'
import type { EngineInterface, ModelUsage, Register } from 'claude-code'

import type { AgentRow, Meter, SkillRow, Tokens } from '../types'
import { SCENE, accessoryFor, buildScene, figurinoFor, limitName, limitState } from './mascote'
import type { SceneBroken } from './mascote'

const PANE = 'painel-uso'
const TITLE = 'Uso da sessão'
const ZERO: Tokens = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }

// Change a tag when that value's fields change: old stored values are then
// read as the initial value instead of a mismatched shape.
const main = atom({ plugin: 'painel-uso', key: 'main' } as const, ZERO, {
  shape: 'main-1',
})
const agents = atom({ plugin: 'painel-uso', key: 'agents' } as const, [], {
  shape: 'agents-1',
})
const skills = atom({ plugin: 'painel-uso', key: 'skills' } as const, [], {
  shape: 'skills-1',
})
const meter = atom({ plugin: 'painel-uso', key: 'meter' } as const, null, {
  shape: 'meter-2',
})
const lastSkill = atom({ plugin: 'painel-uso', key: 'lastSkill' } as const, null)
const isPaused = atom({ plugin: 'painel-uso', key: 'isPaused' } as const, false)
const simulateBroken = atom({ plugin: 'painel-uso', key: 'simulateBroken' } as const, false)

/** The 5h window at 100%, as `/uso quebrado` pretends, resetting in 2h 30min. */
const SIMULATED: SceneBroken = { kinds: ['five_hour'], resetIn: '2h 30min' }

/** Used-up limits now, real or simulated; undefined while there is room. */
const brokenNow = async ($: EngineInterface): Promise<SceneBroken | undefined> => {
  if (await read($, simulateBroken)) return SIMULATED
  const m = await read($, meter)
  return m ? limitState(m.limits, await $.clock.now()) : undefined
}

/** `mattpocock-skills:tdd` and `tdd` name the same skill. */
const baseName = (name: string) => name.slice(name.lastIndexOf(':') + 1)

/** A `skill.prompt` this soon after the same skill was counted is that same use. */
const SAME_USE_MS = 15_000

/** One more use of a skill; `mark` leaves a note so `skill.prompt` skips it. */
const countSkill = async ($: EngineInterface, name: string, mark: boolean) => {
  await update($, skills, list => {
    const found = list.find(s => s.name === name)
    const rest: SkillRow[] = found
      ? list.map(s => (s.name === name ? { ...s, count: s.count + 1 } : s))
      : [...list, { name, count: 1 }]

    return rest.slice(-50)
  })

  if (mark) {
    const at = await $.clock.now()
    await update($, lastSkill, () => ({ name: baseName(name), at }))
  }
}

const brokenStatus = (b: SceneBroken) =>
  `☠ limite ${b.kinds.map(limitName).join(' e ')} atingido · Claude ficou cinza${b.resetIn ? ` · volta em ~${b.resetIn}` : ''}`

const add = (t: Tokens, u: ModelUsage): Tokens => ({
  input: t.input + u.input_tokens,
  output: t.output + u.output_tokens,
  cacheRead: t.cacheRead + u.cache_read_input_tokens,
  cacheWrite: t.cacheWrite + u.cache_creation_input_tokens,
})

const sum = (a: Tokens, b: Tokens): Tokens => ({
  input: a.input + b.input,
  output: a.output + b.output,
  cacheRead: a.cacheRead + b.cacheRead,
  cacheWrite: a.cacheWrite + b.cacheWrite,
})

const total = (t: Tokens) => t.input + t.output + t.cacheRead + t.cacheWrite

const fmt = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  if (n >= 10_000) return `${Math.round(n / 1000)}k`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

const LIMIT_NAMES: Record<string, string> = {
  five_hour: 'Limite 5h',
  seven_day: 'Limite 7 dias',
  spend_limit: 'Limite de gasto',
}

const bar = (percent: number, width = 20): string => {
  const p = Math.max(0, Math.min(100, percent))
  const full = Math.round((p / 100) * width)
  return '█'.repeat(full) + '░'.repeat(width - full)
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'uso',
      description: 'Abre o painel de uso; `/uso quebrado` liga/desliga a simulação de limite atingido',
    })
    void $.ui.open({ id: PANE, title: TITLE })

    return next(e)
  })

  on('command.run', { command: 'uso' }, async ($, e) => {
    await $.ui.open({ id: PANE, title: TITLE })

    if (/^\s*quebra/i.test(e.args)) {
      const isOn = await update($, simulateBroken, v => !v)
      const real = await brokenNow($)
      $.ui.status(real ? brokenStatus(real) : undefined)

      return {
        text: isOn
          ? 'Simulação ligada: o painel mostra o Claude cinza, como se o limite de 5h tivesse acabado. Digite `/uso quebrado` de novo para desligar.'
          : 'Simulação desligada: o painel volta a mostrar os limites reais.',
      }
    }

    return { text: 'Painel de uso aberto.' }
  })

  // Tokens: every model turn, the main loop's and each subagent's.
  on('turn.complete', async ($, e, next) => {
    const done = await next(e)
    const usage = e.usage ?? done.usage

    if (e.agentId === undefined) {
      if (usage) await update($, main, t => add(t, usage))
    } else {
      const id = e.agentId
      await update($, agents, list =>
        list.map(a =>
          a.agentId === id
            ? { ...a, isRunning: false, tokens: usage ? add(a.tokens, usage) : a.tokens }
            : a,
        ),
      )
    }

    return done
  })

  on('turn.start', async ($, e, next) => {
    if (e.agentId !== undefined) {
      const id = e.agentId
      await update($, agents, list =>
        list.map(a => (a.agentId === id ? { ...a, isRunning: true } : a)),
      )
    }

    return next(e)
  })

  // Agents: each subagent the Agent tool (or a workflow) starts.
  on('agent.spawn', async ($, e, next) => {
    const spawned = await next(e)

    if (spawned.deny === undefined) {
      const row: AgentRow = {
        id: e.tool_use_id || `${e.subagentType}-${await $.clock.now()}`,
        agentId: spawned.agentId,
        type: e.subagentType,
        description: e.description,
        isRunning: true,
        tokens: ZERO,
      }
      await update($, agents, list => [...list, row].slice(-50))
      $.ui.toast(`Agente iniciado: ${row.type}`)
    }

    return spawned
  }).catch(($, e, next) => next(e))

  // Skills. `skill.prompt` would see every use, but the built-in
  // `cc-plugin-sec-default` sits ahead of this mod there and hands the event
  // on past it, so skills are counted where they start instead: the Skill
  // tool (the model) and a typed `/name` (the person).
  on('tool.call', { tool: 'Skill' }, async ($, e, next) => {
    try {
      await countSkill($, e.skill, true)
    } catch {
      // counting must never stand in the way of the skill
    }

    return next(e)
  })

  on('command.run', async ($, e, next) => {
    try {
      const info = (await $.command.list()).find(c => c.name === e.command)
      // Built-in commands (/clear, /compact…) and this mod's own /uso are not skills.
      if (info && info.source !== 'builtin' && info.plugin !== $.plugin.name) {
        await countSkill($, e.command, true)
      }
    } catch {
      // counting must never stand in the way of the command
    }

    return next(e)
  })

  // Kept for the day the event reaches this mod again, and for skills
  // preloaded into a subagent, which raise only this event. A use already
  // counted above moments ago is not counted twice.
  on('skill.prompt', async ($, e, next) => {
    const last = await read($, lastSkill)
    const now = await $.clock.now()

    if (last !== null && last.name === baseName(e.skill) && now - last.at < SAME_USE_MS) {
      await update($, lastSkill, () => null)
    } else {
      await countSkill($, e.skill, false)
    }

    return next(e)
  })

  // Context window, cost and rate limits, pushed after each turn.
  on('session.measure', async ($, e, next) => {
    const wasBroken = await brokenNow($)
    const m: Meter = {
      contextTokens: e.context.tokens,
      contextWindow: e.context.window,
      contextPercent: e.context.percent,
      usd: e.cost?.usd,
      limits: e.rateLimits.map(l => ({ kind: l.kind, percentUsed: l.percentUsed, resetsAt: l.resetsAt })),
    }
    await update($, meter, () => m)
    const broken = await brokenNow($)

    if (broken) {
      $.ui.status(brokenStatus(broken))
      if (!wasBroken) $.ui.toast('☠ Limite atingido: o Claude ficou cinza. Nada mais vai funcionar até o limite voltar.')
    } else {
      const pct = m.contextPercent === undefined ? '' : ` · contexto ${m.contextPercent}%`
      $.ui.status(`tokens ${fmt(total(await read($, main)))}${pct}`)
    }

    return next(e)
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text } = $.ui.resolve(e)
    const t = await read($, main)
    const agentList = await read($, agents)
    const skillList = await read($, skills)
    const m = await read($, meter)
    const broken = await brokenNow($)

    const agentTokens = agentList.reduce((acc, a) => sum(acc, a.tokens), ZERO)
    const all = sum(t, agentTokens)
    const running = agentList.filter(a => a.isRunning).length

    const agentsBox = (
      <Box flexDirection="column">
        <Text bold>
          Agentes ({agentList.length}
          {running > 0 ? `, ${running} rodando` : ''})
        </Text>
        {agentList.length === 0 && <Text dimColor>nenhum agente usado ainda</Text>}
        {agentList
          .map((a, i) => ({ ...a, fig: figurinoFor(i) }))
          .slice(-12)
          .reverse()
          .map(a => (
            <Text>
              <Text color={a.isRunning ? 'warning' : 'success'}>{a.isRunning ? '●' : '✓'}</Text>{' '}
              {a.fig.emoji} <Text bold>{a.type}</Text> <Text dimColor>{a.description}</Text>
              {total(a.tokens) > 0 ? <Text dimColor> · {fmt(total(a.tokens))}</Text> : ''}
            </Text>
          ))}
      </Box>
    )

    const skillsBox = (
      <Box flexDirection="column">
        <Text bold>Skills ({skillList.length})</Text>
        {skillList.length === 0 && <Text dimColor>nenhuma skill usada ainda</Text>}
        {skillList
          .map((s, i) => ({ ...s, acc: accessoryFor(i) }))
          .slice(-12)
          .reverse()
          .map(s => (
            <Text>
              {s.acc ? `${s.acc.emoji} ` : ''}
              <Text bold>{s.name}</Text>
              {s.count > 1 ? <Text dimColor> ×{s.count}</Text> : ''}
            </Text>
          ))}
      </Box>
    )

    // Desktop, VS Code and mobile draw SVG: the little Claude and his crew.
    if (e.surface !== 'terminal') {
      const { Svg, Button } = $.ui.resolve(e)
      const isStill = await read($, isPaused)
      const source = buildScene(
        {
          totalTokens: total(all),
          input: all.input,
          output: all.output,
          cache: all.cacheRead + all.cacheWrite,
          mainTokens: total(t),
          agentTokens: total(agentTokens),
          contextTokens: m?.contextTokens,
          contextWindow: m?.contextWindow,
          contextPercent: m?.contextPercent,
          usd: m?.usd,
          limits: m?.limits ?? [],
          agents: agentList.map(a => ({
            type: a.type,
            description: a.description,
            isRunning: a.isRunning,
            tokens: total(a.tokens),
          })),
          skills: skillList,
          broken,
        },
        !isStill,
      )
      // The pane's width is given in code-font cells (~7.8 CSS px each). The
      // scene is portrait: it fills a narrow pane and stops growing past 460px
      // so a wide pane does not make it taller than the screen.
      const width = Math.max(200, Math.min(460, Math.floor(e.props.bodyColumns * 7.8) - 8))
      const alt =
        (broken ? `Limite ${broken.kinds.map(limitName).join(' e ')} atingido: Claude ficou cinza. ` : '') +
        `Tokens ${fmt(total(all))}; contexto ${m?.contextPercent ?? '—'}%; ` +
        `${agentList.length} agentes; ${skillList.length} skills`

      return (
        <Box flexDirection="column" gap={1}>
          <Svg
            source={source}
            alt={alt}
            isInteractive
            width={width}
            height={Math.round((width * SCENE.height) / SCENE.width)}
          />
          <Button
            key="pause"
            label={isStill ? '▶ Animar' : '⏸ Pausar animação'}
            onPress={() => update($, isPaused, v => !v)}
          />
          {agentsBox}
          {skillsBox}
        </Box>
      )
    }

    return (
      <Box flexDirection="column" gap={1}>
        {broken && (
          <Box flexDirection="column" borderStyle="round" borderColor="error" paddingX={1}>
            <Text bold color="error">
              ☠ CLAUDE ESGOTADO (ficou cinza)
            </Text>
            <Text color="error">limite {broken.kinds.map(limitName).join(' e ')} atingido</Text>
            <Text dimColor>
              {broken.resetIn ? `nada funciona até voltar: ~${broken.resetIn}` : 'nada mais vai funcionar por enquanto'}
            </Text>
          </Box>
        )}
        <Box flexDirection="column">
          <Text bold>Tokens da sessão</Text>
          <Text>
            Total: <Text bold>{fmt(total(all))}</Text>
          </Text>
          <Text dimColor>
            entrada {fmt(all.input)} · saída {fmt(all.output)}
          </Text>
          <Text dimColor>
            cache lido {fmt(all.cacheRead)} · cache gravado {fmt(all.cacheWrite)}
          </Text>
          <Text dimColor>
            chat principal {fmt(total(t))} · agentes {fmt(total(agentTokens))}
          </Text>
        </Box>

        {m !== null && (
          <Box flexDirection="column">
            <Text bold>Contexto</Text>
            {m.contextPercent === undefined ? (
              <Text dimColor>aguardando a primeira resposta…</Text>
            ) : (
              <Text>
                {bar(m.contextPercent)} {m.contextPercent}%
              </Text>
            )}
            <Text dimColor>
              {fmt(m.contextTokens ?? 0)} de {fmt(m.contextWindow)}
            </Text>
            {m.usd !== undefined && <Text dimColor>custo estimado US$ {m.usd.toFixed(2)}</Text>}
            {m.limits.map(l =>
              l.percentUsed >= 100 ? (
                <Text color="error">
                  {LIMIT_NAMES[l.kind] ?? l.kind}: {bar(100, 10)} {l.percentUsed}% · ESGOTADO
                </Text>
              ) : (
                <Text dimColor>
                  {LIMIT_NAMES[l.kind] ?? l.kind}: {bar(l.percentUsed, 10)} {l.percentUsed}%
                </Text>
              ),
            )}
          </Box>
        )}

        {agentsBox}
        {skillsBox}
      </Box>
    )
  })
}
