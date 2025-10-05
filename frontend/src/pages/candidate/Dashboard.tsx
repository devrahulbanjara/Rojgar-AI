import { ApplicationTrackingBoard } from '../../components/application-tracking/ApplicationTrackingBoard';
import { WelcomeMessage, StatsGrid } from '../../components/dashboard';
import { SectionHeader, PageTransition } from '../../components/common';
import { useDashboardStats } from '../../hooks/useDashboardStats';
import { useApplicationTrackingBoard } from '../../hooks/useApplicationTrackingBoard';
import { useAuth } from '../../hooks/useAuth';

export default function CandidateDashboard() {
  const { user } = useAuth();
  const { data: stats } = useDashboardStats();
  const { applicationTrackingData, isLoading: applicationTrackingLoading } = useApplicationTrackingBoard();

  // Get first name from user's full name
  const firstName = user?.name?.split(' ')[0];

  return (
    <PageTransition className="space-y-8">
      {/* Welcome Message */}
      <div className="animate-fade-in-up">
        <WelcomeMessage firstName={firstName} />
      </div>

      {/* Stats Grid */}
      <div className="animate-fade-in-up stagger-1">
        <StatsGrid 
          stats={stats || {}} 
          userType="candidate" 
        />
      </div>

      {/* Application Tracking Section */}
      <div className="space-y-6 animate-fade-in-up stagger-2">
        <SectionHeader
          title="Your Applications"
          subtitle="Track your job application journey"
        />
        
        <ApplicationTrackingBoard 
          applications={applicationTrackingData} 
          isLoading={applicationTrackingLoading} 
        />
      </div>
    </PageTransition>
  );
}