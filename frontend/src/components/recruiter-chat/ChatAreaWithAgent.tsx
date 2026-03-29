'use client'

import { useEffect, useRef, useState } from 'react'
import type { ComponentPropsWithoutRef, FormEvent, KeyboardEvent, UIEvent, WheelEvent } from 'react'
import ReactMarkdown from 'react-markdown'

import Image from 'next/image'

import type {
  ChatExchangeApiResponse,
  ChatHistoryApiResponse,
  ChatHistoryMessage,
  ChatSessionResponse,
  CompanyJobListResult,
  JobEditPreviewData,
  JobOption,
  PendingAction,
  RecruiterChatStreamEvent,
  SourceItem,
} from '@/lib/types/recruiterChat'
import { useAppSelector } from '@/store/hooks'
import { ArrowUp, RotateCcw, Square } from 'lucide-react'
import remarkGfm from 'remark-gfm'

import { JobCardGrid } from './JobCardGrid'
import { JobEditDiffCard } from './JobEditDiffCard'
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

function SourcesFooter({ sources }: { sources: SourceItem[] }) {
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
            title={`${source.title}\n${source.url}`}
            aria-label={`${source.title}. ${source.url}`}
          >
            [{index + 1}]
          </a>
        ))}
      </span>
    </span>
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
      <span className="recruiter-chat-cursor-label">Thinking...</span>
    </div>
  )
}

function AssistantMessage({
  content,
  sources,
  footer,
}: {
  content: string
  sources: SourceItem[]
  footer?: React.ReactNode
}) {
  const resolvedFooter =
    footer || (sources.length ? <SourcesFooter sources={sources} /> : undefined)

  return (
    <div className="recruiter-chat-assistant-bubble recruiter-chat-assistant-bubble--inline">
      <MarkdownMessage content={content} footer={resolvedFooter} />
    </div>
  )
}

function JobSelectionCard({
  options,
  disabled,
  selectedJobId,
  onSelect,
}: {
  options: JobOption[]
  disabled: boolean
  selectedJobId: string | null
  onSelect: (jobId: string) => void
}) {
  return (
    <section className="recruiter-chat-card recruiter-chat-card--clarification">
      <div className="recruiter-chat-card-title">Choose the exact job</div>
      <div className="recruiter-chat-section-stack">
        {options.map((job) => (
          <button
            key={job.job_id}
            type="button"
            className="recruiter-chat-job-mini-row"
            onClick={() => onSelect(job.job_id)}
            disabled={disabled}
            aria-pressed={selectedJobId === job.job_id}
          >
            <div className="recruiter-chat-job-mini-row__title">{job.title}</div>
            <div className="recruiter-chat-job-mini-row__meta">
              <span className="recruiter-chat-job-mini-row__location">
                <span>
                  {[job.location_type, job.location].filter(Boolean).join(', ') ||
                    'No location set'}
                </span>
              </span>
            </div>
          </button>
        ))}
      </div>
    </section>
  )
}

function getSources(data: Record<string, unknown> | null | undefined): SourceItem[] {
  const rawSources = data?.sources
  if (!Array.isArray(rawSources)) return []

  return rawSources.filter((source): source is SourceItem => {
    return Boolean(source) && typeof source === 'object' && 'title' in source && 'url' in source
  })
}

function asJobListResult(data: Record<string, unknown> | null | undefined) {
  return data as unknown as CompanyJobListResult
}

function asJobEditPreviewData(data: Record<string, unknown> | null | undefined) {
  return data as unknown as JobEditPreviewData
}

function renderAssistantCard(
  message: ChatHistoryMessage,
  pendingAction: PendingAction | null,
  isSending: boolean,
  selectedJobId: string | null,
  onConfirmJobSelection: (jobId: string) => void,
  onConfirmJobEdit: (approve: boolean) => void,
) {
  if (message.response_type === 'job_edit_preview' && message.data) {
    const isPending =
      pendingAction?.type === 'job_edit' &&
      pendingAction.data.job_id === asJobEditPreviewData(message.data).job_id

    return (
      <JobEditDiffCard
        data={asJobEditPreviewData(message.data)}
        onCancel={isPending && !isSending ? () => onConfirmJobEdit(false) : undefined}
        onConfirm={isPending && !isSending ? () => onConfirmJobEdit(true) : undefined}
      />
    )
  }

  if (pendingAction?.type === 'job_selection' && message.response_type === 'clarification') {
    return (
      <JobSelectionCard
        options={pendingAction.data.options}
        disabled={isSending}
        selectedJobId={selectedJobId}
        onSelect={onConfirmJobSelection}
      />
    )
  }

  return null
}

