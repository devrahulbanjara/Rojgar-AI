'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'

import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { clearBackendConnectionIssue } from '@/store/slices/uiSlice'

const PING_EVERY_MS = 5000

function subscribe(callback: () => void) {
  window.addEventListener('online', callback)
  window.addEventListener('offline', callback)
  return () => {
    window.removeEventListener('online', callback)
    window.removeEventListener('offline', callback)
  }
}

async function ping(): Promise<boolean> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/health`, {
      cache: 'no-store',
    })
    return res.ok
  } catch {
    return false
  }
}

/**
 * A slim bar at the top while the browser is offline or the server can't be
 * reached. It sits in the page flow (never over buttons or the cookie bar)
 * and goes away by itself once a health check succeeds.
 */
export function OfflineBar() {
  const dispatch = useAppDispatch()
  const online = useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  )
  const apiIssue = useAppSelector((s) => s.ui.backendConnection.hasIssue)
  const [serverDown, setServerDown] = useState(false)

  useEffect(() => {
    if (!online || !apiIssue) return
    let cancelled = false
    async function check() {
      const ok = await ping()
      if (cancelled) return
      setServerDown(!ok)
      if (ok) dispatch(clearBackendConnectionIssue())
    }
    void check()
    const timer = window.setInterval(() => void check(), PING_EVERY_MS)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [online, apiIssue, dispatch])

  const show = !online || (apiIssue && serverDown)
  if (!show) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="app-surface flex h-8 min-h-0 items-center justify-center bg-foreground px-4 text-center text-xs font-medium text-background"
    >
      {online
        ? "Can't reach the server. We'll reconnect automatically."
        : "You're offline. We'll reconnect automatically."}
    </div>
  )
}
