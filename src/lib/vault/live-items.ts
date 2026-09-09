import type { VaultItem } from "@/lib/vault/types"

let liveItems: VaultItem[] | null = null

export function setLiveVaultItems(items: VaultItem[] | null) {
  liveItems = items
}

export function getLiveVaultItems(): VaultItem[] | null {
  return liveItems
}

export function findVaultApiKey(name: string | undefined): string | null {
  if (!name) return null
  const items = getLiveVaultItems()
  if (!items) return null
  const needle = name.trim().toLowerCase()
  const item = items.find(
    (entry) =>
      entry.kind === "key" &&
      (entry.title.toLowerCase() === needle ||
        entry.title.toLowerCase().includes(needle) ||
        entry.username?.toLowerCase() === needle)
  )
  return item?.secret?.trim() || null
}
