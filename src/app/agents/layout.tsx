import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Агенты и Боты",
  description: "Панель управления агентами Cursor, скилами и правилами Forge Mill.",
}

export default function AgentsLayout({ children }: { children: React.ReactNode }) {
  return children
}
