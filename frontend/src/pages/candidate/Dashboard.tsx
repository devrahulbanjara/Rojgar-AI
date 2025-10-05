import { ApplicationTrackingBoard } from '../../components/application-tracking/ApplicationTrackingBoard';
import { WelcomeMessage, StatsGrid } from '../../components/dashboard';
import { SectionHeader } from '../../components/common';
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
    <div className="space-y-8">
      {/* Welcome Message */}
      <WelcomeMessage firstName={firstName} />

      {/* Stats Grid */}
      <StatsGrid 
        stats={stats || {}} 
        userType="candidate" 
      />

      {/* Application Tracking Section */}
      <div className="space-y-6">
        <SectionHeader
          title="Your Applications"
          subtitle="Track your job application journey"
        />
        
        <ApplicationTrackingBoard 
          applications={applicationTrackingData} 
          isLoading={applicationTrackingLoading} 
        />
      </div>
    </div>
  );
}