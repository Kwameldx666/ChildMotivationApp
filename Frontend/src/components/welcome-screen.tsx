"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, LogIn } from "lucide-react"

interface WelcomeScreenProps {
  onStart: () => void
  onLogin?: () => void
}

export default function WelcomeScreen({ onStart, onLogin }: WelcomeScreenProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const intervalRef = useRef<number | null>(null)
  const touchStartXRef = useRef<number | null>(null)
  const touchStartYRef = useRef<number | null>(null)
  const [dragOffsetPx, setDragOffsetPx] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  const screenshots = [
    {
      title: "Управляй задачами",
      description: "Создавай, назначай и отмечай выполнение всей семьёй.",
      icon: "🧾",
    },
    {
      title: "Получай награды",
      description: "Зарабатывай очки и обменивай их на призы и бонусы.",
      icon: "🎁",
    },
    {
      title: "Собирай достижения",
      description: "Открывай уровни, бейджи и серии за регулярность.",
      icon: "🏆",
    },
    {
      title: "Следи за прогрессом",
      description: "Понимай, что сделано сегодня и что в планах на неделю.",
      icon: "📈",
    },
    {
      title: "Поддерживай мотивацию",
      description: "Мягкие подсказки и цели помогают не бросать начатое.",
      icon: "✨",
    },
    {
      title: "AI-помощник",
      description: "Идеи задач и наград — быстрее старт и меньше рутины.",
      icon: "🤖",
    },
  ]

  const goToSlide = (index: number) => {
    setCurrentSlide((index + screenshots.length) % screenshots.length)
  }

  const nextSlide = () => goToSlide(currentSlide + 1)
  const prevSlide = () => goToSlide(currentSlide - 1)

  useEffect(() => {
    if (!window.matchMedia) return

    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    const update = () => setPrefersReducedMotion(media.matches)
    update()
    media.addEventListener?.("change", update)
    return () => media.removeEventListener?.("change", update)
  }, [])

  useEffect(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    if (prefersReducedMotion) return

    intervalRef.current = window.setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % screenshots.length)
    }, 5200)

    return () => {
      if (intervalRef.current !== null) window.clearInterval(intervalRef.current)
    }
  }, [prefersReducedMotion, screenshots.length])

  const handleTouchStart = (event: React.TouchEvent) => {
    const touch = event.touches[0]
    touchStartXRef.current = touch?.clientX ?? null
    touchStartYRef.current = touch?.clientY ?? null
    setIsDragging(false)
  }

  const handleTouchMove = (event: React.TouchEvent) => {
    const startX = touchStartXRef.current
    const startY = touchStartYRef.current
    if (startX === null || startY === null) return

    const touch = event.touches[0]
    if (!touch) return

    const deltaX = touch.clientX - startX
    const deltaY = touch.clientY - startY

    if (!isDragging) {
      if (Math.abs(deltaX) < 8) return
      if (Math.abs(deltaY) > Math.abs(deltaX)) return
      setIsDragging(true)
    }

    event.preventDefault()
    setDragOffsetPx(deltaX)
  }

  const handleTouchEnd = (event: React.TouchEvent) => {
    const startX = touchStartXRef.current
    const startY = touchStartYRef.current
    touchStartXRef.current = null
    touchStartYRef.current = null

    if (startX === null || startY === null) return
    const touch = event.changedTouches[0]
    if (!touch) return

    const deltaX = touch.clientX - startX
    const deltaY = touch.clientY - startY

    setIsDragging(false)

    if (Math.abs(deltaX) < 60 || Math.abs(deltaY) > Math.abs(deltaX)) {
      setDragOffsetPx(0)
      return
    }

    setDragOffsetPx(0)
    if (deltaX < 0) nextSlide()
    else prevSlide()
  }

  return (
    <div className="h-[100dvh] bg-gradient-to-br from-sky-400 via-purple-400 to-purple-500 relative overflow-hidden">
      {/* Decorative waves */}
      <div className="absolute inset-0 opacity-20">
        <svg className="w-full h-full" viewBox="0 0 1440 800" preserveAspectRatio="none">
          <path
            d="M0,400 C240,450 480,350 720,400 C960,450 1200,350 1440,400 L1440,800 L0,800 Z"
            fill="white"
            opacity="0.3"
          />
          <path
            d="M0,500 C360,550 720,450 1080,500 C1200,520 1320,480 1440,500 L1440,800 L0,800 Z"
            fill="white"
            opacity="0.2"
          />
        </svg>
      </div>

      <div className="pointer-events-none absolute inset-0 opacity-15">
        <div className="absolute left-[8%] top-[16%] text-5xl blur-[0.5px]">✨</div>
        <div className="absolute right-[10%] top-[22%] text-4xl blur-[0.5px]">🪙</div>
        <div className="absolute left-[16%] bottom-[18%] text-4xl blur-[0.5px]">⭐</div>
        <div className="absolute right-[14%] bottom-[20%] text-5xl blur-[0.5px]">🏆</div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-3 sm:py-5 h-full flex flex-col items-center justify-center gap-4 sm:gap-6">
        {/* Central illustration placeholder */}
        <div className="relative shrink-0 pointer-events-auto">
          <div className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48">
            <Image src="/icons/app_icon.png" alt="FamilyQuest" fill priority className="object-contain" />
          </div>
        </div>

        {/* Logo and tagline */}
        <div className="text-center pointer-events-auto">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white text-balance drop-shadow-sm">
            FamilyQuest
          </h1>
          <p className="mt-2 text-sm sm:text-base md:text-base text-white/70 max-w-xl text-balance leading-snug">
            Превращаем домашние обязанности в увлекательную игру
          </p>
        </div>

        {/* Feature carousel */}
        <div className="w-full max-w-lg shrink-0 pointer-events-auto">
          <div
            className="relative overflow-hidden rounded-2xl shadow-2xl bg-gradient-to-br from-white/35 via-white/10 to-white/0 p-[1px]"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ touchAction: "pan-y" }}
          >
            <div className="overflow-hidden rounded-2xl">
            <div
              className={[
                "flex w-full will-change-transform",
                prefersReducedMotion || isDragging ? "" : "transition-transform duration-700 ease-[cubic-bezier(.2,.8,.2,1)]",
              ].join(" ")}
              style={{
                transform: `translateX(calc(-${currentSlide * 100}% + ${dragOffsetPx}px))`,
              }}
            >
              {screenshots.map((slide) => (
                <div key={slide.title} className="w-full shrink-0">
                  <Card className="bg-gradient-to-br from-white/75 via-white/65 to-white/55 backdrop-blur-md shadow-none w-full rounded-none border border-white/35">
                    <CardContent className="py-5 sm:py-6 text-center">
                      <div className="text-4xl sm:text-5xl mb-2.5 drop-shadow-sm">{slide.icon}</div>
                      <h3 className="text-lg sm:text-xl font-bold mb-2 text-foreground">{slide.title}</h3>
                      <p className="text-sm text-muted-foreground/75 leading-relaxed max-w-md mx-auto">
                        {slide.description}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-center">
            <div className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-2 py-1.5 backdrop-blur-md ring-1 ring-white/20 shadow-lg">
              {screenshots.map((item, i) => (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => goToSlide(i)}
                  aria-label={`Слайд ${i + 1}`}
                  className={[
                    "h-9 w-9 rounded-xl text-xl",
                    "grid place-items-center",
                    "transition-all",
                    i === currentSlide ? "bg-white/90 shadow-md ring-2 ring-white/80" : "bg-white/30 hover:bg-white/45",
                  ].join(" ")}
                >
                  {item.icon}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main CTA */}
        <div className="flex flex-col items-center gap-2 pointer-events-auto">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <Button
              onClick={onStart}
              size="lg"
              className={[
                "group relative overflow-hidden rounded-2xl px-6 py-3.5 sm:px-7 sm:py-4 h-auto",
                "text-white font-semibold",
                "bg-gradient-to-r from-fuchsia-600 via-purple-600 to-indigo-600",
                "ring-1 ring-white/25",
                "shadow-[0_18px_55px_rgba(124,58,237,0.45)]",
                "transition-all hover:shadow-[0_26px_75px_rgba(124,58,237,0.6)] hover:scale-[1.03] active:scale-[0.99]",
                "before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.22),transparent_55%)]",
                "after:absolute after:inset-0 after:bg-[linear-gradient(110deg,transparent,rgba(255,255,255,0.35),transparent)] after:translate-x-[-120%] after:transition-transform after:duration-700",
                "hover:after:translate-x-[120%]",
              ].join(" ")}
            >
              <span className="relative z-10 text-lg sm:text-xl">Начать приключение</span>
              <span className="relative z-10 ml-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25 shadow-md transition-transform group-hover:translate-x-1">
                <ArrowRight className="h-5 w-5 text-white" />
              </span>
            </Button>
            {onLogin && (
              <Button
                onClick={onLogin}
                size="lg"
                variant="outline"
                className="rounded-2xl bg-white/15 backdrop-blur-sm text-white border-white/40 hover:bg-white/25 px-6 sm:px-7 py-3.5 sm:py-4 h-auto shadow-2xl transition-all hover:shadow-3xl"
              >
                <LogIn className="mr-2 h-5 w-5" />
                Войти
              </Button>
            )}
          </div>
          <div className="text-xs sm:text-sm text-white/70">Для всей семьи • Займёт 2 минуты</div>
        </div>
      </div>
    </div>
  )
}
