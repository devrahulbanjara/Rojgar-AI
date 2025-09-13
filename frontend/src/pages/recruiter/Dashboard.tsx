import React from 'react';
import { StatCard } from '@/components/common/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BriefcaseIcon, Users, Calendar, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { timeAgo } from '@/lib/utils';
import { Link } from 'react-router-dom';

export default function RecruiterDashboard() {
  const recentActivity = [
    { id: 1, type: 'application', message: 'John Doe applied for Senior Frontend Engineer', timestamp: new Date(Date.now() - 3600000), icon: Users },
    { id: 2, type: 'interview', message: 'Interview scheduled with Jane Smith', timestamp: new Date(Date.now() - 7200000), icon: Calendar },
    { id: 3, type: 'offer', message: 'Offer extended to Alex Chen for Data Scientist', timestamp: new Date(Date.now() - 86400000), icon: Users },
    { id: 4, type: 'rejection', message: 'Feedback sent to Mike Brown for Backend Engineer', timestamp: new Date(Date.now() - 172800000), icon: Users },
    { id: 5, type: 'shortlist', message: '5 candidates shortlisted for Product Manager', timestamp: new Date(Date.now() - 259200000), icon: Users }
  ];

  const upcomingInterviews = [
    { id: 1, candidate: 'Sarah Johnson', role: 'Senior Frontend Engineer', time: '2:00 PM Today', location: 'Office - Room A' },
    { id: 2, candidate: 'Michael Chen', role: 'Data Scientist', time: '10:00 AM Tomorrow', location: 'Office - Room B' },
    { id: 3, candidate: 'Emily Davis', role: 'Product Manager', time: '3:30 PM Tomorrow', location: 'Office - Main Conference' },
    { id: 4, candidate: 'Alex Thompson', role: 'Backend Engineer', time: '11:00 AM Friday', location: 'Office - Room A' }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Simplified overview of your recruitment activities</p>
      </div>

      {/* Key Metrics - Simplified */}
      <div className="grid md:grid-cols-3 gap-6">
        <Link to="/recruiter/jobs">
          <StatCard title="Active Jobs" value="8" change={12} icon={<BriefcaseIcon className="h-5 w-5 text-primary" />} />
        </Link>
        <StatCard title="Total Applicants" value="245" change={8} icon={<Users className="h-5 w-5 text-primary" />} />
        <Link to="/recruiter/interviews">
          <StatCard title="Upcoming Interviews" value="4" change={-5} icon={<Calendar className="h-5 w-5 text-primary" />} />
        </Link>
      </div>

      {/* Upcoming Interviews List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Upcoming Interviews
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {upcomingInterviews.map((interview) => (
              <motion.div 
                key={interview.id} 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
              >
                <div>
                  <p className="font-medium text-sm">{interview.candidate}</p>
                  <p className="text-xs text-muted-foreground">{interview.role}</p>
                  <p className="text-xs text-muted-foreground mt-1">{interview.location}</p>
                </div>
                <Badge variant="outline">{interview.time}</Badge>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activities Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Recent Activities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <motion.div key={activity.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <activity.icon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm">{activity.message}</p>
                  <p className="text-xs text-muted-foreground">{timeAgo(activity.timestamp)}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}