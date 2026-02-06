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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12 space-y-8">
          {/* Minimalist Page Header */}
          <AnimatedContainer direction="up" delay={0.1}>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-2">
                <h1 className="text-[32px] max-lg:text-[28px] font-bold text-text-primary leading-tight tracking-tight">
                  Interviews
                </h1>
                <p className="text-base text-text-secondary">
                  Schedule and manage interviews with selected candidates
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-2 bg-background-surface rounded-lg border border-border-default shadow-sm">
                  <Calendar className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                  <span className="font-semibold text-sm text-text-primary">0</span>
                  <span className="text-xs text-text-muted">Scheduled</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-background-surface rounded-lg border border-border-default shadow-sm">
                  <Clock className="w-4 h-4 text-warning-600 dark:text-warning-400" />
                  <span className="font-semibold text-sm text-text-primary">0</span>
                  <span className="text-xs text-text-muted">Pending</span>
                </div>
              </div>
            </div>
            <div className="mt-6 border-b border-border-default/60" />
          </AnimatedContainer>

          {/* Content */}
          <AnimatedContainer direction="up" delay={0.2}>
            <div className="flex flex-col items-center justify-center py-24 text-center bg-background-subtle/50 rounded-2xl border-2 border-dashed border-border-subtle">
              <div className="w-20 h-20 bg-background-surface shadow-sm border border-border-subtle rounded-2xl flex items-center justify-center mb-6">
                <Users className="w-10 h-10 text-primary-300 dark:text-primary-600" />
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-2">
                Interview Management Coming Soon
              </h3>
              <p className="text-base text-text-tertiary max-w-md">
                Schedule interviews, manage candidate availability, and track interview progress all
                in one place.
              </p>
            </div>
          </AnimatedContainer>
        </div>
      </PageTransition>
    </AppShell>
  )
}
