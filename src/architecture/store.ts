/** Zustand-хранилище результатов сканирования Архитектуры. */

"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { ArchitectureConfig, ArchitectureGraph, ArchitectureObject } from "./types"
import { DEFAULT_ARCHITECTURE_CONFIG } from "./types"
import { architectureApi } from "./api-client"
import { buildLocalFallbackGraph } from "./scanner/local-fallback"

type ArchitectureState = {
  graph: ArchitectureGraph | null
  config: ArchitectureConfig
  selectedId: string | null
  search: string
  showGithub: boolean
  loading: boolean
  error: string | null
  setSearch: (q: string) => void
  setShowGithub: (v: boolean) => void
  select: (id: string | null) => void
  setConfig: (c: ArchitectureConfig) => void
  selectedObject: () => ArchitectureObject | null
  scan: () => Promise<void>
  loadSettings: () => Promise<void>
  saveSettings: (c: ArchitectureConfig) => Promise<void>
}

export const useArchitectureStore = create<ArchitectureState>()(
  persist(
    (set, get) => ({
      graph: null,
      config: DEFAULT_ARCHITECTURE_CONFIG,
      selectedId: null,
      search: "",
      showGithub: true,
      loading: false,
      error: null,

      setSearch: (q) => set({ search: q }),
      setShowGithub: (v) => set({ showGithub: v }),
      select: (id) => set({ selectedId: id }),
      setConfig: (c) => set({ config: c }),

      selectedObject: () => {
        const { graph, selectedId } = get()
        if (!graph || !selectedId) return null
        return graph.objects.find((o) => o.id === selectedId) || null
      },

      scan: async () => {
        set({ loading: true, error: null })
        try {
          const graph = await architectureApi.scan()
          set({ graph, loading: false })
        } catch (e) {
          // Фолбэк: локальный каталог из репозитория (для static export / офлайна)
          const fallback = buildLocalFallbackGraph()
          set({
            graph: fallback,
            loading: false,
            error:
              (e instanceof Error ? e.message : String(e)) +
              " — показан локальный каталог.",
          })
        }
      },

      loadSettings: async () => {
        try {
          const config = await architectureApi.getSettings()
          set({ config })
        } catch {
          // оставляем текущий / default
        }
      },

      saveSettings: async (c) => {
        set({ config: c })
        try {
          const saved = await architectureApi.saveSettings(c)
          set({ config: saved })
        } catch (e) {
          // Сохраняем локально через persist даже если API недоступен
          set({
            error:
              "Настройки сохранены локально. API: " +
              (e instanceof Error ? e.message : String(e)),
          })
        }
      },
    }),
    {
      name: "forge-mill-architecture",
      partialize: (s) => ({
        graph: s.graph,
        config: s.config,
        showGithub: s.showGithub,
      }),
    },
  ),
)
