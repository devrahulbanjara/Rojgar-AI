/**
 * Dashboard and analytics related types
 */

export interface Activity {
  id: string;
  type: 'application' | 'interview' | 'offer' | 'hire' | 'rejection';
  message: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface DashboardStats {
  recruiter: {
    openRoles: number;
    activeApplicants: number;
    interviewsThisWeek: number;
    recentActivity: Activity[];
  };
  candidate: {
    applications: number;
    interviews: number;
    offers: number;
    resumeScore: number;
    tips: string[];
  };
}
