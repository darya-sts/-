"use client"

import { Button } from "@/components/ui/button"

export function MismatchBanner({
  selectedLabels,
  detectedLabels,
  onKeep,
  onSwitch,
  onMix,
}: {
  selectedLabels: string[]
  detectedLabels: string[]
  onKeep: () => void
  onSwitch: () => void
  onMix: () => void
}) {
  return (
    <div className="grid gap-3 rounded-2xl border border-primary/30 bg-white/80 p-4" data-testid="direction-mismatch" role="status">
      <div>
        <p className="text-sm font-semibold">Текст запроса не совпадает с выбранными направлениями</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Теги: {selectedLabels.join(", ") || "—"}. По тексту: {detectedLabels.join(", ") || "не распознано"}.
          Автоматически ничего не меняем — выберите, как собрать карту.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="outline" data-testid="mismatch-keep" onClick={onKeep}>
          Оставить теги
        </Button>
        <Button type="button" size="sm" variant="secondary" data-testid="mismatch-switch" onClick={onSwitch}>
          Сменить на распознанные
        </Button>
        <Button type="button" size="sm" data-testid="mismatch-mix" onClick={onMix}>
          Смешать
        </Button>
      </div>
    </div>
  )
}
