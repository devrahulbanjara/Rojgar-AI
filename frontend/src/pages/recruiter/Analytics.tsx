import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/common/StatCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, TrendingUp, Users, BriefcaseIcon, Target } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function Analytics() {
  // Mock data for charts
  const pipelineData = [
    { stage: 'Applied', count: 145, percentage: 100 },
    { stage: 'Screened', count: 98, percentage: 68 },
    { stage: 'Interview', count: 45, percentage: 31 },
    { stage: 'Offer', count: 12, percentage: 8 },
    { stage: 'Hired', count: 8, percentage: 6 }
  ];

  const jobStats = [
    { title: 'Senior Frontend Engineer', applications: 45, status: 'Open' },
    { title: 'Product Manager', applications: 32, status: 'Open' },
    { title: 'Data Scientist', applications: 28, status: 'Closed' },
    { title: 'Backend Developer', applications: 40, status: 'Open' }
  ];

  const sourceData = [
    { source: 'LinkedIn', count: 45, percentage: 35 },
    { source: 'Indeed', count: 38, percentage: 30 },
    { source: 'Company Website', count: 25, percentage: 20 },
    { source: 'Referrals', count: 19, percentage: 15 }
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Track your recruitment metrics and performance</p>
        </div>
        <Select defaultValue="30">
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        <StatCard
          title="Total Jobs Posted"
          value="12"
          change={20}
          icon={<BriefcaseIcon className="h-5 w-5 text-primary" />}
        />
        <StatCard
          title="Total Applications"
          value="145"
          change={15}
          icon={<Users className="h-5 w-5 text-primary" />}
        />
        <StatCard
          title="Avg. Time to Hire"
          value="24 days"
          change={-10}
          icon={<Target className="h-5 w-5 text-primary" />}
        />
        <StatCard
          title="Offer Acceptance"
          value="67%"
          change={5}
          icon={<TrendingUp className="h-5 w-5 text-primary" />}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Candidate Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pipelineData.map((stage) => (
                <div key={stage.stage} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{stage.stage}</span>
                    <span className="text-muted-foreground">{stage.count} candidates</span>
                  </div>
                  <Progress value={stage.percentage} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Application Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sourceData.map((source) => (
                <div key={source.source} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-primary" />
                    <span className="font-medium">{source.source}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">{source.count}</span>
                    <span className="text-sm font-medium">{source.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Jobs Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {jobStats.map((job, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">{job.title}</p>
                    <p className="text-sm text-muted-foreground">{job.applications} applications</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      job.status === 'Open' ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
                    }`}>
                      {job.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}