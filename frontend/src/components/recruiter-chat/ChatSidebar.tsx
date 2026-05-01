'use client'

import { useState } from 'react'

import type { ChatSessionResponse } from '@/lib/types/recruiterChat'
import { useAppSelector } from '@/store/hooks'
import { Loader2, Plus, Trash2 } from 'lucide-react'

import Avatar from '@/components/common/Avatar'

import { formatRelativeTime, groupSessionsByDate } from './utils'

export interface ChatSidebarProps {
  sessions: ChatSessionResponse[]
  activeSession: ChatSessionResponse | null
  isLoading: boolean
  onSelect: (session: ChatSessionResponse) => void
  onDelete: (sessionId: string) => Promise<void>
  onNewChat: () => Promise<void>
}

const skeletonWidths = ['full', 'wide', 'full', 'medium', 'full'] as const

export function ChatSidebar({
  activeSession,
  isLoading,
  onDelete,
  onNewChat,
  onSelect,
  sessions,
}: ChatSidebarProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null)
  const user = useAppSelector((state) => state.auth.user)

  const groupedSessions = groupSessionsByDate(sessions)

  const handleNewChat = async () => {
    setIsCreating(true)

    try {
      await onNewChat()
    } finally {
      setIsCreating(false)
    }
  }

  const handleDelete = async (sessionId: string) => {
    setDeletingSessionId(sessionId)

    try {
      await onDelete(sessionId)
    } finally {
      setDeletingSessionId((current) => (current === sessionId ? null : current))
    }
  }

  return (
    <div className="recruiter-chat-sidebar">
      <div className="recruiter-chat-sidebar__header">
        <button
          type="button"
          className="recruiter-chat-sidebar__new-chat"
          onClick={handleNewChat}
          disabled={isCreating}
        >
          {isCreating ? (
            <span className="button-spinner" aria-live="polite">
              <Loader2 size={14} className="button-spinner__icon" />
              <span>Creating...</span>
            </span>
          ) : (
            <>
              <Plus size={14} />
              <span>New Chat</span>
            </>
          )}
        </button>
      </div>

      <div className="recruiter-chat-sidebar__body">
        {isLoading ? (
          <div className="recruiter-chat-sidebar__skeletons" aria-hidden="true">
            {skeletonWidths.map((width, index) => (
              <div
                key={`${width}-${index}`}
                className={`recruiter-chat-session-skeleton recruiter-chat-session-skeleton--${width}`}
              />
            ))}
          </div>
        ) : (
          Object.entries(groupedSessions).map(([label, group]) =>
            group.length ? (
              <div key={label} className="recruiter-chat-session-group">
                <div className="recruiter-chat-session-group__label">{label}</div>

                <div className="recruiter-chat-session-group__items">
                  {group.map((session) => {
                    const isActive = session.id === activeSession?.id
                    const isDeleting = deletingSessionId === session.id

                    return (
                      <div
                        key={session.id}
                        className={`recruiter-chat-session-item${isActive ? ' recruiter-chat-session-item--active' : ''}`}
                      >
                        <button
                          type="button"
                          className="recruiter-chat-session-item__trigger"
                          onClick={() => onSelect(session)}
                        >
                          <div
                            className={`recruiter-chat-session-item__title${session.title ? '' : ' recruiter-chat-session-item__title--muted'}`}
                          >
                            {session.title ?? 'New conversation'}
                          </div>
                          <div className="recruiter-chat-session-item__meta">
                            {formatRelativeTime(session.last_interaction_at ?? session.created_at)}
                          </div>
                        </button>

                        <span
                          className={`recruiter-chat-session-item__delete${isDeleting ? ' recruiter-chat-session-item__delete--visible' : ''}`}
                        >
                          <button
                            type="button"
                            className="recruiter-chat-icon-btn recruiter-chat-icon-btn--delete"
                            aria-label="Delete conversation"
                            onClick={(event) => {
                              event.stopPropagation()
                              void handleDelete(session.id)
                            }}
                          >
                            {isDeleting ? (
                              <Loader2 size={13} className="recruiter-chat-spin" />
                            ) : (
                              <Trash2 size={13} />
                            )}
                          </button>
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : null,
          )
        )}
      </div>

      <div className="recruiter-chat-sidebar__footer">
        <Avatar
          name={user?.full_name ?? 'Recruiter'}
          src={user?.avatar_url}
          seed={user?.id}
          className="recruiter-chat-avatar recruiter-chat-avatar--sidebar"
          sizes="28px"
        />
        <div className="recruiter-chat-sidebar__user">
          <div className="recruiter-chat-sidebar__user-name">{user?.full_name ?? 'Recruiter'}</div>
        </div>
      </div>
    </div>
  )
}
