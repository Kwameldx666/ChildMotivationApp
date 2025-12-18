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
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Save } from "lucide-react"

interface TaskRequirementsModalProps {
  open: boolean
  onClose: () => void
  taskTitle: string
  onSave: (requirements: { type: string; description: string }) => void
}

export default function TaskRequirementsModal({ open, onClose, taskTitle, onSave }: TaskRequirementsModalProps) {
  const [requirementType, setRequirementType] = useState("photo")
  const [description, setDescription] = useState("")

  const handleSave = () => {
    onSave({
      type: requirementType,
      description,
    })
    setDescription("")
    setRequirementType("photo")
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Установить требования: {taskTitle}</DialogTitle>
          <DialogDescription>Укажите, как ребёнок должен подтвердить выполнение</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Confirmation type */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Тип подтверждения</Label>
            <RadioGroup value={requirementType} onValueChange={setRequirementType}>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                <RadioGroupItem value="photo" id="photo" />
                <Label htmlFor="photo" className="cursor-pointer flex-1">
                  <span className="font-medium">📸 Фото</span>
                  <p className="text-sm text-muted-foreground">Ребёнок должен загрузить фотографию</p>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                <RadioGroupItem value="video" id="video" />
                <Label htmlFor="video" className="cursor-pointer flex-1">
                  <span className="font-medium">🎥 Видео</span>
                  <p className="text-sm text-muted-foreground">Ребёнок должен загрузить видеоролик</p>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                <RadioGroupItem value="checklist" id="checklist" />
                <Label htmlFor="checklist" className="cursor-pointer flex-1">
                  <span className="font-medium">✓ Чек-лист</span>
                  <p className="text-sm text-muted-foreground">Ребёнок должен отметить пункты выполнения</p>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Detailed requirements */}
          <div className="space-y-2">
            <Label htmlFor="requirements" className="text-base font-medium">
              Детальное описание требований
            </Label>
            <Textarea
              id="requirements"
              placeholder={
                requirementType === "photo"
                  ? "Например: Загрузить фото комнаты со всех четырёх углов, освещение яркое..."
                  : requirementType === "video"
                    ? "Например: Записать видео процесса от начала до конца (минимум 2 минуты)..."
                    : "Например: Отметить все пункты по мере выполнения..."
              }
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">Это описание будет показано ребёнку при выполнении задачи</p>
          </div>

          {/* Preview */}
          <Card className="p-3 bg-blue-50 border-blue-200">
            <p className="text-sm font-medium text-blue-900 mb-2">Как это увидит ребёнок:</p>
            <div className="text-sm text-blue-800 space-y-1">
              <p>
                <span className="font-semibold">Тип:</span>{" "}
                {requirementType === "photo" ? "📸 Фото" : requirementType === "video" ? "🎥 Видео" : "✓ Чек-лист"}
              </p>
              {description && (
                <p>
                  <span className="font-semibold">Требования:</span> {description}
                </p>
              )}
            </div>
          </Card>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="bg-transparent">
            Отмена
          </Button>
          <Button onClick={handleSave} className="gap-2" disabled={!description}>
            <Save className="w-4 h-4" />
            Сохранить требования
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
