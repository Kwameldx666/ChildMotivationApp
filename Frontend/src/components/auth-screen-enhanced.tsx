"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Sparkles, Users, UserCircle, Home, Zap } from "lucide-react"

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

const FAMILY_EMBLEMS = ["🏰", "🏡", "🌟", "⭐", "🌈", "🦄", "🐉", "🦅", "🌲", "🌊"]

const AI_SUGGESTIONS = {
  password: "Выбери надёжный пароль из минимум 6 символов, с буквами и цифрами для безопасности!",
  role: "Мы рекомендуем роль Ребёнка для возраста от 6 до 16 лет, и роль Родителя для взрослых.",
  familyName: [
    "Семья Супергероев",
    "Космические Исследователи",
    "Команда Дракона",
    "Лига Справедливости",
    "Семья Викингов",
  ],
}

interface AuthScreenProps {
  onAuth: (userData: {
    user: { email: string; name: string; lastName: string; id: string }
    profile: { name: string; lastName: string; avatar: string; role: "parent" | "child"; age?: number }
    familyCode?: string
    familyName?: string
    familyEmblem?: string
  }) => void
  onBack: () => void
}

export function AuthScreenEnhanced({ onAuth, onBack }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [step, setStep] = useState<"credentials" | "role" | "parent-family" | "child-profile" | "demo">("credentials")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<"parent" | "child" | null>(null)

  // Child-specific fields
  const [childName, setChildName] = useState("")
  const [childLastName, setChildLastName] = useState("")
  const [childAge, setChildAge] = useState(10)
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0])
  const [childFamilyCode, setChildFamilyCode] = useState("")

  // Parent-specific fields
  const [familyName, setFamilyName] = useState("")
  const [selectedEmblem, setSelectedEmblem] = useState(FAMILY_EMBLEMS[0])
  const [showAINames, setShowAINames] = useState(false)

  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // CHANGE: Added demo mode
  const handleDemoMode = () => {
    const demoUser = {
      id: "demo-user-" + Date.now(),
      email: "demo@familytask.com",
      name: "Тест",
      lastName: "Пользователь",
    }

    localStorage.setItem("familyapp_current_user", JSON.stringify(demoUser))
    localStorage.setItem(
      `familyapp_profile_${demoUser.id}`,
      JSON.stringify({
        name: "Тест",
        lastName: "Пользователь",
        avatar: "🧑",
        role: "child",
        age: 12,
      }),
    )
    localStorage.setItem(
      `familyapp_family_${demoUser.id}`,
      JSON.stringify({
        code: "DEMO12",
        name: "Демо Семья",
        emblem: "🏰",
      }),
    )

    onAuth({
      user: demoUser,
      profile: {
        name: "Тест",
        lastName: "Пользователь",
        avatar: "🧑",
        role: "child",
        age: 12,
      },
      familyCode: "DEMO12",
      familyName: "Демо Семья",
      familyEmblem: "🏰",
    })
  }

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!email || !password) {
      setError("Пожалуйста, заполните все поля")
      return
    }

    if (password.length < 6) {
      setError("Пароль должен содержать минимум 6 символов")
      return
    }

    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 500))
    setIsLoading(false)

    if (!isLogin) {
      setStep("role")
    } else {
      // CHANGE: Demo check
      if (email === "demo@example.com" && password === "demo123") {
        handleDemoMode()
        return
      }

      // Login logic
      const users = JSON.parse(localStorage.getItem("familyapp_users") || "[]")
      const user = users.find((u: any) => u.email === email && u.password === password)

      if (user) {
        localStorage.setItem("familyapp_current_user", JSON.stringify(user))
        const profile = JSON.parse(localStorage.getItem(`familyapp_profile_${user.id}`) || "{}")
        const familyData = JSON.parse(localStorage.getItem(`familyapp_family_${user.id}`) || "{}")

        onAuth({
          user,
          profile,
          familyCode: familyData.code,
          familyName: familyData.name,
          familyEmblem: familyData.emblem,
        })
      } else {
        setError("Неверный email или пароль")
      }
    }
  }

  const handleRoleSubmit = () => {
    if (!role) {
      setError("Пожалуйста, выбери роль")
      return
    }

    setError("")

    if (role === "parent") {
      setStep("parent-family")
    } else {
      setStep("child-profile")
    }
  }

  const handleParentFamilySubmit = async () => {
    if (!familyName) {
      setError("Пожалуйста, введи название семьи")
      return
    }

    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 500))
    setIsLoading(false)

    const userId = "user-" + Date.now()
    const newUser = { id: userId, email, password, name: email.split("@")[0], lastName: "" }
    const users = JSON.parse(localStorage.getItem("familyapp_users") || "[]")
    users.push(newUser)
    localStorage.setItem("familyapp_users", JSON.stringify(users))
    localStorage.setItem("familyapp_current_user", JSON.stringify(newUser))

    const generatedFamilyCode = Math.random().toString(36).substring(2, 8).toUpperCase()
    localStorage.setItem(
      `familyapp_profile_${userId}`,
      JSON.stringify({
        name: email.split("@")[0],
        lastName: "",
        avatar: "👨",
        role: "parent",
      }),
    )
    localStorage.setItem(
      `familyapp_family_${userId}`,
      JSON.stringify({ code: generatedFamilyCode, name: familyName, emblem: selectedEmblem }),
    )

    onAuth({
      user: newUser,
      profile: {
        name: email.split("@")[0],
        lastName: "",
        avatar: "👨",
        role: "parent",
      },
      familyCode: generatedFamilyCode,
      familyName,
      familyEmblem: selectedEmblem,
    })
  }

  const handleChildProfileSubmit = async () => {
    if (!childName || !childFamilyCode) {
      setError("Пожалуйста, заполни все поля")
      return
    }

    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 500))
    setIsLoading(false)

    // Verify family code (simplified - in production should check database)
    const userId = "user-" + Date.now()
    const newUser = { id: userId, email, password, name: childName, lastName: childLastName }
    const users = JSON.parse(localStorage.getItem("familyapp_users") || "[]")
    users.push(newUser)
    localStorage.setItem("familyapp_users", JSON.stringify(users))
    localStorage.setItem("familyapp_current_user", JSON.stringify(newUser))

    localStorage.setItem(
      `familyapp_profile_${userId}`,
      JSON.stringify({
        name: childName,
        lastName: childLastName,
        avatar: selectedAvatar,
        role: "child",
        age: childAge,
      }),
    )
    localStorage.setItem(`familyapp_family_${userId}`, JSON.stringify({ code: childFamilyCode }))

    onAuth({
      user: newUser,
      profile: {
        name: childName,
        lastName: childLastName,
        avatar: selectedAvatar,
        role: "child",
        age: childAge,
      },
      familyCode: childFamilyCode,
    })
  }

  // CHANGE: Credentials step with demo button
  if (step === "credentials") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <Button variant="ghost" onClick={onBack} className="mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Назад
            </Button>

            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2">{isLogin ? "Вход" : "Регистрация"}</h2>
              <p className="text-sm text-muted-foreground">
                {isLogin ? "Добро пожаловать обратно!" : "Начни своё приключение"}
              </p>
            </div>

            <form onSubmit={handleCredentialsSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="password">Пароль</Label>
                  <Sparkles className="w-4 h-4 text-yellow-500" />
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Минимум 6 символов"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">{AI_SUGGESTIONS.password}</p>
              </div>

              {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">{error}</div>}

              <Button type="submit" className="w-full bg-gradient-to-r from-primary to-secondary" disabled={isLoading}>
                {isLoading ? "Загрузка..." : isLogin ? "Вход" : "Регистрация"}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Или</span>
              </div>
            </div>

            {/* CHANGE: Demo mode button */}
            <Button onClick={handleDemoMode} variant="outline" className="w-full mb-4 bg-transparent">
              <Zap className="mr-2 h-4 w-4" />
              Попробовать демо
            </Button>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                {isLogin ? "Нет аккаунта? " : "Уже есть аккаунт? "}
                <button
                  onClick={() => {
                    setIsLogin(!isLogin)
                    setError("")
                  }}
                  className="text-primary font-medium hover:underline"
                >
                  {isLogin ? "Создай" : "Войди"}
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // CHANGE: Role selection with AI suggestion
  if (step === "role") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="pt-6">
            <Button variant="ghost" onClick={() => setStep("credentials")} className="mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Назад
            </Button>

            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Выбери свою роль</h2>
              <div className="bg-blue-50 p-3 rounded-lg mb-4 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-yellow-500 mt-1 flex-shrink-0" />
                <p className="text-sm text-blue-900">{AI_SUGGESTIONS.role}</p>
              </div>
              <p className="text-sm text-red-600 font-semibold">⚠️ Роль нельзя изменить позже, выбери внимательно!</p>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <button
                onClick={() => setRole("parent")}
                className={`p-6 rounded-lg border-2 transition-all ${
                  role === "parent" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                }`}
              >
                <Users className="w-12 h-12 mx-auto mb-3 text-primary" />
                <h3 className="font-bold mb-2">Родитель</h3>
                <p className="text-xs text-muted-foreground">
                  Создавай задания, управляй наградами и следи за прогрессом
                </p>
              </button>

              <button
                onClick={() => setRole("child")}
                className={`p-6 rounded-lg border-2 transition-all ${
                  role === "child" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                }`}
              >
                <UserCircle className="w-12 h-12 mx-auto mb-3 text-secondary" />
                <h3 className="font-bold mb-2">Ребёнок</h3>
                <p className="text-xs text-muted-foreground">Выполняй задания, получай награды и добивайся целей</p>
              </button>
            </div>

            {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded mb-4">{error}</div>}

            <Button onClick={handleRoleSubmit} className="w-full bg-gradient-to-r from-primary to-secondary">
              Продолжить
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // CHANGE: Parent family creation with AI name suggestions
  if (step === "parent-family") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <Button variant="ghost" onClick={() => setStep("role")} className="mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Назад
            </Button>

            <div className="text-center mb-6">
              <Home className="w-12 h-12 mx-auto mb-3 text-primary" />
              <h2 className="text-2xl font-bold mb-2">Создай семью</h2>
              <p className="text-sm text-muted-foreground">Дай ей название и выбери эмблему</p>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Название семьи</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowAINames(!showAINames)}
                    className="h-auto py-0"
                  >
                    <Sparkles className="w-4 h-4 text-yellow-500" />
                  </Button>
                </div>
                <Input placeholder="Семья Иванова" value={familyName} onChange={(e) => setFamilyName(e.target.value)} />

                {showAINames && (
                  <div className="mt-2 space-y-1">
                    {AI_SUGGESTIONS.familyName.map((name, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setFamilyName(name)
                          setShowAINames(false)
                        }}
                        className="block w-full text-left text-xs p-2 rounded hover:bg-primary/10 text-primary"
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <Label className="mb-3 block">Эмблема семьи</Label>
                <div className="grid grid-cols-5 gap-2">
                  {FAMILY_EMBLEMS.map((emblem) => (
                    <button
                      key={emblem}
                      onClick={() => setSelectedEmblem(emblem)}
                      className={`p-3 rounded-lg border-2 text-2xl transition-all ${
                        selectedEmblem === emblem
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      {emblem}
                    </button>
                  ))}
                </div>
              </div>

              {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">{error}</div>}

              <Button
                onClick={handleParentFamilySubmit}
                className="w-full bg-gradient-to-r from-primary to-secondary"
                disabled={isLoading}
              >
                {isLoading ? "Создаётся..." : "Создать семью"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // CHANGE: Child profile with age wheel selector
  if (step === "child-profile") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <Button variant="ghost" onClick={() => setStep("role")} className="mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Назад
            </Button>

            <div className="text-center mb-6">
              <div className="text-5xl mb-3">{selectedAvatar}</div>
              <h2 className="text-2xl font-bold mb-2">Создай профиль</h2>
              <p className="text-sm text-muted-foreground">Заполни информацию о себе</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Имя</Label>
                <Input placeholder="Иван" value={childName} onChange={(e) => setChildName(e.target.value)} />
              </div>

              <div>
                <Label>Фамилия</Label>
                <Input placeholder="Иванов" value={childLastName} onChange={(e) => setChildLastName(e.target.value)} />
              </div>

              <div>
                <Label>Возраст: {childAge}</Label>
                <input
                  type="range"
                  min="6"
                  max="18"
                  value={childAge}
                  onChange={(e) => setChildAge(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <Label className="mb-3 block">Выбери аватар</Label>
                <div className="grid grid-cols-5 gap-2">
                  {AVATARS.map((avatar) => (
                    <button
                      key={avatar}
                      onClick={() => setSelectedAvatar(avatar)}
                      className={`p-2 rounded-lg border-2 text-2xl transition-all ${
                        selectedAvatar === avatar
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      {avatar}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label>Код семьи</Label>
                <Input
                  placeholder="ABC123"
                  value={childFamilyCode}
                  onChange={(e) => setChildFamilyCode(e.target.value.toUpperCase())}
                  maxLength={6}
                />
              </div>

              {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">{error}</div>}

              <Button
                onClick={handleChildProfileSubmit}
                className="w-full bg-linear-to-r from-primary to-secondary"
                disabled={isLoading}
              >
                {isLoading ? "Присоединяется..." : "Присоединиться к семье"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}
