export type VaultItemKind = "password" | "key" | "note"

export type VaultItem = {
  id: string
  kind: VaultItemKind
  title: string
  username?: string
  secret?: string
  url?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export type EncryptedVault = {
  version: 1
  kdf: "PBKDF2"
  hash: "SHA-256"
  algo: "AES-GCM"
  iterations: number
  salt: string
  iv: string
  ciphertext: string
}

export const VAULT_STORAGE_KEY = "forge-mill.vault.v1"
export const VAULT_SESSION_KEY = "forge-mill.vault.session"

export const KIND_LABEL: Record<VaultItemKind, string> = {
  password: "Пароль",
  key: "Ключ",
  note: "Заметка",
}
