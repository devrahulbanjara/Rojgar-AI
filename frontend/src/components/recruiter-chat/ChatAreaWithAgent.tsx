'use client'

import { useEffect, useRef, useState } from 'react'
import type { ComponentPropsWithoutRef, FormEvent, KeyboardEvent, WheelEvent } from 'react'
import ReactMarkdown from 'react-markdown'

import Image from 'next/image'

import type {
  CandidateDetailData,
  CandidateSearchResult,
  ChatExchangeApiResponse,
  ChatHistoryApiResponse,
  ChatHistoryMessage,
  ChatInterruptPayload,
  ChatSessionResponse,
  CompanyJobListResult,
  JobEditPreviewData,
  SalaryResearchResult,
  ToolResultEnvelope,
} from '@/lib/types/recruiterChat'
import { useAppSelector } from '@/store/hooks'
import { ArrowUp } from 'lucide-react'
import remarkGfm from 'remark-gfm'

import { CandidateCardGrid } from './CandidateCardGrid'
import { CandidateDetailPanel } from './CandidateDetailPanel'
import { JobCardGrid } from './JobCardGrid'
import { JobEditDiffCard } from './JobEditDiffCard'
import { SalaryBandCard } from './SalaryBandCard'
import { ToolErrorMessage } from './ToolErrorMessage'
import { RecruiterChatPanelSkeleton } from './skeletons'

interface ChatAreaWithAgentProps {
  session: ChatSessionResponse
  onMessageSent: () => void
}

function ChatBotBadge() {
  return (
    <span
      className="recruiter-chat-message-avatar recruiter-chat-message-avatar--assistant"
      aria-hidden="true"
    >
      <Image
        src="/logo/icon-light.png"
        alt=""
        width={16}
        height={16}
        className="recruiter-chat-bot-mark"
      />
    </span>
  )
}

function parseToolEnvelope<TData>(
  toolName: string,
  content: string | undefined,
): ToolResultEnvelope<TData | null> {
  if (!content) {
    return {
      tool: toolName,
      ok: false,
      text: '',
      ui_type_hint: 'text',
      data: null,
    }
  }

  try {
    const parsed = JSON.parse(content) as Partial<ToolResultEnvelope<TData | null>>

    return {
      tool: parsed.tool ?? toolName,
      ok: parsed.ok ?? false,
      text: parsed.text ?? '',
      ui_type_hint: parsed.ui_type_hint ?? 'text',
      data: parsed.data ?? null,
    }
  } catch {
    return {
      tool: toolName,
      ok: false,
      text: content,
      ui_type_hint: 'text',
      data: null,
    }
  }
}

function getToolErrorText(envelope: ToolResultEnvelope<unknown>, fallback: string): string {
  return envelope.text?.trim() || fallback
}

function getToolDisplayText(message: ChatHistoryMessage): string {
  const envelope = parseToolEnvelope<Record<string, unknown>>(
    message.name ?? 'tool',
    message.content,
  )
  return envelope.text?.trim() || ''
}

function shouldHideAssistantSummary(content: string): boolean {
  const normalized = content.trim()

  if (!normalized) return false

  return (
    /^found\s+\d+\s+matching\s+candidate/i.test(normalized) ||
    /^\d+\s+candidate(?:s)?\s+found[.!]?$/i.test(normalized) ||
    /^\d+\s+matching\s+candidate(?:s)?\s+found[.!]?$/i.test(normalized) ||
    /^found\s+\d+\s+candidate(?:s)?[.!]?$/i.test(normalized)
  )
}

function ClarificationCard({
  question,
  subtitle,
  disabled,
  onConfirm,
  onReject,
}: {
  question: string
  subtitle: string
  disabled: boolean
  onConfirm: () => void
  onReject: () => void
}) {
  return (
    <div className="recruiter-chat-card recruiter-chat-card--clarification">
      <div className="recruiter-chat-clarification__question">{question}</div>
      <div className="recruiter-chat-clarification__subtitle">{subtitle}</div>
      <div className="recruiter-chat-clarification__actions">
        <button
          type="button"
          className="recruiter-chat-clarification__button recruiter-chat-clarification__button--primary"
          onClick={onConfirm}
          disabled={disabled}
        >
          Yes
        </button>
        <button
          type="button"
          className="recruiter-chat-clarification__button recruiter-chat-clarification__button--secondary"
          onClick={onReject}
          disabled={disabled}
        >
          No
        </button>
      </div>
    </div>
  )
}

