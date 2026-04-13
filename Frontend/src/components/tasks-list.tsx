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
	LayoutGrid,
	Pencil,
	Search,
	Sparkles,
	Trash2,
	Trophy,
	Upload,
	X,
	Zap,
	ZoomIn,
	ZoomOut,
	Download,
	FileIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
	useTasks,
	useRequestApproval,
	useApproveTask,
	useRejectTask,
	useStartTask,
	useUpdateTask,
	useDeleteTask,
	useSubmitTaskEvidence,
	useDownloadTaskEvidence,
} from "@/services/tasks-queries"
import { tasksService, type TaskDto, type TaskEvidenceRequirement } from "@/services/tasks-service"

import TaskSubmissionModal from "./task-submission-modal"
import TaskEditModal, { type EditableTask } from "./task-edit-modal"
import TaskRow from "./task-row"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "@/i18n/provider"
import { mapApiError } from "@/features/auth/utils/mapApiError"
import { ApiError } from "@/services/api/http-client"
import { computeTaskDifficulty, computeTaskXp, computeTaskPoints, getStreakMultiplier } from "@/lib/task-metrics"
import { useChildProgressStats } from "@/hooks/use-child-progress-stats"
import { selectAuthSession } from "@/features/auth/store/authSlice"
import { useAppSelector } from "@/store/hooks"
import { useSendFamilyMessage } from "@/services/family-chat-queries"

interface TasksListProps {
	userType: "parent" | "child"
}

