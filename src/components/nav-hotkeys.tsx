"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"

const JUMP: Record<string, string> = {
  a: "/agents/",
  t: "/tasks/",
  o: "/",
  v: "/vault/",
  m: "/marvinbot/",
  n: "/niches/",
  p: "/plan/",
  q: "/prompts/",
}

export function NavHotkeys() {
  const router = useRouter()
  const pending = useRef(false)
  const timer = useRef<number | null>(null)

  useEffect(() => {
    function clearPending() {
      pending.current = false
      if (timer.current) window.clearTimeout(timer.current)
      timer.current = null
    }

    function onKey(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      const target = event.target
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || (target instanceof HTMLElement && target.isContentEditable)) {
        return
      }
      const key = event.key.toLowerCase()
      if (!pending.current && key === "g") {
        pending.current = true
        timer.current = window.setTimeout(clearPending, 900)
        return
      }
      if (pending.current) {
        const href = JUMP[key]
        clearPending()
        if (href) {
          event.preventDefault()
          router.push(href)
        }
      }
    }

    window.addEventListener("keydown", onKey)
    return () => {
      window.removeEventListener("keydown", onKey)
      clearPending()
    }
  }, [router])

  return null
}
