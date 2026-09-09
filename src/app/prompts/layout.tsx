import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Промты",
  description: "Prompt Studio: составление промтов и делегирование заданий в Cursor.",
}

export default function PromptsLayout({ children }: { children: React.ReactNode }) {
  return children
}
