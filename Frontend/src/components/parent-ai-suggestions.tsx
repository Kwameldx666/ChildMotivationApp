"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Sparkles, ChevronRight } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

interface AITaskSuggestion {
  title: string
  description: string
  difficulty: number
  reward: { xp: number; points: number }
  category: string
}

const AI_TASK_SUGGESTIONS: AITaskSuggestion[] = [
  {
    title: "Помыть посуду",
    description: "Помойте всю посуду после обеда",
    difficulty: 2,
    reward: { xp: 100, points: 20 },
    category: "home",
  },
  {
    title: "Полить цветы",
    description: "Полейте домашние растения",
    difficulty: 1,
    reward: { xp: 50, points: 10 },
    category: "home",
  },
  {
    title: "Сделать домашнее задание",
    description: "Выполнить 3 задания из учебника",
    difficulty: 3,
    reward: { xp: 150, points: 30 },
    category: "study",
  },
  {
    title: "Погулять с собакой",
    description: "Гулять 30 минут в парке",
    difficulty: 2,
    reward: { xp: 100, points: 15 },
    category: "pets",
  },
  {
    title: "Убрать свою комнату",
    description: "Расставить вещи по местам и пропылесосить",
    difficulty: 3,
    reward: { xp: 150, points: 25 },
    category: "home",
  },
]

const AI_REWARD_SUGGESTIONS = [
  { title: "Пицца", cost: 500, emoji: "🍕" },
  { title: "Поход в кино", cost: 750, emoji: "🎬" },
  { title: "Новая игра", cost: 1000, emoji: "🎮" },
  { title: "Прогулка в парк", cost: 300, emoji: "🌳" },
  { title: "Десерт на выбор", cost: 250, emoji: "🍰" },
]

interface ParentAISuggestionsProps {
  onTaskSelect?: (task: AITaskSuggestion) => void
}

export default function ParentAISuggestions({ onTaskSelect }: ParentAISuggestionsProps) {
  const [showTaskSuggestions, setShowTaskSuggestions] = useState(false)
  const [showRewardSuggestions, setShowRewardSuggestions] = useState(false)
  const [selectedTask, setSelectedTask] = useState<AITaskSuggestion | null>(null)

  const handleTaskSelect = (task: AITaskSuggestion) => {
    setSelectedTask(task)
    onTaskSelect?.(task)
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-transparent">
          <CardContent className="pt-6">
            <Button
              onClick={() => setShowTaskSuggestions(true)}
              className="w-full justify-between bg-gradient-to-r from-purple-500 to-purple-600"
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Предложить задачи
              </span>
              <ChevronRight className="w-4 h-4" />
            </Button>
            <p className="text-xs text-muted-foreground mt-3">
              ИИ проанализирует возраст и активность детей и предложит подходящие задачи
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-pink-200 bg-gradient-to-br from-pink-50 to-transparent">
          <CardContent className="pt-6">
            <Button
              onClick={() => setShowRewardSuggestions(true)}
              className="w-full justify-between bg-gradient-to-r from-pink-500 to-pink-600"
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Идеи наград
              </span>
              <ChevronRight className="w-4 h-4" />
            </Button>
            <p className="text-xs text-muted-foreground mt-3">
              ИИ рекомендует популярные награды и поможет сбалансировать цены
            </p>
          </CardContent>
        </Card>
      </div>

      {/* CHANGE: Task suggestions modal */}
      <Dialog open={showTaskSuggestions} onOpenChange={setShowTaskSuggestions}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              Предложенные задачи
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            {AI_TASK_SUGGESTIONS.map((task, idx) => (
              <Card
                key={idx}
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => handleTaskSelect(task)}
              >
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold">{task.title}</p>
                      <p className="text-sm text-muted-foreground">{task.description}</p>
                      <div className="flex gap-2 mt-2">
                        <span className="text-xs bg-muted px-2 py-1 rounded">{"⭐".repeat(task.difficulty)}</span>
                        <span className="text-xs bg-accent/10 px-2 py-1 rounded text-accent">{task.reward.xp} XP</span>
                        <span className="text-xs bg-secondary/10 px-2 py-1 rounded text-secondary">
                          {task.reward.points} pts
                        </span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Использовать
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTaskSuggestions(false)}>
              Закрыть
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CHANGE: Reward suggestions modal */}
      <Dialog open={showRewardSuggestions} onOpenChange={setShowRewardSuggestions}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              Популярные награды
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3">
            {AI_REWARD_SUGGESTIONS.map((reward, idx) => (
              <Card key={idx} className="cursor-pointer hover:border-primary transition-colors text-center">
                <CardContent className="pt-4">
                  <p className="text-3xl mb-2">{reward.emoji}</p>
                  <p className="font-semibold text-sm">{reward.title}</p>
                  <p className="text-lg font-bold text-secondary mt-2">{reward.cost}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRewardSuggestions(false)}>
              Закрыть
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
