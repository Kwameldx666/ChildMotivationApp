"use client"

import { ArrowLeft, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useTranslation } from "@/i18n/provider"

interface UpdateHistoryPageProps {
  onBack: () => void
}

export default function UpdateHistoryPage({ onBack }: UpdateHistoryPageProps) {
  const { t } = useTranslation()
  const updates = [
    {
      date: t("updateHistory.dateDec20"),
      changes: [
        { field: t("updateHistory.fieldName"), old: t("updateHistory.oldWashPlates"), new: t("updateHistory.newWashDishes"), by: t("updateHistory.byParent") },
        { field: t("updateHistory.fieldRewardXP"), old: "50", new: "100", by: t("updateHistory.byParent") },
      ],
    },
    {
      date: t("updateHistory.dateDec18"),
      changes: [{ field: t("updateHistory.fieldDifficulty"), old: t("updateHistory.stars2"), new: t("updateHistory.stars3"), by: t("updateHistory.byParent") }],
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
          <FileText className="w-5 h-5" />
          {t("updateHistory.title")}
        </h1>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {updates.map((update, idx) => (
          <div key={idx}>
            <h3 className="font-semibold mb-3">{update.date}</h3>
            <div className="space-y-2">
              {update.changes.map((change, cidx) => (
                <Card key={cidx}>
                  <CardContent className="pt-4">
                    <p className="font-medium text-sm">{change.field}</p>
                    <div className="flex items-center justify-between mt-2 text-xs">
                      <div>
                        <p className="text-muted-foreground line-through">{change.old}</p>
                        <p className="text-green-600 font-medium">{change.new}</p>
                      </div>
                      <p className="text-muted-foreground">{change.by}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </main>
    </div>
  )
}
