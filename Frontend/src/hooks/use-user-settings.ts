import { useState, useEffect, useCallback } from 'react'
import { userSettingsService, UserSettings } from '@/services/user-settings-service'

/**
 * Hook for managing user settings
 */
export function useUserSettings() {
  const [settings, setSettings] = useState<UserSettings>(userSettingsService.getSettings)
  const [isLoading, setIsLoading] = useState(false)

  // Subscribe to localStorage changes (for cross-tab synchronization)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'familyapp_user_settings') {
        setSettings(userSettingsService.getSettings())
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  /**
   * Update settings
   */
  const updateSettings = useCallback((updates: Partial<UserSettings>) => {
    const updated = userSettingsService.saveSettings(updates)
    setSettings(updated)
  }, [])

  /**
   * Reset settings to defaults
   */
  const resetSettings = useCallback(() => {
    const defaults = userSettingsService.resetSettings()
    setSettings(defaults)
  }, [])

  /**
   * Clear all user data
   */
  const clearAllData = useCallback(() => {
    setIsLoading(true)
    try {
      userSettingsService.clearAllData()
      setSettings(userSettingsService.getSettings())
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    settings,
    isLoading,
    updateSettings,
    resetSettings,
    clearAllData,
  }
}
