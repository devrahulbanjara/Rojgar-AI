import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Send, Bot, User, MessageSquare, Search, Filter, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CandidatePoolData {
  id: string;
  name: string;
  skills: string[];
  appliedJob: string;
  status: 'Rejected' | 'Accepted' | 'In Progress';
  feedback: string;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  message: string;
  timestamp: Date;
}

export default function CandidatePool() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedCandidate, setSelectedCandidate] = useState<CandidatePoolData | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'bot',
      message: 'Hello! I\'m your AI recruitment assistant. I can help you analyze candidates, suggest matches, and provide insights about your candidate pool. How can I assist you today?',
      timestamp: new Date(Date.now() - 300000)
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages are added
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const candidatePoolData: CandidatePoolData[] = [
    {
      id: 'CP001',
      name: 'Rahul Dev Banjara',
      skills: ['React', 'TypeScript', 'Node.js', 'GraphQL'],
      appliedJob: 'Senior Frontend Engineer',
      status: 'In Progress',
      feedback: 'Strong technical skills, excellent for senior-level positions. Great communication skills.'
    },
    {
      id: 'CP002',
      name: 'Diwas Adhikari',
      skills: ['Python', 'Django', 'PostgreSQL', 'AWS'],
      appliedJob: 'Backend Developer',
      status: 'Accepted',
      feedback: 'Perfect fit for backend roles. Strong database knowledge and cloud experience.'
    },
    {
      id: 'CP003',
      name: 'Ashim Khatri Chetri',
      skills: ['Python', 'TensorFlow', 'Machine Learning', 'Data Analysis'],
      appliedJob: 'Senior Data Scientist',
      status: 'Rejected',
      feedback: 'Good technical skills but better suited for Junior AI Engineer role, not mid-level.'
    },
    {
      id: 'CP004',
      name: 'Sampada Poudel',
      skills: ['Product Management', 'Agile', 'Stakeholder Management', 'Analytics'],
      appliedJob: 'Product Manager',
      status: 'In Progress',
      feedback: 'Excellent product management skills. Strong analytical thinking and leadership qualities.'
    },
    {
      id: 'CP005',
      name: 'Ajit Koirala',
      skills: ['DevOps', 'Kubernetes', 'AWS', 'CI/CD', 'Terraform'],
      appliedJob: 'DevOps Engineer',
      status: 'Accepted',
      feedback: 'Outstanding DevOps expertise. Perfect for infrastructure and deployment roles.'
    },
    {
      id: 'CP006',
      name: 'Subham Joshi',
      skills: ['React', 'JavaScript', 'CSS', 'HTML'],
      appliedJob: 'Frontend Developer',
      status: 'In Progress',
      feedback: 'Good frontend skills, suitable for mid-level positions with some mentoring.'
    },
    {
      id: 'CP007',
      name: 'Sandeep Sharma',
      skills: ['Java', 'Spring Boot', 'Microservices', 'MySQL'],
      appliedJob: 'Backend Developer',
      status: 'Rejected',
      feedback: 'Solid Java skills but lacks experience with modern cloud technologies.'
    }
  ];

  const filteredCandidates = candidatePoolData.filter(candidate => {
    const matchesSearch = candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         candidate.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         candidate.appliedJob.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || candidate.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Accepted': return 'bg-green-100 text-green-800 border-green-200';
      case 'Rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'In Progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const CandidateDetailView = ({ candidate }: { candidate: CandidatePoolData }) => (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarFallback className="text-lg">
            {candidate.name.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="text-xl font-semibold">{candidate.name}</h3>
          <p className="text-sm text-muted-foreground">ID: {candidate.id}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium mb-2">Applied Position</h4>
          <p className="text-sm text-muted-foreground">{candidate.appliedJob}</p>
        </div>
        
        <div>
          <h4 className="font-medium mb-2">Status</h4>
          <Badge className={cn("text-xs", getStatusColor(candidate.status))}>
            {candidate.status}
          </Badge>
        </div>
      </div>
      
      <div>
        <h4 className="font-medium mb-2">Skills</h4>
        <div className="flex flex-wrap gap-2">
          {candidate.skills.map((skill) => (
            <Badge key={skill} variant="secondary" className="text-xs">
              {skill}
            </Badge>
          ))}
        </div>
      </div>
      
      <div>
        <h4 className="font-medium mb-2">Feedback</h4>
        <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
          {candidate.feedback}
        </p>
      </div>
    </div>
  );

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      message: newMessage,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);

    // Simulate AI response
    setTimeout(() => {
      const botResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        message: generateAIResponse(newMessage),
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, botResponse]);
    }, 1000);

    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      handleSendMessage();
    }
  };

  const generateAIResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();
    
    if (message.includes('candidate') && message.includes('react')) {
      return 'I found several React candidates in your pool. Rahul Dev Banjara and Subham Joshi both have React experience. Rahul has more senior-level skills with TypeScript and GraphQL, while Subham is better suited for mid-level positions.';
    } else if (message.includes('status') || message.includes('progress')) {
      return 'Currently, you have 2 accepted candidates, 2 rejected candidates, and 3 candidates in progress. The acceptance rate is 28.6%. Would you like me to analyze the rejection reasons?';
    } else if (message.includes('skill') || message.includes('technology')) {
      return 'Your candidate pool has diverse skills: Frontend (React, JavaScript), Backend (Python, Java, Node.js), DevOps (Kubernetes, AWS), and Data Science (Machine Learning, TensorFlow). The most common skills are React and Python.';
    } else if (message.includes('recommend') || message.includes('suggest')) {
      return 'Based on your current openings, I recommend prioritizing Diwas Adhikari and Ajit Koirala as they have been accepted and have strong technical skills. For the rejected candidates, consider Ashim Khatri Chetri for junior AI roles.';
    } else {
      return 'I can help you with candidate analysis, skill matching, status updates, and recruitment insights. Try asking about specific candidates, skills, or job matches!';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Candidate Pool</h1>
        <p className="text-muted-foreground">Manage your candidate database and get AI-powered insights</p>
      </div>

      <div className="space-y-6">
        {/* Chat Interface */}
        <div>
          <Card className="h-[500px] flex flex-col">
            <CardHeader className="pb-3 flex-shrink-0">
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                AI Recruitment Assistant
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0 min-h-0">
              <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
                <div className="space-y-4 pb-4 min-h-full">
                  {chatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        'flex gap-3',
                        message.type === 'user' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      {message.type === 'bot' && (
                        <Avatar className="h-8 w-8 bg-primary flex-shrink-0">
                          <AvatarFallback>
                            <Bot className="h-4 w-4 text-primary-foreground" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={cn(
                          'max-w-[80%] rounded-lg px-3 py-2 text-sm',
                          message.type === 'user'
                            ? 'bg-primary text-primary-foreground ml-auto'
                            : 'bg-muted'
                        )}
                      >
                        <p className="whitespace-pre-wrap break-words">{message.message}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      {message.type === 'user' && (
                        <Avatar className="h-8 w-8 bg-secondary flex-shrink-0">
                          <AvatarFallback>
                            <User className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))}
                  {/* Invisible element to scroll to */}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              <div className="p-4 border-t flex-shrink-0">
                <div className="flex gap-2">
                  <Input
                    placeholder="Ask about candidates, skills, or get insights..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    className="flex-1"
                  />
                  <Button onClick={handleSendMessage} size="sm">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Candidate Table */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Candidate Database
              </CardTitle>
              <div className="flex gap-4 mt-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search candidates, skills, or jobs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-input rounded-md bg-background"
                >
                  <option value="all">All Status</option>
                  <option value="Accepted">Accepted</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Feedback</TableHead>
                      <TableHead className="w-16">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCandidates.map((candidate) => (
                      <TableRow key={candidate.id}>
                        <TableCell className="font-medium">{candidate.name}</TableCell>
                        <TableCell>
                          <Badge className={cn("text-xs", getStatusColor(candidate.status))}>
                            {candidate.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <p className="text-sm text-muted-foreground truncate" title={candidate.feedback}>
                            {candidate.feedback}
                          </p>
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setSelectedCandidate(candidate)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Candidate Details</DialogTitle>
                              </DialogHeader>
                              {selectedCandidate && <CandidateDetailView candidate={selectedCandidate} />}
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {filteredCandidates.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No candidates found matching your criteria.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
