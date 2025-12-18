"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, Medal, Award, TrendingUp } from "lucide-react"

const MOCK_LEADERBOARD = [
  { name: "Мария", avatar: "👧", xp: 2450, level: 8, trend: "+200" },
  { name: "Иван", avatar: "👦", xp: 1980, level: 7, trend: "+150" },
  { name: "Анна", avatar: "👶", xp: 1650, level: 6, trend: "+180" },
]

export default function Leaderboard() {
  const getMedalIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="w-6 h-6 text-amber-500" />
      case 1:
        return <Medal className="w-6 h-6 text-slate-400" />
      case 2:
        return <Award className="w-6 h-6 text-amber-700" />
      default:
        return null
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          Таблица лидеров
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {MOCK_LEADERBOARD.map((member, index) => (
          <div
            key={index}
            className={`flex items-center justify-between p-4 rounded-xl transition-all hover:scale-102 ${
              index === 0
                ? "bg-gradient-to-r from-amber-50 to-amber-100 border-2 border-amber-200"
                : "bg-muted/50 hover:bg-muted"
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-10 h-10">{getMedalIcon(index)}</div>
              <div className="text-4xl">{member.avatar}</div>
              <div>
                <p className="font-semibold text-base">{member.name}</p>
                <p className="text-sm text-muted-foreground">Уровень {member.level}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-primary">{member.xp} XP</p>
              <div className="flex items-center gap-1 text-green-600 text-sm">
                <TrendingUp className="w-3 h-3" />
                <span>{member.trend}</span>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
