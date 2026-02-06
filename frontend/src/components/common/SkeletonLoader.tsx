import React from 'react'
import { cn } from '../../lib/utils'

interface SkeletonLoaderProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular' | 'card'
  width?: string | number
  height?: string | number
  lines?: number
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  className,
  variant = 'rectangular',
  width,
  height,
  lines = 1,
}) => {
  const baseClasses = 'animate-pulse bg-background-subtle rounded'

  const variantClasses = {
    text: 'h-4 w-full',
    circular: 'rounded-full',
    rectangular: 'w-full',
    card: 'w-full h-32',
  }

  const style = {
    width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined,
    height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined,
  }

  if (variant === 'text' && lines > 1) {
    return (
      <div className={cn('space-y-2', className)}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={cn(baseClasses, variantClasses[variant], index === lines - 1 && 'w-3/4')}
            style={index === lines - 1 ? { ...style, width: '75%' } : style}
          />
        ))}
      </div>
    )
  }

  return <div className={cn(baseClasses, variantClasses[variant], className)} style={style} />
}

export const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => (
  <div
    className={cn(
      'p-6 space-y-4 bg-background-surface rounded-xl border border-border-default',
      className
    )}
  >
    <div className="flex items-center space-x-4">
      <SkeletonLoader variant="circular" width={40} height={40} />
      <div className="space-y-2 flex-1">
        <SkeletonLoader variant="text" width="60%" />
        <SkeletonLoader variant="text" width="40%" />
      </div>
    </div>
    <SkeletonLoader variant="text" lines={3} />
    <div className="flex justify-between items-center">
      <SkeletonLoader variant="text" width="30%" />
      <SkeletonLoader variant="rectangular" width={80} height={32} />
    </div>
  </div>
)

export const SkeletonJobCard: React.FC<{ className?: string }> = ({ className }) => (
  <div
    className={cn(
      'group transition-all duration-300 w-full bg-background-surface rounded-xl border p-6 border-border-default shadow-sm',
      className
    )}
  >
    <div className="flex flex-col h-full">
      {}
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-2">
          <SkeletonLoader
            variant="rectangular"
            width={85}
            height={24}
            className="rounded-full bg-background-muted"
          />
          <SkeletonLoader
            variant="rectangular"
            width={65}
            height={24}
            className="rounded-full bg-background-muted"
          />
        </div>
        {}
        <SkeletonLoader variant="circular" width={20} height={20} className="bg-background-muted" />
      </div>

      {}
      <div className="mb-5">
        <SkeletonLoader
          variant="text"
          width="90%"
          height={26}
          className="mb-2 bg-background-subtle"
        />
        <SkeletonLoader variant="text" width="60%" height={20} className="bg-background-subtle" />
      </div>

      {}
      <div className="space-y-2.5 text-sm text-text-tertiary mb-6">
        {}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <SkeletonLoader
              variant="circular"
              width={14}
              height={14}
              className="bg-background-subtle"
            />
            <SkeletonLoader
              variant="text"
              width={100}
              height={14}
              className="bg-background-subtle"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <SkeletonLoader
              variant="circular"
              width={14}
              height={14}
              className="bg-background-subtle"
            />
            <SkeletonLoader
              variant="text"
              width={60}
              height={14}
              className="bg-background-subtle"
            />
          </div>
        </div>

        {}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <SkeletonLoader
              variant="circular"
              width={14}
              height={14}
              className="bg-background-subtle"
            />
            <SkeletonLoader
              variant="text"
              width={90}
              height={14}
              className="bg-background-subtle"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <SkeletonLoader
              variant="circular"
              width={14}
              height={14}
              className="bg-background-subtle"
            />
            <SkeletonLoader
              variant="text"
              width={70}
              height={14}
              className="bg-background-subtle"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <SkeletonLoader
              variant="circular"
              width={14}
              height={14}
              className="bg-background-subtle"
            />
            <SkeletonLoader
              variant="text"
              width={60}
              height={14}
              className="bg-background-subtle"
            />
          </div>
        </div>
      </div>

      {}
      <div className="flex-1" />

      {}
      <div className="flex items-center justify-between gap-3 pt-6 border-t border-border-subtle">
        <div className="flex items-center gap-3">
          <SkeletonLoader
            variant="rectangular"
            width={75}
            height={36}
            className="rounded-lg bg-ai-50 dark:bg-ai-950/30"
          />
          <SkeletonLoader
            variant="rectangular"
            width={70}
            height={36}
            className="rounded-lg bg-primary-50 dark:bg-primary-950/30"
          />
        </div>
        <SkeletonLoader
          variant="rectangular"
          width={80}
          height={36}
          className="rounded-lg bg-warning-50 dark:bg-warning-950/30"
        />
      </div>
    </div>
  </div>
)

