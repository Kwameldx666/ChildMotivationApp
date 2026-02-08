'use client'

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react'
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
  // Always start with defaultLocale to ensure server/client match
  const [locale, setLocaleState] = useState<Locale>(defaultLocale)

  // Load locale from localStorage after hydration
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCALE_STORAGE_KEY)
      console.log('[I18nProvider] Loaded stored locale:', stored)
      if (stored && (locales as readonly string[]).includes(stored)) {
        setLocaleState(stored as Locale)
        document.documentElement.lang = stored
        console.log('[I18nProvider] Applied stored locale:', stored)
      } else {
        // Try browser locale
        const browserLocale = navigator.language.split('-')[0]
        console.log('[I18nProvider] Browser locale:', browserLocale)
        if ((locales as readonly string[]).includes(browserLocale)) {
          setLocaleState(browserLocale as Locale)
          document.documentElement.lang = browserLocale
          console.log('[I18nProvider] Applied browser locale:', browserLocale)
        }
      }
    } catch (error) {
      console.error('[i18n] Failed to load locale:', error)
    }
  }, [])

  const setLocale = useCallback((newLocale: Locale) => {
    console.log('[I18nProvider] setLocale called with:', newLocale, 'current:', locale)
    setLocaleState(newLocale)
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, newLocale)
      document.documentElement.lang = newLocale
      console.log('[I18nProvider] Locale saved to localStorage:', newLocale)
      // Force re-read to verify
      const verified = localStorage.getItem(LOCALE_STORAGE_KEY)
      console.log('[I18nProvider] Verified localStorage value:', verified)
    } catch (error) {
      console.error('[i18n] Failed to save locale:', error)
    }
  }, [locale])

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

  const currentMessages = messages[locale] as Messages

  const contextValue = useMemo(() => ({
    locale,
    setLocale,
    t,
    messages: currentMessages
  }), [locale, setLocale, t, currentMessages])

  return (
    <I18nContext.Provider value={contextValue}>
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
