"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Lock, Clock, ShoppingBag } from "lucide-react"
import { useTranslation } from "@/i18n/provider"
import { useUserSettings } from "@/hooks/use-user-settings"

interface ParentalControlPageProps {
  onBack: () => void
}

export default function ParentalControlPage({ onBack }: ParentalControlPageProps) {
  const { settings, updateSettings } = useUserSettings()
  const [nightMode, setNightMode] = useState({ enabled: settings.notificationsEnabled, start: settings.nightModeStart, end: settings.nightModeEnd })
  const [timeLimit, setTimeLimit] = useState({ enabled: settings.timeLimitEnabled, minutes: settings.timeLimitMinutes })
  const [spendingLimit, setSpendingLimit] = useState({ enabled: settings.spendingLimitEnabled, pointsPerDay: settings.spendingLimitPointsPerDay })
  const [saved, setSaved] = useState(false)
  const { t } = useTranslation()

  const handleSave = () => {
    updateSettings({
      notificationsEnabled: nightMode.enabled,
      nightModeStart: nightMode.start,
      nightModeEnd: nightMode.end,
      timeLimitEnabled: timeLimit.enabled,
      timeLimitMinutes: Math.max(0, timeLimit.minutes || 0),
      spendingLimitEnabled: spendingLimit.enabled,
      spendingLimitPointsPerDay: Math.max(0, spendingLimit.pointsPerDay || 0),
    })
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1500)
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-gradient-to-r from-primary/10 to-secondary/10 border-b border-border p-4">
        <Button variant="ghost" onClick={onBack} className="mb-2">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("common.back")}
        </Button>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Lock className="w-5 h-5" />
          {t("parentalControl.title")}
        </h1>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold">{t("parentalControl.nightMode")}</h3>
                <p className="text-xs text-muted-foreground">{t("parentalControl.nightModeDescription")}</p>
              </div>
              <input
                type="checkbox"
                checked={nightMode.enabled}
                onChange={(e) => setNightMode({ ...nightMode, enabled: e.target.checked })}
                className="w-5 h-5"
              />
            </div>
            {nightMode.enabled && (
              <div className="space-y-3">
                <div>
                  <label className="text-sm">{t("parentalControl.from")}</label>
                  <input
                    type="time"
                    value={nightMode.start}
                    onChange={(e) => setNightMode({ ...nightMode, start: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="text-sm">{t("parentalControl.to")}</label>
                  <input
                    type="time"
                    value={nightMode.end}
                    onChange={(e) => setNightMode({ ...nightMode, end: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {t("parentalControl.timeLimit")}
                </h3>
                <p className="text-xs text-muted-foreground">{t("parentalControl.maxMinutesPerDay")}</p>
              </div>
              <input
                type="checkbox"
                checked={timeLimit.enabled}
                onChange={(e) => setTimeLimit({ ...timeLimit, enabled: e.target.checked })}
                className="w-5 h-5"
              />
            </div>
            {timeLimit.enabled && (
              <input
                type="number"
                value={timeLimit.minutes}
                onChange={(e) => setTimeLimit({ ...timeLimit, minutes: Number(e.target.value) })}
                className="w-full px-3 py-2 border rounded"
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4" />
                  {t("parentalControl.spendingLimit")}
                </h3>
                <p className="text-xs text-muted-foreground">{t("parentalControl.maxPointsPerDay")}</p>
              </div>
              <input
                type="checkbox"
                checked={spendingLimit.enabled}
                onChange={(e) => setSpendingLimit({ ...spendingLimit, enabled: e.target.checked })}
                className="w-5 h-5"
              />
            </div>
            {spendingLimit.enabled && (
              <input
                type="number"
                value={spendingLimit.pointsPerDay}
                onChange={(e) => setSpendingLimit({ ...spendingLimit, pointsPerDay: Number(e.target.value) })}
                className="w-full px-3 py-2 border rounded"
              />
            )}
          </CardContent>
        </Card>

        <Button className="w-full bg-gradient-to-r from-primary to-secondary" onClick={handleSave}>
          {saved ? t("common.saved") : t("parentalControl.saveSettings")}
        </Button>
      </main>
    </div>
  )
}
