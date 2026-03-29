'use client'

import { Menu } from 'lucide-react'

interface ChatTopBarProps {
  title: string | null
  isLoading?: boolean
  onMenuClick: () => void
}

export function ChatTopBar({ isLoading = false, onMenuClick, title }: ChatTopBarProps) {
  return (
    <div className="recruiter-chat-topbar">
      <div className="recruiter-chat-topbar__left">
        <button
          type="button"
          className="recruiter-chat-icon-btn recruiter-chat-icon-btn--mobile"
          aria-label="Open chat sessions"
          onClick={onMenuClick}
        >
          <Menu size={18} />
        </button>

        {isLoading ? (
          <div className="recruiter-chat-topbar__title-skeleton" aria-hidden="true" />
        ) : (
          <div
            className={`recruiter-chat-topbar__title${title ? '' : ' recruiter-chat-topbar__title--muted'}`}
          >
            {title ?? 'New conversation'}
          </div>
        )}
      </div>
    </div>
  )
}
