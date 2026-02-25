"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"
import { useTranslation } from "@/i18n/provider"

interface TaskDeleteModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  taskTitle: string | null
  onConfirm: () => void
}

export default function TaskDeleteModal({ open, onOpenChange, taskTitle, onConfirm }: TaskDeleteModalProps) {
  const { t } = useTranslation()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            {t("taskDelete.title")}
          </DialogTitle>
          <DialogDescription>
            {t("taskDelete.confirmMessage", { taskTitle: taskTitle ?? "" })}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("taskDelete.cancel")}
          </Button>
          <Button
            onClick={() => {
              onConfirm()
              onOpenChange(false)
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {t("taskDelete.delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
