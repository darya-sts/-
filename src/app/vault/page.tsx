import type { Metadata } from "next"
import { VaultPage } from "@/components/vault/vault-page"

export const metadata: Metadata = {
  title: "Vault",
  description: "Локальный сейф паролей, ключей и заметок с шифрованием в браузере.",
}

export default function Page() {
  return <VaultPage />
}
