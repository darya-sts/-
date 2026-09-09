/** Парсинг конфигурационных файлов агентов/ботов. */

import type { ArchitectureNodeType, ArchitectureObject, ServerInfo } from "../types"

const TYPE_SET = new Set<ArchitectureNodeType>([
  "agent",
  "bot",
  "app",
  "tool",
  "workflow",
  "service",
])

function asStringList(value: unknown): string[] {
  if (!value) return []
  if (Array.isArray(value)) {
    return value
      .map((v) => {
        if (typeof v === "string") return v
        if (v && typeof v === "object" && "name" in v) return String((v as { name: unknown }).name)
        return String(v)
      })
      .map((s) => s.trim())
      .filter(Boolean)
  }
  if (typeof value === "string") {
    return value
      .split(/[\n,;]+/)
      .map((s) => s.trim())
      .filter(Boolean)
  }
  return []
}

function asServer(value: unknown): ServerInfo | undefined {
  if (!value) return undefined
  if (typeof value === "string") return { host: value, type: "unknown", status: "unknown" }
  if (typeof value === "object") {
    const o = value as Record<string, unknown>
    return {
      host: o.host ? String(o.host) : o.address ? String(o.address) : undefined,
      type: o.type ? String(o.type) : undefined,
      path: o.path ? String(o.path) : undefined,
      container: o.container ? String(o.container) : undefined,
      ports: Array.isArray(o.ports) ? o.ports.map(String) : undefined,
      health: o.health ? String(o.health) : undefined,
      status: "unknown",
    }
  }
  return undefined
}

function guessType(raw: Record<string, unknown>, fileName: string, dirHint?: string): ArchitectureNodeType {
  const t = String(raw.type || raw.kind || "").toLowerCase()
  if (TYPE_SET.has(t as ArchitectureNodeType)) return t as ArchitectureNodeType
  const blob = `${fileName} ${dirHint || ""} ${String(raw.name || "")}`.toLowerCase()
  if (blob.includes("bot")) return "bot"
  if (blob.includes("workflow")) return "workflow"
  if (blob.includes("tool")) return "tool"
  if (blob.includes("service") || blob.includes("api")) return "service"
  if (blob.includes("app") || blob.includes("studio") || blob.includes("mill")) return "app"
  return "agent"
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/gi, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64)
}

/** Извлекает ArchitectureObject из произвольного JSON/YAML объекта. */
export function parseAgentConfig(
  raw: Record<string, unknown>,
  opts: { sourcePath: string; fileName?: string; dirHint?: string },
): ArchitectureObject {
  try {
    const name = String(raw.name || raw.title || raw.id || opts.fileName || "unnamed").trim()
    const type = guessType(raw, opts.fileName || "", opts.dirHint)
    const skills = [
      ...asStringList(raw.skills),
      ...asStringList(raw.tools),
      ...asStringList(raw.capabilities),
    ]
    const rules = [
      ...asStringList(raw.rules),
      ...asStringList(raw.instructions),
      ...(typeof raw.prompt === "string" ? [raw.prompt] : asStringList(raw.prompt)),
    ]
    const github =
      (raw.github as string) ||
      (raw.repository as string) ||
      (raw.repo as string) ||
      undefined
    const dependencies = [
      ...asStringList(raw.depends_on),
      ...asStringList(raw.dependencies),
      ...asStringList(raw.calls),
      ...asStringList(raw.uses),
    ]
    const skillSources: Record<string, string> = {}
    for (const s of skills) skillSources[s] = opts.sourcePath

    return {
      id: slugify(`${type}-${name}`),
      name,
      type,
      description: raw.description ? String(raw.description) : undefined,
      skills: Array.from(new Set(skills)),
      rules: Array.from(new Set(rules)),
      github: github?.startsWith("http") ? github : github ? `https://github.com/${github}` : undefined,
      repo: typeof raw.repo === "string" ? raw.repo : typeof raw.repository === "string" ? raw.repository : undefined,
      branch: raw.branch ? String(raw.branch) : undefined,
      server: asServer(raw.server || raw.deploy || raw.host),
      dependencies: Array.from(new Set(dependencies)),
      sourcePath: opts.sourcePath,
      skillSources,
    }
  } catch (e) {
    return {
      id: slugify(`error-${opts.sourcePath}`),
      name: opts.fileName || opts.sourcePath,
      type: "agent",
      skills: [],
      rules: [],
      dependencies: [],
      sourcePath: opts.sourcePath,
      error: e instanceof Error ? e.message : String(e),
    }
  }
}
