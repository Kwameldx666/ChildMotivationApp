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
import { CheckCircle2, XCircle, MessageSquare } from "lucide-react"

interface TaskReviewModalProps {
  open: boolean
  onClose: () => void
  taskTitle: string
  childName: string
  submission: {
    type: string
    content: string
    comment: string
  }
  onApprove: (feedback: string) => void
  onReject: (reason: string) => void
  onRequestInfo: (question: string) => void
}

export default function TaskReviewModal({
  open,
  onClose,
  taskTitle,
  childName,
  submission,
  onApprove,
  onReject,
  onRequestInfo,
}: TaskReviewModalProps) {
  const [reviewMode, setReviewMode] = useState<"review" | "approve" | "reject" | "request">("review")
  const [feedback, setFeedback] = useState("")

  const handleApprove = () => {
    onApprove(feedback)
    setFeedback("")
    setReviewMode("review")
    onClose()
  }

  const handleReject = () => {
    onReject(feedback)
    setFeedback("")
    setReviewMode("review")
    onClose()
  }

  const handleRequestInfo = () => {
    onRequestInfo(feedback)
    setFeedback("")
    setReviewMode("review")
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Проверка задачи: {taskTitle}</DialogTitle>
          <DialogDescription>Ребёнок: {childName}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Submission details */}
          <Card className="p-4 bg-muted/50">
            <h4 className="font-medium mb-2">Отправка ребёнка:</h4>
            <div className="space-y-2">
              {submission.type !== "checklist" && submission.content && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Файлы: </span>
                  <span className="font-medium">✓ Загруженные материалы</span>
                </div>
              )}
              {submission.type === "checklist" && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Чек-лист: </span>
                  <span className="font-medium">✓ Выполнен</span>
                </div>
              )}
              {submission.comment && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Комментарий: </span>
                  <p className="italic text-sm mt-1">"{submission.comment}"</p>
                </div>
              )}
            </div>
          </Card>

          {/* Review modes */}
          {reviewMode === "review" && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Выберите действие:</p>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  className="gap-2 flex-col h-auto py-3 bg-green-50 border-green-200 hover:bg-green-100"
                  onClick={() => setReviewMode("approve")}
                >
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="text-xs">Подтвердить</span>
                </Button>
                <Button
                  variant="outline"
                  className="gap-2 flex-col h-auto py-3 bg-orange-50 border-orange-200 hover:bg-orange-100"
                  onClick={() => setReviewMode("request")}
                >
                  <MessageSquare className="w-5 h-5 text-orange-600" />
                  <span className="text-xs">Уточнить</span>
                </Button>
                <Button
                  variant="outline"
                  className="gap-2 flex-col h-auto py-3 bg-red-50 border-red-200 hover:bg-red-100"
                  onClick={() => setReviewMode("reject")}
                >
                  <XCircle className="w-5 h-5 text-red-600" />
                  <span className="text-xs">Отклонить</span>
                </Button>
              </div>
            </div>
          )}

          {/* Approve mode */}
          {reviewMode === "approve" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">✓ Отзыв при подтверждении</label>
              <Textarea
                placeholder="Напишите поощрительный отзыв (опционально)..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={3}
              />
            </div>
          )}

          {/* Reject mode */}
          {reviewMode === "reject" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">✗ Причина отклонения</label>
              <Textarea
                placeholder="Объясните, почему отклоняется задача..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={3}
                className="border-red-200 focus-visible:ring-red-500"
              />
            </div>
          )}

          {/* Request info mode */}
          {reviewMode === "request" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">? Запросить дополнительную информацию</label>
              <Textarea
                placeholder="Какая дополнительная информация нужна? Например: нужно ещё одно фото с другого угла..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={3}
                className="border-orange-200 focus-visible:ring-orange-500"
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="bg-transparent">
            Отмена
          </Button>
          {reviewMode === "review" && (
            <Button variant="outline" onClick={onClose} className="bg-transparent">
              Вернуться
            </Button>
          )}
          {reviewMode === "approve" && (
            <Button onClick={handleApprove} className="gap-2 bg-green-600 hover:bg-green-700">
              <CheckCircle2 className="w-4 h-4" />
              Подтвердить
            </Button>
          )}
          {reviewMode === "reject" && (
            <Button onClick={handleReject} variant="destructive" className="gap-2">
              <XCircle className="w-4 h-4" />
              Отклонить
            </Button>
          )}
          {reviewMode === "request" && (
            <Button onClick={handleRequestInfo} className="gap-2 bg-orange-600 hover:bg-orange-700">
              <MessageSquare className="w-4 h-4" />
              Запросить
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
