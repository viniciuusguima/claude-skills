import { atom, read, update } from 'claude-code'
import type { ModelUsage, Register } from 'claude-code'

import type { AgentRow, Meter, SkillRow, Tokens } from '../types'
import { buildCosmos } from './cosmos'

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
  shape: 'meter-1',
})
const isPaused = atom({ plugin: 'painel-uso', key: 'isPaused' } as const, false)

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
      description: 'Abre o painel de tokens, agentes e skills da sessão',
    })
    void $.ui.open({ id: PANE, title: TITLE })

    return next(e)
  })

  on('command.run', { command: 'uso' }, async $ => {
    await $.ui.open({ id: PANE, title: TITLE })

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

  // Skills: each time a skill's prompt is loaded (Skill tool, slash, preload).
  on('skill.prompt', async ($, e, next) => {
    const name = e.skill
    await update($, skills, list => {
      const found = list.find(s => s.name === name)
      const rest: SkillRow[] = found
        ? list.map(s => (s.name === name ? { ...s, count: s.count + 1 } : s))
        : [...list, { name, count: 1 }]

      return rest.slice(-50)
    })

    return next(e)
  })

  // Context window, cost and rate limits, pushed after each turn.
  on('session.measure', async ($, e, next) => {
    const m: Meter = {
      contextTokens: e.context.tokens,
      contextWindow: e.context.window,
      contextPercent: e.context.percent,
      usd: e.cost?.usd,
      limits: e.rateLimits.map(l => ({ kind: l.kind, percentUsed: l.percentUsed })),
    }
    await update($, meter, () => m)

    const pct = m.contextPercent === undefined ? '' : ` · contexto ${m.contextPercent}%`
    $.ui.status(`tokens ${fmt(total(await read($, main)))}${pct}`)

    return next(e)
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text } = $.ui.resolve(e)
    const t = await read($, main)
    const agentList = await read($, agents)
    const skillList = await read($, skills)
    const m = await read($, meter)

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
          .slice(-12)
          .reverse()
          .map(a => (
            <Text>
              <Text color={a.isRunning ? 'warning' : 'success'}>{a.isRunning ? '●' : '✓'}</Text>{' '}
              <Text bold>{a.type}</Text> <Text dimColor>{a.description}</Text>
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
          .slice(-12)
          .reverse()
          .map(s => (
            <Text>
              <Text bold>{s.name}</Text>
              {s.count > 1 ? <Text dimColor> ×{s.count}</Text> : ''}
            </Text>
          ))}
      </Box>
    )

    // Desktop, VS Code and mobile draw SVG: the animated 3D scene.
    if (e.surface !== 'terminal') {
      const { Svg, Button } = $.ui.resolve(e)
      const isStill = await read($, isPaused)
      const source = buildCosmos(
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
        },
        !isStill,
      )
      const alt =
        `Tokens ${fmt(total(all))}; contexto ${m?.contextPercent ?? '—'}%; ` +
        `${agentList.length} agentes; ${skillList.length} skills`

      return (
        <Box flexDirection="column" gap={1}>
          <Svg source={source} alt={alt} isInteractive />
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
            {m.limits.map(l => (
              <Text dimColor>
                {LIMIT_NAMES[l.kind] ?? l.kind}: {bar(l.percentUsed, 10)} {l.percentUsed}%
              </Text>
            ))}
          </Box>
        )}

        {agentsBox}
        {skillsBox}
      </Box>
    )
  })
}
