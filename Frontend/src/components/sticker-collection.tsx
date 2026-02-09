"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sparkles, Lock } from "lucide-react"
import { useTranslation } from "@/i18n/provider"

const STICKER_SERIES = {
  animals: [
    { id: 1, emoji: "🦁", name: "stickerCollection.lion", unlocked: true },
    { id: 2, emoji: "🐼", name: "stickerCollection.panda", unlocked: true },
    { id: 3, emoji: "🦊", name: "stickerCollection.fox", unlocked: false },
    { id: 4, emoji: "🐨", name: "stickerCollection.koala", unlocked: true },
    { id: 5, emoji: "🦉", name: "stickerCollection.owl", unlocked: false },
    { id: 6, emoji: "🐸", name: "stickerCollection.frog", unlocked: false },
  ],
  robots: [
    { id: 7, emoji: "🤖", name: "stickerCollection.robot", unlocked: true },
    { id: 8, emoji: "👾", name: "stickerCollection.alien", unlocked: false },
    { id: 9, emoji: "🚀", name: "stickerCollection.rocket", unlocked: true },
    { id: 10, emoji: "⚙️", name: "stickerCollection.mechanism", unlocked: false },
    { id: 11, emoji: "🔋", name: "stickerCollection.battery", unlocked: false },
    { id: 12, emoji: "💻", name: "stickerCollection.computer", unlocked: true },
  ],
  fantasy: [
    { id: 13, emoji: "🦄", name: "stickerCollection.unicorn", unlocked: true },
    { id: 14, emoji: "🐉", name: "stickerCollection.dragon", unlocked: false },
    { id: 15, emoji: "🧙", name: "stickerCollection.wizard", unlocked: false },
    { id: 16, emoji: "👑", name: "stickerCollection.crown", unlocked: true },
    { id: 17, emoji: "⚔️", name: "stickerCollection.sword", unlocked: false },
    { id: 18, emoji: "🏰", name: "stickerCollection.castle", unlocked: true },
  ],
}

export default function StickerCollection() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState("animals")

  const calculateProgress = (series: any[]) => {
    const unlocked = series.filter((s) => s.unlocked).length
    return { unlocked, total: series.length, percent: Math.round((unlocked / series.length) * 100) }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold mb-1">{t("stickers.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("stickers.description")}</p>
        </div>
        <Badge className="bg-accent text-accent-foreground gap-1">
          <Sparkles className="w-3 h-3" />
          {t("stickers.new")}
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="animals">
            {t("stickers.animals")} <span className="ml-1 text-xs">({calculateProgress(STICKER_SERIES.animals).unlocked}/6)</span>
          </TabsTrigger>
          <TabsTrigger value="robots">
            {t("stickers.robots")} <span className="ml-1 text-xs">({calculateProgress(STICKER_SERIES.robots).unlocked}/6)</span>
          </TabsTrigger>
          <TabsTrigger value="fantasy">
            {t("stickers.fantasy")} <span className="ml-1 text-xs">({calculateProgress(STICKER_SERIES.fantasy).unlocked}/6)</span>
          </TabsTrigger>
        </TabsList>

        {Object.entries(STICKER_SERIES).map(([key, stickers]) => (
          <TabsContent key={key} value={key} className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">{t("stickerCollection.seriesPercent", { percent: calculateProgress(stickers).percent })}</CardTitle>
                  <span className="text-xs text-muted-foreground">
                    {t("stickerCollection.outOf", { unlocked: calculateProgress(stickers).unlocked, total: calculateProgress(stickers).total })}
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
                          <span className="text-xs font-medium text-center">{t(sticker.name)}</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-8 h-8 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{t("stickerCollection.locked")}</span>
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
