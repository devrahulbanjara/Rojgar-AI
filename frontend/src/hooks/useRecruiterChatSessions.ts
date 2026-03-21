'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import type {
  ChatSessionApiResponse,
  ChatSessionResponse,
  ChatSessionsApiResponse,
  EmptyApiResponse,
} from '@/lib/types/recruiterChat'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import type { ApiResponse } from '@/store/services/baseApi'
import { clearCredentials, updateAccessToken } from '@/store/slices/authSlice'

interface UseRecruiterChatSessionsReturn {
  sessions: ChatSessionResponse[]
  activeSession: ChatSessionResponse | null
  isLoading: boolean
  createSession: () => Promise<void>
  selectSession: (session: ChatSessionResponse) => void
  deleteSession: (sessionId: string) => Promise<void>
  refreshSessions: () => Promise<void>
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message
  return 'Unable to complete recruiter chat request.'
}

function getBackendBaseUrl() {
  return process.env.NEXT_PUBLIC_BACKEND_URL ?? process.env.NEXT_PUBLIC_API_URL
}

let refreshPromise: Promise<string | null> | null = null

export function useRecruiterChatSessions(): UseRecruiterChatSessionsReturn {
  const dispatch = useAppDispatch()
  const accessToken = useAppSelector((state) => state.auth.accessToken)
  const [sessions, setSessions] = useState<ChatSessionResponse[]>([])
  const [activeSession, setActiveSession] = useState<ChatSessionResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const initializedRef = useRef(false)

  const refreshAccessToken = useCallback(async () => {
    if (refreshPromise) return refreshPromise

    const backendBaseUrl = getBackendBaseUrl()
    if (!backendBaseUrl) {
      dispatch(clearCredentials())
      return null
    }

    refreshPromise = (async () => {
      try {
        const response = await fetch(`${backendBaseUrl}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        })

        const payload = (await response.json()) as ApiResponse<{
          access_token: string
          token_type: string
        }>

        if (!response.ok || !payload.success || !payload.data?.access_token) {
          dispatch(clearCredentials())
          return null
        }

        dispatch(updateAccessToken(payload.data.access_token))
        return payload.data.access_token
      } catch {
        dispatch(clearCredentials())
        return null
      } finally {
        refreshPromise = null
      }
    })()

    return refreshPromise
  }, [dispatch])

  const request = useCallback(
    async <TResponse>(input: string, init?: RequestInit): Promise<TResponse> => {
      const executeRequest = async (tokenOverride?: string | null) => {
        const headers = new Headers(init?.headers)

        if (!headers.has('Content-Type') && init?.body) {
          headers.set('Content-Type', 'application/json')
        }

        const token = tokenOverride ?? accessToken
        if (token) {
          headers.set('Authorization', `Bearer ${token}`)
        }

        const response = await fetch(input, {
          ...init,
          headers,
          credentials: 'include',
        })

        const text = await response.text()
        let payload = {} as TResponse & { message?: string }

        if (text) {
          try {
            payload = JSON.parse(text) as TResponse & { message?: string }
          } catch {
            payload = { message: text } as TResponse & { message?: string }
          }
        }

        return { response, payload }
      }

      let { response, payload } = await executeRequest()

      if (response.status === 401) {
        const nextAccessToken = await refreshAccessToken()

        if (nextAccessToken) {
          const retried = await executeRequest(nextAccessToken)
          response = retried.response
          payload = retried.payload
        }
      }

      if (!response.ok) {
        throw new Error(
          (payload as { message?: string }).message ||
            `Request failed with status ${response.status}`,
        )
      }

      return payload
    },
    [accessToken, refreshAccessToken],
  )

  const refreshSessions = useCallback(async () => {
    try {
      const payload = await request<ChatSessionsApiResponse>('/api/recruiter-chat/sessions', {
        method: 'GET',
      })

      const nextSessions = payload.data ?? []

      setSessions(nextSessions)
      setActiveSession((current) => {
        if (!nextSessions.length) return null
        if (!current) return nextSessions[0]
        return nextSessions.find((session) => session.id === current.id) ?? nextSessions[0]
      })
    } catch (error) {
      console.warn(getErrorMessage(error))
    }
  }, [request])

  const createSession = useCallback(async () => {
    try {
      const payload = await request<ChatSessionApiResponse>('/api/recruiter-chat/sessions', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      const createdSession = payload.data
      if (!createdSession) return

      setSessions((current) => [
        createdSession,
        ...current.filter((session) => session.id !== createdSession.id),
      ])
      setActiveSession(createdSession)
    } catch (error) {
      console.warn(getErrorMessage(error))
    }
  }, [request])

  const selectSession = useCallback((session: ChatSessionResponse) => {
    setActiveSession(session)
  }, [])

  const deleteSession = useCallback(
    async (sessionId: string) => {
      const isDeletingActiveSession = activeSession?.id === sessionId
      const remainingSessions = sessions.filter((session) => session.id !== sessionId)

      setSessions(remainingSessions)

      if (isDeletingActiveSession) {
        setActiveSession(remainingSessions[0] ?? null)
      }

      try {
        await request<EmptyApiResponse>(`/api/recruiter-chat/sessions/${sessionId}`, {
          method: 'DELETE',
        })
      } catch (error) {
        console.warn(getErrorMessage(error))
        await refreshSessions()
        return
      }

      if (isDeletingActiveSession && remainingSessions.length === 0) {
        await createSession()
      }
    },
    [activeSession?.id, createSession, refreshSessions, request, sessions],
  )

  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true

    const loadInitialSessions = async () => {
      setIsLoading(true)

      try {
        const payload = await request<ChatSessionsApiResponse>('/api/recruiter-chat/sessions', {
          method: 'GET',
        })

        const initialSessions = payload.data ?? []

        if (initialSessions.length === 0) {
          const createdPayload = await request<ChatSessionApiResponse>(
            '/api/recruiter-chat/sessions',
            {
              method: 'POST',
              body: JSON.stringify({}),
            },
          )

          const createdSession = createdPayload.data
          setSessions(createdSession ? [createdSession] : [])
          setActiveSession(createdSession ?? null)
          return
        }

        setSessions(initialSessions)
        setActiveSession(initialSessions[0] ?? null)
      } catch (error) {
        console.warn(getErrorMessage(error))
      } finally {
        setIsLoading(false)
      }
    }

    void loadInitialSessions()
  }, [request])

  return {
    sessions,
    activeSession,
    isLoading,
    createSession,
    selectSession,
    deleteSession,
    refreshSessions,
  }
}
