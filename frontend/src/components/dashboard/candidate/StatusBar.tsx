import React from 'react'
import { FileText, Calendar, Timer, Trophy } from 'lucide-react'
import { Card, CardContent } from '../../ui/card'

interface StatusBarProps {
  applications: Array<{ current_status: string }>
}

interface StatItem {
  label: string
  value: number
  icon: React.ReactNode
  color: string
}

export function StatusBar({ applications }: StatusBarProps) {
  const stats: StatItem[] = React.useMemo(() => {
    const active = applications.filter(
      a => a.current_status === 'applied' || a.current_status === 'interviewing'
    ).length
    const interviews = applications.filter(a => a.current_status === 'interviewing').length
    const awaiting = applications.filter(a => a.current_status === 'applied').length
    const outcomes = applications.filter(
      a =>
        a.current_status === 'outcome' ||
        a.current_status === 'offered' ||
        a.current_status === 'rejected'
    ).length

    return [
      {
        label: 'Active Applications',
        value: active,
        icon: <FileText className="w-5 h-5" />,
        color:
          'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800',
      },
      {
        label: 'Interviews',
        value: interviews,
        icon: <Calendar className="w-5 h-5" />,
        color:
          'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-800',
      },
      {
        label: 'Awaiting Response',
        value: awaiting,
        icon: <Timer className="w-5 h-5" />,
        color:
          'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
      },
      {
        label: 'Outcomes',
        value: outcomes,
        icon: <Trophy className="w-5 h-5" />,
        color:
          'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
      },
    ]
  }, [applications])

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <Card
          key={i}
          className="group border-border-default hover:shadow-md transition-all duration-300 overflow-hidden"
        >
          <CardContent className="p-5 flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border transition-transform duration-300 group-hover:scale-105 ${stat.color}`}
            >
              {stat.icon}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-2xl font-bold text-text-primary leading-none tracking-tight">
                {stat.value}
              </span>
              <span className="text-xs font-semibold text-text-tertiary mt-1 uppercase tracking-wider truncate">
                {stat.label}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
