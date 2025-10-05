import { DashboardHeader, StatsGrid } from '../../components/dashboard';
import { useDashboardStats } from '../../hooks/useDashboardStats';
import { BriefcaseIcon } from 'lucide-react';

export default function RecruiterDashboard() {
  const { data: stats } = useDashboardStats();

  return (
    <div className="space-y-8">
      {/* Header */}
      <DashboardHeader
        title="Recruiter Dashboard"
        subtitle="Manage your recruitment pipeline and find the best candidates"
      />

      {/* Stats Grid */}
      <StatsGrid 
        stats={stats || {}} 
        userType="recruiter" 
      />

      {/* Recent Activity Section */}
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
    </div>
  );
}