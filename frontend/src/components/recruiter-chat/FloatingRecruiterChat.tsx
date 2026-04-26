'use client'

import { useState, useSyncExternalStore } from 'react'

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

  return (
    <>
      <button
        type="button"
        className="floating-chat-fab"
        onClick={handleToggle}
        aria-label={isOpen ? 'Close recruiter chat' : 'Open recruiter chat'}
      >
        {isOpen ? (
          <X size={24} />
        ) : (
          <Image
            src="/logo/icon-light.png"
            alt="Chat"
            width={32}
            height={32}
            className="floating-chat-fab__icon"
          />
        )}
      </button>

      {isOpen && (
        <div className="floating-chat-panel">
          <div className="floating-chat-panel__header">
            <div className="floating-chat-panel__header-left">
              <Image
                src="/logo/icon-dark.png"
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
