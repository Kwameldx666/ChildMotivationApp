"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { authApi } from "@/features/auth/api/authApi"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2, XCircle, Loader2, Mail } from "lucide-react"

type ConfirmStatus = "loading" | "success" | "error" | "missing-params"

export default function ConfirmEmailPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<ConfirmStatus>("loading")
  const [errorMessage, setErrorMessage] = useState("")
  const [resending, setResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)

  const userId = searchParams.get("userId")
  const token = searchParams.get("token")

  useEffect(() => {
    if (!userId || !token) {
      setStatus("missing-params")
      return
    }

    const confirm = async () => {
      try {
        await authApi.confirmEmail(userId, token)
        setStatus("success")
      } catch (err: any) {
        setStatus("error")
        const msg =
          err?.response?.data?.detail ||
          err?.response?.data?.error ||
          err?.response?.data?.title ||
          "Email confirmation failed. The link may have expired."
        setErrorMessage(msg)
      }
    }

    confirm()
  }, [userId, token])

  const handleResend = async () => {
    const email = searchParams.get("email")
    if (!email) return
    setResending(true)
    try {
      await authApi.resendConfirmation(email)
      setResendSuccess(true)
    } catch {
      // silently ignore
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4">
      <Card className="w-full max-w-md border-border/40 shadow-xl">
        <CardContent className="pt-8 pb-8 px-6 flex flex-col items-center text-center gap-4">
          {status === "loading" && (
            <>
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
              <h2 className="text-xl font-semibold">Confirming your email...</h2>
              <p className="text-muted-foreground text-sm">Please wait a moment.</p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-xl font-semibold">Email confirmed!</h2>
              <p className="text-muted-foreground text-sm">
                Your email has been successfully verified. You can now log in.
              </p>
              <Button
                className="mt-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:opacity-90"
                onClick={() => router.push("/")}
              >
                Go to Login
              </Button>
            </>
          )}

          {status === "error" && (
            <>
              <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <XCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-xl font-semibold">Confirmation failed</h2>
              <p className="text-muted-foreground text-sm">{errorMessage}</p>
              <div className="flex flex-col gap-2 mt-2 w-full">
                <Button
                  variant="outline"
                  onClick={() => router.push("/")}
                >
                  Go to Login
                </Button>
              </div>
            </>
          )}

          {status === "missing-params" && (
            <>
              <div className="h-16 w-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Mail className="h-10 w-10 text-amber-600 dark:text-amber-400" />
              </div>
              <h2 className="text-xl font-semibold">Invalid confirmation link</h2>
              <p className="text-muted-foreground text-sm">
                This link appears to be invalid or incomplete. Please check the link in your email.
              </p>
              <Button
                variant="outline"
                className="mt-2"
                onClick={() => router.push("/")}
              >
                Go to Login
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
