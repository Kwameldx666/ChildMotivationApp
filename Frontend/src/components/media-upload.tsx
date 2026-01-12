"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Camera, Upload, Video, FileText, Image, X, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import type { TaskEvidenceRequirement } from "@/services/tasks-service"

interface MediaUploadProps {
	evidenceType: TaskEvidenceRequirement
	onFileSelect: (file: File) => void
	selectedFile: File | null
	onClear: () => void
}

type UploadSource = "camera" | "gallery" | "file" | "video"

const SOURCE_CONFIG: Record<UploadSource, {
	label: string
	icon: typeof Camera
	accept: string
	capture?: boolean | "user" | "environment"
}> = {
	camera: {
		label: "Сделать фото",
		icon: Camera,
		accept: "image/*",
		capture: "environment"
	},
	gallery: {
		label: "Из галереи",
		icon: Image,
		accept: "image/*"
	},
	video: {
		label: "Снять видео",
		icon: Video,
		accept: "video/*",
		capture: "environment"
	},
	file: {
		label: "Выбрать файл",
		icon: FileText,
		accept: ".pdf,.doc,.docx,.txt"
	}
}

export default function MediaUpload({
	evidenceType,
	onFileSelect,
	selectedFile,
	onClear
}: MediaUploadProps) {
	const [previewUrl, setPreviewUrl] = useState<string | null>(null)
	const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

	// Определяем доступные источники загрузки в зависимости от типа доказательства
	const availableSources: UploadSource[] = (() => {
		switch (evidenceType) {
			case "photo":
				return ["camera", "gallery"]
			case "video":
				return ["video", "gallery"]
			case "document":
				return ["file"]
			default:
				return []
		}
	})()

	const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0]
		if (!file) return

		onFileSelect(file)

		// Создаем превью для изображений и видео
		if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
			const url = URL.createObjectURL(file)
			setPreviewUrl(url)
		} else {
			setPreviewUrl(null)
		}

		// Очищаем input для возможности повторного выбора того же файла
		event.target.value = ""
	}, [onFileSelect])

	const handleSourceClick = (source: UploadSource) => {
		fileInputRefs.current[source]?.click()
	}

	const handleClear = () => {
		if (previewUrl) {
			URL.revokeObjectURL(previewUrl)
			setPreviewUrl(null)
		}
		onClear()
	}

	// Форматирование размера файла
	const formatFileSize = (bytes: number): string => {
		if (bytes < 1024) return `${bytes} Б`
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`
		return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`
	}

	const getInstructionText = (): string => {
		switch (evidenceType) {
			case "photo":
				return "Сделай чёткое фото результата при хорошем освещении"
			case "video":
				return "Запиши короткое видео (до 30 сек), показывающее выполненную работу"
			case "document":
				return "Прикрепи документ или заметку с подтверждением"
			default:
				return "Выбери способ загрузки доказательства"
		}
	}

	if (selectedFile) {
		return (
			<Card className="p-6 border-2 border-dashed border-emerald-300 bg-emerald-50/50">
				<div className="space-y-4">
					<div className="flex items-start justify-between">
						<div className="flex items-center gap-3">
							<div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
								<Check className="h-6 w-6 text-emerald-600" />
							</div>
							<div>
								<p className="font-semibold text-emerald-900">Файл выбран</p>
								<p className="text-sm text-emerald-700">{selectedFile.name}</p>
								<p className="text-xs text-emerald-600">{formatFileSize(selectedFile.size)}</p>
							</div>
						</div>
						<Button
							variant="ghost"
							size="icon"
							onClick={handleClear}
							className="h-8 w-8 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-900"
						>
							<X className="h-4 w-4" />
						</Button>
					</div>

					{/* Превью для изображений и видео */}
					{previewUrl && (
						<div className="rounded-lg overflow-hidden border-2 border-emerald-200">
							{selectedFile.type.startsWith("image/") ? (
								<img
									src={previewUrl}
									alt="Превью"
									className="w-full h-48 object-cover"
								/>
							) : selectedFile.type.startsWith("video/") ? (
								<video
									src={previewUrl}
									controls
									className="w-full h-48 object-cover bg-black"
								/>
							) : null}
						</div>
					)}

					<Button
						variant="outline"
						size="sm"
						onClick={handleClear}
						className="w-full border-emerald-300 text-emerald-700 hover:bg-emerald-100"
					>
						<Upload className="h-4 w-4 mr-2" />
						Выбрать другой файл
					</Button>
				</div>
			</Card>
		)
	}

	return (
		<div className="space-y-4">
			{/* Инструкция */}
			<Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
				<div className="flex items-start gap-3">
					<div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 flex-shrink-0">
						<Upload className="h-4 w-4 text-blue-600" />
					</div>
					<div>
						<p className="text-sm font-semibold text-blue-900">Как загрузить доказательство</p>
						<p className="text-sm text-blue-700 mt-1">{getInstructionText()}</p>
					</div>
				</div>
			</Card>

			{/* Кнопки выбора источника */}
			<div className="grid gap-3 sm:grid-cols-2">
				{availableSources.map((source) => {
					const config = SOURCE_CONFIG[source]
					const Icon = config.icon

					return (
						<div key={source}>
							<input
								ref={(el) => { fileInputRefs.current[source] = el }}
								type="file"
								accept={config.accept}
								onChange={handleFileChange}
								className="hidden"
								{...(config.capture ? { capture: config.capture } : {})}
							/>
							<Button
								variant="outline"
								onClick={() => handleSourceClick(source)}
								className={cn(
									"w-full h-auto flex-col gap-3 py-6 border-2 transition-all",
									"hover:border-primary hover:bg-primary/5 hover:scale-105",
									"active:scale-95"
								)}
							>
								<div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
									<Icon className="h-7 w-7 text-primary" />
								</div>
								<span className="font-semibold">{config.label}</span>
							</Button>
						</div>
					)
				})}
			</div>

			{/* Подсказки в зависимости от типа */}
			{evidenceType === "photo" && (
				<div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
					<p className="text-xs text-amber-800">
						💡 <strong>Совет:</strong> Убедись, что результат хорошо виден на фото. Используй хорошее освещение!
					</p>
				</div>
			)}
			{evidenceType === "video" && (
				<div className="rounded-lg bg-purple-50 border border-purple-200 p-3">
					<p className="text-xs text-purple-800">
						💡 <strong>Совет:</strong> Держи камеру ровно и говори чётко. Покажи результат со всех сторон!
					</p>
				</div>
			)}
			{evidenceType === "document" && (
				<div className="rounded-lg bg-green-50 border border-green-200 p-3">
					<p className="text-xs text-green-800">
						💡 <strong>Совет:</strong> Поддерживаются форматы: PDF, DOC, DOCX, TXT
					</p>
				</div>
			)}
		</div>
	)
}
