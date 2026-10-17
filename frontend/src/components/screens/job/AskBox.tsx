'use client'

import { useEffect, useId, useRef, useState } from 'react'

import {
  ACTION_LABEL,
  AssistantError,
  CAPABILITIES,
  type CandidateAnswer,
  type DecisionAction,
  type QuoteSource,
  getCandidateHistory,
  streamCandidateQuestion,
} from '@/lib/api/recruiter'

import { AiGlow, AiSpark, AiText } from '@/components/app/Ai'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const SUGGESTIONS = [
  'Have they done this kind of work before?',
  'What should I ask in the interview?',
  'Anything in the CV that needs checking?',
]

const SOURCE: Record<QuoteSource, string> = {
  cv: 'CV',
  answers: 'Answers',
  review: 'Review',
  scorecards: 'Interview notes',
  activity: 'Activity',
}

type Exchange = { question: string; answer: CandidateAnswer }

/**
 * "Ask about Nisha": one small button. Opening it shows the question box and
 * three suggestions; answers stream in with quotes from the CV. The box closes
 * again when it is empty and loses focus.
 */
export function AskBox({
  applicationId,
  firstName,
  onDecide,
}: {
  applicationId: string
  firstName: string
  onDecide: (action: DecisionAction) => void
}) {
  const [open, setOpen] = useState(false)
  const [askedHere, setAskedHere] = useState(false)
  const [question, setQuestion] = useState('')
  const [asked, setAsked] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [text, setText] = useState('')
  const [last, setLast] = useState<Exchange | null>(null)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const boxId = useId()

  // Show the last answer from earlier visits.
  useEffect(() => {
    if (!CAPABILITIES.assistant) return
    let live = true
    void getCandidateHistory(applicationId).then((messages) => {
      const answerIndex = messages.findLastIndex((m) => m.role === 'assistant')
      const questionMessage = messages.slice(0, answerIndex).findLast((m) => m.role === 'user')
      if (!live || answerIndex < 0 || !questionMessage) return
      const answer = messages[answerIndex]
      setLast(
        (current) =>
          current ?? {
            question: questionMessage.content,
            answer: {
              answer: answer.content,
              quotes: answer.quotes ?? [],
              suggested_action: null,
              cv_available: true,
            },
          },
      )
    })
    return () => {
      live = false
      abortRef.current?.abort()
    }
  }, [applicationId])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  if (!CAPABILITIES.assistant) return null

  async function ask(message: string) {
    const clean = message.trim()
    if (!clean || streaming) return
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setAsked(clean)
    setAskedHere(true)
    setQuestion('')
    setStreaming(true)
    setText('')
    setError(null)
    try {
      const answer = await streamCandidateQuestion(
        applicationId,
        { message: clean },
        { onToken: (token) => setText((t) => t + token), signal: controller.signal },
      )
      setLast({ question: clean, answer })
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      setError(err instanceof AssistantError ? err.message : "Couldn't get an answer. Try again.")
    } finally {
      setStreaming(false)
    }
  }

  // A past answer shows once the box is opened; a new one stays after it closes.
  const shown = streaming || (!open && !askedHere) ? null : last
  const label = `Ask about ${firstName}`

  return (
    <div
      className="flex flex-col gap-3"
      onBlur={(event) => {
        if (event.currentTarget.contains(event.relatedTarget as Node | null)) return
        if (!question.trim() && !streaming) setOpen(false)
      }}
    >
      {streaming ? (
        <AiGlow active className="p-3">
          <p className="text-xs text-muted-foreground">{asked}</p>
          <div className="mt-1 flex items-start gap-2 text-sm">
            <AiSpark active className="mt-0.5" />
            {text ? (
              <p className="whitespace-pre-line">{text}</p>
            ) : (
              <AiText>Reading the CV…</AiText>
            )}
          </div>
        </AiGlow>
      ) : null}
      {shown ? (
        <div className="flex flex-col gap-2 text-sm">
          <p className="text-xs text-muted-foreground">{shown.question}</p>
          <div className="flex items-start gap-2">
            <AiSpark className="mt-0.5" />
            <p className="whitespace-pre-line">{shown.answer.answer}</p>
          </div>
          {shown.answer.quotes.map((quote) => (
            <p key={quote.text} className="border-l-2 pl-3 text-xs text-muted-foreground">
              “{quote.text}” <span className="whitespace-nowrap">· {SOURCE[quote.source]}</span>
            </p>
          ))}
          {shown.answer.suggested_action ? (
            <Button
              size="sm"
              variant="outline"
              className="self-start"
              onClick={() => onDecide(shown.answer.suggested_action!.action)}
            >
              {ACTION_LABEL[shown.answer.suggested_action.action]}
            </Button>
          ) : null}
        </div>
      ) : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {open || streaming ? (
        <div id={boxId} className="flex flex-col gap-2">
          <form
            onSubmit={(event) => {
              event.preventDefault()
              void ask(question)
            }}
          >
            <Input
              ref={inputRef}
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Escape' && !question) setOpen(false)
              }}
              placeholder={label}
              aria-label={label}
              disabled={streaming}
              className="rounded-full bg-background"
            />
          </form>
          {!streaming && !askedHere ? (
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((suggestion) => (
                <Button
                  key={suggestion}
                  size="sm"
                  variant="outline"
                  className="font-normal"
                  onClick={() => void ask(suggestion)}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          ) : null}
        </div>
      ) : (
        <Button
          size="sm"
          variant="outline"
          className="self-start"
          aria-expanded={false}
          aria-controls={boxId}
          onClick={() => setOpen(true)}
        >
          <AiSpark />
          {askedHere ? 'Ask another question' : label}
        </Button>
      )}
    </div>
  )
}
