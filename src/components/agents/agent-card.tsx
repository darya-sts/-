import { Brain, Wrench } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { STATUS_LABEL, type AgentRecord } from "@/lib/agents/types"
import { cn } from "@/lib/utils"

const STATUS_CLASS: Record<AgentRecord["status"], string> = {
  active: "bg-[#e2f3e3] text-mcp",
  inactive: "bg-[#e8eef2] text-[#5a6570]",
  development: "bg-[#fff4d4] text-[#8a6d00]",
}

export function AgentCard({
  agent,
  selected,
  onSelect,
}: {
  agent: AgentRecord
  selected?: boolean
  onSelect: (id: string) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(agent.id)}
      data-testid="agent-card"
      className={cn(
        "flex h-full flex-col gap-3 rounded-2xl border bg-card p-4 text-left shadow-[0_4px_20px_rgba(11,102,195,0.08)] transition-all",
        selected ? "border-primary shadow-[inset_3px_0_0_var(--primary)]" : "border-transparent hover:border-border"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-base font-bold">{agent.name}</p>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{agent.summary}</p>
        </div>
        <span
          title={agent.memoryConnected ? "Память подключена" : "Память не подключена"}
          className={cn(
            "grid size-8 place-items-center rounded-lg",
            agent.memoryConnected ? "bg-[#e2f3e3] text-mcp" : "bg-[#e8eef2] text-muted-foreground"
          )}
        >
          <Brain className="size-4" />
        </span>
      </div>
      <div className="mt-auto flex flex-wrap items-center gap-1.5">
        <span className={cn("inline-flex h-5 items-center rounded-full px-2 text-[11px] font-semibold", STATUS_CLASS[agent.status])}>
          {STATUS_LABEL[agent.status]}
        </span>
        <Badge variant="outline">
          <Wrench className="size-3" />
          {agent.skills.length} скил.
        </Badge>
        <Badge variant="secondary">{agent.rules.length} прав.</Badge>
      </div>
      <p className="text-[11px] text-muted-foreground">обновлён {agent.updatedAt}</p>
    </button>
  )
}
