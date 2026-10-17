'use client'

import { useRef, useState } from 'react'

import {
  ACTION_LABEL,
  CAPABILITIES,
  type CandidateAnswer,
  type DecisionAction,
  streamCandidateQuestion,
} from '@/lib/api/recruiter'

import { AiSpark, AiText } from '@/components/app/Ai'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const SUGGESTIONS = [
  'Have they done this kind of work before?',
  'What should I ask in the interview?',
  'Anything in the CV that needs checking?',
]

/** "Ask about this candidate": streams an answer with quotes from the CV. */
export function AskBox({
  applicationId,
  onDecide,
}: {
  applicationId: string
  onDecide: (action: DecisionAction) => void
}) {
  const [question, setQuestion] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [text, setText] = useState('')
  const [answer, setAnswer] = useState<CandidateAnswer | null>(null)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  if (!CAPABILITIES.assistant) {
    return (
      <Input
        disabled
        placeholder="Ask about this candidate · coming soon"
        aria-label="Ask about this candidate (coming soon)"
        className="rounded-full bg-card"
      />
    )
  }

  async function ask(message: string) {
    if (!message.trim()) return
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setQuestion(message)
    setStreaming(true)
    setText('')
    setAnswer(null)
    setError(null)
    try {
      const final = await streamCandidateQuestion(
        applicationId,
        { message },
        { onToken: (token) => setText((t) => t + token), signal: controller.signal },
      )
      setAnswer(final)
    } catch (err) {
      if ((err as Error).name !== 'AbortError') setError("Couldn't get an answer. Try again.")
    } finally {
      setStreaming(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <form
        onSubmit={(event) => {
          event.preventDefault()
          void ask(question)
        }}
      >
        <Input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask about this candidate"
          aria-label="Ask about this candidate"
          className="rounded-full bg-card"
        />
      </form>
      {!streaming && !answer ? (
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
      {streaming ? (
        <div className="flex items-start gap-2 text-sm">
          <AiSpark active className="mt-0.5" />
          {text ? <p>{text}</p> : <AiText>Reading the CV…</AiText>}
        </div>
      ) : null}
      {answer ? (
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex items-start gap-2">
            <AiSpark className="mt-0.5" />
            <p>{answer.answer}</p>
          </div>
          {answer.quotes.map((quote) => (
            <p key={quote} className="border-l-2 pl-3 text-xs text-muted-foreground">
              “{quote}”
            </p>
          ))}
          {answer.suggested_action ? (
            <Button
              size="sm"
              variant="outline"
              className="self-start"
              onClick={() => onDecide(answer.suggested_action as DecisionAction)}
            >
              {ACTION_LABEL[answer.suggested_action]}
            </Button>
          ) : null}
        </div>
      ) : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  )
}
