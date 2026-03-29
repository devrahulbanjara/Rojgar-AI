'use client'

import { useEffect } from 'react'

import { X } from 'lucide-react'

import { ChatSidebar, type ChatSidebarProps } from './ChatSidebar'

interface MobileSidebarDrawerProps extends ChatSidebarProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MobileSidebarDrawer({
  onOpenChange,
  onSelect,
  open,
  ...props
}: MobileSidebarDrawerProps) {
  useEffect(() => {
    if (!open) return

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onOpenChange(false)
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onOpenChange, open])

  if (!open) return null

  return (
    <div className="recruiter-chat-mobile-drawer" role="dialog" aria-modal="true">
      <button
        type="button"
        className="recruiter-chat-mobile-drawer__backdrop"
        aria-label="Close sessions"
        onClick={() => onOpenChange(false)}
      />

      <div className="recruiter-chat-mobile-drawer__panel">
        <div className="recruiter-chat-mobile-drawer__close-row">
          <button
            type="button"
            className="recruiter-chat-icon-btn"
            aria-label="Close sessions"
            onClick={() => onOpenChange(false)}
          >
            <X size={16} />
          </button>
        </div>

        <ChatSidebar
          {...props}
          onSelect={(session) => {
            onSelect(session)
            onOpenChange(false)
          }}
        />
      </div>
    </div>
  )
}
