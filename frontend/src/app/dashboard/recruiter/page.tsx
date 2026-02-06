'use client'

export const dynamic = 'force-dynamic'

import { useEffect } from 'react'
import { WelcomeMessage, StatsGrid } from '../../../components/dashboard'
import { AppShell } from '../../../components/layout/AppShell'
import { PageTransition, AnimatedContainer, LoadingSpinner } from '../../../components/common'
import { SkeletonStatCard } from '../../../components/common/SkeletonLoader'
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
      <PageTransition className="min-h-screen bg-background-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12 space-y-8">
          {/* Tier 1: Welcome */}
          <AnimatedContainer direction="up" delay={0.1}>
            <WelcomeMessage firstName={user?.name} organizationName={user?.organization?.name} />
          </AnimatedContainer>

          {/* Tier 2: Stats */}
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
        </div>
      </PageTransition>
    </AppShell>
  )
}
