"use client"

import { useCallback, useMemo, useState } from "react"
import type { KeyboardEvent } from "react"
import { useRouter } from "next/navigation"
import type { LucideIcon } from "lucide-react"
import {
	AlertCircle,
	CheckCircle2,
	ChevronDown,
	Circle,
	Clock,
	Eye,
	Pencil,
	Plus,
	Sparkles,
	Star,
	Upload,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import {
	useTasks,
	useCompleteTask,
	useUpdateTask,
	useSubmitTaskEvidence,
	useDownloadTaskEvidence,
} from "@/services/tasks-queries"
import type { TaskDto, TaskEvidenceRequirement } from "@/services/tasks-service"
import { AppRouteId, routeRecord } from "@/routes/config"
import TaskSubmissionModal from "./task-submission-modal"
import TaskEditModal, { type EditableTask } from "./task-edit-modal"
import { useToast } from "@/hooks/use-toast"
import { computeTaskDifficulty, computeTaskXp, computeTaskPoints } from "@/lib/task-metrics"

interface TasksListProps {
	userType: "parent" | "child"
}

type TaskStatus = "pending" | "in_progress" | "completed" | "overdue"

type DecoratedTask = TaskDto & {
	status: TaskStatus
	difficulty: number
	xpReward: number
	pointsReward: number
	accent: (typeof CARD_ACCENTS)[number]
	createdLabel: string
	dueLabel: string
	progressValue: number
}

const CARD_ACCENTS = [
	{
		gradient: "from-rose-50 via-white to-orange-50",
		ring: "ring-rose-200/70",
		highlight: "text-rose-700",
	},
	{
		gradient: "from-emerald-50 via-white to-teal-50",
		ring: "ring-emerald-200/70",
		highlight: "text-emerald-700",
	},
	{
		gradient: "from-amber-50 via-white to-fuchsia-50",
		ring: "ring-amber-200/70",
		highlight: "text-amber-700",
	},
] as const

const EVIDENCE_META: Record<TaskEvidenceRequirement, { label: string; hint: string }> = {
	none: { label: "Без подтверждения", hint: "Можно завершить сразу" },
	photo: { label: "Фото", hint: "Подойдёт любой снимок результата" },
	video: { label: "Видео", hint: "Короткий ролик или сторис" },
	document: { label: "Документ", hint: "PDF или скан отчёта" },
}

const STATUS_META: Record<TaskStatus, { label: string; badge: string; icon: LucideIcon; journeyIndex: number }> = {
	pending: {
		label: "Новая",
		badge: "bg-slate-900/5 text-slate-700 ring-1 ring-slate-200",
		icon: Circle,
		journeyIndex: 0,
	},
	in_progress: {
		label: "В работе",
		badge: "bg-blue-500/10 text-blue-700 ring-1 ring-blue-200",
		icon: Clock,
		journeyIndex: 1,
	},
	completed: {
		label: "Готово",
		badge: "bg-emerald-500/15 text-emerald-700 ring-1 ring-emerald-200",
		icon: CheckCircle2,
		journeyIndex: 3,
	},
	overdue: {
		label: "Просрочено",
		badge: "bg-red-500/10 text-red-700 ring-1 ring-red-200",
		icon: AlertCircle,
		journeyIndex: 2,
	},
}

const JOURNEY_STEPS = ["Назначена", "В работе", "Проверка", "Готово"] as const

const FILTERS: { id: TaskStatus | "all"; label: string; hint: string }[] = [
	{ id: "all", label: "Все задачи", hint: "Полный список" },
	{ id: "pending", label: "Новые", hint: "Только что добавлены" },
	{ id: "in_progress", label: "В работе", hint: "Ребёнок занимается" },
	{ id: "completed", label: "Готово", hint: "Подтверждённые" },
	{ id: "overdue", label: "Просрочено", hint: "Нуждаются во внимании" },
]

const HERO_STATS = [
	{ id: "active", label: "Активные", hint: "Назначены или в процессе", compute: (summary: Record<TaskStatus, number>) => summary.pending + summary.in_progress },
	{ id: "done", label: "Готово", hint: "Подтверждены родителем", compute: (summary: Record<TaskStatus, number>) => summary.completed },
	{ id: "focus", label: "Фокус", hint: "Ждут реакции", compute: (summary: Record<TaskStatus, number>) => summary.overdue },
] as const

const renderDifficulty = (level: number) => (
	<div className="flex items-center gap-1">
		{[1, 2, 3, 4, 5].map((star) => (
			<Star
				key={`star-${star}`}
				className={cn("h-4 w-4", star <= level ? "text-amber-400 fill-amber-300" : "text-muted-foreground/20")}
			/>
		))}
	</div>
)

function mapStatus(task: TaskDto): TaskStatus {
	if (task.completed) return "completed"
	if (!task.createdAt) return "pending"
	const created = new Date(task.createdAt)
	if (Number.isNaN(created.getTime())) return "pending"
	const days = (Date.now() - created.getTime()) / 86_400_000
	if (days > 10) return "overdue"
	if (days > 2) return "in_progress"
	return "pending"
}

function formatDate(value?: string | Date): string {
	if (!value) return "—"
	const date = typeof value === "string" ? new Date(value) : value
	if (Number.isNaN(date.getTime())) return "—"
	return new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "short" }).format(date)
}

