"use client"

import { Users, User } from "lucide-react"
import { useTranslation } from "@/i18n/provider"

interface RoleSelectorProps {
  onSelectRole: (role: "parent" | "child") => void
}

export default function RoleSelector({ onSelectRole }: RoleSelectorProps) {
  const { t } = useTranslation()
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-100 via-purple-100 to-purple-200">
      <div className="w-full max-w-3xl px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-balance mb-3">{t("roleSelector.title")}</h1>
          <p className="text-lg text-muted-foreground">{t("roleSelector.subtitle")}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <button
            onClick={() => onSelectRole("parent")}
            className="group relative p-10 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all hover:scale-105 border-4 border-transparent hover:border-primary"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="p-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl group-hover:scale-110 transition-transform">
                <Users className="w-16 h-16 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold mb-2 text-primary">{t("roleSelector.parent")}</h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {t("roleSelector.parentDescription")}
                </p>
              </div>
            </div>
            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity bg-primary/5 -z-10 blur-xl"></div>
          </button>

          <button
            onClick={() => onSelectRole("child")}
            className="group relative p-10 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all hover:scale-105 border-4 border-transparent hover:border-secondary"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="p-6 bg-gradient-to-br from-green-500 to-orange-500 rounded-2xl group-hover:scale-110 transition-transform">
                <User className="w-16 h-16 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold mb-2 text-secondary">{t("roleSelector.child")}</h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {t("roleSelector.childDescription")}
                </p>
              </div>
            </div>
            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity bg-secondary/5 -z-10 blur-xl"></div>
          </button>
        </div>
      </div>
    </main>
  )
}
