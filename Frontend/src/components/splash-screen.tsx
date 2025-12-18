"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
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

      <div className="relative z-10 w-full max-w-md px-6 text-center flex flex-col items-center">
        {/* Logo */}
        <div className="mb-10 flex justify-center">
          <div className="relative">
            <div className="w-28 h-28 bg-white/90 rounded-3xl shadow-2xl ring-1 ring-white/40 overflow-hidden">
              <div className="relative w-full h-full">
                <Image src="/icons/app_icon.png" alt="FamilyQuest" fill priority className="object-contain" />
              </div>
            </div>
            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-yellow-300 rounded-full flex items-center justify-center animate-bounce shadow-lg">
              <Coins className="w-5 h-5 text-purple-900" />
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-3 drop-shadow-lg">FamilyQuest</h1>
        <p className="text-lg text-white/85 mb-7 drop-shadow">Загружаем приключение</p>

        {/* Progress bar */}
        <div className="w-full max-w-sm h-2.5 bg-white/25 rounded-full overflow-hidden backdrop-blur-sm shadow-lg shadow-black/10 mx-auto">
          <div
            className="h-full bg-gradient-to-r from-yellow-200 via-white to-fuchsia-200 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>

        <div className="mt-10 flex justify-center w-full">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur-md ring-1 ring-white/20">
            <Coins className="h-4 w-4 text-yellow-200" />
            <span className="text-sm text-white/80">Готовим задания и награды</span>
          </div>
        </div>
      </div>
    </div>
  )
}
