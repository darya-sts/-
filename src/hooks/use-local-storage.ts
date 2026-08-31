"use client"

import { useCallback, useSyncExternalStore } from "react"

const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((l) => l())
}

function subscribe(onChange: () => void) {
  listeners.add(onChange)
  window.addEventListener("storage", onChange)
  return () => {
    listeners.delete(onChange)
    window.removeEventListener("storage", onChange)
  }
}

export function useLocalStorage<T>(key: string, initial: T) {
  const getSnapshot = useCallback(() => {
    try {
      return window.localStorage.getItem(key)
    } catch {
      return null
    }
  }, [key])

  const raw = useSyncExternalStore(subscribe, getSnapshot, () => null)

  let value = initial
  if (raw != null) {
    try {
      value = JSON.parse(raw) as T
    } catch {
      value = initial
    }
  }

  const setValue = (update: T | ((prev: T) => T)) => {
    const next = typeof update === "function" ? (update as (prev: T) => T)(value) : update
    try {
      window.localStorage.setItem(key, JSON.stringify(next))
    } catch {
      // ignore quota
    }
    emit()
  }

  return [value, setValue, raw !== undefined] as const
}
