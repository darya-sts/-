export type ModelTier = "economy" | "balanced" | "fast"
export type PromptDirectionId = "design" | "marketing" | "consulting" | "research" | "development" | "admin" | (string & {})

export type DirectionProfile = {
  id: string
  label: string
  builtin: boolean
  agents: string[]
  skills: string[]
  rules: string[]
  modelTier: ModelTier
  modelId: string
  keywords: string[]
}

export type PromptStatus = "draft" | "delegated"
export type TaskPriority = "urgent" | "standard" | "background"

export type AgentDef = {
  id: string
  name: string
  description: string
  defaultRole: string
}

export type ModelDef = {
  id: string
  name: string
  tier: ModelTier
  speed: string
  cost: string
  quality: string
  recommendedFor: string
}

export type PromptRecord = {
  id: string
  title: string
  request: string
  body: string
  status: PromptStatus
  recommendedTier: ModelTier
  directions: string[]
  createdAt: string
  updatedAt: string
}

export type PromptTaskRecord = {
  id: string
  promptId: string
  promptTitle: string
  directions: string[]
  agents: string[]
  agentRoles: Record<string, string>
  modelTier: ModelTier
  modelId: string
  publications: string[]
  saveToMemory: boolean
  memoryItems: string[]
  priority: TaskPriority
  deadline?: string
  inputRef?: string
  packageMarkdown: string
  outputPaths: string[]
  createdAt: string
}

export type DelegateInput = {
  agents: string[]
  agentRoles: Record<string, string>
  modelTier: ModelTier
  modelId: string
  publications: string[]
  saveToMemory: boolean
  memoryItems: string[]
  priority: TaskPriority
  deadline?: string
  inputRef?: string
  pdfFileName?: string
}

export type PromptMemoryRecord = {
  taskId: string
  promptId: string
  savedAt: string
  promptBody?: string
  model?: { tier: ModelTier; id: string }
  keyDecisions?: { agents: string[]; publications: string[]; priority: TaskPriority }
  agentOutput?: string
}

export const PROMPTS_STORAGE = {
  prompts: "forgemill-prompts",
  tasks: "forgemill-prompt-tasks",
  memory: "forgemill-prompt-memory",
  directionMap: "forgemill-prompt-direction-map",
} as const

export const STATUS_LABEL: Record<PromptStatus, string> = {
  draft: "Черновик",
  delegated: "Передано",
}

export const TIER_LABEL: Record<ModelTier, string> = {
  economy: "Экономичные",
  balanced: "Сбалансированные",
  fast: "Быстрые",
}

export const PRIORITY_LABEL: Record<TaskPriority, string> = {
  urgent: "Срочное",
  standard: "Стандартное",
  background: "Фоновое",
}
