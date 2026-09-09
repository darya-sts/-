"use client"

export function ShellUser({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-white px-2.5 py-2">
      <span className="grid size-7 place-items-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
        NS
      </span>
      {compact ? null : (
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium">neurosolutions</span>
          <span className="block text-[11px] text-muted-foreground">admin</span>
        </span>
      )}
    </div>
  )
}
