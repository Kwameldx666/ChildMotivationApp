"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Bell, Moon, Sun, Copy, AlertCircle, Link2, Share2, QrCode } from "lucide-react"
import { useTheme } from "next-themes"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import SubscriptionManager from "./subscription-manager"

interface ParentSettingsProps {
  familyName?: string | null
  familyCode: string
}

export default function ParentSettings({ familyName, familyCode }: ParentSettingsProps) {
  const { theme, setTheme } = useTheme()
  const [settings, setSettings] = useState({
    notificationsEnabled: true,
    soundEnabled: true,
    nightModeStart: "22:00",
    nightModeEnd: "08:00",
  })

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
          title: 'Присоединяйся к нашей семье!',
          text: `Привет! Присоединяйся к нашей семье в приложении Family Tasks. Код семьи: ${familyCode}`,
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
    setSettings({ ...settings, [key]: value })
  }

  return (
    <div className="space-y-6">
      {/* Подписка */}
      <SubscriptionManager 
        currentTier="free" 
        onUpgrade={(tier) => console.log("Upgrade to:", tier)}
      />

      {/* Семья */}
      <Card>
        <CardHeader>
          <CardTitle>Информация о семье</CardTitle>
          <CardDescription>Данные вашей семьи и приглашение детей</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm text-muted-foreground mb-2 block">Название семьи</Label>
            <div className="p-3 bg-muted rounded-lg">
              <p className="font-semibold">{familyName || "Семья"}</p>
            </div>
          </div>
          
          <div>
            <Label htmlFor="familyCode" className="text-sm text-muted-foreground mb-2 block">
              Код для приглашения детей
            </Label>
            <div className="flex gap-2">
              <Input id="familyCode" value={familyCode} disabled className="font-mono font-bold text-center" />
              <Button onClick={handleCopyCode} variant="outline" size="sm">
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            {copied && <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">✓ Скопировано!</p>}
          </div>

          <div className="border-t pt-4">
            <Label className="text-sm text-muted-foreground mb-2 block flex items-center gap-2">
              <Link2 className="w-4 h-4" />
              Ссылка-приглашение
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
              {linkCopied && <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">✓ Ссылка скопирована!</p>}
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleShareLink} 
                  variant="default"
                  className="flex-1 gap-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
                >
                  <Share2 className="w-4 h-4" />
                  Поделиться ссылкой
                </Button>
              </div>
              
              <p className="text-xs text-muted-foreground mt-2">
                💡 Отправьте эту ссылку ребёнку - он автоматически присоединится к семье при переходе
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Уведомления */}
      <Card>
        <CardHeader>
          <CardTitle>Уведомления</CardTitle>
          <CardDescription>Управляйте уведомлениями приложения</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-muted-foreground" />
              <div>
                <Label className="font-medium">Включить уведомления</Label>
                <p className="text-xs text-muted-foreground">Получайте уведомления о выполнении задач</p>
              </div>
            </div>
            <Switch
              checked={settings.notificationsEnabled}
              onCheckedChange={(value) => handleSettingChange("notificationsEnabled", value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Звуковые уведомления</Label>
              <p className="text-xs text-muted-foreground">Включить звук при уведомлениях</p>
            </div>
            <Switch
              checked={settings.soundEnabled}
              onCheckedChange={(value) => handleSettingChange("soundEnabled", value)}
              disabled={!settings.notificationsEnabled}
            />
          </div>

          {settings.notificationsEnabled && (
            <div className="bg-accent/10 border border-accent rounded-lg p-3 space-y-3">
              <div>
                <Label htmlFor="nightStart" className="text-sm">
                  Ночной режим начинается
                </Label>
                <Input
                  id="nightStart"
                  type="time"
                  value={settings.nightModeStart}
                  onChange={(e) => handleSettingChange("nightModeStart", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="nightEnd" className="text-sm">
                  Ночной режим заканчивается
                </Label>
                <Input
                  id="nightEnd"
                  type="time"
                  value={settings.nightModeEnd}
                  onChange={(e) => handleSettingChange("nightModeEnd", e.target.value)}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                В ночном режиме уведомления будут приходить только срочные
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Оформление */}
      <Card>
        <CardHeader>
          <CardTitle>Оформление</CardTitle>
          <CardDescription>Измените внешний вид приложения</CardDescription>
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
                <Label className="font-medium">Тема оформления</Label>
                <p className="text-xs text-muted-foreground">
                  {theme === "dark" ? "Темная тема включена" : "Светлая тема включена"}
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
                  Светлая
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4" />
                  Тёмная
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Опасные действия */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">Опасные действия</CardTitle>
          <CardDescription>Действия, которые нельзя отменить</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full border-destructive text-destructive hover:bg-destructive/5 bg-transparent"
              >
                <AlertCircle className="w-4 h-4 mr-2" />
                Очистить все данные
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Вы уверены?</DialogTitle>
                <DialogDescription>
                  Это действие удалит все данные вашей семьи. Это нельзя будет отменить.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Будут удалены:</p>
                <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
                  <li>Все задачи</li>
                  <li>Все награды</li>
                  <li>Вся статистика</li>
                  <li>Профили детей</li>
                </ul>
                <Button variant="destructive" className="w-full">
                  Очистить все данные
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  )
}
