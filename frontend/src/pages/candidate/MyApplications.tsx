import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, CheckCircle, Clock, FileText, MessageCircle, XCircle, ArrowRight, ThumbsUp, ThumbsDown, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

export default function MyApplications() {
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);

  const applications = [
    {
      id: 1,
      jobTitle: 'Senior Frontend Engineer',
      company: 'TechCorp Solutions',
      status: 'Interview Scheduled',
      timeline: {
        applied: { date: '2024-01-10', complete: true },
        inReview: { date: '2024-01-11', complete: true },
        shortlisted: { date: '2024-01-14', complete: true },
        interview: { date: '2024-01-20', complete: false },
        decision: { date: null, complete: false }
      },
      interviewDate: '2024-01-20',
      interviewTime: '2:00 PM',
      interviewType: 'Online',
      recruiterName: 'Sarah Chen',
      recruiterNote: 'Looking forward to discussing your React experience',
      feedback: null
    },
    {
      id: 2,
      jobTitle: 'Full Stack Developer',
      company: 'StartupXYZ',
      status: 'In Review',
      timeline: {
        applied: { date: '2024-01-12', complete: true },
        inReview: { date: '2024-01-13', complete: true },
        shortlisted: { date: null, complete: false },
        interview: { date: null, complete: false },
        decision: { date: null, complete: false }
      },
      feedback: null
    },
    {
      id: 3,
      jobTitle: 'Product Manager',
      company: 'InnovateTech',
      status: 'Rejected',
      timeline: {
        applied: { date: '2024-01-05', complete: true },
        inReview: { date: '2024-01-06', complete: true },
        shortlisted: { date: null, complete: false },
        interview: { date: null, complete: false },
        decision: { date: '2024-01-14', complete: true }
      },
      feedback: {
        liked: ['Strong technical background', 'Excellent communication skills', 'Good cultural fit'],
        lookingFor: ['5+ years of direct product management experience', 'Experience with B2B SaaS products', 'Track record of launching products'],
        nextSteps: 'We encourage you to gain more product management experience and apply for our Associate PM roles in the future.'
      }
    },
    {
      id: 4,
      jobTitle: 'DevOps Engineer',
      company: 'CloudCo',
      status: 'Shortlisted',
      timeline: {
        applied: { date: '2024-01-08', complete: true },
        inReview: { date: '2024-01-09', complete: true },
        shortlisted: { date: '2024-01-15', complete: true },
        interview: { date: null, complete: false },
        decision: { date: null, complete: false }
      },
      feedback: null
    }
  ];

  const upcomingInterviews = applications.filter(app => app.status === 'Interview Scheduled');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Interview Scheduled':
        return <Calendar className="h-4 w-4" />;
      case 'Applied':
        return <FileText className="h-4 w-4" />;
      case 'In Review':
        return <Clock className="h-4 w-4" />;
      case 'Shortlisted':
        return <CheckCircle className="h-4 w-4" />;
      case 'Rejected':
        return <XCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusVariant = (status: string): any => {
    switch (status) {
      case 'Interview Scheduled':
        return 'default';
      case 'Shortlisted':
        return 'secondary';
      case 'Rejected':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const handleWithdraw = (application: any) => {
    toast({
      title: "Application Withdrawn",
      description: `Your application for ${application.jobTitle} has been withdrawn.`
    });
  };

  const handleReschedule = () => {
    toast({
      title: "Reschedule Request Sent",
      description: "The recruiter will contact you with new interview options."
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">My Applications</h1>
        <p className="text-muted-foreground">Track your job applications and interviews</p>
      </div>

      <Tabs defaultValue="applications" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="interviews">Interview Schedule</TabsTrigger>
        </TabsList>

        <TabsContent value="applications">
          <Card>
            <CardHeader>
              <CardTitle>All Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job Title</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Applied Date</TableHead>
                    <TableHead>Last Update</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell className="font-medium">{app.jobTitle}</TableCell>
                      <TableCell>{app.company}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(app.status)} className="flex items-center gap-1 w-fit">
                          {getStatusIcon(app.status)}
                          {app.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{app.timeline?.applied?.date || '-'}</TableCell>
                      <TableCell>{
                        app.timeline?.decision?.date || 
                        app.timeline?.interview?.date || 
                        app.timeline?.shortlisted?.date || 
                        app.timeline?.inReview?.date || 
                        app.timeline?.applied?.date || '-'
                      }</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {app.status !== 'Rejected' && (
                            <Button size="sm" variant="outline" onClick={() => handleWithdraw(app)}>
                              Withdraw
                            </Button>
                          )}
                          {app.feedback && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedApplication(app);
                                setShowFeedbackDialog(true);
                              }}
                            >
                              View Feedback
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedApplication(app);
                              setShowFeedbackDialog(true);
                            }}
                          >
                            View Timeline
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interviews">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Interviews</CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingInterviews.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No upcoming interviews scheduled</p>
              ) : (
                <div className="space-y-4">
                  {upcomingInterviews.map((interview) => (
                    <Card key={interview.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold">{interview.jobTitle}</p>
                            <p className="text-sm text-muted-foreground">{interview.company}</p>
                            <div className="mt-3 space-y-2">
                              <div className="flex items-center gap-2 text-sm">
                                <Calendar className="h-4 w-4" />
                                {interview.interviewDate}
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Clock className="h-4 w-4" />
                                {interview.interviewTime}
                              </div>
                              <Badge variant="secondary">{interview.interviewType}</Badge>
                              {interview.recruiterName && (
                                <div className="mt-2 p-2 bg-muted rounded text-sm">
                                  <p className="font-medium">Interviewer: {interview.recruiterName}</p>
                                  {interview.recruiterNote && (
                                    <p className="text-muted-foreground mt-1">"{interview.recruiterNote}"</p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            {interview.interviewType === 'Online' && (
                              <Button size="sm">Join Interview</Button>
                            )}
                            <Button size="sm" variant="outline" onClick={handleReschedule}>
                              Request Reschedule
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Feedback/Timeline Dialog */}
      <Dialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedApplication?.status === 'Rejected' ? 'Application Feedback' : 'Application Status'}
            </DialogTitle>
            <DialogDescription>
              {selectedApplication?.jobTitle} at {selectedApplication?.company}
            </DialogDescription>
          </DialogHeader>
          
          {selectedApplication?.status === 'Rejected' && selectedApplication?.feedback ? (
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2 text-green-600 dark:text-green-400">
                  <ThumbsUp className="h-4 w-4" />
                  <h4 className="font-medium">What We Liked</h4>
                </div>
                <ul className="space-y-1">
                  {selectedApplication.feedback.liked?.map((item: string, i: number) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5" />
                      <span className="text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <div className="flex items-center gap-2 mb-2 text-orange-600 dark:text-orange-400">
                  <AlertCircle className="h-4 w-4" />
                  <h4 className="font-medium">What We Were Looking For</h4>
                </div>
                <ul className="space-y-1">
                  {selectedApplication.feedback.lookingFor?.map((item: string, i: number) => (
                    <li key={i} className="flex items-start gap-2">
                      <XCircle className="h-4 w-4 text-orange-600 dark:text-orange-400 mt-0.5" />
                      <span className="text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Next Steps</h4>
                <p className="text-sm text-muted-foreground">{selectedApplication.feedback.nextSteps}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Timeline View */}
              <div className="relative">
                {['applied', 'inReview', 'shortlisted', 'interview', 'decision'].map((stage, index) => {
                  const stageData = selectedApplication?.timeline?.[stage];
                  const isComplete = stageData?.complete;
                  const isActive = !isComplete && index > 0 && selectedApplication?.timeline?.[['applied', 'inReview', 'shortlisted', 'interview', 'decision'][index - 1]]?.complete;
                  
                  return (
                    <div key={stage} className="flex items-center mb-6 last:mb-0">
                      <div className="flex items-center justify-center mr-4">
                        <div className={`
                          h-10 w-10 rounded-full flex items-center justify-center
                          ${isComplete ? 'bg-primary text-primary-foreground' : 
                            isActive ? 'bg-primary/20 text-primary animate-pulse' : 
                            'bg-muted text-muted-foreground'}
                        `}>
                          {isComplete ? <CheckCircle className="h-5 w-5" /> : 
                           isActive ? <Clock className="h-5 w-5" /> : 
                           <div className="h-2 w-2 bg-current rounded-full" />}
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className={`font-medium ${isComplete || isActive ? '' : 'text-muted-foreground'}`}>
                          {stage === 'applied' && 'Application Sent'}
                          {stage === 'inReview' && 'In Review'}
                          {stage === 'shortlisted' && 'Shortlisted'}
                          {stage === 'interview' && 'Interview'}
                          {stage === 'decision' && 'Final Decision'}
                        </p>
                        {stageData?.date && (
                          <p className="text-sm text-muted-foreground">{stageData.date}</p>
                        )}
                      </div>
                      {index < 4 && (
                        <div className={`
                          absolute left-5 ml-0 w-0.5 h-6 translate-y-8
                          ${isComplete ? 'bg-primary' : 'bg-muted'}
                        `} />
                      )}
                    </div>
                  );
                })}
              </div>
              
              {selectedApplication?.status === 'Interview Scheduled' && (
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-4">
                    <p className="font-medium mb-2">Upcoming Interview</p>
                    <div className="space-y-1 text-sm">
                      <p>Date: {selectedApplication.interviewDate}</p>
                      <p>Time: {selectedApplication.interviewTime}</p>
                      <p>Type: {selectedApplication.interviewType}</p>
                      {selectedApplication.recruiterName && (
                        <p>Interviewer: {selectedApplication.recruiterName}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}