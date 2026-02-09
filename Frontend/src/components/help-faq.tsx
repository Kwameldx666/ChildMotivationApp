"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ChevronDown, Search, HelpCircle } from "lucide-react"
import { useTranslation } from "@/i18n/provider"

interface FAQ {
  id: string
  question: string
  answer: string
  category: string
}

export default function HelpFAQ() {
  const { t } = useTranslation()
  const [search, setSearch] = useState("")
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const FAQS: FAQ[] = [
    {
      id: "1",
      question: t("helpFaq.faq1.question"),
      answer: t("helpFaq.faq1.answer"),
      category: t("helpFaq.categories.registration"),
    },
    {
      id: "2",
      question: t("helpFaq.faq2.question"),
      answer: t("helpFaq.faq2.answer"),
      category: t("helpFaq.categories.tasks"),
    },
    {
      id: "3",
      question: t("helpFaq.faq3.question"),
      answer: t("helpFaq.faq3.answer"),
      category: t("helpFaq.categories.rewards"),
    },
    {
      id: "4",
      question: t("helpFaq.faq4.question"),
      answer: t("helpFaq.faq4.answer"),
      category: t("helpFaq.categories.rewards"),
    },
    {
      id: "5",
      question: t("helpFaq.faq5.question"),
      answer: t("helpFaq.faq5.answer"),
      category: t("helpFaq.categories.gamification"),
    },
    {
      id: "6",
      question: t("helpFaq.faq6.question"),
      answer: t("helpFaq.faq6.answer"),
      category: t("helpFaq.categories.settings"),
    },
    {
      id: "7",
      question: t("helpFaq.faq7.question"),
      answer: t("helpFaq.faq7.answer"),
      category: t("helpFaq.categories.settings"),
    },
    {
      id: "8",
      question: t("helpFaq.faq8.question"),
      answer: t("helpFaq.faq8.answer"),
      category: t("helpFaq.categories.family"),
    },
  ]

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
        <h1 className="text-3xl font-bold mb-2">{t("helpFaq.title")}</h1>
        <p className="text-muted-foreground">{t("helpFaq.subtitle")}</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder={t("helpFaq.searchPlaceholder")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button
          variant={selectedCategory === null ? "default" : "outline"}
          onClick={() => setSelectedCategory(null)}
          size="sm"
        >
          {t("helpFaq.allCategories")}
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
              <p className="text-muted-foreground">{t("helpFaq.noResults")}</p>
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
