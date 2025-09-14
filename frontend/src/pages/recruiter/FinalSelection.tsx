import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { Users, CheckCircle, XCircle, AlertCircle, Award, Calendar, Building2, Upload, FileText, Video, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { InterviewEvent } from '@/components/common/InterviewCalendar';

interface InterviewerRating {
  interviewer: string;
  confidence: number;
  delivery: number;
  technicalKnowledge: number;
  overallRating: number;
}

interface FinalCandidate extends InterviewEvent {
  finalStatus: 'pending' | 'selected' | 'rejected';
  interviewScore: number;
  technicalScore: number;
  culturalFitScore: number;
  interviewNotes: string;
  interviewerRatings?: InterviewerRating[];
  llmScores?: {
    confidence: number;
    delivery: number;
    technicalKnowledge: number;
    overallRating: number;
  };
  finalScores?: {
    confidence: number;
    delivery: number;
    technicalKnowledge: number;
    overallRating: number;
  };
  hasUploadedFiles: boolean;
}

export default function FinalSelection() {
  // Mock completed interview events - in real app, this would come from the interview calendar
  const completedInterviews: FinalCandidate[] = useMemo(() => [
    {
      id: 'interview-sample-1',
      candidateId: 'can-extra-1',
      candidateName: 'Sarah Johnson',
      candidateEmail: 'sarah.johnson@email.com',
      jobId: 'job-001',
      jobTitle: 'Senior Frontend Engineer',
      companyName: 'ConvexHire',
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      time: '14:00',
      duration: 90,
      type: 'in-person',
      status: 'completed',
      location: 'Conference Room A',
      interviewers: ['Jane Doe', 'Tom Wilson', 'Emily Brown', 'David Lee'],
      notes: 'Second round technical interview focusing on React and system design',
      candidateExperience: 6,
      candidateSkills: ['React', 'TypeScript', 'Node.js', 'GraphQL'],
      matchScore: 92,
      interviewRound: 2,
      totalRounds: 3,
      finalStatus: 'pending',
      interviewScore: 88,
      technicalScore: 95,
      culturalFitScore: 90,
      interviewNotes: 'Impressive technical knowledge, great cultural fit. Demonstrated excellent problem-solving skills and team collaboration.',
      hasUploadedFiles: false
    },
    {
      id: 'interview-sample-2',
      candidateId: 'can-extra-2',
      candidateName: 'Michael Chen',
      candidateEmail: 'michael.chen@email.com',
      jobId: 'job-002',
      jobTitle: 'Data Scientist',
      companyName: 'ConvexHire',
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      time: '10:00',
      duration: 60,
      type: 'in-person',
      status: 'completed',
      location: 'Conference Room B',
      interviewers: ['Dr. Lisa Wang', 'Alex Rodriguez', 'Maria Garcia', 'James Taylor'],
      notes: 'Initial screening interview for data science position',
      candidateExperience: 5,
      candidateSkills: ['Python', 'Machine Learning', 'TensorFlow', 'SQL'],
      matchScore: 88,
      interviewRound: 1,
      totalRounds: 2,
      finalStatus: 'pending',
      interviewScore: 90,
      technicalScore: 85,
      culturalFitScore: 88,
      interviewNotes: 'Solid technical foundation, enthusiastic about the role. Strong ML background with published research papers.',
      hasUploadedFiles: false
    },
    {
      id: 'interview-sample-3',
      candidateId: 'can-extra-3',
      candidateName: 'Emily Davis',
      candidateEmail: 'emily.davis@email.com',
      jobId: 'job-003',
      jobTitle: 'Product Manager',
      companyName: 'ConvexHire',
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      time: '15:00',
      duration: 45,
      type: 'in-person',
      status: 'completed',
      location: 'Conference Room B',
      interviewers: ['Mark Thompson', 'Jennifer Davis', 'Robert Kim', 'Amanda White'],
      notes: 'In-person interview for product management role',
      candidateExperience: 7,
      candidateSkills: ['Product Strategy', 'Agile', 'User Research', 'Analytics'],
      matchScore: 85,
      interviewRound: 1,
      totalRounds: 4,
      finalStatus: 'pending',
      interviewScore: 92,
      technicalScore: 78,
      culturalFitScore: 90,
      interviewNotes: 'Excellent soft skills, strategic thinker. Strong stakeholder management and data-driven approach.',
      hasUploadedFiles: false
    },
    {
      id: 'interview-sample-4',
      candidateId: 'can-extra-4',
      candidateName: 'Alex Rodriguez',
      candidateEmail: 'alex.rodriguez@email.com',
      jobId: 'job-001',
      jobTitle: 'Senior Frontend Engineer',
      companyName: 'ConvexHire',
      date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
      time: '16:00',
      duration: 60,
      type: 'in-person',
      status: 'completed',
      location: 'Main Conference Room',
      interviewers: ['Tom Wilson', 'Sarah Johnson', 'Michael Chen', 'Lisa Anderson'],
      notes: 'Technical interview focusing on system design and algorithms',
      candidateExperience: 4,
      candidateSkills: ['Node.js', 'Python', 'PostgreSQL', 'Docker'],
      matchScore: 87,
      interviewRound: 1,
      totalRounds: 3,
      finalStatus: 'pending',
      interviewScore: 85,
      technicalScore: 90,
      culturalFitScore: 82,
      interviewNotes: 'Strong technical skills, good problem-solving approach. Needs improvement in communication.',
      hasUploadedFiles: false
    }
  ], []);

  const [candidates, setCandidates] = useState<FinalCandidate[]>(completedInterviews);
  const [selectedCandidate, setSelectedCandidate] = useState<FinalCandidate | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [excelFile, setExcelFile] = useState<File | null>(null);

  const handleSelect = (candidateId: string) => {
    setCandidates(candidates.map(c => {
      if (c.id === candidateId) {
        toast({
          title: "Candidate Selected",
          description: `${c.candidateName} has been selected for ${c.jobTitle}. Offer letter will be generated.`
        });
        return { ...c, finalStatus: 'selected' };
      }
      return c;
    }));
  };

  const handleReject = (candidateId: string) => {
    const candidate = candidates.find(c => c.id === candidateId);
    if (candidate) {
      setCandidates(candidates.map(c => 
        c.id === candidateId ? { ...c, finalStatus: 'rejected' } : c
      ));
      toast({
        title: "Candidate Rejected",
        description: `Feedback has been sent to ${candidate.candidateName}.`
      });
    }
  };

  // Group candidates by job
  const candidatesByJob = useMemo(() => {
    const grouped: { [jobId: string]: { jobTitle: string; candidates: FinalCandidate[] } } = {};
    
    candidates.forEach(candidate => {
      if (!grouped[candidate.jobId]) {
        grouped[candidate.jobId] = {
          jobTitle: candidate.jobTitle,
          candidates: []
        };
      }
      grouped[candidate.jobId].candidates.push(candidate);
    });
    
    return grouped;
  }, [candidates]);

  const handleCandidateClick = (candidate: FinalCandidate) => {
    setSelectedCandidate(candidate);
    setShowUploadModal(true);
  };

  const handleFileUpload = (type: 'video' | 'excel', file: File) => {
    if (type === 'video') {
      setVideoFile(file);
    } else {
      setExcelFile(file);
    }
  };

  const handleSubmitFiles = async () => {
    if (!videoFile || !excelFile || !selectedCandidate) return;
    
    setIsProcessing(true);
    
    // Simulate backend processing
    setTimeout(() => {
      // Mock interviewer ratings from excel file
      const mockInterviewerRatings: InterviewerRating[] = selectedCandidate.interviewers.map(interviewer => ({
        interviewer,
        confidence: Math.floor(Math.random() * 30) + 70, // 70-100
        delivery: Math.floor(Math.random() * 30) + 70,
        technicalKnowledge: Math.floor(Math.random() * 30) + 70,
        overallRating: Math.floor(Math.random() * 30) + 70
      }));
      
      // Mock LLM scores from video transcription
      const mockLlmScores = {
        confidence: Math.floor(Math.random() * 30) + 70,
        delivery: Math.floor(Math.random() * 30) + 70,
        technicalKnowledge: Math.floor(Math.random() * 30) + 70,
        overallRating: Math.floor(Math.random() * 30) + 70
      };
      
      // Calculate final scores (average of interviewer and LLM scores)
      const finalScores = {
        confidence: Math.round((mockInterviewerRatings.reduce((sum, r) => sum + r.confidence, 0) / mockInterviewerRatings.length + mockLlmScores.confidence) / 2),
        delivery: Math.round((mockInterviewerRatings.reduce((sum, r) => sum + r.delivery, 0) / mockInterviewerRatings.length + mockLlmScores.delivery) / 2),
        technicalKnowledge: Math.round((mockInterviewerRatings.reduce((sum, r) => sum + r.technicalKnowledge, 0) / mockInterviewerRatings.length + mockLlmScores.technicalKnowledge) / 2),
        overallRating: Math.round((mockInterviewerRatings.reduce((sum, r) => sum + r.overallRating, 0) / mockInterviewerRatings.length + mockLlmScores.overallRating) / 2)
      };
      
      // Update candidate with scores
      setCandidates(prev => prev.map(c => 
        c.id === selectedCandidate.id 
          ? { 
              ...c, 
              hasUploadedFiles: true,
              interviewerRatings: mockInterviewerRatings,
              llmScores: mockLlmScores,
              finalScores: finalScores
            }
          : c
      ));
      
      setIsProcessing(false);
      setShowUploadModal(false);
      setVideoFile(null);
      setExcelFile(null);
      
      toast({
        title: "Processing Complete",
        description: "Video transcription and scoring analysis completed successfully."
      });
    }, 3000);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Final Selection</h1>
        <p className="text-muted-foreground">Review completed interviews and make final hiring decisions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{candidates.length}</p>
                <p className="text-sm text-muted-foreground">Completed Interviews</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{candidates.filter(c => c.finalStatus === 'selected').length}</p>
                <p className="text-sm text-muted-foreground">Selected Candidates</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{candidates.filter(c => c.finalStatus === 'pending').length}</p>
                <p className="text-sm text-muted-foreground">Pending Decision</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Job Tabs */}
      <Tabs defaultValue={Object.keys(candidatesByJob)[0]} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          {Object.entries(candidatesByJob).map(([jobId, jobData]) => (
            <TabsTrigger key={jobId} value={jobId} className="text-sm">
              {jobData.jobTitle} ({jobData.candidates.length})
            </TabsTrigger>
          ))}
        </TabsList>
        
        {Object.entries(candidatesByJob).map(([jobId, jobData]) => (
          <TabsContent key={jobId} value={jobId} className="space-y-6">
            {/* Job-specific Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-lg font-bold">{jobData.candidates.length}</p>
                      <p className="text-sm text-muted-foreground">Total Candidates</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-lg font-bold">{jobData.candidates.filter(c => c.finalStatus === 'selected').length}</p>
                      <p className="text-sm text-muted-foreground">Selected</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-lg font-bold">{jobData.candidates.filter(c => c.finalStatus === 'pending').length}</p>
                      <p className="text-sm text-muted-foreground">Pending</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Candidates Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobData.candidates.map((candidate) => (
                <Card 
                  key={candidate.id} 
                  className={cn(
                    "relative overflow-hidden transition-all cursor-pointer hover:shadow-lg",
                    candidate.finalStatus === 'selected' && "border-green-500 bg-green-50/10",
                    candidate.finalStatus === 'rejected' && "border-red-500 bg-red-50/10"
                  )}
                  onClick={() => handleCandidateClick(candidate)}
                >
                  {candidate.finalStatus === 'selected' && (
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-green-600">Selected</Badge>
                    </div>
                  )}
                  {candidate.finalStatus === 'rejected' && (
                    <div className="absolute top-2 right-2">
                      <Badge variant="destructive">Rejected</Badge>
                    </div>
                  )}
                  
                  <CardHeader>
                    <CardTitle className="text-lg">{candidate.candidateName}</CardTitle>
                    <p className="text-sm text-muted-foreground">{candidate.jobTitle}</p>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Interviewers */}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">Interviewers</p>
                      <div className="flex flex-wrap gap-1">
                        {candidate.interviewers.map((interviewer, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {interviewer}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Final Scores (if available) */}
                    {candidate.finalScores && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">Final Scores</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="text-center">
                            <p className="text-muted-foreground">Confidence</p>
                            <p className={cn("font-medium", getScoreColor(candidate.finalScores.confidence))}>
                              {candidate.finalScores.confidence}%
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-muted-foreground">Delivery</p>
                            <p className={cn("font-medium", getScoreColor(candidate.finalScores.delivery))}>
                              {candidate.finalScores.delivery}%
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-muted-foreground">Technical</p>
                            <p className={cn("font-medium", getScoreColor(candidate.finalScores.technicalKnowledge))}>
                              {candidate.finalScores.technicalKnowledge}%
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-muted-foreground">Overall</p>
                            <p className={cn("font-medium", getScoreColor(candidate.finalScores.overallRating))}>
                              {candidate.finalScores.overallRating}%
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Upload Status */}
                    <div className="flex items-center gap-2">
                      {candidate.hasUploadedFiles ? (
                        <Badge variant="secondary" className="text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Processed
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          <Upload className="h-3 w-3 mr-1" />
                          Upload Files
                        </Badge>
                      )}
                    </div>

                    {/* Actions */}
                    {candidate.finalStatus === 'pending' && candidate.hasUploadedFiles && (
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          className="flex-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelect(candidate.id);
                          }}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Select
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          className="flex-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReject(candidate.id);
                          }}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}

                    {candidate.finalStatus === 'selected' && (
                      <Alert className="bg-green-50 border-green-200">
                        <Award className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-700 text-xs">
                          Offer letter has been generated and sent to HR for processing.
                        </AlertDescription>
                      </Alert>
                    )}

                    {candidate.finalStatus === 'rejected' && (
                      <Alert className="bg-red-50 border-red-200">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-700 text-xs">
                          Rejection feedback has been sent to the candidate.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Upload Modal */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload Interview Materials</DialogTitle>
            <DialogDescription>
              Upload video recording and interviewer ratings for {selectedCandidate?.candidateName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Video Upload */}
            <div className="space-y-2">
              <Label>Interview Video Recording</Label>
              <div className="flex gap-2">
                <Input 
                  type="file" 
                  accept="video/*" 
                  className="flex-1"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload('video', file);
                  }}
                />
                {videoFile && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Video className="h-3 w-3" />
                    {videoFile.name}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Upload the interview video for AI transcription and analysis
              </p>
            </div>

            {/* Excel Upload */}
            <div className="space-y-2">
              <Label>Interviewer Ratings (Excel/CSV)</Label>
              <div className="flex gap-2">
                <Input 
                  type="file" 
                  accept=".xlsx,.xls,.csv" 
                  className="flex-1"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload('excel', file);
                  }}
                />
                {excelFile && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {excelFile.name}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Upload interviewer ratings with columns: Confidence, Delivery, Technical Knowledge, Overall Rating
              </p>
            </div>

            {/* Scoring Criteria Info */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="text-sm font-medium mb-2">Scoring Criteria</h4>
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div>• <strong>Confidence:</strong> Candidate's self-assurance and presence</div>
                <div>• <strong>Delivery:</strong> Communication clarity and articulation</div>
                <div>• <strong>Technical Knowledge:</strong> Domain expertise and problem-solving</div>
                <div>• <strong>Overall Rating:</strong> General interview performance</div>
              </div>
            </div>

            {/* Processing Status */}
            {isProcessing && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Processing video transcription and analyzing scores... This may take a few minutes.
                </AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowUploadModal(false)}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSubmitFiles}
                disabled={!videoFile || !excelFile || isProcessing}
                className="flex-1"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Submit & Process
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}