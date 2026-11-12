export type Tokens = {
  input: number
  output: number
  cacheRead: number
  cacheWrite: number
}

export type AgentRow = {
  /** tool_use_id of the Agent call */
  id: string
  /** loop id the engine gives the subagent */
  agentId?: string
  type: string
  description: string
  isRunning: boolean
  tokens: Tokens
}

export type SkillRow = { name: string; count: number }

export type Meter = {
  contextTokens?: number
  contextWindow: number
  contextPercent?: number
  usd?: number
  limits: { kind: string; percentUsed: number; resetsAt?: string }[]
}

declare module 'claude-code' {
  interface PluginState {
    'painel-uso': {
      main: Shaped<Tokens>
      agents: Shaped<AgentRow[]>
      skills: Shaped<SkillRow[]>
      meter: Shaped<Meter | null>
      /** A última skill contada pela ferramenta Skill ou por `/nome`, para o `skill.prompt` não contar de novo. */
      lastSkill: { name: string; at: number } | null
      isPaused: boolean
      /** `/uso quebrado` liga/desliga: desenha o limite como atingido para testar o visual. */
      simulateBroken: boolean
    }
  }
}
