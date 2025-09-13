import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { Calendar, Clock, MapPin, Users, ChevronLeft, ChevronRight, Send, CheckCircle, Mail, AlertCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { timeAgo } from '@/lib/utils';

interface ShortlistedCandidate {
  id: string;
  name: string;
  role: string;
  jobId: string;
  jobTitle: string;
  score: number;
  strengths: string[];
  weaknesses: string[];
  feedback: string;
  status: 'pending' | 'slots-sent' | 'confirmed';
  selectedSlot?: string;
  communicationHistory: CommunicationEntry[];
}

interface CommunicationEntry {
  id: string;
  type: 'email-sent' | 'candidate-reply' | 'system-note';
  message: string;
  timestamp: Date;
}

interface CalendarEvent {
  id: string;
  candidateName: string;
  role: string;
  date: string;
  time: string;
  type: 'video' | 'in-person';
  status: 'confirmed' | 'tentative';
}

interface JobGroup {
  jobId: string;
  jobTitle: string;
  candidates: ShortlistedCandidate[];
}

export default function Interviews() {
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<ShortlistedCandidate | null>(null);
  const [candidateReply, setCandidateReply] = useState('');
  const [showCommunication, setShowCommunication] = useState<string | null>(null);
  
  const [candidates, setCandidates] = useState<ShortlistedCandidate[]>([
    {
      id: '1',
      name: 'Sarah Johnson',
      role: 'Senior Frontend Engineer',
      jobId: 'job-1',
      jobTitle: 'Senior Frontend Engineer',
      score: 92,
      strengths: ['Strong React expertise', 'Excellent communication', 'Team leadership experience'],
      weaknesses: ['Limited backend knowledge', 'No GraphQL experience'],
      feedback: 'Impressive technical skills and great cultural fit. Would be a strong addition to the team.',
      status: 'pending',
      communicationHistory: []
    },
    {
      id: '2',
      name: 'Michael Chen',
      role: 'Data Scientist',
      jobId: 'job-2',
      jobTitle: 'Data Scientist',
      score: 88,
      strengths: ['Strong ML background', 'Published research papers', 'Python expert'],
      weaknesses: ['Limited cloud experience', 'Needs mentoring on business side'],
      feedback: 'Solid technical foundation with room to grow in cloud technologies.',
      status: 'slots-sent',
      communicationHistory: [
        {
          id: 'comm-1',
          type: 'email-sent',
          message: 'Interview invitation sent with 5 time slots',
          timestamp: new Date(Date.now() - 86400000)
        }
      ]
    },
    {
      id: '3',
      name: 'Emily Davis',
      role: 'Product Manager',
      jobId: 'job-3',
      jobTitle: 'Product Manager',
      score: 85,
      strengths: ['Strong stakeholder management', 'Data-driven approach', 'Agile expertise'],
      weaknesses: ['No fintech experience', 'Learning curve for our tools'],
      feedback: 'Excellent soft skills and strategic thinking. Previous experience in similar role.',
      status: 'confirmed',
      selectedSlot: 'Tuesday, Jan 30 at 2:00 PM',
      communicationHistory: [
        {
          id: 'comm-2',
          type: 'email-sent',
          message: 'Interview invitation sent with 5 time slots',
          timestamp: new Date(Date.now() - 172800000)
        },
        {
          id: 'comm-3',
          type: 'candidate-reply',
          message: 'Tuesday at 2 PM works perfectly for me. Looking forward to it!',
          timestamp: new Date(Date.now() - 86400000)
        },
        {
          id: 'comm-4',
          type: 'system-note',
          message: 'Interview confirmed via Google Calendar',
          timestamp: new Date(Date.now() - 86400000)
        }
      ]
    }
  ]);

  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([
    {
      id: '1',
      candidateName: 'Emily Davis',
      role: 'Product Manager',
      date: '2024-01-30',
      time: '2:00 PM',
      type: 'video',
      status: 'confirmed'
    },
    {
      id: '2',
      candidateName: 'Alex Thompson',
      role: 'Backend Engineer',
      date: '2024-01-31',
      time: '10:00 AM',
      type: 'in-person',
      status: 'confirmed'
    }
  ]);

  const timeSlots = [
    'Monday, Jan 29 at 10:00 AM - Office Room A',
    'Monday, Jan 29 at 2:00 PM - Office Room B',
    'Tuesday, Jan 30 at 11:00 AM - Main Conference',
    'Tuesday, Jan 30 at 2:00 PM - Office Room A',
    'Wednesday, Jan 31 at 10:00 AM - Office Room B'
  ];

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const weekDates = ['Jan 29', 'Jan 30', 'Jan 31', 'Feb 1', 'Feb 2'];

  const handleSendSlots = (candidate: ShortlistedCandidate) => {
    const newHistory: CommunicationEntry = {
      id: `comm-${Date.now()}`,
      type: 'email-sent',
      message: `Interview invitation sent with 5 time slots (all at office)`,
      timestamp: new Date()
    };
    
    setCandidates(candidates.map(c => 
      c.id === candidate.id ? { 
        ...c, 
        status: 'slots-sent',
        communicationHistory: [...c.communicationHistory, newHistory]
      } : c
    ));
    
    toast({
      title: "Time Slots Sent",
      description: `5 office interview slots have been sent to ${candidate.name} for selection.`
    });
    
    setDialogOpen(false);
    setSelectedCandidate(null);
  };

  const handleProcessReply = (candidate: ShortlistedCandidate, reply: string) => {
    // Mock parsing of candidate reply
    const selectedSlot = 'Tuesday, Jan 30 at 2:00 PM - Office Room A';
    
    const replyHistory: CommunicationEntry = {
      id: `comm-${Date.now()}`,
      type: 'candidate-reply',
      message: reply,
      timestamp: new Date()
    };
    
    const confirmHistory: CommunicationEntry = {
      id: `comm-${Date.now() + 1}`,
      type: 'system-note',
      message: `Interview confirmed via Google Calendar - ${selectedSlot}`,
      timestamp: new Date()
    };
    
    setCandidates(candidates.map(c => 
      c.id === candidate.id ? { 
        ...c, 
        status: 'confirmed', 
        selectedSlot,
        communicationHistory: [...c.communicationHistory, replyHistory, confirmHistory]
      } : c
    ));
    
    // Add to calendar
    const newEvent: CalendarEvent = {
      id: String(calendarEvents.length + 1),
      candidateName: candidate.name,
      role: candidate.role,
      date: '2024-01-30',
      time: '2:00 PM',
      type: 'in-person',
      status: 'confirmed'
    };
    
    setCalendarEvents([...calendarEvents, newEvent]);
    
    toast({
      title: "Interview Confirmed",
      description: `Office interview with ${candidate.name} scheduled for ${selectedSlot}.`
    });
    
    setCandidateReply('');
  };

  const getEventsForDay = (dayIndex: number) => {
    return calendarEvents.filter((_, idx) => idx % 5 === dayIndex);
  };

  // Group candidates by job
  const jobGroups: JobGroup[] = candidates.reduce((acc, candidate) => {
    const existingGroup = acc.find(g => g.jobId === candidate.jobId);
    if (existingGroup) {
      existingGroup.candidates.push(candidate);
    } else {
      acc.push({
        jobId: candidate.jobId,
        jobTitle: candidate.jobTitle,
        candidates: [candidate]
      });
    }
    return acc;
  }, [] as JobGroup[]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Interview Scheduling</h1>
        <p className="text-muted-foreground">Schedule offline interviews with shortlisted candidates by job</p>
      </div>

      {/* Shortlisted Candidates by Job */}
      {jobGroups.map((group) => (
        <Card key={group.jobId} className="border-primary/20">
          <CardHeader className="bg-gradient-subtle">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              {group.jobTitle} - Shortlisted Candidates
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {group.candidates.map((candidate) => (
                <div key={candidate.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg">{candidate.name}</h3>
                        <Badge variant="secondary">{candidate.role}</Badge>
                        <Badge variant={candidate.score >= 90 ? 'default' : 'outline'}>
                          {candidate.score}% match
                        </Badge>
                        {showCommunication === candidate.id && (
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => setShowCommunication(null)}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Hide History
                          </Button>
                        )}
                        {!showCommunication && candidate.communicationHistory.length > 0 && (
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => setShowCommunication(candidate.id)}
                          >
                            <Mail className="h-4 w-4 mr-1" />
                            Show History ({candidate.communicationHistory.length})
                          </Button>
                        )}
                      </div>
                    
                    <div className="grid md:grid-cols-2 gap-3">
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
                    
                      <div className="p-3 bg-secondary/50 rounded-lg">
                        <p className="text-sm italic">{candidate.feedback}</p>
                      </div>

                      {/* Communication History */}
                      {showCommunication === candidate.id && candidate.communicationHistory.length > 0 && (
                        <div className="border rounded-lg p-3 bg-muted/50">
                          <div className="text-xs font-medium mb-2 flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            Communication History
                          </div>
                          <div className="space-y-2">
                            {candidate.communicationHistory.map((comm) => (
                              <div key={comm.id} className="text-xs space-y-1">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    {comm.type === 'email-sent' ? 'Sent' : 
                                     comm.type === 'candidate-reply' ? 'Reply' : 'System'}
                                  </Badge>
                                  <span className="text-muted-foreground">
                                    {timeAgo(comm.timestamp)}
                                  </span>
                                </div>
                                <p className="pl-2 text-muted-foreground">{comm.message}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {candidate.status === 'slots-sent' && (
                        <Alert className="bg-blue-50 border-blue-200">
                          <Mail className="h-4 w-4 text-blue-600" />
                          <AlertDescription className="text-blue-700">
                            Time slots sent to candidate. Waiting for response...
                            <div className="mt-2">
                              <Label className="text-xs">Simulate Candidate Reply:</Label>
                              <Textarea 
                                placeholder="e.g., 'Tuesday at 2 PM works perfectly for me. Looking forward to meeting the team at your office!'"
                                value={candidateReply}
                                onChange={(e) => setCandidateReply(e.target.value)}
                                className="mt-1 h-20"
                              />
                              <Button 
                                size="sm" 
                                className="mt-2"
                                onClick={() => handleProcessReply(candidate, candidateReply)}
                                disabled={!candidateReply}
                              >
                                Process Reply
                              </Button>
                            </div>
                          </AlertDescription>
                        </Alert>
                    )}

                      {candidate.status === 'confirmed' && (
                        <Alert className="bg-green-50 border-green-200">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <AlertDescription className="text-green-700">
                            Office interview confirmed for {candidate.selectedSlot}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  
                  {candidate.status === 'pending' && (
                    <Dialog open={dialogOpen && selectedCandidate?.id === candidate.id} onOpenChange={(open) => {
                      setDialogOpen(open);
                      if (!open) setSelectedCandidate(null);
                    }}>
                      <Button 
                        onClick={() => {
                          setSelectedCandidate(candidate);
                          setDialogOpen(true);
                        }}
                        size="sm"
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Schedule Interview
                      </Button>
                      <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Schedule Office Interview with {candidate.name}</DialogTitle>
                            <DialogDescription>
                              Select 4-5 time slots for an in-person interview at the office
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="space-y-4">
                            <Alert className="bg-primary/10">
                              <MapPin className="h-4 w-4" />
                              <AlertDescription>
                                All interviews will be conducted at the office
                              </AlertDescription>
                            </Alert>
                            
                            <div>
                              <Label>Available Office Time Slots (Select 4-5)</Label>
                              <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
                                {timeSlots.map((slot, idx) => (
                                  <label key={idx} className="flex items-center space-x-2 cursor-pointer p-2 hover:bg-secondary/50 rounded">
                                    <input 
                                      type="checkbox" 
                                      className="rounded" 
                                      defaultChecked={idx < 4} 
                                    />
                                    <MapPin className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-sm">{slot}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                            
                            <Button onClick={() => handleSendSlots(candidate)} className="w-full">
                              <Send className="h-4 w-4 mr-2" />
                              Send Office Interview Slots
                            </Button>
                          </div>
                      </DialogContent>
                    </Dialog>
                  )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Calendar View - Per Job */}
      {jobGroups.map((group) => (
        <Card key={`calendar-${group.jobId}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                {group.jobTitle} - Interview Calendar
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => setSelectedWeek(selectedWeek - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium">Week of Jan 29, 2024</span>
                <Button size="sm" variant="outline" onClick={() => setSelectedWeek(selectedWeek + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4">
            {weekDays.map((day, dayIndex) => (
              <div key={day} className="space-y-2">
                <div className="font-medium text-center p-2 bg-secondary rounded">
                  <div>{day}</div>
                  <div className="text-xs text-muted-foreground">{weekDates[dayIndex]}</div>
                </div>
                <div className="space-y-2 min-h-[300px]">
                  {getEventsForDay(dayIndex).map((event) => (
                    <Card key={event.id} className={cn(
                      "cursor-pointer hover:shadow-md transition-all",
                      event.status === 'tentative' && "opacity-60"
                    )}>
                      <CardContent className="p-3">
                        <p className="font-medium text-sm">{event.candidateName}</p>
                        <p className="text-xs text-muted-foreground">{event.role}</p>
                        <div className="flex items-center gap-1 mt-2">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs">{event.time}</span>
                        </div>
                        <Badge 
                          variant={event.type === 'video' ? 'secondary' : 'outline'} 
                          className="mt-1 text-xs"
                        >
                          <>
                            <MapPin className="h-3 w-3 mr-1" />
                            Office
                          </>
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Pending Replies Alert */}
      {candidates.filter(c => c.status === 'slots-sent').length > 0 && (
        <Alert className="border-warning/20">
          <AlertCircle className="h-4 w-4 text-warning" />
          <AlertDescription>
            {candidates.filter(c => c.status === 'slots-sent').length} candidate(s) have pending interview slot selections. Check back for their responses.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}