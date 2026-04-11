'use client'

import { RefreshCw } from 'lucide-react'

import ButtonSpinner from './ButtonSpinner'

type DashboardErrorStateProps = {
  error: unknown
  onRetry: () => void | Promise<unknown>
  isRetrying?: boolean
  title?: string
}

export default function DashboardErrorState({
  onRetry,
  isRetrying = false,
  title,
}: DashboardErrorStateProps) {
  return (
    <div className="dash-card dashboard-error-state">
      <div className="dash-card__body">
        <div className="dash-empty-state dashboard-error-state__inner">
          <div className="dashboard-error-state__title">
            {title ?? 'Unable to load dashboard'}
          </div>
          <p className="dashboard-error-state__description">
            Something went wrong while loading this data.
          </p>

          <div className="dashboard-error-state__actions">
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => void onRetry()}
              disabled={isRetrying}
            >
              {isRetrying ? (
                <ButtonSpinner label="Retrying" />
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
    </div>
  )
}
