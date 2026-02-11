import React, { memo } from 'react'
import { Briefcase, FileEdit, BookOpen, Archive } from 'lucide-react'
import { cn } from '../../lib/utils'
import { Tabs, TabsList, TabsTrigger } from '../ui'
import { Badge } from '../ui/badge'

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
      <Tabs
        value={activeTab}
        onValueChange={value => onTabChange(value as TabType)}
        className={cn('w-full', className)}
      >
        <TabsList className="bg-background-muted/80 dark:bg-background-surface backdrop-blur-sm p-1.5 h-auto rounded-xl border border-border-subtle dark:border-border-default shadow-sm inline-flex">
          {tabs.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            const count = getCount(tab.id)

            return (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className={cn(
                  'relative flex items-center gap-2.5 px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-300',
                  'data-[state=active]:bg-background-surface data-[state=active]:text-text-primary data-[state=active]:shadow-sm data-[state=active]:border-border-default/50',
                  'text-text-tertiary hover:text-text-secondary'
                )}
              >
                <Icon
                  className={cn(
                    'w-4 h-4 transition-colors duration-300',
                    isActive && tab.color === 'blue' && 'text-primary-600 dark:text-primary-400',
                    isActive && tab.color === 'amber' && 'text-warning-600 dark:text-warning-400',
                    isActive && tab.color === 'rose' && 'text-error-600 dark:text-error-400',
                    isActive && tab.color === 'purple' && 'text-primary-600 dark:text-primary-400',
                    !isActive && 'text-text-muted'
                  )}
                />
                <span className="max-sm:hidden">{tab.label}</span>
                {count !== null && (
                  <Badge
                    variant="secondary"
                    className={cn(
                      'ml-1 px-2 py-0 h-5 min-w-[20px] justify-center text-[10px] font-bold transition-all duration-300 rounded-[5px]',
                      isActive &&
                      tab.color === 'blue' &&
                      'bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 border border-primary-100/50',
                      isActive &&
                      tab.color === 'amber' &&
                      'bg-warning-50 dark:bg-warning-950/40 text-warning-600 dark:text-warning-400 border border-warning-100/50',
                      isActive &&
                      tab.color === 'rose' &&
                      'bg-error-50 dark:bg-error-950/40 text-error-600 dark:text-error-400 border border-error-100/50',
                      isActive &&
                      tab.color === 'purple' &&
                      'bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 border border-primary-100/50',
                      !isActive && 'bg-background-muted/80 text-text-tertiary border-transparent'
                    )}
                  >
                    {count}
                  </Badge>
                )}
              </TabsTrigger>
            )
          })}
        </TabsList>
      </Tabs>
    )
  }
)

JobTabSwitcher.displayName = 'JobTabSwitcher'
