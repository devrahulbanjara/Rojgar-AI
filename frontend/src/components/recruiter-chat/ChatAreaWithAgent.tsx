'use client'

import { useEffect, useRef, useState } from 'react'
import type { ComponentPropsWithoutRef, FormEvent, KeyboardEvent, UIEvent, WheelEvent } from 'react'
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
  RecruiterChatStreamEvent,
  SalaryResearchSource,
  ToolResultEnvelope,
  WebSearchSource,
} from '@/lib/types/recruiterChat'
import { useAppSelector } from '@/store/hooks'
import { ArrowUp, RotateCcw, Square } from 'lucide-react'
import remarkGfm from 'remark-gfm'

import { CandidateCardGrid } from './CandidateCardGrid'
import { CandidateDetailPanel } from './CandidateDetailPanel'
import { JobCardGrid } from './JobCardGrid'
import { JobEditDiffCard } from './JobEditDiffCard'
import { ToolErrorMessage } from './ToolErrorMessage'
import { RecruiterChatPanelSkeleton } from './skeletons'
import { getToolActivityLabel, getUiTypeToolName } from './utils'

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

interface ChatCitation {
  label: string
  url: string
  meta: string | null
}

function dedupeChatCitations(sources: ChatCitation[]): ChatCitation[] {
  const seen = new Set<string>()
  return sources.filter((source) => {
    const key = source.url || `${source.label}:${source.meta ?? ''}`
    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}

function getChatCitationsFromToolMessage(message: ChatHistoryMessage): ChatCitation[] {
  if (message.role !== 'tool') {
    return []
  }

  if (message.name === 'research_salary') {
    const envelope = parseToolEnvelope<{ sources?: SalaryResearchSource[] }>(
      message.name,
      message.content,
    )
    const sources = envelope.data?.sources
    if (!Array.isArray(sources)) {
      return []
    }

    return sources
      .filter(
        (source): source is SalaryResearchSource =>
          Boolean(source) &&
          typeof source.source_name === 'string' &&
          typeof source.url === 'string',
      )
      .map((source) => ({
        label: source.source_name,
        url: source.url,
        meta:
          [source.quoted_min, source.quoted_max]
            .filter((value) => value != null)
            .map((value) => `${value}`)
            .join(' - ') ||
          source.notes ||
          null,
      }))
  }

  if (message.name === 'web_search') {
    const envelope = parseToolEnvelope<{ sources?: WebSearchSource[] }>(
      message.name,
      message.content,
    )
    const sources = envelope.data?.sources
    if (!Array.isArray(sources)) {
      return []
    }

    return sources
      .filter(
        (source): source is WebSearchSource =>
          Boolean(source) &&
          typeof source.title === 'string' &&
          typeof source.url === 'string' &&
          typeof source.snippet === 'string',
      )
      .map((source) => ({
        label: source.title,
        url: source.url,
        meta: source.snippet,
      }))
  }

  return []
}

function SourcesFooter({ sources }: { sources: ChatCitation[] }) {
  if (!sources.length) return null

  return (
    <span className="recruiter-chat-inline-citations">
      <span className="recruiter-chat-sources-list">
        {sources.map((source, index) => (
          <a
            key={`${source.url}-${index}`}
            href={source.url}
            target="_blank"
            rel="noreferrer"
            className="recruiter-chat-source-chip"
            title={
              source.meta
                ? `${source.label}\n${source.url}\n${source.meta}`
                : `${source.label}\n${source.url}`
            }
            aria-label={
              source.meta
                ? `${source.label}. ${source.url}. ${source.meta}`
                : `${source.label}. ${source.url}`
            }
          >
            [{index + 1}]
          </a>
        ))}
      </span>
    </span>
  )
}

function AssistantTextWithCitations({
  content,
  citations,
}: {
  content: string
  citations: ChatCitation[]
}) {
  const footer = citations.length > 0 ? <SourcesFooter sources={citations} /> : undefined

  return (
    <div className="recruiter-chat-assistant-copy">
      <MarkdownMessage content={content} footer={footer} />
    </div>
  )
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
  const envelope = parseToolEnvelope<Record<string, unknown>>(toolName, message.content)
  return renderToolEnvelope(toolName, envelope)
}

function renderToolEnvelope(
  toolName: string,
  envelope: ToolResultEnvelope<Record<string, unknown> | null>,
): React.ReactNode | null {
  if (toolName === 'list_company_jobs') {
    const typedEnvelope = envelope as ToolResultEnvelope<CompanyJobListResult | null>

    if (!typedEnvelope.ok || !typedEnvelope.data) {
      return (
        <ToolErrorMessage
          text={getToolErrorText(typedEnvelope, "You don't have any company jobs posted yet.")}
        />
      )
    }

    return <JobCardGrid data={typedEnvelope.data} />
  }

  if (toolName === 'search_company_candidates') {
    const typedEnvelope = envelope as ToolResultEnvelope<CandidateSearchResult | null>

    if (!typedEnvelope.ok || !typedEnvelope.data) {
      return (
        <ToolErrorMessage
          text={getToolErrorText(
            typedEnvelope,
            'No matching candidates were found for that request.',
          )}
        />
      )
    }

    return <CandidateCardGrid data={typedEnvelope.data} />
  }

  if (toolName === 'research_salary') {
    return null
  }

  if (toolName === 'get_candidate_detail') {
    const typedEnvelope = envelope as ToolResultEnvelope<CandidateDetailData | null>

    if (!typedEnvelope.ok || !typedEnvelope.data) {
      return (
        <ToolErrorMessage
          text={getToolErrorText(typedEnvelope, 'Candidate details could not be loaded.')}
        />
      )
    }

    return <CandidateDetailPanel data={typedEnvelope.data} />
  }

  if (toolName === 'prepare_job_edit') {
    const typedEnvelope = envelope as ToolResultEnvelope<JobEditPreviewData | null>

    if (!typedEnvelope.ok || !typedEnvelope.data) {
      return (
        <ToolErrorMessage
          text={getToolErrorText(typedEnvelope, 'The proposed job edit could not be prepared.')}
        />
      )
    }

    return null
  }

  if (toolName === 'clarify_job_selection' || toolName === 'clarify_candidate_selection') {
    return null
  }

  if (toolName === 'web_search') {
    return null
  }

  return (
    <ToolErrorMessage text={getToolErrorText(envelope, 'Unable to render this tool result.')} />
  )
}

function MarkdownMessage({ content, footer }: { content: string; footer?: React.ReactNode }) {
  return (
    <div className="recruiter-chat-markdown-container">
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
      {footer}
    </div>
  )
}

function ThinkingBubble() {
  return (
    <div className="recruiter-chat-assistant-bubble recruiter-chat-assistant-bubble--cursor">
      <span className="recruiter-chat-cursor-dots" aria-hidden="true">
        <span className="recruiter-chat-cursor-dot" />
        <span className="recruiter-chat-cursor-dot recruiter-chat-cursor-dot--2" />
        <span className="recruiter-chat-cursor-dot recruiter-chat-cursor-dot--3" />
      </span>
      <span className="recruiter-chat-cursor-label">Thinking…</span>
    </div>
  )
}

function ToolActivityPill({ toolName }: { toolName: string }) {
  return (
    <div className="recruiter-chat-tool-activity">
      <span className="recruiter-chat-cursor-dots" aria-hidden="true">
        <span className="recruiter-chat-cursor-dot" />
        <span className="recruiter-chat-cursor-dot recruiter-chat-cursor-dot--2" />
        <span className="recruiter-chat-cursor-dot recruiter-chat-cursor-dot--3" />
      </span>
      <span>{getToolActivityLabel(toolName)}</span>
    </div>
  )
}

function AgentSteps({ steps }: { steps: Array<{ key: string; name: string; text: string }> }) {
  if (!steps.length) return null

  return (
    <details className="recruiter-chat-agent-steps">
      <summary>Agent steps</summary>
      <div className="recruiter-chat-agent-steps__list">
        {steps.map((step) => (
          <div key={step.key} className="recruiter-chat-agent-steps__item">
            <div className="recruiter-chat-agent-steps__name">{step.name}</div>
            <div className="recruiter-chat-agent-steps__text">{step.text || 'Completed.'}</div>
          </div>
        ))}
      </div>
    </details>
  )
}

export function ChatAreaWithAgent({ onMessageSent, session }: ChatAreaWithAgentProps) {
  const accessToken = useAppSelector((state) => state.auth.accessToken)
  const [history, setHistory] = useState<ChatHistoryMessage[]>([])
  const [pendingInterrupt, setPendingInterrupt] = useState<ChatInterruptPayload | null>(null)
  const [draftMessage, setDraftMessage] = useState('')
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [isThinking, setIsThinking] = useState(false)
  const [streamingAssistantText, setStreamingAssistantText] = useState('')
  const [streamingToolName, setStreamingToolName] = useState<string | null>(null)
  const [streamingStructuredResult, setStreamingStructuredResult] =
    useState<React.ReactNode | null>(null)
  const [streamingWebSources, setStreamingWebSources] = useState<WebSearchSource[]>([])
  const [streamError, setStreamError] = useState<string | null>(null)
  const [lastSubmittedMessage, setLastSubmittedMessage] = useState<string | null>(null)
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true)
  const scrollViewRef = useRef<HTMLDivElement | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const historyBeforeSendRef = useRef<ChatHistoryMessage[]>([])
  const streamingAssistantTextRef = useRef('')

  useEffect(() => {
    streamingAssistantTextRef.current = streamingAssistantText
  }, [streamingAssistantText])

  useEffect(() => {
    if (!isAutoScrollEnabled) return

    const scrollView = scrollViewRef.current
    if (!scrollView) return

    const behavior: ScrollBehavior =
      isSending || Boolean(streamingAssistantText) || isThinking ? 'smooth' : 'auto'

    scrollView.scrollTo({
      top: scrollView.scrollHeight,
      behavior,
    })
  }, [
    history,
    isAutoScrollEnabled,
    isSending,
    isThinking,
    pendingInterrupt,
    streamingAssistantText,
  ])

  useEffect(() => {
    setIsAutoScrollEnabled(true)
    setStreamError(null)
    setStreamingAssistantText('')
    setIsThinking(false)
    setStreamingToolName(null)
    setStreamingStructuredResult(null)
    setStreamingWebSources([])
  }, [session.id])

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

  const applyFinalExchange = (exchange: {
    history: ChatHistoryMessage[]
    interrupt: ChatInterruptPayload | null
  }) => {
    setHistory(exchange.history ?? [])
    setPendingInterrupt(exchange.interrupt ?? null)
    setStreamingAssistantText('')
    setIsThinking(false)
    setStreamingToolName(null)
    setStreamingStructuredResult(null)
    setStreamingWebSources([])
    onMessageSent()
  }

  const startStreamingMessage = async (
    message: string,
    { appendOptimisticUser }: { appendOptimisticUser: boolean },
  ) => {
    const optimisticUserMessage: ChatHistoryMessage = {
      role: 'user',
      content: message,
    }

    historyBeforeSendRef.current = history
    abortControllerRef.current = new AbortController()
    setIsSending(true)
    setIsThinking(true)
    setIsAutoScrollEnabled(true)
    setPendingInterrupt(null)
    setStreamingAssistantText('')
    setStreamingToolName(null)
    setStreamingStructuredResult(null)
    setStreamingWebSources([])
    setStreamError(null)
    setLastSubmittedMessage(message)

    if (appendOptimisticUser) {
      setHistory((currentHistory) => [...currentHistory, optimisticUserMessage])
    }

    try {
      const response = await fetch(`/api/recruiter-chat/sessions/${session.id}/messages/stream`, {
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
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok || !response.body) {
        const fallbackPayload = (await response
          .json()
          .catch(() => null)) as ChatExchangeApiResponse | null
        throw new Error(fallbackPayload?.message || `Request failed with status ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done })

        let newlineIndex = buffer.indexOf('\n')
        while (newlineIndex >= 0) {
          const line = buffer.slice(0, newlineIndex).trim()
          buffer = buffer.slice(newlineIndex + 1)

          if (line) {
            const event = JSON.parse(line) as RecruiterChatStreamEvent

            if (event.type === 'thinking') {
              setIsThinking(true)
              setStreamingToolName(null)
            } else if (event.type === 'message_start') {
              setIsThinking(false)
              setStreamingToolName(null)
            } else if (event.type === 'tool_call') {
              setStreamingToolName(event.tool)
            } else if (event.type === 'message_delta') {
              setIsThinking(false)
              setStreamingToolName(null)
              setStreamingAssistantText((currentText) => currentText + event.content)
            } else if (event.type === 'web_sources') {
              setStreamingWebSources(
                dedupeChatCitations(
                  event.sources.map((source) => ({
                    label: source.title,
                    url: source.url,
                    meta: source.snippet,
                  })),
                ).map((source) => ({
                  title: source.label,
                  url: source.url,
                  snippet: source.meta ?? '',
                })),
              )
            } else if (event.type === 'structured_result') {
              const toolName = getUiTypeToolName(event.ui_type)
              setStreamingToolName(null)
              setStreamingStructuredResult(
                toolName
                  ? renderToolEnvelope(toolName, {
                      tool: toolName,
                      ok: true,
                      text: '',
                      ui_type_hint: event.ui_type,
                      data: event.data,
                    })
                  : null,
              )
            } else if (event.type === 'final') {
              applyFinalExchange(event.data)
            } else if (event.type === 'error') {
              throw new Error(event.message || 'Recruiter chat request failed.')
            }
          }

          newlineIndex = buffer.indexOf('\n')
        }

        if (done) {
          const trailingLine = buffer.trim()
          if (trailingLine) {
            const event = JSON.parse(trailingLine) as RecruiterChatStreamEvent
            if (event.type === 'final') {
              applyFinalExchange(event.data)
            } else if (event.type === 'error') {
              throw new Error(event.message || 'Recruiter chat request failed.')
            }
          }
          break
        }
      }
    } catch (error) {
      const aborted = abortControllerRef.current?.signal.aborted ?? false

      if (aborted) {
        if (streamingAssistantTextRef.current.trim()) {
          setHistory((currentHistory) => [
            ...currentHistory,
            {
              role: 'assistant',
              content: streamingAssistantTextRef.current.trim(),
            },
          ])
        }
      } else {
        setHistory(historyBeforeSendRef.current)
        setStreamError(
          error instanceof Error ? error.message : 'The response stream failed. Please try again.',
        )
      }

      console.warn('Failed to send recruiter chat message:', error)
      setIsThinking(false)
      setStreamingAssistantText('')
      setStreamingToolName(null)
      setStreamingStructuredResult(null)
      setStreamingWebSources([])
    } finally {
      abortControllerRef.current = null
      setIsSending(false)
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const message = draftMessage.trim()
    if (!message || isComposerDisabled) return

    setDraftMessage('')
    await startStreamingMessage(message, { appendOptimisticUser: true })
  }

  const handleRetry = async () => {
    if (!lastSubmittedMessage || isSending) return
    await startStreamingMessage(lastSubmittedMessage, { appendOptimisticUser: true })
  }

  const handleStopGeneration = () => {
    abortControllerRef.current?.abort()
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

  const handleThreadScroll = (event: UIEvent<HTMLDivElement>) => {
    const scrollView = event.currentTarget
    const remainingDistance =
      scrollView.scrollHeight - scrollView.scrollTop - scrollView.clientHeight
    setIsAutoScrollEnabled(remainingDistance <= 96)
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

      const previousToolMessages: ChatHistoryMessage[] = []
      let previousCursor = index - 1
      while (history[previousCursor]?.role === 'tool') {
        previousToolMessages.unshift(history[previousCursor])
        previousCursor -= 1
      }

      const followingToolMessages: ChatHistoryMessage[] = []
      let cursor = index + 1
      while (history[cursor]?.role === 'tool') {
        followingToolMessages.push(history[cursor])
        cursor += 1
      }
      const toolMessages = [...previousToolMessages, ...followingToolMessages]
      const nextToolNode = toolMessages.length > 0 ? renderToolMessage(toolMessages[0]) : null
      const toolSteps = followingToolMessages.map((toolMessage, toolIndex) => ({
        key: `${key}-tool-${toolIndex}`,
        name: toolMessage.name ?? 'tool',
        text: getToolDisplayText(toolMessage),
      }))
      const citations = dedupeChatCitations(
        toolMessages.flatMap((toolMessage) => getChatCitationsFromToolMessage(toolMessage)),
      )

      messageNodes.push(
        <div key={key} className="recruiter-chat-assistant-row recruiter-chat-message-row">
          <ChatBotBadge />
          <div className="recruiter-chat-tool-panel">
            <div className="recruiter-chat-assistant-bubble recruiter-chat-assistant-bubble--inline">
              {citations.length > 0 ? (
                <AssistantTextWithCitations content={message.content} citations={citations} />
              ) : (
                <MarkdownMessage content={message.content} />
              )}
            </div>
            {nextToolNode ? <div className="recruiter-chat-combo-card">{nextToolNode}</div> : null}
            {toolSteps.length > 0 ? <AgentSteps steps={toolSteps} /> : null}
          </div>
        </div>,
      )

      if (followingToolMessages.length > 0) {
        index += followingToolMessages.length
      }

      continue
    }

    const toolNode = renderToolMessage(message)

    if (!toolNode) {
      continue
    }

    if (history[index + 1]?.role === 'assistant') {
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
        <div
          ref={scrollViewRef}
          className="recruiter-chat-scroll-view"
          onScroll={handleThreadScroll}
          onWheel={handleThreadWheel}
        >
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

            {isThinking && !streamingAssistantText ? (
              <div className="recruiter-chat-assistant-row recruiter-chat-message-row">
                <ChatBotBadge />
                <div className="recruiter-chat-tool-panel">
                  <ThinkingBubble />
                  {streamingToolName ? <ToolActivityPill toolName={streamingToolName} /> : null}
                </div>
              </div>
            ) : null}

            {streamingAssistantText ? (
              <div className="recruiter-chat-assistant-row recruiter-chat-message-row">
                <ChatBotBadge />
                <div className="recruiter-chat-tool-panel">
                  <div className="recruiter-chat-assistant-bubble recruiter-chat-assistant-bubble--inline">
                    {streamingWebSources.length > 0 ? (
                      <AssistantTextWithCitations
                        content={streamingAssistantText}
                        citations={streamingWebSources.map((source) => ({
                          label: source.title,
                          url: source.url,
                          meta: source.snippet,
                        }))}
                      />
                    ) : (
                      <MarkdownMessage content={streamingAssistantText} />
                    )}
                  </div>
                  {streamingToolName ? <ToolActivityPill toolName={streamingToolName} /> : null}
                  {streamingStructuredResult ? (
                    <div className="recruiter-chat-combo-card">{streamingStructuredResult}</div>
                  ) : null}
                </div>
              </div>
            ) : null}

            {streamError ? (
              <div className="recruiter-chat-assistant-row recruiter-chat-message-row">
                <ChatBotBadge />
                <div className="recruiter-chat-tool-panel">
                  <div className="recruiter-chat-stream-error">
                    <div className="recruiter-chat-stream-error__title">Response interrupted</div>
                    <div className="recruiter-chat-stream-error__body">{streamError}</div>
                    <button
                      type="button"
                      className="recruiter-chat-stream-error__retry"
                      onClick={() => {
                        void handleRetry()
                      }}
                    >
                      <RotateCcw size={13} />
                      Retry
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

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
              type={isSending ? 'button' : 'submit'}
              className={`recruiter-chat-send-button${
                isSending ? ' recruiter-chat-send-button--stop' : ''
              }`}
              disabled={isSending ? false : isComposerDisabled || draftMessage.trim().length === 0}
              onClick={
                isSending
                  ? () => {
                      handleStopGeneration()
                    }
                  : undefined
              }
              aria-label={isSending ? 'Stop generation' : 'Send message'}
              title={isSending ? 'Stop generation' : 'Send message'}
            >
              {isSending ? <Square size={12} fill="currentColor" /> : <ArrowUp size={14} />}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
