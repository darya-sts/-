"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu } from "lucide-react"
import { NAV, NAV_GROUPS } from "@/data/nav"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { CommandSearch } from "@/components/command-search"
import { NavHotkeys } from "@/components/nav-hotkeys"
import { ShellUser } from "@/components/shell-user"

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 px-1">
      <span className="flex size-8 items-center justify-center rounded-[10px] bg-sidebar-primary text-[11px] font-bold text-sidebar-primary-foreground">
        FM
      </span>
      <span className="leading-tight">
        <span className="block text-[13px] font-bold tracking-wide">FORGE MILL</span>
        <span className="block text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
          Content factory
        </span>
      </span>
    </Link>
  )
}

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/" || pathname === ""
  return pathname === href || pathname.startsWith(`${href}/`)
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  return (
    <div className="flex flex-col">
      {NAV_GROUPS.map((group) => (
        <div key={group.title} className="mt-2">
          <p className="px-3 pt-3 pb-1 text-[10px] font-bold tracking-[0.12em] text-[#337591] uppercase">
            {group.title}
          </p>
          <nav className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const Icon = item.icon
              const active = isActive(pathname, item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex min-h-10 items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                    active ? "nav-active" : "text-sidebar-foreground/80 hover:bg-white/70"
                  )}
                >
                  <Icon className="size-[18px] shrink-0" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>
      ))}
    </div>
  )
}

function crumbs(pathname: string) {
  if (pathname.includes("/agents/settings")) return { page: "Настройки агентов" }
  if (/\/agents\/[^/]+/.test(pathname) && !pathname.endsWith("/agents/") && pathname !== "/agents") {
    return { page: "Карточка агента" }
  }
  const match = NAV.find((item) => isActive(pathname, item.href) && item.href !== "/")
  if (!match || pathname === "/" || pathname === "") return { page: "Обзор" }
  return { page: match.label }
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { page } = crumbs(pathname)

  return (
    <div className="flex min-h-full">
      <NavHotkeys />
      <aside className="mill-rail sticky top-0 hidden h-svh w-[268px] shrink-0 flex-col border-r border-sidebar-border px-3 py-4 md:flex">
        <Logo />
        <div className="mt-4 px-1">
          <CommandSearch />
        </div>
        <div className="mt-2 min-h-0 flex-1 overflow-y-auto">
          <NavLinks />
        </div>
        <div className="mt-auto pt-3">
          <ShellUser />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col bg-background">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-[#eef2f5] bg-white px-4 py-3 md:px-7">
          <div className="min-w-0">
            <p className="truncate text-[13px] text-muted-foreground">
              Forge Mill / <strong className="text-foreground">{page}</strong>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:block">
              <CommandSearch className="w-[220px]" />
            </div>
            <ShellUser compact />
            <Sheet>
              <SheetTrigger render={<Button variant="outline" size="icon-sm" className="md:hidden" />}>
                <Menu />
                <span className="sr-only">Меню</span>
              </SheetTrigger>
              <SheetContent side="left" className="mill-rail w-72 border-sidebar-border p-0 text-sidebar-foreground">
                <SheetHeader>
                  <SheetTitle className="text-sidebar-foreground">Навигация</SheetTitle>
                </SheetHeader>
                <div className="px-3 pb-6">
                  <CommandSearch />
                  <NavLinks />
                  <div className="mt-4">
                    <ShellUser />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </header>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  )
}
