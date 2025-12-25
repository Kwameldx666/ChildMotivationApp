"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Home, TreePine, Heart, Shield, Sun, Star, Globe, Award, Crown, Sparkles } from "lucide-react"

const EMBLEMS = [
  { icon: Home, name: "Дом" },
  { icon: TreePine, name: "Дерево" },
  { icon: Heart, name: "Сердце" },
  { icon: Shield, name: "Герб" },
  { icon: Sun, name: "Солнце" },
  { icon: Star, name: "Звезда" },
  { icon: Globe, name: "Глобус" },
  { icon: Award, name: "Награда" },
  { icon: Crown, name: "Корона" },
  { icon: Sparkles, name: "Искра" },
]

interface FamilyCreationProps {
  onCreateFamily: (code: string) => void
}

export default function FamilyCreation({ onCreateFamily }: FamilyCreationProps) {
  const [familyName, setFamilyName] = useState("")
  const [selectedEmblem, setSelectedEmblem] = useState(0)

  const handleCreate = () => {
    if (!familyName.trim()) return

    // Generate a random family code
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    onCreateFamily(code)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-purple-100 to-purple-200 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg p-8 bg-white shadow-xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">Создай семью</h2>
          <p className="text-muted-foreground">Как называется ваша семья?</p>
        </div>

        <div className="space-y-6">
          {/* Family name input */}
          <div className="space-y-2">
            <Label htmlFor="family-name">Название семьи</Label>
            <Input
              id="family-name"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              placeholder="Например: Семья Ивановых"
              className="text-lg"
            />
          </div>

          {/* Emblem selection */}
          <div className="space-y-3">
            <Label>Выберите эмблему семьи</Label>
            <div className="grid grid-cols-5 gap-3">
              {EMBLEMS.map((emblem, idx) => {
                const Icon = emblem.icon
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedEmblem(idx)}
                    className={`aspect-square rounded-xl flex items-center justify-center transition-all ${
                      selectedEmblem === idx
                        ? "bg-primary text-primary-foreground scale-110 shadow-lg ring-4 ring-primary/30"
                        : "bg-muted hover:bg-muted/80 hover:scale-105"
                    }`}
                    title={emblem.name}
                  >
                    <Icon className="w-8 h-8" />
                  </button>
                )
              })}
            </div>
          </div>

          {/* Submit button */}
          <Button onClick={handleCreate} disabled={!familyName.trim()} className="w-full h-12 text-lg" size="lg">
            Создать семью
          </Button>
        </div>
      </Card>
    </div>
  )
}
