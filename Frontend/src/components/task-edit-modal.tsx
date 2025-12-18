"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useEffect, useState } from "react"

type TaskReward = {
  xp: number
  points: number
}

type EditableTask = {
  id: string
  title: string
  description: string
  difficulty: number
  category: string
  reward: TaskReward
}

const EMPTY_TASK: EditableTask = {
  id: "",
  title: "",
  description: "",
  difficulty: 1,
  category: "home",
  reward: { xp: 0, points: 0 },
}

interface TaskEditModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task: EditableTask | null
  onSave: (updatedTask: EditableTask) => void
}

export default function TaskEditModal({ open, onOpenChange, task, onSave }: TaskEditModalProps) {
  const [formData, setFormData] = useState<EditableTask>(() => task ?? EMPTY_TASK)

  useEffect(() => {
    if (task) setFormData(task)
  }, [task])

  if (!task) return null

  const handleSave = () => {
    onSave(formData)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Редактировать задачу</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Название</label>
            <Input
              value={formData.title || ""}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Название задачи"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Описание</label>
            <Textarea
              value={formData.description || ""}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Описание задачи"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Сложность</label>
              <select
                value={formData.difficulty || 1}
                onChange={(e) => setFormData({ ...formData, difficulty: Number(e.target.value) })}
                className="w-full px-3 py-2 border rounded-md"
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {"⭐".repeat(n)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Категория</label>
              <select
                value={formData.category || ""}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="home">Дом</option>
                <option value="study">Учёба</option>
                <option value="pets">Питомцы</option>
                <option value="help">Помощь</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Опыт (XP)</label>
              <Input
                type="number"
                value={formData.reward?.xp || 0}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    reward: { ...formData.reward, xp: Number(e.target.value) },
                  })
                }
                placeholder="50"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Очки</label>
              <Input
                type="number"
                value={formData.reward?.points || 0}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    reward: { ...formData.reward, points: Number(e.target.value) },
                  })
                }
                placeholder="10"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button onClick={handleSave} className="bg-linear-to-r from-primary to-secondary">
            Сохранить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
