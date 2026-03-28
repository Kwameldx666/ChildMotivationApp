import { httpClient } from '@/services/api/http-client'

const SETTINGS_STORAGE_KEY = 'familyapp_user_settings'

export interface UserSettings {
  notificationsEnabled: boolean
  soundEnabled: boolean
  nightModeStart: string
  nightModeEnd: string
  timeLimitEnabled: boolean
  timeLimitMinutes: number
  spendingLimitEnabled: boolean
  spendingLimitPointsPerDay: number
  // AI chatbot control
  aiChatEnabled: boolean
  aiCanCreateTasks: boolean
  aiCanCreateRewards: boolean
  aiTone: 'friendly' | 'educational' | 'strict'
}

const defaultSettings: UserSettings = {
  notificationsEnabled: true,
  soundEnabled: true,
  nightModeStart: "22:00",
  nightModeEnd: "08:00",
  timeLimitEnabled: false,
  timeLimitMinutes: 120,
  spendingLimitEnabled: false,
  spendingLimitPointsPerDay: 100,
  aiChatEnabled: true,
  aiCanCreateTasks: true,
  aiCanCreateRewards: true,
  aiTone: 'friendly',
}

function parseTimeToMinutes(value: string): number | null {
  const [hoursRaw, minutesRaw] = value.split(':')
  const hours = Number(hoursRaw)
  const minutes = Number(minutesRaw)

  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null

  return hours * 60 + minutes
}

export function isWithinNightModeWindow(settings: Pick<UserSettings, 'nightModeStart' | 'nightModeEnd'>, now: Date = new Date()): boolean {
  const start = parseTimeToMinutes(settings.nightModeStart)
  const end = parseTimeToMinutes(settings.nightModeEnd)

  if (start === null || end === null) return false

  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  if (start === end) return false
  if (start < end) {
    return currentMinutes >= start && currentMinutes < end
  }

  return currentMinutes >= start || currentMinutes < end
}

export function canReceiveLiveNotifications(settings: UserSettings, now: Date = new Date()): boolean {
  if (!settings.notificationsEnabled) return false
  return !isWithinNightModeWindow(settings, now)
}

/**
 * User settings service
 * Currently uses localStorage, can be replaced with API in the future
 */
export const userSettingsService = {
  /**
   * Get user settings
   */
  getSettings(): UserSettings {
    if (typeof window === 'undefined') return defaultSettings
    
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY)
      if (stored) {
        return { ...defaultSettings, ...JSON.parse(stored) }
      }
    } catch (error) {
      console.error('[user-settings] Failed to parse settings:', error)
    }
    
    return defaultSettings
  },

  /**
   * Save user settings
   */
  saveSettings(settings: Partial<UserSettings>): UserSettings {
    if (typeof window === 'undefined') return defaultSettings
    
    const current = this.getSettings()
    const updated = { ...current, ...settings }
    
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated))
    } catch (error) {
      console.error('[user-settings] Failed to save settings:', error)
    }
    
    return updated
  },

  /**
   * Reset settings to defaults
   */
  resetSettings(): UserSettings {
    if (typeof window === 'undefined') return defaultSettings
    
    localStorage.removeItem(SETTINGS_STORAGE_KEY)
    return defaultSettings
  },

  /**
   * Clear all user data
   */
  clearAllData(): void {
    if (typeof window === 'undefined') return
    
    const keysToRemove = [
      SETTINGS_STORAGE_KEY,
      'familyapp_token',
      'familyapp_refresh_token',
      'familyapp_current_user',
    ]
    
    const prefixes = ['familyapp_profile_', 'familyapp_family_']
    
    for (const key of Object.keys(localStorage)) {
      if (keysToRemove.includes(key) || prefixes.some(p => key.startsWith(p))) {
        localStorage.removeItem(key)
      }
    }
  },

  // TODO: API methods (when backend is implemented)
  // async syncSettings(): Promise<UserSettings> {
  //   const settings = await httpClient.get<UserSettings>('/api-gateway/user-service/settings')
  //   localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
  //   return settings
  // },
  //
  // async updateSettingsOnServer(settings: Partial<UserSettings>): Promise<UserSettings> {
  //   const updated = await httpClient.put<UserSettings>('/api-gateway/user-service/settings', settings)
  //   localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated))
  //   return updated
  // },
}
