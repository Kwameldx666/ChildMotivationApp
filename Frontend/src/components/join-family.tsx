"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail, AlertCircle } from "lucide-react"
import { useTranslation } from "@/i18n/provider"

interface JoinFamilyProps {
  onJoinFamily: (code: string) => void
}

export default function JoinFamily({ onJoinFamily }: JoinFamilyProps) {
  const { t } = useTranslation()
  const [code, setCode] = useState("")
  const [error, setError] = useState("")

  const handleJoin = () => {
    if (!code.trim()) {
      setError(t("joinFamily.errorEmpty"))
      return
    }

    if (code.length < 6) {
      setError(t("joinFamily.errorInvalid"))
      return
    }

    setError("")
    onJoinFamily(code.toUpperCase())
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-purple-100 to-purple-200 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 bg-white shadow-xl">
        <div className="text-center mb-8">
          {/* Illustration */}
          <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-secondary/20 to-accent/20 flex items-center justify-center">
            <div className="text-6xl">
              <Mail className="w-16 h-16 text-secondary" />
            </div>
          </div>

          <h2 className="text-3xl font-bold mb-2">{t("joinFamily.title")}</h2>
          <p className="text-muted-foreground">{t("joinFamily.subtitle")}</p>
        </div>

        <div className="space-y-6">
          {/* Code input */}
          <div className="space-y-2">
            <Label htmlFor="invite-code">{t("joinFamily.inviteCodeLabel")}</Label>
            <Input
              id="invite-code"
              value={code}
              onChange={(e) => {
                setCode(e.target.value)
                setError("")
              }}
              placeholder={t("joinFamily.inviteCodePlaceholder")}
              className={`text-lg text-center font-mono uppercase ${error ? "border-destructive" : ""}`}
              maxLength={8}
            />
          </div>

          {/* Error message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Submit button */}
          <Button onClick={handleJoin} disabled={!code.trim()} className="w-full h-12 text-lg" size="lg">
            {t("joinFamily.joinButton")}
          </Button>
        </div>
      </Card>
    </div>
  )
}
