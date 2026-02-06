'use client'

import React, { useEffect } from 'react'
import { AppShell } from '../../../components/layout/AppShell'
import { PageTransition, AnimatedContainer, LoadingSpinner } from '../../../components/common'
import { useAuth } from '../../../hooks/useAuth'
import { Calendar, Users, Clock } from 'lucide-react'

export default function InterviewsPage() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth()

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

  return (
    <AppShell>
      <PageTransition className="min-h-screen bg-background-subtle">
        <div className="space-y-8 pb-12">
          {/* Enhanced Header with Gradient Background */}
          <AnimatedContainer direction="up" delay={0.1}>
            <div className="relative py-12 bg-gradient-to-b from-primary-50/50 dark:from-primary-950/30 to-background-surface border-b border-primary-50/50 dark:border-primary-900/30 mb-8 transition-all duration-300 ease-out">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-300 ease-out">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <h1 className="text-4xl max-lg:text-3xl font-bold text-text-primary leading-tight tracking-tight">
                      Interviews
                    </h1>
                    <p className="text-lg text-text-secondary mt-2 max-w-2xl">
                      Schedule and manage interviews with selected candidates
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-4 py-2 bg-background-surface rounded-xl border border-border-default shadow-sm">
                      <Calendar className="w-5 h-5 text-primary-600" />
                      <span className="font-semibold text-text-primary">0</span>
                      <span className="text-sm text-text-secondary">Scheduled</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-background-surface rounded-xl border border-border-default shadow-sm">
                      <Clock className="w-5 h-5 text-warning-600 dark:text-warning-400" />
                      <span className="font-semibold text-text-primary">0</span>
                      <span className="text-sm text-text-secondary">Pending</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedContainer>

          {/* Main Content Container */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <AnimatedContainer direction="up" delay={0.2}>
              {/* Coming Soon Content */}
              <div className="flex flex-col items-center justify-center py-24 text-center bg-background-subtle/50 rounded-3xl border-2 border-dashed border-border-subtle">
                <div className="w-20 h-20 bg-background-surface shadow-sm border border-border-subtle rounded-2xl flex items-center justify-center mb-6">
                  <Users className="w-10 h-10 text-primary-300 dark:text-primary-600" />
                </div>
                <h3 className="text-xl font-bold text-text-primary mb-2">
                  Interview Management Coming Soon
                </h3>
                <p className="text-base text-text-tertiary max-w-md">
                  Schedule interviews, manage candidate availability, and track interview progress
                  all in one place.
                </p>
              </div>
            </AnimatedContainer>
          </div>
        </div>
      </PageTransition>
    </AppShell>
  )
}
