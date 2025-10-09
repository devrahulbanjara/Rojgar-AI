'use client';

export const dynamic = 'force-dynamic';

import { ApplicationTrackingBoard } from '../../../components/application-tracking/ApplicationTrackingBoard';
import { WelcomeMessage, StatsGrid } from '../../../components/dashboard';
import { SectionHeader, PageTransition, AnimatedContainer } from '../../../components/common';
import { AppShell } from '../../../components/layout/AppShell';
import { useDashboardStats } from '../../../hooks/useDashboardStats';
import { useApplicationTrackingBoard } from '../../../hooks/useApplicationTrackingBoard';
import { useAuth } from '../../../hooks/useAuth';

export default function CandidateDashboard() {
  const { user } = useAuth();
  const { data: stats } = useDashboardStats();
  const { 
    applicationTrackingData, 
    isLoading: applicationTrackingLoading, 
    error: applicationTrackingError,
    refetch: refetchApplications 
  } = useApplicationTrackingBoard();

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

          {/* Stats Grid */}
          <AnimatedContainer direction="up" delay={0.2}>
            <StatsGrid 
              stats={stats || {}} 
              userType="candidate" 
            />
          </AnimatedContainer>

          {/* Application Tracking Section */}
          <AnimatedContainer direction="up" delay={0.3}>
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl max-lg:text-2xl font-semibold text-[#0F172A] mb-2">
                  Your Applications
                </h2>
                <p className="text-base text-[#475569]">
                  Track your job application journey
                </p>
              </div>
              
              <ApplicationTrackingBoard 
                applications={applicationTrackingData} 
                isLoading={applicationTrackingLoading}
                error={applicationTrackingError}
                onRetry={refetchApplications}
              />
            </div>
          </AnimatedContainer>
        </div>
      </PageTransition>
    </AppShell>
  );
}
