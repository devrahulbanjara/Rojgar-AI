'use client';

export const dynamic = 'force-dynamic';

import CandidateDashboardComponent from '../../../components/dashboard/CandidateDashboard';
import { WelcomeMessage, StatsGrid } from '../../../components/dashboard';
import { PageTransition, AnimatedContainer, PageHeader } from '../../../components/common';
import { AppShell } from '../../../components/layout/AppShell';
import { useDashboardStats } from '../../../hooks/useDashboardStats';
import { useAuth } from '../../../hooks/useAuth';

export default function CandidateDashboardPage() {
  const { user } = useAuth();
  const { data: stats } = useDashboardStats();

  // Get first name from user's full name
  const firstName = user?.name?.split(' ')[0];

  return (
    <AppShell>
      <PageTransition className="min-h-screen" style={{ background: '#F9FAFB' }}>
        <div className="space-y-8">
          {/* Welcome Message */}
          <AnimatedContainer direction="up" delay={0.1}>
            <WelcomeMessage firstName={firstName} />
          </AnimatedContainer>

          {/* New Kanban Dashboard */}
          <AnimatedContainer direction="up" delay={0.3}>
            <CandidateDashboardComponent />
          </AnimatedContainer>
        </div>
      </PageTransition>
    </AppShell>
  );
}
