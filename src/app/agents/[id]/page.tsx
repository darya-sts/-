import { AGENT_IDS } from "@/data/agents"
import { AgentDetail } from "@/components/agents/agent-detail"

export function generateStaticParams() {
  return AGENT_IDS.map((id) => ({ id }))
}

export default async function AgentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <main className="mx-auto flex max-w-[1440px] flex-col gap-4 px-4 py-6 sm:px-7 sm:py-7">
      <AgentDetail agentId={id} />
    </main>
  )
}
