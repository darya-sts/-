export type McpServer = {
  name: string
  official: boolean
  use: string
  setup: string
  caution?: string
}

export const mcpServers: McpServer[] = [
  {
    name: "Notion MCP",
    official: true,
    use: "Календарь, SOP, статус роликов, KPI-строки. Агент создаёт страницу сценария и двигает статус Ready → Scheduled.",
    setup: "Cursor Settings → MCP → URL https://mcp.notion.com/mcp (OAuth). Либо плагин Notion для Cursor.",
  },
  {
    name: "ElevenLabs MCP",
    official: true,
    use: "Озвучка утверждённого сценария выбранным голосом, без копипаста в веб-UI.",
    setup: "command: uvx, args: elevenlabs-mcp, env: ELEVENLABS_API_KEY.",
  },
  {
    name: "Brave Search MCP",
    official: true,
    use: "Ресёрч конкурентов и фактчек цифр из агента.",
    setup: "Официальный сервер Brave + API key с brave.com/search/api.",
  },
  {
    name: "Firecrawl MCP",
    official: true,
    use: "Снять статью/доки конкурента в markdown и сделать бриф.",
    setup: "Ключ Firecrawl. Подключайте с месяца 2, не в день 1.",
  },
  {
    name: "n8n MCP",
    official: true,
    use: "Запуск workflow «отправить в TG / сложить файл / алерт KPI» из чата Cursor.",
    setup: "n8n как MCP-сервер (instance URL + API key). Self-host предпочтителен.",
    caution: "Не вешайте на n8n автопостинг в X без очереди на утверждение.",
  },
  {
    name: "Telegram MCP (community) / Bot API",
    official: false,
    use: "Черновик поста в канал, кнопки, UTM.",
    setup: "BotFather токен + id канала. Часто проще узел n8n Telegram, чем отдельный сервер.",
  },
  {
    name: "OpenTweet MCP / X MCP",
    official: false,
    use: "Черновик треда и слот. Hosted OpenTweet избавляет от X API billing.",
    setup: "https://mcp.opentweet.io/mcp + Bearer. Либо self-host x-mcp-server с OAuth 2.0 (media.write).",
    caution:
      "Публикация должна быть после вашей правки. Automated content не квалифицируется под Original Content Rewards.",
  },
  {
    name: "YouTube Data API MCP (community)",
    official: false,
    use: "Читать статистику роликов, не загружать видео (upload всё равно надёжнее через Studio).",
    setup: "Google Cloud проект, YouTube Data API v3, OAuth клиента.",
  },
  {
    name: "Filesystem MCP",
    official: true,
    use: "Сценарии, превью и wav в папке репозитория/диска фабрики.",
    setup: "Стандартный @modelcontextprotocol/server-filesystem на директорию /ContentFactory.",
  },
  {
    name: "Stripe MCP",
    official: true,
    use: "Сверка платежей продукта. Не для создания секретных ключей в чате.",
    setup: "Restricted key read-only на старте.",
    caution: "Не давайте агенту write-ключ.",
  },
  {
    name: "Blotato MCP",
    official: true,
    use: "Единый постинг в соцсети из агента на масштабе 6-го месяца.",
    setup: "Hosted MCP Blotato. $29+/мес — не в lean-стек.",
  },
  {
    name: "Google Drive MCP",
    official: true,
    use: "Склад исходников, если не Git/локальный диск.",
    setup: "OAuth Google. Держите папку «Ready» отдельно от «Raw».",
  },
]

export const CURSOR_RULES = `You are the operator of an English-language content factory (YouTube long-form + Shorts, X, Telegram).

Voice: specific, numeric, no hype, no "unlock your potential", no get-rich promises.
Audience: US/UK solopreneurs. Use dollars, ET timestamps, named tools.

Never:
- invent prices, APIs, or legal claims
- write engagement bait ("like if you agree")
- output a finished X post intended for immediate autopost
- copy a YouTube description into X/Telegram verbatim

Always:
- give a source or a [VERIFY] tag next to figures
- include FTC-style disclosure when an affiliate is mentioned
- produce: (1) 8–12 min script with timestamped hook, (2) two Shorts hooks, (3) an X thread with an original thesis, (4) a Telegram checklist
`

export const MCP_JSON_EXAMPLE = `{
  "mcpServers": {
    "notion": {
      "url": "https://mcp.notion.com/mcp"
    },
    "elevenlabs": {
      "command": "uvx",
      "args": ["elevenlabs-mcp"],
      "env": { "ELEVENLABS_API_KEY": "REPLACE" }
    },
    "brave-search": {
      "command": "npx",
      "args": ["-y", "@brave/brave-search-mcp-server"],
      "env": { "BRAVE_API_KEY": "REPLACE" }
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/factory"]
    }
  }
}
`
