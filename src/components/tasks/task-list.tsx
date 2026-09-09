import { TaskCard } from "@/components/tasks/task-card"
import { botLabel } from "@/lib/tasks/bots"
import { categoryName } from "@/lib/tasks/catalog"
import type { Task, TaskCategory, TaskSortBy, TaskStatus } from "@/lib/tasks/types"

export interface TaskListProps {
  tasks: Task[]
  categories: TaskCategory[]
  selectedTaskId?: string
  onSelectTask: (task: Task) => void
  filterStatus?: TaskStatus | "all"
  searchQuery: string
  sortBy: "created" | "priority" | "status" | TaskSortBy
}

export function TaskList({
  tasks,
  categories,
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
          <TaskCard
            task={task}
            selected={task.id === selectedTaskId}
            onSelect={onSelectTask}
            categoryLabel={categoryName(categories, task.categoryId)}
            botName={botLabel(task.executorBotId)}
          />
        </li>
      ))}
    </ul>
  )
}
