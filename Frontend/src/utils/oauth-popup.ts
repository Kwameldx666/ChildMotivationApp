interface OAuthResult {
  status: 'authenticated' | 'pending' | 'error'
  session?: any
  token?: string
  pendingUser?: any
  error?: string
  provider?: string
}

export function openOAuthPopup(url: string): Promise<OAuthResult> {
  return new Promise((resolve, reject) => {
    const width = 600
    const height = 700
    const left = window.screenX + (window.outerWidth - width) / 2
    const top = window.screenY + (window.outerHeight - height) / 2

    const popup = window.open(
      url,
      'oauth_popup',
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
    )

    if (!popup) {
      reject(new Error('Не удалось открыть окно авторизации. Разрешите всплывающие окна.'))
      return
    }

    // Проверяем закрытие окна
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed)
        window.removeEventListener('message', messageHandler)
        reject(new Error('Окно авторизации было закрыто'))
      }
    }, 500)

    // Обработчик сообщений от popup
    const messageHandler = (event: MessageEvent) => {
      // Проверяем origin для безопасности
      if (event.origin !== window.location.origin) {
        return
      }

      if (event.data.type === 'OAUTH_RESULT') {
        clearInterval(checkClosed)
        window.removeEventListener('message', messageHandler)
        popup.close()
        resolve(event.data.payload as OAuthResult)
      }
    }

    window.addEventListener('message', messageHandler)
  })
}
