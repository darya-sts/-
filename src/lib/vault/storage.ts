import { VAULT_SESSION_KEY, VAULT_STORAGE_KEY, type EncryptedVault } from "./types"

export function isEncryptedVault(value: unknown): value is EncryptedVault {
  if (!value || typeof value !== "object") return false
  const blob = value as EncryptedVault
  return (
    blob.version === 1 &&
    blob.kdf === "PBKDF2" &&
    blob.hash === "SHA-256" &&
    blob.algo === "AES-GCM" &&
    typeof blob.iterations === "number" &&
    typeof blob.salt === "string" &&
    typeof blob.iv === "string" &&
    typeof blob.ciphertext === "string"
  )
}

export function loadVaultBlob(): EncryptedVault | null {
  if (typeof window === "undefined") return null
  const raw = window.localStorage.getItem(VAULT_STORAGE_KEY)
  if (!raw) return null
  try {
    const parsed: unknown = JSON.parse(raw)
    return isEncryptedVault(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function saveVaultBlob(blob: EncryptedVault): void {
  window.localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(blob))
}

export function hasVault(): boolean {
  return loadVaultBlob() !== null
}

export function markSessionUnlocked(): void {
  window.sessionStorage.setItem(VAULT_SESSION_KEY, "unlocked")
}

export function clearVaultSession(): void {
  window.sessionStorage.removeItem(VAULT_SESSION_KEY)
}

export function parseImportedVault(json: string): EncryptedVault {
  const parsed: unknown = JSON.parse(json)
  if (!isEncryptedVault(parsed)) throw new Error("Файл не похож на базу паролей Forge Mill")
  return parsed
}
