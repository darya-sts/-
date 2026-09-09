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

export type TelegramSource = {
  id: string
  username: string
  title: string
  category: string
  weight: number
  isActive: boolean
  lastParsed: string | null
}

export type DigestItem = {
  id: string
  selected: boolean
  order: number
  post: {
    id: string
    summary: string | null
    text: string
    category: string
    score: number
    isExpert: boolean
    source: { username: string }
  }
}

export type Digest = {
  id: string
  date: string
  status: string
  articleId?: string | null
  items: DigestItem[]
}

export type DashboardStats = {
  articlesWeek: number
  sourcesActive: number
  digestsTotal: number
  tokensWeek: number
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
  updateArticle: (id: string, body: { content?: string; title?: string }) =>
    req<MarvinArticle>(`/articles/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  insertMedia: (id: string, body: { emoji?: string; imageUrl?: string; alt?: string }) =>
    req<MarvinArticle>(`/articles/${id}/media`, { method: "POST", body: JSON.stringify(body) }),
  uploadImage: async (file: File) => {
    const form = new FormData()
    form.append("file", file)
    const res = await fetch(`${API_BASE}/upload`, { method: "POST", body: form })
    if (!res.ok) throw new Error((await res.text()) || `HTTP ${res.status}`)
    return res.json() as Promise<{ url: string; filename: string }>
  },
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

  dashboard: () => req<DashboardStats>("/stats/dashboard"),
  listSources: () => req<TelegramSource[]>("/sources"),
  createSource: (body: { username: string; title?: string; category: string; weight?: number }) =>
    req<TelegramSource>("/sources", { method: "POST", body: JSON.stringify(body) }),
  updateSource: (id: string, body: Partial<{ isActive: boolean; weight: number; title: string }>) =>
    req<TelegramSource>(`/sources/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteSource: (id: string) => req<{ ok: boolean }>(`/sources/${id}`, { method: "DELETE" }),
  listDigests: () => req<Digest[]>("/digests"),
  getDigest: (id: string) => req<Digest>(`/digests/${id}`),
  generateDigest: () => req<Digest>("/digests/generate", { method: "POST" }),
  selectDigestItems: (id: string, itemIds: string[]) =>
    req<Digest>(`/digests/${id}/select`, { method: "POST", body: JSON.stringify({ itemIds }) }),
  approveDigest: (id: string) => req<MarvinArticle>(`/digests/${id}/approve`, { method: "POST" }),
}