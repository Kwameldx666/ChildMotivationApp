"use client"

import { useEffect } from "react"
import SplashScreen from "@/components/splash-screen"
import WelcomeScreen from "@/components/welcome-screen"
import AuthChoice from "@/components/auth-choice"
import AuthScreen from "@/components/auth-screen"
import ParentDashboard from "@/components/parent-dashboard"
import ChildDashboard from "@/components/child-dashboard"
import { useAppState } from "@/features/app/hooks/useAppState"

export default function Home() {
  const {
    screen,
    session,
    isBootstrapping,
    setScreen,
    bootstrap,
    handleAuthSuccess,
    handleLogout,
    authMode,
    startAuthFlow,
  } = useAppState()

  useEffect(() => {
    const dispose = bootstrap()
    return () => {
      if (typeof dispose === "function") {
        dispose()
      }
    }
  }, [bootstrap])

  // Проверяем, есть ли pending приглашение в семью
  useEffect(() => {
    if (typeof window !== "undefined" && screen === "welcome") {
      const pendingCode = localStorage.getItem("pendingFamilyCode")
      if (pendingCode) {
        // Если есть код приглашения, сразу показываем регистрацию
        startAuthFlow("register")
      }
    }
  }, [screen, startAuthFlow])

  const handleSplashComplete = () => {
    setScreen((current) => (current === "splash" ? "welcome" : current))
  }

  const handleStartAdventure = () => {
    setScreen("auth-choice")
  }

  const handleBackToWelcome = () => {
    setScreen("welcome")
  }

  const handleNewUserFlow = () => {
    startAuthFlow("register")
  }

  const handleExistingUserFlow = () => {
    startAuthFlow("login")
  }

  if (isBootstrapping || screen === "splash") {
    return <SplashScreen onComplete={handleSplashComplete} />
  }

  if (screen === "welcome") {
    return <WelcomeScreen onStart={handleStartAdventure} />
  }

  if (screen === "auth-choice") {
    return (
      <AuthChoice onNewUser={handleNewUserFlow} onExisting={handleExistingUserFlow} onBack={handleBackToWelcome} />
    )
  }

  if (screen === "auth") {
    return <AuthScreen initialMode={authMode} onAuth={handleAuthSuccess} onBack={handleBackToWelcome} />
  }

  if (screen === "parent-dashboard" && session) {
    return (
      <ParentDashboard
        userId={session.user.id}
        userProfile={session.profile}
        familyCode={session.family?.code ?? null}
        familyName={session.family?.name ?? null}
        familyEmblem={session.family?.emblem ?? null}
        onLogout={handleLogout}
      />
    )
  }

  if (screen === "child-dashboard" && session) {
    return (
      <ChildDashboard
        userId={session.user.id}
        userProfile={session.profile}
        familyCode={session.family?.code ?? ""}
        onLogout={handleLogout}
      />
    )
  }

  return <WelcomeScreen onStart={handleStartAdventure} />
}