export const SkeletonStats: React.FC<{ className?: string }> = ({ className }) => (
  <div
    className={cn(
      'p-6 space-y-4 bg-background-surface rounded-xl border border-border-default',
      className
    )}
  >
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <SkeletonLoader variant="text" width="40%" />
        <SkeletonLoader variant="text" width="60%" />
      </div>
      <SkeletonLoader variant="circular" width={40} height={40} />
    </div>
  </div>
)

export const SkeletonApplicationCard: React.FC<{ className?: string }> = ({ className }) => (
  <div
    className={cn(
      'bg-background-surface p-4 rounded-lg shadow-sm border border-border-default border-l-[4px] border-l-primary',
      className
    )}
  >
    {}
    <div className="mb-3">
      <SkeletonLoader
        variant="text"
        width="85%"
        height={16}
        className="mb-1 bg-background-subtle"
      />
      <SkeletonLoader variant="text" width="60%" height={14} className="bg-background-muted" />
    </div>

    {}
    <div className="flex items-center gap-3 mb-4">
      <div className="flex items-center gap-1">
        <SkeletonLoader
          variant="circular"
          width={12}
          height={12}
          className="bg-background-subtle"
        />
        <SkeletonLoader variant="text" width={60} height={12} className="bg-background-subtle" />
      </div>
      <div className="flex items-center gap-1">
        <SkeletonLoader
          variant="circular"
          width={12}
          height={12}
          className="bg-background-subtle"
        />
        <SkeletonLoader variant="text" width={50} height={12} className="bg-background-subtle" />
      </div>
    </div>

    {}
    <div className="flex items-center justify-between pt-3 border-t border-border-subtle">
      <div className="flex items-center gap-1">
        <SkeletonLoader
          variant="circular"
          width={12}
          height={12}
          className="bg-background-subtle"
        />
        <SkeletonLoader variant="text" width={70} height={11} className="bg-background-subtle" />
      </div>
      <SkeletonLoader
        variant="rectangular"
        width={55}
        height={18}
        className="rounded-full bg-background-muted"
      />
    </div>
  </div>
)

export const SkeletonDashboardColumn: React.FC<{
  className?: string
  bgColor?: string
  borderColor?: string
  iconColor?: string
  textColor?: string
  badgeColor?: string
}> = ({
  className,
  bgColor = 'bg-primary-50 dark:bg-primary-950/30',
  borderColor = 'border-primary-200 dark:border-primary-800',
  iconColor = 'bg-primary-200 dark:bg-primary-800',
  textColor = 'bg-background-subtle',
  badgeColor = 'bg-primary-100 dark:bg-primary-900/30',
}) => (
  <div
    className={cn(
      `${bgColor} rounded-2xl p-6 flex flex-col gap-6 border ${borderColor} shadow-sm/50`,
      className
    )}
  >
    {}
    <div className="flex items-center justify-between px-1">
      <div className="flex items-center gap-3">
        <SkeletonLoader variant="circular" width={20} height={20} className={iconColor} />
        <SkeletonLoader variant="text" width={80} height={16} className={textColor} />
      </div>
      <SkeletonLoader
        variant="rectangular"
        width={24}
        height={24}
        className={`rounded-full ${badgeColor}`}
      />
    </div>

    {}
    <div className="flex-1 flex flex-col gap-4">
      <SkeletonApplicationCard />
      <SkeletonApplicationCard />
      <SkeletonApplicationCard />
    </div>
  </div>
)

export const SkeletonProfileHeader: React.FC<{ className?: string }> = ({ className }) => (
  <div
    className={cn(
      'bg-background-surface rounded-2xl border border-border-default shadow-lg shadow-primary/5 overflow-hidden relative',
      className
    )}
  >
    {}
    <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-r from-primary-50 via-primary-50 to-primary-50 dark:from-primary-950/30 dark:via-primary-950/30 dark:to-primary-950/30 opacity-50" />

    <div className="p-8 relative">
      <div className="flex flex-col md:flex-row items-center gap-8">
        {}
        <div className="relative flex-shrink-0">
          <div className="absolute -inset-2 bg-gradient-to-br from-primary/20 to-primary-200/20 rounded-full blur-md" />
          <div className="relative p-1 bg-background-surface rounded-full ring-1 ring-primary-100 dark:ring-primary-900/30">
            <SkeletonLoader
              variant="circular"
              width={128}
              height={128}
              className="border-4 border-background-surface shadow-sm bg-background-subtle"
            />
          </div>
        </div>

        {}
        <div className="flex-1 flex flex-col justify-center space-y-4 text-center md:text-left">
          <SkeletonLoader variant="text" width="60%" height={36} className="bg-background-subtle" />
          <SkeletonLoader variant="text" width="40%" height={24} className="bg-background-muted" />
          <SkeletonLoader variant="text" width="80%" height={20} className="bg-background-muted" />
        </div>
      </div>
    </div>
  </div>
)

