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
  const baseClasses = 'animate-pulse bg-slate-200 rounded'

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
  <div className={cn('p-6 space-y-4', className)}>
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
      'group transition-all duration-300 w-full bg-white rounded-xl border p-6 border-slate-200 shadow-sm',
      className
    )}
    style={{
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    }}
  >
    <div className="flex flex-col h-full">
      {/* Header Row: Department Badge + Level Badge + Saved Indicator */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-2">
          <SkeletonLoader
            variant="rectangular"
            width={85}
            height={24}
            className="rounded-full bg-slate-100"
          />
          <SkeletonLoader
            variant="rectangular"
            width={65}
            height={24}
            className="rounded-full bg-slate-100"
          />
        </div>
        {/* Bookmark icon placeholder - sometimes shown */}
        <SkeletonLoader variant="circular" width={20} height={20} className="bg-slate-100" />
      </div>

      {/* Job Title & Company - Refined Typography */}
      <div className="mb-5">
        <SkeletonLoader variant="text" width="90%" height={26} className="mb-2 bg-slate-200" />
        <SkeletonLoader variant="text" width="60%" height={20} className="bg-slate-200" />
      </div>

      {/* Metadata - Cleanly Organized */}
      <div className="space-y-2.5 text-sm text-slate-600 mb-6">
        {/* Row 1: Location + Time */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <SkeletonLoader variant="circular" width={14} height={14} className="bg-slate-200" />
            <SkeletonLoader variant="text" width={100} height={14} className="bg-slate-200" />
          </div>
          <div className="flex items-center gap-1.5">
            <SkeletonLoader variant="circular" width={14} height={14} className="bg-slate-200" />
            <SkeletonLoader variant="text" width={60} height={14} className="bg-slate-200" />
          </div>
        </div>

        {/* Row 2: Salary + Type + Work Mode */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <SkeletonLoader variant="circular" width={14} height={14} className="bg-slate-200" />
            <SkeletonLoader variant="text" width={90} height={14} className="bg-slate-200" />
          </div>
          <div className="flex items-center gap-1.5">
            <SkeletonLoader variant="circular" width={14} height={14} className="bg-slate-200" />
            <SkeletonLoader variant="text" width={70} height={14} className="bg-slate-200" />
          </div>
          <div className="flex items-center gap-1.5">
            <SkeletonLoader variant="circular" width={14} height={14} className="bg-slate-200" />
            <SkeletonLoader variant="text" width={60} height={14} className="bg-slate-200" />
          </div>
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom Stats Row - Colored Badges */}
      <div className="flex items-center justify-between gap-3 pt-6 border-t border-slate-100">
        <div className="flex items-center gap-3">
          <SkeletonLoader
            variant="rectangular"
            width={75}
            height={36}
            className="rounded-lg bg-purple-50/50"
          />
          <SkeletonLoader
            variant="rectangular"
            width={70}
            height={36}
            className="rounded-lg bg-blue-50/50"
          />
        </div>
        <SkeletonLoader
          variant="rectangular"
          width={80}
          height={36}
          className="rounded-lg bg-amber-50/50"
        />
      </div>
    </div>
  </div>
)

export const SkeletonStats: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('p-6 space-y-4', className)}>
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
      'bg-white p-4 rounded-lg shadow-sm border border-slate-200 border-l-[4px] border-l-blue-500',
      className
    )}
  >
    {/* Header: Title & Company */}
    <div className="mb-3">
      <SkeletonLoader variant="text" width="85%" height={16} className="mb-1 bg-slate-200" />
      <SkeletonLoader variant="text" width="60%" height={14} className="bg-slate-100" />
    </div>

    {/* Metadata: Location & Type */}
    <div className="flex items-center gap-3 mb-4">
      <div className="flex items-center gap-1">
        <SkeletonLoader variant="circular" width={12} height={12} className="bg-slate-200" />
        <SkeletonLoader variant="text" width={60} height={12} className="bg-slate-200" />
      </div>
      <div className="flex items-center gap-1">
        <SkeletonLoader variant="circular" width={12} height={12} className="bg-slate-200" />
        <SkeletonLoader variant="text" width={50} height={12} className="bg-slate-200" />
      </div>
    </div>

    {/* Footer: Date & Status Chip */}
    <div className="flex items-center justify-between pt-3 border-t border-slate-50">
      <div className="flex items-center gap-1">
        <SkeletonLoader variant="circular" width={12} height={12} className="bg-slate-200" />
        <SkeletonLoader variant="text" width={70} height={11} className="bg-slate-200" />
      </div>
      <SkeletonLoader
        variant="rectangular"
        width={55}
        height={18}
        className="rounded-full bg-slate-100"
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
  bgColor = 'bg-blue-50/50',
  borderColor = 'border-blue-100/60',
  iconColor = 'bg-blue-200',
  textColor = 'bg-slate-200',
  badgeColor = 'bg-blue-100',
}) => (
  <div
    className={cn(
      `${bgColor} rounded-2xl p-6 flex flex-col gap-6 border ${borderColor} shadow-sm/50`,
      className
    )}
  >
    {/* Column Header */}
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

    {/* Application Cards */}
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
      'bg-white rounded-2xl border border-[#E5E7EB] shadow-lg shadow-blue-500/5 overflow-hidden relative',
      className
    )}
  >
    {/* Decorative Background */}
    <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-blue-500/5 opacity-50" />

    <div className="p-8 relative">
      <div className="flex flex-col md:flex-row items-center gap-8">
        {/* Profile Picture */}
        <div className="relative flex-shrink-0">
          <div className="absolute -inset-2 bg-gradient-to-br from-[#3056F5]/20 to-blue-200/20 rounded-full blur-md" />
          <div className="relative p-1 bg-white rounded-full ring-1 ring-blue-100">
            <SkeletonLoader
              variant="circular"
              width={128}
              height={128}
              className="border-4 border-white shadow-sm bg-slate-200"
            />
          </div>
        </div>

        {/* User Info */}
        <div className="flex-1 flex flex-col justify-center space-y-4 text-center md:text-left">
          <SkeletonLoader variant="text" width="60%" height={36} className="bg-slate-200" />
          <SkeletonLoader variant="text" width="40%" height={24} className="bg-slate-100" />
          <SkeletonLoader variant="text" width="80%" height={20} className="bg-slate-100" />
        </div>
      </div>
    </div>
  </div>
)

