/** Локальный каталог на случай недоступности API сканера. */

import { parseAgentConfig } from "./parse-config"
import { buildArchitectureGraph } from "./build-graph"
import type { ArchitectureGraph } from "../types"

const EMBEDDED: Array<{ path: string; data: Record<string, unknown> }> = [
  {
    path: "agents/content-agent/agent.json",
    data: {
      name: "ContentAgent",
      type: "agent",
      description: "Агент контент-фабрики: бриф, сценарий, нарезка под YouTube / X / Telegram.",
      skills: ["research", "script-writing", "shorts-hooks", "x-thread", "telegram-checklist"],
      rules: [
        "Не выдумывать CPM и выплаты — брать цифры из src/data/.",
        "Хук ролика ≤ 20 секунд, без «в этом видео мы поговорим».",
        "X-тред должен содержать оригинальный тезис, не копипаст описания YouTube.",
      ],
      github: "https://github.com/darya-sts/-",
      server: { host: "app1.neurosolutions.pro", type: "VPS" },
      depends_on: ["ForgeMill", "MarvinBotStudio"],
      uses: ["DeepSeek"],
    },
  },
  {
    path: "agents/marvinbot-studio/agent.json",
    data: {
      name: "MarvinBotStudio",
      type: "app",
      description: "NestJS API + UI Studio: дайджесты Telegram и генерация статей.",
      skills: ["digest-pipeline", "article-generate", "telegram-sources"],
      rules: ["Ключи API только в .env"],
      github: "https://github.com/darya-sts/-",
      server: { host: "72.56.18.124", type: "Docker" },
      depends_on: ["DeepSeek"],
      calls: ["DeepSeek"],
    },
  },
  {
    path: "bots/marvindeepseek/bot.json",
    data: {
      name: "MarvinDeepSeekBot",
      type: "bot",
      description: "Telegram-бот: вопрос → ответ DeepSeek в том же чате.",
      skills: ["telegram-chat", "deepseek-completion"],
      rules: ["Доступ только для ALLOWED_USERS"],
      github: "https://github.com/darya-sts/-/tree/cursor/marvindeepseek-chat-23f0/marvindeepseek-bot",
      server: { host: "72.56.18.124", type: "Docker", container: "marvindeepseek-bot" },
      depends_on: ["DeepSeek"],
      uses: ["DeepSeek"],
    },
  },
  {
    path: "bots/suyuyu/bot.json",
    data: {
      name: "SuyuyuBot",
      type: "bot",
      description: "Writer-agent: статьи → черновик → approve в канал.",
      skills: ["writer_agent", "process_article"],
      tools: ["deepseek-mcp"],
      github: "https://github.com/darya-sts/-/tree/cursor/tg-bot-testovyy-7ea1",
      server: { host: "72.56.18.124", type: "Docker", container: "tg-bot" },
      depends_on: ["DeepSeek"],
    },
  },
  {
    path: "agents/deepseek-service/agent.json",
    data: {
      name: "DeepSeek",
      type: "service",
      description: "LLM API deepseek-chat.",
      skills: ["chat-completions"],
      github: "https://platform.deepseek.com",
      server: { host: "api.deepseek.com", type: "serverless" },
    },
  },
  {
    path: "agents/forge-mill/agent.json",
    data: {
      name: "ForgeMill",
      type: "app",
      description: "Playbook контент-фабрики YouTube / X / Telegram.",
      skills: ["playbook", "architecture-mindmap"],
      github: "https://github.com/darya-sts/-",
      server: { host: "app1.neurosolutions.pro", type: "Docker" },
      uses: ["MarvinBotStudio"],
    },
  },
]

export function buildLocalFallbackGraph(): ArchitectureGraph {
  const objects = EMBEDDED.map((item) =>
    parseAgentConfig(item.data, {
      sourcePath: item.path,
      fileName: item.path.split("/").pop(),
      dirHint: item.path,
    }),
  )
  return buildArchitectureGraph(objects)
}
