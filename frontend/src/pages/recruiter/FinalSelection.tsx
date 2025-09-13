import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { Users, FileText, CheckCircle, XCircle, Upload, Star, AlertCircle, Award } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FinalCandidate {
  id: string;
  name: string;
  role: string;
  score: number;
  interviewScore: number;
  technicalScore: number;
  culturalFitScore: number;
  strengths: string[];
  weaknesses: string[];
  interviewNotes: string;
  status: 'pending' | 'selected' | 'rejected';
  interviewRecording?: string;
  feedbackSheet?: string;
}

export default function FinalSelection() {
  const [candidates, setCandidates] = useState<FinalCandidate[]>([
    {
      id: '1',
      name: 'Sarah Johnson',
      role: 'Senior Frontend Engineer',
      score: 92,
      interviewScore: 88,
      technicalScore: 95,
      culturalFitScore: 90,
      strengths: ['Strong React expertise', 'Excellent communication', 'Team leadership experience'],
      weaknesses: ['Limited backend knowledge', 'No GraphQL experience'],
      interviewNotes: 'Impressive technical knowledge, great cultural fit. Demonstrated problem-solving skills.',
      status: 'pending'
    },
    {
      id: '2',
      name: 'Michael Chen',
      role: 'Data Scientist',
      score: 88,
      interviewScore: 90,
      technicalScore: 85,
      culturalFitScore: 88,
      strengths: ['Strong ML background', 'Published research papers', 'Python expert'],
      weaknesses: ['Limited cloud experience', 'Needs mentoring on business side'],
      interviewNotes: 'Solid technical foundation, enthusiastic about the role. Would benefit from AWS training.',
      status: 'pending'
    },
    {
      id: '3',
      name: 'Emily Davis',
      role: 'Product Manager',
      score: 85,
      interviewScore: 92,
      technicalScore: 78,
      culturalFitScore: 90,
      strengths: ['Strong stakeholder management', 'Data-driven approach', 'Agile expertise'],
      weaknesses: ['No fintech experience', 'Learning curve for our tools'],
      interviewNotes: 'Excellent soft skills, strategic thinker. Previous experience in similar role.',
      status: 'pending'
    }
  ]);

  const [selectedCandidate, setSelectedCandidate] = useState<FinalCandidate | null>(null);
  const [finalNotes, setFinalNotes] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<{ recording: boolean; sheet: boolean }>({
    recording: false,
    sheet: false
  });

  const handleSelect = (candidateId: string) => {
    setCandidates(candidates.map(c => {
      if (c.id === candidateId) {
        toast({
          title: "Candidate Selected",
          description: `${c.name} has been selected for ${c.role}. Offer letter will be generated.`
        });
        return { ...c, status: 'selected' };
      }
      return c;
    }));
  };

  const handleReject = (candidateId: string) => {
    const candidate = candidates.find(c => c.id === candidateId);
    if (candidate) {
      setCandidates(candidates.map(c => 
        c.id === candidateId ? { ...c, status: 'rejected' } : c
      ));
      toast({
        title: "Candidate Rejected",
        description: `Feedback has been sent to ${candidate.name}.`
      });
    }
  };

  const handleFileUpload = (type: 'recording' | 'sheet') => {
    setUploadedFiles({ ...uploadedFiles, [type]: true });
    toast({
      title: "File Uploaded",
      description: `${type === 'recording' ? 'Interview recording' : 'Feedback sheet'} uploaded successfully.`
    });
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
        <p className="text-muted-foreground">Make final hiring decisions and provide comprehensive feedback</p>
      </div>

      {/* Upload Section */}
      <Card className="border-primary/20">
        <CardHeader className="bg-gradient-subtle">
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Interview Materials
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Interview Recording (Audio/Video)</Label>
              <div className="flex gap-2">
                <Input type="file" accept="audio/*,video/*" className="flex-1" />
                <Button onClick={() => handleFileUpload('recording')} variant="outline">
                  Upload
                </Button>
              </div>
              {uploadedFiles.recording && (
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" /> Recording uploaded
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Feedback Sheet (Excel/CSV)</Label>
              <div className="flex gap-2">
                <Input type="file" accept=".xlsx,.xls,.csv" className="flex-1" />
                <Button onClick={() => handleFileUpload('sheet')} variant="outline">
                  Upload
                </Button>
              </div>
              {uploadedFiles.sheet && (
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" /> Sheet uploaded
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Candidates Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {candidates.map((candidate) => (
          <Card 
            key={candidate.id} 
            className={cn(
              "relative overflow-hidden transition-all",
              candidate.status === 'selected' && "border-green-500 bg-green-50/10",
              candidate.status === 'rejected' && "border-red-500 bg-red-50/10"
            )}
          >
            {candidate.status === 'selected' && (
              <div className="absolute top-2 right-2">
                <Badge className="bg-green-600">Selected</Badge>
              </div>
            )}
            {candidate.status === 'rejected' && (
              <div className="absolute top-2 right-2">
                <Badge variant="destructive">Rejected</Badge>
              </div>
            )}
            
            <CardHeader>
              <CardTitle className="text-lg">{candidate.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{candidate.role}</p>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Scores */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Overall Score</span>
                  <span className={cn("font-bold text-lg", getScoreColor(candidate.score))}>
                    {candidate.score}%
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center">
                    <p className="text-muted-foreground">Interview</p>
                    <p className={cn("font-medium", getScoreColor(candidate.interviewScore))}>
                      {candidate.interviewScore}%
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-muted-foreground">Technical</p>
                    <p className={cn("font-medium", getScoreColor(candidate.technicalScore))}>
                      {candidate.technicalScore}%
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-muted-foreground">Cultural</p>
                    <p className={cn("font-medium", getScoreColor(candidate.culturalFitScore))}>
                      {candidate.culturalFitScore}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Strengths & Weaknesses */}
              <div className="space-y-2">
                <div>
                  <p className="text-xs font-medium text-green-600 mb-1">Strengths</p>
                  <div className="flex flex-wrap gap-1">
                    {candidate.strengths.map((strength, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {strength}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-orange-600 mb-1">Areas to Improve</p>
                  <div className="flex flex-wrap gap-1">
                    {candidate.weaknesses.map((weakness, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {weakness}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Interview Notes */}
              <div className="p-3 bg-secondary/50 rounded-lg">
                <p className="text-xs font-medium mb-1">Interview Notes</p>
                <p className="text-xs text-muted-foreground">{candidate.interviewNotes}</p>
              </div>

              {/* Actions */}
              {candidate.status === 'pending' && (
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleSelect(candidate.id)}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Select
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive" 
                    className="flex-1"
                    onClick={() => handleReject(candidate.id)}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                </div>
              )}

              {candidate.status === 'selected' && (
                <Alert className="bg-green-50 border-green-200">
                  <Award className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-700 text-xs">
                    Offer letter has been generated and sent to HR for processing.
                  </AlertDescription>
                </Alert>
              )}

              {candidate.status === 'rejected' && (
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
    </div>
  );
}