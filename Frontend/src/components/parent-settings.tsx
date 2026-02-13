"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Bell, Moon, Sun, Copy, AlertCircle, Link2, Share2, QrCode, Loader2 } from "lucide-react"
import { useTheme } from "next-themes"
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

interface ParentSettingsProps {
  familyName?: string | null
  familyCode: string
}

export default function ParentSettings({ familyName, familyCode }: ParentSettingsProps) {
  const { theme, setTheme } = useTheme()
  const { t } = useTranslation()
  const { settings, updateSettings, clearAllData, isLoading } = useUserSettings()

  const [copied, setCopied] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)

  const inviteLink = typeof window !== 'undefined' 
    ? `${window.location.origin}/join/${familyCode}`
    : `https://yourapp.com/join/${familyCode}`

  const handleCopyCode = () => {
    navigator.clipboard.writeText(familyCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  const handleShareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: t("parentSettings.shareTitle"),
          text: t("parentSettings.shareText", { familyCode }),
          url: inviteLink,
        })
      } catch (error) {
        console.error('Error sharing:', error)
      }
    } else {
      handleCopyLink()
    }
  }

  const handleSettingChange = (key: string, value: any) => {
    updateSettings({ [key]: value })
  }

  return (
    <div className="space-y-6">
      {/* Подписка */}
      <SubscriptionManager 
        onUpgrade={(tier) => console.log("Upgrade to:", tier)}
      />

      {/* Семья */}
      <Card>
        <CardHeader>
          <CardTitle>{t("family.familyInfo")}</CardTitle>
          <CardDescription>{t("family.familyInfoDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm text-muted-foreground mb-2 block">{t("common.name")}</Label>
            <div className="p-3 bg-muted rounded-lg">
              <p className="font-semibold">{familyName || t("family.title")}</p>
            </div>
          </div>
          
          <div>
            <Label htmlFor="familyCode" className="text-sm text-muted-foreground mb-2 block">
              {t("family.inviteCode")}
            </Label>
            <div className="flex gap-2">
              <Input id="familyCode" value={familyCode} disabled className="font-mono font-bold text-center" />
              <Button onClick={handleCopyCode} variant="outline" size="sm">
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            {copied && <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">✓ {t("family.codeCopied")}</p>}
          </div>

          <div className="border-t pt-4">
            <Label className="text-sm text-muted-foreground mb-2 block flex items-center gap-2">
              <Link2 className="w-4 h-4" />
              {t("family.inviteLink")}
            </Label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input 
                  value={inviteLink} 
                  readOnly 
                  className="text-sm bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950 dark:to-purple-950 border-violet-200 dark:border-violet-800"
                />
                <Button onClick={handleCopyLink} variant="outline" size="sm" className="gap-2">
                  <Copy className="w-4 h-4" />
                  {linkCopied ? "✓" : ""}
                </Button>
              </div>
              {linkCopied && <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">✓ {t("family.linkCopied")}</p>}
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleShareLink} 
                  variant="default"
                  className="flex-1 gap-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
                >
                  <Share2 className="w-4 h-4" />
                  {t("family.shareLink")}
                </Button>
              </div>
              
              <p className="text-xs text-muted-foreground mt-2">
                {t("family.shareCodeHint")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>{t("notifications.title")}</CardTitle>
          <CardDescription>{t("notifications.markAllRead")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-muted-foreground" />
              <div>
                <Label className="font-medium">{t("notifications.enableNotifications")}</Label>
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
              <Label className="font-medium">{t("notifications.soundNotifications")}</Label>
              <p className="text-xs text-muted-foreground">{t("notifications.soundNotificationsDesc")}</p>
            </div>
            <Switch
              checked={settings.soundEnabled}
              onCheckedChange={(value) => handleSettingChange("soundEnabled", value)}
              disabled={!settings.notificationsEnabled}
            />
          </div>

          {settings.notificationsEnabled && (
            <div className="bg-muted/50 border border-border rounded-lg p-3 space-y-3">
              <div>
                <Label htmlFor="nightStart" className="text-sm text-foreground">
                  {t("notifications.nightModeStart")}
                </Label>
                <Input
                  id="nightStart"
                  type="time"
                  value={settings.nightModeStart}
                  onChange={(e) => handleSettingChange("nightModeStart", e.target.value)}
                  className="text-foreground bg-background border-border"
                />
              </div>
              <div>
                <Label htmlFor="nightEnd" className="text-sm text-foreground">
                  {t("notifications.nightModeEnd")}
                </Label>
                <Input
                  id="nightEnd"
                  type="time"
                  value={settings.nightModeEnd}
                  onChange={(e) => handleSettingChange("nightModeEnd", e.target.value)}
                  className="text-foreground bg-background border-border"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {t("notifications.nightModeHint")}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle>{t("settings.appearance")}</CardTitle>
          <CardDescription>{t("settings.theme")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {theme === "dark" ? (
                <Moon className="w-5 h-5 text-slate-400" />
              ) : (
                <Sun className="w-5 h-5 text-amber-500" />
              )}
              <div>
                <Label className="font-medium">{t("settings.theme")}</Label>
                <p className="text-xs text-muted-foreground">
                  {theme === "dark" ? t("settings.themeDark") : t("settings.themeLight")}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="gap-2"
            >
              {theme === "dark" ? (
                <>
                  <Sun className="h-4 w-4" />
                  {t("settings.lightThemeLabel")}
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4" />
                  {t("settings.darkThemeLabel")}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">{t("settings.dangerZone")}</CardTitle>
          <CardDescription>{t("settings.dangerDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full border-destructive text-destructive hover:bg-destructive/5 bg-transparent"
              >
                <AlertCircle className="w-4 h-4 mr-2" />
                {t("settings.clearAllData")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("settings.clearAllDataConfirm")}</DialogTitle>
                <DialogDescription>
                  {t("settings.clearAllDataMessage")}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">{t("settings.whatWillBeDeleted")}</p>
                <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
                  <li>{t("settings.allTasksDeleted")}</li>
                  <li>{t("settings.allRewardsDeleted")}</li>
                  <li>{t("settings.allStatisticsDeleted")}</li>
                  <li>{t("settings.childProfilesDeleted")}</li>
                </ul>
                <Button 
                  variant="destructive" 
                  className="w-full"
                  onClick={clearAllData}
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {t("settings.clearAllData")}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  )
}
