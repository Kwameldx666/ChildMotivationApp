"use client"

import { useEffect, useMemo, useState } from "react"
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Upload, Send } from "lucide-react"
import type { TaskEvidenceRequirement } from "@/services/tasks-service"

interface TaskSubmissionModalProps {
	open: boolean
	onClose: () => void
	taskTitle: string
	confirmationType: TaskEvidenceRequirement
	requirements?: string
	isSubmitting?: boolean
	onSubmit: (file: File) => Promise<void> | void
}

const ACCEPT_MAP: Record<TaskEvidenceRequirement, string> = {
	none: '',
	photo: 'image/*',
	video: 'video/*',
	document: '.pdf,.doc,.docx,.txt',
}

export default function TaskSubmissionModal({
	open,
	onClose,
	taskTitle,
	confirmationType,
	requirements,
	isSubmitting,
	onSubmit,
}: TaskSubmissionModalProps) {
	const [file, setFile] = useState<File | null>(null)
	const accept = ACCEPT_MAP[confirmationType]
	useEffect(() => {
		if (!open) {
			setFile(null)
		}
	}, [open])


	const instruction = useMemo(() => {
		switch (confirmationType) {
			case "photo":
				return "Загрузите чёткое фото результата."
			case "video":
				return "Запишите короткое видео, показывающее выполненную работу."
			case "document":
				return "Прикрепите документ или заметку с подтверждением."
			default:
				return ""
		}
	}, [confirmationType])

	const handleSubmit = async () => {
		if (!file) return
		await onSubmit(file)
		setFile(null)
	}

	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Отправка подтверждения</DialogTitle>
					<DialogDescription>Задача: {taskTitle}</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-4">
					{requirements && (
						<Card className="p-3 bg-blue-50 border-blue-200">
							<p className="text-sm font-medium text-blue-900">Требования родителя</p>
							<p className="text-sm text-blue-800 mt-1">{requirements}</p>
						</Card>
					)}

					<div className="space-y-2">
						<label className="text-sm font-medium flex items-center gap-2">
							<Upload className="w-4 h-4" /> Выберите файл
						</label>
						<input
							type="file"
							accept={accept}
							onChange={(event) => {
								const next = event.target.files?.[0]
								setFile(next ?? null)
							}}
							className="w-full text-sm"
						/>
						{instruction && <p className="text-xs text-muted-foreground">{instruction}</p>}
						{file && <p className="text-xs text-foreground">Выбран файл: {file.name}</p>}
					</div>

				</div>

				<DialogFooter className="gap-2">
					<Button variant="outline" onClick={onClose} className="bg-transparent">
						Отмена
					</Button>
					<Button onClick={handleSubmit} disabled={!file || isSubmitting} className="gap-2">
						<Send className="w-4 h-4" />
						{isSubmitting ? "Отправляем..." : "Отправить"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