export const SkeletonProfileTab: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('bg-white rounded-2xl border border-[#E5E7EB] p-1 shadow-sm', className)}>
    <div className="flex overflow-x-auto gap-1">
      {[1, 2, 3, 4].map(index => (
        <div
          key={index}
          className="flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-xl"
        >
          <SkeletonLoader variant="circular" width={20} height={20} className="bg-slate-200" />
          <SkeletonLoader variant="text" width={100} height={14} className="bg-slate-200" />
        </div>
      ))}
    </div>
  </div>
)

export const SkeletonProfileForm: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('bg-white rounded-2xl border border-[#E5E7EB] shadow-sm', className)}>
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <SkeletonLoader variant="text" width="40%" height={28} className="mb-2 bg-slate-200" />
        <SkeletonLoader variant="text" width="60%" height={16} className="bg-slate-100" />
      </div>

      {/* Contact Details Section */}
      <div className="bg-white rounded-2xl p-8 border border-[#E5E7EB] shadow-sm mb-8">
        <div className="flex items-center gap-4 mb-8 pb-4 border-b border-gray-100">
          <SkeletonLoader
            variant="rectangular"
            width={48}
            height={48}
            className="rounded-xl bg-blue-50"
          />
          <div className="space-y-2">
            <SkeletonLoader variant="text" width={120} height={18} className="bg-slate-200" />
            <SkeletonLoader variant="text" width={180} height={14} className="bg-slate-100" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[1, 2, 3, 4, 5, 6].map(index => (
            <div key={index} className="space-y-3">
              <SkeletonLoader variant="text" width="30%" height={14} className="bg-slate-200" />
              <SkeletonLoader
                variant="rectangular"
                width="100%"
                height={48}
                className="rounded-xl bg-gray-50"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Professional Summary Section */}
      <div className="bg-white rounded-2xl p-8 border border-[#E5E7EB] shadow-sm mb-8">
        <div className="flex items-center gap-4 mb-8 pb-4 border-b border-gray-100">
          <SkeletonLoader
            variant="rectangular"
            width={48}
            height={48}
            className="rounded-xl bg-indigo-50"
          />
          <div className="space-y-2">
            <SkeletonLoader variant="text" width={140} height={18} className="bg-slate-200" />
            <SkeletonLoader variant="text" width={200} height={14} className="bg-slate-100" />
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <SkeletonLoader variant="text" width="40%" height={14} className="bg-slate-200" />
            <SkeletonLoader
              variant="rectangular"
              width="100%"
              height={48}
              className="rounded-xl bg-gray-50"
            />
          </div>
          <div className="space-y-3">
            <SkeletonLoader variant="text" width="35%" height={14} className="bg-slate-200" />
            <SkeletonLoader
              variant="rectangular"
              width="100%"
              height={96}
              className="rounded-xl bg-gray-50"
            />
          </div>
        </div>
      </div>

      {/* Social Links Section */}
      <div className="bg-white rounded-2xl p-8 border border-[#E5E7EB] shadow-sm mb-8">
        <div className="flex items-center gap-4 mb-8 pb-4 border-b border-gray-100">
          <SkeletonLoader
            variant="rectangular"
            width={48}
            height={48}
            className="rounded-xl bg-green-50"
          />
          <div className="space-y-2">
            <SkeletonLoader variant="text" width={100} height={18} className="bg-slate-200" />
            <SkeletonLoader variant="text" width={160} height={14} className="bg-slate-100" />
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(index => (
            <SkeletonLoader
              key={index}
              variant="rectangular"
              width="100%"
              height={48}
              className="rounded-xl bg-gray-50"
            />
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-6 border-t border-[#E5E7EB]">
        <SkeletonLoader
          variant="rectangular"
          width={140}
          height={48}
          className="rounded-xl bg-blue-100"
        />
      </div>
    </div>
  </div>
)

export const SkeletonResumeDetail: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('h-full flex flex-col', className)}>
    {/* Header */}
    <div className="flex-shrink-0 bg-gradient-to-b from-gray-50 to-white px-8 py-8 border-b border-gray-200 relative">
      <div className="flex items-start gap-4 pr-12">
        <div className="flex-1 min-w-0 space-y-4">
          <div className="flex items-center gap-3">
            <SkeletonLoader variant="text" width="50%" height={28} className="bg-slate-200" />
            <SkeletonLoader variant="circular" width={20} height={20} className="bg-slate-100" />
          </div>
          <SkeletonLoader variant="text" width="30%" height={20} className="bg-slate-100" />
          <SkeletonLoader variant="text" width="80%" height={16} className="bg-slate-100" />
        </div>
      </div>
    </div>

    {/* Content Sections */}
    <div className="flex-1 bg-white px-8 py-8 space-y-8 overflow-auto">
      {/* Experience Section */}
      <div className="bg-gray-50 rounded-xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 bg-blue-600 rounded-full" />
            <SkeletonLoader
              variant="rectangular"
              width={32}
              height={32}
              className="rounded-lg bg-blue-100"
            />
            <SkeletonLoader variant="text" width={120} height={18} className="bg-slate-200" />
          </div>
          <SkeletonLoader
            variant="rectangular"
            width={60}
            height={32}
            className="rounded-lg bg-blue-50"
          />
        </div>

        <div className="space-y-3">
          {[1, 2, 3].map(index => (
            <div key={index} className="p-5 rounded-xl border border-gray-200 bg-white">
              <div className="flex justify-between items-start mb-3">
                <SkeletonLoader variant="text" width="40%" height={18} className="bg-slate-200" />
                <SkeletonLoader
                  variant="rectangular"
                  width={100}
                  height={24}
                  className="rounded-md bg-gray-100"
                />
              </div>
              <div className="flex items-center gap-2 mb-3">
                <SkeletonLoader variant="text" width="30%" height={14} className="bg-slate-100" />
                <span className="text-gray-300">•</span>
                <SkeletonLoader variant="text" width="20%" height={14} className="bg-slate-100" />
              </div>
              <SkeletonLoader variant="text" width="90%" height={14} className="bg-slate-100" />
              <SkeletonLoader
                variant="text"
                width="70%"
                height={14}
                className="bg-slate-100 mt-2"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Education Section */}
      <div className="bg-gray-50 rounded-xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 bg-emerald-500 rounded-full" />
            <SkeletonLoader
              variant="rectangular"
              width={32}
              height={32}
              className="rounded-lg bg-emerald-100"
            />
            <SkeletonLoader variant="text" width={80} height={18} className="bg-slate-200" />
          </div>
          <SkeletonLoader
            variant="rectangular"
            width={60}
            height={32}
            className="rounded-lg bg-emerald-50"
          />
        </div>

        <div className="space-y-3">
          {[1, 2].map(index => (
            <div key={index} className="p-5 rounded-xl border border-gray-200 bg-white">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <SkeletonLoader variant="text" width="60%" height={18} className="bg-slate-200" />
                  <SkeletonLoader variant="text" width="40%" height={14} className="bg-slate-100" />
                  <SkeletonLoader variant="text" width="30%" height={12} className="bg-slate-100" />
                </div>
                <SkeletonLoader
                  variant="rectangular"
                  width={100}
                  height={24}
                  className="rounded-md bg-gray-100"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Skills Section */}
      <div className="bg-gray-50 rounded-xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 bg-violet-500 rounded-full" />
            <SkeletonLoader
              variant="rectangular"
              width={32}
              height={32}
              className="rounded-lg bg-violet-100"
            />
            <SkeletonLoader variant="text" width={60} height={18} className="bg-slate-200" />
          </div>
          <SkeletonLoader
            variant="rectangular"
            width={60}
            height={32}
            className="rounded-lg bg-violet-50"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(index => (
            <SkeletonLoader
              key={index}
              variant="rectangular"
              width={Math.random() * 40 + 60}
              height={32}
              className="rounded-lg bg-white border border-gray-200"
            />
          ))}
        </div>
      </div>

      {/* Certifications Section */}
      <div className="bg-gray-50 rounded-xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 bg-amber-500 rounded-full" />
            <SkeletonLoader
              variant="rectangular"
              width={32}
              height={32}
              className="rounded-lg bg-amber-100"
            />
            <SkeletonLoader variant="text" width={100} height={18} className="bg-slate-200" />
          </div>
          <SkeletonLoader
            variant="rectangular"
            width={60}
            height={32}
            className="rounded-lg bg-amber-50"
          />
        </div>

        <div className="space-y-3">
          {[1, 2].map(index => (
            <div key={index} className="p-5 rounded-xl border border-gray-200 bg-white">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <SkeletonLoader variant="text" width="50%" height={18} className="bg-slate-200" />
                  <SkeletonLoader variant="text" width="30%" height={14} className="bg-slate-100" />
                  <div className="flex items-center gap-4">
                    <SkeletonLoader
                      variant="text"
                      width={80}
                      height={12}
                      className="bg-slate-100"
                    />
                    <SkeletonLoader
                      variant="text"
                      width={80}
                      height={12}
                      className="bg-slate-100"
                    />
                  </div>
                </div>
                <SkeletonLoader variant="circular" width={32} height={32} className="bg-blue-50" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Footer */}
    <div className="border-t border-gray-200 bg-white px-8 py-5 flex items-center justify-end">
      <SkeletonLoader
        variant="rectangular"
        width={100}
        height={44}
        className="rounded-xl bg-blue-100"
      />
    </div>
  </div>
)

export const SkeletonStatCard: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-sm', className)}>
    <div className="flex items-center justify-between">
      <div className="space-y-3">
        <SkeletonLoader variant="text" width="60%" height={14} className="bg-slate-200" />
        <SkeletonLoader variant="text" width="40%" height={32} className="bg-slate-200" />
        <SkeletonLoader variant="text" width="80%" height={12} className="bg-slate-100" />
      </div>
      <SkeletonLoader variant="circular" width={48} height={48} className="bg-slate-100" />
    </div>
  </div>
)

export const SkeletonRecentActivity: React.FC<{ className?: string }> = ({ className }) => (
  <div
    className={cn(
      'bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden',
      className
    )}
  >
    <div className="p-6 border-b border-[#E5E7EB] bg-gray-50/50">
      <SkeletonLoader variant="text" width="30%" height={18} className="mb-2 bg-slate-200" />
      <SkeletonLoader variant="text" width="60%" height={14} className="bg-slate-100" />
    </div>

    <div className="divide-y divide-gray-100">
      {[1, 2, 3, 4, 5].map(index => (
        <div key={index} className="p-4 flex items-start gap-4">
          {/* Date/Time Column */}
          <div className="flex-shrink-0 w-16 text-right pt-1 space-y-1">
            <SkeletonLoader variant="text" width="100%" height={14} className="bg-slate-200" />
            <SkeletonLoader variant="text" width="80%" height={12} className="bg-slate-100" />
          </div>

          {/* Icon */}
          <div className="relative flex flex-col items-center">
            <SkeletonLoader
              variant="rectangular"
              width={40}
              height={40}
              className="rounded-xl bg-blue-50"
            />
          </div>

          {/* Content */}
          <div className="flex-1 pt-1 space-y-1">
            <SkeletonLoader variant="text" width="90%" height={14} className="bg-slate-200" />
          </div>
        </div>
      ))}
    </div>

    <div className="p-4 bg-gray-50/50 border-t border-[#E5E7EB] text-center">
      <SkeletonLoader variant="text" width="30%" height={14} className="bg-slate-100 mx-auto" />
    </div>
  </div>
)

export const SkeletonRecruiterJobCard: React.FC<{ className?: string }> = ({ className }) => (
  <div
    className={cn(
      'transition-all duration-300 w-full bg-white rounded-xl border p-6 border-slate-200 shadow-sm',
      className
    )}
    style={{
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    }}
  >
    <div className="flex flex-col h-full">
      {/* Header Row: Department Badge + Status Indicator */}
      <div className="flex items-start justify-between mb-5">
        <SkeletonLoader
          variant="rectangular"
          width={85}
          height={24}
          className="rounded-full bg-blue-50"
        />
        <div className="flex items-center gap-2">
          <SkeletonLoader variant="circular" width={8} height={8} className="bg-emerald-500" />
          <SkeletonLoader variant="text" width={40} height={11} className="bg-slate-100" />
        </div>
      </div>

      {/* Job Title */}
      <div className="mb-5">
        <SkeletonLoader variant="text" width="85%" height={19} className="bg-slate-200" />
      </div>

      {/* Metadata */}
      <div className="space-y-2.5 text-sm text-slate-600 mb-6">
        {/* Row 1: Location + Time */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <SkeletonLoader variant="circular" width={14} height={14} className="bg-slate-200" />
            <SkeletonLoader variant="text" width={80} height={14} className="bg-slate-200" />
          </div>
          <div className="flex items-center gap-1.5">
            <SkeletonLoader variant="circular" width={14} height={14} className="bg-slate-200" />
            <SkeletonLoader variant="text" width={60} height={14} className="bg-slate-200" />
          </div>
        </div>

        {/* Row 2: Salary + Type + Work Mode */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <SkeletonLoader variant="circular" width={14} height={14} className="bg-slate-200" />
            <SkeletonLoader variant="text" width={90} height={14} className="bg-slate-200" />
          </div>
          <div className="flex items-center gap-1.5">
            <SkeletonLoader variant="circular" width={14} height={14} className="bg-slate-200" />
            <SkeletonLoader variant="text" width={70} height={14} className="bg-slate-200" />
          </div>
          <div className="flex items-center gap-1.5">
            <SkeletonLoader variant="circular" width={14} height={14} className="bg-slate-200" />
            <SkeletonLoader variant="text" width={60} height={14} className="bg-slate-200" />
          </div>
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom Action Row */}
      <div className="flex items-center justify-between pt-6 border-t border-slate-100">
        <div className="flex items-center gap-3">
          <SkeletonLoader
            variant="rectangular"
            width={60}
            height={36}
            className="rounded-lg bg-purple-50"
          />
          <SkeletonLoader
            variant="rectangular"
            width={60}
            height={36}
            className="rounded-lg bg-blue-50"
          />
        </div>
        <SkeletonLoader
          variant="rectangular"
          width={120}
          height={36}
          className="rounded-lg bg-indigo-50"
        />
      </div>
    </div>
  </div>
)

export const SkeletonJobTabSwitcher: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('bg-white rounded-2xl border border-[#E5E7EB] p-1 shadow-sm', className)}>
    <div className="flex overflow-x-auto gap-1">
      {[1, 2, 3, 4].map(index => (
        <div
          key={index}
          className="flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-xl"
        >
          <SkeletonLoader variant="text" width={80} height={14} className="bg-slate-200" />
          <SkeletonLoader
            variant="rectangular"
            width={24}
            height={20}
            className="rounded-full bg-slate-100"
          />
        </div>
      ))}
    </div>
  </div>
)
