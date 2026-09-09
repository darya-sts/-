"use client"

import { useEffect, useRef, useState, type FormEvent } from "react"
import { Bot, Send, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { connectBotChat, taskBot } from "@/lib/tasks/bot"
import { newId } from "@/lib/tasks/storage"
import type { ChatMessage, Task } from "@/lib/tasks/types"
import { cn } from "@/lib/utils"

export interface TaskChatProps {
  task: Task
  onUpdateTask: (updates: Partial<Task>) => void
}

const QUICK = ["Разбей на подзадачи", "Выполни задачу", "Вопрос по задаче"]

export function TaskChat({ task, onUpdateTask }: TaskChatProps) {
  const [draft, setDraft] = useState("")
  const [busy, setBusy] = useState(false)
  const scroller = useRef<HTMLDivElement>(null)
  const messages = task.chat?.messages ?? []
  const connected = Boolean(task.chat?.isBotActive)

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight })
  }, [messages.length, busy])

  function connect() {
    onUpdateTask({ chat: connectBotChat() })
  }

  async function send(command: string) {
    const text = command.trim()
    if (!text || busy) return
    setBusy(true)
    setDraft("")
    const userMessage: ChatMessage = {
      id: newId(),
      role: "user",
      content: text,
      timestamp: Date.now(),
      type: "text",
    }
    let nextMessages = [...messages, userMessage]
    let current: Task = {
      ...task,
      chat: {
        messages: nextMessages,
        isBotActive: true,
        botContext: { currentAction: "starting", progress: 5 },
      },
    }
    onUpdateTask({ chat: current.chat })
    try {
      for await (const step of taskBot.run(current, text)) {
        nextMessages = [...nextMessages, step.message]
        const patch = step.taskPatch ?? {}
        current = {
          ...current,
          ...patch,
          chat: {
            messages: nextMessages,
            isBotActive: true,
            botContext: patch.chat?.botContext ?? current.chat?.botContext,
          },
        }
        onUpdateTask({
          ...patch,
          chat: current.chat,
        })
      }
    } finally {
      setBusy(false)
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    void send(draft)
  }

  if (!connected) {
    return (
      <div className="rounded-xl bg-white/80 p-4">
        <p className="text-sm font-semibold">Чат с ботом</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Подключите агента, чтобы разбить задачу на чек-лист или эмулировать выполнение.
        </p>
        <Button type="button" className="mt-3" onClick={connect}>
          <Bot />
          Подключить бота
        </Button>
      </div>
    )
  }

  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-primary" />
        <p className="text-sm font-semibold">Чат с ботом</p>
      </div>
      <div
        ref={scroller}
        className="flex max-h-72 flex-col gap-2 overflow-y-auto rounded-xl bg-white/80 p-3"
      >
        {messages.map((message) => (
          <ChatBubble key={message.id} message={message} />
        ))}
        {busy ? (
          <p className="chat-message-enter text-xs text-muted-foreground">Бот думает…</p>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {QUICK.map((item) => (
          <Button
            key={item}
            type="button"
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => void send(item)}
          >
            {item}
          </Button>
        ))}
      </div>
      <form className="flex gap-2" onSubmit={handleSubmit}>
        <Input
          value={draft}
          disabled={busy}
          placeholder="Команда боту…"
          onChange={(event) => setDraft(event.target.value)}
        />
        <Button type="submit" disabled={busy || !draft.trim()}>
          <Send />
          Отправить
        </Button>
      </form>
    </div>
  )
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const align =
    message.role === "user" ? "ml-8 bg-primary text-primary-foreground" : "mr-8 bg-[#e8eef2] text-foreground"
  const label = message.role === "user" ? "Вы" : message.role === "bot" ? "Бот" : "Система"
  return (
    <div className={cn("chat-message-enter rounded-xl px-3 py-2 text-sm", align)}>
      <p className="text-[10px] font-semibold tracking-wide uppercase opacity-70">{label}</p>
      <p className="mt-0.5 whitespace-pre-wrap">{message.content}</p>
    </div>
  )
}
