"use client"

import { useState, type FormEvent } from "react"
import { Factory } from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function LoginForm() {
  const { login } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setPending(true)
    try {
      await login(email.trim(), password)
    } catch (err) {
      let msg = err instanceof Error ? err.message : "Ошибка входа"
      try {
        const parsed = JSON.parse(msg) as { message?: string | string[] }
        if (parsed.message) msg = Array.isArray(parsed.message) ? parsed.message.join(", ") : parsed.message
      } catch { /* raw text */ }
      setError(msg)
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-3">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Factory className="size-4" />
            </span>
            <div>
              <p className="font-heading text-sm tracking-wide">FORGE MILL</p>
              <p className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
                Вход
              </p>
            </div>
          </div>
          <CardTitle className="text-xl">Авторизация</CardTitle>
          <p className="text-sm text-muted-foreground">
            Доступ только для заранее созданных аккаунтов.
          </p>
        </CardHeader>
        <CardContent>
          <form className="space-y-3" onSubmit={onSubmit}>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Email</label>
              <Input
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Пароль</label>
              <Input
                type="password"
                autoComplete="current-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error ? (
              <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            ) : null}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Вход…" : "Войти"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
