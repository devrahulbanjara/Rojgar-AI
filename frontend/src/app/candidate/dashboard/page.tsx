'use client'

export const dynamic = 'force-dynamic'

import { useEffect } from 'react'
import CandidateDashboardComponent from '../../../components/dashboard/CandidateDashboard'
import { WelcomeMessage } from '../../../components/dashboard'
import { PageTransition, AnimatedContainer, SkeletonLoader } from '../../../components/common'
import { SkeletonDashboardColumn } from '../../../components/common/SkeletonLoader'
import { AppShell } from '../../../components/layout/AppShell'
import { useAuth } from '../../../hooks/useAuth'

function CandidateDashboardPageSkeleton() {
  return (
    <AppShell>
      <PageTransition className="min-h-screen bg-background-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12 space-y-8">
          <AnimatedContainer direction="up" delay={0.1}>
            <div className="space-y-3">
              <SkeletonLoader variant="text" width="38%" height={36} />
              <SkeletonLoader variant="text" width="32%" height={18} />
            </div>
          </AnimatedContainer>

          <AnimatedContainer direction="up" delay={0.3}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
              <SkeletonDashboardColumn
                bgColor="bg-primary-50/50 dark:bg-primary-950/30"
                borderColor="border-primary-200/60 dark:border-primary-800/60"
                iconColor="bg-primary-200 dark:bg-primary-800"
                textColor="bg-border-default"
                badgeColor="bg-primary-100 dark:bg-primary-900/30"
              />
              <SkeletonDashboardColumn
                bgColor="bg-primary-50/50 dark:bg-primary-950/30"
                borderColor="border-primary-200/60 dark:border-primary-800/60"
                iconColor="bg-primary-200 dark:bg-primary-800"
                textColor="bg-border-default"
                badgeColor="bg-primary-100 dark:bg-primary-900/30"
              />
              <SkeletonDashboardColumn
                bgColor="bg-success-50/50 dark:bg-success-950/30"
                borderColor="border-success-200/60 dark:border-success-800/60"
                iconColor="bg-success-200 dark:bg-success-800"
                textColor="bg-border-default"
                badgeColor="bg-success-100 dark:bg-success-900/30"
              />
            </div>
          </AnimatedContainer>
        </div>
      </PageTransition>
    </AppShell>
  )
}

export default function CandidateDashboardPage() {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth()

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      window.location.href = '/signin'
    }
  }, [isAuthenticated, isAuthLoading])

  if (isAuthLoading) {
    return <CandidateDashboardPageSkeleton />
  }

  if (!isAuthenticated) {
    return null
  }

  const firstName = user?.name?.split(' ')[0]

  return (
    <AppShell>
      <PageTransition className="min-h-screen bg-background-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12 space-y-8">
          {/* Tier 1: Welcome */}
          <AnimatedContainer direction="up" delay={0.1}>
            <WelcomeMessage firstName={firstName} subtitle="Track your job application journey" />
          </AnimatedContainer>

          {/* Tier 2: Application Board */}
          <AnimatedContainer direction="up" delay={0.3}>
            <CandidateDashboardComponent />
          </AnimatedContainer>
        </div>
      </PageTransition>
    </AppShell>
  )
}
