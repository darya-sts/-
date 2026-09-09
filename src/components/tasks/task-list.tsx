import { TaskCard } from "@/components/tasks/task-card"
import type { Task, TaskSortBy, TaskStatus } from "@/lib/tasks/types"

export interface TaskListProps {
  tasks: Task[]
  selectedTaskId?: string
  onSelectTask: (task: Task) => void
  filterStatus?: TaskStatus | "all"
  searchQuery: string
  sortBy: "created" | "priority" | "status" | TaskSortBy
}

export function TaskList({
  tasks,
  selectedTaskId,
  onSelectTask,
  searchQuery,
  filterStatus = "all",
}: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <p className="px-1 py-8 text-sm text-muted-foreground">
        {searchQuery
          ? `Нет задач по запросу «${searchQuery}».`
          : filterStatus !== "all"
            ? "Нет задач в этом статусе."
            : "Список пуст. Создайте первую задачу."}
      </p>
    )
  }

  return (
    <ul className="flex flex-col gap-1.5">
      {tasks.map((task) => (
        <li key={task.id} className="chat-message-enter">
          <TaskCard task={task} selected={task.id === selectedTaskId} onSelect={onSelectTask} />
        </li>
      ))}
    </ul>
  )
}
