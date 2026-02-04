'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { Locale, defaultLocale, messages, Messages, locales } from '@/i18n'

const LOCALE_STORAGE_KEY = 'familyapp_locale'

type TranslationValue = string | Record<string, unknown>

function getNestedValue(obj: Record<string, unknown>, path: string): TranslationValue | undefined {
  const keys = path.split('.')
  let current: unknown = obj
  
  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined
    }
    current = (current as Record<string, unknown>)[key]
  }
  
  return current as TranslationValue
}

function interpolate(template: string, params: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    return params[key]?.toString() ?? `{${key}}`
  })
}

interface I18nContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string, params?: Record<string, string | number>) => string
  messages: Messages
}

const I18nContext = createContext<I18nContextType | null>(null)

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale | null
        if (stored && locales.includes(stored)) {
          setLocaleState(stored)
        } else {
          const browserLocale = navigator.language.split('-')[0] as Locale
          if (locales.includes(browserLocale)) {
            setLocaleState(browserLocale)
          }
        }
      } catch (error) {
        console.error('[i18n] Failed to load locale:', error)
      }
      setIsHydrated(true)
    }
  }, [])

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(LOCALE_STORAGE_KEY, newLocale)
        document.documentElement.lang = newLocale
      } catch (error) {
        console.error('[i18n] Failed to save locale:', error)
      }
    }
  }, [])

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    const currentMessages = messages[locale] as Record<string, unknown>
    const value = getNestedValue(currentMessages, key)
    
    if (typeof value === 'string') {
      return params ? interpolate(value, params) : value
    }
    
    // Fallback to English
    if (locale !== 'en') {
      const fallbackValue = getNestedValue(messages.en as Record<string, unknown>, key)
      if (typeof fallbackValue === 'string') {
        return params ? interpolate(fallbackValue, params) : fallbackValue
      }
    }
    
    // Return key if translation not found
    console.warn(`[i18n] Missing translation for key: ${key}`)
    return key
  }, [locale])

  const currentMessages = messages[locale]

  // Prevent hydration mismatch
  if (!isHydrated) {
    return (
      <I18nContext.Provider value={{ locale: defaultLocale, setLocale, t, messages: messages[defaultLocale] }}>
        {children}
      </I18nContext.Provider>
    )
  }

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, messages: currentMessages }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return context
}

export function useTranslation() {
  const { t, locale } = useI18n()
  return { t, locale }
}
