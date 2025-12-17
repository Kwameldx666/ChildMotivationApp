"use client"

import { useEffect, useState } from "react"
import { Coins } from "lucide-react"

interface SplashScreenProps {
  onComplete: () => void
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setTimeout(onComplete, 500)
          return 100
        }
        return prev + Math.random() * 30
      })
    }, 300)

    return () => clearInterval(interval)
  }, [onComplete])

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-500 via-purple-400 to-pink-400 flex items-center justify-center overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-10 left-10 w-32 h-32 bg-yellow-300 rounded-full animate-pulse" />
        <div
          className="absolute bottom-20 right-20 w-40 h-40 bg-pink-400 rounded-full animate-pulse"
          style={{ animationDelay: "0.7s" }}
        />
        <div
          className="absolute top-1/2 left-1/4 w-24 h-24 bg-purple-500 rounded-full animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      <div className="relative z-10 text-center">
        {/* Logo */}
        <div className="mb-12 flex justify-center">
          <div className="relative">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-2xl">
              <div className="text-5xl">👨‍👩‍👧‍👦</div>
            </div>
            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-yellow-300 rounded-full flex items-center justify-center animate-bounce shadow-lg">
              <Coins className="w-5 h-5 text-purple-900" />
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-2 drop-shadow-lg">FamilyTask</h1>
        <p className="text-lg text-white/90 mb-8 drop-shadow">Загружаем приключение...</p>

        {/* Progress bar */}
        <div className="w-64 h-2 bg-white/30 rounded-full overflow-hidden backdrop-blur-sm">
          <div
            className="h-full bg-gradient-to-r from-yellow-300 via-pink-400 to-purple-500 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>

        {/* Floating coins animation */}
        <div className="mt-12 flex justify-center gap-8">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-8 h-8 bg-yellow-300 rounded-full flex items-center justify-center animate-bounce shadow-lg"
              style={{ animationDelay: `${i * 0.2}s` }}
            >
              <Coins className="w-4 h-4 text-purple-900" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
