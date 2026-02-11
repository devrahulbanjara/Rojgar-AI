'use client'

import React, { useRef, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell,
  FileText,
  Calendar,
  CheckCircle2,
  Clock,
  Briefcase,
  User,
  ArrowRight,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { useRecentActivity, type ActivityItem } from '../../hooks/useRecentActivity'

interface NotificationDropdownProps {
  isOpen: boolean
  onToggle: () => void
  onClose: () => void
}

const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

  if (diffInMinutes < 1) return 'Just now'
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`
  if (diffInHours < 24) return `${diffInHours}h ago`
  if (diffInDays === 1) return 'Yesterday'
  if (diffInDays < 7) return `${diffInDays}d ago`

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const getDateGroup = (timestamp: string): string => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

  if (diffInDays === 0) return 'Today'
  if (diffInDays === 1) return 'Yesterday'
  if (diffInDays < 7) return 'This Week'
  return 'Earlier'
}

const getActivityIcon = (type: ActivityItem['type']) => {
  const iconClass = "w-5 h-5"
  switch (type) {
    case 'application':
      return <FileText className={iconClass} />
    case 'interview':
      return <Calendar className={iconClass} />
    case 'offer':
      return <CheckCircle2 className={iconClass} />
    case 'job_post':
      return <Briefcase className={iconClass} />
    case 'status_change':
      return <Clock className={iconClass} />
    default:
      return <User className={iconClass} />
  }
}

const getActivityStyles = (type: ActivityItem['type']) => {
  switch (type) {
    case 'application':
      return {
        bg: 'bg-[#DBEAFE] dark:bg-primary-900/40',
        icon: 'text-[#2463EB]',
      }
    case 'interview':
      return {
        bg: 'bg-[#D1FAE5] dark:bg-success-900/40',
        icon: 'text-[#059669]',
      }
    case 'offer':
      return {
        bg: 'bg-[#D1FAE5] dark:bg-success-900/40',
        icon: 'text-[#059669]',
      }
    case 'job_post':
      return {
        bg: 'bg-[#EDE9FE] dark:bg-ai-900/40',
        icon: 'text-[#7C3AED]',
      }
    case 'status_change':
      return {
        bg: 'bg-[#FED7AA] dark:bg-warning-900/40',
        icon: 'text-[#EA580C]',
      }
    default:
      return {
        bg: 'bg-background-subtle',
        icon: 'text-text-tertiary',
      }
  }
}

interface GroupedActivities {
  [key: string]: ActivityItem[]
}

export function NotificationDropdown({ isOpen, onToggle, onClose }: NotificationDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { data: activities = [], isLoading } = useRecentActivity()

  const unreadCount = activities.length

  // Group activities by date
  const groupedActivities = useMemo(() => {
    const groups: GroupedActivities = {}
    activities.slice(0, 10).forEach(activity => {
      const group = getDateGroup(activity.timestamp)
      if (!groups[group]) {
        groups[group] = []
      }
      groups[group].push(activity)
    })
    return groups
  }, [activities])

  const groupOrder = ['Today', 'Yesterday', 'This Week', 'Earlier']

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose()
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose])

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={onToggle}
        className={cn(
          'relative p-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2',
          isOpen || unreadCount > 0
            ? 'text-brand'
            : 'text-text-secondary hover:text-text-primary hover:bg-background-subtle'
        )}
        aria-label="Notifications"
        title="Recent Activity"
        aria-expanded={isOpen}
      >
        <Bell className="h-5 w-5" />
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-[20px] flex items-center justify-center text-[11px] font-semibold text-white bg-error rounded-full px-1 border-2 border-background-surface shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute right-0 top-[calc(100%+12px)] w-[420px] bg-background-surface border border-border-default rounded-[12px] z-50 overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.4)]"
          >
            {/* Triangle Pointer */}
            <div className="absolute top-[-8px] right-[20px] w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[8px] border-b-background-surface" />

            {/* Header Section */}
            <div className="px-[20px] pt-[24px]">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[20px] font-[600] text-text-primary">Recent Activity</h3>
                {unreadCount > 0 && (
                  <button className="text-[14px] font-[600] text-brand hover:text-brand-dark bg-none border-none cursor-pointer transition-colors duration-200">
                    Mark all read
                  </button>
                )}
              </div>
              <p className="text-[14px] text-text-secondary font-[400] line-height-[1.5] pb-[16px] border-b border-border-subtle">
                Updates from your recruitment pipeline
              </p>
            </div>

            {/* Notification List Content */}
            <div
              className="mt-[20px] overflow-y-auto max-h-[400px] px-[20px] custom-scrollbar"
              style={{
                scrollbarWidth: 'thin',
              }}
            >
              {isLoading ? (
                <div className="py-[40px] flex flex-col items-center justify-center">
                  <div className="w-8 h-8 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
                  <p className="text-[14px] text-[#6B7280] dark:text-[#94A3B8] mt-3">Loading activity...</p>
                </div>
              ) : activities.length === 0 ? (
                /* Empty State */
                <div className="py-[40px] flex flex-col items-center justify-center">
                  <div className="w-[40px] h-[40px] rounded-full flex items-center justify-center mb-4 opacity-30">
                    <Bell className="w-8 h-8 text-[#9CA3AF]" />
                  </div>
                  <p className="text-[14px] font-medium text-[#9CA3AF] dark:text-text-muted">
                    No new notifications
                  </p>
                </div>
              ) : (
                /* Grouped Activity List */
                <div className="pb-[4px]">
                  {groupOrder.map((groupName) => {
                    const groupActivities = groupedActivities[groupName]
                    if (!groupActivities || groupActivities.length === 0) return null

                    return (
                      <div key={groupName} className="mb-4">
                        {/* Group Header */}
                        <div className="mb-[16px]">
                          <span className="text-[12px] font-[600] uppercase tracking-[0.5px] text-[#9CA3AF] dark:text-text-muted">
                            {groupName}
                          </span>
                        </div>

                        {/* Group Items */}
                        <div className="space-y-[8px]">
                          {groupActivities.map((activity) => {
                            // Using standardized icon styles from the guide
                            return (
                              <Link
                                key={activity.id}
                                href="#"
                                className="group flex items-start gap-[12px] p-[12px] px-[16px] rounded-[6px] cursor-pointer transition-all duration-200 hover:bg-background-subtle active:scale-[0.99] active:bg-background-muted"
                              >
                                {/* Icon Background Circle */}
                                <div className="flex-shrink-0 w-[40px] h-[40px] rounded-full bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
                                  <span className="text-brand dark:text-primary-400">
                                    {getActivityIcon(activity.type)}
                                  </span>
                                </div>

                                {/* Content Layout */}
                                <div className="flex-1 min-w-0 flex flex-col pt-[2px]">
                                  <p className="text-[14px] leading-snug">
                                    <span className="font-[600] text-[#111827] dark:text-white">
                                      {activity.user}
                                    </span>{' '}
                                    <span className="font-[400] text-[#6B7280] dark:text-[#94A3B8]">
                                      {activity.action}
                                    </span>{' '}
                                    <span className="font-[600] text-[#2563EB] dark:text-primary-400 group-hover:underline underline-offset-2">
                                      {activity.target}
                                    </span>
                                  </p>
                                  <p className="text-[13px] text-[#9CA3AF] dark:text-text-muted font-[400] mt-[4px]">
                                    {formatTimestamp(activity.timestamp)}
                                  </p>
                                </div>

                                {/* Unread Indicator Dot */}
                                <div className="flex-shrink-0 pt-2 ml-auto">
                                  <div className="w-[8px] h-[8px] rounded-full bg-brand" aria-label="Unread notification" />
                                </div>
                              </Link>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Footer Section */}
            {activities.length > 0 && (
              <div className="px-[20px] pb-[20px] pt-[16px] border-t border-border-subtle mt-[16px]">
                <button className="w-full flex items-center justify-center gap-[6px] text-[14px] font-[600] text-brand hover:text-brand-dark transition-colors duration-150 group">
                  View All Activity
                  <ArrowRight className="w-[16px] h-[16px] transition-transform duration-200 group-hover:translate-x-1" />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: hsl(var(--background-base));
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: hsl(var(--border-strong));
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--text-tertiary));
        }
      `}</style>

    </div>
  )
}
