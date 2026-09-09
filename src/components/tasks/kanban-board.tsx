"use client"

import {
  DndContext,
  PointerSensor,
  closestCorners,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { TaskCard } from "@/components/tasks/task-card"
import { botLabel } from "@/lib/tasks/bots"
import { categoryName } from "@/lib/tasks/catalog"
import { TASK_STATUSES, type Task, type TaskCategory, type TaskStatus } from "@/lib/tasks/types"

export function KanbanBoard({
  tasks,
  categories,
  selectedTaskId,
  onSelectTask,
  onMoveTask,
}: {
  tasks: Task[]
  categories: TaskCategory[]
  selectedTaskId?: string
  onSelectTask: (task: Task) => void
  onMoveTask: (taskId: string, status: TaskStatus) => void
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  function handleDragEnd(event: DragEndEvent) {
    const taskId = String(event.active.id)
    const overId = event.over?.id ? String(event.over.id) : ""
    const fromColumn = overId.startsWith("col-") ? (overId.slice(4) as TaskStatus) : undefined
    const fromCard = tasks.find((task) => task.id === overId)?.status
    const status = fromColumn ?? fromCard
    if (!status || !TASK_STATUSES.some((item) => item.id === status)) return
    if (tasks.find((task) => task.id === taskId)?.status === status) return
    onMoveTask(taskId, status)
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-2" data-testid="kanban-board">
        {TASK_STATUSES.map((column) => (
          <KanbanColumn
            key={column.id}
            status={column.id}
            label={column.label}
            tasks={tasks.filter((task) => task.status === column.id)}
            categories={categories}
            selectedTaskId={selectedTaskId}
            onSelectTask={onSelectTask}
          />
        ))}
      </div>
    </DndContext>
  )
}

function KanbanColumn({
  status,
  label,
  tasks,
  categories,
  selectedTaskId,
  onSelectTask,
}: {
  status: TaskStatus
  label: string
  tasks: Task[]
  categories: TaskCategory[]
  selectedTaskId?: string
  onSelectTask: (task: Task) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `col-${status}` })
  return (
    <section
      ref={setNodeRef}
      className={`flex w-56 shrink-0 flex-col gap-2 rounded-2xl p-2 ${isOver ? "bg-white" : "bg-white/55"}`}
    >
      <header className="flex items-center justify-between px-1 pt-1">
        <h3 className="text-xs font-bold tracking-wide uppercase">{label}</h3>
        <span className="text-[11px] text-muted-foreground tabular-nums">{tasks.length}</span>
      </header>
      <div className="flex min-h-24 flex-col gap-1.5">
        {tasks.map((task) => (
          <KanbanCard
            key={task.id}
            task={task}
            categoryLabel={categoryName(categories, task.categoryId)}
            selected={task.id === selectedTaskId}
            onSelect={onSelectTask}
          />
        ))}
      </div>
    </section>
  )
}

function KanbanCard({
  task,
  categoryLabel,
  selected,
  onSelect,
}: {
  task: Task
  categoryLabel: string
  selected: boolean
  onSelect: (task: Task) => void
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={isDragging ? "z-20 opacity-80" : undefined}
      {...listeners}
      {...attributes}
    >
      <TaskCard
        task={task}
        selected={selected}
        onSelect={onSelect}
        categoryLabel={categoryLabel}
        botName={botLabel(task.executorBotId)}
      />
    </div>
  )
}
