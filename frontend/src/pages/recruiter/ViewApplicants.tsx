import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { Calendar, CheckCircle, FileText, MessageCircle, Star, UserCheck, X } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function ViewApplicants() {
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewTime, setInterviewTime] = useState('');
  const [interviewType, setInterviewType] = useState('');

  // Mock applicants data
  const applicants = [
    {
      id: 1,
      name: 'John Doe',
      email: 'john.doe@example.com',
      jobTitle: 'Senior Frontend Engineer',
      matchScore: 85,
      keySkills: ['React', 'TypeScript', 'Node.js'],
      experience: 5,
      status: 'Applied',
      appliedDate: '2024-01-15',
      resumeUrl: '#',
      matchExplanation: [
        'Strong React and TypeScript experience',
        'Previous experience in similar role',
        'Good cultural fit based on assessment'
      ]
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      jobTitle: 'Senior Frontend Engineer',
      matchScore: 92,
      keySkills: ['React', 'Vue', 'JavaScript'],
      experience: 7,
      status: 'Shortlisted',
      appliedDate: '2024-01-14',
      resumeUrl: '#',
      matchExplanation: [
        'Extensive frontend framework experience',
        'Led multiple successful projects',
        'Strong problem-solving skills'
      ]
    },
    {
      id: 3,
      name: 'Alex Chen',
      email: 'alex.chen@example.com',
      jobTitle: 'Product Manager',
      matchScore: 78,
      keySkills: ['Product Strategy', 'Agile', 'Analytics'],
      experience: 4,
      status: 'Interview Scheduled',
      appliedDate: '2024-01-12',
      resumeUrl: '#',
      matchExplanation: [
        'Good product management background',
        'Experience with similar products',
        'Strong analytical skills'
      ]
    }
  ];

  const handleShortlist = (candidate: any) => {
    toast({
      title: "Candidate Shortlisted",
      description: `${candidate.name} has been added to the shortlist.`
    });
  };

  const handleScheduleInterview = () => {
    if (!interviewDate || !interviewTime || !interviewType) {
      toast({
        title: "Missing Information",
        description: "Please fill in all interview details.",
        variant: "destructive"
      });
      return;
    }
    toast({
      title: "Interview Scheduled",
      description: `Interview scheduled for ${selectedCandidate?.name} on ${interviewDate} at ${interviewTime}.`
    });
    setShowScheduleDialog(false);
    setInterviewDate('');
    setInterviewTime('');
    setInterviewType('');
  };

  const handleReject = () => {
    if (!feedback) {
      toast({
        title: "Feedback Required",
        description: "Please provide feedback for the candidate.",
        variant: "destructive"
      });
      return;
    }
    toast({
      title: "Candidate Rejected",
      description: `${selectedCandidate?.name} has been rejected with feedback.`
    });
    setShowRejectDialog(false);
    setFeedback('');
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Shortlisted':
        return 'default';
      case 'Interview Scheduled':
        return 'secondary';
      case 'Rejected':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">View Applicants</h1>
        <p className="text-muted-foreground">Review and manage candidate applications</p>
      </div>

      <Tabs defaultValue="applications" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="applications">Candidate Applications</TabsTrigger>
          <TabsTrigger value="scheduling">Interview Scheduling</TabsTrigger>
        </TabsList>

        <TabsContent value="applications">
          <Card>
            <CardHeader>
              <CardTitle>All Applications</CardTitle>
              <CardDescription>Review candidate applications and take action</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Candidate</TableHead>
                    <TableHead>Job</TableHead>
                    <TableHead>Match %</TableHead>
                    <TableHead>Skills</TableHead>
                    <TableHead>Experience</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applicants.map((candidate) => (
                    <TableRow key={candidate.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{candidate.name}</p>
                          <p className="text-sm text-muted-foreground">{candidate.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{candidate.jobTitle}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={candidate.matchScore} className="w-16" />
                          <span className="text-sm font-medium">{candidate.matchScore}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {candidate.keySkills.slice(0, 2).map((skill) => (
                            <Badge key={skill} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {candidate.keySkills.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{candidate.keySkills.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{candidate.experience} years</TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(candidate.status)}>
                          {candidate.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedCandidate(candidate);
                              setShowDetailsDialog(true);
                            }}
                          >
                            Details
                          </Button>
                          {candidate.status === 'Applied' && (
                            <Button
                              size="sm"
                              onClick={() => handleShortlist(candidate)}
                            >
                              <UserCheck className="h-4 w-4" />
                            </Button>
                          )}
                          {candidate.status === 'Shortlisted' && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedCandidate(candidate);
                                setShowScheduleDialog(true);
                              }}
                            >
                              <Calendar className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setSelectedCandidate(candidate);
                              setShowRejectDialog(true);
                            }}
                          >
                            <X className="h-4 w-4" />
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

        <TabsContent value="scheduling">
          <Card>
            <CardHeader>
              <CardTitle>Interview Scheduling</CardTitle>
              <CardDescription>Schedule and manage interviews with shortlisted candidates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {applicants
                  .filter(c => c.status === 'Shortlisted' || c.status === 'Interview Scheduled')
                  .map((candidate) => (
                    <Card key={candidate.id}>
                      <CardContent className="flex items-center justify-between p-4">
                        <div>
                          <p className="font-medium">{candidate.name}</p>
                          <p className="text-sm text-muted-foreground">{candidate.jobTitle}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span className="text-sm">{candidate.matchScore}% match</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => {
                              setSelectedCandidate(candidate);
                              setShowScheduleDialog(true);
                            }}
                          >
                            <Calendar className="h-4 w-4 mr-2" />
                            Schedule Interview
                          </Button>
                          <Button variant="outline">
                            <MessageCircle className="h-4 w-4 mr-2" />
                            Message
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedCandidate?.name}</DialogTitle>
            <DialogDescription>
              Applied for: {selectedCandidate?.jobTitle}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Match Score: {selectedCandidate?.matchScore}%</h3>
              <Progress value={selectedCandidate?.matchScore} className="mb-4" />
              <div className="space-y-2">
                <h4 className="font-medium">Why this score?</h4>
                <ul className="space-y-1">
                  {selectedCandidate?.matchExplanation?.map((reason: string, i: number) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-success mt-0.5" />
                      <span className="text-sm">{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Key Skills</h4>
              <div className="flex flex-wrap gap-2">
                {selectedCandidate?.keySkills?.map((skill: string) => (
                  <Badge key={skill} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1">
                <FileText className="h-4 w-4 mr-2" />
                View Resume
              </Button>
              <Button variant="outline" className="flex-1">
                <MessageCircle className="h-4 w-4 mr-2" />
                Message Candidate
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Schedule Interview Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Interview</DialogTitle>
            <DialogDescription>
              Schedule interview with {selectedCandidate?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="interview-type">Interview Type</Label>
              <Select value={interviewType} onValueChange={setInterviewType}>
                <SelectTrigger id="interview-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="interview-date">Date</Label>
                <Input
                  id="interview-date"
                  type="date"
                  value={interviewDate}
                  onChange={(e) => setInterviewDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="interview-time">Time</Label>
                <Input
                  id="interview-time"
                  type="time"
                  value={interviewTime}
                  onChange={(e) => setInterviewTime(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="interviewers">Interviewers</Label>
              <Input id="interviewers" placeholder="Enter interviewer names" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleScheduleInterview}>
              Schedule Interview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
            <DialogDescription>
              Provide feedback for {selectedCandidate?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="feedback">Feedback</Label>
              <Textarea
                id="feedback"
                placeholder="Provide constructive feedback for the candidate..."
                className="min-h-[100px]"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              Reject with Feedback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}