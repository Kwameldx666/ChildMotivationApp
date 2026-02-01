import en from './locales/en.json'
import ru from './locales/ru.json'

export type Locale = 'en' | 'ru'

export const locales: Locale[] = ['en', 'ru']
export const defaultLocale: Locale = 'en'

export const localeNames: Record<Locale, string> = {
  en: 'English',
  ru: 'Русский',
}

export const messages = {
  en,
  ru,
} as const

export type Messages = typeof en
