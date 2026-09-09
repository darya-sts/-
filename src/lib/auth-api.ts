/** Клиент авторизации (cookies + credentials). */

export type AuthUser = { id: string; email: string; role: string }

const AUTH_BASE = process.env.NEXT_PUBLIC_AUTH_API_BASE || "/api/auth"

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${AUTH_BASE}${path}`, {
    ...init,
    credentials: "include",
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

export const authApi = {
  login: (email: string, password: string) =>
    req<AuthUser>("/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  refresh: () => req<AuthUser>("/refresh", { method: "POST" }),
  logout: () => req<{ ok: boolean }>("/logout", { method: "POST" }),
  me: () => req<AuthUser>("/me"),
}
