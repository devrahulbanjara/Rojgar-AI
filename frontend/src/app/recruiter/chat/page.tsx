'use client'

import { useState } from 'react'

import { useRecruiterChatSessions } from '@/hooks/useRecruiterChatSessions'

import { ChatAreaWithAgent } from '@/components/recruiter-chat/ChatAreaWithAgent'
import { ChatSidebar } from '@/components/recruiter-chat/ChatSidebar'
import { ChatTopBar } from '@/components/recruiter-chat/ChatTopBar'
import { MobileSidebarDrawer } from '@/components/recruiter-chat/MobileSidebarDrawer'
import { RecruiterChatPanelSkeleton } from '@/components/recruiter-chat/skeletons'

export default function RecruiterChatPage() {
  const {
    sessions,
    activeSession,
    isLoading,
    createSession,
    selectSession,
    deleteSession,
    refreshSessions,
  } = useRecruiterChatSessions()

  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="recruiter-chat-page container container--app-shell">
      <aside className="recruiter-chat-page__sidebar">
        <ChatSidebar
          sessions={sessions}
          activeSession={activeSession}
          isLoading={isLoading}
          onSelect={selectSession}
          onDelete={deleteSession}
          onNewChat={createSession}
        />
      </aside>

      <MobileSidebarDrawer
        open={sidebarOpen}
        onOpenChange={setSidebarOpen}
        sessions={sessions}
        activeSession={activeSession}
        isLoading={isLoading}
        onSelect={(session) => {
          selectSession(session)
          setSidebarOpen(false)
        }}
        onDelete={deleteSession}
        onNewChat={createSession}
      />

      <div className="recruiter-chat-page__main">
        <ChatTopBar
          isLoading={isLoading}
          title={activeSession?.title ?? null}
          onMenuClick={() => setSidebarOpen(true)}
        />

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
          <div className="recruiter-chat-page__empty">
            <p>Start a new chat to begin your hiring journey.</p>
          </div>
        )}
      </div>
    </div>
  )
}
