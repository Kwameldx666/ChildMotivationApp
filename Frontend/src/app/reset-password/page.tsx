"use client"

import { useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { authApi } from "@/features/auth/api/authApi"
import { mapApiError } from "@/features/auth/utils/mapApiError"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle2, XCircle, KeyRound } from "lucide-react"
import { useTranslation } from "@/i18n/provider"

type ResetStatus = "form" | "success" | "error" | "missing-params"

export default function ResetPasswordPage() {
  const { t } = useTranslation()
  const searchParams = useSearchParams()
  const router = useRouter()

  const userId = searchParams.get("userId")
  const token = searchParams.get("token")

  const [status, setStatus] = useState<ResetStatus>(
    !userId || !token ? "missing-params" : "form"
  )
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword.length < 6) {
      setErrorMessage(t("auth.resetPasswordTooShort"))
      return
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage(t("auth.resetPasswordMismatch"))
      return
    }

    if (!userId || !token) return

    setIsLoading(true)
    setErrorMessage("")

    try {
      await authApi.resetPassword(userId, token, newPassword)
      setStatus("success")
    } catch (err: any) {
      setStatus("error")
      setErrorMessage(mapApiError(err, t("auth.resetPasswordFailed")))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-400 via-purple-400 to-purple-500 p-4">
      <Card className="w-full max-w-md bg-white/95 backdrop-blur-md shadow-2xl border-2 border-white/50">
        <CardContent className="pt-8 pb-8 px-6 flex flex-col items-center text-center gap-4">
          {status === "missing-params" && (
            <>
              <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle className="h-10 w-10 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">{t("auth.resetPasswordInvalidLink")}</h2>
              <p className="text-gray-600 text-sm">{t("auth.resetPasswordInvalidLinkDesc")}</p>
              <Button
                className="mt-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:opacity-90"
                onClick={() => router.push("/")}
              >
                {t("auth.backToLogin")}
              </Button>
            </>
          )}

          {status === "form" && (
            <>
              <div className="h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center">
                <KeyRound className="h-10 w-10 text-purple-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">{t("auth.resetPasswordTitle")}</h2>
              <p className="text-gray-600 text-sm">{t("auth.resetPasswordDescription")}</p>

              <form className="space-y-4 w-full text-left" onSubmit={handleSubmit}>
                <div>
                  <Label className="text-sm font-semibold text-gray-800 mb-1.5 block">{t("auth.newPassword")}</Label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••"
                    className="bg-white border-2 border-gray-300 focus:border-purple-500 text-gray-900"
                  />
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-800 mb-1.5 block">{t("auth.confirmNewPassword")}</Label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••"
                    className="bg-white border-2 border-gray-300 focus:border-purple-500 text-gray-900"
                  />
                </div>

                {errorMessage && (
                  <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">
                    {errorMessage}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white shadow-lg"
                  disabled={isLoading}
                >
                  {isLoading ? t("authScreen.submitLoading") : t("auth.resetPassword")}
                </Button>
              </form>
            </>
          )}

          {status === "success" && (
            <>
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">{t("auth.resetPasswordSuccess")}</h2>
              <p className="text-gray-600 text-sm">{t("auth.resetPasswordSuccessDesc")}</p>
              <Button
                className="mt-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:opacity-90"
                onClick={() => router.push("/")}
              >
                {t("auth.backToLogin")}
              </Button>
            </>
          )}

          {status === "error" && (
            <>
              <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle className="h-10 w-10 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">{t("auth.resetPasswordErrorTitle")}</h2>
              <p className="text-gray-600 text-sm">{errorMessage}</p>
              <Button
                variant="outline"
                className="mt-2"
                onClick={() => router.push("/")}
              >
                {t("auth.backToLogin")}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
