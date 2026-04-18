"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Bell,
  Bot, Sparkles, CheckCircle2,
} from "lucide-react"
import { useTranslation } from "@/i18n/provider"
import SubscriptionManager from "./subscription-manager"
import { useUserSettings } from "@/hooks/use-user-settings"
import { cn } from "@/lib/utils"

interface ParentSettingsProps {
  familyName?: string | null
}

/* ── Sub-tabs ── */
const SETTINGS_TABS = [
  { id: "notifications", labelKey: "parentSettings.tabs.notifications", Icon: Bell },
  { id: "ai",            labelKey: "parentSettings.tabs.ai",            Icon: Bot },
] as const

type SettingsTab = typeof SETTINGS_TABS[number]["id"]

export default function ParentSettings({ familyName: _familyName }: ParentSettingsProps) {
  const { t } = useTranslation()
  const { settings, updateSettings } = useUserSettings()
  const [activeTab, setActiveTab] = useState<SettingsTab>("notifications")

  const handleSettingChange = (key: string, value: any) => {
    updateSettings({ [key]: value })
  }

  return (
    <div className="space-y-5">

      {/* ═══ Subscription (always visible at top) ═══ */}
      <SubscriptionManager onUpgrade={(tier) => console.log("Upgrade to:", tier)} />

      {/* ═══ SUB-TAB NAVIGATION ═══ */}
      <nav className="flex items-center gap-1 p-1 rounded-xl bg-muted/40 border border-border/30 overflow-x-auto">
        {SETTINGS_TABS.map((tab) => {
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap",
                "flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all whitespace-nowrap",
                active
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50",
              )}
            >
              <tab.Icon className="h-4 w-4 shrink-0" />
              <span className="inline">{t(tab.labelKey)}</span>
            </button>
          )
        })}
      </nav>

      {/* ═══ TAB: NOTIFICATIONS ═══ */}
      <div className={cn(activeTab === "notifications" ? "block" : "hidden", "space-y-3")}>
        <div className="rounded-xl border border-border/30 bg-card p-5 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Bell className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <Label className="font-medium text-sm">{t("notifications.enableNotifications")}</Label>
                <p className="text-xs text-muted-foreground">{t("notifications.taskCompletionDesc")}</p>
              </div>
            </div>
            <Switch
              checked={settings.notificationsEnabled}
              onCheckedChange={(value) => handleSettingChange("notificationsEnabled", value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium text-sm">{t("notifications.soundNotifications")}</Label>
              <p className="text-xs text-muted-foreground">{t("notifications.soundNotificationsDesc")}</p>
            </div>
            <Switch
              checked={settings.soundEnabled}
              onCheckedChange={(value) => handleSettingChange("soundEnabled", value)}
              disabled={!settings.notificationsEnabled}
            />
          </div>

          <div className="border-t border-border/30 pt-3 space-y-3">
            <p className="text-xs font-medium text-muted-foreground">{t("notifications.categoriesTitle")}</p>

            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium text-sm">{t("notifications.taskNotifications")}</Label>
                <p className="text-xs text-muted-foreground">{t("notifications.taskNotificationsDesc")}</p>
              </div>
              <Switch
                checked={settings.taskNotificationsEnabled}
                onCheckedChange={(value) => handleSettingChange("taskNotificationsEnabled", value)}
                disabled={!settings.notificationsEnabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium text-sm">{t("notifications.rewardNotifications")}</Label>
                <p className="text-xs text-muted-foreground">{t("notifications.rewardNotificationsDesc")}</p>
              </div>
              <Switch
                checked={settings.rewardNotificationsEnabled}
                onCheckedChange={(value) => handleSettingChange("rewardNotificationsEnabled", value)}
                disabled={!settings.notificationsEnabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium text-sm">{t("notifications.achievementNotifications")}</Label>
                <p className="text-xs text-muted-foreground">{t("notifications.achievementNotificationsDesc")}</p>
              </div>
              <Switch
                checked={settings.achievementNotificationsEnabled}
                onCheckedChange={(value) => handleSettingChange("achievementNotificationsEnabled", value)}
                disabled={!settings.notificationsEnabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium text-sm">{t("notifications.systemNotifications")}</Label>
                <p className="text-xs text-muted-foreground">{t("notifications.systemNotificationsDesc")}</p>
              </div>
              <Switch
                checked={settings.systemNotificationsEnabled}
                onCheckedChange={(value) => handleSettingChange("systemNotificationsEnabled", value)}
                disabled={!settings.notificationsEnabled}
              />
            </div>
          </div>

          {settings.notificationsEnabled && (
            <div className="border-t border-border/30 pt-3 space-y-3">
              <div>
                <Label htmlFor="nightStart" className="text-sm text-muted-foreground">{t("notifications.nightModeStart")}</Label>
                <Input
                  id="nightStart"
                  type="time"
                  value={settings.nightModeStart}
                  onChange={(e) => handleSettingChange("nightModeStart", e.target.value)}
                  className="h-10 text-sm mt-1"
                />
              </div>
              <div>
                <Label htmlFor="nightEnd" className="text-sm text-muted-foreground">{t("notifications.nightModeEnd")}</Label>
                <Input
                  id="nightEnd"
                  type="time"
                  value={settings.nightModeEnd}
                  onChange={(e) => handleSettingChange("nightModeEnd", e.target.value)}
                  className="h-10 text-sm mt-1"
                />
              </div>
              <p className="text-xs text-muted-foreground">{t("notifications.nightModeHint")}</p>
            </div>
          )}
        </div>
      </div>

      {/* ═══ TAB: AI ═══ */}
      <div className={cn(activeTab === "ai" ? "block" : "hidden", "space-y-3")}>
        <div className="rounded-xl border border-border/30 bg-card p-5 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <Label className="font-medium text-sm">{t("aiControl.enableChat")}</Label>
                <p className="text-xs text-muted-foreground">{t("aiControl.enableChatDesc")}</p>
              </div>
            </div>
            <Switch
              checked={settings.aiChatEnabled}
              onCheckedChange={(value) => handleSettingChange("aiChatEnabled", value)}
            />
          </div>

          {settings.aiChatEnabled && (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div>
                    <Label className="font-medium text-sm">{t("aiControl.canCreateTasks")}</Label>
                    <p className="text-xs text-muted-foreground">{t("aiControl.canCreateTasksDesc")}</p>
                  </div>
                </div>
                <Switch
                  checked={settings.aiCanCreateTasks}
                  onCheckedChange={(value) => handleSettingChange("aiCanCreateTasks", value)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div>
                    <Label className="font-medium text-sm">{t("aiControl.canCreateRewards")}</Label>
                    <p className="text-xs text-muted-foreground">{t("aiControl.canCreateRewardsDesc")}</p>
                  </div>
                </div>
                <Switch
                  checked={settings.aiCanCreateRewards}
                  onCheckedChange={(value) => handleSettingChange("aiCanCreateRewards", value)}
                />
              </div>

              <div className="border-t border-border/30 pt-3 space-y-2">
                <Label className="font-medium text-sm">{t("aiControl.tone")}</Label>
                <p className="text-xs text-muted-foreground">{t("aiControl.toneDesc")}</p>
                <div className="grid grid-cols-3 gap-2">
                  {(["friendly", "educational", "strict"] as const).map((tone) => (
                    <button
                      key={tone}
                      type="button"
                      onClick={() => handleSettingChange("aiTone", tone)}
                      className={cn(
                        "py-2.5 px-3 rounded-lg border text-sm font-medium transition-all",
                        settings.aiTone === tone
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-background text-muted-foreground hover:border-primary/40",
                      )}
                    >
                      {t(`aiControl.tone_${tone}`)}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
