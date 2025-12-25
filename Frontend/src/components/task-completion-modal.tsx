"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Camera, Upload, CheckSquare } from "lucide-react"

interface TaskCompletionModalProps {
  open: boolean
  onClose: () => void
  task: {
    id: number
    title: string
    confirmationType: string
    checklist?: string[]
  }
  onSubmit: () => void
}

export default function TaskCompletionModal({ open, onClose, task, onSubmit }: TaskCompletionModalProps) {
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({})
  const [photoUploaded, setPhotoUploaded] = useState(false)

  const handleChecklistToggle = (index: number) => {
    setCheckedItems((prev) => ({ ...prev, [index]: !prev[index] }))
  }

  const handlePhotoUpload = () => {
    setPhotoUploaded(true)
  }

  const canSubmit =
    task.confirmationType === "photo"
      ? photoUploaded
      : (task.checklist?.every((_, index) => checkedItems[index]) ?? false)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {task.confirmationType === "photo" ? (
              <Camera className="w-5 h-5 text-primary" />
            ) : (
              <CheckSquare className="w-5 h-5 text-primary" />
            )}
            Подтверждение выполнения
          </DialogTitle>
          <DialogDescription>{task.title}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {task.confirmationType === "photo" ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Загрузите фото подтверждения выполнения задачи</p>
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
                {photoUploaded ? (
                  <div className="space-y-2">
                    <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                      <CheckSquare className="w-8 h-8 text-green-600" />
                    </div>
                    <p className="text-sm font-medium text-green-600">Фото загружено!</p>
                  </div>
                ) : (
                  <div className="space-y-2" onClick={handlePhotoUpload}>
                    <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Нажмите для загрузки фото</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground mb-3">Отметьте все пункты чек-листа</p>
              {task.checklist?.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <Checkbox
                    id={`item-${index}`}
                    checked={checkedItems[index] ?? false}
                    onCheckedChange={() => handleChecklistToggle(index)}
                  />
                  <Label
                    htmlFor={`item-${index}`}
                    className={`flex-1 cursor-pointer ${checkedItems[index] ? "line-through text-muted-foreground" : ""}`}
                  >
                    {item}
                  </Label>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent">
            Отмена
          </Button>
          <Button onClick={onSubmit} disabled={!canSubmit} className="flex-1">
            Отправить на проверку
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
