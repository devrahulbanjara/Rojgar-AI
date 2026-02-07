'use client'

import React, { useRef, useEffect, useMemo } from 'react'
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
  switch (type) {
    case 'application':
      return <FileText className="w-4 h-4" />
    case 'interview':
      return <Calendar className="w-4 h-4" />
    case 'offer':
      return <CheckCircle2 className="w-4 h-4" />
    case 'job_post':
      return <Briefcase className="w-4 h-4" />
    case 'status_change':
      return <Clock className="w-4 h-4" />
    default:
      return <User className="w-4 h-4" />
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
          'relative p-2 rounded-lg transition-all duration-200',
          isOpen || unreadCount > 0
            ? 'text-[#2463EB]'
            : 'text-text-secondary hover:text-text-primary hover:bg-background-subtle'
        )}
        aria-label="Notifications"
        title="Recent Activity"
        aria-expanded={isOpen}
      >
        <Bell className="h-[18px] w-[18px]" />
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold text-white bg-[#EF4444] rounded-full px-1 border-2 border-background-surface shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="absolute right-0 top-full mt-2 w-[420px] bg-background-surface border border-[#E5E7EB] dark:border-border-default rounded-xl overflow-hidden z-50"
            style={{
              boxShadow: '0 12px 48px rgba(0,0,0,0.12)',
            }}
          >
            {/* Header Section */}
            <div className="px-6 pt-6 pb-5 border-b border-[#E5E7EB] dark:border-border-default/60">
              {/* Title Row */}
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-text-primary">Recent Activity</h3>
              </div>
              {/* Subtitle + Action Row */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-[#6B7280] dark:text-text-tertiary">
                  Updates from your recruitment pipeline
                </p>
                {unreadCount > 0 && (
                  <button className="text-sm font-medium text-[#2463EB] hover:text-primary-700 dark:hover:text-primary-300 transition-colors">
                    Mark all read
                  </button>
                )}
              </div>
            </div>

            {/* Notification List */}
            <div
              className="overflow-y-auto max-h-[380px]"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#D1D5DB transparent',
              }}
            >
              {isLoading ? (
                <div className="py-16 flex flex-col items-center justify-center">
                  <div className="w-8 h-8 border-2 border-[#2463EB] border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-[#6B7280] mt-3">Loading activity...</p>
                </div>
              ) : activities.length === 0 ? (
                /* Empty State */
                <div className="py-16 flex flex-col items-center justify-center px-6">
                  <div className="w-16 h-16 bg-[#F3F4F6] dark:bg-background-subtle rounded-full flex items-center justify-center mb-4">
                    <Bell className="w-8 h-8 text-[#9CA3AF]" />
                  </div>
                  <p className="text-base font-medium text-[#4B5563] dark:text-text-secondary">
                    No new notifications
                  </p>
                  <p className="text-sm text-[#9CA3AF] dark:text-text-muted mt-1">
                    You're all caught up for now!
                  </p>
                </div>
              ) : (
                /* Grouped Activity List */
                <div className="py-2">
                  {groupOrder.map((groupName, groupIndex) => {
                    const groupActivities = groupedActivities[groupName]
                    if (!groupActivities || groupActivities.length === 0) return null

                    return (
                      <div key={groupName}>
                        {/* Group Header */}
                        <div className="px-6 pt-4 pb-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-[#9CA3AF] dark:text-text-muted">
                            {groupName}
                          </span>
                        </div>

                        {/* Group Items */}
                        {groupActivities.map((activity, index) => {
                          const styles = getActivityStyles(activity.type)
                          const timeAgo = formatTimestamp(activity.timestamp)
                          const isLastInGroup = index === groupActivities.length - 1
                          const isLastGroup =
                            groupIndex ===
                            groupOrder.filter(g => groupedActivities[g]?.length).length - 1

                          return (
                            <div
                              key={activity.id}
                              className={cn(
                                'group flex items-start gap-3 px-6 py-3.5 hover:bg-[#F9FAFB] dark:hover:bg-background-subtle/50 transition-colors duration-150 cursor-pointer',
                                !(isLastInGroup && isLastGroup) &&
                                  'border-b border-[#F3F4F6] dark:border-border-subtle/40'
                              )}
                            >
                              {/* Icon */}
                              <div
                                className={cn(
                                  'flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-transform duration-200 group-hover:scale-110',
                                  styles.bg
                                )}
                              >
                                <span className={styles.icon}>
                                  {getActivityIcon(activity.type)}
                                </span>
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0 pt-0.5">
                                <p className="text-sm leading-snug">
                                  <span className="font-semibold text-text-primary">
                                    {activity.user}
                                  </span>{' '}
                                  <span className="text-[#4B5563] dark:text-text-secondary">
                                    {activity.action}
                                  </span>{' '}
                                  <span className="font-medium text-[#2463EB] hover:underline cursor-pointer">
                                    {activity.target}
                                  </span>
                                </p>
                                <p className="text-xs text-[#9CA3AF] dark:text-text-muted mt-1">
                                  {timeAgo}
                                </p>
                              </div>

                              {/* Unread Indicator */}
                              <div className="flex-shrink-0 pt-2">
                                <div className="w-2 h-2 rounded-full bg-[#2463EB]" />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Footer Section */}
            {activities.length > 0 && (
              <div className="px-6 py-4 border-t border-[#E5E7EB] dark:border-border-default/60 bg-[#FAFAFA] dark:bg-background-subtle/30">
                <button className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-[#2463EB] hover:text-primary-700 dark:hover:text-primary-300 transition-colors duration-150 group">
                  View All Activity
                  <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
