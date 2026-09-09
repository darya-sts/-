import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Задачи",
  description: "Чек-листы, статусы и ИИ-агент для операционки Forge Mill.",
}

export default function TasksLayout({ children }: { children: React.ReactNode }) {
  return children
}
