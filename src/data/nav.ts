import type { LucideIcon } from "lucide-react"
import {
  Bot,
  CalendarDays,
  GitBranch,
  LayoutDashboard,
  ListTodo,
  Lock,
  PenLine,
  Network,
  Shield,
  Sparkles,
  Target,
  Wallet,
  Wrench,
  Workflow,
} from "lucide-react"

export type NavItem = {
  href: string
  label: string
  hint: string
  icon: LucideIcon
}

export type NavGroup = {
  title: string
  items: NavItem[]
}

export const NAV_GROUPS: NavGroup[] = [
  {
    title: "Обзор",
    items: [
      { href: "/", label: "Обзор", hint: "Цели и дедлайн YPP", icon: LayoutDashboard },
      { href: "/vault", label: "База паролей", hint: "Ключи и заметки", icon: Lock },
      { href: "/tasks", label: "Задачи", hint: "Чек-листы и ИИ-агент", icon: ListTodo },
      { href: "/agents", label: "Агенты и Боты", hint: "Каталог Cursor-агентов", icon: Sparkles },
      { href: "/prompts", label: "Промты", hint: "Prompt Studio и делегирование", icon: PenLine },
      { href: "/niches", label: "Ниши", hint: "Высокий CPM, EN-аудитория", icon: Target },
      { href: "/tools", label: "Инструменты", hint: "Каталог и MCP", icon: Wrench },
    ],
  },
  {
    title: "Управление",
    items: [
      { href: "/plan", label: "План на 6 месяцев", hint: "Бот, агенты, касса", icon: CalendarDays },
      { href: "/pipeline", label: "Конвейер", hint: "От идеи до трёх платформ", icon: Workflow },
      { href: "/mcp", label: "Cursor + MCP", hint: "Связка агента с фабрикой", icon: Network },
      { href: "/finance", label: "Финансы", hint: "Расходы и точка безубыточности", icon: Wallet },
      { href: "/monetization", label: "Правила 2026", hint: "YouTube, X, Telegram", icon: Shield },
      { href: "/marvinbot", label: "MarvinBot Studio", hint: "Дайджесты TG и статьи", icon: Bot },
      { href: "/architecture", label: "Архитектура", hint: "Mindmap агентов и ботов", icon: GitBranch },
    ],
  },
]

export const NAV = NAV_GROUPS.flatMap((group) => group.items)
