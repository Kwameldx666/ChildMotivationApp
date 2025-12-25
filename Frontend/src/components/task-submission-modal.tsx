"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Upload, Camera, Video, Send, X } from "lucide-react"

interface TaskSubmissionModalProps {
  open: boolean
  onClose: () => void
  taskTitle: string
  confirmationType: "photo" | "video" | "checklist"
  requirements?: string
  onSubmit: (submission: { type: string; content: string; comment: string }) => void
}

export default function TaskSubmissionModal({
  open,
  onClose,
  taskTitle,
  confirmationType,
  requirements,
  onSubmit,
}: TaskSubmissionModalProps) {
  const [comment, setComment] = useState("")
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([])
  const [checklistItems, setChecklistItems] = useState<boolean[]>([])

  const handleSubmit = () => {
    onSubmit({
      type: confirmationType,
      content: uploadedFiles.join(","),
      comment,
    })
    setComment("")
    setUploadedFiles([])
    setChecklistItems([])
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Выполнить задачу: {taskTitle}</DialogTitle>
          <DialogDescription>Отправьте подтверждение выполнения задачи</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Requirements info */}
          {requirements && (
            <Card className="p-3 bg-blue-50 border-blue-200">
              <p className="text-sm font-medium text-blue-900">Требования:</p>
              <p className="text-sm text-blue-800 mt-1">{requirements}</p>
            </Card>
          )}

          {/* Photo/Video upload */}
          {(confirmationType === "photo" || confirmationType === "video") && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {confirmationType === "photo" ? "📸 Загрузить фото" : "🎥 Загрузить видео"}
              </label>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
                <div className="space-y-2">
                  {confirmationType === "photo" ? (
                    <Camera className="w-8 h-8 mx-auto text-muted-foreground" />
                  ) : (
                    <Video className="w-8 h-8 mx-auto text-muted-foreground" />
                  )}
                  <p className="text-sm text-muted-foreground">Нажмите или перетащите файл сюда</p>
                  <p className="text-xs text-muted-foreground/60">
                    {confirmationType === "photo" ? "JPG, PNG до 5MB" : "MP4, WebM до 50MB"}
                  </p>
                </div>
              </div>
              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  {uploadedFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded"
                    >
                      <span className="text-sm text-green-800">✓ Файл загружен {idx + 1}</span>
                      <button
                        onClick={() => setUploadedFiles(uploadedFiles.filter((_, i) => i !== idx))}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <Button
                variant="outline"
                className="w-full gap-2 bg-transparent"
                onClick={() => setUploadedFiles([...uploadedFiles, `file_${Date.now()}`])}
              >
                <Upload className="w-4 h-4" />
                Добавить файл
              </Button>
            </div>
          )}

          {/* Checklist */}
          {confirmationType === "checklist" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">✓ Чек-лист выполнения</label>
              <div className="space-y-2">
                {["Полностью завершено", "Проверено качество", "Готово к проверке"].map((item, idx) => (
                  <label key={idx} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checklistItems[idx] || false}
                      onChange={(e) => {
                        const newItems = [...checklistItems]
                        newItems[idx] = e.target.checked
                        setChecklistItems(newItems)
                      }}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm">{item}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Comment */}
          <div className="space-y-2">
            <label htmlFor="comment" className="text-sm font-medium">
              💬 Комментарий (опционально)
            </label>
            <Textarea
              id="comment"
              placeholder="Добавьте комментарий к отправке..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="bg-transparent">
            Отмена
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              confirmationType === "photo" || confirmationType === "video"
                ? uploadedFiles.length === 0
                : confirmationType === "checklist"
                  ? !checklistItems.some(Boolean)
                  : false
            }
            className="gap-2"
          >
            <Send className="w-4 h-4" />
            Отправить на проверку
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
