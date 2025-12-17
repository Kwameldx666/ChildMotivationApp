"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Star } from "lucide-react"

interface TaskCreationModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (task: any) => void
}

export default function TaskCreationModal({ open, onClose, onSubmit }: TaskCreationModalProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [difficulty, setDifficulty] = useState(1)
  const [xp, setXp] = useState("")
  const [points, setPoints] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [confirmationType, setConfirmationType] = useState("photo")

  const handleSubmit = () => {
    if (title && description && category && xp && points && dueDate) {
      onSubmit({
        title,
        description,
        category,
        difficulty,
        xp: Number.parseInt(xp),
        points: Number.parseInt(points),
        dueDate,
        confirmationType,
      })
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Создать новую задачу</DialogTitle>
          <DialogDescription>Добавьте задачу для членов семьи</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="title">Название задачи</Label>
              <Input
                id="title"
                placeholder="Например: Помыть посуду"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="description">Описание</Label>
              <Textarea
                id="description"
                placeholder="Подробное описание задачи..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Категория</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Выберите категорию" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Уборка">Уборка</SelectItem>
                  <SelectItem value="Учёба">Учёба</SelectItem>
                  <SelectItem value="Развитие">Развитие</SelectItem>
                  <SelectItem value="Помощь">Помощь</SelectItem>
                  <SelectItem value="Спорт">Спорт</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmation">Тип подтверждения</Label>
              <Select value={confirmationType} onValueChange={setConfirmationType}>
                <SelectTrigger id="confirmation">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="photo">Фото</SelectItem>
                  <SelectItem value="checklist">Чек-лист</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Сложность</Label>
              <div className="flex items-center gap-2 p-2 border rounded-lg">
                {[1, 2, 3, 4, 5].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setDifficulty(level)}
                    className="hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        level <= difficulty ? "fill-amber-400 text-amber-400" : "fill-muted text-muted"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Срок выполнения</Label>
              <Input id="dueDate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="xp">Опыт (XP)</Label>
              <Input id="xp" type="number" placeholder="100" value={xp} onChange={(e) => setXp(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="points">Очки</Label>
              <Input
                id="points"
                type="number"
                placeholder="50"
                value={points}
                onChange={(e) => setPoints(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent">
            Отмена
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!title || !description || !category || !xp || !points || !dueDate}
            className="flex-1 gap-2"
          >
            <Plus className="w-4 h-4" />
            Создать задачу
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
