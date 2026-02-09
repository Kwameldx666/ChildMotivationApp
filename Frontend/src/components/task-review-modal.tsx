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
import { useTranslation } from "@/i18n/provider"

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
  const { t } = useTranslation()
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
          <DialogTitle>{t("taskReview.title", { taskTitle })}</DialogTitle>
          <DialogDescription>{t("taskReview.childLabel", { childName })}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Submission details */}
          <Card className="p-4 bg-muted/50">
            <h4 className="font-medium mb-2">{t("taskReview.submissionTitle")}</h4>
            <div className="space-y-2">
              {submission.type !== "checklist" && submission.content && (
                <div className="text-sm">
                  <span className="text-muted-foreground">{t("taskReview.filesLabel")}</span>
                  <span className="font-medium">{t("taskReview.uploadedMaterials")}</span>
                </div>
              )}
              {submission.type === "checklist" && (
                <div className="text-sm">
                  <span className="text-muted-foreground">{t("taskReview.checklistLabel")}</span>
                  <span className="font-medium">{t("taskReview.checklistDone")}</span>
                </div>
              )}
              {submission.comment && (
                <div className="text-sm">
                  <span className="text-muted-foreground">{t("taskReview.commentLabel")}</span>
                  <p className="italic text-sm mt-1">"{submission.comment}"</p>
                </div>
              )}
            </div>
          </Card>

          {/* Review modes */}
          {reviewMode === "review" && (
            <div className="space-y-2">
              <p className="text-sm font-medium">{t("taskReview.chooseAction")}</p>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  className="gap-2 flex-col h-auto py-3 bg-green-50 border-green-200 hover:bg-green-100"
                  onClick={() => setReviewMode("approve")}
                >
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="text-xs">{t("taskReview.approve")}</span>
                </Button>
                <Button
                  variant="outline"
                  className="gap-2 flex-col h-auto py-3 bg-orange-50 border-orange-200 hover:bg-orange-100"
                  onClick={() => setReviewMode("request")}
                >
                  <MessageSquare className="w-5 h-5 text-orange-600" />
                  <span className="text-xs">{t("taskReview.clarify")}</span>
                </Button>
                <Button
                  variant="outline"
                  className="gap-2 flex-col h-auto py-3 bg-red-50 border-red-200 hover:bg-red-100"
                  onClick={() => setReviewMode("reject")}
                >
                  <XCircle className="w-5 h-5 text-red-600" />
                  <span className="text-xs">{t("taskReview.reject")}</span>
                </Button>
              </div>
            </div>
          )}

          {/* Approve mode */}
          {reviewMode === "approve" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("taskReview.approveFeedbackLabel")}</label>
              <Textarea
                placeholder={t("taskReview.approvePlaceholder")}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={3}
              />
            </div>
          )}

          {/* Reject mode */}
          {reviewMode === "reject" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("taskReview.rejectReasonLabel")}</label>
              <Textarea
                placeholder={t("taskReview.rejectPlaceholder")}
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
              <label className="text-sm font-medium">{t("taskReview.requestInfoLabel")}</label>
              <Textarea
                placeholder={t("taskReview.requestInfoPlaceholder")}
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
            {t("common.cancel")}
          </Button>
          {reviewMode === "review" && (
            <Button variant="outline" onClick={onClose} className="bg-transparent">
              {t("taskReview.goBack")}
            </Button>
          )}
          {reviewMode === "approve" && (
            <Button onClick={handleApprove} className="gap-2 bg-green-600 hover:bg-green-700">
              <CheckCircle2 className="w-4 h-4" />
              {t("taskReview.approve")}
            </Button>
          )}
          {reviewMode === "reject" && (
            <Button onClick={handleReject} variant="destructive" className="gap-2">
              <XCircle className="w-4 h-4" />
              {t("taskReview.reject")}
            </Button>
          )}
          {reviewMode === "request" && (
            <Button onClick={handleRequestInfo} className="gap-2 bg-orange-600 hover:bg-orange-700">
              <MessageSquare className="w-4 h-4" />
              {t("taskReview.request")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
