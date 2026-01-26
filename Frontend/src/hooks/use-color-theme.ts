"use client"

import { useEffect, useState } from "react"

export type ColorTheme = "default" | "rose" | "blue" | "green" | "purple" | "orange"

export const COLOR_THEMES = [
  { value: "default", label: "Фиолетовый", color: "bg-purple-500" },
  { value: "rose", label: "Розовый", color: "bg-rose-500" },
  { value: "blue", label: "Синий", color: "bg-blue-500" },
  { value: "green", label: "Зелёный", color: "bg-green-500" },
  { value: "purple", label: "Лиловый", color: "bg-violet-500" },
  { value: "orange", label: "Оранжевый", color: "bg-orange-500" },
] as const

export function useColorTheme() {
  const [colorTheme, setColorThemeState] = useState<ColorTheme>("default")

  useEffect(() => {
    // Загружаем сохранённую тему из localStorage
    const saved = localStorage.getItem("color-theme") as ColorTheme
    if (saved && COLOR_THEMES.some(t => t.value === saved)) {
      setColorThemeState(saved)
      applyTheme(saved)
    }
  }, [])

  const setColorTheme = (theme: ColorTheme) => {
    setColorThemeState(theme)
    localStorage.setItem("color-theme", theme)
    applyTheme(theme)
  }

  const applyTheme = (theme: ColorTheme) => {
    const root = document.documentElement
    
    // Удаляем все классы тем
    COLOR_THEMES.forEach(t => {
      if (t.value !== "default") {
        root.classList.remove(`theme-${t.value}`)
      }
    })

    // Применяем новую тему
    if (theme !== "default") {
      root.classList.add(`theme-${theme}`)
    }
  }

  return { colorTheme, setColorTheme, themes: COLOR_THEMES }
}
