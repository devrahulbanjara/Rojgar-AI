'use client'

import { useState } from 'react'

import { useRecruiterChatSessions } from '@/hooks/useRecruiterChatSessions'
import type { ChatSessionArtifact } from '@/lib/types/recruiterChat'

import { ChatAreaWithAgent } from '@/components/recruiter-chat/ChatAreaWithAgent'
import { ChatSidebar } from '@/components/recruiter-chat/ChatSidebar'
import { ChatTopBar } from '@/components/recruiter-chat/ChatTopBar'
import { MobileSidebarDrawer } from '@/components/recruiter-chat/MobileSidebarDrawer'
import { RecruiterChatPanelSkeleton } from '@/components/recruiter-chat/skeletons'

function formatArtifactTime(value: string): string {
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function artifactLabel(kind: ChatSessionArtifact['kind']): string {
  if (kind === 'salary_research') return 'Salary research'
  if (kind === 'job_edit') return 'Job edit'
  return 'Saved query'
}

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

        {activeSession?.artifacts?.length ? (
          <div className="recruiter-chat-artifacts">
            {activeSession.artifacts.map((artifact, index) => (
              <div
                key={`${artifact.kind}-${artifact.created_at}-${index}`}
                className="recruiter-chat-artifact"
              >
                <div className="recruiter-chat-artifact__eyebrow">
                  <span>{artifactLabel(artifact.kind)}</span>
                  <span>{formatArtifactTime(artifact.created_at)}</span>
                </div>
                <div className="recruiter-chat-artifact__title">{artifact.title}</div>
                <div className="recruiter-chat-artifact__summary">{artifact.summary}</div>
              </div>
            ))}
          </div>
        ) : null}

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
