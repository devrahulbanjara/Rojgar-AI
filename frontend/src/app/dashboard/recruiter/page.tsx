'use client';

export const dynamic = 'force-dynamic';

import { DashboardHeader, StatsGrid } from '../../../components/dashboard';
import { AppShell } from '../../../components/layout/AppShell';
import { PageTransition, AnimatedContainer } from '../../../components/common';
import { useDashboardStats } from '../../../hooks/useDashboardStats';
import { BriefcaseIcon } from 'lucide-react';

export default function RecruiterDashboard() {
  const { data: stats } = useDashboardStats();

  return (
    <AppShell>
      <PageTransition className="min-h-screen bg-slate-50">
        <div className="space-y-6">
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
            <div className="space-y-6">
              <DashboardHeader
                title="Recent Activity"
                subtitle="Latest updates from your recruitment pipeline"
              />
              
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                <div className="text-center py-12">
                  <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BriefcaseIcon className="h-8 w-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-700 mb-2">No recent activity</h3>
                  <p className="text-slate-500 max-w-md mx-auto">
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
