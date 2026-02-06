'use client'

import Link from 'next/link'

interface LogoProps {
  variant?: 'full' | 'icon' | 'monochrome-dark' | 'monochrome-white'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  showWordmark?: boolean
}

export function Logo({
  variant = 'full',
  size = 'md',
  className = '',
  showWordmark = true,
}: LogoProps) {
  const sizes = {
    sm: {
      icon: 20,
      text: 'text-lg',
    },
    md: {
      icon: 28,
      text: 'text-xl',
    },
    lg: {
      icon: 32,
      text: 'text-2xl',
    },
  }

  const config = sizes[size]

  // Use CSS custom properties so colors adapt to light/dark theme automatically
  const getColors = () => {
    switch (variant) {
      case 'icon':
        return {
          icon: 'hsl(var(--primary))',
          convex: 'hsl(var(--text-primary))',
          hire: 'hsl(var(--primary))',
        }
      case 'monochrome-dark':
        return {
          icon: 'hsl(var(--text-primary))',
          convex: 'hsl(var(--text-primary))',
          hire: 'hsl(var(--text-primary))',
        }
      case 'monochrome-white':
        return {
          icon: '#FFFFFF',
          convex: '#FFFFFF',
          hire: '#FFFFFF',
        }
      default: // 'full'
        return {
          icon: 'hsl(var(--primary))',
          convex: 'hsl(var(--text-primary))',
          hire: 'hsl(var(--primary))',
        }
    }
  }

  const colors = getColors()

  // Neural Node Icon (Option B - Connected Neural Network)
  const NeuralIcon = () => (
    <svg
      width={config.icon}
      height={config.icon}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="flex-shrink-0"
    >
      {/* Connection Lines */}
      <line x1="16" y1="6" x2="8" y2="16" stroke={colors.icon} strokeWidth="1.5" opacity="0.6" />
      <line x1="16" y1="6" x2="24" y2="16" stroke={colors.icon} strokeWidth="1.5" opacity="0.6" />
      <line x1="8" y1="16" x2="16" y2="26" stroke={colors.icon} strokeWidth="1.5" opacity="0.6" />
      <line x1="24" y1="16" x2="16" y2="26" stroke={colors.icon} strokeWidth="1.5" opacity="0.6" />

      {/* Top Node */}
      <circle cx="16" cy="6" r="3" fill={colors.icon} opacity="0.2" />
      <circle cx="16" cy="6" r="3" stroke={colors.icon} strokeWidth="1.5" fill="none" />

      {/* Left Node */}
      <circle cx="8" cy="16" r="3" fill={colors.icon} opacity="0.2" />
      <circle cx="8" cy="16" r="3" stroke={colors.icon} strokeWidth="1.5" fill="none" />

      {/* Right Node */}
      <circle cx="24" cy="16" r="3" fill={colors.icon} opacity="0.2" />
      <circle cx="24" cy="16" r="3" stroke={colors.icon} strokeWidth="1.5" fill="none" />

      {/* Bottom Node */}
      <circle cx="16" cy="26" r="3" fill={colors.icon} opacity="0.2" />
      <circle cx="16" cy="26" r="3" stroke={colors.icon} strokeWidth="1.5" fill="none" />
    </svg>
  )

  if (!showWordmark) {
    return (
      <div className={className}>
        <NeuralIcon />
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <NeuralIcon />
      <span className={`${config.text} font-display font-bold tracking-tighter`}>
        <span style={{ color: colors.convex }}>Convex</span>
        <span style={{ color: colors.hire }}>Hire</span>
      </span>
    </div>
  )
}

// Convenience component for linking logo to home
export function LogoLink({
  variant = 'full',
  size = 'md',
  className = '',
  showWordmark = true,
}: LogoProps) {
  return (
    <Link href="/" className={`inline-flex ${className}`}>
      <Logo variant={variant} size={size} showWordmark={showWordmark} />
    </Link>
  )
}
