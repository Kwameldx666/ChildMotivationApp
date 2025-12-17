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
  const { screen, session, isBootstrapping, setScreen, bootstrap, handleAuthSuccess, handleLogout } = useAppState()

  useEffect(() => {
    const dispose = bootstrap()
    return () => {
      if (typeof dispose === "function") {
        dispose()
      }
    }
  }, [bootstrap])

  const handleSplashComplete = () => {
    setScreen((current) => (current === "splash" ? "welcome" : current))
  }

  const handleStartAdventure = () => {
    setScreen("auth-choice")
  }

  const handleAuthChoice = () => {
    setScreen("auth")
  }

  const handleBackToWelcome = () => {
    setScreen("welcome")
  }

  if (isBootstrapping || screen === "splash") {
    return <SplashScreen onComplete={handleSplashComplete} />
  }

  if (screen === "welcome") {
    return <WelcomeScreen onStart={handleStartAdventure} />
  }

  if (screen === "auth-choice") {
    return (
      <AuthChoice
        onNewUser={(_isNewUser) => handleAuthChoice()}
        onExisting={(_isNewUser) => handleAuthChoice()}
        onBack={handleBackToWelcome}
      />
    )
  }

  if (screen === "auth") {
    return <AuthScreen onAuth={handleAuthSuccess} onBack={handleBackToWelcome} />
  }

  if (screen === "parent-dashboard" && session) {
    return (
      <ParentDashboard
        userProfile={session.profile}
        familyCode={session.family?.code ?? null}
        familyName={session.family?.name ?? null}
        familyEmblem={session.family?.emblem ?? null}
        onLogout={handleLogout}
      />
    )
  }

  if (screen === "child-dashboard" && session) {
    return <ChildDashboard userProfile={session.profile} familyCode={session.family?.code ?? ""} onLogout={handleLogout} />
  }

  return <WelcomeScreen onStart={handleStartAdventure} />
}
