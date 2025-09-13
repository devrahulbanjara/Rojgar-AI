import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { 
  Clock, 
  Users, 
  ThumbsUp, 
  ThumbsDown, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Brain,
  ChevronRight,
  Mail,
  Target
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Candidate {
  id: string;
  name: string;
  email: string;
  score: number;
  pros: string[];
  cons: string[];
  skills: string[];
  experience: number;
  currentRole: string;
  status: 'pending' | 'shortlisted' | 'rejected';
}

interface JobWithCandidates {
  id: string;
  title: string;
  expiryDate: string;
  expired: boolean;
  daysLeft: number;
  candidates: Candidate[];
  threshold: number;
}

export default function Shortlist() {
  const [selectedJob, setSelectedJob] = useState<string>('2');
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [customFeedback, setCustomFeedback] = useState('');

  const [jobs, setJobs] = useState<JobWithCandidates[]>([
    {
      id: '1',
      title: 'Senior Frontend Engineer',
      expiryDate: '2024-01-20',
      expired: false,
      daysLeft: 2,
      candidates: [],
      threshold: 70
    },
    {
      id: '2',
      title: 'Product Manager',
      expiryDate: '2024-01-15',
      expired: true,
      daysLeft: 0,
      threshold: 75,
      candidates: [
        {
          id: 'c1',
          name: 'Alex Thompson',
          email: 'alex.thompson@email.com',
          score: 92,
          pros: ['10+ years product experience', 'Strong technical background', 'Led teams of 20+'],
          cons: ['Limited B2B SaaS experience', 'No marketplace background'],
          skills: ['Product Strategy', 'Agile', 'SQL', 'Figma'],
          experience: 10,
          currentRole: 'Senior Product Manager at TechCorp',
          status: 'pending'
        },
        {
          id: 'c2',
          name: 'Sarah Johnson',
          email: 'sarah.j@email.com',
          score: 75,
          pros: ['Strong UX background', 'Data-driven approach', 'Startup experience'],
          cons: ['Less than 5 years PM experience', 'No team management experience'],
          skills: ['User Research', 'A/B Testing', 'Jira', 'Analytics'],
          experience: 4,
          currentRole: 'Product Manager at StartupXYZ',
          status: 'pending'
        },
        {
          id: 'c3',
          name: 'Michael Chen',
          email: 'mchen@email.com',
          score: 65,
          pros: ['MBA from top school', 'Strong analytical skills', 'Finance background'],
          cons: ['No direct PM experience', 'Limited technical knowledge', 'No B2C experience'],
          skills: ['Business Analysis', 'Excel', 'PowerBI', 'Strategy'],
          experience: 6,
          currentRole: 'Business Analyst at FinanceInc',
          status: 'pending'
        }
      ]
    },
    {
      id: '3',
      title: 'DevOps Engineer',
      expiryDate: '2024-01-10',
      expired: true,
      daysLeft: 0,
      threshold: 80,
      candidates: [
        {
          id: 'c4',
          name: 'David Kim',
          email: 'dkim@email.com',
          score: 88,
          pros: ['AWS certified', 'Kubernetes expert', 'CI/CD pipeline experience'],
          cons: ['Limited Azure experience', 'No team lead experience'],
          skills: ['AWS', 'Docker', 'Kubernetes', 'Terraform'],
          experience: 7,
          currentRole: 'Senior DevOps at CloudCo',
          status: 'pending'
        }
      ]
    }
  ]);

  const runShortlistingAlgorithm = (jobId: string) => {
    toast({
      title: "Running AI Shortlisting",
      description: "Analyzing CVs against job description...",
    });
    
    // Simulate processing
    setTimeout(() => {
      toast({
        title: "Shortlisting Complete",
        description: `Candidates have been scored and ranked based on JD compatibility.`,
      });
    }, 1500);
  };

  const handleShortlist = (candidateId: string, jobId: string) => {
    setJobs(jobs.map(job => {
      if (job.id === jobId) {
        return {
          ...job,
          candidates: job.candidates.map(c => 
            c.id === candidateId ? { ...c, status: 'shortlisted' } : c
          )
        };
      }
      return job;
    }));
    
    const job = jobs.find(j => j.id === jobId);
    const candidate = job?.candidates.find(c => c.id === candidateId);
    
    toast({
      title: "Candidate Shortlisted",
      description: `${candidate?.name} has been added to the interview pipeline.`,
    });
  };

  const handleBulkShortlist = (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;
    
    let shortlistedCount = 0;
    setJobs(jobs.map(j => {
      if (j.id === jobId) {
        return {
          ...j,
          candidates: j.candidates.map(c => {
            if (c.score >= job.threshold && c.status === 'pending') {
              shortlistedCount++;
              return { ...c, status: 'shortlisted' };
            }
            return c;
          })
        };
      }
      return j;
    }));
    
    toast({
      title: "Bulk Shortlist Complete",
      description: `${shortlistedCount} candidates above ${job.threshold}% have been shortlisted.`,
    });
  };

  const handleReject = () => {
    if (selectedCandidate) {
      selectedCandidate.status = 'rejected';
      toast({
        title: "Candidate Rejected",
        description: `Feedback email sent to ${selectedCandidate.email}`,
      });
      setRejectDialogOpen(false);
      setCustomFeedback('');
    }
  };

  const getScoreColor = (score: number, threshold: number) => {
    if (score >= threshold) return 'text-green-600 dark:text-green-400';
    if (score >= threshold - 10) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const updateJobThreshold = (jobId: string, newThreshold: number) => {
    setJobs(jobs.map(job => 
      job.id === jobId ? { ...job, threshold: newThreshold } : job
    ));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'shortlisted':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">Shortlisted</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Pending Review</Badge>;
    }
  };

  const currentJob = jobs.find(j => j.id === selectedJob);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Candidate Shortlisting</h1>
        <p className="text-muted-foreground">Review and shortlist candidates per job after expiry</p>
      </div>

      {/* Job Tabs */}
      <Tabs value={selectedJob} onValueChange={setSelectedJob}>
        <TabsList>
          {jobs.map((job) => (
            <TabsTrigger key={job.id} value={job.id} className="relative">
              {job.title}
              {job.expired && (
                <Badge variant="destructive" className="ml-2 text-xs">
                  Ready
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {jobs.map((job) => (
          <TabsContent key={job.id} value={job.id}>
            <Card>
              <CardHeader>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{job.title}</CardTitle>
                      <CardDescription>
                        {job.expired ? (
                          <span className="flex items-center gap-1 text-destructive">
                            <AlertCircle className="h-4 w-4" />
                            Job expired on {job.expiryDate} - Ready for shortlisting
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {job.daysLeft} days until expiry
                          </span>
                        )}
                      </CardDescription>
                    </div>
                    {job.expired && job.candidates.length === 0 && (
                      <Button onClick={() => runShortlistingAlgorithm(job.id)}>
                        <Brain className="h-4 w-4 mr-2" />
                        Run Shortlisting Algorithm
                      </Button>
                    )}
                  </div>
                  
                  {/* Per-job threshold setting */}
                  {job.expired && job.candidates.length > 0 && (
                    <div className="flex items-center gap-4 p-3 bg-secondary/50 rounded-lg">
                      <Label htmlFor={`threshold-${job.id}`}>Job Threshold:</Label>
                      <Input
                        id={`threshold-${job.id}`}
                        type="number"
                        value={job.threshold}
                        onChange={(e) => updateJobThreshold(job.id, parseInt(e.target.value))}
                        className="w-24"
                        min="0"
                        max="100"
                      />
                      <span className="text-muted-foreground">%</span>
                      <Badge variant="outline">
                        Highlighting {job.threshold}%+ matches
                      </Badge>
                      <Button 
                        className="ml-auto"
                        onClick={() => handleBulkShortlist(job.id)}
                        variant="secondary"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Shortlist All Above Threshold
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              
              {job.candidates.length > 0 ? (
                <CardContent className="space-y-4">
                  {job.candidates.map((candidate) => (
                    <Card 
                      key={candidate.id} 
                      className={cn(
                        "border-l-4",
                        candidate.score >= job.threshold ? "border-l-green-500" : "border-l-muted"
                      )}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <Avatar className="h-12 w-12">
                              <AvatarFallback>
                                {candidate.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="space-y-3 flex-1">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold">{candidate.name}</h4>
                                  {getStatusBadge(candidate.status)}
                                </div>
                                <p className="text-sm text-muted-foreground">{candidate.currentRole}</p>
                                <p className="text-xs text-muted-foreground">{candidate.email}</p>
                              </div>
                              
                              <div className="flex items-center gap-6">
                                <div className={cn("flex items-center gap-1", getScoreColor(candidate.score, job.threshold))}>
                                  <Target className="h-4 w-4" />
                                  <span className="font-bold">{candidate.score}%</span>
                                  <span className="text-sm text-muted-foreground">match</span>
                                </div>
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <Clock className="h-4 w-4" />
                                  <span className="text-sm">{candidate.experience} years exp</span>
                                </div>
                              </div>

                              <div className="flex gap-2 flex-wrap">
                                {candidate.skills.map((skill) => (
                                  <Badge key={skill} variant="secondary">
                                    {skill}
                                  </Badge>
                                ))}
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <div className="flex items-center gap-1 text-green-600 dark:text-green-400 mb-1">
                                    <ThumbsUp className="h-4 w-4" />
                                    <span className="text-sm font-medium">Strengths</span>
                                  </div>
                                  <ul className="text-sm space-y-1">
                                    {candidate.pros.map((pro, i) => (
                                      <li key={i} className="flex items-start gap-1">
                                        <CheckCircle className="h-3 w-3 mt-0.5 text-green-600 dark:text-green-400" />
                                        <span>{pro}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                                <div>
                                  <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400 mb-1">
                                    <ThumbsDown className="h-4 w-4" />
                                    <span className="text-sm font-medium">Gaps</span>
                                  </div>
                                  <ul className="text-sm space-y-1">
                                    {candidate.cons.map((con, i) => (
                                      <li key={i} className="flex items-start gap-1">
                                        <XCircle className="h-3 w-3 mt-0.5 text-orange-600 dark:text-orange-400" />
                                        <span>{con}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {candidate.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                onClick={() => handleShortlist(candidate.id, job.id)}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Shortlist
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => {
                                  setSelectedCandidate(candidate);
                                  setRejectDialogOpen(true);
                                }}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              ) : (
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    {job.expired ? 
                      "Click 'Run Shortlisting Algorithm' to analyze candidates" : 
                      `This job will be ready for shortlisting in ${job.daysLeft} days`
                    }
                  </div>
                </CardContent>
              )}
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Candidate</DialogTitle>
            <DialogDescription>
              Provide constructive feedback for {selectedCandidate?.name}. This will be sent via email.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Pre-filled Feedback Template</Label>
              <div className="mt-2 p-3 bg-muted rounded-lg text-sm">
                <p className="font-medium mb-2">Dear {selectedCandidate?.name},</p>
                <p className="mb-2">Thank you for applying for the {currentJob?.title} position. After careful review, we have decided to move forward with other candidates whose experience more closely matches our current needs.</p>
                <p className="mb-2">We were impressed by your {selectedCandidate?.pros[0]?.toLowerCase()}, but we were looking for someone with more experience in:</p>
                <ul className="list-disc list-inside mb-2">
                  {selectedCandidate?.cons.map((con, i) => (
                    <li key={i}>{con}</li>
                  ))}
                </ul>
                <p>We encourage you to apply for future positions that may be a better fit.</p>
              </div>
            </div>
            
            <div>
              <Label htmlFor="feedback">Additional Personalized Feedback (Optional)</Label>
              <Textarea
                id="feedback"
                value={customFeedback}
                onChange={(e) => setCustomFeedback(e.target.value)}
                placeholder="Add any specific feedback or encouragement..."
                className="mt-2"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleReject}>
              <Mail className="h-4 w-4 mr-2" />
              Send Rejection Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}