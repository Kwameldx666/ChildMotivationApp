"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { useTranslation } from "@/i18n/provider"

interface ProfileCreationProps {
  role: "parent" | "child"
  onCreateProfile: (profile: { name: string; age?: number; avatar: string }) => void
}

const AVATARS = [
  "👨",
  "👩",
  "🧑",
  "👦",
  "👧",
  "👶",
  "👨‍🦰",
  "👩‍🦰",
  "👨‍🦱",
  "👩‍🦱",
  "👨‍🦳",
  "👩‍🦳",
  "🧒",
  "👱",
  "👴",
  "👵",
  "🧔",
  "🧑‍🦲",
  "👨‍🦲",
  "👩‍🦲",
]

export default function ProfileCreation({ role, onCreateProfile }: ProfileCreationProps) {
  const [name, setName] = useState("")
  const [age, setAge] = useState("")
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0])
  const [showAvatars, setShowAvatars] = useState(false)
  const { t } = useTranslation()

  const handleSubmit = () => {
    if (!name.trim()) return

    onCreateProfile({
      name: name.trim(),
      age: age ? Number.parseInt(age) : undefined,
      avatar: selectedAvatar,
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-purple-100 to-purple-200 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 bg-white shadow-xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">{t("profileCreation.title")}</h2>
          <p className="text-muted-foreground">{t("profileCreation.subtitle")}</p>
        </div>

        <div className="space-y-6">
          {/* Avatar selection */}
          <div className="flex flex-col items-center gap-3">
            <Label>{t("profileCreation.selectAvatar")}</Label>
            <button
              onClick={() => setShowAvatars(!showAvatars)}
              className="w-24 h-24 rounded-full bg-primary/10 hover:bg-primary/20 transition-all flex items-center justify-center text-5xl border-4 border-primary/20 hover:border-primary/40"
            >
              {selectedAvatar}
            </button>

            {showAvatars && (
              <div className="grid grid-cols-6 gap-2 p-4 bg-muted rounded-lg max-h-48 overflow-y-auto">
                {AVATARS.map((avatar, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedAvatar(avatar)
                      setShowAvatars(false)
                    }}
                    className={`w-12 h-12 rounded-full hover:bg-primary/20 transition-all flex items-center justify-center text-2xl ${
                      selectedAvatar === avatar ? "bg-primary/30 ring-2 ring-primary" : "bg-white"
                    }`}
                  >
                    {avatar}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Name field */}
          <div className="space-y-2">
            <Label htmlFor="name">{t("profileCreation.nameRequired")}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("profileCreation.namePlaceholder")}
              className="text-lg"
            />
          </div>

          {/* Age field */}
          <div className="space-y-2">
            <Label htmlFor="age">{t("profileCreation.ageOptional")}</Label>
            <Input
              id="age"
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder={t("profileCreation.agePlaceholder")}
              className="text-lg"
            />
          </div>

          {/* Role badge */}
          <div className="flex justify-center">
            <div
              className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${
                role === "parent"
                  ? "bg-primary/10 text-primary border-2 border-primary/30"
                  : "bg-secondary/10 text-secondary border-2 border-secondary/30"
              }`}
            >
              {role === "parent" ? t("profileCreation.parentRole") : t("profileCreation.childRole")}
            </div>
          </div>

          {/* Submit button */}
          <Button onClick={handleSubmit} disabled={!name.trim()} className="w-full h-12 text-lg" size="lg">
            {t("profileCreation.continue")}
          </Button>
        </div>
      </Card>
    </div>
  )
}
