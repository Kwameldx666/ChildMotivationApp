import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Circle, Clock, AlertCircle, Star, Flame, Camera, ListChecks } from "lucide-react"
{/* cspell:disable */}
interface TasksListProps {
  userType: "parent" | "child"
}

const MOCK_TASKS = [
  {
    id: 1,
    title: "Помыть посуду",
    description: "Помыть всю посуду после обеда",
    xp: 100,
    points: 50,
    status: "pending",
    dueDate: "2025-12-16",
    difficulty: 2,
    category: "Уборка",
    urgent: true,
    confirmationType: "photo",
  },
  {
    id: 2,
    title: "Прочитать книгу (30 мин)",
    description: "Прочитать 30 минут из любимой книги",
    xp: 150,
    points: 75,
    status: "in_progress",
    dueDate: "2025-12-17",
    difficulty: 3,
    category: "Развитие",
    urgent: false,
    confirmationType: "checklist",
  },
  {
    id: 3,
    title: "Убраться в комнате",
    description: "Навести порядок и пропылесосить",
    xp: 200,
    points: 100,
    status: "pending",
    dueDate: "2025-12-18",
    difficulty: 4,
    category: "Уборка",
    urgent: false,
    confirmationType: "photo",
  },
  {
    id: 4,
    title: "Сделать домашнее задание",
    description: "Выполнить все дз по математике и истории",
    xp: 250,
    points: 150,
    status: "overdue",
    dueDate: "2025-12-14",
    difficulty: 5,
    category: "Учёба",
    urgent: true,
    confirmationType: "checklist",
  },
]

export default function TasksList({ userType }: TasksListProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />
      case "in_progress":
        return <Clock className="w-5 h-5 text-blue-500" />
      case "overdue":
        return <AlertCircle className="w-5 h-5 text-red-500" />
      default:
        return <Circle className="w-5 h-5 text-muted-foreground/40" />
    }
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
      in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
      completed: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
      overdue: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
    }
    const labels: Record<string, string> = {
      pending: "Новая",
      in_progress: "В процессе",
      completed: "Выполнено",
      overdue: "Просрочено",
    }
    return <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${styles[status]}`}>{labels[status]}</span>
  }

  const renderDifficulty = (level: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-3.5 h-3.5 ${star <= level ? "fill-amber-400 text-amber-400" : "fill-muted text-muted"}`}
          />
        ))}
      </div>
    )
  }

  const getConfirmationIcon = (type: string) => {
    switch (type) {
      case "photo":
        return <Camera className="w-3.5 h-3.5" />
      case "checklist":
        return <ListChecks className="w-3.5 h-3.5" />
      default:
        return <CheckCircle2 className="w-3.5 h-3.5" />
    }
  }

  const sortedTasks = [...MOCK_TASKS].sort((a, b) => {
    if (a.status === "overdue" && b.status !== "overdue") return -1
    if (b.status === "overdue" && a.status !== "overdue") return 1
    if (a.urgent && !b.urgent) return -1
    if (b.urgent && !a.urgent) return 1
    return 0
  })

  return (
    <div className="grid gap-4">
      {sortedTasks.map((task) => (
        <Card
          key={task.id}
          className={`group relative overflow-hidden hover:shadow-lg transition-all duration-300 border-l-4 ${
            task.status === "overdue"
              ? "border-l-red-500 bg-red-50/30 dark:bg-red-950/10"
              : task.urgent
                ? "border-l-amber-500 bg-amber-50/30 dark:bg-amber-950/10"
                : task.status === "in_progress"
                  ? "border-l-blue-500"
                  : "border-l-transparent"
          }`}
        >
          {/* Urgency indicator dot */}
          {(task.urgent || task.status === "overdue") && (
            <div className="absolute top-4 right-4">
              <span className="relative flex h-3 w-3">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    task.status === "overdue" ? "bg-red-400" : "bg-amber-400"
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-3 w-3 ${
                    task.status === "overdue" ? "bg-red-500" : "bg-amber-500"
                  }`}
                />
              </span>
            </div>
          )}

          <CardContent className="pt-5 pb-4">
            <div className="flex items-start gap-4">
              {/* Status icon */}
              <div className="mt-0.5 shrink-0">{getStatusIcon(task.status)}</div>

              {/* Main content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div>
                    <h3 className="font-semibold text-base leading-tight mb-1 group-hover:text-primary transition-colors">
                      {task.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-1">{task.description}</p>
                  </div>
                </div>

                {/* Meta info row */}
                <div className="flex flex-wrap items-center gap-3 mt-3">
                  {getStatusBadge(task.status)}

                  {/* Category badge */}
                  <span className="text-xs px-2 py-0.5 rounded-md bg-primary/10 text-primary font-medium">
                    {task.category}
                  </span>

                  {/* Difficulty */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground">Сложность:</span>
                    {renderDifficulty(task.difficulty)}
                  </div>

                  {/* Confirmation type */}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    {getConfirmationIcon(task.confirmationType)}
                    <span>{task.confirmationType === "photo" ? "Фото" : "Чек-лист"}</span>
                  </div>
                </div>

                {/* Bottom row: deadline + rewards + actions */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
                  <div className="flex items-center gap-4">
                    {/* Deadline */}
                    <div className="flex items-center gap-1.5 text-sm">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span
                        className={task.status === "overdue" ? "text-red-600 font-medium" : "text-muted-foreground"}
                      >
                        {task.dueDate}
                      </span>
                    </div>

                    {/* Rewards */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Flame className="w-4 h-4 text-orange-500" />
                        <span className="text-sm font-semibold text-orange-600">{task.xp} XP</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-lg">🪙</span>
                        <span className="text-sm font-semibold text-amber-600">{task.points}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2">
                    {userType === "child" && task.status === "pending" && (
                      <Button size="sm" className="rounded-full px-4">
                        Выполнить
                      </Button>
                    )}
                    {userType === "child" && task.status === "in_progress" && (
                      <Button size="sm" variant="outline" className="rounded-full px-4 bg-transparent">
                        На проверку
                      </Button>
                    )}
                    {userType === "parent" && task.status === "in_progress" && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="destructive" className="rounded-full px-3">
                          Отклонить
                        </Button>
                        <Button size="sm" className="rounded-full px-4">
                          Подтвердить
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
