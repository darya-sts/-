/** Построение дерева/графа для Mindmap. */

import type { ArchitectureEdge, ArchitectureGraph, ArchitectureNodeType, ArchitectureObject } from "../types"
import { TYPE_LABELS } from "../types"

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/gi, "-")
    .replace(/^-|-$/g, "")
}

/** Строит рёбра категорий + зависимости между объектами. */
export function buildArchitectureGraph(
  objects: ArchitectureObject[],
  errors: string[] = [],
): ArchitectureGraph {
  const byName = new Map<string, ArchitectureObject>()
  for (const obj of objects) {
    byName.set(obj.name.toLowerCase(), obj)
    byName.set(obj.id.toLowerCase(), obj)
  }

  const edges: ArchitectureEdge[] = []
  const typesPresent = new Set<ArchitectureNodeType>()

  for (const obj of objects) {
    typesPresent.add(obj.type)
    edges.push({
      id: `cat-${obj.type}-${obj.id}`,
      source: `cat-${obj.type}`,
      target: obj.id,
      label: "contains",
    })

    for (const dep of obj.dependencies) {
      const target = byName.get(dep.toLowerCase()) || byName.get(slugify(dep))
      if (target && target.id !== obj.id) {
        edges.push({
          id: `dep-${obj.id}-${target.id}`,
          source: obj.id,
          target: target.id,
          label: "depends on",
        })
      } else {
        // Висячая зависимость — оставляем как текстовую связь на карточке
      }
    }
  }

  for (const type of typesPresent) {
    edges.push({
      id: `root-${type}`,
      source: "root",
      target: `cat-${type}`,
      label: "group",
    })
  }

  return {
    objects,
    edges,
    scannedAt: new Date().toISOString(),
    errors,
  }
}

export function categoryLabel(type: ArchitectureNodeType): string {
  return TYPE_LABELS[type] || type
}
