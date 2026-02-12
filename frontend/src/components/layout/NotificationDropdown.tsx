'use client'

import React, { useMemo } from 'react'
import Link from 'next/link'
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
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { ScrollArea } from '../ui/scroll-area'
import { Separator } from '../ui/separator'
import { Button } from '../ui/button'
import { Avatar, AvatarFallback } from '../ui/avatar'

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
  const iconClass = 'h-4 w-4'
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

const getActivityIconColor = (type: ActivityItem['type']) => {
  switch (type) {
    case 'application':
      return 'bg-blue-50 text-blue-600'
    case 'interview':
      return 'bg-green-50 text-green-600'
    case 'offer':
      return 'bg-green-50 text-green-600'
    case 'job_post':
      return 'bg-purple-50 text-purple-600'
    case 'status_change':
      return 'bg-orange-50 text-orange-600'
    default:
      return 'bg-slate-100 text-slate-600'
  }
}

interface GroupedActivities {
  [key: string]: ActivityItem[]
}

export function NotificationDropdown() {
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

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative p-2 rounded-lg hover:bg-background-subtle text-text-secondary hover:text-text-primary"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 border-2 border-white" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[420px] p-0 shadow-xl border-slate-200" align="end">
        {/* Header Section */}
        <div className="p-4 pb-3 flex justify-between items-start">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-none">
              Recent Activity
            </h3>
            <p className="text-[13px] text-slate-500 dark:text-slate-400">
              Updates from your recruitment pipeline
            </p>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="link"
              className="text-blue-600 text-xs h-auto p-0 font-semibold hover:text-blue-700"
            >
              Mark all read
            </Button>
          )}
        </div>

        <Separator />

        {/* Scrollable List */}
        {isLoading ? (
          <div className="py-10 flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-500 mt-3">Loading activity...</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="py-10 flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-full flex items-center justify-center mb-4 opacity-30">
              <Bell className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-400">No new notifications</p>
          </div>
        ) : (
          <ScrollArea className="h-[350px]">
            <div className="py-2">
              {groupOrder.map(groupName => {
                const groupActivities = groupedActivities[groupName]
                if (!groupActivities || groupActivities.length === 0) return null

                return (
                  <div key={groupName} className="mb-4">
                    {/* Group Label */}
                    <p className="px-4 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      {groupName}
                    </p>

                    {/* Group Items */}
                    {groupActivities.map(activity => {
                      // Get initials from user name
                      const initials = activity.user
                        .split(' ')
                        .map(name => name[0])
                        .join('')
                        .toUpperCase()

                      return (
                        <Link
                          key={activity.id}
                          href="#"
                          className="px-4 py-3 flex gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer relative group"
                        >
                          {/* Icon/Avatar Container */}
                          <Avatar className="h-9 w-9 border-none">
                            <AvatarFallback
                              className={cn(
                                'text-xs font-bold',
                                getActivityIconColor(activity.type)
                              )}
                            >
                              {activity.type === 'application'
                                ? initials
                                : getActivityIcon(activity.type)}
                            </AvatarFallback>
                          </Avatar>

                          {/* Text Content */}
                          <div className="flex-1 space-y-1">
                            <p className="text-[13px] leading-snug text-slate-600 dark:text-slate-300">
                              <span className="font-bold text-slate-900 dark:text-white">
                                {activity.user}
                              </span>{' '}
                              {activity.action}{' '}
                              <span className="text-blue-600 dark:text-blue-400 font-medium">
                                {activity.target}
                              </span>
                            </p>
                            <p className="text-[12px] text-slate-400">
                              {formatTimestamp(activity.timestamp)}
                            </p>
                          </div>

                          {/* Unread Indicator */}
                          <div className="flex items-center">
                            <div className="h-2 w-2 rounded-full bg-blue-600" />
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        )}

        {activities.length > 0 && (
          <>
            <Separator />
            {/* Footer */}
            <div className="p-2">
              <Button
                variant="ghost"
                className="w-full text-blue-600 text-[13px] font-semibold hover:bg-blue-50 hover:text-blue-700"
              >
                View All Activity <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}