export const SkeletonProfileTab: React.FC<{ className?: string }> = ({ className }) => (
  <div
    className={cn(
      'bg-background-surface rounded-2xl border border-border-default p-1 shadow-sm',
      className
    )}
  >
    <div className="flex overflow-x-auto gap-1">
      {[1, 2, 3, 4].map(index => (
        <div
          key={index}
          className="flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-xl"
        >
          <SkeletonLoader
            variant="circular"
            width={20}
            height={20}
            className="bg-background-subtle"
          />
          <SkeletonLoader variant="text" width={100} height={14} className="bg-background-subtle" />
        </div>
      ))}
    </div>
  </div>
)

export const SkeletonProfileForm: React.FC<{ className?: string }> = ({ className }) => (
  <div
    className={cn(
      'bg-background-surface rounded-2xl border border-border-default shadow-sm',
      className
    )}
  >
    <div className="p-8">
      {}
      <div className="mb-8">
        <SkeletonLoader
          variant="text"
          width="40%"
          height={28}
          className="mb-2 bg-background-subtle"
        />
        <SkeletonLoader variant="text" width="60%" height={16} className="bg-background-muted" />
      </div>

      {}
      <div className="bg-background-surface rounded-2xl p-8 border border-border-default shadow-sm mb-8">
        <div className="flex items-center gap-4 mb-8 pb-4 border-b border-border-subtle">
          <SkeletonLoader
            variant="rectangular"
            width={48}
            height={48}
            className="rounded-xl bg-primary-50 dark:bg-primary-950/30"
          />
          <div className="space-y-2">
            <SkeletonLoader
              variant="text"
              width={120}
              height={18}
              className="bg-background-subtle"
            />
            <SkeletonLoader
              variant="text"
              width={180}
              height={14}
              className="bg-background-muted"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[1, 2, 3, 4, 5, 6].map(index => (
            <div key={index} className="space-y-3">
              <SkeletonLoader
                variant="text"
                width="30%"
                height={14}
                className="bg-background-subtle"
              />
              <SkeletonLoader
                variant="rectangular"
                width="100%"
                height={48}
                className="rounded-xl bg-background-subtle"
              />
            </div>
          ))}
        </div>
      </div>

      {}
      <div className="bg-background-surface rounded-2xl p-8 border border-border-default shadow-sm mb-8">
        <div className="flex items-center gap-4 mb-8 pb-4 border-b border-border-subtle">
          <SkeletonLoader
            variant="rectangular"
            width={48}
            height={48}
            className="rounded-xl bg-primary-50 dark:bg-primary-950/30"
          />
          <div className="space-y-2">
            <SkeletonLoader
              variant="text"
              width={140}
              height={18}
              className="bg-background-subtle"
            />
            <SkeletonLoader
              variant="text"
              width={200}
              height={14}
              className="bg-background-muted"
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <SkeletonLoader
              variant="text"
              width="40%"
              height={14}
              className="bg-background-subtle"
            />
            <SkeletonLoader
              variant="rectangular"
              width="100%"
              height={48}
              className="rounded-xl bg-background-subtle"
            />
          </div>
          <div className="space-y-3">
            <SkeletonLoader
              variant="text"
              width="35%"
              height={14}
              className="bg-background-subtle"
            />
            <SkeletonLoader
              variant="rectangular"
              width="100%"
              height={96}
              className="rounded-xl bg-background-subtle"
            />
          </div>
        </div>
      </div>

      {}
      <div className="bg-background-surface rounded-2xl p-8 border border-border-default shadow-sm mb-8">
        <div className="flex items-center gap-4 mb-8 pb-4 border-b border-border-subtle">
          <SkeletonLoader
            variant="rectangular"
            width={48}
            height={48}
            className="rounded-xl bg-success-50 dark:bg-success-950/30"
          />
          <div className="space-y-2">
            <SkeletonLoader
              variant="text"
              width={100}
              height={18}
              className="bg-background-subtle"
            />
            <SkeletonLoader
              variant="text"
              width={160}
              height={14}
              className="bg-background-muted"
            />
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(index => (
            <SkeletonLoader
              key={index}
              variant="rectangular"
              width="100%"
              height={48}
              className="rounded-xl bg-background-subtle"
            />
          ))}
        </div>
      </div>

      {}
      <div className="flex justify-end pt-6 border-t border-border-default">
        <SkeletonLoader
          variant="rectangular"
          width={140}
          height={48}
          className="rounded-xl bg-primary-100 dark:bg-primary-900/30"
        />
      </div>
    </div>
  </div>
)

