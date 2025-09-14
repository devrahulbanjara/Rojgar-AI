import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import { 
  User, Mail, Phone, MapPin, Briefcase, GraduationCap, Star, 
  CheckCircle, XCircle, AlertCircle, MessageSquare, Calendar,
  ChevronRight, FileText, Award
} from 'lucide-react';

interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  score: number;
  skills: string[];
  experience: string;
  education: string;
  location: string;
  stage: 'New Applicants' | 'AI Screening' | 'Shortlisted' | 'Interviewing' | 'Offer' | 'Hired' | 'Rejected';
  appliedDate: string;
  resume?: string;
}

export default function Candidates() {
  const [selectedJob, setSelectedJob] = useState('senior-frontend');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [comment, setComment] = useState('');

  const jobs = [
    { id: 'senior-frontend', title: 'Senior Frontend Engineer', applicants: 23 },
    { id: 'product-manager', title: 'Product Manager', applicants: 45 },
    { id: 'data-scientist', title: 'Data Scientist', applicants: 12 },
  ];

  const [candidates] = useState<Candidate[]>([
    {
      id: '1',
      name: 'Subham Joshi',
      email: 'alex.thompson@email.com',
      phone: '+1 (555) 123-4567',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
      score: 92,
      skills: ['React', 'TypeScript', 'GraphQL', 'Node.js'],
      experience: '7 years',
      education: 'BS Computer Science, Stanford',
      location: 'San Francisco, CA',
      stage: 'Shortlisted',
      appliedDate: '2024-01-12',
    },
    {
      id: '2',
      name: 'Sandeep Sharma',
      email: 'sarah.chen@email.com',
      phone: '+1 (555) 234-5678',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
      score: 88,
      skills: ['React', 'Vue', 'JavaScript', 'CSS'],
      experience: '5 years',
      education: 'MS Software Engineering, MIT',
      location: 'Remote',
      stage: 'AI Screening',
      appliedDate: '2024-01-14',
    },
    {
      id: '3',
      name: 'Michael Davis',
      email: 'michael.davis@email.com',
      phone: '+1 (555) 345-6789',
      score: 75,
      skills: ['Angular', 'TypeScript', 'RxJS'],
      experience: '4 years',
      education: 'BS Information Systems',
      location: 'Austin, TX',
      stage: 'New Applicants',
      appliedDate: '2024-01-15',
    },
    {
      id: '4',
      name: 'Emily Johnson',
      email: 'emily.j@email.com',
      phone: '+1 (555) 456-7890',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily',
      score: 95,
      skills: ['React', 'TypeScript', 'GraphQL', 'AWS'],
      experience: '8 years',
      education: 'MS Computer Science, CMU',
      location: 'Seattle, WA',
      stage: 'Interviewing',
      appliedDate: '2024-01-10',
    },
    {
      id: '5',
      name: 'James Wilson',
      email: 'j.wilson@email.com',
      phone: '+1 (555) 567-8901',
      score: 82,
      skills: ['React', 'Next.js', 'Node.js'],
      experience: '6 years',
      education: 'BS Computer Engineering',
      location: 'New York, NY',
      stage: 'Offer',
      appliedDate: '2024-01-08',
    },
  ]);

  const stages = ['New Applicants', 'AI Screening', 'Shortlisted', 'Interviewing', 'Offer', 'Hired', 'Rejected'];

  const getCandidatesByStage = (stage: string) => {
    return candidates.filter(c => c.stage === stage);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const moveCandidate = (candidateId: string, newStage: string) => {
    toast({
      title: "Candidate Moved",
      description: `Candidate has been moved to ${newStage}`
    });
  };

  const addComment = () => {
    if (comment.trim()) {
      toast({
        title: "Comment Added",
        description: "Your comment has been saved to the candidate's profile"
      });
      setComment('');
    }
  };

  const CandidateCard = ({ candidate }: { candidate: Candidate }) => (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => setSelectedCandidate(candidate)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={candidate.avatar} />
            <AvatarFallback>{candidate.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{candidate.name}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-sm font-bold ${getScoreColor(candidate.score)}`}>
                {candidate.score}%
              </span>
              <Badge variant="secondary" className="text-xs">
                {candidate.experience}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {candidate.skills.slice(0, 3).map((skill) => (
                <Badge key={skill} variant="outline" className="text-xs">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Candidates</h1>
        <p className="text-muted-foreground">Evaluate and manage candidate applications</p>
      </div>

      {/* Job Selector */}
      <div className="flex items-center gap-4">
        <Label htmlFor="job-select">Select Job:</Label>
        <Select value={selectedJob} onValueChange={setSelectedJob}>
          <SelectTrigger id="job-select" className="w-[300px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {jobs.map((job) => (
              <SelectItem key={job.id} value={job.id}>
                {job.title} ({job.applicants} applicants)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="kanban" className="space-y-4">
        <TabsList>
          <TabsTrigger value="kanban">Kanban View</TabsTrigger>
          <TabsTrigger value="table">Table View</TabsTrigger>
        </TabsList>

        <TabsContent value="kanban">
          <div className="flex gap-4 overflow-x-auto pb-4">
            {stages.map((stage) => (
              <div key={stage} className="flex-shrink-0 w-80">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">{stage}</CardTitle>
                      <Badge variant="secondary">{getCandidatesByStage(stage).length}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {getCandidatesByStage(stage).map((candidate) => (
                      <CandidateCard key={candidate.id} candidate={candidate} />
                    ))}
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="table">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Candidate</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Skills</TableHead>
                    <TableHead>Experience</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Applied</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {candidates.map((candidate) => (
                    <TableRow key={candidate.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={candidate.avatar} />
                            <AvatarFallback>{candidate.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{candidate.name}</p>
                            <p className="text-xs text-muted-foreground">{candidate.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`font-bold ${getScoreColor(candidate.score)}`}>
                          {candidate.score}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {candidate.skills.slice(0, 2).map((skill) => (
                            <Badge key={skill} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{candidate.experience}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{candidate.stage}</Badge>
                      </TableCell>
                      <TableCell>{candidate.appliedDate}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedCandidate(candidate)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Candidate Profile Dialog */}
      <Dialog open={!!selectedCandidate} onOpenChange={() => setSelectedCandidate(null)}>
        <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
          {selectedCandidate && (
            <>
              <DialogHeader>
                <DialogTitle>Candidate Profile</DialogTitle>
              </DialogHeader>
              
              <div className="grid grid-cols-3 gap-6">
                {/* Left: Resume/Profile */}
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Profile</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={selectedCandidate.avatar} />
                          <AvatarFallback>{selectedCandidate.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{selectedCandidate.name}</p>
                          <p className="text-sm text-muted-foreground">{selectedCandidate.location}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {selectedCandidate.email}
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          {selectedCandidate.phone}
                        </div>
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-muted-foreground" />
                          {selectedCandidate.experience}
                        </div>
                        <div className="flex items-center gap-2">
                          <GraduationCap className="h-4 w-4 text-muted-foreground" />
                          {selectedCandidate.education}
                        </div>
                      </div>

                      <Button className="w-full" variant="outline">
                        <FileText className="h-4 w-4 mr-2" />
                        View Full Resume
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Center: Score Explainability */}
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center justify-between">
                        AI Match Score
                        <span className={`text-2xl font-bold ${getScoreColor(selectedCandidate.score)}`}>
                          {selectedCandidate.score}%
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                          <div>
                            <p className="font-medium">Strong Match</p>
                            <p className="text-sm text-muted-foreground">React, TypeScript expertise</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                          <div>
                            <p className="font-medium">Experience Level</p>
                            <p className="text-sm text-muted-foreground">7+ years matches requirement</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                          <div>
                            <p className="font-medium">Partial Match</p>
                            <p className="text-sm text-muted-foreground">GraphQL experience limited</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                          <div>
                            <p className="font-medium">Missing</p>
                            <p className="text-sm text-muted-foreground">No AWS certification</p>
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 space-y-2">
                        <Button className="w-full" onClick={() => moveCandidate(selectedCandidate.id, 'Shortlisted')}>
                          Shortlist Candidate
                        </Button>
                        <Button className="w-full" variant="outline" onClick={() => moveCandidate(selectedCandidate.id, 'Rejected')}>
                          Reject with Feedback
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Right: Comments & History */}
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Team Comments</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <Textarea
                          placeholder="Add a comment..."
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                        />
                        <Button onClick={addComment} size="sm">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Add Comment
                        </Button>
                      </div>

                      <ScrollArea className="h-[200px]">
                        <div className="space-y-3">
                          <div className="text-sm">
                            <p className="font-medium">Rahul Dev Banjara • 2 hours ago</p>
                            <p className="text-muted-foreground">Great cultural fit, strong technical skills</p>
                          </div>
                          <div className="text-sm">
                            <p className="font-medium">Diwas Adhikari • 1 day ago</p>
                            <p className="text-muted-foreground">Scheduled for technical interview on Monday</p>
                          </div>
                          <div className="text-sm">
                            <p className="font-medium">System • 3 days ago</p>
                            <p className="text-muted-foreground">Application received and screened by AI</p>
                          </div>
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}