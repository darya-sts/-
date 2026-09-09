import type { EncryptedVault, VaultItem } from "./types"

export const PBKDF2_ITERATIONS = 210_000

const SALT_LEN = 16
const IV_LEN = 12
const KEY_BITS = 256
const PASSWORD_ALPHABET =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*-_=+"

function bytesToB64(bytes: Uint8Array): string {
  let binary = ""
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

function b64ToBytes(value: string): Uint8Array {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

function asBuffer(bytes: Uint8Array): BufferSource {
  return bytes as unknown as BufferSource
}

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  )
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: asBuffer(salt),
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    material,
    { name: "AES-GCM", length: KEY_BITS },
    false,
    ["encrypt", "decrypt"]
  )
}

export async function encryptItems(
  items: VaultItem[],
  password: string
): Promise<EncryptedVault> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LEN))
  const iv = crypto.getRandomValues(new Uint8Array(IV_LEN))
  const key = await deriveKey(password, salt)
  const plaintext = new TextEncoder().encode(JSON.stringify(items))
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: asBuffer(iv) },
    key,
    plaintext
  )
  return {
    version: 1,
    kdf: "PBKDF2",
    hash: "SHA-256",
    algo: "AES-GCM",
    iterations: PBKDF2_ITERATIONS,
    salt: bytesToB64(salt),
    iv: bytesToB64(iv),
    ciphertext: bytesToB64(new Uint8Array(ciphertext)),
  }
}

export async function decryptItems(
  blob: EncryptedVault,
  password: string
): Promise<VaultItem[]> {
  const salt = b64ToBytes(blob.salt)
  const iv = b64ToBytes(blob.iv)
  const key = await deriveKey(password, salt)
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: asBuffer(iv) },
    key,
    asBuffer(b64ToBytes(blob.ciphertext))
  )
  const parsed: unknown = JSON.parse(new TextDecoder().decode(plaintext))
  if (!Array.isArray(parsed)) throw new Error("Некорректное содержимое сейфа")
  return parsed as VaultItem[]
}

export function generatePassword(length = 18): string {
  const size = Math.min(20, Math.max(16, length))
  const bytes = crypto.getRandomValues(new Uint8Array(size))
  return Array.from(bytes, (byte) => PASSWORD_ALPHABET[byte % PASSWORD_ALPHABET.length]).join("")
}
