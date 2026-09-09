/** Клиент Prompt Studio API. */

export type PromptRecord = {
  id: string
  title: string
  request: string
  body: string
  status: string
  createdAt: string
  updatedAt: string
  tasks?: PromptTaskRecord[]
}

export type PromptTaskRecord = {
  id: string
  promptId: string
  agents: string[]
  agentRoles: string
  modelTier: string
  modelId: string
  publications: string[]
  saveToMemory: boolean
  memoryItems: string[]
  priority: string
  deadline?: string | null
  status: string
  packageMarkdown: string
  pdfPath?: string | null
  outputPaths: string[]
  createdAt: string
  prompt?: { id: string; title: string }
}

export type PromptCatalog = {
  agents: Array<{ id: string; name: string; description: string; defaultRole: string }>
  models: Array<{
    id: string
    name: string
    tier: "economy" | "balanced" | "fast"
    speed: string
    cost: string
    quality: string
    recommendedFor: string
  }>
  publications: Array<{ id: string; label: string; hint: string }>
  memoryItems: Array<{ id: string; label: string }>
  defaults: { confirmation: string; parallelLimit: null; externalIntegrations: string[] }
}

const API_BASE = process.env.NEXT_PUBLIC_PROMPTS_API_BASE || "/api/prompts"

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  })
  if (!res.ok) throw new Error((await res.text()) || `HTTP ${res.status}`)
  if (res.status === 204) return undefined as T
  const ct = res.headers.get("content-type") || ""
  if (ct.includes("application/pdf")) {
    return (await res.blob()) as T
  }
  return res.json() as Promise<T>
}

export const promptsApi = {
  catalog: () => req<PromptCatalog>("/catalog"),
  list: () => req<PromptRecord[]>("/"),
  tasks: () => req<PromptTaskRecord[]>("/tasks"),
  get: (id: string) => req<PromptRecord>(`/${id}`),
  compose: (request: string, title?: string) =>
    req<{ title: string; body: string; recommendedTier: string }>("/compose", {
      method: "POST",
      body: JSON.stringify({ request, title }),
    }),
  create: (body: { title: string; request: string; body: string }) =>
    req<PromptRecord>("/", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: Partial<{ title: string; body: string; status: string }>) =>
    req<PromptRecord>(`/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  remove: (id: string) => req<{ ok: boolean }>(`/${id}`, { method: "DELETE" }),
  pdf: async (id: string, fileName?: string) => {
    const res = await fetch(`${API_BASE}/${id}/pdf`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileName }),
    })
    if (!res.ok) throw new Error((await res.text()) || `HTTP ${res.status}`)
    return res.blob()
  },
  delegate: (id: string, body: Record<string, unknown>) =>
    req<{
      task: PromptTaskRecord
      packageMarkdown: string
      outputPaths: string[]
      gitHint: string | null
      chatPreview: string | null
    }>(`/${id}/delegate`, { method: "POST", body: JSON.stringify(body) }),
}
