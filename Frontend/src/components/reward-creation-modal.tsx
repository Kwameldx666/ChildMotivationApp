"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Loader2, Plus } from "lucide-react"
import { aiService } from "@/services/ai-service"
import { useToast } from "@/hooks/use-toast"
import { useFamilyMembers } from "@/services/family-queries"
import { useShopProducts } from "@/services/shop-queries"

interface RewardCreationModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (reward: { title: string; description: string; cost: number; stock: number }) => void | Promise<void>
  isSubmitting?: boolean
}

export default function RewardCreationModal({ open, onClose, onSubmit, isSubmitting = false }: RewardCreationModalProps) {
  const { toast } = useToast()
  const { data: familyMembers = [] } = useFamilyMembers()
  const { data: existingProducts = [] } = useShopProducts()
  
  const children = familyMembers.filter(m => m.role === 'child')
  
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [cost, setCost] = useState("")
  const [stock, setStock] = useState("1")
  const [isAiGenerating, setIsAiGenerating] = useState(false)
  const [selectedChildId, setSelectedChildId] = useState<string>("")
  const [customPrompt, setCustomPrompt] = useState("")

  const handleAiGenerate = async () => {
    setIsAiGenerating(true)
    try {
      const selectedChild = selectedChildId ? children.find(c => c.id === selectedChildId) : children[0]
      const childInterests = (selectedChild as any)?.interests || []
      const recentlyPurchasedRewards = existingProducts.slice(0, 5).map(p => p.name)
      
      // Создаем параметры запроса
      const requestParams: any = {
        maxSuggestions: 1,
        childId: selectedChild?.id,
        interests: childInterests,
        recentlyPurchasedRewards,
      }
      
      // Добавляем кастомный промпт если есть
      if (customPrompt.trim()) {
        requestParams.occasion = customPrompt.trim()
      }
      
      const response = await aiService.getRewardSuggestions(requestParams)
      // Бэкенд возвращает Suggestions с заглавной буквы
      const suggestions = response.suggestions || (response as any).Suggestions || []
      if (suggestions && suggestions.length > 0) {
        const suggestion = suggestions[0]
        setTitle(suggestion.title || (suggestion as any).Title)
        setDescription(suggestion.description || (suggestion as any).Description)
        setCost(String(suggestion.cost || (suggestion as any).Cost))
        setStock("1")
        toast({
          title: "ИИ сгенерировал награду",
          description: `${suggestion.title || (suggestion as any).Title} - ${suggestion.cost || (suggestion as any).Cost} баллов`,
        })
      }
    } catch (error: any) {
      console.error('[reward-creation-modal] AI generation failed', error)
      
      // Определяем тип ошибки для более понятного сообщения
      let errorMessage = "Не удалось сгенерировать награду. Попробуйте еще раз."
      
      if (error?.message?.includes('Timeout') || error?.message?.includes('timeout')) {
        errorMessage = "ИИ долго обрабатывает запрос. Попробуйте упростить подсказку или попробовать позже."
      } else if (error?.code === 500 || error?.description?.includes('Timeout')) {
        errorMessage = "Сервер ИИ перегружен. Попробуйте через несколько секунд."
      } else if (error?.message) {
        errorMessage = error.message
      }
      
      toast({
        title: "Ошибка генерации",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsAiGenerating(false)
    }
  }

  // Убрана автоматическая генерация при открытии модала
  // useEffect(() => {
  //   if (open && !title && !description) {
  //     handleAiGenerate()
  //   }
  // }, [open])

  const handleSubmit = async () => {
    if (!title || !description || !cost || !stock) return

    try {
      await onSubmit({
        title,
        description,
        cost: Number.parseInt(cost, 10),
        stock: Math.max(1, Number.parseInt(stock, 10) || 1),
      })

      setTitle("")
      setDescription("")
      setCost("")
      setStock("1")
      onClose()
    } catch (error) {
      console.error("[reward-creation-modal] Failed to submit reward", error)
    }
  }

  const disabled = isSubmitting || isAiGenerating

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Создать новую награду</DialogTitle>
          <DialogDescription>Добавьте награду вручную или используйте ИИ для генерации идей</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 overflow-y-auto flex-1 px-1">
          {/* Выбор ребенка для персонализации */}
          {children.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="child-select">Для кого награда?</Label>
              <select
                id="child-select"
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={selectedChildId}
                onChange={(e) => setSelectedChildId(e.target.value)}
                disabled={disabled}
              >
                <option value="">Для всех детей</option>
                {children.map((child) => (
                  <option key={child.id} value={child.id}>
                    {child.name} {child.lastName}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                ИИ учтет увлечения выбранного ребенка при генерации
              </p>
            </div>
          )}

          {/* Дополнительный промпт */}
          <div className="space-y-2">
            <Label htmlFor="custom-prompt">Подсказка для ИИ (необязательно)</Label>
            <Textarea
              id="custom-prompt"
              placeholder="Например: Ребенок хочет что-то связанное с динозаврами, или Награда для особого случая..."
              rows={2}
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              disabled={disabled}
              className="resize-none break-words overflow-wrap-anywhere w-full"
            />
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0"
            onClick={handleAiGenerate}
            disabled={disabled}
          >
            {isAiGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Генерируем награду...</span>
                <span className="text-xs opacity-75">(может занять до минуты)</span>
              </>
            ) : (
              <>
                Сгенерировать с помощью ИИ
              </>
            )}
          </Button>

          {isAiGenerating && (
            <div className="text-center text-xs text-muted-foreground animate-pulse">
              ИИ анализирует интересы и придумывает идеальную награду...
            </div>
          )}

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

        <div className="flex gap-2 flex-shrink-0 pt-4 border-t">
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
