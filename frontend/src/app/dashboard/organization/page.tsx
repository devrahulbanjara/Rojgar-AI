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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12 space-y-8">
          {/* Tier 1: Welcome Section */}
          <AnimatedContainer direction="up" delay={0.1}>
            <WelcomeMessage
              firstName={user?.name}
              organizationName={user?.organization?.name || user?.name}
            />
          </AnimatedContainer>

          {/* Tier 2: Stats Cards */}
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
      </PageTransition>
    </AppShell>
  )
}
