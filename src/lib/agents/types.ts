export type AgentStatus = "active" | "inactive" | "development"
export type MemoryKind = "short" | "long" | "both" | "none"
export type AgentEnv = "dev" | "prod"

export type AgentSkill = {
  id: string
  name: string
  description: string
  active: boolean
  params: string
  content: string
}

export type AgentRule = {
  id: string
  name: string
  priority: number
  active: boolean
  text: string
}

export type AgentFile = {
  path: string
  language: string
  content: string
}

export type AgentInfra = {
  repoName: string
  repoUrl: string
  branch: string
  commit: string
  serverPath: string
  env: AgentEnv
  ports: string[]
  services: string[]
  memoryKind: MemoryKind
  memoryVolume: string
  memoryState: string
}

export type AgentRecord = {
  id: string
  name: string
  summary: string
  description: string
  status: AgentStatus
  version: string
  createdAt: string
  updatedAt: string
  memoryConnected: boolean
  cursorPath: string
  tree: string[]
  skills: AgentSkill[]
  rules: AgentRule[]
  files: AgentFile[]
  infra: AgentInfra
}

export type AgentsCatalog = {
  scannedAt: string
  source: string
  agents: AgentRecord[]
}

export type AgentSettings = {
  repos: { id: string; name: string; url: string }[]
  refreshMinutes: number
  lastSync: number | null
}

export const AGENTS_CACHE_KEY = "forgemill-agents-cache"
export const AGENTS_OVERRIDE_KEY = "forgemill-agents-overrides"
export const AGENTS_SETTINGS_KEY = "forgemill-agents-settings"
export const AGENTS_API_PATH = "/api/agents.json"
export const CACHE_TTL_MS = 5 * 60 * 1000

export const STATUS_LABEL: Record<AgentStatus, string> = {
  active: "Активен",
  inactive: "Неактивен",
  development: "В разработке",
}

export const MEMORY_LABEL: Record<MemoryKind, string> = {
  short: "краткосрочная",
  long: "долгосрочная",
  both: "краткосрочная и долгосрочная",
  none: "не подключена",
}
