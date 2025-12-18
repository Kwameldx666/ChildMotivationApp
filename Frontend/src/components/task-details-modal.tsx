"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, CheckCircle, Camera, ListChecks } from "lucide-react"

interface TaskDetailsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task: {
    id: string
    title: string
    description: string
    difficulty: number
    category: string
    reward: { xp: number; points: number }
    verifyType: "photo" | "checklist"
    checklist?: string[]
  } | null
}

export default function TaskDetailsModal({ open, onOpenChange, task }: TaskDetailsModalProps) {
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null)
  const [checkedItems, setCheckedItems] = useState<boolean[]>([])

  if (!task) return null

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setUploadedPhoto(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = () => {
    console.log("[v0] Task submitted", { task: task.id, photo: uploadedPhoto, checkedItems })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">{task.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Описание</h3>
            <p className="text-sm text-muted-foreground">{task.description}</p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Сложность</p>
                <p className="text-lg font-bold">{"⭐".repeat(task.difficulty)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Опыт</p>
                <p className="text-lg font-bold text-accent">{task.reward.xp} XP</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Очки</p>
                <p className="text-lg font-bold text-secondary">{task.reward.points} pts</p>
              </CardContent>
            </Card>
          </div>

          {task.verifyType === "photo" && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4" />
                <h3 className="font-semibold">Загрузить фото доказательство</h3>
              </div>
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                {uploadedPhoto ? (
                  <div>
                    <img
                      src={uploadedPhoto || "/placeholders/placeholder.svg"}
                      alt="Uploaded"
                      className="w-32 h-32 object-cover rounded mx-auto mb-4"
                    />
                    <Button variant="outline" size="sm" onClick={() => setUploadedPhoto(null)}>
                      Заменить фото
                    </Button>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="w-8 h-8 text-muted-foreground" />
                      <p className="text-sm font-medium">Нажми чтобы загрузить фото</p>
                    </div>
                  </label>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Совет: сделай фото при хорошем освещении для лучшей проверки!
              </p>
            </div>
          )}

          {task.verifyType === "checklist" && task.checklist && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <ListChecks className="w-4 h-4" />
                <h3 className="font-semibold">Проверка выполнения</h3>
              </div>
              <div className="space-y-2">
                {task.checklist.map((item, idx) => (
                  <label
                    key={idx}
                    className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted"
                  >
                    <input
                      type="checkbox"
                      checked={checkedItems[idx] || false}
                      onChange={(e) => {
                        const updated = [...checkedItems]
                        updated[idx] = e.target.checked
                        setCheckedItems(updated)
                      }}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">{item}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-xs font-medium">
              Совет ИИ: Если у тебя есть вопросы, нажми кнопку "ИИ помощник" в главной вкладке!
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={task.verifyType === "photo" ? !uploadedPhoto : checkedItems.length === 0}
            className="bg-gradient-to-r from-purple-500 to-pink-500"
          >
            <CheckCircle className="mr-2 w-4 h-4" />
            Отправить на проверку
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
