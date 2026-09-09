"use client"

import { useState, type FormEvent } from "react"
import { Lock, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type VaultLoginProps = {
  mode: "setup" | "unlock"
  busy: boolean
  error: string | null
  onSubmit: (password: string) => Promise<void>
}

export function VaultLogin({ mode, busy, error, onSubmit }: VaultLoginProps) {
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const isSetup = mode === "setup"

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (isSetup && password !== confirm) return
    await onSubmit(password)
  }

  const mismatch = isSetup && confirm.length > 0 && password !== confirm

  return (
    <Card className="mx-auto w-full max-w-md bg-card/80">
      <CardHeader>
        <div className="mb-1 flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
          {isSetup ? <ShieldCheck className="size-4" /> : <Lock className="size-4" />}
        </div>
        <CardTitle>{isSetup ? "Создать базу паролей" : "Открыть базу паролей"}</CardTitle>
        <CardDescription>
          {isSetup
            ? "Мастер-пароль остаётся только в памяти вкладки. Без него записи не расшифровать."
            : "Введите мастер-пароль. Он не пишется в localStorage."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-3" onSubmit={handleSubmit}>
          <label className="grid gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Мастер-пароль</span>
            <Input
              autoFocus
              type="password"
              autoComplete={isSetup ? "new-password" : "current-password"}
              minLength={8}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {isSetup ? (
            <label className="grid gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Повтор</span>
              <Input
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                value={confirm}
                aria-invalid={mismatch || undefined}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </label>
          ) : null}
          {mismatch ? (
            <p className="text-sm text-destructive">Пароли не совпадают.</p>
          ) : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button disabled={busy || mismatch} type="submit">
            {busy ? "Шифрование…" : isSetup ? "Создать базу" : "Разблокировать"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