function renderInterruptCard(
  interrupt: ChatInterruptPayload,
  isSending: boolean,
  onRespond: (action: 'confirm' | 'cancel' | 'reject', patch?: Record<string, unknown>) => void,
): React.ReactNode {
  if (interrupt.type === 'job_edit_preview') {
    return (
      <JobEditDiffCard
        data={interrupt.proposal}
        onConfirm={(patch) => {
          onRespond('confirm', patch)
        }}
        onCancel={() => {
          onRespond('cancel')
        }}
      />
    )
  }

  if (interrupt.type === 'job_clarification') {
    const job = interrupt.job_clarification
    const meta = [job.status, job.location].filter(Boolean).join(' • ')

    return (
      <ClarificationCard
        question={job.question}
        subtitle={meta || job.job_title}
        disabled={isSending}
        onConfirm={() => onRespond('confirm')}
        onReject={() => onRespond('reject')}
      />
    )
  }

  const candidate = interrupt.candidate_clarification
  const subtitle = `${candidate.candidate_name} • ${candidate.job_title} • ${candidate.application_status}`

  return (
    <ClarificationCard
      question={candidate.question}
      subtitle={subtitle}
      disabled={isSending}
      onConfirm={() => onRespond('confirm')}
      onReject={() => onRespond('reject')}
    />
  )
}

function renderToolMessage(message: ChatHistoryMessage): React.ReactNode | null {
  const toolName = message.name ?? 'tool'

  if (toolName === 'list_company_jobs') {
    const envelope = parseToolEnvelope<CompanyJobListResult>(toolName, message.content)

    if (!envelope.ok || !envelope.data) {
      return (
        <ToolErrorMessage
          text={getToolErrorText(envelope, "You don't have any company jobs posted yet.")}
        />
      )
    }

    return <JobCardGrid data={envelope.data} />
  }

  if (toolName === 'search_company_candidates') {
    const envelope = parseToolEnvelope<CandidateSearchResult>(toolName, message.content)

    if (!envelope.ok || !envelope.data) {
      return (
        <ToolErrorMessage
          text={getToolErrorText(envelope, 'No matching candidates were found for that request.')}
        />
      )
    }

    return <CandidateCardGrid data={envelope.data} />
  }

  if (toolName === 'research_salary') {
    const envelope = parseToolEnvelope<SalaryResearchResult>(toolName, message.content)

    if (!envelope.ok || !envelope.data) {
      return (
        <ToolErrorMessage
          text={getToolErrorText(envelope, 'Could not fetch salary data for that request.')}
        />
      )
    }

    return <SalaryBandCard data={envelope.data} />
  }

  if (toolName === 'get_candidate_detail') {
    const envelope = parseToolEnvelope<CandidateDetailData>(toolName, message.content)

    if (!envelope.ok || !envelope.data) {
      return (
        <ToolErrorMessage
          text={getToolErrorText(envelope, 'Candidate details could not be loaded.')}
        />
      )
    }

    return <CandidateDetailPanel data={envelope.data} />
  }

  if (toolName === 'prepare_job_edit') {
    const envelope = parseToolEnvelope<JobEditPreviewData>(toolName, message.content)

    if (!envelope.ok || !envelope.data) {
      return (
        <ToolErrorMessage
          text={getToolErrorText(envelope, 'The proposed job edit could not be prepared.')}
        />
      )
    }

    return null
  }

  if (toolName === 'clarify_job_selection' || toolName === 'clarify_candidate_selection') {
    return null
  }

  const envelope = parseToolEnvelope<Record<string, unknown>>(toolName, message.content)
  return (
    <ToolErrorMessage text={getToolErrorText(envelope, 'Unable to render this tool result.')} />
  )
}

