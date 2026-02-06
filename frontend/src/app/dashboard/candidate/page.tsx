'use client'

export const dynamic = 'force-dynamic'

import { useEffect } from 'react'
import CandidateDashboardComponent from '../../../components/dashboard/CandidateDashboard'
import { WelcomeMessage } from '../../../components/dashboard'
import { PageTransition, AnimatedContainer, LoadingSpinner } from '../../../components/common'
import { AppShell } from '../../../components/layout/AppShell'
import { useAuth } from '../../../hooks/useAuth'

export default function CandidateDashboardPage() {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth()

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      window.location.href = '/login'
    }
  }, [isAuthenticated, isAuthLoading])

  if (isAuthLoading || !isAuthenticated) {
    return (
      <AppShell>
        <PageTransition className="min-h-screen flex items-center justify-center">
          <LoadingSpinner />
        </PageTransition>
      </AppShell>
    )
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
