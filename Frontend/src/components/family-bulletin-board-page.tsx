{/* cspell:disable */}
"use client"

import { ArrowLeft, MessageSquare, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useState } from "react"

interface BulletinBoardPageProps {
  onBack: () => void
}
export default function BulletinBoardPage({ onBack }: BulletinBoardPageProps) {
  const [items, setItems] = useState([
    { id: 1, type: "announcement", title: "Объявление", message: "В воскресенье семейный пикник!", author: "Родитель" },
    { id: 2, type: "shopping", title: "Список покупок", message: "Молоко, хлеб, яйца", author: "Мама" },
    { id: 3, type: "note", title: "Заметка", message: "Первый помощник месяца - Иван!", author: "Папа" },
  ])
  const [newItem, setNewItem] = useState("")

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-linear-to-r from-primary/10 to-secondary/10 border-b border-border p-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Назад
        </Button>
        <h1 className="text-2xl font-bold flex items-center gap-2 mt-2">
          <MessageSquare className="w-5 h-5" />
          Доска объявлений
        </h1>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Напиши заметку или объявление..."
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
          />
          <Button
            onClick={() => {
              if (newItem) {
                setItems([
                  ...items,
                  { id: Date.now(), type: "note", title: "Новая заметка", message: newItem, author: "Я" },
                ])
                setNewItem("")
              }
            }}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="pt-4">
                <p className="font-semibold text-sm">{item.message}</p>
                <p className="text-xs text-muted-foreground mt-2">{item.author}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
