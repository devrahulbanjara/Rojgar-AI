'use client'

import { useLayoutEffect, useMemo } from 'react'
import type { ComponentPropsWithoutRef } from 'react'

import type {
  CandidateDetailData,
  CandidateSearchResult,
  ChatSessionResponse,
  JobEditPreviewData,
  SalaryResearchResult,
  ToolResultEnvelope,
} from '@/lib/types/recruiterChat'
import { useCoAgent, useCopilotAction, useCopilotContext } from '@copilotkit/react-core'
import { CopilotChat } from '@copilotkit/react-ui'

import { CandidateCardGrid } from './CandidateCardGrid'
import { CandidateDetailPanel } from './CandidateDetailPanel'
import { JobEditDiffCard } from './JobEditDiffCard'
import { SalaryBandCard } from './SalaryBandCard'
import { ToolErrorMessage } from './ToolErrorMessage'
import {
  CandidateCardGridSkeleton,
  CandidateDetailSkeleton,
  JobEditDiffCardSkeleton,
  SalaryCardSkeleton,
} from './skeletons'

interface ChatAreaWithAgentProps {
  session: ChatSessionResponse
  onMessageSent: () => void
}

function isToolRunning(status: string) {
  return status === 'executing' || status === 'inProgress'
}

export function ChatAreaWithAgent({ onMessageSent, session }: ChatAreaWithAgentProps) {
  const { setAgentSession, setThreadId, threadId } = useCopilotContext()

  useLayoutEffect(() => {
    setAgentSession({
      agentName: 'recruiter_chat',
      threadId: session.thread_id,
    })

    if (threadId !== session.thread_id) {
      setThreadId(session.thread_id)
    }
  }, [session.thread_id, setAgentSession, setThreadId, threadId])

  if (threadId !== session.thread_id) {
    return <div className="recruiter-chat-area">Loading conversation...</div>
  }

  return <ChatAreaWithBoundThread session={session} onMessageSent={onMessageSent} />
}

function ChatAreaWithBoundThread({ onMessageSent, session }: ChatAreaWithAgentProps) {
  const initialState = useMemo(
    () => ({
      company_id: session.company_id,
      recruiter_id: session.recruiter_id,
      thread_id: session.thread_id,
      session_id: session.id,
    }),
    [session.company_id, session.id, session.recruiter_id, session.thread_id],
  )

  useCoAgent({
    name: 'recruiter_chat',
    initialState,
  })

  useCopilotAction({
    name: 'search_company_candidates',
    available: 'disabled',
    render: ({ args, status }) => {
      const envelope = args as ToolResultEnvelope<CandidateSearchResult>

      if (isToolRunning(status)) return <CandidateCardGridSkeleton />
      if (!envelope?.ok) return <ToolErrorMessage text={envelope?.text ?? ''} />
      if (!envelope.data) return <></>

      return <CandidateCardGrid data={envelope.data} />
    },
  })

  useCopilotAction({
    name: 'research_salary',
    available: 'disabled',
    render: ({ args, status }) => {
      const envelope = args as ToolResultEnvelope<SalaryResearchResult>

      if (isToolRunning(status)) return <SalaryCardSkeleton />
      if (!envelope?.ok) return <ToolErrorMessage text={envelope?.text ?? ''} />
      if (!envelope.data) return <></>

      return <SalaryBandCard data={envelope.data} />
    },
  })

  useCopilotAction({
    name: 'get_candidate_detail',
    available: 'disabled',
    render: ({ args, status }) => {
      const envelope = args as ToolResultEnvelope<CandidateDetailData>

      if (isToolRunning(status)) return <CandidateDetailSkeleton />
      if (!envelope?.ok) return <ToolErrorMessage text={envelope?.text ?? ''} />
      if (!envelope.data) return <></>

      return <CandidateDetailPanel data={envelope.data} />
    },
  })

  useCopilotAction({
    name: 'prepare_job_edit',
    available: 'disabled',
    renderAndWaitForResponse: ({ args, respond, status }) => {
      const envelope = args as ToolResultEnvelope<JobEditPreviewData>

      if (isToolRunning(status)) return <JobEditDiffCardSkeleton />
      if (!envelope?.ok) return <ToolErrorMessage text={envelope?.text ?? ''} />
      if (!envelope.data || !respond) {
        return <ToolErrorMessage text="Unable to confirm this edit right now." />
      }

      return (
        <JobEditDiffCard
          data={envelope.data}
          onConfirm={(patch) => respond({ action: 'confirm', patch_override: patch ?? null })}
          onCancel={() => respond({ action: 'cancel' })}
        />
      )
    },
  })

  useCopilotAction({
    name: 'find_company_job',
    available: 'disabled',
    render: () => <></>,
  })

  useCopilotAction({
    name: 'list_company_jobs',
    available: 'disabled',
    render: () => <></>,
  })

  return (
    <div className="recruiter-chat-area">
      <CopilotChat
        className="recruiter-chat-copilot"
        labels={{
          title: 'Recruiter Assistant',
          initial:
            'Hi! I can help you find candidates, research salaries, edit jobs, or look up applicant details. What do you need?',
          placeholder: 'Ask about candidates, salaries, or jobs...',
        }}
        markdownTagRenderers={{
          p: ({ children }) => <p className="recruiter-chat-markdown-paragraph">{children}</p>,
          strong: ({ children }) => (
            <strong className="recruiter-chat-markdown-strong">{children}</strong>
          ),
          ul: ({ children }) => <ul className="recruiter-chat-markdown-list">{children}</ul>,
          ol: ({ children }) => (
            <ol className="recruiter-chat-markdown-list recruiter-chat-markdown-list--ordered">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="recruiter-chat-markdown-item">{children}</li>,
          code: ({ children }) => <code className="recruiter-chat-markdown-code">{children}</code>,
          a: ({ children, ...props }: ComponentPropsWithoutRef<'a'>) => (
            <a
              href={props.href}
              target="_blank"
              rel="noreferrer"
              className="recruiter-chat-markdown-link"
            >
              {children}
            </a>
          ),
        }}
        onSubmitMessage={() => onMessageSent()}
      />
    </div>
  )
}
