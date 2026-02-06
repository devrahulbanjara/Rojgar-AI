'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

type SeasonalEvent = 'christmas' | 'newyear' | 'halloween' | 'diwali' | null

const DIWALI_DATES: Record<number, [number, number]> = {
  2025: [10, 20],
  2026: [11, 8],
  2027: [10, 29],
  2028: [10, 17],
  2029: [11, 5],
  2030: [10, 26],
}

function getActiveEvent(): SeasonalEvent {
  const now = new Date()
  const month = now.getMonth() + 1
  const day = now.getDate()
  const year = now.getFullYear()

  if (month === 12 && day >= 20 && day <= 26) return 'christmas'
  if ((month === 12 && day >= 27) || (month === 1 && day <= 3)) return 'newyear'
  if (month === 10 && day >= 25 && day <= 31) return 'halloween'

  const diwaliDate = DIWALI_DATES[year]
  if (diwaliDate) {
    const [dMonth, dDay] = diwaliDate
    if (month === dMonth && Math.abs(day - dDay) <= 2) return 'diwali'
  }

  return null
}

interface LogoProps {
  variant?: 'full' | 'icon' | 'monochrome-dark' | 'monochrome-white'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  showWordmark?: boolean
}

function ChristmasDecoration() {
  return (
    <g>
      <path d="M8.5 2 L13 -5.5 L17.5 2" fill="#DC2626" />
      <rect x="7.5" y="0.5" width="11" height="2.5" rx="1.25" fill="#FFFFFF" />
      <circle cx="13" cy="-5.5" r="2" fill="#FFFFFF" />
      <circle cx="26" cy="5" r="1.2" fill="#DBEAFE" opacity="0.7" />
      <circle cx="3" cy="8" r="0.9" fill="#DBEAFE" opacity="0.5" />
    </g>
  )
}

function NewYearDecoration() {
  return (
    <g>
      <polygon points="9,1.5 13,-6 17,1.5" fill="#8B5CF6" />
      <line x1="9" y1="1.5" x2="17" y2="1.5" stroke="#FBBF24" strokeWidth="1.5" />
      <circle cx="13" cy="-6" r="1.5" fill="#FBBF24" />
      <circle cx="26" cy="4" r="1" fill="#EF4444" opacity="0.7" />
      <circle cx="4" cy="7" r="0.8" fill="#FBBF24" opacity="0.7" />
      <circle cx="27" cy="14" r="0.7" fill="#8B5CF6" opacity="0.5" />
    </g>
  )
}

function HalloweenDecoration() {
  return (
    <g>
      <circle cx="13" cy="13" r="8.25" fill="#F97316" opacity="0.12" />
      <g transform="translate(25, -2)">
        <path
          d="M0 1 C-1 -1, -3 -2.5, -5 -0.5 L-3 0 L-1 -0.5 L0 1 L1 -0.5 L3 0 L5 -0.5 C3 -2.5, 1 -1, 0 1 Z"
          fill="#475569"
        />
      </g>
    </g>
  )
}

function DiwaliDecoration() {
  return (
    <g>
      <circle cx="13" cy="13" r="8.25" fill="#F59E0B" opacity="0.08" />
      <path d="M13 -4.5 C11.5 -2, 11 0, 13 1.5 C15 0, 14.5 -2, 13 -4.5 Z" fill="#F59E0B" />
      <path d="M13 -3.5 C12 -1.5, 11.5 0, 13 0.5 C14.5 0, 14 -1.5, 13 -3.5 Z" fill="#FCD34D" />
      <circle cx="4" cy="6" r="0.8" fill="#FCD34D" opacity="0.6" />
      <circle cx="26" cy="9" r="0.6" fill="#F59E0B" opacity="0.5" />
    </g>
  )
}

function TalentSearchIcon({
  size,
  color,
  event,
}: {
  size: number
  color: string
  event: SeasonalEvent
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="flex-shrink-0"
      style={{ overflow: 'visible' }}
    >
      <circle cx="13" cy="13" r="10" stroke={color} strokeWidth="3.5" fill="none" />
      <line
        x1="21"
        y1="21"
        x2="25"
        y2="25"
        stroke={color}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <circle cx="13" cy="9" r="3" fill={color} />
      <path d="M7.5 20 C7.5 16, 10 14, 13 14 C16 14, 18.5 16, 18.5 20" fill={color} />
      {event === 'christmas' && <ChristmasDecoration />}
      {event === 'newyear' && <NewYearDecoration />}
      {event === 'halloween' && <HalloweenDecoration />}
      {event === 'diwali' && <DiwaliDecoration />}
    </svg>
  )
}

export function Logo({
  variant = 'full',
  size = 'md',
  className = '',
  showWordmark = true,
}: LogoProps) {
  const [event, setEvent] = useState<SeasonalEvent>(null)

  useEffect(() => {
    setEvent(getActiveEvent())
  }, [])

  const sizes = {
    sm: { icon: 20, text: 'text-lg' },
    md: { icon: 28, text: 'text-xl' },
    lg: { icon: 32, text: 'text-2xl' },
  }

  const config = sizes[size]

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
      default:
        return {
          icon: 'hsl(var(--primary))',
          convex: 'hsl(var(--text-primary))',
          hire: 'hsl(var(--primary))',
        }
    }
  }

  const colors = getColors()

  if (!showWordmark) {
    return (
      <div className={className}>
        <TalentSearchIcon size={config.icon} color={colors.icon} event={event} />
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-1.8 ${className}`}>
      <div className="translate-y-0.5">
        <TalentSearchIcon size={config.icon} color={colors.icon} event={event} />
      </div>
      <span className={`${config.text} font-display font-bold tracking-tighter`}>
        <span style={{ color: colors.convex }}>Convex</span>
        <span style={{ color: colors.hire }}>Hire</span>
      </span>
    </div>
  )
}

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
