"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Bell, Moon, Copy, AlertCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface ParentSettingsProps {
  familyName?: string | null
  familyCode: string
}

export default function ParentSettings({ familyName, familyCode }: ParentSettingsProps) {
  const [settings, setSettings] = useState({
    notificationsEnabled: true,
    darkMode: false,
    soundEnabled: true,
    nightModeStart: "22:00",
    nightModeEnd: "08:00",
  })

  const [copied, setCopied] = useState(false)

  const handleCopyCode = () => {
    navigator.clipboard.writeText(familyCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSettingChange = (key: string, value: any) => {
    setSettings({ ...settings, [key]: value })
  }

  return (
    <div className="space-y-6">
      {/* Семья */}
      <Card>
        <CardHeader>
          <CardTitle>Информация о семье</CardTitle>
          <CardDescription>Данные вашей семьи</CardDescription>
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
            {copied && <p className="text-xs text-accent mt-1">Скопировано в буфер обмена!</p>}
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
              <Moon className="w-4 h-4 text-muted-foreground" />
              <div>
                <Label className="font-medium">Темная тема</Label>
                <p className="text-xs text-muted-foreground">Переключиться на темный режим</p>
              </div>
            </div>
            <Switch checked={settings.darkMode} onCheckedChange={(value) => handleSettingChange("darkMode", value)} />
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
