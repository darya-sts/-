"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, Factory } from "lucide-react"
import { NAV } from "@/data/nav"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span className="flex size-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
        <Factory className="size-4" />
      </span>
      <span className="leading-tight">
        <span className="font-heading block text-[13px] tracking-wide">FORGE MILL</span>
        <span className="block text-[10px] tracking-[0.18em] text-sidebar-foreground/55 uppercase">
          Content factory
        </span>
      </span>
    </Link>
  )
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  return (
    <nav className="flex flex-col gap-0.5">
      {NAV.map((item) => {
        const active = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "rounded-lg px-3 py-2.5 transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground"
            )}
          >
            <span className="block text-sm font-medium">{item.label}</span>
            <span className="block text-[11px] text-sidebar-foreground/45">{item.hint}</span>
          </Link>
        )
      })}
    </nav>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full">
      <aside className="mill-rail sticky top-0 hidden h-svh w-64 shrink-0 flex-col border-r border-sidebar-border px-4 py-5 lg:flex">
        <Logo />
        <div className="mt-8 flex-1 overflow-y-auto">
          <NavLinks />
        </div>
        <p className="px-1 text-[11px] leading-relaxed text-sidebar-foreground/45">
          Цель: $1 000–2 000 чистыми к месяцу 6. YPP успеть до 1 февраля 2027.
        </p>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-background/85 px-4 py-3 backdrop-blur-md lg:hidden">
          <Logo />
          <Sheet>
            <SheetTrigger render={<Button variant="outline" size="icon-sm" />}>
              <Menu />
              <span className="sr-only">Меню</span>
            </SheetTrigger>
            <SheetContent side="left" className="mill-rail w-72 border-sidebar-border p-0 text-sidebar-foreground">
              <SheetHeader>
                <SheetTitle className="text-sidebar-foreground">Навигация</SheetTitle>
              </SheetHeader>
              <div className="px-3 pb-6">
                <NavLinks />
              </div>
            </SheetContent>
          </Sheet>
        </header>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  )
}
