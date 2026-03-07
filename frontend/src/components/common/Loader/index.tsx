import React from 'react'

interface LoaderProps {
  /** Visual size of the spinner. Defaults to "md". */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Optional label shown below the spinner. Hidden when omitted. */
  label?: string
  /** Fill the nearest positioned ancestor (e.g. a panel). Defaults to false. */
  fill?: boolean
  /** Extra class names forwarded to the root element. */
  className?: string
}

/**
 * Blue circular spinner — the single loader used across the whole app.
 *
 * Usage:
 *   <Loader />                        // bare spinner
 *   <Loader label="Loading…" />       // spinner + text
 *   <Loader fill size="lg" />         // centered inside a panel
 */
export default function Loader({ size = 'md', label, fill = false, className = '' }: LoaderProps) {
  return (
    <div
      className={['loader', `loader--${size}`, fill ? 'loader--fill' : '', className]
        .filter(Boolean)
        .join(' ')}
      role="status"
      aria-label={label ?? 'Loading'}
    >
      <svg
        className="loader__ring"
        viewBox="0 0 44 44"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Track circle */}
        <circle className="loader__track" cx="22" cy="22" r="18" />
        {/* Spinning arc */}
        <circle className="loader__arc" cx="22" cy="22" r="18" />
      </svg>
      {label && <span className="loader__label">{label}</span>}
    </div>
  )
}
