import React from 'react';
import { StatCard } from '@/components/common/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, FileText, Calendar, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CandidateDashboard() {
  const tips = [
    'Add more skills to improve your match score',
    'Complete your profile for better visibility',
    'Upload an updated resume',
    'Set your job preferences'
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Welcome back, John!</h1>
        <p className="text-muted-foreground">Track your applications and improve your profile.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <StatCard title="Applications" value="3" icon={<FileText className="h-5 w-5 text-primary" />} />
        <StatCard title="Interviews" value="1" icon={<Calendar className="h-5 w-5 text-primary" />} />
        <StatCard title="Offers" value="0" icon={<Trophy className="h-5 w-5 text-primary" />} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resume Quality Score</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Profile Strength</span>
              <span className="text-sm text-muted-foreground">75%</span>
            </div>
            <Progress value={75} className="h-2" />
          </div>
          <div className="space-y-2">
            {tips.map((tip, i) => (
              <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.1 }} className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" />
                <span className="text-sm">{tip}</span>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}