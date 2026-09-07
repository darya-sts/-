export type ToolCategory =
  | "generate"
  | "rewrite"
  | "posting"
  | "analytics"
  | "monetize"

export type GenerateKind = "text" | "video" | "audio" | "image"

export type ProductionStage =
  | "research"
  | "script"
  | "voice"
  | "edit"
  | "thumbnail"
  | "publish"
  | "repurpose"
  | "measure"
  | "sell"

export type Tool = {
  id: string
  name: string
  category: ToolCategory
  kind?: GenerateKind
  price: string
  monthlyUsd: number
  functions: string[]
  stage: ProductionStage
  mcp: boolean
  mcpNote?: string
  recommended: boolean
  stack: "lean" | "growth" | "scale" | "optional"
  why: string
  url: string
}

export type Niche = {
  id: string
  name: string
  tagline: string
  recommended: boolean
  cpm: [number, number]
  rpm: [number, number]
  difficulty: "средняя" | "высокая" | "очень высокая"
  faceless: boolean
  whyHighCpm: string
  topics: string[]
  affiliates: { name: string; typical: string }[]
  verify: string[]
  risks: string[]
  fit: string
  firstVideos: string[]
}
