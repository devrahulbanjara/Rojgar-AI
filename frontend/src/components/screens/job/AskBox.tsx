'use client'

import { useEffect, useId, useRef, useState } from 'react'

import {
  ACTION_LABEL,
  AssistantError,
  type CandidateAnswer,
  type DecideAction,
  type QuoteSource,
  getCandidateHistory,
  streamCandidateQuestion,
} from '@/lib/api/recruiter'

import { AiGlow, AiSpark, AiText } from '@/components/app/Ai'
import { AskedIcon, ChevronDownIcon, CloseIcon, QuoteIcon, SendIcon } from '@/components/icons'
import { Button, IconButton } from '@/components/ui/button'
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
type Memory = { open: boolean; last: Exchange | null; asked: string[] }

/** Kept while the page is open, so switching applicants and back shows the last answer. */
const memory = new Map<string, Memory>()

const BULLET = /^\s*(?:[-*•·]|\d+[.)])\s+/

/** The model's text as a lead sentence, paragraphs and a real list. */
function AnswerText({ text }: { text: string }) {
  const blocks: ({ kind: 'p'; text: string } | { kind: 'ul'; items: string[] })[] = []
  for (const line of text.split('\n').map((l) => l.trim())) {
    if (!line) continue
    if (BULLET.test(line)) {
      const item = line.replace(BULLET, '')
      const lastBlock = blocks.at(-1)
      if (lastBlock?.kind === 'ul') lastBlock.items.push(item)
      else blocks.push({ kind: 'ul', items: [item] })
    } else blocks.push({ kind: 'p', text: line })
  }
  return (
    <div className="flex max-w-[68ch] flex-col gap-2 text-sm leading-relaxed">
      {blocks.map((block, index) =>
        block.kind === 'p' ? (
          <p key={index} className={index === 0 ? 'font-medium text-foreground' : undefined}>
            {block.text}
          </p>
        ) : (
          <ul
            key={index}
            className="flex list-disc flex-col gap-1.5 pl-5 marker:text-muted-foreground"
          >
            {block.items.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        ),
      )}
    </div>
  )
}

function Evidence({ quotes }: { quotes: CandidateAnswer['quotes'] }) {
  const [open, setOpen] = useState(false)
  if (!quotes.length) return null
  const where = quotes.every((q) => q.source === 'cv') ? 'in the CV' : 'it says this'
  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="link"
        size="sm"
        className="h-auto self-start p-0 text-xs font-normal text-muted-foreground"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? 'Hide' : 'Show'} where {where} ({quotes.length})
        <ChevronDownIcon className={open ? 'rotate-180' : undefined} />
      </Button>
      {open ? (
        <ul className="flex max-w-[68ch] flex-col gap-2">
          {quotes.map((quote) => (
            <li key={quote.text} className="flex gap-2 text-xs text-muted-foreground">
              <QuoteIcon weight="fill" className="mt-0.5 size-3.5 shrink-0" />
              <span>
                {quote.text} <span className="whitespace-nowrap">· {SOURCE[quote.source]}</span>
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

/**
 * "Ask about Nisha": a toggle button. Open, it shows the last answer, a
 * one-line question box with a send button and a few suggestions. It only
 * closes from its own controls.
 */
export function AskBox({
  applicationId,
  firstName,
  actions,
  onDecide,
}: {
  applicationId: string
  firstName: string
  /** Decide actions valid now; a suggestion outside them is not shown. */
  actions: DecideAction[]
  onDecide: (action: DecideAction) => void
}) {
  const remembered = memory.get(applicationId)
  const [open, setOpen] = useState(remembered?.open ?? false)
  const [last, setLast] = useState<Exchange | null>(remembered?.last ?? null)
  const [asked, setAsked] = useState<string[]>(remembered?.asked ?? [])
  const [question, setQuestion] = useState('')
  const [pending, setPending] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const boxId = useId()

  useEffect(() => {
    memory.set(applicationId, { open, last, asked })
  }, [applicationId, open, last, asked])

  // The last answer from earlier visits.
  useEffect(() => {
    let live = true
    if (!memory.get(applicationId)?.last)
      void getCandidateHistory(applicationId).then((messages) => {
        if (!live) return
        setAsked((current) => [
          ...new Set([
            ...current,
            ...messages.filter((m) => m.role === 'user').map((m) => m.content),
          ]),
        ])
        const answerIndex = messages.findLastIndex((m) => m.role === 'assistant')
        const questionMessage = messages.slice(0, answerIndex).findLast((m) => m.role === 'user')
        if (answerIndex < 0 || !questionMessage) return
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

  async function ask(message: string) {
    const clean = message.trim()
    if (!clean || streaming) return
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setPending(clean)
    setAsked((current) => [...new Set([...current, clean])])
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

  const label = `Ask about ${firstName}`
  const suggestions = SUGGESTIONS.filter((s) => !asked.includes(s)).slice(0, 3)
  const action = last?.answer.suggested_action
  const shownQuestion = streaming ? pending : last?.question

  if (!open)
    return (
      <Button
        size="sm"
        variant="outline"
        className="self-start"
        aria-expanded={false}
        aria-controls={boxId}
        onClick={() => setOpen(true)}
      >
        <AiSpark />
        {label}
      </Button>
    )

  return (
    <div id={boxId} className="flex flex-col gap-4 border-t pt-4">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-medium">
          <AiSpark active={streaming} />
          {label}
        </p>
        <IconButton label="Close" size="sm" onClick={() => setOpen(false)}>
          <CloseIcon />
        </IconButton>
      </div>

      {shownQuestion ? (
        <AiGlow active={streaming} className="-mx-3 flex flex-col gap-3 rounded-xl px-3 py-2">
          <p className="flex items-start gap-2 text-xs text-muted-foreground">
            <AskedIcon className="mt-px size-3.5 shrink-0" />
            <span>You asked: {shownQuestion}</span>
          </p>
          {streaming ? (
            text ? (
              <AnswerText text={text} />
            ) : (
              <AiText className="text-sm">Reading the CV…</AiText>
            )
          ) : last ? (
            <>
              <AnswerText text={last.answer.answer} />
              <Evidence quotes={last.answer.quotes} />
              {action && actions.includes(action.action) ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="self-start"
                  onClick={() => onDecide(action.action)}
                >
                  {ACTION_LABEL[action.action]}
                </Button>
              ) : null}
            </>
          ) : null}
        </AiGlow>
      ) : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <form
        className="relative"
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
            if (event.key === 'Escape') setQuestion('')
          }}
          placeholder={last ? 'Ask another question' : label}
          aria-label={label}
          disabled={streaming}
          className="rounded-full bg-background pr-11"
        />
        <IconButton
          type="submit"
          label="Send"
          size="sm"
          disabled={streaming || !question.trim()}
          className="absolute top-1/2 right-1 -translate-y-1/2 text-primary"
        >
          <SendIcon weight="fill" />
        </IconButton>
      </form>
      {!streaming && suggestions.length ? (
        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion) => (
            <Button
              key={suggestion}
              size="xs"
              variant="outline"
              className="rounded-full font-normal"
              onClick={() => void ask(suggestion)}
            >
              {suggestion}
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
