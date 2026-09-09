import type { DirectionProfile, ModelTier } from "@/lib/prompts/types"

export type OrchestratorAdvice = {
  selected: string[]
  detected: string[]
  mismatch: boolean
  agents: string[]
  highlightAgents: string[]
  skills: string[]
  rules: string[]
  modelTier: ModelTier
  modelId: string
  reasons: string[]
}

function unique(list: string[]) {
  return [...new Set(list.filter(Boolean))]
}

function scoreDirection(text: string, profile: DirectionProfile) {
  const hay = text.toLowerCase()
  let score = 0
  for (const word of profile.keywords) {
    if (word && hay.includes(word.toLowerCase())) score += 1
  }
  if (hay.includes(profile.label.toLowerCase())) score += 2
  return score
}

export function detectDirections(request: string, profiles: DirectionProfile[]): { id: string; score: number }[] {
  return profiles
    .map((profile) => ({ id: profile.id, score: scoreDirection(request, profile) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
}

function mergeProfiles(ids: string[], profiles: DirectionProfile[]): Pick<OrchestratorAdvice, "agents" | "skills" | "rules" | "modelTier" | "modelId"> {
  const chosen = ids.map((id) => profiles.find((profile) => profile.id === id)).filter((item): item is DirectionProfile => Boolean(item))
  const agents = unique(chosen.flatMap((item) => item.agents))
  const skills = unique(chosen.flatMap((item) => item.skills))
  const rules = unique(chosen.flatMap((item) => item.rules))
  const top = chosen[0]
  return {
    agents,
    skills,
    rules,
    modelTier: top?.modelTier ?? "balanced",
    modelId: top?.modelId ?? "composer-2.5",
  }
}

export function adviseOrchestrator(
  selected: string[],
  request: string,
  profiles: DirectionProfile[],
  resolution: "keep" | "switch" | "mix" = "keep"
): OrchestratorAdvice {
  const detected = detectDirections(request, profiles).map((item) => item.id)
  const selectedSet = new Set(selected)
  const detectedSet = new Set(detected)
  const mismatch =
    detected.length > 0 &&
    selected.length > 0 &&
    (detected.some((id) => !selectedSet.has(id)) || selected.some((id) => !detectedSet.has(id)))
  const resolved =
    resolution === "switch" && detected.length
      ? detected
      : resolution === "mix"
        ? unique([...selected, ...detected])
        : selected.length
          ? selected
          : detected
  const merged = mergeProfiles(resolved.length ? resolved : selected, profiles)
  const textOnly = detected.filter((id) => !resolved.includes(id))
  const extra = mergeProfiles(textOnly, profiles)
  return {
    selected,
    detected,
    mismatch: mismatch && detected.length > 0 && selected.length > 0,
    agents: merged.agents,
    highlightAgents: unique([...merged.agents, ...extra.agents]),
    skills: merged.skills,
    rules: merged.rules,
    modelTier: merged.modelTier,
    modelId: merged.modelId,
    reasons: [
      selected.length ? `теги: ${selected.join(", ")}` : "теги не выбраны",
      detected.length ? `по тексту: ${detected.join(", ")}` : "по тексту направление не распознано",
      resolution === "keep" ? "режим: оставить выбранные теги" : resolution === "switch" ? "режим: сменить на распознанные" : "режим: смешать теги и текст",
    ],
  }
}
