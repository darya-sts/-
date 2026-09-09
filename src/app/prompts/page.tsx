import { PromptStudio } from "@/components/prompts/prompt-studio"

export default function PromptsPage() {
  return (
    <main className="mx-auto flex max-w-[1440px] flex-col gap-4 px-4 py-6 sm:px-7 sm:py-7">
      <PromptStudio />
    </main>
  )
}
