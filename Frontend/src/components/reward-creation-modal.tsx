"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Loader2, Plus, Sparkles } from "lucide-react"

interface RewardCreationModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (reward: { title: string; description: string; cost: number; icon: string; stock: number }) => void | Promise<void>
  isSubmitting?: boolean
}

const ICON_OPTIONS = [
  "🎮",
  "🍕",
  "🎬",
  "🎡",
  "📚",
  "😎",
  "🎨",
  "🏀",
  "🎸",
  "🎭",
  "🚴",
  "🍦",
  "🎯",
  "🎪",
  "🎤",
  "🏊",
]

export default function RewardCreationModal({ open, onClose, onSubmit, isSubmitting = false }: RewardCreationModalProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [cost, setCost] = useState("")
  const [stock, setStock] = useState("1")
  const [selectedIcon, setSelectedIcon] = useState("🎁")
  const [isAiGenerating, setIsAiGenerating] = useState(false)

  const handleAiGenerate = () => {
    setIsAiGenerating(true)
    setTimeout(() => {
      setTitle("Поход в кино")
      setDescription("Выбери фильм и иди всей семьёй в кинотеатр")
      setCost("800")
      setStock("1")
      setSelectedIcon("🎬")
      setIsAiGenerating(false)
    }, 2000)
  }

  const handleSubmit = async () => {
    if (!title || !description || !cost || !stock) return

    try {
      await onSubmit({
        title,
        description,
        cost: Number.parseInt(cost, 10),
        icon: selectedIcon,
        stock: Math.max(1, Number.parseInt(stock, 10) || 1),
      })

      setTitle("")
      setDescription("")
      setCost("")
      setStock("1")
      setSelectedIcon("🎁")
      onClose()
    } catch (error) {
      console.error("[reward-creation-modal] Failed to submit reward", error)
    }
  }

  const disabled = isSubmitting || isAiGenerating

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Создать новую награду</DialogTitle>
          <DialogDescription>Добавьте награду вручную или используйте ИИ для генерации идей</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Button
            type="button"
            variant="outline"
            className="w-full gap-2 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 hover:from-purple-100 hover:to-pink-100"
            onClick={handleAiGenerate}
            disabled={disabled}
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
            <Label>Иконка награды</Label>
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
                  disabled={isSubmitting}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reward-title">Название награды</Label>
            <Input
              id="reward-title"
              placeholder="Например: Час игр на консоли"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reward-description">Описание</Label>
            <Textarea
              id="reward-description"
              placeholder="Подробное описание награды..."
              rows={3}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="reward-cost">Стоимость в очках</Label>
              <Input
                id="reward-cost"
                type="number"
                min="1"
                step="10"
                value={cost}
                onChange={(event) => setCost(event.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reward-stock">Количество наград</Label>
              <Input
                id="reward-stock"
                type="number"
                min="1"
                step="1"
                value={stock}
                onChange={(event) => setStock(event.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1 bg-transparent"
            disabled={isSubmitting}
          >
            Отмена
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!title || !description || !cost || !stock || isSubmitting}
            className="flex-1 gap-2"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {isSubmitting ? "Сохраняем" : "Создать награду"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
