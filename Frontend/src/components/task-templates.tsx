"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2, Copy, Sparkles } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

const DEFAULT_TEMPLATES = [
  {
    id: 1,
    title: "Убрать комнату",
    icon: "🧹",
    category: "Дом",
    difficulty: 2,
    description: "Навести порядок в комнате",
    verificationMethod: "photo",
  },
  {
    id: 2,
    title: "Помыть посуду",
    icon: "🍽️",
    category: "Кухня",
    difficulty: 1,
    description: "Вымыть всю посуду",
    verificationMethod: "photo",
  },
  {
    id: 3,
    title: "Погулять с собакой",
    icon: "🐕",
    category: "Питомцы",
    difficulty: 2,
    description: "Прогулка с питомцем",
    verificationMethod: "photo",
  },
  {
    id: 4,
    title: "Сделать домашнее задание",
    icon: "📚",
    category: "Учёба",
    difficulty: 3,
    description: "Выполнить ДЗ",
    verificationMethod: "text",
  },
  {
    id: 5,
    title: "Полить цветы",
    icon: "🌱",
    category: "Дом",
    difficulty: 1,
    description: "Полить комнатные растения",
    verificationMethod: "photo",
  },
  {
    id: 6,
    title: "Вынести мусор",
    icon: "🗑️",
    category: "Дом",
    difficulty: 1,
    description: "Вынести мусорные мешки",
    verificationMethod: "photo",
  },
  {
    id: 7,
    title: "Покормить питомца",
    icon: "🐾",
    category: "Питомцы",
    difficulty: 1,
    description: "Покормить кота/собаку",
    verificationMethod: "photo",
  },
  {
    id: 8,
    title: "Помощь с покупками",
    icon: "🛒",
    category: "Помощь",
    difficulty: 2,
    description: "Помочь с продуктами",
    verificationMethod: "text",
  },
]

const VERIFICATION_METHODS = [
  { value: "photo", label: "📸 Фото", description: "Ребёнок отправляет фотографию" },
  { value: "video", label: "🎥 Видео", description: "Ребёнок отправляет видео" },
  { value: "checklist", label: "✓ Чек-лист", description: "Ребёнок отмечает пункты" },
  { value: "text", label: "📝 Текст", description: "Ребёнок пишет описание" },
  { value: "audio", label: "🎙️ Аудио", description: "Ребёнок записывает аудио" },
]

interface CustomTemplate {
  id: string
  title: string
  icon: string
  category: string
  difficulty: number
  description: string
  verificationMethod: string
}

