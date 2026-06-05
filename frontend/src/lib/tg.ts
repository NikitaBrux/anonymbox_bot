// Telegram WebApp bridge — works both inside Telegram and in browser dev
const tg = typeof window !== 'undefined' ? (window as unknown as { Telegram?: { WebApp?: TelegramWebApp } }).Telegram?.WebApp : undefined

interface TelegramWebApp {
  ready(): void
  expand(): void
  close(): void
  initDataUnsafe: {
    user?: {
      id: number
      first_name: string
      last_name?: string
      username?: string
    }
  }
  themeParams: Record<string, string>
  colorScheme: 'light' | 'dark'
  MainButton: {
    text: string
    show(): void
    hide(): void
    onClick(fn: () => void): void
    offClick(fn: () => void): void
    showProgress(leaveActive?: boolean): void
    hideProgress(): void
    enable(): void
    disable(): void
    isVisible: boolean
  }
  BackButton: {
    show(): void
    hide(): void
    onClick(fn: () => void): void
    offClick(fn: () => void): void
  }
  HapticFeedback: {
    impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void
    notificationOccurred(type: 'error' | 'success' | 'warning'): void
    selectionChanged(): void
  }
  openLink(url: string): void
  setHeaderColor(color: string): void
  setBackgroundColor(color: string): void
}

export const webapp = tg ?? null

export function getTelegramUserId(): string {
  const id = tg?.initDataUnsafe?.user?.id
  // Fallback for browser dev: use a fixed dev ID
  return id ? String(id) : 'dev_user_12345'
}

export function getTelegramUser() {
  return tg?.initDataUnsafe?.user ?? { id: 12345, first_name: 'Dev', username: 'devuser' }
}

export function haptic(type: 'light' | 'medium' | 'success' | 'error' = 'light') {
  if (!tg?.HapticFeedback) return
  if (type === 'success' || type === 'error') {
    tg.HapticFeedback.notificationOccurred(type)
  } else {
    tg.HapticFeedback.impactOccurred(type)
  }
}

// Apply TG theme CSS vars
export function applyTheme() {
  if (!tg) return
  const params = tg.themeParams
  const map: Record<string, string> = {
    bg_color: '--tg-theme-bg-color',
    text_color: '--tg-theme-text-color',
    hint_color: '--tg-theme-hint-color',
    link_color: '--tg-theme-link-color',
    button_color: '--tg-theme-button-color',
    button_text_color: '--tg-theme-button-text-color',
    secondary_bg_color: '--tg-theme-secondary-bg-color',
  }
  for (const [key, cssVar] of Object.entries(map)) {
    if (params[key]) document.documentElement.style.setProperty(cssVar, params[key])
  }
}
