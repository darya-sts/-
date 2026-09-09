/** Кастомный узел Mindmap. */

"use client"

import { memo } from "react"
import { Handle, Position, type NodeProps } from "@xyflow/react"
import { TYPE_COLORS, type ArchitectureNodeType } from "@/architecture/types"
import { cn } from "@/lib/utils"

export type ArchNodeData = {
  label: string
  kind: "root" | "category" | ArchitectureNodeType
  hasError?: boolean
  subtitle?: string
}

function ArchitectureNodeInner({ data, selected }: NodeProps) {
  const d = data as ArchNodeData
  const color = TYPE_COLORS[d.kind] || TYPE_COLORS.category
  return (
    <div
      className={cn(
        "min-w-[140px] max-w-[200px] rounded-xl border px-3 py-2 shadow-md backdrop-blur-sm transition",
        selected && "ring-2 ring-primary",
        d.hasError && "border-red-500 ring-1 ring-red-500",
      )}
      style={{
        background: `color-mix(in oklab, ${color} 22%, var(--card))`,
        borderColor: d.hasError ? undefined : color,
      }}
    >
      <Handle type="target" position={Position.Top} className="!bg-muted-foreground" />
      <p className="font-heading text-[12px] leading-tight tracking-wide">{d.label}</p>
      {d.subtitle ? (
        <p className="mt-0.5 text-[10px] text-muted-foreground">{d.subtitle}</p>
      ) : null}
      <Handle type="source" position={Position.Bottom} className="!bg-muted-foreground" />
    </div>
  )
}

export const ArchitectureNode = memo(ArchitectureNodeInner)
