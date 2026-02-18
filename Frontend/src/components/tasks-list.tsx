"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { KeyboardEvent } from "react"
import type { LucideIcon } from "lucide-react"
import {
	AlertCircle,
	Camera,
	CheckCircle2,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	Circle,
	Clock,
	Eye,
	FileText,
	Film,
	Flame,
	Pencil,
	Plus,
	Search,
	Sparkles,
	Trash2,
	Trophy,
	Upload,
	X,
	Zap,
	ZoomIn,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
	useTasks,
	useCompleteTask,
	useUpdateTask,
	useDeleteTask,
	useSubmitTaskEvidence,
	useDownloadTaskEvidence,
} from "@/services/tasks-queries"
import { tasksService, type TaskDto, type TaskEvidenceRequirement } from "@/services/tasks-service"

import TaskSubmissionModal from "./task-submission-modal"
import TaskEditModal, { type EditableTask } from "./task-edit-modal"
import { CreateTaskDialog } from "./create-task-dialog"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "@/i18n/provider"
import { computeTaskDifficulty, computeTaskXp, computeTaskPoints, getStreakMultiplier } from "@/lib/task-metrics"
import { useChildProgressStats } from "@/hooks/use-child-progress-stats"

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
	{ gradient: "from-violet-50/80 via-white to-fuchsia-50/60 dark:from-violet-950/30 dark:via-card dark:to-fuchsia-950/20", ring: "ring-violet-200/50 dark:ring-violet-800/30", highlight: "text-violet-700 dark:text-violet-300" },
	{ gradient: "from-sky-50/80 via-white to-cyan-50/60 dark:from-sky-950/30 dark:via-card dark:to-cyan-950/20", ring: "ring-sky-200/50 dark:ring-sky-800/30", highlight: "text-sky-700 dark:text-sky-300" },
	{ gradient: "from-amber-50/80 via-white to-orange-50/60 dark:from-amber-950/30 dark:via-card dark:to-orange-950/20", ring: "ring-amber-200/50 dark:ring-amber-800/30", highlight: "text-amber-700 dark:text-amber-300" },
	{ gradient: "from-rose-50/80 via-white to-pink-50/60 dark:from-rose-950/30 dark:via-card dark:to-pink-950/20", ring: "ring-rose-200/50 dark:ring-rose-800/30", highlight: "text-rose-700 dark:text-rose-300" },
	{ gradient: "from-emerald-50/80 via-white to-teal-50/60 dark:from-emerald-950/30 dark:via-card dark:to-teal-950/20", ring: "ring-emerald-200/50 dark:ring-emerald-800/30", highlight: "text-emerald-700 dark:text-emerald-300" },
] as const

/* Per-status card visuals */
const STATUS_CARD_STYLE: Record<TaskStatus, { bg: string; border: string; glow: string; iconBg: string; iconText: string }> = {
	pending: {
		bg: "bg-gradient-to-br from-slate-50/90 via-white to-zinc-50/70 dark:from-slate-900/40 dark:via-card dark:to-zinc-900/30",
		border: "border-slate-200/60 dark:border-slate-700/40",
		glow: "hover:shadow-slate-200/40 dark:hover:shadow-slate-800/20",
		iconBg: "bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700",
		iconText: "text-slate-600 dark:text-slate-300",
	},
	in_progress: {
		bg: "bg-gradient-to-br from-blue-50/90 via-white to-indigo-50/70 dark:from-blue-950/40 dark:via-card dark:to-indigo-950/30",
		border: "border-blue-200/60 dark:border-blue-800/40",
		glow: "hover:shadow-blue-200/40 dark:hover:shadow-blue-900/20",
		iconBg: "bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800",
		iconText: "text-blue-600 dark:text-blue-300",
	},
	completed: {
		bg: "bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/70 dark:from-emerald-950/40 dark:via-card dark:to-teal-950/30",
		border: "border-emerald-200/60 dark:border-emerald-800/40",
		glow: "hover:shadow-emerald-200/40 dark:hover:shadow-emerald-900/20",
		iconBg: "bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900 dark:to-emerald-800",
		iconText: "text-emerald-600 dark:text-emerald-300",
	},
	overdue: {
		bg: "bg-gradient-to-br from-red-50/90 via-white to-orange-50/70 dark:from-red-950/40 dark:via-card dark:to-orange-950/30",
		border: "border-red-200/60 dark:border-red-800/40",
		glow: "hover:shadow-red-200/40 dark:hover:shadow-red-900/20",
		iconBg: "bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900 dark:to-red-800",
		iconText: "text-red-600 dark:text-red-300",
	},
}