export function ChatAreaWithAgent({ onMessageSent, session }: ChatAreaWithAgentProps) {
  const accessToken = useAppSelector((state) => state.auth.accessToken)
  const [history, setHistory] = useState<ChatHistoryMessage[]>([])
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
  const [draftMessage, setDraftMessage] = useState('')
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [isThinking, setIsThinking] = useState(false)
  const [streamingAssistantText, setStreamingAssistantText] = useState('')
  const [streamError, setStreamError] = useState<string | null>(null)
  const [lastSubmittedMessage, setLastSubmittedMessage] = useState<string | null>(null)
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true)
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  // const [selectedJobEcho, setSelectedJobEcho] = useState<ChatHistoryMessage | null>(null)
  const scrollViewRef = useRef<HTMLDivElement | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const historyBeforeSendRef = useRef<ChatHistoryMessage[]>([])
  const streamingAssistantTextRef = useRef('')
  const selectedJobEchoRef = useRef<ChatHistoryMessage | null>(null)

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
  }, [history, isAutoScrollEnabled, isSending, isThinking, pendingAction, streamingAssistantText])

  useEffect(() => {
    setIsAutoScrollEnabled(true)
    setStreamError(null)
    setStreamingAssistantText('')
    setIsThinking(false)
    setPendingAction(null)
    setSelectedJobId(null)
    // setSelectedJobEcho(null)
    selectedJobEchoRef.current = null
  }, [session.id])

  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()

    const loadHistory = async () => {
      setIsLoadingHistory(true)

      try {
        const response = await fetch(`/api/recruiter-chat/sessions/${session.id}/history`, {
          method: 'GET',
          credentials: 'include',
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(`History request failed with status ${response.status}`)
        }

        const payload = (await response.json()) as ChatHistoryApiResponse
        if (cancelled) return

        setHistory(payload.data?.history ?? [])
        setPendingAction(payload.data?.pending_action ?? null)
      } catch (error) {
        if (!controller.signal.aborted && !cancelled) {
          console.warn('Failed to load recruiter chat history:', error)
          setHistory([])
          setPendingAction(null)
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

  const applyExchange = (payload: ChatExchangeApiResponse) => {
    const nextHistory = payload.data?.history ?? []
    const echoedJob = selectedJobEchoRef.current
    if (
      echoedJob &&
      !nextHistory.some(
        (message) => message.role === 'user' && message.content === echoedJob.content,
      )
    ) {
      const insertionIndex = Math.max(nextHistory.length - 1, 0)
      setHistory([
        ...nextHistory.slice(0, insertionIndex),
        echoedJob,
        ...nextHistory.slice(insertionIndex),
      ])
    } else {
      setHistory(nextHistory)
    }
    setPendingAction(payload.data?.pending_action ?? null)
    setSelectedJobId(null)
    // setSelectedJobEcho(null)
    selectedJobEchoRef.current = null
    onMessageSent()
  }

  const applyFinalExchange = (exchange: {
    history: ChatHistoryMessage[]
    pending_action: PendingAction | null
  }) => {
    const nextHistory = exchange.history ?? []
    const echoedJob = selectedJobEchoRef.current
    if (
      echoedJob &&
      !nextHistory.some(
        (message) => message.role === 'user' && message.content === echoedJob.content,
      )
    ) {
      const insertionIndex = Math.max(nextHistory.length - 1, 0)
      setHistory([
        ...nextHistory.slice(0, insertionIndex),
        echoedJob,
        ...nextHistory.slice(insertionIndex),
      ])
    } else {
      setHistory(nextHistory)
    }
    setPendingAction(exchange.pending_action ?? null)
    setStreamingAssistantText('')
    setIsThinking(false)
    setSelectedJobId(null)
    // setSelectedJobEcho(null)
    selectedJobEchoRef.current = null
    onMessageSent()
  }

  const handleStreamEvent = (event: RecruiterChatStreamEvent) => {
    if (event.type === 'start') {
      return
    }

    if (event.type === 'token') {
      setIsThinking(false)
      setStreamingAssistantText((currentText) => currentText + event.data.content)
      return
    }

    if (event.type === 'final') {
      applyFinalExchange(event.data)
      return
    }

    throw new Error(event.data.message || 'Recruiter chat request failed.')
  }

  const startStreamingMessage = async (message: string, appendOptimisticUser: boolean) => {
    const optimisticUserMessage: ChatHistoryMessage = {
      role: 'user',
      content: message,
      created_at: new Date().toISOString(),
      response_type: null,
      data: null,
    }

    historyBeforeSendRef.current = history
    abortControllerRef.current = new AbortController()
    setIsSending(true)
    setIsThinking(true)
    setIsAutoScrollEnabled(true)
    setPendingAction(null)
    setStreamingAssistantText('')
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
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ message }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok || !response.body) {
        throw new Error(`Request failed with status ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done })

        let boundaryIndex = buffer.indexOf('\n\n')
        while (boundaryIndex >= 0) {
          const rawEvent = buffer.slice(0, boundaryIndex)
          buffer = buffer.slice(boundaryIndex + 2)

          const lines = rawEvent
            .split('\n')
            .map((line) => line.trimEnd())
            .filter(Boolean)

          let eventName = 'message'
          const dataLines: string[] = []

          for (const line of lines) {
            if (line.startsWith('event:')) {
              eventName = line.slice(6).trim()
            } else if (line.startsWith('data:')) {
              dataLines.push(line.slice(5).trim())
            }
          }

          if (dataLines.length) {
            const parsedData = JSON.parse(dataLines.join('\n')) as Record<string, unknown>
            handleStreamEvent({
              type: eventName,
              data: parsedData,
            } as RecruiterChatStreamEvent)
          }

          boundaryIndex = buffer.indexOf('\n\n')
        }

        if (done) {
          const trailingEvent = buffer.trim()
          if (trailingEvent) {
            const lines = trailingEvent
              .split('\n')
              .map((line) => line.trimEnd())
              .filter(Boolean)
            let eventName = 'message'
            const dataLines: string[] = []

            for (const line of lines) {
              if (line.startsWith('event:')) {
                eventName = line.slice(6).trim()
              } else if (line.startsWith('data:')) {
                dataLines.push(line.slice(5).trim())
              }
            }

            if (dataLines.length) {
              const parsedData = JSON.parse(dataLines.join('\n')) as Record<string, unknown>
              handleStreamEvent({
                type: eventName,
                data: parsedData,
              } as RecruiterChatStreamEvent)
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
              created_at: new Date().toISOString(),
              response_type: 'text',
              data: null,
            },
          ])
        }
      } else {
        setHistory(historyBeforeSendRef.current)
        setStreamError(
          error instanceof Error ? error.message : 'The response stream failed. Please try again.',
        )
      }

      setIsThinking(false)
      setStreamingAssistantText('')
    } finally {
      abortControllerRef.current = null
      setIsSending(false)
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const message = draftMessage.trim()
    if (!message || isSending || Boolean(pendingAction)) return
    setDraftMessage('')
    await startStreamingMessage(message, true)
  }

  const handleRetry = async () => {
    if (!lastSubmittedMessage || isSending) return
    await startStreamingMessage(lastSubmittedMessage, true)
  }

  const handleStopGeneration = () => {
    abortControllerRef.current?.abort()
  }

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey) return
    event.preventDefault()
    event.currentTarget.form?.requestSubmit()
  }

  const handleThreadWheel = (event: WheelEvent<HTMLDivElement>) => {
    const scrollView = scrollViewRef.current
    if (!scrollView) return
    if (scrollView.scrollHeight <= scrollView.clientHeight) return
    scrollView.scrollTop += event.deltaY
    event.preventDefault()
  }

  const handleThreadScroll = (event: UIEvent<HTMLDivElement>) => {
    const scrollView = event.currentTarget
    const remainingDistance =
      scrollView.scrollHeight - scrollView.scrollTop - scrollView.clientHeight
    setIsAutoScrollEnabled(remainingDistance <= 96)
  }

  const handleConfirmJobSelection = async (jobId: string) => {
    const previousPendingAction = pendingAction
    const selectedJob =
      previousPendingAction?.type === 'job_selection'
        ? (previousPendingAction.data.options.find((option) => option.job_id === jobId) ?? null)
        : null

    setIsSending(true)
    setIsThinking(true)
    setSelectedJobId(jobId)
    setPendingAction(null)
    if (selectedJob) {
      const echoedSelection: ChatHistoryMessage = {
        role: 'user',
        content: selectedJob.title,
        created_at: new Date().toISOString(),
        response_type: null,
        data: null,
      }
      // setSelectedJobEcho(echoedSelection)
      selectedJobEchoRef.current = echoedSelection
      setHistory((currentHistory) => [...currentHistory, echoedSelection])
    }
    try {
      const response = await fetch(
        `/api/recruiter-chat/sessions/${session.id}/confirm-job-selection`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          body: JSON.stringify({ job_id: jobId }),
        },
      )
      const payload = (await response.json()) as ChatExchangeApiResponse
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || `Request failed with status ${response.status}`)
      }
      applyExchange(payload)
    } catch (error) {
      console.warn('Failed to confirm recruiter chat job selection:', error)
      setHistory(historyBeforeSendRef.current)
      setPendingAction(previousPendingAction)
      setSelectedJobId(null)
      // setSelectedJobEcho(null)
      selectedJobEchoRef.current = null
    } finally {
      setIsThinking(false)
      setIsSending(false)
    }
  }

  const handleConfirmJobEdit = async (approve: boolean) => {
    setIsSending(true)
    try {
      const response = await fetch(`/api/recruiter-chat/sessions/${session.id}/confirm-job-edit`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ approve }),
      })
      const payload = (await response.json()) as ChatExchangeApiResponse
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || `Request failed with status ${response.status}`)
      }
      applyExchange(payload)
    } catch (error) {
      console.warn('Failed to record recruiter chat job edit decision:', error)
    } finally {
      setIsSending(false)
    }
  }

  if (isLoadingHistory) {
    return <RecruiterChatPanelSkeleton />
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
            {!history.length ? (
              <div className="recruiter-chat-assistant-row recruiter-chat-message-row">
                <ChatBotBadge />
                <div className="recruiter-chat-assistant-bubble">
                  Hi! I can help with salary research, your company jobs, safe job edits, and
                  recruiting-related current information.
                </div>
              </div>
            ) : null}

            {history.map((message, index) => {
              const key = `${session.id}-${message.role}-${index}`

              if (message.role === 'user') {
                return (
                  <div key={key} className="recruiter-chat-user-row recruiter-chat-message-row">
                    <div className="recruiter-chat-user-bubble">{message.content}</div>
                  </div>
                )
              }

              const sources = getSources(message.data)
              const inlineJobCard =
                message.response_type === 'job_list' && message.data ? (
                  <JobCardGrid data={asJobListResult(message.data)} />
                ) : null
              const card = renderAssistantCard(
                message,
                pendingAction,
                isSending,
                selectedJobId,
                handleConfirmJobSelection,
                handleConfirmJobEdit,
              )

              return (
                <div key={key} className="recruiter-chat-assistant-row recruiter-chat-message-row">
                  <ChatBotBadge />
                  <div className="recruiter-chat-tool-panel">
                    <AssistantMessage
                      content={message.content}
                      sources={sources}
                      footer={inlineJobCard ?? undefined}
                    />
                    {card ? <div className="recruiter-chat-combo-card">{card}</div> : null}
                  </div>
                </div>
              )
            })}

            {isThinking && !streamingAssistantText ? (
              <div className="recruiter-chat-assistant-row recruiter-chat-message-row">
                <ChatBotBadge />
                <div className="recruiter-chat-tool-panel">
                  <ThinkingBubble />
                </div>
              </div>
            ) : null}

            {streamingAssistantText ? (
              <div className="recruiter-chat-assistant-row recruiter-chat-message-row">
                <ChatBotBadge />
                <div className="recruiter-chat-tool-panel">
                  <AssistantMessage content={streamingAssistantText} sources={[]} />
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
          </div>
        </div>

        <form className="recruiter-chat-composer" onSubmit={handleSubmit}>
          <div className="recruiter-chat-input-shell">
            <textarea
              className="recruiter-chat-input-textarea"
              placeholder={
                pendingAction
                  ? 'Resolve the pending recruiter-chat action before sending another message...'
                  : 'Ask about salaries, jobs, edits, or recruiting info...'
              }
              rows={1}
              value={draftMessage}
              onChange={(event) => setDraftMessage(event.target.value)}
              onKeyDown={handleComposerKeyDown}
              disabled={isSending || Boolean(pendingAction)}
            />
            <button
              type={isSending ? 'button' : 'submit'}
              className={`recruiter-chat-send-button${
                isSending ? ' recruiter-chat-send-button--stop' : ''
              }`}
              disabled={
                isSending ? false : Boolean(pendingAction) || draftMessage.trim().length === 0
              }
              onClick={isSending ? handleStopGeneration : undefined}
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
