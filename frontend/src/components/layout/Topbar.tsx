import React from 'react'
import { useRouter } from 'next/navigation'
import { Menu, LogOut, Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from 'next-themes'
import { LogoLink } from '../common/Logo'
import { authService } from '../../services/authService'
import { ROUTES } from '../../config/constants'

import { UserAvatar } from '../ui/UserAvatar'

interface TopbarProps {
  onMenuClick?: () => void
  user: {
    name: string
    email: string
    role?: string
    picture?: string | null
  } | null
}

export function Topbar({ onMenuClick, user }: TopbarProps) {
  const router = useRouter()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => setMounted(true), [])

  const handleLogout = async () => {
    try {
      await authService.logout()
      router.push(ROUTES.HOME)
    } catch {
      router.push(ROUTES.HOME)
    }
  }

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark')
    else if (theme === 'dark') setTheme('system')
    else setTheme('light')
  }

  const ThemeIcon = () => {
    if (!mounted) return <Sun className="h-4 w-4" />
    if (theme === 'system') return <Monitor className="h-4 w-4" />
    if (resolvedTheme === 'dark') return <Moon className="h-4 w-4" />
    return <Sun className="h-4 w-4" />
  }

  const themeLabel = !mounted
    ? 'Light'
    : theme === 'system'
      ? 'System'
      : resolvedTheme === 'dark'
        ? 'Dark'
        : 'Light'

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 h-[72px] border-b border-border-default transition-all duration-300 bg-background-surface/85 backdrop-blur-xl"
      style={{
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div className="flex items-center justify-between h-full px-8 max-w-[1600px] mx-auto">
        {/* Left: Menu + Logo */}
        <div className="flex items-center gap-6">
          {onMenuClick && (
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2.5 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/30 text-text-secondary hover:text-primary dark:hover:text-primary-400 transition-all duration-200"
              aria-label="Toggle menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}

          <div className="hover:scale-[1.02] transition-transform duration-200">
            <LogoLink variant="full" size="lg" />
          </div>
        </div>

        {/* Right: Theme Toggle + User Profile + Logout */}
        <div className="flex items-center gap-4">
          {/* Theme Toggle */}
          <button
            onClick={cycleTheme}
            className="group relative flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-text-secondary hover:text-primary hover:bg-primary-50 dark:hover:bg-primary-50/10 transition-all duration-200"
            aria-label={`Switch theme (current: ${themeLabel})`}
            title={`Theme: ${themeLabel}`}
          >
            <div className="p-1.5 rounded-lg bg-background-subtle group-hover:bg-primary-100 dark:group-hover:bg-primary-900/30 transition-colors duration-200">
              <ThemeIcon />
            </div>
            <span className="hidden lg:inline">{themeLabel}</span>
          </button>

          {/* Vertical Divider */}
          <div className="h-8 w-px bg-border-default hidden sm:block" />

          {/* User Profile Pill */}
          <div className="group flex items-center gap-3 pl-1.5 pr-5 py-1.5 rounded-full bg-background-surface border border-border-default hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 cursor-pointer">
            <div className="relative">
              <div className="absolute -inset-0.5 bg-gradient-to-tr from-primary to-primary-300 rounded-full opacity-0 group-hover:opacity-20 blur-[2px] transition-opacity duration-300" />
              {user ? (
                <UserAvatar
                  name={user.name}
                  src={user.picture}
                  className="w-9 h-9 border-2 border-background-surface shadow-sm"
                />
              ) : (
                <div className="w-9 h-9 bg-gradient-primary text-white rounded-full flex items-center justify-center text-sm font-bold shadow-sm">
                  U
                </div>
              )}
            </div>

            <span className="hidden md:block text-[14px] font-bold text-text-primary group-hover:text-primary transition-colors duration-200">
              {user?.name}
            </span>
          </div>

          {/* Vertical Divider */}
          <div className="h-8 w-px bg-border-default hidden sm:block" />

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="group flex items-center gap-2.5 px-4 py-2 rounded-xl text-sm font-semibold text-text-secondary hover:text-error hover:bg-error-50 dark:hover:bg-error-50/10 transition-all duration-200"
          >
            <div className="p-1.5 rounded-lg bg-background-subtle group-hover:bg-error-100 dark:group-hover:bg-error-900/30 transition-colors duration-200">
              <LogOut className="h-4 w-4" />
            </div>
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  )
}
