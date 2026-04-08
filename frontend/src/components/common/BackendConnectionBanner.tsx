'use client'

import { useState } from 'react'

import { useAppSelector } from '@/store/hooks'
import { AlertCircle, RefreshCw } from 'lucide-react'

import ButtonSpinner from '@/components/common/ButtonSpinner'

export default function BackendConnectionBanner() {
  const [isReloading, setIsReloading] = useState(false)
  const { hasIssue, message } = useAppSelector((state) => state.ui.backendConnection)

  if (!hasIssue) return null

  return (
    <div className="backend-connection-banner" role="alert" aria-live="polite">
      <div className="container container--app-shell">
        <div className="backend-connection-banner__inner">
          <div className="backend-connection-banner__copy">
            <div className="backend-connection-banner__eyebrow">
              <AlertCircle size={14} aria-hidden="true" />
              Connection issue
            </div>
            <div className="backend-connection-banner__title">
              {message ?? 'Live data is temporarily unavailable.'}
            </div>
            <p className="backend-connection-banner__description">
              Some information may appear empty or out of date until the connection is restored.
            </p>
          </div>

          <button
            type="button"
            className="btn btn--primary backend-connection-banner__action"
            disabled={isReloading}
            onClick={() => {
              setIsReloading(true)
              window.location.reload()
            }}
          >
            {isReloading ? (
              <ButtonSpinner label="Refreshing" />
            ) : (
              <>
                <RefreshCw size={16} aria-hidden="true" />
                Try again
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
