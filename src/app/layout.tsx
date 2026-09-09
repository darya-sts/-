import type { Metadata } from "next"
import localFont from "next/font/local"
import { IBM_Plex_Mono } from "next/font/google"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AppShell } from "@/components/app-shell"
import "./globals.css"

const ttCommons = localFont({
  src: [
    { path: "../fonts/TT_Commons_Pro_Medium.woff2", weight: "400", style: "normal" },
    { path: "../fonts/TT_Commons_Pro_Medium.woff2", weight: "500", style: "normal" },
    { path: "../fonts/TT_Commons_Pro_DemiBold.woff2", weight: "600", style: "normal" },
    { path: "../fonts/TT_Commons_Pro_Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-tt",
  display: "swap",
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
    <html lang="ru" className={`${ttCommons.variable} ${ibm.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        <TooltipProvider>
          <AppShell>{children}</AppShell>
        </TooltipProvider>
      </body>
    </html>
  )
}
