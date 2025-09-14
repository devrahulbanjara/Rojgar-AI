import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import { Calendar, Clock, MapPin, Users, ChevronLeft, ChevronRight, Send, CheckCircle, Mail, AlertCircle, XCircle, Plus, MessageSquare, User, Building2, Target, ThumbsUp, ThumbsDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { timeAgo } from '@/lib/utils';
import InterviewCalendar, { InterviewEvent } from '@/components/common/InterviewCalendar';
import { applicants } from '@/data/applicants';

interface ShortlistedCandidate {
  id: string;
  candidateId: string;
  name: string;
  email: string;
  jobTitle: string;
  jobId: string;
  matchScore: number;
  experience: number;
  skills: string[];
  shortlistedDate: Date;
  status: 'pending' | 'contacted' | 'responded' | 'scheduled' | 'completed';
  chatMessages?: ChatMessage[];
}

interface ChatMessage {
  id: string;
  sender: 'recruiter' | 'candidate';
  content: string;
  timestamp: Date;
  type: 'email' | 'response' | 'system';
  emailSubject?: string;
  emailBody?: string;
}

interface EmailTemplate {
  subject: string;
  body: string;
  availableDates: string[];
}

export default function Interviews() {
  const [selectedEvent, setSelectedEvent] = useState<InterviewEvent | null>(null);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [showCandidateDetail, setShowCandidateDetail] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<ShortlistedCandidate | null>(null);
  const [emailTemplate, setEmailTemplate] = useState<EmailTemplate>({
    subject: '',
    body: '',
    availableDates: []
  });

  // Generate shortlisted candidates from applicants data
  const shortlistedCandidates: ShortlistedCandidate[] = useMemo(() => {
    return applicants
      .filter(applicant => applicant.status === 'Interview Scheduled' || applicant.status === 'Interview Completed')
      .map(applicant => ({
        id: `shortlist-${applicant.id}`,
        candidateId: applicant.candidateId,
        name: applicant.candidate?.name || 'Unknown Candidate',
        email: applicant.candidate?.email || '',
        jobTitle: applicant.candidate?.preferredRoles[0] || 'Software Engineer',
        jobId: applicant.jobId,
        matchScore: applicant.matchScore,
        experience: applicant.candidate?.experience || 0,
        skills: applicant.candidate?.skills || [],
        shortlistedDate: new Date(applicant.appliedDate.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days after application
        status: applicant.status === 'Interview Completed' ? 'completed' : 'pending',
        chatMessages: []
      }));
  }, []);

  // Generate interview events from applicants data
  const initialInterviewEvents: InterviewEvent[] = useMemo(() => {
    const events: InterviewEvent[] = [];
    const today = new Date();
    
    // Create sample interview events for the next 2 weeks
    applicants.forEach((applicant, index) => {
      if (applicant.status === 'Interview Scheduled' || applicant.status === 'Interview Completed') {
        const interviewDate = new Date(today);
        interviewDate.setDate(today.getDate() + (index % 14)); // Spread over 2 weeks
        
        events.push({
          id: `interview-${applicant.id}`,
          candidateId: applicant.candidateId,
          candidateName: applicant.candidate?.name || 'Unknown Candidate',
          candidateEmail: applicant.candidate?.email || '',
          candidateAvatar: undefined,
          jobId: applicant.jobId,
          jobTitle: applicant.candidate?.preferredRoles[0] || 'Software Engineer',
          companyName: 'ConvexHire',
          date: interviewDate,
          time: `${10 + (index % 8)}:00`, // 10 AM to 6 PM (10, 11, 12, 13, 14, 15, 16, 17)
          duration: 60,
          type: 'in-person',
          status: applicant.status === 'Interview Completed' ? 'completed' : 
                  index % 4 === 0 ? 'confirmed' : 'scheduled',
          location: index % 3 === 0 ? 'Conference Room A' : index % 3 === 1 ? 'Conference Room B' : 'Main Conference Room',
          interviewers: ['John Smith', 'Sarah Wilson', 'Mike Johnson', 'Lisa Chen'],
          notes: applicant.notes,
          candidateExperience: applicant.candidate?.experience || 0,
          candidateSkills: applicant.candidate?.skills || [],
          matchScore: applicant.matchScore,
          interviewRound: 1,
          totalRounds: 3
        });
      }
    });

    // Add some additional sample events for the 3-day period
    const additionalEvents: InterviewEvent[] = [
      {
        id: 'interview-sample-1',
        candidateId: 'can-extra-1',
        candidateName: 'Sarah Johnson',
        candidateEmail: 'sarah.johnson@email.com',
        jobId: 'job-001',
      jobTitle: 'Senior Frontend Engineer',
        companyName: 'ConvexHire',
        date: new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000), // Tomorrow (Sunday)
        time: '14:00',
        duration: 90,
        type: 'in-person',
        status: 'confirmed',
        location: 'Conference Room A',
        interviewers: ['Jane Doe', 'Tom Wilson', 'Emily Brown', 'David Lee'],
        notes: 'Second round technical interview focusing on React and system design',
        candidateExperience: 6,
        candidateSkills: ['React', 'TypeScript', 'Node.js', 'GraphQL'],
        matchScore: 92,
        interviewRound: 2,
        totalRounds: 3
      },
      {
        id: 'interview-sample-2',
        candidateId: 'can-extra-2',
        candidateName: 'Michael Chen',
        candidateEmail: 'michael.chen@email.com',
        jobId: 'job-002',
      jobTitle: 'Data Scientist',
        companyName: 'ConvexHire',
        date: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow (Monday)
        time: '10:00',
        duration: 60,
        type: 'in-person',
        status: 'scheduled',
        location: 'Conference Room B',
        interviewers: ['Dr. Lisa Wang', 'Alex Rodriguez', 'Maria Garcia', 'James Taylor'],
        notes: 'Initial screening interview for data science position',
        candidateExperience: 5,
        candidateSkills: ['Python', 'Machine Learning', 'TensorFlow', 'SQL'],
        matchScore: 88,
        interviewRound: 1,
        totalRounds: 2
      },
      {
        id: 'interview-sample-3',
        candidateId: 'can-extra-3',
        candidateName: 'Emily Davis',
        candidateEmail: 'emily.davis@email.com',
        jobId: 'job-003',
      jobTitle: 'Product Manager',
        companyName: 'ConvexHire',
        date: new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000), // Tomorrow (Sunday)
        time: '15:00',
        duration: 45,
        type: 'in-person',
        status: 'scheduled',
        location: 'Conference Room B',
        interviewers: ['Mark Thompson', 'Jennifer Davis', 'Robert Kim', 'Amanda White'],
        notes: 'In-person interview for product management role',
        candidateExperience: 7,
        candidateSkills: ['Product Strategy', 'Agile', 'User Research', 'Analytics'],
        matchScore: 85,
        interviewRound: 1,
        totalRounds: 4
      },
      {
        id: 'interview-sample-4',
        candidateId: 'can-extra-4',
        candidateName: 'Alex Rodriguez',
        candidateEmail: 'alex.rodriguez@email.com',
        jobId: 'job-004',
        jobTitle: 'Backend Engineer',
        companyName: 'ConvexHire',
        date: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow (Monday)
        time: '16:00',
        duration: 60,
      type: 'in-person',
        status: 'confirmed',
        location: 'Main Conference Room',
        interviewers: ['Tom Wilson', 'Sarah Johnson', 'Michael Chen', 'Lisa Anderson'],
        notes: 'Technical interview focusing on system design and algorithms',
        candidateExperience: 4,
        candidateSkills: ['Node.js', 'Python', 'PostgreSQL', 'Docker'],
        matchScore: 87,
        interviewRound: 1,
        totalRounds: 3
      }
    ];

    return [...events, ...additionalEvents].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, []);

  const [interviewEvents, setInterviewEvents] = useState<InterviewEvent[]>(initialInterviewEvents);

  const handleEventClick = (event: InterviewEvent) => {
    setSelectedEvent(event);
    setShowEventDetails(true);
  };

  const handleDateChange = (date: Date) => {
    // Handle date change if needed
    console.log('Date changed to:', date);
  };

  const handleMarkComplete = (eventId: string) => {
    setInterviewEvents(prevEvents => 
      prevEvents.map(event => 
        event.id === eventId 
          ? { ...event, status: 'completed' as const }
          : event
      )
    );
    
    toast({
      title: "Interview Completed",
      description: "Interview has been marked as complete and candidate is now available for final selection."
    });
  };

  const handleInformCandidate = (candidate: ShortlistedCandidate) => {
    setSelectedCandidate(candidate);
    
    // Generate available dates for the next 2 weeks
    const availableDates = [];
    const today = new Date();
    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      if (date.getDay() !== 0 && date.getDay() !== 6) { // Exclude weekends
        availableDates.push(date.toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }));
      }
    }
    
    setEmailTemplate({
      subject: `Interview Invitation - ${candidate.jobTitle} Position at ConvexHire`,
      body: `Dear ${candidate.name},\n\nWe are pleased to invite you for an interview for the ${candidate.jobTitle} position at ConvexHire.\n\nBased on your impressive background and ${candidate.matchScore}% match with our requirements, we believe you would be a great fit for our team.\n\nPlease let us know your availability from the following dates:\n\n${availableDates.slice(0, 5).map(date => `• ${date}`).join('\n')}\n\nWe look forward to hearing from you.\n\nBest regards,\nConvexHire Recruitment Team`,
      availableDates: availableDates.slice(0, 5)
    });
    
    setShowEmailDialog(true);
  };

  const handleSendEmail = () => {
    if (!selectedCandidate) return;
    
    // Add email to chat messages
    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'recruiter',
      content: 'Interview invitation email sent',
      timestamp: new Date(),
      type: 'email',
      emailSubject: emailTemplate.subject,
      emailBody: emailTemplate.body
    };
    
    // Update candidate status
    selectedCandidate.status = 'contacted';
    selectedCandidate.chatMessages = [...(selectedCandidate.chatMessages || []), newMessage];
    
    toast({
      title: "Email Sent",
      description: `Interview invitation sent to ${selectedCandidate.name}`,
    });
    
    setShowEmailDialog(false);
  };

  const handleCandidateClick = (candidate: ShortlistedCandidate) => {
    setSelectedCandidate(candidate);
    setShowCandidateDetail(true);
  };

  const getStatusBadge = (status: ShortlistedCandidate['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'contacted':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">Contacted</Badge>;
      case 'responded':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">Responded</Badge>;
      case 'scheduled':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">Scheduled</Badge>;
      case 'completed':
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100">Completed</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  // Function to parse candidate response and extract date/time
  const parseCandidateAvailability = (message: string) => {
    // Simple regex patterns to extract date and time from common formats
    const datePatterns = [
      /(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\s+(?:December|January|February|March|April|May|June|July|August|September|October|November)\s+\d{1,2}(?:st|nd|rd|th)?/gi,
      /\d{1,2}\/\d{1,2}\/\d{4}/g,
      /\d{4}-\d{2}-\d{2}/g
    ];
    
    const timePatterns = [
      /\d{1,2}:\d{2}\s*(?:AM|PM)/gi,
      /\d{1,2}\s*(?:AM|PM)/gi
    ];
    
    let extractedDate = null;
    let extractedTime = null;
    
    // Try to extract date
    for (const pattern of datePatterns) {
      const match = message.match(pattern);
      if (match) {
        try {
          extractedDate = new Date(match[0]);
          if (!isNaN(extractedDate.getTime())) {
            break;
          }
        } catch (e) {
          // Continue to next pattern
        }
      }
    }
    
    // Try to extract time
    for (const pattern of timePatterns) {
      const match = message.match(pattern);
      if (match) {
        extractedTime = match[0];
        break;
      }
    }
    
    return { date: extractedDate, time: extractedTime };
  };

  // Function to automatically schedule interview based on candidate response
  const scheduleInterviewFromResponse = (candidate: ShortlistedCandidate, message: string) => {
    const { date, time } = parseCandidateAvailability(message);
    
    if (date && time) {
      // Parse time and set it to the date
      const timeMatch = time.match(/(\d{1,2}):?(\d{2})?\s*(AM|PM)/i);
      if (timeMatch) {
        let hours = parseInt(timeMatch[1]);
        const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
        const period = timeMatch[3].toUpperCase();
        
        if (period === 'PM' && hours !== 12) {
          hours += 12;
        } else if (period === 'AM' && hours === 12) {
          hours = 0;
        }
        
        date.setHours(hours, minutes, 0, 0);
        
        // Check if the date is in the future and on a weekday
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (date > today && date.getDay() >= 1 && date.getDay() <= 5) {
          const newInterviewEvent: InterviewEvent = {
            id: `interview-${candidate.id}-${Date.now()}`,
            candidateId: candidate.candidateId,
            candidateName: candidate.name,
            candidateEmail: candidate.email,
            jobId: candidate.jobId,
            jobTitle: candidate.jobTitle,
            companyName: 'ConvexHire',
            date: date,
            time: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`,
            duration: 60,
            type: 'in-person',
            status: 'scheduled',
            location: 'Conference Room A',
            interviewers: ['John Smith', 'Sarah Wilson'],
            notes: `Interview scheduled based on candidate's availability confirmation: "${message}"`,
            candidateExperience: candidate.experience,
            candidateSkills: candidate.skills,
            matchScore: candidate.matchScore,
            interviewRound: 1,
            totalRounds: 3
          };
          
          // Add to interview events
          setInterviewEvents(prevEvents => [...prevEvents, newInterviewEvent]);
          
          return newInterviewEvent;
        }
      }
    }
    
    return null;
  };

  // Get upcoming interviews count
  const upcomingInterviews = interviewEvents.filter(event => 
    event.status === 'scheduled' || event.status === 'confirmed'
  ).length;

  // Get today's interviews
  const todayInterviews = interviewEvents.filter(event => {
    const today = new Date();
    const eventDate = new Date(event.date);
    return eventDate.toDateString() === today.toDateString();
  }).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
      <div>
          <h1 className="text-3xl font-bold">Interview Calendar</h1>
          <p className="text-muted-foreground">Manage all your interviews in one place</p>
      </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
                        Schedule Interview
                      </Button>
                            </div>
                            
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600" />
                          </div>
              <div>
                <p className="text-2xl font-bold">{upcomingInterviews}</p>
                <p className="text-sm text-muted-foreground">Upcoming Interviews</p>
                </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{todayInterviews}</p>
                <p className="text-sm text-muted-foreground">Today's Interviews</p>
              </div>
            </div>
                      </CardContent>
                    </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
                </div>
              <div>
                <p className="text-2xl font-bold">{interviewEvents.length}</p>
                <p className="text-sm text-muted-foreground">Total Scheduled</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Calendar */}
      <InterviewCalendar 
        events={interviewEvents}
        onEventClick={handleEventClick}
        onDateChange={handleDateChange}
        onMarkComplete={handleMarkComplete}
      />

      {/* Shortlisted Candidates List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Shortlisted Candidates
          </CardTitle>
          <p className="text-muted-foreground">
            Manage candidates who have been shortlisted for interviews
          </p>
        </CardHeader>
        <CardContent>
          {shortlistedCandidates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {shortlistedCandidates.map((candidate) => (
                <Card 
                  key={candidate.id} 
                  className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] h-fit"
                  onClick={() => handleCandidateClick(candidate)}
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col space-y-3">
                      {/* Header with avatar and name */}
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 flex-shrink-0">
                          <AvatarFallback className="text-xs">
                            {candidate.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-semibold text-sm truncate">{candidate.name}</h4>
                            {getStatusBadge(candidate.status)}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{candidate.jobTitle}</p>
                        </div>
                      </div>

                      {/* Metrics */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs flex items-center gap-1 flex-shrink-0">
                          <Target className="h-3 w-3" />
                          {candidate.matchScore}%
                        </Badge>
                        <Badge variant="outline" className="text-xs flex items-center gap-1 flex-shrink-0">
                          <Clock className="h-3 w-3" />
                          {candidate.experience}y
                        </Badge>
                      </div>

                      {/* Skills - limited to prevent overflow */}
                      <div className="flex gap-1 flex-wrap">
                        {candidate.skills.slice(0, 2).map((skill) => (
                          <Badge key={skill} variant="secondary" className="text-xs truncate max-w-[80px]">
                            {skill}
                          </Badge>
                        ))}
                        {candidate.skills.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{candidate.skills.length - 2}
                          </Badge>
                        )}
                      </div>

                      {/* Action button */}
                      <div className="pt-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="w-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCandidateClick(candidate);
                          }}
                        >
                          <MessageSquare className="h-3 w-3 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No shortlisted candidates yet</p>
              <p className="text-sm">Candidates will appear here after being shortlisted from the Shortlist tab</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Send Interview Invitation
            </DialogTitle>
            <DialogDescription>
              Send interview invitation to {selectedCandidate?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="email-subject">Subject</Label>
              <Input
                id="email-subject"
                value={emailTemplate.subject}
                onChange={(e) => setEmailTemplate(prev => ({ ...prev, subject: e.target.value }))}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="email-body">Email Body</Label>
              <Textarea
                id="email-body"
                value={emailTemplate.body}
                onChange={(e) => setEmailTemplate(prev => ({ ...prev, body: e.target.value }))}
                className="mt-1 min-h-[200px]"
                placeholder="Enter your email content..."
              />
            </div>
            
            <div>
              <Label>Available Interview Dates</Label>
              <div className="mt-2 p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">
                  The following dates will be included in the email:
                </p>
                <ul className="text-sm space-y-1">
                  {emailTemplate.availableDates.map((date, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      {date}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEmailDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendEmail}>
              <Send className="h-4 w-4 mr-2" />
              Send Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Candidate Detail Modal with Chat */}
      <Dialog open={showCandidateDetail} onOpenChange={setShowCandidateDetail}>
        <DialogContent className="max-w-6xl w-[95vw] h-[90vh] flex flex-col p-0">
          {selectedCandidate && (
            <>
              <DialogHeader className="px-6 py-4 border-b">
                <DialogTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {selectedCandidate.name} - Interview Communication
                </DialogTitle>
                <DialogDescription>
                  {selectedCandidate.jobTitle} • {selectedCandidate.email}
                </DialogDescription>
              </DialogHeader>
              
              <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Candidate Info */}
                      <div className="space-y-4">
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base">Candidate Details</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-12 w-12 flex-shrink-0">
                                <AvatarFallback>
                                  {selectedCandidate.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 flex-1">
                                <h4 className="font-semibold truncate">{selectedCandidate.name}</h4>
                                <p className="text-sm text-muted-foreground truncate">{selectedCandidate.email}</p>
                              </div>
                            </div>
                            
                            <Separator />
                            
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Match Score</span>
                                <Badge variant="outline" className="flex items-center gap-1">
                                  <Target className="h-3 w-3" />
                                  {selectedCandidate.matchScore}%
                                </Badge>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Experience</span>
                                <span className="text-sm text-muted-foreground">{selectedCandidate.experience} years</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Status</span>
                                {getStatusBadge(selectedCandidate.status)}
                              </div>
                            </div>
                            
                            <Separator />
                            
                            <div>
                              <h5 className="text-sm font-medium mb-2">Skills</h5>
                              <div className="flex flex-wrap gap-1">
                                {selectedCandidate.skills.map((skill) => (
                                  <Badge key={skill} variant="secondary" className="text-xs">
                                    {skill}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                      
                      {/* Chat Interface */}
                      <div className="lg:col-span-2">
                        <Card className="h-[600px] flex flex-col">
                          <CardHeader className="pb-3 flex-shrink-0">
                            <CardTitle className="text-base flex items-center gap-2">
                              <MessageSquare className="h-5 w-5" />
                              Communication History
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="flex-1 flex flex-col min-h-0">
                            <ScrollArea className="flex-1 pr-4">
                        <div className="space-y-4">
                          {selectedCandidate.chatMessages && selectedCandidate.chatMessages.length > 0 ? (
                            selectedCandidate.chatMessages.map((message) => (
                              <div 
                                key={message.id}
                                className={cn(
                                  "flex gap-3",
                                  message.sender === 'recruiter' ? "justify-end" : "justify-start"
                                )}
                              >
                                {message.sender === 'candidate' && (
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback className="text-xs">
                                      {selectedCandidate.name.split(' ').map(n => n[0]).join('')}
                                    </AvatarFallback>
                                  </Avatar>
                                )}
                                <div className={cn(
                                  "max-w-[70%] space-y-1",
                                  message.sender === 'recruiter' ? "text-right" : "text-left"
                                )}>
                                  <div className={cn(
                                    "p-3 rounded-lg text-sm",
                                    message.sender === 'recruiter' 
                                      ? "bg-primary text-primary-foreground" 
                                      : "bg-muted"
                                  )}>
                                    {message.type === 'email' && message.emailSubject && (
                                      <div className="mb-2 pb-2 border-b border-white/20">
                                        <p className="font-medium text-xs opacity-90">Email Sent</p>
                                        <p className="text-xs opacity-75">{message.emailSubject}</p>
                                      </div>
                                    )}
                                    <p>{message.content}</p>
                                    {message.type === 'email' && message.emailBody && (
                                      <details className="mt-2">
                                        <summary className="text-xs opacity-75 cursor-pointer">View Email Content</summary>
                                        <div className="mt-2 p-2 bg-black/20 rounded text-xs whitespace-pre-wrap">
                                          {message.emailBody}
                                        </div>
                                      </details>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    {message.timestamp.toLocaleString()}
                                  </p>
                                </div>
                                {message.sender === 'recruiter' && (
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                                      R
                                    </AvatarFallback>
                                  </Avatar>
                                )}
                              </div>
                            ))
                          ) : (
                            // Initial conversation view - show candidate info and email preview
                            <div className="space-y-6">
                              {/* Candidate Summary */}
                              <div className="bg-muted/30 p-4 rounded-lg">
                                <h4 className="font-semibold mb-3 flex items-center gap-2">
                                  <User className="h-4 w-4" />
                                  Candidate Summary
                                </h4>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Name:</span>
                                    <span className="font-medium">{selectedCandidate.name}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Email:</span>
                                    <span className="font-medium">{selectedCandidate.email}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Position:</span>
                                    <span className="font-medium">{selectedCandidate.jobTitle}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Match Score:</span>
                                    <Badge variant="outline" className="text-xs">
                                      <Target className="h-3 w-3 mr-1" />
                                      {selectedCandidate.matchScore}%
                                    </Badge>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Experience:</span>
                                    <span className="font-medium">{selectedCandidate.experience} years</span>
                                  </div>
                                </div>
                              </div>

                              {/* Email Preview */}
                              <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                                <h4 className="font-semibold mb-3 flex items-center gap-2 text-blue-900 dark:text-blue-100">
                                  <Mail className="h-4 w-4" />
                                  Interview Invitation Preview
                                </h4>
                                <div className="space-y-3 text-sm">
                                  <div>
                                    <span className="text-blue-700 dark:text-blue-300 font-medium">Subject:</span>
                                    <p className="text-blue-900 dark:text-blue-100 mt-1 text-xs">
                                      Interview Invitation - {selectedCandidate.jobTitle} Position at ConvexHire
                                    </p>
                                  </div>
                                  <div>
                                    <span className="text-blue-700 dark:text-blue-300 font-medium">Email Content:</span>
                                    <ScrollArea className="h-32 mt-2">
                                      <div className="p-3 bg-white dark:bg-gray-800 rounded border text-gray-900 dark:text-gray-100 text-xs whitespace-pre-wrap">
                                        {`Dear ${selectedCandidate.name},

We are pleased to invite you for an interview for the ${selectedCandidate.jobTitle} position at ConvexHire.

Based on your impressive background and ${selectedCandidate.matchScore}% match with our requirements, we believe you would be a great fit for our team.

Please let us know your availability from the following dates:

• Monday, December 16, 2024
• Tuesday, December 17, 2024
• Wednesday, December 18, 2024
• Thursday, December 19, 2024
• Friday, December 20, 2024

We look forward to hearing from you.

Best regards,
ConvexHire Recruitment Team`}
                                      </div>
                                    </ScrollArea>
                                  </div>
                                </div>
                              </div>

                              {/* Call to Action */}
                              <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                                <p className="text-green-800 dark:text-green-200 text-sm mb-3">
                                  Ready to send the interview invitation to {selectedCandidate.name}?
                                </p>
                                <Button 
                                  onClick={() => handleInformCandidate(selectedCandidate)}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  <Mail className="h-4 w-4 mr-2" />
                                  Send Interview Invitation
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                      
                      {selectedCandidate.chatMessages && selectedCandidate.chatMessages.length > 0 && (
                        <>
                          <Separator className="my-4 flex-shrink-0" />
                          
                          <div className="flex gap-2 flex-shrink-0">
                            <Button 
                              size="sm" 
                              onClick={() => handleInformCandidate(selectedCandidate)}
                              className="flex-1"
                            >
                              <Mail className="h-4 w-4 mr-2" />
                              Send Email
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                // Simulate candidate response with time confirmation
                                const responseMessage = 'Thank you for the invitation! I am available on Monday, December 16th at 2:00 PM. Looking forward to the interview.';
                                const response: ChatMessage = {
                                  id: `msg-${Date.now()}`,
                                  sender: 'candidate',
                                  content: responseMessage,
                                  timestamp: new Date(),
                                  type: 'response'
                                };
                                selectedCandidate.chatMessages = [...(selectedCandidate.chatMessages || []), response];
                                selectedCandidate.status = 'responded';
                                
                                // Try to automatically schedule the interview based on the response
                                const scheduledEvent = scheduleInterviewFromResponse(selectedCandidate, responseMessage);
                                
                                if (scheduledEvent) {
                                  // Add system message about automatic scheduling
                                  const systemMessage: ChatMessage = {
                                    id: `msg-system-${Date.now()}`,
                                    sender: 'recruiter',
                                    content: 'Interview automatically scheduled based on your availability confirmation.',
                                    timestamp: new Date(),
                                    type: 'system'
                                  };
                                  selectedCandidate.chatMessages = [...selectedCandidate.chatMessages, systemMessage];
                                  selectedCandidate.status = 'scheduled';
                                  
                                  toast({
                                    title: "Interview Scheduled",
                                    description: `Interview with ${selectedCandidate.name} has been automatically scheduled for ${scheduledEvent.date.toLocaleDateString()} at ${scheduledEvent.time}.`,
                                  });
                                } else {
                                  toast({
                                    title: "Response Received",
                                    description: `${selectedCandidate.name} has responded to the interview invitation. Please review and schedule manually.`,
                                  });
                                }
                              }}
                            >
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Simulate Response
                            </Button>
                          </div>
                        </>
                      )}
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}