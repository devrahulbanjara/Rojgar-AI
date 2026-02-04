'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../lib/queryClient'
import { API_BASE_URL } from '../config/constants'
import { useAuth } from './useAuth'

interface ActivityEvent {
  type: 'activity' | 'connection'
  event?: string
  data?: {
    id: string
    type: 'application' | 'status_change' | 'job_post' | 'interview' | 'offer'
    user: string
    action: string
    target: string
    timestamp: string
    metadata: Record<string, unknown>
  }
  status?: string
  organization_id?: string
}

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const queryClient = useQueryClient()
  const { isAuthenticated } = useAuth()

  const connect = useCallback(() => {
    if (!isAuthenticated) return

    const apiUrl = new URL(API_BASE_URL)
    const protocol = apiUrl.protocol === 'https:' ? 'wss:' : 'ws:'

    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`
      const parts = value.split(`; ${name}=`)
      if (parts.length === 2) return parts.pop()?.split(';').shift()
      return null
    }
    const token = getCookie('auth_token')

    let wsUrl = `${protocol}//${apiUrl.host}/api/v1/ws/activity`
    if (token) {
      wsUrl += `?token=${encodeURIComponent(token)}`
    }

    try {
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        setIsConnected(true)
        setError(null)
        reconnectAttemptsRef.current = 0
        console.warn('WebSocket connected')
      }

      ws.onmessage = event => {
        if (event.data === 'pong') {
          return
        }

        try {
          const data: ActivityEvent = JSON.parse(event.data)

          if (data.type === 'connection' && data.status === 'connected') {
            console.warn('WebSocket connection confirmed')
            return
          }

          if (data.type === 'activity' && data.data) {
            // Invalidate and immediately refetch activity queries
            queryClient.invalidateQueries({
              queryKey: queryKeys.dashboard.activity,
            })
            queryClient.refetchQueries({
              queryKey: queryKeys.dashboard.activity,
            })
            // Also invalidate stats
            queryClient.invalidateQueries({
              queryKey: queryKeys.dashboard.stats,
            })
            queryClient.refetchQueries({
              queryKey: queryKeys.dashboard.stats,
            })
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err)
        }
      }

      ws.onerror = () => {}

      ws.onclose = event => {
        setIsConnected(false)
        reconnectAttemptsRef.current += 1

        if (event.code === 1008) {
          console.error('WebSocket authentication failed')
          setError(new Error('WebSocket authentication failed'))
          return
        } else if (event.code === 1006 && reconnectAttemptsRef.current <= 1) {
          console.warn('WebSocket connection failed - retrying...')
        }

        if (isAuthenticated && event.code !== 1000) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, 3000)
        }
      }
    } catch (err) {
      console.error('Error creating WebSocket:', err)
      setError(err as Error)
      setIsConnected(false)
    }
  }, [isAuthenticated, queryClient])

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    setIsConnected(false)
    reconnectAttemptsRef.current = 0
  }

  useEffect(() => {
    if (isAuthenticated) {
      connect()
    } else {
      disconnect()
    }

    return () => {
      disconnect()
    }
  }, [isAuthenticated, connect])

  useEffect(() => {
    if (!isConnected || !wsRef.current) return

    const pingInterval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send('ping')
      }
    }, 30000)

    return () => clearInterval(pingInterval)
  }, [isConnected])

  return { isConnected, error }
}