function addDays(value?: string, days = 0) {
	if (!value) return undefined
	const date = new Date(value)
	if (Number.isNaN(date.getTime())) return undefined
	date.setDate(date.getDate() + days)
	return date
}

function coalesce<T>(value: T | null | undefined, fallback: T): T {
	return value === null || value === undefined ? fallback : value
}

function resolveEvidenceRequirement(value?: string | null): TaskEvidenceRequirement {
	const normalized = typeof value === "string" ? value.toLowerCase() : "none"
	return normalized in EVIDENCE_META ? (normalized as TaskEvidenceRequirement) : "none"
}

export default function TasksList({ userType }: TasksListProps) {
	const router = useRouter()
	const { data, isLoading, isError, error } = useTasks()
	const completeTask = useCompleteTask()
	const updateTask = useUpdateTask()
	const submitEvidence = useSubmitTaskEvidence()
	const downloadEvidence = useDownloadTaskEvidence()
	const { toast } = useToast()
	const [pendingEvidenceTask, setPendingEvidenceTask] = useState<DecoratedTask | null>(null)
	const [isEditModalOpen, setIsEditModalOpen] = useState(false)
	const [editableTask, setEditableTask] = useState<EditableTask | null>(null)

	const openTaskCreation = () => {
		if (typeof window !== "undefined") {
			window.dispatchEvent(new Event("open-task-create"))
			return
		}
		router.push(routeRecord[AppRouteId.TaskCreate].path)
	}

	const openEditModal = (task: DecoratedTask) => {
		setEditableTask({
			id: task.id,
			title: task.title,
			description: task.description ?? "",
			difficulty: task.difficulty,
			category: "home",
			confirmationType: resolveEvidenceRequirement(task.evidence?.requirement),
		})
		setIsEditModalOpen(true)
	}

	const handleTaskEditSave = async (updatedTask: EditableTask) => {
		try {
			await updateTask.mutateAsync({
				id: updatedTask.id,
				payload: {
					title: updatedTask.title,
					description: updatedTask.description,
					difficulty: updatedTask.difficulty,
					confirmationType: updatedTask.confirmationType,
				},
			})
			toast({
				title: "Задача обновлена",
				description: "Изменения успешно сохранены.",
			})
			setIsEditModalOpen(false)
			setEditableTask(null)
		} catch (err) {
			toast({
				title: "Ошибка обновления",
				description: err instanceof Error ? err.message : "Попробуйте ещё раз",
				variant: "destructive",
			})
		}
	}

	const tasks = coalesce(data, [] as TaskDto[])

	const decoratedTasks: DecoratedTask[] = tasks
		.map((task, index): DecoratedTask => {
			const status = mapStatus(task)
			const difficulty = computeTaskDifficulty(task)
			const xpReward = computeTaskXp(task)
			const pointsReward = computeTaskPoints(task)
			const accent = CARD_ACCENTS[index % CARD_ACCENTS.length]
			const dueDate = addDays(task.createdAt, difficulty + 2)

			return {
				...task,
				status,
				difficulty,
				xpReward,
				pointsReward,
				accent,
				createdLabel: formatDate(task.createdAt),
				dueLabel: formatDate(dueDate),
				progressValue: task.completed ? 100 : Math.min(100, 35 + difficulty * 12),
			}
		})
		.sort((a: DecoratedTask, b: DecoratedTask) => {
			if (a.status === "overdue" && b.status !== "overdue") return -1
			if (b.status === "overdue" && a.status !== "overdue") return 1
			if (a.status === "completed" && b.status !== "completed") return 1
			if (b.status === "completed" && a.status !== "completed") return -1
			return 0
		})

	const summary = decoratedTasks.reduce(
		(acc: Record<TaskStatus, number>, task: DecoratedTask) => {
			acc[task.status] += 1
			return acc
		},
		{ pending: 0, in_progress: 0, completed: 0, overdue: 0 } as Record<TaskStatus, number>,
	)

	const heroStats = useMemo(() => HERO_STATS.map((stat) => ({ ...stat, value: stat.compute(summary) })), [summary])

	const [activeFilter, setActiveFilter] = useState<TaskStatus | "all">("all")

	const filteredTasks: DecoratedTask[] = useMemo(
		() => (activeFilter === "all" ? decoratedTasks : decoratedTasks.filter((task) => task.status === activeFilter)),
		[decoratedTasks, activeFilter],
	)

	const highlighted: DecoratedTask[] = useMemo(() => decoratedTasks.slice(0, 3), [decoratedTasks])

	const handleConfirm = useCallback(
		(id: string) => {
			completeTask.mutate(id)
		},
		[completeTask],
	)

	const handleReject = useCallback(
		async (task: TaskDto) => {
			await updateTask.mutateAsync({
				id: task.id,
				payload: { description: `${coalesce(task.description, "")}\n[Rejected]` },
			})
		},
		[updateTask],
	)

	const handleEvidenceSubmit = useCallback(
		async (file: File) => {
			if (!pendingEvidenceTask) return
			try {
				await submitEvidence.mutateAsync({ id: pendingEvidenceTask.id, file })
				toast({
					title: "Подтверждение отправлено",
					description: "Мы сообщим родителю, что файл готов к проверке.",
				})
				setPendingEvidenceTask(null)
			} catch (submitError) {
				console.error(submitError)
				toast({
					title: "Не удалось загрузить файл",
					description: submitError instanceof Error ? submitError.message : "Попробуйте ещё раз",
					variant: "destructive",
				})
			}
		},
		[pendingEvidenceTask, submitEvidence, toast],
	)

	const handleViewEvidence = useCallback(
		async (task: DecoratedTask) => {
			try {
				const blob = await downloadEvidence.mutateAsync(task.id)
				const url = URL.createObjectURL(blob)
				const link = document.createElement("a")
				link.href = url
				link.download = coalesce(task.evidence?.fileName, `evidence-${task.id}`)
				document.body.appendChild(link)
				link.click()
				link.remove()
				URL.revokeObjectURL(url)
			} catch (err) {
				console.error(err)
				toast({
					title: "Не удалось открыть подтверждение",
					description: err instanceof Error ? err.message : "Попробуйте ещё раз",
					variant: "destructive",
				})
			}
		},
		[downloadEvidence, toast],
	)

	if (isLoading) {
		return (
			<div className="grid gap-4 md:grid-cols-2">
				{Array.from({ length: 4 }).map((_, index) => (
					<div key={`task-skeleton-${index}`} className="rounded-3xl border border-border/60 bg-card/70 p-6 shadow-sm">
						<div className="h-6 w-32 animate-pulse rounded-full bg-muted" />
						<div className="mt-4 h-4 w-full animate-pulse rounded bg-muted" />
						<div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-muted" />
						<div className="mt-6 h-10 w-full animate-pulse rounded bg-muted" />
					</div>
				))}
			</div>
		)
	}

	if (isError) {
		const typedError = error as { status?: number; message?: string }
		if (typedError?.status === 401) {
			return (
				<div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
					Вы не авторизованы. Войдите, чтобы видеть задачи.
				</div>
			)
		}
		return (
			<div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
				Ошибка при загрузке задач: {coalesce(typedError?.message, "Попробуйте обновить страницу")}
			</div>
		)
	}

	if (!tasks.length) {
		return (
			<div className="rounded-3xl border border-dashed border-primary/30 bg-primary/5 px-6 py-10 text-center shadow-sm">
				<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
					<Sparkles className="h-5 w-5" />
				</div>
				<h3 className="mt-4 text-xl font-semibold">Пока задач нет</h3>
				<p className="mt-2 text-sm text-muted-foreground">Создайте первую задачу — ребёнок увидит её сразу после сохранения.</p>
				{userType === "parent" && (
					<Button className="mt-6 gap-2" onClick={openTaskCreation}>
						<Plus className="h-4 w-4" />
						Создать задачу
					</Button>
				)}
			</div>
		)
	}

	const pendingRequirement = pendingEvidenceTask ? resolveEvidenceRequirement(pendingEvidenceTask.evidence?.requirement) : null

	return (
		<>
			<div className="space-y-8">
				<section className="relative overflow-hidden rounded-[32px] border border-border/60 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-900 px-6 py-8 text-white shadow-2xl">
					<div className="pointer-events-none absolute -bottom-24 right-0 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl" />
					<div className="grid gap-8 lg:grid-cols-[2fr,1fr]">
						<div className="space-y-6">
							<p className="text-xs uppercase tracking-[0.4em] text-white/70">панель задач</p>
							<h2 className="text-3xl font-semibold leading-snug">
								Ваш семейный ритм задач — {summary.pending + summary.in_progress} активных прямо сейчас
							</h2>
							<p className="max-w-2xl text-sm text-white/80">
								Следите за прогрессом ребёнка, подтверждайте результаты и мягко напоминайте о важных задачах.
							</p>
							<div className="flex flex-wrap items-center gap-3">
								{userType === "parent" ? (
									<Button
										variant="secondary"
										className="border border-white/50 bg-white/10 text-white hover:bg-white/20"
										onClick={openTaskCreation}
									>
										<Plus className="mr-1 h-4 w-4" />
										Новая задача
									</Button>
								) : (
									<span className="rounded-full border border-white/30 px-4 py-1 text-xs uppercase tracking-[0.3em] text-white/80">
										Режим ребёнка
									</span>
								)}
								<Badge variant="secondary" className="rounded-full border border-white/20 bg-transparent text-white">
									Последнее обновление • {formatDate(new Date())}
								</Badge>
							</div>
							<div className="grid gap-4 sm:grid-cols-3">
								{heroStats.map((stat) => (
									<div key={stat.id} className="rounded-2xl border border-white/20 bg-white/5 px-4 py-4">
										<p className="text-[10px] uppercase tracking-[0.3em] text-white/60">{stat.label}</p>
										<p className="mt-2 text-3xl font-bold">{stat.value}</p>
										<p className="text-xs text-white/70">{stat.hint}</p>
									</div>
								))}
							</div>
						</div>
						<div className="rounded-3xl border border-white/20 bg-white/5 p-6 backdrop-blur">
							<p className="text-xs uppercase tracking-[0.3em] text-white/70">ближайшие задачи</p>
							<div className="mt-4 space-y-4">
								{highlighted.map((task) => (
									<div
										key={`highlight-${task.id}`}
										className="flex items-center justify-between gap-3 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm"
									>
										<div>
											<p className="font-medium text-white">{task.title}</p>
											<p className="text-xs text-white/70">До {task.dueLabel}</p>
										</div>
										<Badge className="rounded-full bg-white/90 text-slate-900">{STATUS_META[task.status].label}</Badge>
									</div>
								))}
								{highlighted.length === 0 && <p className="text-sm text-white/70">Добавьте задачи, чтобы видеть подсказки.</p>}
							</div>
							<div className="mt-5 rounded-2xl border border-dashed border-white/30 px-4 py-3 text-xs text-white/70">
								Совет: держите в фокусе до 5 активных задач, так ребёнку легче сохранять темп.
							</div>
						</div>
					</div>
				</section>

				<div className="flex flex-wrap items-center justify-between gap-4">
					<div className="flex flex-wrap gap-2">
						{FILTERS.map((filter) => {
							const isActive = filter.id === activeFilter
							return (
								<button
									key={filter.id}
									onClick={() => setActiveFilter(filter.id)}
									className={cn(
										"rounded-full border px-4 py-2 text-sm transition",
										isActive ? "border-slate-900 bg-slate-900 text-white shadow" : "border-border/70 bg-card/70 text-muted-foreground hover:border-foreground/40",
									)}
								>
									<div className="text-left">
										<p className="text-sm font-semibold">{filter.label}</p>
										<p className="text-[11px] text-muted-foreground">{filter.hint}</p>
									</div>
								</button>
							)
						})}
					</div>
					<p className="text-sm text-muted-foreground">
						{filteredTasks.length} из {decoratedTasks.length} задач на экране
					</p>
				</div>

				{filteredTasks.length > 0 ? (
					<div className="space-y-5">
						{filteredTasks.map((task) => (
							<TaskRow
								key={task.id}
								task={task}
								userType={userType}
								onConfirm={() => handleConfirm(task.id)}
								onReject={() => handleReject(task)}
								onViewEvidence={() => handleViewEvidence(task)}
								onUploadEvidence={() => setPendingEvidenceTask(task)}
								onEdit={() => openEditModal(task)}
								confirmLoading={completeTask.isPending}
								updateLoading={updateTask.isPending}
								downloadLoading={downloadEvidence.isPending}
							/>
						))}
					</div>
				) : (
					<div className="rounded-3xl border border-dashed border-border/80 bg-muted/10 px-6 py-10 text-center shadow-sm">
						<h3 className="text-lg font-semibold">В этом фильтре пока пусто</h3>
						<p className="mt-2 text-sm text-muted-foreground">Попробуйте выбрать другой статус или создайте новую задачу.</p>
						{userType === "parent" && (
							<Button className="mt-4 gap-2" onClick={openTaskCreation}>
								<Plus className="h-4 w-4" />
								Создать задачу
							</Button>
						)}
					</div>
				)}
			</div>

			<TaskSubmissionModal
				open={Boolean(pendingEvidenceTask)}
				onClose={() => setPendingEvidenceTask(null)}
				taskTitle={pendingEvidenceTask?.title ?? ""}
				confirmationType={pendingRequirement ?? "none"}
				requirements={pendingEvidenceTask?.description}
				isSubmitting={submitEvidence.isPending}
				onSubmit={handleEvidenceSubmit}
			/>

			<TaskEditModal
				open={isEditModalOpen}
				onOpenChange={(open) => {
					setIsEditModalOpen(open)
					if (!open) {
						setEditableTask(null)
					}
				}}
				task={editableTask}
				onSave={handleTaskEditSave}
			/>
		</>
	)
}

