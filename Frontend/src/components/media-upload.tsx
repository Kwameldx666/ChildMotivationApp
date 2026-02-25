"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Camera, Upload, Video, FileText, Image, X, Check, Square, Circle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { TaskEvidenceRequirement } from "@/services/tasks-service"
import { useTranslation } from "@/i18n/provider"

interface MediaUploadProps {
	evidenceType: TaskEvidenceRequirement
	onFileSelect: (file: File) => void
	selectedFile: File | null
	onClear: () => void
}

type UploadSource = "camera" | "gallery" | "file" | "video" | "record-video"

const SOURCE_CONFIG: Record<UploadSource, {
	label: string
	icon: typeof Camera
	accept?: string
	capture?: boolean | "user" | "environment"
}> = {
	camera: {
		label: "mediaUpload.takePhoto",
		icon: Camera,
		accept: "image/*",
		capture: "environment"
	},
	gallery: {
		label: "mediaUpload.fromGallery",
		icon: Image,
		accept: "image/*,video/*"
	},
	"record-video": {
		label: "mediaUpload.recordVideo",
		icon: Video
	},
	video: {
		label: "mediaUpload.uploadVideo",
		icon: Upload,
		accept: "video/*"
	},
	file: {
		label: "mediaUpload.chooseFile",
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
	const { t } = useTranslation()
	const [previewUrl, setPreviewUrl] = useState<string | null>(null)
	const [isRecording, setIsRecording] = useState(false)
	const [recordingTime, setRecordingTime] = useState(0)
	const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})
	const videoRef = useRef<HTMLVideoElement | null>(null)
	const mediaRecorderRef = useRef<MediaRecorder | null>(null)
	const recordedChunksRef = useRef<Blob[]>([])
	const streamRef = useRef<MediaStream | null>(null)
	const timerRef = useRef<NodeJS.Timeout | null>(null)

	// Определяем доступные источники загрузки в зависимости от типа доказательства
	const availableSources: UploadSource[] = (() => {
		switch (evidenceType) {
			case "photo":
				return ["camera", "gallery"]
			case "video":
				return ["record-video", "video", "gallery"]
			case "document":
				return ["file"]
			default:
				return []
		}
	})()

	// Очистка при размонтировании
	useEffect(() => {
		return () => {
			if (streamRef.current) {
				streamRef.current.getTracks().forEach(track => track.stop())
			}
			if (timerRef.current) {
				clearInterval(timerRef.current)
			}
		}
	}, [])

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

	const handleSourceClick = async (source: UploadSource) => {
		if (source === "record-video") {
			await startVideoRecording()
		} else {
			fileInputRefs.current[source]?.click()
		}
	}

	const startVideoRecording = async () => {
		try {
			// Проверяем поддержку MediaRecorder
			if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
				alert(t('mediaUpload.browserNoCamera'))
				return
			}

			if (!window.MediaRecorder) {
				alert(t('mediaUpload.browserNoRecording'))
				return
			}

			const stream = await navigator.mediaDevices.getUserMedia({ 
				video: { facingMode: "environment" }, 
				audio: true 
			})
			streamRef.current = stream
			
			if (videoRef.current) {
				videoRef.current.srcObject = stream
				videoRef.current.play()
			}

			// Определяем поддерживаемый MIME тип
			let mimeType = 'video/webm;codecs=vp8,opus'
			if (!MediaRecorder.isTypeSupported(mimeType)) {
				mimeType = 'video/webm'
			}
			if (!MediaRecorder.isTypeSupported(mimeType)) {
				mimeType = 'video/mp4'
			}

			const mediaRecorder = new MediaRecorder(stream, {
				mimeType: mimeType
			})
			
			recordedChunksRef.current = []
			
			mediaRecorder.ondataavailable = (event) => {
				if (event.data.size > 0) {
					recordedChunksRef.current.push(event.data)
				}
			}
			
			mediaRecorder.onstop = () => {
				const blob = new Blob(recordedChunksRef.current, { type: mimeType })
				const extension = mimeType.includes('webm') ? 'webm' : 'mp4'
				const file = new File([blob], `video-${Date.now()}.${extension}`, { type: mimeType })
				onFileSelect(file)
				
				const url = URL.createObjectURL(blob)
				setPreviewUrl(url)
				
				if (streamRef.current) {
					streamRef.current.getTracks().forEach(track => track.stop())
					streamRef.current = null
				}
				setIsRecording(false)
				setRecordingTime(0)
				if (timerRef.current) {
					clearInterval(timerRef.current)
					timerRef.current = null
				}
			}
			
			mediaRecorderRef.current = mediaRecorder
			mediaRecorder.start()
			setIsRecording(true)
			
			// Таймер записи
			timerRef.current = setInterval(() => {
				setRecordingTime(prev => prev + 1)
			}, 1000)
		} catch (error) {
			console.error('Camera access error:', error)
			if (error instanceof Error) {
				if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
					alert(t('mediaUpload.cameraAccessDenied'))
				} else if (error.name === 'NotFoundError') {
					alert(t('mediaUpload.cameraNotFound'))
				} else {
					alert(t('mediaUpload.cameraAccessError') + error.message)
				}
			} else {
				alert(t('mediaUpload.cameraAccessGenericError'))
			}
		}
	}

	const stopVideoRecording = () => {
		if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
			mediaRecorderRef.current.stop()
		}
	}

	const formatTime = (seconds: number): string => {
		const mins = Math.floor(seconds / 60)
		const secs = seconds % 60
		return `${mins}:${secs.toString().padStart(2, '0')}`
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
		if (bytes < 1024) return `${bytes} ${t("mediaUpload.bytes")}`
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} ${t("mediaUpload.kilobytes")}`
		return `${(bytes / (1024 * 1024)).toFixed(1)} ${t("mediaUpload.megabytes")}`
	}

	const getInstructionText = (): string => {
		switch (evidenceType) {
			case "photo":
				return t("mediaUpload.photoInstruction")
			case "video":
				return t("mediaUpload.videoInstruction")
			case "document":
				return t("mediaUpload.documentInstruction")
			default:
				return t("mediaUpload.defaultInstruction")
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
								<p className="font-semibold text-emerald-900">{t("mediaUpload.fileSelected")}</p>
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
									alt={t("mediaUpload.preview")}
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
						{t("mediaUpload.chooseAnotherFile")}
					</Button>
				</div>
			</Card>
		)
	}

	// UI для записи видео
	if (isRecording) {
		return (
			<div className="space-y-4">
				<Card className="p-6 border-2 border-red-500 bg-gradient-to-br from-red-50 to-pink-50">
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-3">
								<div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500 animate-pulse">
									<Circle className="h-6 w-6 text-white fill-current" />
								</div>
								<div>
									<p className="font-bold text-red-900">{t("mediaUpload.recording")}</p>
									<p className="text-2xl font-mono text-red-700">{formatTime(recordingTime)}</p>
								</div>
							</div>
							<Button
								variant="destructive"
								size="lg"
								onClick={stopVideoRecording}
								className="gap-2"
							>
								<Square className="h-5 w-5" />
							{t("mediaUpload.stop")}
							</Button>
						</div>
						
						{/* Превью видео во время записи */}
						<div className="rounded-lg overflow-hidden border-2 border-red-300">
							<video
								ref={videoRef}
								autoPlay
								muted
								playsInline
								className="w-full h-64 object-cover bg-black"
							/>
						</div>
						
						<p className="text-sm text-red-700 text-center">
						💡 {t("mediaUpload.recordingTip")}
						</p>
					</div>
				</Card>
			</div>
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
						<p className="text-sm font-semibold text-blue-900">{t("mediaUpload.howToUpload")}</p>
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
							{source !== "record-video" && (
								<input
									ref={(el) => { fileInputRefs.current[source] = el }}
									type="file"
									accept={config.accept}
									onChange={handleFileChange}
									className="hidden"
									{...(config.capture && { capture: config.capture as any })}
								/>
							)}
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
								<span className="font-semibold">{t(config.label)}</span>
							</Button>
						</div>
					)
				})}
			</div>

			{/* Подсказки в зависимости от типа */}
			{evidenceType === "photo" && (
				<div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
					<p className="text-xs text-amber-800">
						💡 <strong>{t("mediaUpload.tip")}</strong> {t("mediaUpload.photoTip")}
					</p>
				</div>
			)}
			{evidenceType === "video" && (
				<div className="rounded-lg bg-purple-50 border border-purple-200 p-3">
					<p className="text-xs text-purple-800">
						💡 <strong>{t("mediaUpload.tip")}</strong> {t("mediaUpload.videoTip")}
					</p>
				</div>
			)}
			{evidenceType === "document" && (
				<div className="rounded-lg bg-green-50 border border-green-200 p-3">
					<p className="text-xs text-green-800">
						💡 <strong>{t("mediaUpload.tip")}</strong> {t("mediaUpload.documentTip")}
					</p>
				</div>
			)}
		</div>
	)
}
