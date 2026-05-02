'use client'

import { ToastContainer, type ToastIcon } from 'react-toastify'

/**
 * Outlined circle icons matching the pastel toast design.
 * Each icon is a 24px circle outline with the symbol inside, drawn in
 * the same dark stroke as the toast text so it works on every pastel bg.
 */
function CircleIcon({ children }: { children: React.ReactNode }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      {children}
    </svg>
  )
}

const renderIcon: ToastIcon = ({ type }) => {
  switch (type) {
    case 'success':
      return (
        <CircleIcon>
          <path d="M8 12.5l2.75 2.75L16 9.75" />
        </CircleIcon>
      )
    case 'error':
      return (
        <CircleIcon>
          <path d="M9 9l6 6M15 9l-6 6" />
        </CircleIcon>
      )
    case 'warning':
      return (
        <CircleIcon>
          <path d="M12 7.5v5.25" />
          <circle cx="12" cy="16.25" r="0.6" fill="currentColor" stroke="none" />
        </CircleIcon>
      )
    case 'info':
    default:
      return (
        <CircleIcon>
          <path d="M12 11v5.25" />
          <circle cx="12" cy="8" r="0.6" fill="currentColor" stroke="none" />
        </CircleIcon>
      )
  }
}

const CloseButton = ({ closeToast }: { closeToast: (e: React.MouseEvent) => void }) => (
  <button
    type="button"
    className="Toastify__close-button"
    onClick={closeToast}
    aria-label="Close notification"
  >
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  </button>
)

export default function Toaster() {
  return (
    <ToastContainer
      position="top-right"
      autoClose={4000}
      hideProgressBar
      newestOnTop
      closeOnClick={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      icon={renderIcon}
      closeButton={CloseButton}
    />
  )
}