export default function TaskTemplates() {
  const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [showAIGenerator, setShowAIGenerator] = useState(false)
  const [aiGeneratedIdeas, setAiGeneratedIdeas] = useState<CustomTemplate[]>([])
  const [formData, setFormData] = useState({
    title: "",
    icon: "📋",
    category: "",
    difficulty: "1",
    description: "",
    verificationMethod: "photo",
  })

  const handleAddTemplate = () => {
    if (formData.title && formData.category) {
      const newTemplate: CustomTemplate = {
        id: Date.now().toString(),
        title: formData.title,
        icon: formData.icon,
        category: formData.category,
        difficulty: Number.parseInt(formData.difficulty),
        description: formData.description,
        verificationMethod: formData.verificationMethod,
      }
      setCustomTemplates([...customTemplates, newTemplate])
      setFormData({
        title: "",
        icon: "📋",
        category: "",
        difficulty: "1",
        description: "",
        verificationMethod: "photo",
      })
      setIsOpen(false)
    }
  }

  const handleGenerateAIIdeas = () => {
    const aiIdeas: CustomTemplate[] = [
      {
        id: "ai-1",
        title: "Организовать полку с книгами",
        icon: "📚",
        category: "Дом",
        difficulty: 2,
        description: "Аккуратно расставить книги на полку",
        verificationMethod: "photo",
      },
      {
        id: "ai-2",
        title: "Помощь с приготовлением обеда",
        icon: "🍳",
        category: "Кухня",
        difficulty: 3,
        description: "Помочь приготовить простое блюдо",
        verificationMethod: "video",
      },
      {
        id: "ai-3",
        title: "Прополка грядки",
        icon: "🌿",
        category: "Сад",
        difficulty: 2,
        description: "Пропополоть овощную грядку",
        verificationMethod: "photo",
      },
      {
        id: "ai-4",
        title: "Написать письмо бабушке",
        icon: "💌",
        category: "Помощь",
        difficulty: 1,
        description: "Написать и отправить письмо родственнику",
        verificationMethod: "text",
      },
      {
        id: "ai-5",
        title: "Помыть машину",
        icon: "🚗",
        category: "Дом",
        difficulty: 3,
        description: "Помочь помыть семейную машину",
        verificationMethod: "photo",
      },
    ]
    setAiGeneratedIdeas(aiIdeas)
    setShowAIGenerator(true)
  }

  const handleAcceptAIIdea = (idea: CustomTemplate) => {
    const template = { ...idea, id: Date.now().toString() }
    setCustomTemplates([...customTemplates, template])
    setAiGeneratedIdeas(aiGeneratedIdeas.filter((i) => i.id !== idea.id))
  }

  const handleDeleteCustom = (id: string) => {
    setCustomTemplates(customTemplates.filter((t) => t.id !== id))
  }

  const handleUseTemplate = (template: CustomTemplate | (typeof DEFAULT_TEMPLATES)[0]) => {
    console.log("Using template:", template.title)
  }

  const getVerificationMethodLabel = (method: string) => {
    return VERIFICATION_METHODS.find((m) => m.value === method)?.label || method
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold mb-1">Мои шаблоны</h3>
          <p className="text-sm text-muted-foreground">Ваши сохраненные шаблоны задач</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleGenerateAIIdeas} variant="outline" className="gap-2 bg-transparent">
            <Sparkles className="w-4 h-4" />
            ИИ Идеи
          </Button>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Новый шаблон
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Создать шаблон задачи</DialogTitle>
                <DialogDescription>Сохраните шаблон для быстрого создания похожих задач</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Название *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Убрать комнату"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="icon">Иконка</Label>
                    <Input
                      id="icon"
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      placeholder="🧹"
                      className="text-2xl"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Категория *</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="Дом"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="difficulty">Сложность</Label>
                    <select
                      id="difficulty"
                      value={formData.difficulty}
                      onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                      className="w-full border border-input rounded-md px-3 py-2"
                    >
                      {[1, 2, 3, 4, 5].map((i) => (
                        <option key={i} value={i}>
                          {"⭐".repeat(i)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="verification">Подтверждение *</Label>
                    <select
                      id="verification"
                      value={formData.verificationMethod}
                      onChange={(e) => setFormData({ ...formData, verificationMethod: e.target.value })}
                      className="w-full border border-input rounded-md px-3 py-2"
                    >
                      {VERIFICATION_METHODS.map((method) => (
                        <option key={method.value} value={method.value}>
                          {method.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">Описание</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Детальное описание задачи"
                  />
                </div>
                <Button onClick={handleAddTemplate} className="w-full">
                  Создать шаблон
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {showAIGenerator && aiGeneratedIdeas.length > 0 && (
        <Card className="border-accent/50 bg-accent/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent" />
                ИИ предложил новые идеи
              </h4>
              <Button size="sm" variant="ghost" onClick={() => setShowAIGenerator(false)}>
                ✕
              </Button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {aiGeneratedIdeas.map((idea) => (
                <Card key={idea.id} className="border-accent/20">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center text-xl">
                        {idea.icon}
                      </div>
                      <div className="flex-1">
                        <h5 className="font-semibold text-sm">{idea.title}</h5>
                        <p className="text-xs text-muted-foreground">{idea.description}</p>
                        <div className="flex gap-2 mt-2 text-xs">
                          <span className="bg-secondary/50 px-2 py-0.5 rounded">{idea.category}</span>
                          <span className="bg-secondary/50 px-2 py-0.5 rounded">
                            {getVerificationMethodLabel(idea.verificationMethod)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button size="sm" className="w-full" onClick={() => handleAcceptAIIdea(idea)}>
                      Добавить в мои шаблоны
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {customTemplates.length > 0 && (
        <div>
          <h4 className="font-semibold mb-3">Сохраненные шаблоны</h4>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {customTemplates.map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-all group">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent/10 to-secondary/10 flex items-center justify-center text-2xl flex-shrink-0">
                      {template.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm mb-1 truncate">{template.title}</h4>
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{template.description}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                        <span>{template.category}</span>
                        <span>•</span>
                        <span>{"⭐".repeat(template.difficulty)}</span>
                      </div>
                      <div className="text-xs bg-secondary/20 px-2 py-1 rounded w-fit">
                        {getVerificationMethodLabel(template.verificationMethod)}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-3">
                    <Button size="sm" onClick={() => handleUseTemplate(template)} className="flex-1 gap-1">
                      <Copy className="w-3 h-3" />
                      Использовать
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteCustom(template.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div>
        <h4 className="font-semibold mb-3">Встроенные шаблоны</h4>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {DEFAULT_TEMPLATES.map((template) => (
            <Card key={template.id} className="hover:shadow-md transition-all group">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center text-2xl flex-shrink-0">
                    {template.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm mb-1 truncate">{template.title}</h4>
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{template.description}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                      <span>{template.category}</span>
                      <span>•</span>
                      <span>{"⭐".repeat(template.difficulty)}</span>
                    </div>
                    <div className="text-xs bg-primary/20 px-2 py-1 rounded w-fit">
                      {getVerificationMethodLabel(template.verificationMethod)}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-3">
                  <Button size="sm" onClick={() => handleUseTemplate(template)} className="flex-1 gap-1">
                    <Plus className="w-3 h-3" />
                    Использовать
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