const EVIDENCE_META: Record<TaskEvidenceRequirement, { label: string; hint: string }> = {
	none: { label: "tasksList.evidence.noneLabel", hint: "tasksList.evidence.noneHint" },
	photo: { label: "tasksList.evidence.photoLabel", hint: "tasksList.evidence.photoHint" },
	video: { label: "tasksList.evidence.videoLabel", hint: "tasksList.evidence.videoHint" },
	document: { label: "tasksList.evidence.documentLabel", hint: "tasksList.evidence.documentHint" },
}

const STATUS_META: Record<TaskStatus, { label: string; badge: string; dot: string; icon: LucideIcon; journeyIndex: number }> = {
	pending: {
		label: "tasksList.status.pending",
		badge: "bg-slate-100 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 ring-1 ring-slate-200 dark:ring-slate-700",
		dot: "bg-slate-400",
		icon: Circle,
		journeyIndex: 0,
	},
	in_progress: {
		label: "tasksList.status.inProgress",
		badge: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 ring-1 ring-blue-200 dark:ring-blue-800",
		dot: "bg-blue-500",
		icon: Clock,
		journeyIndex: 1,
	},
	completed: {
		label: "tasksList.status.completed",
		badge: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-200 dark:ring-emerald-800",
		dot: "bg-emerald-500",
		icon: CheckCircle2,
		journeyIndex: 3,
	},
	overdue: {
		label: "tasksList.status.overdue",
		badge: "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 ring-1 ring-red-200 dark:ring-red-800",
		dot: "bg-red-500",
		icon: AlertCircle,
		journeyIndex: 2,
	},
}

