import { newId } from "@/lib/tasks/id"
import { buildPackageMarkdown } from "@/lib/prompts/compose"
import { normalizeDirections } from "@/lib/prompts/directions"
import {
  PROMPTS_STORAGE,
  type DelegateInput,
  type PromptMemoryRecord,
  type PromptRecord,
  type PromptTaskRecord,
} from "@/lib/prompts/types"

function readList<T>(key: string): T[] {
  if (typeof window === "undefined") return []
  const raw = window.localStorage.getItem(key)
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as T[]) : []
  } catch {
    return []
  }
}

function writeList<T>(key: string, value: T[]) {
  window.localStorage.setItem(key, JSON.stringify(value))
}

export function loadPrompts() {
  return readList<PromptRecord>(PROMPTS_STORAGE.prompts).map((item) => ({
    ...item,
    directions: normalizeDirections(item.directions),
  }))
}

export function loadPromptTasks() {
  return readList<PromptTaskRecord>(PROMPTS_STORAGE.tasks).map((item) => ({
    ...item,
    directions: normalizeDirections(item.directions),
  }))
}

export function loadPromptMemory() {
  return readList<PromptMemoryRecord>(PROMPTS_STORAGE.memory)
}

export function createPrompt(input: Omit<PromptRecord, "id" | "createdAt" | "updatedAt" | "status">): PromptRecord {
  const now = new Date().toISOString()
  const record: PromptRecord = { ...input, id: newId(), status: "draft", createdAt: now, updatedAt: now }
  writeList(PROMPTS_STORAGE.prompts, [record, ...loadPrompts()])
  return record
}

export function updatePrompt(
  id: string,
  patch: Partial<Pick<PromptRecord, "title" | "body" | "status" | "request" | "directions" | "recommendedTier">>
) {
  const next = loadPrompts().map((item) =>
    item.id === id ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item
  )
  writeList(PROMPTS_STORAGE.prompts, next)
  return next.find((item) => item.id === id) ?? null
}

export function delegatePrompt(prompt: PromptRecord, dto: DelegateInput) {
  const markdown = buildPackageMarkdown({ ...prompt, title: prompt.title, body: prompt.body }, dto)
  const stamp = Date.now()
  const slug = prompt.title.toLowerCase().replace(/[^a-z0-9а-яё]+/gi, "-").replace(/^-|-$/g, "").slice(0, 48) || "prompt"
  const outputPaths: string[] = []
  if (dto.publications.includes("markdown") || dto.publications.includes("project-file") || dto.publications.includes("git") || dto.publications.includes("chat")) {
    outputPaths.push(`prompts/tasks/${slug}-${stamp}.md`)
    outputPaths.push(`.cursor/tasks/${slug}-${stamp}.md`)
  }
  if (dto.publications.includes("pdf")) outputPaths.push(`prompts/pdf/${dto.pdfFileName || `${slug}.pdf`}`)

  const task: PromptTaskRecord = {
    id: newId(),
    promptId: prompt.id,
    promptTitle: prompt.title,
    directions: normalizeDirections(prompt.directions),
    agents: dto.agents,
    agentRoles: dto.agentRoles,
    modelTier: dto.modelTier,
    modelId: dto.modelId,
    publications: dto.publications,
    saveToMemory: dto.saveToMemory,
    memoryItems: dto.memoryItems,
    priority: dto.priority,
    deadline: dto.deadline,
    inputRef: dto.inputRef,
    packageMarkdown: markdown,
    outputPaths,
    createdAt: new Date().toISOString(),
  }
  writeList(PROMPTS_STORAGE.tasks, [task, ...loadPromptTasks()])
  updatePrompt(prompt.id, { status: "delegated", title: prompt.title, body: prompt.body })

  if (dto.saveToMemory) {
    const memory: PromptMemoryRecord = {
      taskId: task.id,
      promptId: prompt.id,
      savedAt: task.createdAt,
    }
    if (dto.memoryItems.includes("prompt-body")) memory.promptBody = prompt.body
    if (dto.memoryItems.includes("models-used")) memory.model = { tier: dto.modelTier, id: dto.modelId }
    if (dto.memoryItems.includes("key-decisions")) {
      memory.keyDecisions = { agents: dto.agents, publications: dto.publications, priority: dto.priority }
    }
    if (dto.memoryItems.includes("agent-output")) memory.agentOutput = "Будет дополнено после выполнения задания Cursor."
    writeList(PROMPTS_STORAGE.memory, [memory, ...loadPromptMemory()])
    outputPaths.push(`prompts/memory/${task.id}.json`)
    task.outputPaths = outputPaths
    writeList(PROMPTS_STORAGE.tasks, [task, ...loadPromptTasks().filter((item) => item.id !== task.id)])
  }

  return { task, packageMarkdown: markdown, outputPaths }
}
