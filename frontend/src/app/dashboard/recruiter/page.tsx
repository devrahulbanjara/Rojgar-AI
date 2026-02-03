'use client'

export const dynamic = 'force-dynamic'

import { useEffect } from 'react'
import { WelcomeMessage, StatsGrid } from '../../../components/dashboard'
import { RecentActivity } from '../../../components/dashboard/RecentActivity'
import { AppShell } from '../../../components/layout/AppShell'
import { PageTransition, AnimatedContainer, LoadingSpinner } from '../../../components/common'
import { SkeletonStatCard, SkeletonRecentActivity } from '../../../components/common/SkeletonLoader'
import { useDashboardStats } from '../../../hooks/useDashboardStats'
import { useAuth } from '../../../hooks/useAuth'
import { useWebSocket } from '../../../hooks/useWebSocket'

export default function RecruiterDashboard() {
  const { data: stats, isLoading: isStatsLoading, refetch: refetchStats } = useDashboardStats()
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth()

  useWebSocket()

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      window.location.href = '/login'
    }
  }, [isAuthenticated, isAuthLoading])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'R') {
        event.preventDefault()
        refetchStats()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [refetchStats])

  if (isAuthLoading || !isAuthenticated) {
    return (
      <AppShell>
        <PageTransition className="min-h-screen flex items-center justify-center">
          <LoadingSpinner />
        </PageTransition>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <PageTransition className="min-h-screen" style={{ background: '#F9FAFB' }}>
        <div className="space-y-8 pb-12">
          <AnimatedContainer direction="up" delay={0.1}>
            <div className="relative py-8 bg-gradient-to-b from-indigo-50/50 to-white border-b border-indigo-50/50 mb-6 transition-all duration-300 ease-out">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-300 ease-out">
                <WelcomeMessage
                  firstName={user?.name}
                  organizationName={user?.organization?.name}
                />
              </div>
            </div>
          </AnimatedContainer>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <AnimatedContainer direction="up" delay={0.2}>
              {isStatsLoading ? (
                <div className="grid gap-6 md:grid-cols-4">
                  <SkeletonStatCard />
                  <SkeletonStatCard />
                  <SkeletonStatCard />
                  <SkeletonStatCard />
                </div>
              ) : (
                <StatsGrid stats={stats || {}} userType="recruiter" />
              )}
            </AnimatedContainer>

            <AnimatedContainer direction="up" delay={0.3}>
              {isStatsLoading ? <SkeletonRecentActivity /> : <RecentActivity />}
            </AnimatedContainer>
          </div>
        </div>
      </PageTransition>
    </AppShell>
  )
}
