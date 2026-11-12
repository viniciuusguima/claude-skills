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
  limits: { kind: string; percentUsed: number }[]
}

declare module 'claude-code' {
  interface PluginState {
    'painel-uso': {
      main: Shaped<Tokens>
      agents: Shaped<AgentRow[]>
      skills: Shaped<SkillRow[]>
      meter: Shaped<Meter | null>
    }
  }
}
