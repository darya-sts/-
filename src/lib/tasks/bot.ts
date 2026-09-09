import { findRelatedMemory } from "./memory"
import { findVaultApiKey } from "@/lib/vault/live-items"
import { newId } from "./id"
import {
  BOT_MESSAGES,
  type ChatMessage,
  type ChecklistItem,
  type Task,
  type TaskChat,
  type TaskStatus,
} from "./types"

export function connectBotChat(): TaskChat {
  return {
    messages: [
      {
        id: newId(),
        role: "system",
        content:
          "Бот подключён. Команды: «разбей на подзадачи», «выполни задачу», «вопрос» или свободный текст.",
        timestamp: Date.now(),
        type: "text",
      },
    ],
    isBotActive: true,
    botContext: { currentAction: "idle", progress: 0 },
  }
}

export type BotIntent = "breakdown" | "execute" | "question" | "update"

export type BotStep = {
  message: ChatMessage
  taskPatch?: Partial<Task>
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function botMessage(content: string, type: ChatMessage["type"] = "text"): ChatMessage {
  return {
    id: newId(),
    role: "bot",
    content,
    timestamp: Date.now(),
    type,
  }
}

function splitSentences(text: string): string[] {
  return text
    .split(/[\n.;]+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 8)
    .slice(0, 8)
}

export class TaskBot {
  detectIntent(command: string): BotIntent {
    const value = command.toLowerCase()
    if (/(разбей|подзадач|чек-лист|чеклист|breakdown)/.test(value)) return "breakdown"
    if (/(выполни|сделай|доделай|execute|запусти)/.test(value)) return "execute"
    if (/(вопрос|уточн|почему|как лучше)/.test(value)) return "question"
    return "update"
  }

  async getApiKey(task: Task): Promise<string | null> {
    return findVaultApiKey(task.botConfig?.apiKeyName)
  }

  async processCommand(task: Task, command: string): Promise<ChatMessage> {
    let last: ChatMessage = botMessage(BOT_MESSAGES.error, "text")
    for await (const step of this.run(task, command)) {
      last = step.message
      if (step.taskPatch) {
        task = { ...task, ...step.taskPatch, updatedAt: Date.now() }
      }
    }
    return last
  }

  async *run(task: Task, command: string): AsyncGenerator<BotStep> {
    const intent = this.detectIntent(command)
    const apiKey = await this.getApiKey(task)
    yield {
      message: botMessage(BOT_MESSAGES.starting),
      taskPatch: {
        chat: {
          messages: task.chat?.messages ?? [],
          isBotActive: true,
          botContext: { currentAction: "starting", progress: 5 },
        },
      },
    }
    await sleep(350)
    yield { message: botMessage(BOT_MESSAGES.analyzing) }
    await sleep(350)

    const related = findRelatedMemory(task)
    if (related.length > 0) {
      yield {
        message: botMessage(
          `🧠 Нашёл ${related.length} запис(и) в памяти: ${related.map((item) => item.path).join(", ")}.`
        ),
      }
      await sleep(200)
    }

    if (apiKey) {
      yield {
        message: botMessage(
          `🔑 Нашёл ключ «${task.botConfig?.apiKeyName}» в Базе паролей. Реальный вызов API в статическом приложении недоступен — продолжаю эмуляцию.`
        ),
      }
      await sleep(250)
    } else if (task.botConfig?.apiKeyName) {
      yield {
        message: botMessage(
          `База паролей заблокирована или ключ «${task.botConfig.apiKeyName}» не найден. Работаю в эмуляции.`
        ),
      }
    }

    switch (intent) {
      case "breakdown":
        yield* this.breakdownTask(task)
        return
      case "execute":
        yield* this.executeTask(task)
        return
      case "question":
        yield { message: this.askQuestion(task) }
        return
      default:
        yield* this.updateTask(task, command)
    }
  }

  private async *breakdownTask(task: Task): AsyncGenerator<BotStep> {
    yield { message: botMessage(BOT_MESSAGES.planning, "checklist_update") }
    await sleep(400)
    const fromText = splitSentences(`${task.title}. ${task.description}`)
    const generated =
      fromText.length >= 3
        ? fromText
        : [
            "Собрать бриф и критерии готовности",
            "Разбить работу на проверяемые шаги",
            "Сделать первую рабочую версию",
            "Проверить результат по чек-листу",
            "Отметить статус «на проверке»",
          ]
    const checklist: ChecklistItem[] = generated.map((text, index) => ({
      id: newId(),
      text,
      completed: task.checklist[index]?.completed ?? false,
      completedAt: task.checklist[index]?.completedAt,
      completedBy: task.checklist[index]?.completedBy,
    }))
    const nextStatus: TaskStatus = task.status === "new" ? "planned" : task.status
    yield {
      message: botMessage(`Разбил задачу на ${checklist.length} пунктов чек-листа.`, "checklist_update"),
      taskPatch: {
        checklist,
        status: nextStatus,
        chat: {
          messages: task.chat?.messages ?? [],
          isBotActive: true,
          botContext: { currentAction: "breakdown", progress: 40 },
        },
      },
    }
  }

  private async *executeTask(task: Task): AsyncGenerator<BotStep> {
    yield { message: botMessage(BOT_MESSAGES.executing, "checklist_update") }
    await sleep(400)
    const pending = task.checklist.filter((item) => !item.completed)
    if (task.checklist.length === 0) {
      yield {
        message: botMessage("Чек-лист пуст. Сначала напишите «разбей на подзадачи».", "text"),
      }
      return
    }
    if (pending.length === 0) {
      yield {
        message: botMessage(BOT_MESSAGES.done, "status_change"),
        taskPatch: {
          status: "done",
          chat: {
            messages: task.chat?.messages ?? [],
            isBotActive: true,
            botContext: { currentAction: "done", progress: 100 },
          },
        },
      }
      return
    }
    const now = Date.now()
    const checklist = task.checklist.map((item) =>
      item.completed
        ? item
        : { ...item, completed: true, completedAt: now, completedBy: "bot" as const }
    )
    yield {
      message: botMessage(`Закрыл ${pending.length} пункт(ов) чек-листа.`, "checklist_update"),
        taskPatch: {
          checklist,
          status: "review",
          result: `Закрыто ботом пунктов: ${pending.length}`,
          chat: {
          messages: task.chat?.messages ?? [],
          isBotActive: true,
          botContext: { currentAction: "review", progress: 90 },
        },
      },
    }
    await sleep(250)
    yield {
      message: botMessage("Перенёс задачу на проверку. Отметьте «Выполнена», если результат ок.", "status_change"),
    }
  }

  private askQuestion(task: Task): ChatMessage {
    const open = task.checklist.filter((item) => !item.completed)
    const hint = open[0]?.text ?? "какой результат считать готовым"
    return botMessage(`${BOT_MESSAGES.question} что важнее закрыть первым — «${hint}» или дедлайн?`, "question")
  }

  private async *updateTask(task: Task, command: string): AsyncGenerator<BotStep> {
    yield { message: botMessage(BOT_MESSAGES.planning) }
    await sleep(300)
    const nextStatus: TaskStatus =
      task.status === "new" ? "planned" : task.status === "planned" ? "in_progress" : task.status
    const extra = command.trim().slice(0, 180)
    yield {
      message: botMessage(`Учёл команду: «${extra}». Обновил контекст и сдвинул статус, если это уместно.`, "status_change"),
      taskPatch: {
        status: nextStatus,
        description: task.description.includes(extra) ? task.description : `${task.description}\n\nЗаметка бота: ${extra}`.trim(),
        chat: {
          messages: task.chat?.messages ?? [],
          isBotActive: true,
          botContext: { currentAction: "update", progress: 55 },
        },
      },
    }
  }
}

export const taskBot = new TaskBot()
