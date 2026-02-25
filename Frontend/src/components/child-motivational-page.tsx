"use client"

import { ArrowLeft, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useTranslation } from "@/i18n/provider"

interface ChildMotivationalPageProps {
  onBack: () => void
}

export default function ChildMotivationalPage({ onBack }: ChildMotivationalPageProps) {
  const { t } = useTranslation()

  const motivations = [
    {
      type: "story",
      title: t("childMotivational.storyTitle"),
      content: t("childMotivational.storyContent"),
    },
    {
      type: "tip",
      title: t("childMotivational.tipTitle"),
      content: t("childMotivational.tipContent"),
    },
    {
      type: "praise",
      title: t("childMotivational.praiseTitle"),
      content: t("childMotivational.praiseContent"),
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-gradient-to-r from-primary/10 to-secondary/10 border-b border-border p-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("common.back")}
        </Button>
        <h1 className="text-2xl font-bold flex items-center gap-2 mt-2">
          <Sparkles className="w-5 h-5 text-yellow-500" />
          {t("childMotivational.title")}
        </h1>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-4">
        {motivations.map((item, idx) => (
          <Card key={idx} className="bg-gradient-to-r from-purple-50 to-pink-50">
            <CardContent className="pt-4">
              <p className="font-semibold text-sm">{item.title}</p>
              <p className="text-sm text-muted-foreground mt-2">{item.content}</p>
            </CardContent>
          </Card>
        ))}
      </main>
    </div>
  )
}