type TaskStatus = "pending" | "in_progress" | "pending_approval" | "completed" | "overdue"

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
	pending_approval: {
		bg: "bg-gradient-to-br from-amber-50/90 via-white to-yellow-50/70 dark:from-amber-950/40 dark:via-card dark:to-yellow-950/30",
		border: "border-amber-200/60 dark:border-amber-800/40",
		glow: "hover:shadow-amber-200/40 dark:hover:shadow-amber-900/20",
		iconBg: "bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900 dark:to-amber-800",
		iconText: "text-amber-600 dark:text-amber-300",
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
	pending_approval: {
		label: "tasksList.status.pendingApproval",
		badge: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 ring-1 ring-amber-200 dark:ring-amber-800",
		dot: "bg-amber-500",
		icon: Clock,
		journeyIndex: 2,
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
	pending_approval: { active: "bg-amber-600 text-white", count: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300" },
	overdue: { active: "bg-red-600 text-white", count: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" },
}

const STATUS_PROGRESS_VALUE: Record<TaskStatus, number> = {
	pending: 0,
	in_progress: 35,
	pending_approval: 70,
	completed: 100,
	overdue: 35,
}

const FILTERS: { id: TaskStatus | "all"; label: string; hint: string }[] = [
	{ id: "all", label: "tasksList.filters.all", hint: "tasksList.filters.allHint" },
	{ id: "pending", label: "tasksList.filters.pending", hint: "tasksList.filters.pendingHint" },
	{ id: "in_progress", label: "tasksList.filters.inProgress", hint: "tasksList.filters.inProgressHint" },
	{ id: "completed", label: "tasksList.filters.completed", hint: "tasksList.filters.completedHint" },
	{ id: "overdue", label: "tasksList.filters.overdue", hint: "tasksList.filters.overdueHint" },
]


function mapStatus(task: TaskDto, startedLocally = false): TaskStatus {
	if (task.completed) return "completed"
	if (task.pendingApproval) return "pending_approval"
	if (task.startedByChild || startedLocally) return "in_progress"
	if (!task.createdAt) return "pending"
	const created = new Date(task.createdAt)
	if (Number.isNaN(created.getTime())) return "pending"
	const days = (Date.now() - created.getTime()) / 86_400_000
	if (days > 10) return "overdue"
	return "pending"
}

function formatDate(value?: string | Date): string {
	if (!value) return "-"
	const date = typeof value === "string" ? new Date(value) : value
	if (Number.isNaN(date.getTime())) return "-"
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
	const session = useAppSelector(selectAuthSession)
	const familyId = session?.family?.id
	const sendFamilyMessage = useSendFamilyMessage(familyId)
	const requestApproval = useRequestApproval()
	const approveTask = useApproveTask()
	const rejectTask = useRejectTask()
	const startTask = useStartTask()
	const updateTask = useUpdateTask()
	const deleteTask = useDeleteTask()
	const submitEvidence = useSubmitTaskEvidence()
	const downloadEvidence = useDownloadTaskEvidence()
	const { toast } = useToast()
	const [fallbackStartedTaskIds, setFallbackStartedTaskIds] = useState<Set<string>>(() => new Set())
	const [pendingEvidenceTask, setPendingEvidenceTask] = useState<DecoratedTask | null>(null)
	const [isEditModalOpen, setIsEditModalOpen] = useState(false)
	const [editableTask, setEditableTask] = useState<EditableTask | null>(null)
	const [viewingEvidence, setViewingEvidence] = useState<{ task: DecoratedTask; url: string; type: string } | null>(null)
	const [imageZoom, setImageZoom] = useState(1)


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
				description: mapApiError(err, t("tasksList.toast.tryAgain")),
				variant: "destructive",
			})
		}
	}

	const tasks = coalesce(data, [] as TaskDto[])

	const decoratedTasks: DecoratedTask[] = tasks
		.map((task, index): DecoratedTask => {
			const status = mapStatus(task, fallbackStartedTaskIds.has(task.id))
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
				progressValue: STATUS_PROGRESS_VALUE[status],
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
		{ pending: 0, in_progress: 0, pending_approval: 0, completed: 0, overdue: 0 } as Record<TaskStatus, number>,
	)

	const [activeFilter, setActiveFilter] = useState<TaskStatus | "all">("all")
	const [searchQuery, setSearchQuery] = useState("")
	const [currentPage, setCurrentPage] = useState(1)
	const PAGE_SIZE_OPTIONS = [5, 10, 20, 50] as const
	const [pageSize, setPageSize] = useState<number>(10)

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
			if (userType === "child") {
				requestApproval.mutate(id)
			} else {
				approveTask.mutate(id)
			}
		},
		[userType, requestApproval, approveTask],
	)

	const handleReject = useCallback(
		async (task: TaskDto) => {
			rejectTask.mutate(task.id)
		},
		[rejectTask],
	)

	const handleStart = useCallback(
		async (task: TaskDto) => {
			try {
				await startTask.mutateAsync(task.id)
				setFallbackStartedTaskIds((previous) => {
					if (!previous.has(task.id)) return previous
					const next = new Set(previous)
					next.delete(task.id)
					return next
				})
				toast({
					title: t("tasksList.toast.taskStarted"),
					description: t("tasksList.toast.taskStartedDesc"),
				})
			} catch (startError) {
				if (userType === "child" && startError instanceof ApiError && startError.status === 404) {
					setFallbackStartedTaskIds((previous) => {
						if (previous.has(task.id)) return previous
						const next = new Set(previous)
						next.add(task.id)
						return next
					})
					toast({
						title: t("tasksList.toast.taskStarted"),
						description: t("tasksList.toast.startFallbackMode"),
					})
					return
				}

				console.error(startError)
				toast({
					title: t("tasksList.toast.startFailed"),
					description: mapApiError(startError, t("tasksList.toast.tryAgain")),
					variant: "destructive",
				})
			}
		},
		[startTask, toast, t, userType],
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
					description: mapApiError(submitError, t("tasksList.toast.tryAgain")),
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
		setImageZoom(1)
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
					</div>
				</div>
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
					</div>

					{/* Search + Per-page */}
					<div className="flex items-center gap-2">
						<div className="relative flex-1">
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

						{/* Per-page selector */}
						<div className="flex items-center gap-1.5 shrink-0">
							<LayoutGrid className="h-3.5 w-3.5 text-muted-foreground/60" />
							<div className="flex items-center rounded-lg bg-background/80 shadow-inner">
								{PAGE_SIZE_OPTIONS.map((size) => (
									<button
										key={size}
										type="button"
										onClick={() => setPageSize(size)}
										className={cn(
											"h-8 min-w-[2rem] px-2 text-[11px] font-semibold tabular-nums rounded-lg transition-all duration-200",
											pageSize === size
												? "bg-primary text-primary-foreground shadow-sm"
												: "text-muted-foreground hover:text-foreground hover:bg-muted/60",
										)}
									>
										{size}
									</button>
								))}
							</div>
						</div>
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
																				onStart={() => void handleStart(task)}
									onEdit={() => openEditModal(task)}
									onDelete={() => handleDeleteTask(task.id)}
									onAskParent={userType === "child" && familyId ? (t2, customMessage) => {
										sendFamilyMessage.mutate(
											{ content: customMessage, mentionedTaskId: t2.id },
											{
												onSuccess: () => toast({ title: t("taskRow.askParentSent") }),
												onError: () => toast({ title: t("common.error"), variant: "destructive" }),
											}
										)
									} : undefined}
																					confirmLoading={requestApproval.isPending || approveTask.isPending || startTask.isPending}
																					updateLoading={updateTask.isPending || rejectTask.isPending || startTask.isPending}
									downloadLoading={downloadEvidence.isPending}
									deleteLoading={deleteTask.isPending}
								/>
							))}
						</div>

						{/* Pagination + info */}
						{(totalPages > 1 || filteredTasks.length > 0) && (
							<div className="flex items-center justify-between pt-4">
								{/* Left: showing X of Y */}
								<span className="text-xs text-muted-foreground tabular-nums">
									{Math.min((currentPage - 1) * pageSize + 1, filteredTasks.length)}–{Math.min(currentPage * pageSize, filteredTasks.length)}{" "}
									{t("tasksList.of")} {filteredTasks.length} {t("tasksList.tasks")}
								</span>

								{/* Center: page buttons */}
								{totalPages > 1 && (
									<div className="flex items-center gap-1">
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

								{/* Right: spacer for alignment when single page */}
								{totalPages <= 1 && <div />}
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

			{/* Enhanced Evidence Viewer Modal */}
			{viewingEvidence && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200"
					onClick={handleCloseViewer}
				>
					{/* Close button */}
					<button
						onClick={handleCloseViewer}
						className="absolute top-6 right-6 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-all hover:scale-110"
						aria-label="Close"
					>
						<X className="h-6 w-6" />
					</button>

					{/* Main container */}
					<div
						className="relative w-full max-w-5xl flex flex-col gap-4 animate-in zoom-in-95 duration-300"
						onClick={(e) => e.stopPropagation()}
					>
						{/* Media viewer */}
						<div className="relative bg-black/50 rounded-xl overflow-hidden ring-1 ring-white/10 shadow-2xl">
							{/* Image with zoom */}
							{viewingEvidence.type.startsWith('image/') ? (
								<div className="flex items-center justify-center relative group bg-black">
									<div 
										className="overflow-auto max-h-[70vh] w-full flex items-center justify-center cursor-grab active:cursor-grabbing"
										style={{
											scrollBehavior: 'smooth'
										}}
									>
										<img
											src={viewingEvidence.url}
											alt={t("tasksList.evidenceViewer.altText") || "Evidence"}
											className="transition-transform duration-200"
											style={{ transform: `scale(${imageZoom})` }}
										/>
									</div>
								</div>
							) : viewingEvidence.type.startsWith('video/') ? (
								<video
									src={viewingEvidence.url}
									controls
									autoPlay
									className="w-full max-h-[70vh] object-contain"
								/>
							) : (
								<div className="flex items-center justify-center h-96 bg-black/50 text-white/50">
									<FileText className="h-12 w-12" />
								</div>
							)}

							{/* Zoom controls - только для изображений */}
							{viewingEvidence.type.startsWith('image/') && (
								<div className="absolute bottom-4 right-4 flex items-center gap-2 bg-black/60 rounded-lg p-2 ring-1 ring-white/10 backdrop-blur-sm">
									<Button
										variant="ghost"
										size="icon"
										className="h-9 w-9 text-white hover:bg-white/20"
										onClick={() => setImageZoom(Math.max(0.5, imageZoom - 0.25))}
										disabled={imageZoom <= 0.5}
									>
										<ZoomOut className="h-4 w-4" />
									</Button>
									<span className="text-xs font-medium text-white/70 px-2 tabular-nums min-w-[3ch]">
										{Math.round(imageZoom * 100)}%
									</span>
									<Button
										variant="ghost"
										size="icon"
										className="h-9 w-9 text-white hover:bg-white/20"
										onClick={() => setImageZoom(Math.min(3, imageZoom + 0.25))}
										disabled={imageZoom >= 3}
									>
										<ZoomIn className="h-4 w-4" />
									</Button>
									<div className="w-px h-6 bg-white/10 mx-1" />
									<Button
										variant="ghost"
										size="icon"
										className="h-9 w-9 text-white hover:bg-white/20"
										onClick={() => setImageZoom(1)}
										title="Reset zoom"
									>
										<Eye className="h-4 w-4" />
									</Button>
								</div>
							)}
						</div>

						{/* Task info and controls */}
						<div className="bg-gradient-to-r from-slate-900/50 to-slate-800/50 rounded-xl border border-white/10 p-4 backdrop-blur-sm">
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								{/* Task title and status */}
								<div className="md:col-span-2">
									<h3 className="text-sm font-semibold text-white truncate mb-1">
										{viewingEvidence.task.title}
									</h3>
									<div className="flex items-center gap-2 text-xs text-white/60">
										<Badge className={cn(
											"text-[10px] font-bold rounded-full px-2 py-0.5",
											viewingEvidence.task.status === "completed" ? "bg-emerald-500/30 text-emerald-300 border-emerald-500/50" :
											viewingEvidence.task.status === "in_progress" ? "bg-blue-500/30 text-blue-300 border-blue-500/50" :
											viewingEvidence.task.status === "overdue" ? "bg-red-500/30 text-red-300 border-red-500/50" :
											"bg-slate-500/30 text-slate-300 border-slate-500/50"
										)}>
											{t(`tasksList.status.${viewingEvidence.task.status}`)}
										</Badge>
										<span className="flex items-center gap-1">
											<Clock className="h-3 w-3" />
											{formatDate(viewingEvidence.task.createdAt)}
										</span>
									</div>
								</div>

								{/* Rewards */}
								<div className="flex items-center justify-start md:justify-end gap-2">
									<div className="flex items-center gap-1 bg-violet-500/20 rounded-lg px-2 py-1.5">
										<Zap className="h-3.5 w-3.5 text-violet-400" />
										<span className="text-xs font-semibold text-violet-300">{viewingEvidence.task.xpReward}</span>
									</div>
									<div className="flex items-center gap-1 bg-amber-500/20 rounded-lg px-2 py-1.5">
										<Trophy className="h-3.5 w-3.5 text-amber-400" />
										<span className="text-xs font-semibold text-amber-300">{viewingEvidence.task.pointsReward}</span>
									</div>
								</div>
							</div>

							{/* Description if exists */}
							{viewingEvidence.task.description && (
								<p className="text-xs text-white/60 mt-3 line-clamp-2">
									{viewingEvidence.task.description}
								</p>
							)}
						</div>

						{/* Action buttons */}
						<div className="flex items-center justify-between gap-2">
							<div className="flex items-center gap-0.5 text-xs text-white/50">
								<FileIcon className="h-3.5 w-3.5" />
								<span>{viewingEvidence.type}</span>
							</div>
							<Button
								size="sm"
								className="gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg shadow-blue-500/30"
								onClick={() => {
									const link = document.createElement('a')
									link.href = viewingEvidence.url
									link.download = viewingEvidence.task.evidence?.fileName || 'evidence'
									link.click()
								}}
							>
								<Download className="h-4 w-4" />
								{t("tasksList.evidenceViewer.download") || "Download"}
							</Button>
						</div>
					</div>
				</div>
			)}
		</>
	)
}
