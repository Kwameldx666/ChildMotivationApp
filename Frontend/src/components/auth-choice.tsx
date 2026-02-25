"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { UserPlus, LogIn, ChevronLeft } from "lucide-react"
import { useTranslation } from "@/i18n/provider"
import { LanguageSwitcher } from "@/components/language-switcher"

interface AuthChoiceProps {
  onNewUser: () => void
  onExisting: () => void
  onBack: () => void
}

export default function AuthChoice({ onNewUser, onExisting, onBack }: AuthChoiceProps) {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-linear-to-br from-sky-400 via-purple-400 to-purple-500 relative overflow-hidden flex items-center justify-center p-4">
      <div className="absolute top-4 right-4 z-20 pointer-events-auto">
        <LanguageSwitcher variant="outline" size="sm" />
      </div>
      {/* Decorative background */}
      <div className="absolute inset-0 opacity-20">
        <svg className="w-full h-full" viewBox="0 0 1440 800" preserveAspectRatio="none">
          <path
            d="M0,400 C240,450 480,350 720,400 C960,450 1200,350 1440,400 L1440,800 L0,800 Z"
            fill="white"
            opacity="0.3"
          />
        </svg>
      </div>

      <div className="relative z-10 w-full max-w-2xl">
        {/* Back button */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-white/80 hover:text-white mb-8 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          {t("authChoice.back")}
        </button>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold text-white text-center mb-4 text-balance drop-shadow-lg">
          {t("authChoice.title")}
        </h1>
        <p className="text-xl text-white text-center mb-12 text-balance drop-shadow-md">
          {t("authChoice.subtitle")}
        </p>

        {/* Choice cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* New user */}
          <Card
            onClick={onNewUser}
            className="bg-white/95 backdrop-blur-md shadow-xl hover:shadow-2xl transition-all hover:scale-105 cursor-pointer hover:bg-white border-2 border-white/50"
          >
            <CardContent className="pt-8">
              <div className="w-20 h-20 bg-linear-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <UserPlus className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-center mb-3 text-gray-900">
                {t("authChoice.newUser.title")}
              </h3>
              <p className="text-center text-gray-700 mb-6">
                {t("authChoice.newUser.description")}
              </p>
              <div className="space-y-2 text-sm text-gray-700 mb-6">
                <p>{t("authChoice.newUser.bullets.role")}</p>
                <p>{t("authChoice.newUser.bullets.profile")}</p>
                <p>{t("authChoice.newUser.bullets.family")}</p>
              </div>
              <Button className="w-full bg-linear-to-r from-green-400 to-green-500 hover:from-green-500 hover:to-green-600 text-white text-lg py-6 h-auto">
                <UserPlus className="mr-2 w-5 h-5" />
                {t("authChoice.newUser.action")}
              </Button>
            </CardContent>
          </Card>

          {/* Existing user */}
          <Card
            onClick={onExisting}
            className="bg-white/95 backdrop-blur-md shadow-xl hover:shadow-2xl transition-all hover:scale-105 cursor-pointer hover:bg-white border-2 border-white/50"
          >
            <CardContent className="pt-8">
              <div className="w-20 h-20 bg-linear-to-br from-blue-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <LogIn className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-center mb-3 text-gray-900">
                {t("authChoice.existingUser.title")}
              </h3>
              <p className="text-center text-gray-700 mb-6">
                {t("authChoice.existingUser.description")}
              </p>
              <div className="space-y-2 text-sm text-gray-700 mb-6">
                <p>{t("authChoice.existingUser.bullets.credentials")}</p>
                <p>{t("authChoice.existingUser.bullets.profile")}</p>
                <p>{t("authChoice.existingUser.bullets.continue")}</p>
              </div>
              <Button className="w-full bg-linear-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white text-lg py-6 h-auto">
                <LogIn className="mr-2 w-5 h-5" />
                {t("authChoice.existingUser.action")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
