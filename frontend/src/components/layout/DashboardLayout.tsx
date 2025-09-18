/**
 * Dashboard Layout Component
 * Reusable layout for dashboard pages with React Query data fetching
 */

import type { UserType } from '../../types';
import { capitalize } from '../../utils/helpers';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { useDashboard } from '../../hooks/useDashboard';

interface DashboardLayoutProps {
  userType: UserType;
  className?: string;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  userType,
  className = '',
}) => {
  const { 
    dashboardData, 
    isLoading, 
    error, 
    hasStats, 
    hasActivity 
  } = useDashboard();

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${className}`}>
        <LoadingSpinner size="lg" message="Loading dashboard..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="text-center">
          <p className="text-red-600 mb-2">Error loading dashboard</p>
          <p className="text-sm text-muted-foreground">
            {error instanceof Error ? error.message : 'An unexpected error occurred'}
          </p>
        </div>
      </div>
    );
  }

  const message = `${capitalize(userType)} Dashboard Under Development`;
  
  return (
    <div className={`p-4 ${className}`}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{message}</h1>
        {dashboardData?.user && (
          <p className="text-muted-foreground">Welcome back, {dashboardData.user.name}!</p>
        )}
      </div>

      {/* Development Preview - Show fetched data */}
      {(hasStats || hasActivity) && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Stats Preview */}
          {hasStats && (
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-3">Dashboard Stats (Demo Data)</h3>
              <div className="space-y-2 text-sm">
                {Object.entries(dashboardData?.stats || {}).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                    <span className="font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Activity Preview */}
          {hasActivity && (
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-3">Recent Activity (Demo Data)</h3>
              <div className="space-y-2">
                {dashboardData?.recentActivity?.slice(0, 3).map((activity, index) => (
                  <div key={activity.id || index} className="text-sm p-2 bg-muted/50 rounded">
                    <p className="font-medium">{activity.type?.toUpperCase()}</p>
                    <p className="text-muted-foreground">{activity.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Development Notice */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          🚧 <strong>Development Mode:</strong> Dashboard data is fetched using React Query with mock data. 
          When the FastAPI backend is ready, simply update the API endpoints in the service layer.
        </p>
        <div className="mt-2 text-xs text-blue-600">
          <p>✅ React Query caching and error handling active</p>
          <p>✅ Loading states managed automatically</p>
          <p>✅ Ready for real API integration</p>
        </div>
      </div>
      
      {/* TODO: Add proper dashboard content when implementing features */}
      {/* 
      Future implementations:
      - User navigation/header
      - Sidebar with menu items
      - Statistics cards with charts
      - Quick actions
      - Real-time updates
      - Data tables with pagination
      */}
    </div>
  );
};
