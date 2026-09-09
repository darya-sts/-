import { BUILTIN_DIRECTIONS } from "@/data/prompt-directions"
import { newId } from "@/lib/tasks/id"
import { slugify } from "@/lib/prompts/compose"
import { PROMPTS_STORAGE, type DirectionProfile } from "@/lib/prompts/types"

function readCustom(): DirectionProfile[] {
  if (typeof window === "undefined") return []
  const raw = window.localStorage.getItem(PROMPTS_STORAGE.directionMap)
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as DirectionProfile[]) : []
  } catch {
    return []
  }
}

function writeCustom(list: DirectionProfile[]) {
  window.localStorage.setItem(PROMPTS_STORAGE.directionMap, JSON.stringify(list))
}

export function loadDirectionProfiles(): DirectionProfile[] {
  const custom = readCustom()
  const byId = new Map<string, DirectionProfile>()
  for (const item of BUILTIN_DIRECTIONS) byId.set(item.id, item)
  for (const item of custom) {
    const prev = byId.get(item.id)
    byId.set(item.id, prev ? { ...prev, ...item, builtin: prev.builtin, id: item.id } : { ...item, builtin: false })
  }
  return [...byId.values()]
}

export function saveDirectionProfiles(list: DirectionProfile[]) {
  const builtins = new Set(BUILTIN_DIRECTIONS.map((item) => item.id))
  const payload = list.filter((item) => !item.builtin || JSON.stringify(item) !== JSON.stringify(BUILTIN_DIRECTIONS.find((base) => base.id === item.id)))
  writeCustom(
    payload.map((item) => ({
      ...item,
      builtin: builtins.has(item.id),
    }))
  )
}

export function upsertDirection(patch: Omit<DirectionProfile, "id" | "builtin"> & { id?: string }): DirectionProfile[] {
  const list = loadDirectionProfiles()
  if (patch.id) {
    const next = list.map((item) => (item.id === patch.id ? { ...item, ...patch, id: item.id, builtin: item.builtin } : item))
    saveDirectionProfiles(next)
    return next
  }
  const created: DirectionProfile = {
    id: `custom-${slugify(patch.label)}-${newId().slice(0, 6)}`,
    builtin: false,
    label: patch.label.trim(),
    agents: patch.agents,
    skills: patch.skills,
    rules: patch.rules,
    modelTier: patch.modelTier,
    modelId: patch.modelId,
    keywords: patch.keywords,
  }
  const next = [...list, created]
  saveDirectionProfiles(next)
  return next
}

export function removeDirection(id: string): DirectionProfile[] {
  const list = loadDirectionProfiles().filter((item) => !(item.id === id && !item.builtin))
  saveDirectionProfiles(list)
  return list
}

export function resetDirection(id: string): DirectionProfile[] {
  const custom = readCustom().filter((item) => item.id !== id)
  writeCustom(custom)
  return loadDirectionProfiles()
}

export function directionLabel(id: string, profiles = loadDirectionProfiles()) {
  return profiles.find((item) => item.id === id)?.label ?? id
}

export function normalizeDirections(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === "string" && item.length > 0)
}
