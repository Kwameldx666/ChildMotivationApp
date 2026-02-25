"use client"

import { useEffect, useState } from "react"
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
import { Send, Sparkles } from "lucide-react"
import type { TaskEvidenceRequirement } from "@/services/tasks-service"
import MediaUpload from "./media-upload"
import { useTranslation } from "@/i18n/provider"

interface TaskSubmissionModalProps {
	open: boolean
	onClose: () => void
	taskTitle: string
	confirmationType: TaskEvidenceRequirement
	requirements?: string
	isSubmitting?: boolean
	onSubmit: (file: File) => Promise<void> | void
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
	const { t } = useTranslation()
	const [file, setFile] = useState<File | null>(null)

	useEffect(() => {
		if (!open) {
			setFile(null)
		}
	}, [open])

	const handleSubmit = async () => {
		if (!file) return
		await onSubmit(file)
		setFile(null)
	}

	const handleFileSelect = (selectedFile: File) => {
		setFile(selectedFile)
	}

	const handleClear = () => {
		setFile(null)
	}

	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="text-2xl flex items-center gap-2">
						<Sparkles className="h-6 w-6 text-primary" />
						{t("taskSubmission.title")}
					</DialogTitle>
					<DialogDescription className="text-base">
						<strong>{taskTitle}</strong>
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-6 py-4">
					{requirements && (
						<Card className="p-4 bg-gradient-to-br from-violet-50 to-purple-50 border-violet-200">
							<p className="text-sm font-bold text-violet-900 mb-2">{t("taskSubmission.requirementsLabel")}</p>
							<p className="text-sm text-violet-800">{requirements}</p>
						</Card>
					)}

					<MediaUpload
						evidenceType={confirmationType}
						onFileSelect={handleFileSelect}
						selectedFile={file}
						onClear={handleClear}
					/>
				</div>

				<DialogFooter className="gap-2 sm:gap-2">
					<Button 
						variant="outline" 
						onClick={onClose} 
						className="flex-1 sm:flex-none"
						disabled={isSubmitting}
					>
						{t("taskSubmission.cancel")}
					</Button>
					<Button 
						onClick={handleSubmit} 
						disabled={!file || isSubmitting} 
						className="flex-1 sm:flex-none gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
					>
						<Send className="w-4 h-4" />
						{isSubmitting ? t("taskSubmission.submitting") : t("taskSubmission.submit")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
