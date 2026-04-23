'use client'

import { useEffect, useState } from 'react'

import { useAppSelector } from '@/store/hooks'
import { Wifi, WifiOff } from 'lucide-react'

type Phase = 'hidden' | 'error' | 'recovering'

export default function BackendConnectionBanner() {
  const hasIssue = useAppSelector((s) => s.ui.backendConnection.hasIssue)
  const [phase, setPhase] = useState<Phase>('hidden')

  useEffect(() => {
    if (hasIssue) {
      setPhase('error')
    } else if (phase === 'error') {
      setPhase('recovering')
      const t = setTimeout(() => setPhase('hidden'), 2000)
      return () => clearTimeout(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasIssue])

  if (phase === 'hidden') return null

  const isRecovered = phase === 'recovering'

  return (
    <div
      className={`conn-status${isRecovered ? ' conn-status--ok' : ''}`}
      role="status"
      aria-live="polite"
    >
      <span className="conn-status__icon" aria-hidden="true">
        {isRecovered ? <Wifi size={16} /> : <WifiOff size={16} />}
      </span>
      <span className="conn-status__text">
        {isRecovered ? 'Back online' : 'Connection lost — retrying\u2026'}
      </span>
    </div>
  )
}
