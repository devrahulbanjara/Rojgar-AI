import React, { memo } from 'react'
import { Briefcase, FileEdit, BookOpen, Archive } from 'lucide-react'
import { cn } from '../../lib/utils'

type TabType = 'active' | 'drafts' | 'expired' | 'reference-jds'

interface JobTabSwitcherProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  activeCount: number
  draftCount: number
  expiredCount: number
  referenceJDCount: number
  className?: string
}

const tabs = [
  { id: 'active' as TabType, label: 'Active Jobs', icon: Briefcase, color: 'blue' },
  { id: 'drafts' as TabType, label: 'Drafts', icon: FileEdit, color: 'amber' },
  { id: 'expired' as TabType, label: 'Expired', icon: Archive, color: 'rose' },
  { id: 'reference-jds' as TabType, label: 'Reference JDs', icon: BookOpen, color: 'purple' },
]

export const JobTabSwitcher = memo<JobTabSwitcherProps>(
  ({
    activeTab,
    onTabChange,
    activeCount,
    draftCount,
    expiredCount,
    referenceJDCount,
    className,
  }) => {
    const getCount = (tabId: TabType) => {
      if (tabId === 'active') return activeCount
      if (tabId === 'drafts') return draftCount
      if (tabId === 'expired') return expiredCount
      if (tabId === 'reference-jds') return referenceJDCount
      return null
    }

    return (
      <div
        className={cn(
          'inline-flex items-center gap-1 p-1 bg-background-muted/80 backdrop-blur-sm rounded-2xl',
          className
        )}
      >
        {tabs.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          const count = getCount(tab.id)

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium',
                'transition-all duration-300 ease-out',
                isActive
                  ? 'bg-background-surface text-text-primary shadow-sm'
                  : 'text-text-tertiary hover:text-text-secondary hover:bg-background-surface/50'
              )}
            >
              <Icon
                className={cn(
                  'w-4 h-4 transition-colors duration-300',
                  isActive && tab.color === 'blue' && 'text-primary',
                  isActive && tab.color === 'amber' && 'text-warning',
                  isActive && tab.color === 'rose' && 'text-error',
                  isActive && tab.color === 'purple' && 'text-primary',
                  !isActive && 'text-text-muted'
                )}
              />
              <span>{tab.label}</span>
              {count !== null && (
                <span
                  className={cn(
                    'px-2 py-0.5 rounded-full text-xs font-semibold transition-all duration-300',
                    isActive &&
                      tab.color === 'blue' &&
                      'bg-primary-100 dark:bg-primary-900/30 text-primary',
                    isActive &&
                      tab.color === 'amber' &&
                      'bg-warning-100 dark:bg-warning-900/30 text-warning',
                    isActive &&
                      tab.color === 'rose' &&
                      'bg-error-100 dark:bg-error-900/30 text-error',
                    isActive &&
                      tab.color === 'purple' &&
                      'bg-primary-100 dark:bg-primary-900/30 text-primary',
                    !isActive && 'bg-background-muted/80 text-text-tertiary'
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>
    )
  }
)

JobTabSwitcher.displayName = 'JobTabSwitcher'
