"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Home, TreePine, Heart, Shield, Sun, Star, Globe, Award, Crown, Sparkles } from "lucide-react"
import { useTranslation } from "@/i18n/provider"

interface FamilyCreationProps {
  onCreateFamily: (code: string) => void
}

export default function FamilyCreation({ onCreateFamily }: FamilyCreationProps) {
  const { t } = useTranslation()
  const [familyName, setFamilyName] = useState("")
  const [selectedEmblem, setSelectedEmblem] = useState(0)

  const EMBLEMS = [
    { icon: Home, name: t("familyCreation.emblemHome") },
    { icon: TreePine, name: t("familyCreation.emblemTree") },
    { icon: Heart, name: t("familyCreation.emblemHeart") },
    { icon: Shield, name: t("familyCreation.emblemShield") },
    { icon: Sun, name: t("familyCreation.emblemSun") },
    { icon: Star, name: t("familyCreation.emblemStar") },
    { icon: Globe, name: t("familyCreation.emblemGlobe") },
    { icon: Award, name: t("familyCreation.emblemAward") },
    { icon: Crown, name: t("familyCreation.emblemCrown") },
    { icon: Sparkles, name: t("familyCreation.emblemSparkle") },
  ]

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
          <h2 className="text-3xl font-bold mb-2">{t("familyCreation.title")}</h2>
          <p className="text-muted-foreground">{t("familyCreation.subtitle")}</p>
        </div>

        <div className="space-y-6">
          {/* Family name input */}
          <div className="space-y-2">
            <Label htmlFor="family-name">{t("familyCreation.familyNameLabel")}</Label>
            <Input
              id="family-name"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              placeholder={t("familyCreation.familyNamePlaceholder")}
              className="text-lg"
            />
          </div>

          {/* Emblem selection */}
          <div className="space-y-3">
            <Label>{t("familyCreation.selectEmblem")}</Label>
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
            {t("familyCreation.createButton")}
          </Button>
        </div>
      </Card>
    </div>
  )
}
