'use client';

export const dynamic = 'force-dynamic';

import { useEffect } from 'react';
import CandidateDashboardComponent from '../../../components/dashboard/CandidateDashboard';
import { WelcomeMessage, StatsGrid } from '../../../components/dashboard';
import { PageTransition, AnimatedContainer, PageHeader, LoadingSpinner } from '../../../components/common';
import { AppShell } from '../../../components/layout/AppShell';
import { useDashboardStats } from '../../../hooks/useDashboardStats';
import { useAuth } from '../../../hooks/useAuth';

export default function CandidateDashboardPage() {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { data: stats } = useDashboardStats();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      window.location.href = '/login';
    }
  }, [isAuthenticated, isAuthLoading]);

  // Show loading state while checking authentication
  if (isAuthLoading || !isAuthenticated) {
    return (
      <AppShell>
        <PageTransition className="min-h-screen flex items-center justify-center">
          <LoadingSpinner />
        </PageTransition>
      </AppShell>
    );
  }

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
