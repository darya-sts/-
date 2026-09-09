/** Интерактивная Mindmap на React Flow. */

"use client"

import { useEffect, useMemo } from "react"
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  MarkerType,
  useEdgesState,
  useNodesState,
  type Edge,
  type Node,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"

import { useArchitectureStore } from "@/architecture/store"
import { TYPE_COLORS, TYPE_LABELS, type ArchitectureNodeType } from "@/architecture/types"
import { ArchitectureNode, type ArchNodeData } from "./architecture-node"
import { ArchitectureToolbar } from "./architecture-toolbar"
import { ArchitectureDetailDrawer } from "./architecture-detail-drawer"

const nodeTypes = { architecture: ArchitectureNode }

function layoutGraph(
  objectCount: number,
  categories: ArchitectureNodeType[],
  objects: {
    id: string
    type: ArchitectureNodeType
    name: string
    error?: string
    github?: string
    dependencies?: string[]
  }[],
  search: string,
  showGithub: boolean,
): { nodes: Node[]; edges: Edge[] } {
  const q = search.trim().toLowerCase()
  const filtered = objects.filter((o) => {
    if (q && !o.name.toLowerCase().includes(q) && !o.id.includes(q)) return false
    if (!showGithub && o.github?.includes("github.com") && o.id.startsWith("github")) return false
    return true
  })

  const nodes: Node[] = []
  const edges: Edge[] = []

  nodes.push({
    id: "root",
    type: "architecture",
    position: { x: 420, y: 0 },
    data: { label: "ForgeMill Ecosystem", kind: "root", subtitle: "корень" } satisfies ArchNodeData,
  })

  const cats = categories.filter((c) => filtered.some((o) => o.type === c))
  cats.forEach((type, i) => {
    const x = 80 + i * 220
    nodes.push({
      id: `cat-${type}`,
      type: "architecture",
      position: { x, y: 120 },
      data: {
        label: TYPE_LABELS[type],
        kind: "category",
        subtitle: type,
      } satisfies ArchNodeData,
    })
    edges.push({
      id: `e-root-${type}`,
      source: "root",
      target: `cat-${type}`,
      label: "group",
      style: { stroke: TYPE_COLORS.category },
      markerEnd: { type: MarkerType.ArrowClosed, color: TYPE_COLORS.category },
    })
  })

  const byType = new Map<ArchitectureNodeType, typeof filtered>()
  for (const o of filtered) {
    const list = byType.get(o.type) || []
    list.push(o)
    byType.set(o.type, list)
  }

  cats.forEach((type, ci) => {
    const list = byType.get(type) || []
    list.forEach((o, oi) => {
      const x = 40 + ci * 220 + (oi % 2) * 20
      const y = 260 + Math.floor(oi / 1) * 90
      nodes.push({
        id: o.id,
        type: "architecture",
        position: { x, y },
        data: {
          label: o.name,
          kind: o.type,
          hasError: Boolean(o.error),
          subtitle: o.type,
        } satisfies ArchNodeData,
      })
      edges.push({
        id: `e-cat-${o.id}`,
        source: `cat-${type}`,
        target: o.id,
        label: "contains",
        style: { stroke: TYPE_COLORS[type] },
        markerEnd: { type: MarkerType.ArrowClosed, color: TYPE_COLORS[type] },
      })
    })
  })

  // Зависимости третьего уровня
  for (const o of filtered) {
    for (const depName of o.dependencies || []) {
      const target = filtered.find(
        (x) => x.name.toLowerCase() === depName.toLowerCase() || x.id === depName,
      )
      if (!target || target.id === o.id) continue
      edges.push({
        id: `e-dep-${o.id}-${target.id}`,
        source: o.id,
        target: target.id,
        label: "depends on",
        animated: true,
        style: { stroke: "#94a3b8" },
        labelStyle: { fill: "#94a3b8", fontSize: 10 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#94a3b8" },
      })
    }
  }

  void objectCount
  return { nodes, edges }
}

export function ArchitectureMindmap() {
  const graph = useArchitectureStore((s) => s.graph)
  const scan = useArchitectureStore((s) => s.scan)
  const search = useArchitectureStore((s) => s.search)
  const showGithub = useArchitectureStore((s) => s.showGithub)
  const select = useArchitectureStore((s) => s.select)
  const selectedId = useArchitectureStore((s) => s.selectedId)

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

  useEffect(() => {
    if (!graph) void scan()
  }, [graph, scan])

  const built = useMemo(() => {
    if (!graph) return { nodes: [] as Node[], edges: [] as Edge[] }
    const categories = Array.from(
      new Set(graph.objects.map((o) => o.type)),
    ) as ArchitectureNodeType[]
    return layoutGraph(
      graph.objects.length,
      categories,
      graph.objects.map((o) => ({
        id: o.id,
        type: o.type,
        name: o.name,
        error: o.error,
        github: o.github,
        dependencies: o.dependencies,
      })),
      search,
      showGithub,
    )
  }, [graph, search, showGithub])

  useEffect(() => {
    setNodes(built.nodes)
    setEdges(built.edges)
  }, [built, setNodes, setEdges])

  return (
    <div className="flex h-[calc(100svh-0px)] flex-col lg:h-[calc(100svh)]">
      <ArchitectureToolbar />
      <div className="relative flex min-h-0 flex-1">
        <div className="min-w-0 flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            minZoom={0.3}
            maxZoom={1.6}
            onNodeClick={(_, node) => {
              if (node.id === "root" || node.id.startsWith("cat-")) {
                select(null)
                return
              }
              select(node.id)
            }}
            proOptions={{ hideAttribution: true }}
            className="bg-background"
          >
            <Background gap={18} size={1} color="var(--border)" />
            <Controls className="!bg-card !border !shadow-md" />
            <MiniMap
              className="!bg-card !border"
              nodeColor={(n) => {
                const kind = (n.data as ArchNodeData | undefined)?.kind
                return (kind && TYPE_COLORS[kind]) || "#666"
              }}
            />
          </ReactFlow>
        </div>
        {selectedId ? (
          <div className="absolute inset-y-0 right-0 z-20 w-full max-w-md sm:static sm:w-[380px] sm:max-w-none">
            <ArchitectureDetailDrawer />
          </div>
        ) : null}
      </div>
    </div>
  )
}
