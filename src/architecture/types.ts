/** Общие типы раздела «Архитектура». */

export type ArchitectureNodeType = "agent" | "bot" | "app" | "tool" | "workflow" | "service"

export type ServerInfo = {
  host?: string
  type?: string
  path?: string
  container?: string
  ports?: string[]
  health?: string
  status?: "online" | "offline" | "unknown"
}

export type ArchitectureObject = {
  id: string
  name: string
  type: ArchitectureNodeType
  description?: string
  skills: string[]
  rules: string[]
  github?: string
  repo?: string
  branch?: string
  server?: ServerInfo
  dependencies: string[]
  sourcePath?: string
  skillSources?: Record<string, string>
  error?: string
}

export type ArchitectureEdge = {
  id: string
  source: string
  target: string
  label: string
}

export type ArchitectureGraph = {
  objects: ArchitectureObject[]
  edges: ArchitectureEdge[]
  scannedAt: string
  errors: string[]
}

export type ArchitectureConfig = {
  scanPaths: string[]
  github: {
    enabled: boolean
    org: string
    repos: string[]
  }
  serverCheck: {
    enabled: boolean
    endpoints: Record<string, string>
  }
}

export const DEFAULT_ARCHITECTURE_CONFIG: ArchitectureConfig = {
  scanPaths: ["./agents", "./bots", "./marvindeepseek-bot"],
  github: {
    enabled: false,
    org: "darya-sts",
    repos: ["-"],
  },
  serverCheck: {
    enabled: true,
    endpoints: {},
  },
}

export const TYPE_COLORS: Record<ArchitectureNodeType | "root" | "category", string> = {
  root: "#c4a574",
  category: "#6b7280",
  agent: "#3b82f6",
  bot: "#22c55e",
  app: "#f97316",
  tool: "#06b6d4",
  workflow: "#eab308",
  service: "#a855f7",
}

export const TYPE_LABELS: Record<ArchitectureNodeType, string> = {
  agent: "Агенты",
  bot: "Боты",
  app: "Приложения",
  tool: "Инструменты",
  workflow: "Воркфлоу",
  service: "Сервисы",
}
