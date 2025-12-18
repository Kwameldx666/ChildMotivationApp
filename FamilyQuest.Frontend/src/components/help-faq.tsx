"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ChevronDown, Search, HelpCircle } from "lucide-react"

interface FAQ {
  id: string
  question: string
  answer: string
  category: string
}

const FAQS: FAQ[] = [
  {
    id: "1",
    question: "Как присоединиться ребёнку?",
    answer:
      "Ребёнок должен создать аккаунт и выбрать роль. После выбора роли 'Ребёнок' ему нужно будет ввести 6-символьный код семьи, который предоставил родитель. Код можно найти в настройках приложения родителя.",
    category: "Регистрация",
  },
  {
    id: "2",
    question: "Как работают задачи?",
    answer:
      "Родитель создаёт задачу с описанием, устанавливает сложность (1-5 звёзд) и выбирает способ проверки (фото или чек-лист). Ребёнок выполняет задачу и отправляет её на проверку. После одобрения родителем ребёнок получает очки и опыт.",
    category: "Задачи",
  },
  {
    id: "3",
    question: "Как ребёнок может заработать очки?",
    answer:
      "Ребёнок зарабатывает очки за выполнение задач. Количество очков зависит от сложности задачи. Также можно получить бонус за быстрое выполнение или достижение целей семьи.",
    category: "Система наград",
  },
  {
    id: "4",
    question: "Что можно купить за очки?",
    answer:
      "Родитель создаёт награды в магазине. Это могут быть реальные предметы (пицца, поход в кино) или цифровые (новый скин для аватара, стикер). Ребёнок может обменять накопленные очки на любую доступную награду.",
    category: "Система наград",
  },
  {
    id: "5",
    question: "Как работают достижения?",
    answer:
      "Достижения разблокируются автоматически при выполнении определённых условий. Например, выполнение 10 задач разблокирует достижение 'Юный помощник'. Каждое достижение даёт бонусный опыт.",
    category: "Игромеханика",
  },
  {
    id: "6",
    question: "Можно ли сбросить данные?",
    answer:
      "Да, но это необратимое действие. В настройках родителя есть опция 'Очистить все данные', которая удалит все задачи, награды, профили и статистику. Аккаунт при этом сохранится.",
    category: "Настройки",
  },
  {
    id: "7",
    question: "Как настроить уведомления?",
    answer:
      "В настройках можно включить/отключить уведомления, звуки и установить ночной режим. В ночном режиме приходят только срочные уведомления. Для каждого ребёнка можно настроить уведомления отдельно.",
    category: "Настройки",
  },
  {
    id: "8",
    question: "Как изменить код семьи?",
    answer:
      "Код семьи генерируется автоматически при создании семьи и не может быть изменён. Если нужен новый код, нужно создать новую семью. Старая семья при этом сохранится.",
    category: "Семья",
  },
]

export default function HelpFAQ() {
  const [search, setSearch] = useState("")
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const categories = Array.from(new Set(FAQS.map((faq) => faq.category)))

  const filteredFAQs = FAQS.filter((faq) => {
    const matchesSearch =
      faq.question.toLowerCase().includes(search.toLowerCase()) ||
      faq.answer.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = !selectedCategory || faq.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Справка и вопросы</h1>
        <p className="text-muted-foreground">Найди ответ на свой вопрос</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Поиск..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button
          variant={selectedCategory === null ? "default" : "outline"}
          onClick={() => setSelectedCategory(null)}
          size="sm"
        >
          Все
        </Button>
        {categories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            onClick={() => setSelectedCategory(category)}
            size="sm"
          >
            {category}
          </Button>
        ))}
      </div>

      <div className="space-y-3">
        {filteredFAQs.length === 0 ? (
          <Card>
            <CardContent className="pt-12 text-center">
              <HelpCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Вопросы не найдены</p>
            </CardContent>
          </Card>
        ) : (
          filteredFAQs.map((faq) => (
            <Card
              key={faq.id}
              className="cursor-pointer hover:shadow-md transition-all"
              onClick={() => setExpandedId(expandedId === faq.id ? null : faq.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <CardTitle className="text-base">{faq.question}</CardTitle>
                  <ChevronDown
                    className={`w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform ${
                      expandedId === faq.id ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </CardHeader>
              {expandedId === faq.id && (
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground">{faq.answer}</p>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
