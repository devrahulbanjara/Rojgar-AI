'use client'

import { parseApiError } from '@/lib/apiError'
import { LIVE_DATA_UNAVAILABLE_MESSAGE } from '@/lib/backendConnection'
import { AlertCircle, RefreshCw, ServerCrash } from 'lucide-react'

import ButtonSpinner from './ButtonSpinner'

type DashboardErrorStateProps = {
  error: unknown
  onRetry: () => void | Promise<unknown>
  isRetrying?: boolean
  title?: string
}

function getFailureCopy(error: unknown): {
  title: string
  description: string
  tips: string[]
} {
  const parsed = parseApiError(error, {}, 'Unable to load the dashboard right now.')

  if (parsed.status === 'FETCH_ERROR' || parsed.status === 'TIMEOUT_ERROR') {
    return {
      title: 'Live data is temporarily unavailable',
      description:
        'We could not load the latest dashboard information right now. Some sections may appear empty until the connection is restored.',
      tips: [
        'Try again in a moment.',
        'Refresh the page if the issue continues.',
        'Check your connection or try again later if the issue persists.',
      ],
    }
  }

  if (parsed.status === 401 || parsed.status === 403) {
    return {
      title: 'Your dashboard session needs attention',
      description: 'Your current session could not access this dashboard data.',
      tips: [
        'Refresh the page to retry the session.',
        'Sign in again if your session expired.',
        'Verify that this account still has access to the current dashboard role.',
      ],
    }
  }

  return {
    title: 'Dashboard data is temporarily unavailable',
    description: parsed.message || LIVE_DATA_UNAVAILABLE_MESSAGE,
    tips: [
      'Retry the request once to check if this was temporary.',
      'Refresh the page if the issue keeps happening.',
      'Try again later if the service is still unavailable.',
    ],
  }
}

export default function DashboardErrorState({
  error,
  onRetry,
  isRetrying = false,
  title,
}: DashboardErrorStateProps) {
  const copy = getFailureCopy(error)

  return (
    <div className="dash-card dashboard-error-state">
      <div className="dash-card__body">
        <div className="dash-empty-state dashboard-error-state__inner">
          <div className="dashboard-error-state__iconWrap" aria-hidden="true">
            <ServerCrash className="dashboard-error-state__icon" />
          </div>

          <div className="dashboard-error-state__eyebrow">
            <AlertCircle size={14} aria-hidden="true" />
            Dashboard issue
          </div>

          <div className="dashboard-error-state__title">{title ?? copy.title}</div>
          <p className="dashboard-error-state__description">{copy.description}</p>

          <div className="dashboard-error-state__tips">
            {copy.tips.map((tip) => (
              <div key={tip} className="dashboard-error-state__tip">
                {tip}
              </div>
            ))}
          </div>

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
