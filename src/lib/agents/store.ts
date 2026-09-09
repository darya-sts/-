import { AGENTS_CATALOG } from "@/data/agents"
import {
  AGENTS_API_PATH,
  AGENTS_CACHE_KEY,
  AGENTS_OVERRIDE_KEY,
  AGENTS_SETTINGS_KEY,
  type AgentRecord,
  type AgentSettings,
  type AgentSkill,
  type AgentsCatalog,
} from "@/lib/agents/types"
import { STORAGE_KEYS } from "@/lib/tasks/types"

export type AgentOverrides = Record<string, { skills?: AgentSkill[]; status?: AgentRecord["status"] }>

type CacheEnvelope = { at: number; data: AgentsCatalog }

const DEFAULT_SETTINGS: AgentSettings = {
  repos: [{ id: "github", name: "Forge Mill", url: "https://github.com/darya-sts/-" }],
  refreshMinutes: 5,
  lastSync: null,
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  const raw = window.localStorage.getItem(key)
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function loadAgentSettings(): AgentSettings {
  return { ...DEFAULT_SETTINGS, ...readJson(AGENTS_SETTINGS_KEY, DEFAULT_SETTINGS) }
}

export function saveAgentSettings(settings: AgentSettings) {
  window.localStorage.setItem(AGENTS_SETTINGS_KEY, JSON.stringify(settings))
}

export function loadOverrides(): AgentOverrides {
  return readJson(AGENTS_OVERRIDE_KEY, {})
}

export function saveOverrides(overrides: AgentOverrides) {
  window.localStorage.setItem(AGENTS_OVERRIDE_KEY, JSON.stringify(overrides))
}

function applyOverrides(catalog: AgentsCatalog, overrides: AgentOverrides): AgentsCatalog {
  return {
    ...catalog,
    agents: catalog.agents.map((agent) => {
      const patch = overrides[agent.id]
      if (!patch) return agent
      return {
        ...agent,
        status: patch.status ?? agent.status,
        skills: patch.skills ?? agent.skills,
      }
    }),
  }
}

function mergeTaskMemory(catalog: AgentsCatalog): AgentsCatalog {
  if (typeof window === "undefined") return catalog
  const raw = window.localStorage.getItem(STORAGE_KEYS.memory)
  if (!raw) return catalog
  try {
    const list = JSON.parse(raw) as { path?: string }[]
    if (!Array.isArray(list) || list.length === 0) return catalog
    return {
      ...catalog,
      agents: catalog.agents.map((agent) =>
        agent.id === "task-bot"
          ? {
              ...agent,
              memoryConnected: true,
              infra: {
                ...agent.infra,
                memoryState: `${list.length} снимок(ов) задач`,
                memoryVolume: list.map((item) => item.path).filter(Boolean).slice(0, 3).join(", ") || agent.infra.memoryVolume,
              },
            }
          : agent
      ),
    }
  } catch {
    return catalog
  }
}

export function catalogFromBundle(): AgentsCatalog {
  return mergeTaskMemory(applyOverrides(AGENTS_CATALOG, typeof window === "undefined" ? {} : loadOverrides()))
}

function cacheTtlMs() {
  const minutes = loadAgentSettings().refreshMinutes || 5
  return Math.max(1, minutes) * 60 * 1000
}

export async function loadAgentsCatalog(force = false): Promise<{ catalog: AgentsCatalog; fromCache: boolean; syncedAt: number }> {
  const now = Date.now()
  if (!force) {
    const cached = readJson<CacheEnvelope | null>(AGENTS_CACHE_KEY, null)
    if (cached && now - cached.at < cacheTtlMs()) {
      return { catalog: applyOverrides(mergeTaskMemory(cached.data), loadOverrides()), fromCache: true, syncedAt: cached.at }
    }
  }
  try {
    const response = await fetch(`${AGENTS_API_PATH}?t=${now}`, { cache: "no-store" })
    if (response.ok) {
      const data = (await response.json()) as AgentsCatalog
      const envelope: CacheEnvelope = { at: now, data }
      window.localStorage.setItem(AGENTS_CACHE_KEY, JSON.stringify(envelope))
      const settings = loadAgentSettings()
      saveAgentSettings({ ...settings, lastSync: now })
      return { catalog: applyOverrides(mergeTaskMemory(data), loadOverrides()), fromCache: false, syncedAt: now }
    }
  } catch {
    /* static fallback */
  }
  const bundled = AGENTS_CATALOG
  window.localStorage.setItem(AGENTS_CACHE_KEY, JSON.stringify({ at: now, data: bundled }))
  return { catalog: catalogFromBundle(), fromCache: false, syncedAt: now }
}

export function agentById(catalog: AgentsCatalog, id: string) {
  return catalog.agents.find((agent) => agent.id === id)
}
