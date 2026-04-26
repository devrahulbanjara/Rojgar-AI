'use client'

import type { WheelEvent } from 'react'
import { useCallback, useState, useSyncExternalStore } from 'react'

import Image from 'next/image'

import { useRecruiterChatSessions } from '@/hooks/useRecruiterChatSessions'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { setRecruiterChatOpen, toggleRecruiterChat } from '@/store/slices/uiSlice'
import { Clock, Plus, X } from 'lucide-react'

import { ChatAreaWithAgent } from '@/components/recruiter-chat/ChatAreaWithAgent'
import { ChatSidebar } from '@/components/recruiter-chat/ChatSidebar'
import { RecruiterChatPanelSkeleton } from '@/components/recruiter-chat/skeletons'

export default function FloatingRecruiterChat() {
  const dispatch = useAppDispatch()
  const isOpen = useAppSelector((state) => state.ui.isRecruiterChatOpen)

  const {
    sessions,
    activeSession,
    isLoading,
    createSession,
    selectSession,
    deleteSession,
    refreshSessions,
  } = useRecruiterChatSessions()

  const [historyOpen, setHistoryOpen] = useState(false)

  // Trap wheel events inside panel so page behind never scrolls
  const handlePanelWheel = useCallback((e: WheelEvent<HTMLDivElement>) => {
    e.stopPropagation()
  }, [])

  // useSyncExternalStore returns false on server, true on client — avoids hydration mismatch
  const isRendered = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )

  if (!isRendered) return null

  const handleToggle = () => {
    dispatch(toggleRecruiterChat())
  }

  const handleClose = () => {
    dispatch(setRecruiterChatOpen(false))
  }

  // Panel stays mounted (hidden via CSS) so ChatAreaWithAgent doesn't remount/re-fetch
  const hasInitialized = !isLoading || sessions.length > 0

  return (
    <>
      <button
        type="button"
        className="floating-chat-fab"
        onClick={handleToggle}
        aria-label={isOpen ? 'Close recruiter chat' : 'Open recruiter chat'}
      >
        <Image
          src="/logo/icon-light.png"
          alt="Chat"
          width={48}
          height={48}
          className="floating-chat-fab__icon"
        />
      </button>

      {hasInitialized && (
        <div
          className={`floating-chat-panel${isOpen ? '' : ' floating-chat-panel--hidden'}`}
          onWheel={handlePanelWheel}
        >
          <div className="floating-chat-panel__header">
            <div className="floating-chat-panel__header-left">
              <Image
                src="/logo/icon-light.png"
                alt=""
                width={20}
                height={20}
                className="floating-chat-panel__logo"
              />
              <span className="floating-chat-panel__title">ConvexHire Assistant</span>
            </div>
            <div className="floating-chat-panel__header-right">
              <button
                type="button"
                className="floating-chat-panel__icon-btn"
                onClick={() => {
                  void createSession()
                  setHistoryOpen(false)
                }}
                aria-label="New chat"
                title="New Chat"
              >
                <Plus size={16} />
              </button>
              <button
                type="button"
                className="floating-chat-panel__icon-btn"
                onClick={() => setHistoryOpen(!historyOpen)}
                aria-label="Toggle history"
                title="Session History"
              >
                <Clock size={16} />
              </button>
              <button
                type="button"
                className="floating-chat-panel__icon-btn"
                onClick={handleClose}
                aria-label="Close chat"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="floating-chat-panel__body">
            {historyOpen && (
              <div className="floating-chat-panel__drawer">
                <ChatSidebar
                  sessions={sessions}
                  activeSession={activeSession}
                  isLoading={isLoading}
                  onSelect={(session) => {
                    selectSession(session)
                    setHistoryOpen(false)
                  }}
                  onDelete={deleteSession}
                  onNewChat={async () => {
                    await createSession()
                    setHistoryOpen(false)
                  }}
                />
              </div>
            )}

            <div className="floating-chat-panel__main">
              {isLoading ? (
                <RecruiterChatPanelSkeleton />
              ) : activeSession ? (
                <ChatAreaWithAgent
                  key={activeSession.id}
                  session={activeSession}
                  onMessageSent={() => {
                    window.setTimeout(() => {
                      void refreshSessions()
                    }, 1500)
                  }}
                />
              ) : (
                <div className="floating-chat-panel__empty">
                  <div className="floating-chat-panel__empty-content">
                    <p>Start a new chat to begin your hiring journey.</p>
                    <button className="btn btn--primary btn--sm" onClick={createSession}>
                      <Plus size={14} className="icon-left" />
                      New Chat
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
