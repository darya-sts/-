export type MarvinArticle = {
  id: string
  title: string
  content: string
  query: string
  tags: string[]
  status: string
  tokenUsed: number
  createdAt: string
  updatedAt: string
}

export type MarvinSettings = {
  id: string
  skills: string
  rules: string
  telegramSources: string
  updatedAt: string
}

const API_BASE = process.env.NEXT_PUBLIC_MARVIN_API_BASE || "/api/marvinbot"

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

export const marvinApi = {
  listArticles: () => req<MarvinArticle[]>("/articles"),
  getArticle: (id: string) => req<MarvinArticle>(`/articles/${id}`),
  generate: (query: string, context?: string) =>
    req<{ article: MarvinArticle; quality: { passed: boolean; notes: string[] }; cached: boolean }>(
      "/generate",
      { method: "POST", body: JSON.stringify({ query, context }) },
    ),
  chat: (articleId: string, message: string) =>
    req<{ article: MarvinArticle; quality: { passed: boolean; notes: string[] } }>("/chat", {
      method: "POST",
      body: JSON.stringify({ articleId, message }),
    }),
  getSkills: () => req<MarvinSettings>("/skills"),
  putSkills: (body: { skills?: string; rules?: string; telegramSources?: string }) =>
    req<MarvinSettings>("/skills", { method: "PUT", body: JSON.stringify(body) }),
  analyzeTelegram: (channels: string[]) =>
    req<{ status: string; message: string }>("/analyze-telegram", {
      method: "POST",
      body: JSON.stringify({ channels }),
    }),
  exportUrl: (id: string, format: "pdf" | "docx") =>
    `${API_BASE}/articles/${id}/export?format=${format}`,
}
