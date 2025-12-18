"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sparkles, Lock } from "lucide-react"

const STICKER_SERIES = {
  animals: [
    { id: 1, emoji: "🦁", name: "Лев", unlocked: true },
    { id: 2, emoji: "🐼", name: "Панда", unlocked: true },
    { id: 3, emoji: "🦊", name: "Лиса", unlocked: false },
    { id: 4, emoji: "🐨", name: "Коала", unlocked: true },
    { id: 5, emoji: "🦉", name: "Сова", unlocked: false },
    { id: 6, emoji: "🐸", name: "Лягушка", unlocked: false },
  ],
  robots: [
    { id: 7, emoji: "🤖", name: "Робот", unlocked: true },
    { id: 8, emoji: "👾", name: "Инопланетянин", unlocked: false },
    { id: 9, emoji: "🚀", name: "Ракета", unlocked: true },
    { id: 10, emoji: "⚙️", name: "Механизм", unlocked: false },
    { id: 11, emoji: "🔋", name: "Батарея", unlocked: false },
    { id: 12, emoji: "💻", name: "Компьютер", unlocked: true },
  ],
  fantasy: [
    { id: 13, emoji: "🦄", name: "Единорог", unlocked: true },
    { id: 14, emoji: "🐉", name: "Дракон", unlocked: false },
    { id: 15, emoji: "🧙", name: "Волшебник", unlocked: false },
    { id: 16, emoji: "👑", name: "Корона", unlocked: true },
    { id: 17, emoji: "⚔️", name: "Меч", unlocked: false },
    { id: 18, emoji: "🏰", name: "Замок", unlocked: true },
  ],
}

export default function StickerCollection() {
  const [activeTab, setActiveTab] = useState("animals")

  const calculateProgress = (series: any[]) => {
    const unlocked = series.filter((s) => s.unlocked).length
    return { unlocked, total: series.length, percent: Math.round((unlocked / series.length) * 100) }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold mb-1">Коллекция стикеров</h2>
          <p className="text-sm text-muted-foreground">Собирайте стикеры за выполнение заданий</p>
        </div>
        <Badge className="bg-accent text-accent-foreground gap-1">
          <Sparkles className="w-3 h-3" />
          Новое!
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="animals">
            Животные <span className="ml-1 text-xs">({calculateProgress(STICKER_SERIES.animals).unlocked}/6)</span>
          </TabsTrigger>
          <TabsTrigger value="robots">
            Роботы <span className="ml-1 text-xs">({calculateProgress(STICKER_SERIES.robots).unlocked}/6)</span>
          </TabsTrigger>
          <TabsTrigger value="fantasy">
            Фэнтези <span className="ml-1 text-xs">({calculateProgress(STICKER_SERIES.fantasy).unlocked}/6)</span>
          </TabsTrigger>
        </TabsList>

        {Object.entries(STICKER_SERIES).map(([key, stickers]) => (
          <TabsContent key={key} value={key} className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Прогресс серии: {calculateProgress(stickers).percent}%</CardTitle>
                  <span className="text-xs text-muted-foreground">
                    {calculateProgress(stickers).unlocked} из {calculateProgress(stickers).total}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {stickers.map((sticker) => (
                    <div
                      key={sticker.id}
                      className={`aspect-square rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${
                        sticker.unlocked
                          ? "bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20 hover:shadow-md"
                          : "bg-muted/30 border-muted opacity-50"
                      }`}
                    >
                      {sticker.unlocked ? (
                        <>
                          <span className="text-4xl">{sticker.emoji}</span>
                          <span className="text-xs font-medium text-center">{sticker.name}</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-8 h-8 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Заблокировано</span>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
