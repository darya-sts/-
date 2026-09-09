"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { usePathname, useRouter } from "next/navigation"
import { authApi, type AuthUser } from "@/lib/auth-api"

type AuthState = {
  user: AuthUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<boolean>
}

const AuthContext = createContext<AuthState | null>(null)

const PUBLIC_PATHS = ["/login", "/login/"]

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const pathname = usePathname()
  const router = useRouter()

  const refresh = useCallback(async () => {
    try {
      const me = await authApi.refresh()
      setUser(me)
      return true
    } catch {
      setUser(null)
      return false
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const me = await authApi.me()
        if (!cancelled) setUser(me)
      } catch {
        const ok = await refresh()
        if (!cancelled && !ok) setUser(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [refresh])

  useEffect(() => {
    if (loading) return
    const isPublic = PUBLIC_PATHS.includes(pathname)
    if (!user && !isPublic) {
      router.replace("/login/")
    } else if (user && isPublic) {
      router.replace("/")
    }
  }, [loading, user, pathname, router])

  const login = useCallback(async (email: string, password: string) => {
    const me = await authApi.login(email, password)
    setUser(me)
    router.replace("/")
  }, [router])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } finally {
      setUser(null)
      router.replace("/login/")
    }
  }, [router])

  const value = useMemo(
    () => ({ user, loading, login, logout, refresh }),
    [user, loading, login, logout, refresh],
  )

  const isPublic = PUBLIC_PATHS.includes(pathname)

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center text-sm text-muted-foreground">
        Проверка сессии…
      </div>
    )
  }

  if (!user && !isPublic) {
    return (
      <div className="flex min-h-svh items-center justify-center text-sm text-muted-foreground">
        Перенаправление на вход…
      </div>
    )
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth вне AuthProvider")
  return ctx
}
