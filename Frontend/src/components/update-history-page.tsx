"use client"

import { ArrowLeft, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface UpdateHistoryPageProps {
  onBack: () => void
}

export default function UpdateHistoryPage({ onBack }: UpdateHistoryPageProps) {
  const updates = [
    {
      date: "20 Дек",
      changes: [
        { field: "Название", old: "Помыть тарелки", new: "Помыть посуду", by: "Родитель" },
        { field: "Награда XP", old: "50", new: "100", by: "Родитель" },
      ],
    },
    {
      date: "18 Дек",
      changes: [{ field: "Сложность", old: "2 звезды", new: "3 звезды", by: "Родитель" }],
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-gradient-to-r from-primary/10 to-secondary/10 border-b border-border p-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Назад
        </Button>
        <h1 className="text-2xl font-bold flex items-center gap-2 mt-2">
          <FileText className="w-5 h-5" />
          История изменений
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
