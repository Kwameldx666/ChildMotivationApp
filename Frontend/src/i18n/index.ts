import en from './locales/en.json'
import ru from './locales/ru.json'
import ro from './locales/ro.json'

export type Locale = 'en' | 'ru' | 'ro'

export const locales: Locale[] = ['en', 'ru', 'ro']
export const defaultLocale: Locale = 'en'

export const localeNames: Record<Locale, string> = {
  en: 'English',
  ru: 'Русский',
  ro: 'Română',
}

export const messages = {
  en,
  ru,
  ro,
} as const

export type Messages = typeof en
