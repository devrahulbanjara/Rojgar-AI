'use client';

export const dynamic = 'force-dynamic';

import { DashboardHeader, StatsGrid } from '../../../components/dashboard';
import { AppShell } from '../../../components/layout/AppShell';
import { PageTransition, AnimatedContainer, PageHeader } from '../../../components/common';
import { useDashboardStats } from '../../../hooks/useDashboardStats';
import { BriefcaseIcon } from 'lucide-react';

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
                <div className="text-center py-12">
                  <div 
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                    style={{ background: 'rgba(48, 86, 245, 0.08)' }}
                  >
                    <BriefcaseIcon className="h-8 w-8 text-[#3056F5]" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#0F172A] mb-2">No recent activity</h3>
                  <p className="text-[#475569] max-w-md mx-auto">
                    Your recruitment activities will appear here as you post jobs and review candidates.
                  </p>
                </div>
              </div>
            </div>
          </AnimatedContainer>
        </div>
      </PageTransition>
    </AppShell>
  );
}
