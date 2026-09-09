/** Sources the static catalog is assembled from (no Cursor REST on export). */
export const SCAN_SOURCES = [
  { path: "src/data/agents.ts", kind: "catalog", note: "канонический реестр агентов" },
  { path: "src/lib/tasks/bot.ts", kind: "bot", note: "TaskBot" },
  { path: "AGENTS.md", kind: "rules", note: "правила Cursor-агента" },
  { path: "src/data/beginner-factory.ts", kind: "pipeline", note: "роли конвейера" },
  { path: "src/data/mcp.ts", kind: "skills", note: "MCP-скилы" },
  { path: "public/api/agents.json", kind: "api", note: "GET /api/agents.json" },
] as const

export function scanManifest(agentCount: number) {
  return {
    scannedAt: new Date().toISOString(),
    agentCount,
    sources: SCAN_SOURCES,
    webhook: "недоступны на static export; синхронизация — кнопка или повторная сборка JSON",
  }
}
