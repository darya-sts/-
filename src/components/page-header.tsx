import { cn } from "@/lib/utils"

export function McpBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-mcp/20 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-mcp uppercase",
        className
      )}
    >
      MCP
    </span>
  )
}

export function PageHeader({
  kicker,
  title,
  description,
}: {
  kicker: string
  title: string
  description: string
}) {
  return (
    <header className="max-w-3xl">
      <p className="text-xs font-medium tracking-[0.2em] text-primary uppercase">{kicker}</p>
      <h1 className="font-heading mt-2 text-3xl tracking-tight text-balance sm:text-4xl">{title}</h1>
      <p className="mt-3 text-base leading-relaxed text-muted-foreground text-pretty">{description}</p>
    </header>
  )
}
