'use client'

import React from 'react'
import { Users, Briefcase, FileText } from 'lucide-react'
import { AppShell } from '../../../components/layout/AppShell'
import { PageTransition, AnimatedContainer, StatCard } from '../../../components/common'
import { WelcomeMessage } from '../../../components/dashboard'
import { useAuth } from '../../../hooks/useAuth'

export default function OrganizationDashboard() {
  const { user } = useAuth()

  return (
    <AppShell>
      <PageTransition className="min-h-screen bg-background-subtle">
        <div className="space-y-8 pb-12">
          {/* Header with Gradient Background */}
          <AnimatedContainer direction="up" delay={0.1}>
            <div className="relative py-8 bg-gradient-to-b from-primary-50/50 to-background-surface border-b border-primary-200/50 mb-6 transition-all duration-300 ease-out">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-300 ease-out">
                <WelcomeMessage
                  firstName={user?.name}
                  organizationName={user?.organization?.name || user?.name}
                />
              </div>
            </div>
          </AnimatedContainer>

          {/* Main Content Container */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            {/* Stats Grid */}
            <AnimatedContainer direction="up" delay={0.2}>
              <div className="grid gap-6 md:grid-cols-3">
                <StatCard
                  title="Total Recruiters"
                  value="12"
                  icon={<Users />}
                  description="Active team members"
                />
                <StatCard
                  title="Active Jobs"
                  value="45"
                  icon={<Briefcase />}
                  description="Open positions"
                />
                <StatCard
                  title="Total Applicants"
                  value="1,284"
                  icon={<FileText />}
                  description="Across all jobs"
                />
              </div>
            </AnimatedContainer>
          </div>
        </div>
      </PageTransition>
    </AppShell>
  )
}
