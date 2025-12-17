"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Edit2, Trash2, Bell, BellOff, Copy, Check } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface Child {
  id: string
  childId: string
  name: string
  lastName: string
  avatar: string
  age: number
  notificationsEnabled: boolean
}

interface ChildrenManagementProps {
  familyCode: string
}

function generateChildId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let result = ""
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export default function ChildrenManagement({ familyCode }: ChildrenManagementProps) {
  const [children, setChildren] = useState<Child[]>([
    {
      id: "1",
      childId: "A3K9M2",
      name: "Иван",
      lastName: "Иванов",
      avatar: "👦",
      age: 8,
      notificationsEnabled: true,
    },
    {
      id: "2",
      childId: "B7L2N5",
      name: "Мария",
      lastName: "Иванова",
      avatar: "👧",
      age: 11,
      notificationsEnabled: true,
    },
  ])

  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ name: "", lastName: "", age: "" })
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleAdd = () => {
    if (formData.name && formData.lastName && formData.age) {
      const newChild: Child = {
        id: Date.now().toString(),
        childId: generateChildId(),
        name: formData.name,
        lastName: formData.lastName,
        avatar: "👤",
        age: Number.parseInt(formData.age),
        notificationsEnabled: true,
      }
      setChildren([...children, newChild])
      setFormData({ name: "", lastName: "", age: "" })
      setIsOpen(false)
    }
  }

  const handleDelete = (id: string) => {
    setChildren(children.filter((child) => child.id !== id))
  }

  const toggleNotifications = (id: string) => {
    setChildren(
      children.map((child) =>
        child.id === id ? { ...child, notificationsEnabled: !child.notificationsEnabled } : child,
      ),
    )
  }

  const handleCopyId = (childId: string) => {
    navigator.clipboard.writeText(childId)
    setCopiedId(childId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Добавить ребёнка
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Добавить ребёнка</DialogTitle>
              <DialogDescription>Введите данные ребёнка, чтобы добавить его в семью</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Имя</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Иван"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Фамилия</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Иванов"
                />
              </div>
              <div>
                <Label htmlFor="age">Возраст</Label>
                <Input
                  id="age"
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  placeholder="8"
                  min="1"
                  max="18"
                />
              </div>
              <Button onClick={handleAdd} className="w-full">
                Добавить
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {children.length === 0 ? (
        <Card>
          <CardContent className="pt-12 text-center">
            <p className="text-muted-foreground mb-4">Нет добавленных детей</p>
            <p className="text-sm text-muted-foreground">
              Добавьте первого ребёнка, чтобы начать использовать приложение
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {children.map((child) => (
            <Card key={child.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-3xl">
                      {child.avatar}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">
                        {child.name} {child.lastName}
                      </h3>
                      <p className="text-sm text-muted-foreground">{child.age} лет</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs bg-secondary/20 px-2 py-1 rounded font-mono font-semibold">
                          ID: {child.childId}
                        </span>
                        <button
                          onClick={() => handleCopyId(child.childId)}
                          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                          title="Скопировать ID"
                        >
                          {copiedId === child.childId ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => toggleNotifications(child.id)}
                      title={child.notificationsEnabled ? "Отключить уведомления" : "Включить уведомления"}
                    >
                      {child.notificationsEnabled ? (
                        <Bell className="w-4 h-4 text-accent" />
                      ) : (
                        <BellOff className="w-4 h-4 text-muted-foreground" />
                      )}
                    </Button>
                    <Button size="icon" variant="ghost">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(child.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
