"use client"

import { useCallback, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import type { LucideIcon } from "lucide-react"
import {
	AlertCircle,
	CheckCircle2,
	Circle,
	Clock,
	Eye,
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

function computeDifficulty(task: TaskDto): number {
	const titleLength = coalesce(task.title?.length, 6)
	const base = titleLength % 5
	return Math.min(5, Math.max(1, base + 1))
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

	const openTaskCreation = () => {
		if (typeof window !== "undefined") {
			window.dispatchEvent(new Event("open-task-create"))
			return
		}
		router.push(routeRecord[AppRouteId.TaskCreate].path)
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

				<div className="space-y-5">
					{filteredTasks.map((task, index) => {
						const statusMeta = STATUS_META[task.status]
						const StatusIcon = statusMeta.icon
						const evidence = coalesce(task.evidence, { requirement: "none", isSubmitted: false } as TaskDto["evidence"])
						const evidenceRequirement = resolveEvidenceRequirement(evidence.requirement)
						const evidenceMeta = EVIDENCE_META[evidenceRequirement]
						const requiresEvidence = evidenceRequirement !== "none"
						const evidenceReady = Boolean(evidence.isSubmitted)
						const evidenceStatusText = requiresEvidence
							? evidenceReady
								? `Файл получен${evidence.uploadedAt ? ` · ${formatDate(evidence.uploadedAt)}` : ""}`
								: "Ждём файл от ребёнка"
							: "Можно завершить сразу"
						const canParentConfirm = !requiresEvidence || evidenceReady
						const canChildComplete = canParentConfirm

						return (
							<Card key={task.id} className="relative overflow-hidden border-none bg-transparent shadow-none">
								<div className="relative overflow-hidden rounded-[30px] border border-border/70 bg-card/95 shadow-xl">
									<div className={cn("absolute inset-0 bg-gradient-to-br opacity-60", task.accent.gradient)} />
									<div className="absolute inset-0 bg-white/20" />
											<div className="absolute left-6 top-6 flex h-10 w-10 items-center justify-center rounded-2xl border border-border/70 bg-background text-sm font-semibold text-muted-foreground">
										{userType === "child" && `#${index + 1}`}
									</div>
									<div className="relative z-10 flex flex-col gap-6 p-6 md:p-8">
										<div className="flex flex-wrap items-start justify-between gap-6">
											<div className="max-w-2xl space-y-3">
												<div className="flex flex-wrap items-center gap-3">
													<Badge className={cn("flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em]", statusMeta.badge)}>
														<StatusIcon className="h-3.5 w-3.5" />
														{statusMeta.label}
													</Badge>
													<span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
														{renderDifficulty(task.difficulty)}
													</span>
					
												</div>
												<h3 className="text-2xl font-semibold leading-tight text-foreground">{task.title}</h3>
												<p className="text-sm text-muted-foreground">
													{task.description?.trim() || "Добавьте подробности, чтобы ребёнку было проще понять шаги."}
												</p>
											</div>
											<div className="rounded-3xl border border-border/60 bg-background/80 px-5 py-4 text-right">
												<p className="text-[11px] uppercase text-muted-foreground">Награда</p>
												<p className="mt-1 text-2xl font-semibold text-primary">{task.xpReward} XP <span className="text-sm text-muted-foreground ml-2">• {task.pointsReward} pts</span></p>
												<div className="mt-3 text-xs text-muted-foreground">
													<p>Ожидаем до {task.dueLabel}</p>
													<div className="flex items-center justify-end gap-2">
														<span>Сложность</span>
														{renderDifficulty(task.difficulty)}
													</div>
												</div>
											</div>
										</div>

										<div className="rounded-3xl border border-dashed border-border/60 bg-background/70 p-5">
											<div className="grid gap-3 sm:grid-cols-3">
												<div className="rounded-2xl border border-border/60 bg-card/80 px-3 py-3">
													<p className="text-[11px] uppercase text-muted-foreground">Создана</p>
													<p className="mt-1 text-sm font-semibold text-foreground">{task.createdLabel}</p>
												</div>
												<div className="rounded-2xl border border-border/60 bg-card/80 px-3 py-3">
													<p className="text-[11px] uppercase text-muted-foreground">План</p>
													<p className="mt-1 text-sm font-semibold text-foreground">{task.dueLabel}</p>
												</div>
												<div className="rounded-2xl border border-primary/40 bg-primary/5 px-3 py-3">
													<p className="text-[11px] uppercase text-primary">Контроль</p>
													<p className="mt-1 text-sm font-semibold text-primary">{evidenceMeta.label}</p>
													<p className="text-xs text-primary/80">{evidenceStatusText}</p>
												</div>
											</div>

											<div className="mt-4">
												<div className="flex items-center justify-between text-xs text-muted-foreground">
													<span>Прогресс</span>
													<span className="font-semibold text-foreground">{Math.round(task.progressValue)}%</span>
												</div>
												<Progress value={task.progressValue} className="mt-2 h-2" />
											</div>

											<div className="mt-4 flex flex-wrap items-center justify-between gap-3">
												<div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
													{JOURNEY_STEPS.map((step, stepIndex) => (
														<div key={`${task.id}-${step}`} className="flex items-center gap-2">
															<span
																className={cn(
																	"inline-flex h-6 w-6 items-center justify-center rounded-full border text-[10px]",
																	stepIndex <= statusMeta.journeyIndex ? "border-slate-900 bg-slate-900 text-white" : "border-border/70 text-muted-foreground",
																)}
															>
																{stepIndex + 1}
															</span>
															<span className="hidden sm:inline">{step}</span>
															{stepIndex < JOURNEY_STEPS.length - 1 && <span className="hidden sm:inline h-px w-6 bg-border/60" />}
														</div>
													))}
												</div>
												<div className="flex flex-wrap justify-end gap-2">
													{requiresEvidence && !task.completed && (
														<Badge variant="outline" className="rounded-full border-dashed px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-primary">
															Требуется подтверждение
														</Badge>
													)}

													{userType === "parent" && !task.completed && (
														<>
															{requiresEvidence && evidenceReady && (
																<Button variant="outline" size="sm" className="gap-2" onClick={() => handleViewEvidence(task)} disabled={downloadEvidence.isPending}>
																	<Eye className="h-4 w-4" />
																	Посмотреть файл
																</Button>
															)}
															<Button variant="outline" size="sm" onClick={() => handleReject(task)} disabled={updateTask.isPending}>
																Отклонить
															</Button>
															<Button
																size="sm"
																className="gap-2"
																onClick={() => handleConfirm(task.id)}
																disabled={!canParentConfirm || completeTask.isPending}
																title={!canParentConfirm ? "Нужно дождаться подтверждения" : undefined}
															>
																<CheckCircle2 className="h-4 w-4" />
																Подтвердить
															</Button>
														</>
													)}

													{userType === "child" && !task.completed && (
														<>
															{requiresEvidence && (
																<Button variant="outline" size="sm" className="gap-2" onClick={() => setPendingEvidenceTask(task)}>
																	<Upload className="h-4 w-4" />
																	{evidenceReady ? "Заменить файл" : "Отправить файл"}
																</Button>
															)}
															<Button
																className="gap-2"
																size="sm"
																onClick={() => handleConfirm(task.id)}
																disabled={!canChildComplete || completeTask.isPending}
																title={!canChildComplete ? "Сначала прикрепи подтверждение" : undefined}
															>
																<CheckCircle2 className="h-4 w-4" />
																Я сделал
															</Button>
														</>
													)}

													{task.completed && (
														<Badge variant="secondary" className="rounded-full px-3 py-1 text-xs">
															Задача закрыта
														</Badge>
													)}
												</div>
											</div>
										</div>
									</div>
								</div>
							</Card>
						)
					})}
				</div>
			</div>

		</>
	)
}

/* cspell:disable */
