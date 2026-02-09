"use client"

import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useTranslation } from "@/i18n/provider"

interface FamilyTimelinePageProps {
  onBack: () => void
}

export default function FamilyTimelinePage({ onBack }: FamilyTimelinePageProps) {
  const { t } = useTranslation()
  const events = [
    { type: "achievement", user: t("familyTimeline.userIvan"), text: t("familyTimeline.unlockedAchievement"), time: t("familyTimeline.hoursAgo2") },
    { type: "reward", user: t("familyTimeline.userMaria"), text: t("familyTimeline.boughtReward"), time: t("familyTimeline.hoursAgo4") },
    { type: "task", user: t("familyTimeline.userParent"), text: t("familyTimeline.createdTask"), time: t("familyTimeline.yesterday") },
    { type: "level", user: t("familyTimeline.userIvan"), text: t("familyTimeline.reachedLevel"), time: t("familyTimeline.yesterday") },
  ]

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-gradient-to-r from-primary/10 to-secondary/10 border-b border-border p-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("common.back")}
        </Button>
        <h1 className="text-2xl font-bold">{t("familyTimeline.title")}</h1>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="space-y-4">
          {events.map((event, idx) => (
            <Card key={idx}>
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium">
                      <span className="text-primary">{event.user}</span> {event.text}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{event.time}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
