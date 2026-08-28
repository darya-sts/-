import type { Metadata } from "next"
import { Manrope, Unbounded, IBM_Plex_Mono } from "next/font/google"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AppShell } from "@/components/app-shell"
import "./globals.css"

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "cyrillic"],
})

const unbounded = Unbounded({
  variable: "--font-unbounded",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600"],
})

const ibm = IBM_Plex_Mono({
  variable: "--font-ibm",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500"],
})

export const metadata: Metadata = {
  title: {
    default: "Forge Mill — контент-фабрика YouTube, X, Telegram",
    template: "%s · Forge Mill",
  },
  description:
    "Операционная система соло-фабрики: инструменты с MCP, ниши с высоким CPM, план на 6 месяцев и финансовая модель к $1–2k чистыми.",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ru"
      className={`dark ${manrope.variable} ${unbounded.variable} ${ibm.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <TooltipProvider>
          <AppShell>{children}</AppShell>
        </TooltipProvider>
      </body>
    </html>
  )
}