export const SkeletonResumeDetail: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('h-full flex flex-col', className)}>
    {}
    <div className="flex-shrink-0 bg-gradient-to-b from-background-subtle to-background-surface px-8 py-8 border-b border-border-default relative">
      <div className="flex items-start gap-4 pr-12">
        <div className="flex-1 min-w-0 space-y-4">
          <div className="flex items-center gap-3">
            <SkeletonLoader
              variant="text"
              width="50%"
              height={28}
              className="bg-background-muted"
            />
            <SkeletonLoader
              variant="circular"
              width={20}
              height={20}
              className="bg-background-subtle"
            />
          </div>
          <SkeletonLoader variant="text" width="30%" height={20} className="bg-background-subtle" />
          <SkeletonLoader variant="text" width="80%" height={16} className="bg-background-subtle" />
        </div>
      </div>
    </div>

    {}
    <div className="flex-1 bg-background-surface px-8 py-8 space-y-8 overflow-auto">
      {}
      <div className="bg-background-subtle rounded-xl border border-border-subtle p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 bg-primary rounded-full" />
            <SkeletonLoader
              variant="rectangular"
              width={32}
              height={32}
              className="rounded-lg bg-primary-100 dark:bg-primary-900/30"
            />
            <SkeletonLoader
              variant="text"
              width={120}
              height={18}
              className="bg-background-muted"
            />
          </div>
          <SkeletonLoader
            variant="rectangular"
            width={60}
            height={32}
            className="rounded-lg bg-primary-50 dark:bg-primary-950/30"
          />
        </div>

        <div className="space-y-3">
          {[1, 2, 3].map(index => (
            <div
              key={index}
              className="p-5 rounded-xl border border-border-default bg-background-surface"
            >
              <div className="flex justify-between items-start mb-3">
                <SkeletonLoader
                  variant="text"
                  width="40%"
                  height={18}
                  className="bg-background-muted"
                />
                <SkeletonLoader
                  variant="rectangular"
                  width={100}
                  height={24}
                  className="rounded-md bg-background-subtle"
                />
              </div>
              <div className="flex items-center gap-2 mb-3">
                <SkeletonLoader
                  variant="text"
                  width="30%"
                  height={14}
                  className="bg-background-subtle"
                />
                <span className="text-text-muted">•</span>
                <SkeletonLoader
                  variant="text"
                  width="20%"
                  height={14}
                  className="bg-background-subtle"
                />
              </div>
              <SkeletonLoader
                variant="text"
                width="90%"
                height={14}
                className="bg-background-subtle"
              />
              <SkeletonLoader
                variant="text"
                width="70%"
                height={14}
                className="bg-background-subtle mt-2"
              />
            </div>
          ))}
        </div>
      </div>

      {}
      <div className="bg-background-subtle rounded-xl border border-border-subtle p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 bg-success rounded-full" />
            <SkeletonLoader
              variant="rectangular"
              width={32}
              height={32}
              className="rounded-lg bg-success-100 dark:bg-success-900/30"
            />
            <SkeletonLoader variant="text" width={80} height={18} className="bg-background-muted" />
          </div>
          <SkeletonLoader
            variant="rectangular"
            width={60}
            height={32}
            className="rounded-lg bg-success-50 dark:bg-success-950/30"
          />
        </div>

        <div className="space-y-3">
          {[1, 2].map(index => (
            <div
              key={index}
              className="p-5 rounded-xl border border-border-default bg-background-surface"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <SkeletonLoader
                    variant="text"
                    width="60%"
                    height={18}
                    className="bg-background-muted"
                  />
                  <SkeletonLoader
                    variant="text"
                    width="40%"
                    height={14}
                    className="bg-background-subtle"
                  />
                  <SkeletonLoader
                    variant="text"
                    width="30%"
                    height={12}
                    className="bg-background-subtle"
                  />
                </div>
                <SkeletonLoader
                  variant="rectangular"
                  width={100}
                  height={24}
                  className="rounded-md bg-background-subtle"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {}
      <div className="bg-background-subtle rounded-xl border border-border-subtle p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 bg-primary rounded-full" />
            <SkeletonLoader
              variant="rectangular"
              width={32}
              height={32}
              className="rounded-lg bg-primary-100 dark:bg-primary-900/30"
            />
            <SkeletonLoader variant="text" width={60} height={18} className="bg-background-muted" />
          </div>
          <SkeletonLoader
            variant="rectangular"
            width={60}
            height={32}
            className="rounded-lg bg-primary-50 dark:bg-primary-950/30"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(index => (
            <SkeletonLoader
              key={index}
              variant="rectangular"
              width={Math.random() * 40 + 60}
              height={32}
              className="rounded-lg bg-background-surface border border-border-default"
            />
          ))}
        </div>
      </div>

      {}
      <div className="bg-background-subtle rounded-xl border border-border-subtle p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 bg-warning rounded-full" />
            <SkeletonLoader
              variant="rectangular"
              width={32}
              height={32}
              className="rounded-lg bg-warning-100 dark:bg-warning-900/30"
            />
            <SkeletonLoader
              variant="text"
              width={100}
              height={18}
              className="bg-background-muted"
            />
          </div>
          <SkeletonLoader
            variant="rectangular"
            width={60}
            height={32}
            className="rounded-lg bg-warning-50 dark:bg-warning-950/30"
          />
        </div>

        <div className="space-y-3">
          {[1, 2].map(index => (
            <div
              key={index}
              className="p-5 rounded-xl border border-border-default bg-background-surface"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <SkeletonLoader
                    variant="text"
                    width="50%"
                    height={18}
                    className="bg-background-muted"
                  />
                  <SkeletonLoader
                    variant="text"
                    width="30%"
                    height={14}
                    className="bg-background-subtle"
                  />
                  <div className="flex items-center gap-4">
                    <SkeletonLoader
                      variant="text"
                      width={80}
                      height={12}
                      className="bg-background-subtle"
                    />
                    <SkeletonLoader
                      variant="text"
                      width={80}
                      height={12}
                      className="bg-background-subtle"
                    />
                  </div>
                </div>
                <SkeletonLoader
                  variant="circular"
                  width={32}
                  height={32}
                  className="bg-primary-50 dark:bg-primary-950/30"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

    {}
    <div className="border-t border-border-default bg-background-surface px-8 py-5 flex items-center justify-end">
      <SkeletonLoader
        variant="rectangular"
        width={100}
        height={44}
        className="rounded-xl bg-primary-100 dark:bg-primary-900/30"
      />
    </div>
  </div>
)

export const SkeletonStatCard: React.FC<{ className?: string }> = ({ className }) => (
  <div
    className={cn(
      'bg-background-surface rounded-2xl border border-border-default p-6 shadow-sm',
      className
    )}
  >
    <div className="flex items-center justify-between">
      <div className="space-y-3">
        <SkeletonLoader variant="text" width="60%" height={14} className="bg-background-muted" />
        <SkeletonLoader variant="text" width="40%" height={32} className="bg-background-muted" />
        <SkeletonLoader variant="text" width="80%" height={12} className="bg-background-subtle" />
      </div>
      <SkeletonLoader variant="circular" width={48} height={48} className="bg-background-subtle" />
    </div>
  </div>
)

export const SkeletonRecentActivity: React.FC<{ className?: string }> = ({ className }) => (
  <div
    className={cn(
      'bg-background-surface rounded-2xl border border-border-default shadow-sm overflow-hidden',
      className
    )}
  >
    <div className="p-6 border-b border-border-default bg-background-subtle/50">
      <SkeletonLoader variant="text" width="30%" height={18} className="mb-2 bg-background-muted" />
      <SkeletonLoader variant="text" width="60%" height={14} className="bg-background-subtle" />
    </div>

    <div className="divide-y divide-border-subtle">
      {[1, 2, 3, 4, 5].map(index => (
        <div key={index} className="p-4 flex items-start gap-4">
          {}
          <div className="flex-shrink-0 w-16 text-right pt-1 space-y-1">
            <SkeletonLoader
              variant="text"
              width="100%"
              height={14}
              className="bg-background-muted"
            />
            <SkeletonLoader
              variant="text"
              width="80%"
              height={12}
              className="bg-background-subtle"
            />
          </div>

          {}
          <div className="relative flex flex-col items-center">
            <SkeletonLoader
              variant="rectangular"
              width={40}
              height={40}
              className="rounded-xl bg-primary-50 dark:bg-primary-950/30"
            />
          </div>

          {}
          <div className="flex-1 pt-1 space-y-1">
            <SkeletonLoader
              variant="text"
              width="90%"
              height={14}
              className="bg-background-muted"
            />
          </div>
        </div>
      ))}
    </div>

    <div className="p-4 bg-background-subtle/50 border-t border-border-default text-center">
      <SkeletonLoader
        variant="text"
        width="30%"
        height={14}
        className="bg-background-subtle mx-auto"
      />
    </div>
  </div>
)

export const SkeletonRecruiterJobCard: React.FC<{ className?: string }> = ({ className }) => (
  <div
    className={cn(
      'transition-all duration-300 w-full bg-background-surface rounded-xl border p-6 border-border-default shadow-sm',
      className
    )}
  >
    <div className="flex flex-col h-full">
      {}
      <div className="flex items-start justify-between mb-5">
        <SkeletonLoader
          variant="rectangular"
          width={85}
          height={24}
          className="rounded-full bg-primary-50"
        />
        <div className="flex items-center gap-2">
          <SkeletonLoader variant="circular" width={8} height={8} className="bg-success" />
          <SkeletonLoader variant="text" width={40} height={11} className="bg-background-subtle" />
        </div>
      </div>

      {}
      <div className="mb-5">
        <SkeletonLoader variant="text" width="85%" height={19} className="bg-background-muted" />
      </div>

      {}
      <div className="space-y-2.5 text-sm text-text-tertiary mb-6">
        {}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <SkeletonLoader
              variant="circular"
              width={14}
              height={14}
              className="bg-background-muted"
            />
            <SkeletonLoader variant="text" width={80} height={14} className="bg-background-muted" />
          </div>
          <div className="flex items-center gap-1.5">
            <SkeletonLoader
              variant="circular"
              width={14}
              height={14}
              className="bg-background-muted"
            />
            <SkeletonLoader variant="text" width={60} height={14} className="bg-background-muted" />
          </div>
        </div>

        {}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <SkeletonLoader
              variant="circular"
              width={14}
              height={14}
              className="bg-background-muted"
            />
            <SkeletonLoader variant="text" width={90} height={14} className="bg-background-muted" />
          </div>
          <div className="flex items-center gap-1.5">
            <SkeletonLoader
              variant="circular"
              width={14}
              height={14}
              className="bg-background-muted"
            />
            <SkeletonLoader variant="text" width={70} height={14} className="bg-background-muted" />
          </div>
          <div className="flex items-center gap-1.5">
            <SkeletonLoader
              variant="circular"
              width={14}
              height={14}
              className="bg-background-muted"
            />
            <SkeletonLoader variant="text" width={60} height={14} className="bg-background-muted" />
          </div>
        </div>
      </div>

      {}
      <div className="flex-1" />

      {}
      <div className="flex items-center justify-between pt-6 border-t border-border-subtle">
        <div className="flex items-center gap-3">
          <SkeletonLoader
            variant="rectangular"
            width={60}
            height={36}
            className="rounded-lg bg-primary-50 dark:bg-primary-950/30"
          />
          <SkeletonLoader
            variant="rectangular"
            width={60}
            height={36}
            className="rounded-lg bg-primary-50 dark:bg-primary-950/30"
          />
        </div>
        <SkeletonLoader
          variant="rectangular"
          width={120}
          height={36}
          className="rounded-lg bg-primary-50 dark:bg-primary-950/30"
        />
      </div>
    </div>
  </div>
)

export const SkeletonJobTabSwitcher: React.FC<{ className?: string }> = ({ className }) => (
  <div
    className={cn(
      'bg-background-surface rounded-2xl border border-border-default p-1 shadow-sm',
      className
    )}
  >
    <div className="flex overflow-x-auto gap-1">
      {[1, 2, 3, 4].map(index => (
        <div
          key={index}
          className="flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-xl"
        >
          <SkeletonLoader variant="text" width={80} height={14} className="bg-background-muted" />
          <SkeletonLoader
            variant="rectangular"
            width={24}
            height={20}
            className="rounded-full bg-background-subtle"
          />
        </div>
      ))}
    </div>
  </div>
)
