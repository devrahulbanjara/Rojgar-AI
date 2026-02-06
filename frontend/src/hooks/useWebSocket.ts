'use client'

import { useEffect, useRef, useState } from 'react'
import { useQueryClient, type QueryClient } from '@tanstack/react-query'
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

class WebSocketManager {
  private static instance: WebSocketManager
  private ws: WebSocket | null = null
  private isConnecting = false
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null
  private reconnectAttempts = 0
  private subscribers = new Set<(connected: boolean, error?: Error) => void>()
  private queryClientRef: QueryClient | null = null
  private isAuthenticatedRef: { current: boolean } = { current: false }

  static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager()
    }
    return WebSocketManager.instance
  }

  subscribe(callback: (connected: boolean, error?: Error) => void) {
    this.subscribers.add(callback)
    callback(this.ws?.readyState === WebSocket.OPEN, undefined)
    
    return () => {
      this.subscribers.delete(callback)
    }
  }

  private notifySubscribers(connected: boolean, error?: Error) {
    this.subscribers.forEach(callback => callback(connected, error))
  }

  setRefs(queryClientRef: QueryClient, isAuthenticatedRef: { current: boolean }) {
    this.queryClientRef = queryClientRef
    this.isAuthenticatedRef = isAuthenticatedRef
  }

  connect() {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return
    }

    if (!this.isAuthenticatedRef.current) {
      return
    }

    this.isConnecting = true

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
      this.ws = ws

      ws.onopen = () => {
        this.isConnecting = false
        this.reconnectAttempts = 0
        if (this.reconnectTimeout) {
          clearTimeout(this.reconnectTimeout)
          this.reconnectTimeout = null
        }
        this.notifySubscribers(true)
      }

      ws.onmessage = event => {
        if (event.data === 'pong') {
          return
        }

        try {
          const data: ActivityEvent = JSON.parse(event.data)

          if (data.type === 'connection' && data.status === 'connected') {
            return
          }

          if (data.type === 'activity' && data.data && this.queryClientRef) {
            this.queryClientRef.invalidateQueries({
              queryKey: queryKeys.dashboard.activity,
            })
            this.queryClientRef.refetchQueries({
              queryKey: queryKeys.dashboard.activity,
            })
            this.queryClientRef.invalidateQueries({
              queryKey: queryKeys.dashboard.stats,
            })
            this.queryClientRef.refetchQueries({
              queryKey: queryKeys.dashboard.stats,
            })
          }
        } catch (err) {
          console.error('WebSocket: Error parsing message:', err)
        }
      }

      ws.onerror = () => {
        this.isConnecting = false
        console.error('WebSocket: Connection error')
      }

      ws.onclose = event => {
        if (this.ws !== ws) return
        
        this.isConnecting = false
        this.ws = null
        this.notifySubscribers(false)
        
        if (event.code === 1000) {
          return
        }
        
        if (event.code === 1008) {
          console.error('WebSocket: Authentication failed')
          this.notifySubscribers(false, new Error('WebSocket authentication failed'))
          return
        }
        
        this.reconnectAttempts += 1
        
        if (event.code === 1006 && this.reconnectAttempts <= 1) {
          console.warn('WebSocket: Connection failed - retrying...')
        }

        if (this.isAuthenticatedRef.current && event.code !== 1000) {
          this.reconnectTimeout = setTimeout(() => {
            if (this.isAuthenticatedRef.current && !this.ws && !this.isConnecting) {
              this.connect()
            }
          }, 3000)
        }
      }
    } catch (err) {
      this.isConnecting = false
      console.error('WebSocket: Error creating connection:', err)
      this.notifySubscribers(false, err as Error)
    }
  }

  disconnect() {
    this.isConnecting = false
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }
    
    if (this.ws) {
      const ws = this.ws
      this.ws = null
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close(1000, 'Disconnecting')
      }
    }
    
    this.notifySubscribers(false)
    this.reconnectAttempts = 0
  }

  startPing() {
    const pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send('ping')
      } else {
        clearInterval(pingInterval)
      }
    }, 30000)
    return () => clearInterval(pingInterval)
  }
}

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const queryClient = useQueryClient()
  const { isAuthenticated } = useAuth()
  const isAuthenticatedRef = useRef(isAuthenticated)
  const queryClientRef = useRef(queryClient)
  const managerRef = useRef<WebSocketManager | null>(null)
  const pingCleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    isAuthenticatedRef.current = isAuthenticated
  }, [isAuthenticated])

  useEffect(() => {
    queryClientRef.current = queryClient
  }, [queryClient])

  useEffect(() => {
    if (!managerRef.current) {
      managerRef.current = WebSocketManager.getInstance()
    }

    const unsubscribe = managerRef.current.subscribe((connected, error) => {
      setIsConnected(connected)
      setError(error || null)
      
      if (connected && !pingCleanupRef.current && managerRef.current) {
        pingCleanupRef.current = managerRef.current.startPing()
      } else if (!connected && pingCleanupRef.current) {
        pingCleanupRef.current()
        pingCleanupRef.current = null
      }
    })

    return () => {
      unsubscribe()
      if (pingCleanupRef.current) {
        pingCleanupRef.current()
        pingCleanupRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!managerRef.current) return

    managerRef.current.setRefs(queryClientRef.current, isAuthenticatedRef)

    if (isAuthenticated) {
      managerRef.current.connect()
    } else {
      managerRef.current.disconnect()
    }
  }, [isAuthenticated])

  return { isConnected, error }
}