interface TaskRowProps {
	task: DecoratedTask
	userType: "parent" | "child"
	onConfirm: () => void
	onReject: () => void
	onViewEvidence: () => void
	onUploadEvidence: () => void
	onEdit: () => void
	confirmLoading: boolean
	updateLoading: boolean
	downloadLoading: boolean
}

function TaskRow({
	task,
	userType,
	onConfirm,
	onReject,
	onViewEvidence,
	onUploadEvidence,
	onEdit,
	confirmLoading,
	updateLoading,
	downloadLoading,
}: TaskRowProps) {
	const [isOpen, setIsOpen] = useState(false)
	const statusMeta = STATUS_META[task.status]
	const StatusIcon = statusMeta.icon
	const evidenceRequirement = resolveEvidenceRequirement(task.evidence?.requirement)
	const evidenceMeta = EVIDENCE_META[evidenceRequirement]
	const requiresEvidence = evidenceRequirement !== "none"
	const evidenceReady = Boolean(task.evidence?.isSubmitted)
	const evidenceStatusText = requiresEvidence
		? evidenceReady
			? `Файл получен${task.evidence?.uploadedAt ? ` · ${formatDate(task.evidence.uploadedAt)}` : ""}`
			: "Ждём подтверждение"
		: "Можно завершить сразу"
	const canParentConfirm = !requiresEvidence || evidenceReady
	const canChildComplete = canParentConfirm
	const isCompleted = task.completed

	const handleToggle = () => setIsOpen((prev) => !prev)
	const handleSummaryKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault()
			handleToggle()
		}
	}

	return (
		<div className={cn(
			"group relative overflow-hidden rounded-3xl border transition-all duration-300",
			isOpen ? "border-primary/30 shadow-xl shadow-primary/10" : "border-border/50 shadow-lg hover:shadow-xl hover:border-primary/20",
			"bg-gradient-to-br from-white via-white to-slate-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/50"
		)}>
			{/* Gradient overlay */}
			<div className={cn(
				"absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300",
				task.status === "completed" && "from-emerald-500/5 to-teal-500/5",
				task.status === "overdue" && "from-red-500/5 to-orange-500/5",
				task.status === "in_progress" && "from-blue-500/5 to-indigo-500/5",
				task.status === "pending" && "from-purple-500/5 to-pink-500/5",
				isOpen && "opacity-100"
			)} />
			
			{/* Main content */}
			<div className="relative">
				{/* Compact header */}
				<div className="flex items-center gap-4 px-5 py-4">
					<div
						className="flex flex-1 cursor-pointer items-center gap-4"
						role="button"
						tabIndex={0}
						onClick={handleToggle}
						onKeyDown={handleSummaryKeyDown}
					>
						{/* Status badge */}
						<div className={cn(
							"flex items-center gap-2 rounded-2xl px-4 py-2 transition-all duration-300",
							statusMeta.badge,
							"shadow-sm hover:shadow-md"
						)}>
							<StatusIcon className="h-4 w-4" />
							<span className="hidden sm:inline text-xs font-bold uppercase tracking-wider">
								{statusMeta.label}
							</span>
						</div>

						{/* Task info */}
						<div className="min-w-0 flex-1">
							<h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
								{task.title}
							</h3>
							<div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
								<span className="flex items-center gap-1">
									<Clock className="h-3 w-3" />
									До {task.dueLabel}
								</span>
								<span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
								<span className="font-semibold text-primary">
									{task.xpReward} XP
								</span>
								<span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
								<span className="font-semibold text-amber-600">
									{task.pointsReward} баллов
								</span>
							</div>
						</div>

						{/* Progress indicator */}
						<div className="hidden lg:flex items-center gap-3">
							<div className="w-32">
								<div className="flex items-center justify-between text-xs mb-1">
									<span className="text-muted-foreground">Прогресс</span>
									<span className="font-bold text-foreground">{Math.round(task.progressValue)}%</span>
								</div>
								<Progress value={task.progressValue} className="h-2" />
							</div>
							<div className="flex items-center gap-1">
								{renderDifficulty(task.difficulty)}
							</div>
						</div>
					</div>

					{/* Actions */}
					<div className="flex items-center gap-2">
						{userType === "parent" && (
							<Button
								variant="ghost"
								size="icon"
								className="hover:bg-primary/10 hover:text-primary transition-colors"
								onClick={(event) => {
									event.stopPropagation()
									onEdit()
								}}
								aria-label="Редактировать задачу"
							>
								<Pencil className="h-4 w-4" />
							</Button>
						)}
						<Button
							variant="ghost"
							size="icon"
							className="hover:bg-primary/10 hover:text-primary transition-all"
							onClick={(event) => {
								event.stopPropagation()
								handleToggle()
							}}
							aria-label={isOpen ? "Скрыть детали" : "Показать детали"}
						>
							<ChevronDown className={cn("h-5 w-5 transition-transform duration-300", isOpen && "rotate-180")} />
						</Button>
					</div>
				</div>

				{/* Expanded content */}
				<div className={cn(
					"border-t border-border/50 overflow-hidden transition-all duration-300",
					isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
				)}>
					<div className="px-5 py-6 space-y-6">
						{/* Mobile progress */}
						<div className="lg:hidden space-y-3">
							<div className="flex items-center justify-between">
								<span className="text-sm text-muted-foreground">Прогресс выполнения</span>
								<span className="text-lg font-bold text-foreground">{Math.round(task.progressValue)}%</span>
							</div>
							<Progress value={task.progressValue} className="h-2.5" />
							<div className="flex items-center gap-2">
								<span className="text-sm text-muted-foreground">Сложность:</span>
								{renderDifficulty(task.difficulty)}
							</div>
						</div>

						{/* Description */}
						<div className="rounded-2xl bg-gradient-to-br from-slate-50/50 to-white dark:from-slate-800/50 dark:to-slate-900 border border-border/50 p-5">
							<p className="text-sm font-medium text-muted-foreground mb-2">Описание задачи</p>
							<p className="text-base text-foreground leading-relaxed">
								{task.description?.trim() || "Добавьте подробности, чтобы ребёнку было проще понять шаги."}
							</p>
						</div>

						{/* Info cards */}
						<div className="grid gap-3 sm:grid-cols-3">
							<div className="rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200/50 dark:border-blue-800/50 p-4">
								<p className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">Создана</p>
								<p className="mt-2 text-2xl font-bold text-blue-900 dark:text-blue-300">{task.createdLabel}</p>
							</div>
							<div className="rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border border-purple-200/50 dark:border-purple-800/50 p-4">
								<p className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400">Дедлайн</p>
								<p className="mt-2 text-2xl font-bold text-purple-900 dark:text-purple-300">{task.dueLabel}</p>
							</div>
							<div className={cn(
								"rounded-2xl border p-4",
								requiresEvidence
									? "bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200/50 dark:border-amber-800/50"
									: "bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border-emerald-200/50 dark:border-emerald-800/50"
							)}>
								<p className={cn(
									"text-xs font-bold uppercase tracking-wider",
									requiresEvidence ? "text-amber-700 dark:text-amber-400" : "text-emerald-700 dark:text-emerald-400"
								)}>
									Подтверждение
								</p>
								<p className={cn(
									"mt-2 text-lg font-bold",
									requiresEvidence ? "text-amber-900 dark:text-amber-300" : "text-emerald-900 dark:text-emerald-300"
								)}>
									{evidenceMeta.label}
								</p>
								<p className="mt-1 text-xs text-muted-foreground">{evidenceStatusText}</p>
							</div>
						</div>

						{/* Journey steps */}
						<div className="rounded-2xl bg-gradient-to-br from-slate-50/50 to-white dark:from-slate-800/50 dark:to-slate-900 border border-border/50 p-5">
							<p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Этапы выполнения</p>
							<div className="flex items-center justify-between">
								{JOURNEY_STEPS.map((step, stepIndex) => (
									<div key={`${task.id}-${step}`} className="flex flex-col items-center gap-2 flex-1">
										<div className={cn(
											"relative flex h-12 w-12 items-center justify-center rounded-full border-2 font-bold text-sm transition-all duration-300",
											stepIndex <= statusMeta.journeyIndex
												? "border-primary bg-gradient-to-br from-primary to-primary/80 text-white shadow-lg shadow-primary/30 scale-110"
												: "border-border/70 bg-background/80 text-muted-foreground"
										)}>
											{stepIndex <= statusMeta.journeyIndex && (
												<div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse" />
											)}
											<span className="relative">{stepIndex + 1}</span>
										</div>
										<span className={cn(
											"text-xs font-medium text-center transition-colors",
											stepIndex <= statusMeta.journeyIndex ? "text-primary font-bold" : "text-muted-foreground"
										)}>
											{step}
										</span>
										{stepIndex < JOURNEY_STEPS.length - 1 && (
											<div className="absolute top-6 left-[calc(50%+24px)] right-[calc(50%-24px)] h-0.5 -z-10 hidden sm:block">
												<div className={cn(
													"h-full transition-all duration-300",
													stepIndex < statusMeta.journeyIndex
														? "bg-gradient-to-r from-primary to-primary"
														: "bg-border/50"
												)} />
											</div>
										)}
									</div>
								))}
							</div>
						</div>

						{/* Actions */}
						<div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border/50">
							<div className="flex items-center gap-2">
								{requiresEvidence && (
									<Badge variant="outline" className="rounded-full">
										{evidenceStatusText}
									</Badge>
								)}
							</div>
							<div className="flex flex-wrap justify-end gap-2">
								{requiresEvidence && userType === "parent" && !isCompleted && evidenceReady && (
									<Button 
										variant="outline" 
										size="sm" 
										className="gap-2 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-colors" 
										onClick={onViewEvidence} 
										disabled={downloadLoading}
									>
										<Eye className="h-4 w-4" />
										Посмотреть файл
									</Button>
								)}
								{requiresEvidence && userType === "child" && !isCompleted && (
									<Button 
										variant="outline" 
										size="sm" 
										className="gap-2 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300 transition-colors" 
										onClick={onUploadEvidence}
									>
										<Upload className="h-4 w-4" />
										{evidenceReady ? "Заменить файл" : "Отправить файл"}
									</Button>
								)}
								{userType === "parent" && !isCompleted && (
									<>
										<Button 
											variant="ghost" 
											size="sm" 
											className="hover:bg-red-50 hover:text-red-700 transition-colors"
											onClick={onReject} 
											disabled={updateLoading}
										>
											Отклонить
										</Button>
										<Button
											size="sm"
											className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/30 transition-all hover:shadow-xl"
											onClick={onConfirm}
											disabled={!canParentConfirm || confirmLoading}
											title={!canParentConfirm ? "Нужно дождаться подтверждения" : undefined}
										>
											<CheckCircle2 className="h-4 w-4" />
											Подтвердить
										</Button>
									</>
								)}
								{userType === "child" && !isCompleted && (
									<Button
										className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/30 transition-all hover:shadow-xl"
										size="sm"
										onClick={onConfirm}
										disabled={!canChildComplete || confirmLoading}
										title={!canChildComplete ? "Сначала прикрепи подтверждение" : undefined}
									>
										<CheckCircle2 className="h-4 w-4" />
										Я сделал
									</Button>
								)}
								{isCompleted && (
									<Badge className="rounded-full px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-0 shadow-lg">
										✓ Задача закрыта
									</Badge>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

interface InfoTileProps {
	label: string
	value: string
	hint?: string
	accent?: boolean
}

function InfoTile({ label, value, hint, accent }: InfoTileProps) {
	return (
		<div className={cn("rounded-2xl border px-3 py-3", accent ? "border-primary/40 bg-primary/5" : "border-border/60 bg-background/80")}>
			<p className={cn("text-[10px] uppercase tracking-[0.2em]", accent ? "text-primary" : "text-muted-foreground")}>{label}</p>
			<p className={cn("mt-1 text-sm font-semibold", accent ? "text-primary" : "text-foreground")}>{value}</p>
			{hint && <p className="text-xs text-muted-foreground">{hint}</p>}
		</div>
	)
}
