'use client';

export const dynamic = 'force-dynamic';

import { DashboardHeader, StatsGrid } from '../../../components/dashboard';
import { RecentActivityTimeline } from '../../../components/dashboard/RecentActivityTimeline';
import { AppShell } from '../../../components/layout/AppShell';
import { PageTransition, AnimatedContainer, PageHeader } from '../../../components/common';
import { useDashboardStats } from '../../../hooks/useDashboardStats';

export default function RecruiterDashboard() {
  const { data: stats } = useDashboardStats();

  return (
    <AppShell>
      <PageTransition className="min-h-screen" style={{ background: '#F9FAFB' }}>
        <div className="space-y-8">
          {/* Header */}
          <AnimatedContainer direction="up" delay={0.1}>
            <DashboardHeader
              title="Recruiter Dashboard"
              subtitle="Manage your recruitment pipeline and find the best candidates"
            />
          </AnimatedContainer>

          {/* Stats Grid */}
          <AnimatedContainer direction="up" delay={0.2}>
            <StatsGrid
              stats={stats || {}}
              userType="recruiter"
            />
          </AnimatedContainer>

          {/* Recent Activity Section */}
          <AnimatedContainer direction="up" delay={0.3}>
            <div className="space-y-8">
              <PageHeader
                title="Recent Activity"
                subtitle="Latest updates from your recruitment pipeline"
              />

              <div
                className="bg-white rounded-2xl border border-[#E5E7EB] p-8"
                style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
              >
                <RecentActivityTimeline />
              </div>
            </div>
          </AnimatedContainer>
        </div>
      </PageTransition>
    </AppShell>
  );
}
