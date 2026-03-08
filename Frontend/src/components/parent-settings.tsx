"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Bell, Moon, Sun, AlertCircle,
  Loader2, Bot, Sparkles, CheckCircle2, Palette, Shield,
  ExternalLink,
} from "lucide-react"
import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"
import { useTranslation } from "@/i18n/provider"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
  { id: "appearance",    labelKey: "parentSettings.tabs.appearance",    Icon: Palette },
  { id: "danger",        labelKey: "parentSettings.tabs.danger",        Icon: Shield },
] as const

type SettingsTab = typeof SETTINGS_TABS[number]["id"]

export default function ParentSettings({ familyName }: ParentSettingsProps) {
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const { t } = useTranslation()
  const { settings, updateSettings, clearAllData, isLoading } = useUserSettings()
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
                active
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50",
                tab.id === "danger" && active && "text-destructive",
              )}
            >
              <tab.Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden sm:inline">{t(tab.labelKey)}</span>
            </button>
          )
        })}
      </nav>

      {/* ═══ TAB: NOTIFICATIONS ═══ */}
      <div className={cn(activeTab === "notifications" ? "block" : "hidden", "space-y-3")}>
        <div className="rounded-xl border border-border/30 bg-card p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Bell className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <Label className="font-medium text-sm">{t("notifications.enableNotifications")}</Label>
                <p className="text-[11px] text-muted-foreground">{t("notifications.taskCompletionDesc")}</p>
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
              <p className="text-[11px] text-muted-foreground">{t("notifications.soundNotificationsDesc")}</p>
            </div>
            <Switch
              checked={settings.soundEnabled}
              onCheckedChange={(value) => handleSettingChange("soundEnabled", value)}
              disabled={!settings.notificationsEnabled}
            />
          </div>

          {settings.notificationsEnabled && (
            <div className="border-t border-border/30 pt-3 space-y-3">
              <div>
                <Label htmlFor="nightStart" className="text-xs text-muted-foreground">{t("notifications.nightModeStart")}</Label>
                <Input
                  id="nightStart"
                  type="time"
                  value={settings.nightModeStart}
                  onChange={(e) => handleSettingChange("nightModeStart", e.target.value)}
                  className="h-9 text-sm mt-1"
                />
              </div>
              <div>
                <Label htmlFor="nightEnd" className="text-xs text-muted-foreground">{t("notifications.nightModeEnd")}</Label>
                <Input
                  id="nightEnd"
                  type="time"
                  value={settings.nightModeEnd}
                  onChange={(e) => handleSettingChange("nightModeEnd", e.target.value)}
                  className="h-9 text-sm mt-1"
                />
              </div>
              <p className="text-[10px] text-muted-foreground">{t("notifications.nightModeHint")}</p>
            </div>
          )}
        </div>
      </div>

      {/* ═══ TAB: AI ═══ */}
      <div className={cn(activeTab === "ai" ? "block" : "hidden", "space-y-3")}>
        <div className="rounded-xl border border-border/30 bg-card p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <Label className="font-medium text-sm">{t("aiControl.enableChat")}</Label>
                <p className="text-[11px] text-muted-foreground">{t("aiControl.enableChatDesc")}</p>
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
                    <p className="text-[11px] text-muted-foreground">{t("aiControl.canCreateTasksDesc")}</p>
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
                    <p className="text-[11px] text-muted-foreground">{t("aiControl.canCreateRewardsDesc")}</p>
                  </div>
                </div>
                <Switch
                  checked={settings.aiCanCreateRewards}
                  onCheckedChange={(value) => handleSettingChange("aiCanCreateRewards", value)}
                />
              </div>

              <div className="border-t border-border/30 pt-3 space-y-2">
                <Label className="font-medium text-sm">{t("aiControl.tone")}</Label>
                <p className="text-[11px] text-muted-foreground">{t("aiControl.toneDesc")}</p>
                <div className="grid grid-cols-3 gap-2">
                  {(["friendly", "educational", "strict"] as const).map((tone) => (
                    <button
                      key={tone}
                      type="button"
                      onClick={() => handleSettingChange("aiTone", tone)}
                      className={cn(
                        "py-2 px-3 rounded-lg border text-xs font-medium transition-all",
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

      {/* ═══ TAB: APPEARANCE ═══ */}
      <div className={cn(activeTab === "appearance" ? "block" : "hidden", "space-y-3")}>
        <div className="flex items-center justify-between rounded-xl border border-border/30 bg-card p-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
              {theme === "dark" ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
            </div>
            <div>
              <Label className="font-medium text-sm">{t("settings.theme")}</Label>
              <p className="text-[11px] text-muted-foreground">
                {theme === "dark" ? t("settings.themeDark") : t("settings.themeLight")}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-lg gap-1.5 text-xs font-semibold"
          >
            {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            {theme === "dark" ? t("settings.lightThemeLabel") : t("settings.darkThemeLabel")}
          </Button>
        </div>
      </div>

      {/* ═══ TAB: DANGER ═══ */}
      <div className={cn(activeTab === "danger" ? "block" : "hidden", "space-y-3")}>
        <div className="rounded-xl border border-destructive/20 bg-card p-4 space-y-3">
          <div>
            <p className="text-sm font-semibold text-destructive">{t("settings.dangerZone")}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{t("settings.dangerDescription")}</p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="w-full border-destructive/40 text-destructive hover:bg-destructive/5 bg-transparent gap-2 text-xs font-semibold"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                {t("settings.clearAllData")}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-base">{t("settings.clearAllDataConfirm")}</DialogTitle>
                <DialogDescription className="text-xs">{t("settings.clearAllDataMessage")}</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">{t("settings.whatWillBeDeleted")}</p>
                <ul className="text-xs space-y-1 text-muted-foreground list-disc list-inside">
                  <li>{t("settings.allTasksDeleted")}</li>
                  <li>{t("settings.allRewardsDeleted")}</li>
                  <li>{t("settings.allStatisticsDeleted")}</li>
                  <li>{t("settings.childProfilesDeleted")}</li>
                </ul>
                <Button 
                  variant="destructive" 
                  size="sm"
                  className="w-full text-xs font-semibold"
                  onClick={clearAllData}
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                  {t("settings.clearAllData")}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  )
}
