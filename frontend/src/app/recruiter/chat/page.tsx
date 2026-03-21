'use client'

import { useEffect, useMemo, useState } from 'react'

import { CopilotChat } from '@copilotkit/react-ui'
import { useCoAgent, useThreads } from '@copilotkit/react-core'
import { Loader2, Sparkles } from 'lucide-react'

import ChatActions from '@/components/recruiter-chat/ChatActions'
import { useAppSelector } from '@/store/hooks'
import {
  type RecruiterChatSessionRecord,
  useCreateRecruiterChatSessionMutation,
  useLazyGetRecruiterChatHistoryQuery,
} from '@/store/services/recruiterChatApi'

const RECRUITER_CHAT_SESSION_KEY = 'recruiter_chat_session_v2'

type StoredRecruiterChatSession = Pick<
  RecruiterChatSessionRecord,
  'id' | 'thread_id' | 'company_id' | 'recruiter_id'
>

function readStoredSession(): StoredRecruiterChatSession | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.sessionStorage.getItem(RECRUITER_CHAT_SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredRecruiterChatSession
    if (!parsed.id || !parsed.thread_id || !parsed.company_id || !parsed.recruiter_id) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

function writeStoredSession(session: StoredRecruiterChatSession) {
  if (typeof window === 'undefined') return
  window.sessionStorage.setItem(RECRUITER_CHAT_SESSION_KEY, JSON.stringify(session))
}

function clearStoredSession() {
  if (typeof window === 'undefined') return
  window.sessionStorage.removeItem(RECRUITER_CHAT_SESSION_KEY)
}

export default function RecruiterChatPage() {
  const { user } = useAppSelector((state) => state.auth)
  const [createSession] = useCreateRecruiterChatSessionMutation()
  const [loadHistory] = useLazyGetRecruiterChatHistoryQuery()
  const { setThreadId } = useThreads()

  const [session, setSession] = useState<StoredRecruiterChatSession | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)
  const [initializationError, setInitializationError] = useState<string | null>(null)

  const { setState } = useCoAgent<{
    company_id: string
    recruiter_id: string
    company_name: string
    session_id: string
  }>({
    name: 'recruiter_chat',
    initialState: {
      company_id: '',
      recruiter_id: '',
      company_name: '',
      session_id: '',
    },
    config: session?.thread_id
      ? {
          configurable: {
            thread_id: session.thread_id,
          },
        }
      : undefined,
  })

  useEffect(() => {
    let cancelled = false

    async function bootstrapSession() {
      setInitializationError(null)

      try {
        const stored = readStoredSession()

        if (stored) {
          try {
            await loadHistory(stored.id, true).unwrap()
            if (!cancelled) {
              setSession(stored)
            }
            return
          } catch {
            clearStoredSession()
          }
        }

        const response = await createSession().unwrap()
        const nextSession: StoredRecruiterChatSession = {
          id: response.data.id,
          thread_id: response.data.thread_id,
          company_id: response.data.company_id,
          recruiter_id: response.data.recruiter_id,
        }

        if (!cancelled) {
          setSession(nextSession)
          writeStoredSession(nextSession)
        }
      } catch {
        if (!cancelled) {
          setInitializationError('Unable to open recruiter chat right now.')
        }
      } finally {
        if (!cancelled) {
          setIsInitializing(false)
        }
      }
    }

    void bootstrapSession()

    return () => {
      cancelled = true
    }
  }, [createSession, loadHistory])

  useEffect(() => {
    if (!session) return

    setThreadId(session.thread_id)
    setState({
      company_id: session.company_id,
      recruiter_id: session.recruiter_id,
      company_name: '',
      session_id: session.id,
    })
  }, [session, setState, setThreadId])

  const greeting = useMemo(
    () =>
      user?.full_name
        ? `Hi ${user.full_name.split(' ')[0]}! I can help you find candidates, research salaries, edit jobs, or look up applicant details.`
        : 'Hi! I can help you find candidates, research salaries, edit jobs, or look up applicant details.',
    [user?.full_name],
  )

  if (isInitializing) {
    return (
      <div className="dash-content container container--app-shell recruiter-chat-page">
        <div className="dash-page-header">
          <div className="dash-page-header__left">
            <h2 className="dash-page-header__title">Recruiter Chat</h2>
            <p className="dash-page-header__subtitle">
              Search candidates, explore compensation, and update jobs with review before changes land.
            </p>
          </div>
        </div>

        <div className="recruiter-chat-shell">
          <div className="recruiter-chat-loading">
            <Loader2 size={18} className="recruiter-chat-loading__icon" />
            <span>Opening recruiter assistant…</span>
          </div>
        </div>
      </div>
    )
  }

  if (initializationError || !session) {
    return (
      <div className="dash-content container container--app-shell recruiter-chat-page">
        <div className="dash-page-header">
          <div className="dash-page-header__left">
            <h2 className="dash-page-header__title">Recruiter Chat</h2>
            <p className="dash-page-header__subtitle">
              Search candidates, explore compensation, and update jobs with review before changes land.
            </p>
          </div>
        </div>

        <div className="recruiter-chat-shell">
          <div className="recruiter-chat-empty">
            <div className="recruiter-chat-empty__icon">
              <Sparkles size={22} strokeWidth={1.8} />
            </div>
            <h3>Recruiter assistant is unavailable.</h3>
            <p>{initializationError ?? 'We could not restore your chat session.'}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="dash-content container container--app-shell recruiter-chat-page">
      <div className="dash-page-header">
        <div className="dash-page-header__left">
          <h2 className="dash-page-header__title">Recruiter Chat</h2>
          <p className="dash-page-header__subtitle">
            Search company candidates, research salary bands, and handle job edits in one conversation.
          </p>
        </div>
      </div>

      <div className="recruiter-chat-shell recruiter-chat-shell--copilot">
        <ChatActions />
        <CopilotChat
          className="recruiter-copilot-chat"
          labels={{
            title: 'Recruiter Assistant',
            initial: greeting,
          }}
        />
      </div>
    </div>
  )
}