function MarkdownMessage({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
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
        code: ({ children }) => <code className="recruiter-chat-markdown-code">{children}</code>,
        li: ({ children }) => <li className="recruiter-chat-markdown-item">{children}</li>,
        ol: ({ children }) => (
          <ol className="recruiter-chat-markdown-list recruiter-chat-markdown-list--ordered">
            {children}
          </ol>
        ),
        p: ({ children }) => <p className="recruiter-chat-markdown-paragraph">{children}</p>,
        strong: ({ children }) => (
          <strong className="recruiter-chat-markdown-strong">{children}</strong>
        ),
        ul: ({ children }) => <ul className="recruiter-chat-markdown-list">{children}</ul>,
      }}
    >
      {content}
    </ReactMarkdown>
  )
}

export function ChatAreaWithAgent({ onMessageSent, session }: ChatAreaWithAgentProps) {
  const accessToken = useAppSelector((state) => state.auth.accessToken)
  const [history, setHistory] = useState<ChatHistoryMessage[]>([])
  const [pendingInterrupt, setPendingInterrupt] = useState<ChatInterruptPayload | null>(null)
  const [draftMessage, setDraftMessage] = useState('')
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const scrollViewRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()

    const loadHistory = async () => {
      setIsLoadingHistory(true)
      setPendingInterrupt(null)

      try {
        const response = await fetch(`/api/recruiter-chat/sessions/${session.id}/history`, {
          method: 'GET',
          credentials: 'include',
          headers: accessToken
            ? {
                Authorization: `Bearer ${accessToken}`,
              }
            : undefined,
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(`History request failed with status ${response.status}`)
        }

        const payload = (await response.json()) as ChatHistoryApiResponse

        if (cancelled) return

        setHistory(payload.data ?? [])
      } catch (error) {
        if (!controller.signal.aborted && !cancelled) {
          console.warn('Failed to load recruiter chat history:', error)
          setHistory([])
        }
      } finally {
        if (!cancelled) {
          setIsLoadingHistory(false)
        }
      }
    }

    void loadHistory()

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [accessToken, session.id])

  const hasNoMessages = !isLoadingHistory && history.length === 0
  const isComposerDisabled = isSending || Boolean(pendingInterrupt)

  const shouldHideAssistantAfterTool = (message: ChatHistoryMessage, index: number) => {
    if (!message.content.trim() || shouldHideAssistantSummary(message.content)) {
      return true
    }

    const previousMessage = history[index - 1]
    if (previousMessage?.role !== 'tool') {
      return false
    }

    return [
      'search_company_candidates',
      'list_company_jobs',
      'research_salary',
      'get_candidate_detail',
      'clarify_job_selection',
      'clarify_candidate_selection',
    ].includes(previousMessage.name ?? '')
  }

  const applyExchange = (payload: ChatExchangeApiResponse) => {
    setHistory(payload.data?.history ?? [])
    setPendingInterrupt(payload.data?.interrupt ?? null)
    onMessageSent()
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const message = draftMessage.trim()
    if (!message || isComposerDisabled) return

    setIsSending(true)

    try {
      const response = await fetch(`/api/recruiter-chat/sessions/${session.id}/messages`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken
            ? {
                Authorization: `Bearer ${accessToken}`,
              }
            : {}),
        },
        body: JSON.stringify({ message }),
      })

      const payload = (await response.json()) as ChatExchangeApiResponse

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || `Request failed with status ${response.status}`)
      }

      setDraftMessage('')
      applyExchange(payload)
    } catch (error) {
      console.warn('Failed to send recruiter chat message:', error)
    } finally {
      setIsSending(false)
    }
  }

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey) {
      return
    }

    event.preventDefault()

    const form = event.currentTarget.form
    if (form) {
      form.requestSubmit()
    }
  }

  const handleThreadWheel = (event: WheelEvent<HTMLDivElement>) => {
    const scrollView = scrollViewRef.current
    if (!scrollView) return

    const canScroll = scrollView.scrollHeight > scrollView.clientHeight
    if (!canScroll) return

    scrollView.scrollTop += event.deltaY
    event.preventDefault()
  }

  const handleInterruptResponse = async (
    action: 'confirm' | 'cancel' | 'reject',
    patch?: Record<string, unknown>,
  ) => {
    setIsSending(true)

    try {
      const response = await fetch(`/api/recruiter-chat/sessions/${session.id}/interrupt`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken
            ? {
                Authorization: `Bearer ${accessToken}`,
              }
            : {}),
        },
        body: JSON.stringify({
          action,
          patch_override: patch ?? null,
        }),
      })

      const payload = (await response.json()) as ChatExchangeApiResponse

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || `Request failed with status ${response.status}`)
      }

      applyExchange(payload)
    } catch (error) {
      console.warn('Failed to respond to recruiter chat review step:', error)
    } finally {
      setIsSending(false)
    }
  }

  if (isLoadingHistory) {
    return <RecruiterChatPanelSkeleton />
  }

  const messageNodes: React.ReactNode[] = []

  for (let index = 0; index < history.length; index += 1) {
    const message = history[index]
    const key = `${session.id}-${message.role}-${message.name ?? 'message'}-${index}`

    if (message.role === 'user') {
      messageNodes.push(
        <div key={key} className="recruiter-chat-user-row recruiter-chat-message-row">
          <div className="recruiter-chat-user-bubble">{message.content}</div>
        </div>,
      )
      continue
    }

    if (message.role === 'assistant') {
      if (shouldHideAssistantAfterTool(message, index)) {
        continue
      }

      const nextMessage = history[index + 1]
      const nextToolNode = nextMessage?.role === 'tool' ? renderToolMessage(nextMessage) : null

      messageNodes.push(
        <div key={key} className="recruiter-chat-assistant-row recruiter-chat-message-row">
          <ChatBotBadge />
          <div className="recruiter-chat-tool-panel">
            <div className="recruiter-chat-assistant-bubble">
              <MarkdownMessage content={message.content} />
            </div>
            {nextToolNode ? <div className="recruiter-chat-combo-card">{nextToolNode}</div> : null}
          </div>
        </div>,
      )

      if (nextToolNode) {
        index += 1
      }

      continue
    }

    const toolNode = renderToolMessage(message)
    const toolText = getToolDisplayText(message)
    const nextMessage = history[index + 1]

    if (!toolNode) {
      continue
    }

    if (toolText && nextMessage?.role === 'assistant' && nextMessage.content.trim() === toolText) {
      continue
    }

    messageNodes.push(
      <div key={key} className="recruiter-chat-assistant-row recruiter-chat-message-row">
        <ChatBotBadge />
        <div className="recruiter-chat-tool-panel">{toolNode}</div>
      </div>,
    )
  }

  return (
    <div className="recruiter-chat-area">
      <div className="recruiter-chat-thread-shell">
        <div ref={scrollViewRef} className="recruiter-chat-scroll-view" onWheel={handleThreadWheel}>
          <div className="recruiter-chat-message-view">
            {hasNoMessages ? (
              <div className="recruiter-chat-assistant-row recruiter-chat-message-row">
                <ChatBotBadge />
                <div className="recruiter-chat-assistant-bubble">
                  Hi! I can help you find candidates, research salaries, edit jobs, or look up
                  applicant details. What do you need?
                </div>
              </div>
            ) : null}

            {messageNodes}

            {pendingInterrupt ? (
              <div className="recruiter-chat-assistant-row recruiter-chat-message-row">
                <ChatBotBadge />
                <div className="recruiter-chat-tool-panel">
                  {renderInterruptCard(pendingInterrupt, isSending, (action, patch) => {
                    void handleInterruptResponse(action, patch)
                  })}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <form className="recruiter-chat-composer" onSubmit={handleSubmit}>
          <div className="recruiter-chat-input-shell">
            <textarea
              className="recruiter-chat-input-textarea"
              placeholder={
                pendingInterrupt
                  ? 'Respond to the pending clarification or review before sending another message...'
                  : 'Ask about candidates, salaries, or jobs...'
              }
              rows={1}
              value={draftMessage}
              onChange={(event) => setDraftMessage(event.target.value)}
              onKeyDown={handleComposerKeyDown}
              disabled={isComposerDisabled}
            />
            <button
              type="submit"
              className="recruiter-chat-send-button"
              disabled={isComposerDisabled || draftMessage.trim().length === 0}
            >
              <ArrowUp size={14} />
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
