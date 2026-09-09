/** Клиент API раздела Архитектура. */

import type { ArchitectureConfig, ArchitectureGraph } from "./types"
import { DEFAULT_ARCHITECTURE_CONFIG } from "./types"

const API_BASE = process.env.NEXT_PUBLIC_ARCHITECTURE_API_BASE || "/api/architecture"

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

export const architectureApi = {
  scan: () => req<ArchitectureGraph>("/scan", { method: "POST" }),
  getData: () => req<ArchitectureGraph>("/data"),
  getSettings: async () => {
    try {
      return await req<ArchitectureConfig>("/settings")
    } catch {
      return DEFAULT_ARCHITECTURE_CONFIG
    }
  },
  saveSettings: (config: ArchitectureConfig) =>
    req<ArchitectureConfig>("/settings", {
      method: "PUT",
      body: JSON.stringify(config),
    }),
}
