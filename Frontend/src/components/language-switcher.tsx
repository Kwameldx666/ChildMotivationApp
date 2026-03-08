'use client'

import { useI18n } from '@/i18n/provider'
import { Locale, localeNames, locales } from '@/i18n'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Globe } from 'lucide-react'
import { cn } from '@/lib/utils'

const localeFlags: Record<Locale, string> = {
  en: '🇺🇸',
  ru: '🇷🇺',
  ro: '🇲🇩',
}

interface LanguageSwitcherProps {
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  showLabel?: boolean
  /** Gamified inline flag buttons for child UI */
  gamified?: boolean
}

export function LanguageSwitcher({ 
  variant = 'outline', 
  size = 'sm',
  showLabel = true,
  gamified = false,
}: LanguageSwitcherProps) {
  const { locale, setLocale } = useI18n()

  const handleLocaleChange = (newLocale: Locale) => {
    console.log('[LanguageSwitcher] Changing locale from', locale, 'to', newLocale)
    setLocale(newLocale)
  }

  if (gamified) {
    return (
      <div className="flex items-center gap-1">
        {locales.map((loc) => {
          const active = locale === loc
          return (
            <button
              key={loc}
              type="button"
              onClick={() => handleLocaleChange(loc)}
              className={cn(
                "relative flex items-center justify-center w-9 h-9 rounded-xl text-lg transition-all duration-200",
                active
                  ? "bg-primary/15 ring-2 ring-primary/40 scale-110 shadow-md"
                  : "hover:bg-muted/60 hover:scale-105 opacity-60 hover:opacity-100",
              )}
              title={localeNames[loc]}
            >
              <span className={cn("select-none", active && "animate-bounce")} style={active ? { animationIterationCount: 1, animationDuration: '0.4s' } : undefined}>
                {localeFlags[loc]}
              </span>
              {active && (
                <span className="absolute -bottom-0.5 w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className="gap-2">
          <Globe className="h-4 w-4" />
          {showLabel && <span>{localeNames[locale]}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((loc) => (
          <DropdownMenuItem
            key={loc}
            onSelect={(event) => {
              event.preventDefault()
              handleLocaleChange(loc)
            }}
            className={locale === loc ? 'bg-accent' : ''}
          >
            <span className="mr-2">{localeFlags[loc]}</span>
            {localeNames[loc]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
