"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Plus, Sparkles } from "lucide-react"

interface RewardCreationModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (reward: { title: string; description: string; cost: number; icon: string }) => void
}

const ICON_OPTIONS = ["🎮", "🍕", "🎬", "🎡", "📚", "😎", "🎨", "🏀", "🎸", "🎭", "🚴", "🍦", "🎯", "🎪", "🎤", "🏊"]

export default function RewardCreationModal({ open, onClose, onSubmit }: RewardCreationModalProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [cost, setCost] = useState("")
  const [selectedIcon, setSelectedIcon] = useState("🎁")
  const [isAiGenerating, setIsAiGenerating] = useState(false)

  const handleAiGenerate = () => {
    setIsAiGenerating(true)
    setTimeout(() => {
      setTitle("Поход в кино")
      setDescription("Выбери фильм и иди всей семьёй в кинотеатр")
      setCost("800")
      setSelectedIcon("🎬")
      setIsAiGenerating(false)
    }, 2000)
  }

  const handleSubmit = () => {
    if (title && description && cost) {
      onSubmit({ title, description, cost: Number.parseInt(cost), icon: selectedIcon })
      setTitle("")
      setDescription("")
      setCost("")
      setSelectedIcon("🎁")
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Создать новую награду</DialogTitle>
          <DialogDescription>Добавьте награду вручную или используйте ИИ для генерации идей</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Button
            variant="outline"
            className="w-full gap-2 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 hover:from-purple-100 hover:to-pink-100"
            onClick={handleAiGenerate}
            disabled={isAiGenerating}
          >
            {isAiGenerating ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin" />
                Генерируем идею...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Сгенерировать с помощью ИИ
              </>
            )}
          </Button>

          <div className="space-y-2">
            <Label htmlFor="icon">Иконка награды</Label>
            <div className="grid grid-cols-8 gap-2">
              {ICON_OPTIONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  className={`text-2xl p-2 rounded-lg border-2 transition-all hover:scale-110 ${
                    selectedIcon === icon
                      ? "border-primary bg-primary/10 scale-110"
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => setSelectedIcon(icon)}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Название награды</Label>
            <Input
              id="title"
              placeholder="Например: Час игр на консоли"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              placeholder="Подробное описание награды..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cost">Стоимость в очках</Label>
            <Input id="cost" type="number" placeholder="500" value={cost} onChange={(e) => setCost(e.target.value)} />
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent">
            Отмена
          </Button>
          <Button onClick={handleSubmit} disabled={!title || !description || !cost} className="flex-1 gap-2">
            <Plus className="w-4 h-4" />
            Создать награду
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
