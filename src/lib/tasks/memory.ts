import { STORAGE_KEYS, type Task, type TaskMemoryRecord } from "./types"
import { botLabel } from "./bots"
import { newId } from "./id"

function slug(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9а-яё]+/gi, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48) || "task"
  )
}

export function loadMemory(): TaskMemoryRecord[] {
  if (typeof window === "undefined") return []
  const raw = window.localStorage.getItem(STORAGE_KEYS.memory)
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as TaskMemoryRecord[]) : []
  } catch {
    return []
  }
}

function saveMemoryList(list: TaskMemoryRecord[]) {
  window.localStorage.setItem(STORAGE_KEYS.memory, JSON.stringify(list))
}

export function findRelatedMemory(task: Task): TaskMemoryRecord[] {
  const words = `${task.title} ${task.description}`.toLowerCase().split(/\s+/).filter((word) => word.length > 4)
  return loadMemory()
    .filter((entry) => entry.taskId !== task.id)
    .filter((entry) => {
      const hay = `${entry.title} ${entry.markdown}`.toLowerCase()
      return words.some((word) => hay.includes(word))
    })
    .slice(0, 3)
}

export function buildTaskMemory(task: Task, categoryLabel: string): TaskMemoryRecord {
  const savedAt = Date.now()
  const path = `memory/tasks/${slug(task.title)}-${task.id.slice(0, 8)}.md`
  const checklist = task.checklist
    .map((item) => `- [${item.completed ? "x" : " "}] ${item.text}${item.completedBy ? ` (${item.completedBy})` : ""}`)
    .join("\n")
  const chat = (task.chat?.messages ?? [])
    .map((message) => `**${message.role}**: ${message.content}`)
    .join("\n\n")
  const attachments = (task.attachments ?? [])
    .map((item) => `- ${item.kind}: ${item.title || item.name}${item.url ? ` (${item.url})` : ""}${item.excerpt ? `\n  > ${item.excerpt.slice(0, 400)}` : ""}`)
    .join("\n")
  const json = {
    version: 1,
    taskId: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    category: categoryLabel,
    executor: botLabel(task.executorBotId),
    result: task.result ?? "",
    checklist: task.checklist,
    attachments: (task.attachments ?? []).map((item) => ({
      kind: item.kind,
      name: item.name,
      url: item.url,
      excerpt: item.excerpt,
    })),
    chat: task.chat?.messages ?? [],
    savedAt,
  }
  const markdown = `# ${task.title}

- id: \`${task.id}\`
- status: \`${task.status}\`
- priority: \`${task.priority}\`
- category: ${categoryLabel}
- executor: ${botLabel(task.executorBotId)}
- savedAt: ${new Date(savedAt).toISOString()}

## Description

${task.description || "—"}

## Result

${task.result || "—"}

## Checklist

${checklist || "—"}

## Attachments

${attachments || "—"}

## Chat

${chat || "—"}

\`\`\`json
${JSON.stringify(json, null, 2)}
\`\`\`
`
  return {
    id: newId(),
    taskId: task.id,
    title: task.title,
    savedAt,
    path,
    markdown,
    json,
  }
}

export function persistTaskMemory(record: TaskMemoryRecord): TaskMemoryRecord {
  const next = [record, ...loadMemory().filter((item) => item.taskId !== record.taskId)]
  saveMemoryList(next)
  const blob = new Blob([record.markdown], { type: "text/markdown;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = record.path.split("/").pop() ?? "task-memory.md"
  link.click()
  URL.revokeObjectURL(url)
  return record
}
