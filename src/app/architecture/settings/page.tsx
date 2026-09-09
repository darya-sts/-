import { PageHeader } from "@/components/page-header"
import { ArchitectureSettingsForm } from "@/components/architecture/architecture-settings-form"

export const metadata = { title: "Архитектура — настройки" }

export default function ArchitectureSettingsPage() {
  return (
    <main className="pb-12">
      <div className="mx-auto max-w-3xl px-4 pt-8 sm:px-8">
        <PageHeader
          kicker="Architecture"
          title="Настройки сканера"
          description="Пути обхода, GitHub-организация и health-check endpoints для карты экосистемы ForgeMill."
        />
      </div>
      <ArchitectureSettingsForm />
    </main>
  )
}