const STATUS_FILTER_COLORS: Record<TaskStatus | "all", { active: string; count: string }> = {
	all: { active: "bg-primary text-primary-foreground", count: "bg-primary/20 text-primary" },
	pending: { active: "bg-slate-600 text-white dark:bg-slate-500", count: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300" },
	in_progress: { active: "bg-blue-600 text-white", count: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
	completed: { active: "bg-emerald-600 text-white", count: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300" },
	overdue: { active: "bg-red-600 text-white", count: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" },
}

const JOURNEY_STEPS = ["tasksList.journey.assigned", "tasksList.journey.inProgress", "tasksList.journey.review", "tasksList.journey.done"] as const

const FILTERS: { id: TaskStatus | "all"; label: string; hint: string }[] = [
	{ id: "all", label: "tasksList.filters.all", hint: "tasksList.filters.allHint" },
	{ id: "pending", label: "tasksList.filters.pending", hint: "tasksList.filters.pendingHint" },
	{ id: "in_progress", label: "tasksList.filters.inProgress", hint: "tasksList.filters.inProgressHint" },
	{ id: "completed", label: "tasksList.filters.completed", hint: "tasksList.filters.completedHint" },
	{ id: "overdue", label: "tasksList.filters.overdue", hint: "tasksList.filters.overdueHint" },
]


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
	if (!value) return "â€”"
	const date = typeof value === "string" ? new Date(value) : value
	if (Number.isNaN(date.getTime())) return "â€”"
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

function resolveEvidenceRequirement(value?: string | number | null): TaskEvidenceRequirement {
	// Handle numeric enum values from backend (0=None, 1=Photo, 2=Video, 3=Document)
	if (typeof value === "number") {
		switch (value) {
			case 1: return "photo"
			case 2: return "video"
			case 3: return "document"
			default: return "none"
		}
	}
	
	const normalized = typeof value === "string" ? value.toLowerCase() : "none"
	return normalized in EVIDENCE_META ? (normalized as TaskEvidenceRequirement) : "none"
}

export default function TasksList({ userType }: TasksListProps) {
	const { t } = useTranslation()
	const { data, isLoading, isError, error } = useTasks()
	const { stats: progressStats } = useChildProgressStats()
	const currentStreak = progressStats?.streak ?? 0
	const streakMultiplier = progressStats?.streakMultiplier ?? 1
	const completeTask = useCompleteTask()
	const updateTask = useUpdateTask()
	const deleteTask = useDeleteTask()
	const submitEvidence = useSubmitTaskEvidence()
	const downloadEvidence = useDownloadTaskEvidence()
	const { toast } = useToast()
	const [pendingEvidenceTask, setPendingEvidenceTask] = useState<DecoratedTask | null>(null)
	const [isEditModalOpen, setIsEditModalOpen] = useState(false)
	const [editableTask, setEditableTask] = useState<EditableTask | null>(null)
	const [viewingEvidence, setViewingEvidence] = useState<{ task: DecoratedTask; url: string; type: string } | null>(null)
	const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false)

	const openTaskCreation = () => {
		setIsCreateTaskOpen(true)
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
				title: t("tasksList.toast.taskUpdated"),
				description: t("tasksList.toast.taskUpdatedDesc"),
			})
			setIsEditModalOpen(false)
			setEditableTask(null)
		} catch (err) {
			toast({
				title: t("tasksList.toast.updateError"),
				description: err instanceof Error ? err.message : t("tasksList.toast.tryAgain"),
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

	const [activeFilter, setActiveFilter] = useState<TaskStatus | "all">("all")
	const [searchQuery, setSearchQuery] = useState("")
	const [currentPage, setCurrentPage] = useState(1)
	const pageSize = 10

	const filteredTasks: DecoratedTask[] = useMemo(() => {
		let result = activeFilter === "all" ? decoratedTasks : decoratedTasks.filter((task) => task.status === activeFilter)
		if (searchQuery.trim()) {
			const q = searchQuery.trim().toLowerCase()
			result = result.filter((task) =>
				task.title.toLowerCase().includes(q) ||
				task.description?.toLowerCase().includes(q),
			)
		}
		return result
	}, [decoratedTasks, activeFilter, searchQuery])

	// ÐŸÐ°Ð³Ð¸Ð½Ð°Ñ†Ð¸Ñ
	const totalPages = Math.ceil(filteredTasks.length / pageSize)
	const paginatedTasks = useMemo(
		() => filteredTasks.slice((currentPage - 1) * pageSize, currentPage * pageSize),
		[filteredTasks, currentPage, pageSize],
	)

	// Ð¡Ð±Ñ€Ð¾Ñ Ð½Ð° Ð¿ÐµÑ€Ð²ÑƒÑŽ ÑÑ‚Ñ€Ð°Ð½Ð¸Ñ†Ñƒ Ð¿Ñ€Ð¸ ÑÐ¼ÐµÐ½Ðµ Ñ„Ð¸Ð»ÑŒÑ‚Ñ€Ð° Ð¸Ð»Ð¸ Ñ€Ð°Ð·Ð¼ÐµÑ€Ð° ÑÑ‚Ñ€Ð°Ð½Ð¸Ñ†Ñ‹
	useEffect(() => {
		setCurrentPage(1)
	}, [activeFilter, searchQuery, pageSize])

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
					title: t("tasksList.toast.evidenceSubmitted"),
					description: t("tasksList.toast.evidenceSubmittedDesc"),
				})
				setPendingEvidenceTask(null)
			} catch (submitError) {
				console.error(submitError)
				toast({
					title: t("tasksList.toast.uploadFailed"),
					description: submitError instanceof Error ? submitError.message : t("tasksList.toast.tryAgain"),
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
				const contentType = task.evidence?.contentType || blob.type
				
				// Ð•ÑÐ»Ð¸ ÑÑ‚Ð¾ Ð¸Ð·Ð¾Ð±Ñ€Ð°Ð¶ÐµÐ½Ð¸Ðµ Ð¸Ð»Ð¸ Ð²Ð¸Ð´ÐµÐ¾, Ð¿Ð¾ÐºÐ°Ð·Ñ‹Ð²Ð°ÐµÐ¼ Ð²Ð¾ Ð²ÑÑ‚Ñ€Ð¾ÐµÐ½Ð½Ð¾Ð¼ Ð¿Ñ€Ð¾ÑÐ¼Ð¾Ñ‚Ñ€Ñ‰Ð¸ÐºÐµ
				if (contentType.startsWith('image/') || contentType.startsWith('video/')) {
					setViewingEvidence({ task, url, type: contentType })
				} else {
					// Ð”Ð»Ñ Ð´Ñ€ÑƒÐ³Ð¸Ñ… Ñ„Ð°Ð¹Ð»Ð¾Ð² ÑÐºÐ°Ñ‡Ð¸Ð²Ð°ÐµÐ¼
					const link = document.createElement("a")
					link.href = url
					link.download = coalesce(task.evidence?.fileName, `evidence-${task.id}`)
					document.body.appendChild(link)
					link.click()
					link.remove()
					URL.revokeObjectURL(url)
				}
			} catch (err) {
				console.error(err)
				toast({
					title: t("tasksList.toast.viewEvidenceFailed"),
					description: err instanceof Error ? err.message : t("tasksList.toast.tryAgain"),
					variant: "destructive",
				})
			}
		},
		[downloadEvidence, toast],
	)

	const handleDeleteTask = useCallback(
		async (taskId: string) => {
			if (!confirm(t("tasksList.confirmDelete"))) return
			try {
				await deleteTask.mutateAsync(taskId)
				toast({
					title: t("tasksList.toast.taskDeleted"),
					description: t("tasksList.toast.taskDeletedDesc"),
				})
			} catch (err) {
				console.error(err)
				toast({
					title: t("tasksList.toast.deleteFailed"),
					description: err instanceof Error ? err.message : t("tasksList.toast.tryAgain"),
					variant: "destructive",
				})
			}
		},
		[deleteTask, toast],
	)

	const handleCloseViewer = useCallback(() => {
		if (viewingEvidence) {
			URL.revokeObjectURL(viewingEvidence.url)
			setViewingEvidence(null)
		}
	}, [viewingEvidence])

	if (isLoading) {
		return (
			<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
				{Array.from({ length: 6 }).map((_, index) => (
					<div key={`task-skeleton-${index}`} className="rounded-2xl border border-border/30 bg-gradient-to-br from-muted/30 via-card to-muted/20 p-4 space-y-3">
						<div className="flex items-center gap-3">
							<div className="h-10 w-10 animate-pulse rounded-xl bg-muted/60" />
							<div className="flex-1 space-y-1.5">
								<div className="h-3.5 w-3/4 animate-pulse rounded-lg bg-muted/60" />
								<div className="h-3 w-1/2 animate-pulse rounded-lg bg-muted/40" />
							</div>
						</div>
						<div className="flex gap-2">
							<div className="h-5 w-14 animate-pulse rounded-full bg-muted/40" />
							<div className="h-5 w-12 animate-pulse rounded-full bg-muted/40" />
						</div>
						<div className="h-1.5 w-full animate-pulse rounded-full bg-muted/30" />
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
					{t("tasksList.errors.unauthorized")}
				</div>
			)
		}
		return (
			<div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
				{t("tasksList.errors.loadError")}: {coalesce(typedError?.message, t("tasksList.errors.tryRefresh"))}
			</div>
		)
	}

	if (!tasks.length) {
		return (
			<>
				<div className="relative overflow-hidden rounded-3xl border border-dashed border-primary/20 bg-gradient-to-br from-primary/5 via-background to-violet-500/5 px-6 py-14 text-center shadow-sm">
					{/* Decorative blobs */}
					<div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-primary/5 blur-3xl" />
					<div className="pointer-events-none absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-violet-500/5 blur-3xl" />
					<div className="relative">
						<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-violet-500/20 text-primary shadow-inner">
							<Sparkles className="h-7 w-7" />
						</div>
						<h3 className="mt-5 text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{t("tasks.noTasks")}</h3>
						<p className="mt-2 text-sm text-muted-foreground max-w-xs mx-auto">{t("tasks.noTasksDescription")}</p>
						{userType === "parent" && (
							<Button className="mt-6 gap-2 shadow-lg shadow-primary/20" onClick={openTaskCreation}>
								<Plus className="h-4 w-4" />
								{t("tasks.addFirstTask")}
							</Button>
						)}
					</div>
				</div>
				<CreateTaskDialog
					open={isCreateTaskOpen}
					onOpenChange={setIsCreateTaskOpen}
				/>
			</>
		)
	}

	const pendingRequirement = pendingEvidenceTask ? resolveEvidenceRequirement(pendingEvidenceTask.evidence?.requirement) : null

	return (
		<>
			<div className="space-y-4">
				{/* ── Toolbar: filters + search ── */}
				<div className="rounded-2xl border border-border/30 bg-gradient-to-r from-muted/40 via-background to-muted/40 p-2.5 shadow-sm space-y-2">
					<div className="flex flex-wrap items-center gap-1">
						{FILTERS.map((filter) => {
							const isActive = filter.id === activeFilter
							const count = filter.id === "all" ? decoratedTasks.length : summary[filter.id as TaskStatus] ?? 0
							const colors = STATUS_FILTER_COLORS[filter.id]
							return (
								<button
									key={filter.id}
									onClick={() => setActiveFilter(filter.id)}
									className={cn(
										"inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all duration-200",
										isActive
											? cn(colors.active, "shadow-md shadow-primary/10 scale-[1.02]")
											: "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
									)}
								>
									{t(filter.label)}
									<span className={cn(
										"inline-flex h-5 min-w-5 items-center justify-center rounded-lg px-1 text-[10px] font-bold tabular-nums",
										isActive ? "bg-white/25 text-inherit" : colors.count,
									)}>
										{count}
									</span>
								</button>
							)
						})}

						{userType === "parent" && (
							<Button
								size="sm"
								className="ml-auto gap-1.5 rounded-xl text-xs shadow-md shadow-primary/15 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground"
								onClick={openTaskCreation}
							>
								<Plus className="h-3.5 w-3.5" />
								{t("tasks.createTask")}
							</Button>
						)}
					</div>

					{/* Search */}
					<div className="relative">
						<Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/50" />
						<input
							type="text"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder={t("tasksList.searchPlaceholder")}
							className="h-9 w-full rounded-xl border-0 bg-background/80 pl-9 pr-9 text-xs text-foreground shadow-inner placeholder:text-muted-foreground/40 focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
						/>
						{searchQuery && (
							<button
								type="button"
								onClick={() => setSearchQuery("")}
								className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground/50 hover:bg-muted hover:text-foreground transition-all"
							>
								<X className="h-3.5 w-3.5" />
							</button>
						)}
					</div>
				</div>

				{/* ── Task card grid ── */}
				{paginatedTasks.length > 0 ? (
					<>
						<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
							{paginatedTasks.map((task) => (
								<TaskRow
									key={task.id}
									task={task}
									userType={userType}
									streakMultiplier={streakMultiplier}
									onConfirm={() => handleConfirm(task.id)}
									onReject={() => handleReject(task)}
									onViewEvidence={() => handleViewEvidence(task)}
									onUploadEvidence={() => setPendingEvidenceTask(task)}
									onEdit={() => openEditModal(task)}
									onDelete={() => handleDeleteTask(task.id)}
									confirmLoading={completeTask.isPending}
									updateLoading={updateTask.isPending}
									downloadLoading={downloadEvidence.isPending}
									deleteLoading={deleteTask.isPending}
								/>
							))}
						</div>

						{/* Pagination */}
						{totalPages > 1 && (
							<div className="flex items-center justify-center gap-1 pt-4">
								<Button
									variant="ghost"
									size="icon"
									className="h-9 w-9 rounded-xl"
									onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
									disabled={currentPage === 1}
								>
									<ChevronLeft className="h-4 w-4" />
								</Button>
								{Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
									<button
										key={page}
										type="button"
										onClick={() => setCurrentPage(page)}
										className={cn(
											"h-9 w-9 rounded-xl text-xs font-semibold transition-all duration-200",
											currentPage === page
												? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-105"
												: "text-muted-foreground hover:bg-muted hover:scale-105",
										)}
									>
										{page}
									</button>
								))}
								<Button
									variant="ghost"
									size="icon"
									className="h-9 w-9 rounded-xl"
									onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
									disabled={currentPage === totalPages}
								>
									<ChevronRight className="h-4 w-4" />
								</Button>
							</div>
						)}
					</>
				) : decoratedTasks.length > 0 ? (
					<div className="rounded-2xl border border-dashed border-muted-foreground/15 bg-gradient-to-b from-muted/20 to-background px-6 py-10 text-center">
						<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/30">
							<Search className="h-5 w-5 text-muted-foreground/40" />
						</div>
						<p className="mt-3 text-sm text-muted-foreground">
							{searchQuery.trim()
								? t("tasksList.noSearchResults", { query: searchQuery.trim() })
								: t("tasks.noTasks")}
						</p>
						{searchQuery.trim() && (
							<button
								type="button"
								onClick={() => setSearchQuery("")}
								className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
							>
								<X className="h-3 w-3" />
								{t("tasksList.clearSearch")}
							</button>
						)}
					</div>
				) : (
					<div className="relative overflow-hidden rounded-2xl border border-dashed border-primary/15 bg-gradient-to-br from-primary/5 via-background to-violet-500/5 px-6 py-12 text-center">
						<div className="pointer-events-none absolute -top-8 -right-8 h-32 w-32 rounded-full bg-primary/5 blur-2xl" />
						<div className="relative">
							<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-violet-500/15 text-primary">
								<Sparkles className="h-5 w-5" />
							</div>
							<h3 className="mt-3 text-base font-bold">{t("tasks.noTasks")}</h3>
							<p className="mt-1 text-sm text-muted-foreground">{t("tasks.noTasksDescription")}</p>
							{userType === "parent" && (
								<Button className="mt-4 gap-2 shadow-lg shadow-primary/15" size="sm" onClick={openTaskCreation}>
									<Plus className="h-4 w-4" />
									{t("tasks.addFirstTask")}
								</Button>
							)}
						</div>
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

			<CreateTaskDialog
				open={isCreateTaskOpen}
				onOpenChange={setIsCreateTaskOpen}
			/>

			{/* Lightbox photo/video viewer */}
			{viewingEvidence && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
					onClick={handleCloseViewer}
				>
					<button
						onClick={handleCloseViewer}
						className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
					>
						<X className="h-5 w-5" />
					</button>

					<div
						className="relative max-w-3xl w-full mx-4"
						onClick={(e) => e.stopPropagation()}
					>
						{viewingEvidence.type.startsWith('image/') ? (
							<img
								src={viewingEvidence.url}
								alt={t("tasksList.evidenceViewer.altText")}
								className="w-full max-h-[80vh] object-contain rounded-lg"
							/>
						) : viewingEvidence.type.startsWith('video/') ? (
							<video
								src={viewingEvidence.url}
								controls
								autoPlay
								className="w-full max-h-[80vh] object-contain rounded-lg"
							/>
						) : null}

						<div className="absolute bottom-0 left-0 right-0 flex items-center justify-between rounded-b-lg bg-gradient-to-t from-black/70 to-transparent px-4 py-3">
							<span className="text-sm text-white/90 font-medium truncate">
								{viewingEvidence.task.title}
							</span>
							<Button
								size="sm"
								variant="secondary"
								className="shrink-0 text-xs"
								onClick={() => {
									const link = document.createElement('a')
									link.href = viewingEvidence.url
									link.download = viewingEvidence.task.evidence?.fileName || 'evidence'
									link.click()
								}}
							>
								{t("tasksList.evidenceViewer.download")}
							</Button>
						</div>
					</div>
				</div>
			)}
		</>
	)
}

/* ─────────────────────────────────────────────────────── */
/*  TaskRow — minimal card with expandable details         */
/* ─────────────────────────────────────────────────────── */

interface TaskRowProps {
	task: DecoratedTask
	userType: "parent" | "child"
	streakMultiplier: number
	onConfirm: () => void
	onReject: () => void
	onViewEvidence: () => void
	onUploadEvidence: () => void
	onEdit: () => void
	onDelete: () => void
	confirmLoading: boolean
	updateLoading: boolean
	downloadLoading: boolean
	deleteLoading: boolean
}

function TaskRow({
	task,
	userType,
	streakMultiplier,
	onConfirm,
	onReject,
	onViewEvidence,
	onUploadEvidence,
	onEdit,
	onDelete,
	confirmLoading,
	updateLoading,
	downloadLoading,
	deleteLoading,
}: TaskRowProps) {
	const { t } = useTranslation()
	const [isOpen, setIsOpen] = useState(false)
	const statusMeta = STATUS_META[task.status]
	const StatusIcon = statusMeta.icon
	const evidenceRequirement = resolveEvidenceRequirement(task.evidence?.requirement)
	const evidenceMeta = EVIDENCE_META[evidenceRequirement]
	const requiresEvidence = evidenceRequirement !== "none"
	const evidenceReady = Boolean(task.evidence?.isSubmitted)
	const isImageEvidence = task.evidence?.contentType?.startsWith('image/') || evidenceRequirement === 'photo'
	const isCompleted = task.completed
	const canParentConfirm = !requiresEvidence || evidenceReady
	const canChildComplete = canParentConfirm

	// Lazy-load thumbnail for image evidence
	const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)
	const thumbnailUrlRef = useRef<string | null>(null)

	useEffect(() => {
		let cancelled = false
		if (evidenceReady && isImageEvidence) {
			tasksService.downloadEvidence(task.id)
				.then(blob => {
					if (!cancelled) {
						if (thumbnailUrlRef.current) URL.revokeObjectURL(thumbnailUrlRef.current)
						const url = URL.createObjectURL(blob)
						thumbnailUrlRef.current = url
						setThumbnailUrl(url)
					}
				})
				.catch(() => {})
		}
		return () => {
			cancelled = true
			if (thumbnailUrlRef.current) {
				URL.revokeObjectURL(thumbnailUrlRef.current)
				thumbnailUrlRef.current = null
			}
		}
	}, [task.id, evidenceReady, isImageEvidence])

	const evidenceStatusText = requiresEvidence
		? evidenceReady
			? `${t("tasksList.evidenceStatus.fileReceived")}${task.evidence?.uploadedAt ? ` · ${formatDate(task.evidence.uploadedAt)}` : ""}`
			: t("tasksList.evidenceStatus.awaitingEvidence")
		: t("tasksList.evidenceStatus.canCompleteDirect")

	const handleToggle = () => setIsOpen((prev) => !prev)
	const handleSummaryKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault()
			handleToggle()
		}
	}

	const cardStyle = STATUS_CARD_STYLE[task.status]

	/* ── Beautiful gradient card ── */
	return (
		<div className={cn(
			"group relative rounded-2xl border transition-all duration-300 overflow-hidden",
			cardStyle.bg,
			cardStyle.border,
			isOpen
				? "shadow-lg ring-1 ring-primary/10"
				: cn("hover:shadow-lg hover:-translate-y-1", cardStyle.glow),
			isCompleted && "opacity-85",
		)}>
			{/* ── Summary (clickable) ── */}
			<div
				className="relative flex items-start gap-3 px-3.5 pt-3.5 pb-3 cursor-pointer select-none"
				role="button"
				tabIndex={0}
				onClick={handleToggle}
				onKeyDown={handleSummaryKeyDown}
			>
				{/* Photo thumbnail or status icon */}
				{thumbnailUrl ? (
					<button
						type="button"
						onClick={(e) => { e.stopPropagation(); onViewEvidence() }}
						className="relative shrink-0 overflow-hidden rounded-xl shadow-sm hover:shadow-md transition-all"
						title={t("tasksList.actions.viewFile")}
					>
						<img src={thumbnailUrl} alt="" className="h-11 w-11 object-cover rounded-xl" />
						<div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-black/25 rounded-xl transition-opacity">
							<ZoomIn className="h-4 w-4 text-white drop-shadow" />
						</div>
					</button>
				) : (
					<div className={cn(
						"flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-sm",
						cardStyle.iconBg,
						cardStyle.iconText,
					)}>
						<StatusIcon className="h-5 w-5" />
					</div>
				)}

				{/* Text content */}
				<div className="min-w-0 flex-1">
					{/* Row 1: Title */}
					<div className="flex items-center gap-1.5">
						<h3 className="truncate text-[13px] font-bold text-foreground leading-snug">
							{task.title}
						</h3>
					</div>

					{/* Row 2: Status label + difficulty stars */}
					<div className="mt-1 flex items-center gap-1.5 text-[11px]">
						<span className={cn(
							"inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold",
							statusMeta.badge,
						)}>
							<StatusIcon className="h-2.5 w-2.5" />
							{t(statusMeta.label)}
						</span>
						{task.difficulty > 0 && (
							<span className="text-amber-500/80 text-[10px] font-medium tracking-tight">
								{"★".repeat(Math.min(task.difficulty, 5))}
							</span>
						)}
						{requiresEvidence && !evidenceReady && (
							<Camera className="h-3 w-3 text-amber-500/70" />
						)}
					</div>

					{/* Row 3: Reward chips */}
					<div className="mt-1.5 flex items-center gap-1.5">
						<span className="inline-flex items-center gap-0.5 rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] font-bold text-violet-600 dark:text-violet-400">
							<Zap className="h-2.5 w-2.5" />
							{task.xpReward}
						</span>
						<span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
							<Trophy className="h-2.5 w-2.5" />
							{task.pointsReward}
						</span>
						{isCompleted && (
							<span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
								<CheckCircle2 className="h-2.5 w-2.5" />
							</span>
						)}
					</div>
				</div>

				{/* Expand chevron */}
				<ChevronDown className={cn(
					"h-4 w-4 shrink-0 text-muted-foreground/30 transition-transform duration-300 mt-0.5",
					isOpen && "rotate-180 text-muted-foreground/60",
				)} />
			</div>

			{/* Mini progress bar always visible at bottom of summary */}
			{!isOpen && (
				<div className="px-3.5 pb-3">
					<div className="h-1 w-full rounded-full bg-muted/40 overflow-hidden">
						<div
							className={cn(
								"h-full rounded-full transition-all duration-500",
								task.status === "completed" ? "bg-emerald-500" : task.status === "overdue" ? "bg-red-400" : task.status === "in_progress" ? "bg-blue-500" : "bg-slate-400",
							)}
							style={{ width: `${task.progressValue}%` }}
						/>
					</div>
				</div>
			)}

			{/* ── Expanded details ── */}
			<div className={cn(
				"overflow-hidden transition-all duration-300",
				isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0",
			)}>
				<div className="border-t border-border/20 px-3.5 py-3 space-y-3">
					{/* Rewards + multiplication + dates */}
					<div className="flex flex-wrap items-center gap-2 text-[11px]">
						<span className="inline-flex items-center gap-1 rounded-lg bg-violet-500/10 px-2 py-1 font-bold text-violet-600 dark:text-violet-400 shadow-sm">
							<Zap className="h-3 w-3" />
							{task.xpReward} XP
						</span>
						<span className="inline-flex items-center gap-1 rounded-lg bg-amber-500/10 px-2 py-1 font-bold text-amber-600 dark:text-amber-400 shadow-sm">
							<Trophy className="h-3 w-3" />
							{task.pointsReward} {t("tasksList.pointsLabel")}
						</span>
						{streakMultiplier > 1 && !isCompleted && (
							<span className="inline-flex items-center gap-0.5 rounded-lg bg-orange-500/10 px-2 py-1 font-bold text-orange-600 dark:text-orange-400 shadow-sm">
								<Flame className="h-3 w-3" />
								×{streakMultiplier.toFixed(1)}
							</span>
						)}
						<span className="ml-auto text-muted-foreground/70 text-[10px]">
							{task.createdLabel} → {task.dueLabel}
						</span>
					</div>

					{/* Description */}
					{task.description?.trim() && (
						<p className="text-[12px] text-muted-foreground/80 leading-relaxed line-clamp-3">
							{task.description.trim()}
						</p>
					)}

					{/* Photo */}
					{thumbnailUrl && (
						<button
							type="button"
							onClick={onViewEvidence}
							className="relative overflow-hidden rounded-xl shadow-sm hover:shadow-md transition-all group/img w-full"
						>
							<img
								src={thumbnailUrl}
								alt={t("tasksList.evidenceViewer.altText")}
								className="w-full max-h-36 object-cover rounded-xl"
							/>
							<div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover/img:bg-black/20 rounded-xl transition-colors">
								<ZoomIn className="h-5 w-5 text-white drop-shadow-lg opacity-0 group-hover/img:opacity-100 transition-opacity" />
							</div>
						</button>
					)}

					{/* Evidence info */}
					{requiresEvidence && (
						<div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/70">
							{evidenceRequirement === 'photo' && <Camera className="h-3 w-3" />}
							{evidenceRequirement === 'video' && <Film className="h-3 w-3" />}
							{evidenceRequirement === 'document' && <FileText className="h-3 w-3" />}
							<span>{t(evidenceMeta.label)} — {evidenceStatusText}</span>
						</div>
					)}

					{/* Progress */}
					<div className="flex items-center gap-2 text-[11px]">
						<div className="h-1.5 flex-1 rounded-full bg-muted/40 overflow-hidden">
							<div
								className={cn(
									"h-full rounded-full transition-all duration-700",
									task.status === "completed" ? "bg-gradient-to-r from-emerald-400 to-emerald-500" : task.status === "overdue" ? "bg-gradient-to-r from-red-400 to-red-500" : task.status === "in_progress" ? "bg-gradient-to-r from-blue-400 to-blue-500" : "bg-gradient-to-r from-slate-300 to-slate-400",
								)}
								style={{ width: `${task.progressValue}%` }}
							/>
						</div>
						<span className="font-bold text-foreground/70 tabular-nums">{Math.round(task.progressValue)}%</span>
					</div>

					{/* Actions */}
					<div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-border/15">
						{userType === "parent" && (
							<>
								<Button variant="ghost" size="sm" className="h-7 gap-1 px-2.5 text-[11px] rounded-lg" onClick={(e) => { e.stopPropagation(); onEdit() }}>
									<Pencil className="h-3 w-3" />
									{t("tasksList.ariaLabels.editTask")}
								</Button>
								<Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-[11px] rounded-lg text-red-500 hover:text-red-600 hover:bg-red-500/10" onClick={(e) => { e.stopPropagation(); onDelete() }} disabled={deleteLoading}>
									<Trash2 className="h-3 w-3" />
								</Button>
							</>
						)}

						{requiresEvidence && evidenceReady && (
							<Button variant="outline" size="sm" className="h-7 gap-1 px-2.5 text-[11px] rounded-lg" onClick={onViewEvidence} disabled={downloadLoading}>
								<Eye className="h-3 w-3" />
								{t("tasksList.actions.viewFile")}
							</Button>
						)}

						{requiresEvidence && userType === "child" && !isCompleted && (
							<Button variant="outline" size="sm" className="h-7 gap-1 px-2.5 text-[11px] rounded-lg" onClick={onUploadEvidence}>
								<Upload className="h-3 w-3" />
								{evidenceReady ? t("tasksList.actions.replaceFile") : t("tasksList.actions.submitFile")}
							</Button>
						)}

						<div className="ml-auto flex items-center gap-1.5">
							{userType === "parent" && !isCompleted && (
								<>
									<Button variant="ghost" size="sm" className="h-7 px-2.5 text-[11px] rounded-lg" onClick={onReject} disabled={updateLoading}>
										{t("tasksList.actions.reject")}
									</Button>
									<Button
										size="sm"
										className="h-7 gap-1 px-3 text-[11px] rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-md shadow-emerald-500/20"
										onClick={onConfirm}
										disabled={!canParentConfirm || confirmLoading}
										title={!canParentConfirm ? t("tasksList.actions.awaitEvidenceHint") : undefined}
									>
										<CheckCircle2 className="h-3 w-3" />
										{t("tasksList.actions.confirm")}
									</Button>
								</>
							)}

							{userType === "child" && !isCompleted && (
								<Button
									size="sm"
									className="h-7 gap-1 px-3 text-[11px] rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-md shadow-emerald-500/20"
									onClick={onConfirm}
									disabled={!canChildComplete || confirmLoading}
									title={!canChildComplete ? t("tasksList.actions.attachEvidenceFirst") : undefined}
								>
									<CheckCircle2 className="h-3 w-3" />
									{t("tasksList.actions.iDidIt")}
								</Button>
							)}

							{isCompleted && (
								<Badge className="rounded-lg px-2.5 py-1 text-[10px] font-bold bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-0 shadow-sm">
									✓ {t("tasksList.taskClosed")}
								</Badge>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
