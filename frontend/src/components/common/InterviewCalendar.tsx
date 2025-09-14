import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  ChevronLeft, 
  ChevronRight, 
  Video, 
  Building2,
  Phone,
  Mail,
  FileText,
  Star,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface InterviewEvent {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  candidateAvatar?: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  date: Date;
  time: string;
  duration: number; // in minutes
  type: 'in-person';
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'rescheduled';
  location?: string;
  meetingLink?: string;
  interviewers: string[];
  notes?: string;
  candidateExperience: number;
  candidateSkills: string[];
  matchScore: number;
  interviewRound: number;
  totalRounds: number;
}

interface InterviewCalendarProps {
  events: InterviewEvent[];
  onEventClick: (event: InterviewEvent) => void;
  onDateChange?: (date: Date) => void;
  onMarkComplete?: (eventId: string) => void;
}

export default function InterviewCalendar({ events, onEventClick, onDateChange, onMarkComplete }: InterviewCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<InterviewEvent | null>(null);
  const [showEventDetails, setShowEventDetails] = useState(false);

  // Get the start of the 3-day period (Saturday)
  const getThreeDayStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    // Find the nearest Saturday
    const daysUntilSaturday = (6 - day) % 7;
    const saturday = new Date(d);
    saturday.setDate(d.getDate() + daysUntilSaturday);
    return saturday;
  };

  const threeDayStart = getThreeDayStart(currentDate);
  const weekDays = ['SAT', 'SUN', 'MON'];
  
  // Generate 3-day dates
  const weekDates = useMemo(() => {
    return weekDays.map((_, index) => {
      const date = new Date(threeDayStart);
      date.setDate(threeDayStart.getDate() + index);
      return date;
    });
  }, [threeDayStart]);

  // Generate time slots from 10 AM to 6 PM
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 10; hour <= 18; hour++) {
      slots.push({
        hour,
        time: `${hour}:00`,
        displayTime: hour === 12 ? '12:00 PM' : 
                    hour > 12 ? `${hour - 12}:00 PM` : 
                    `${hour}:00 AM`
      });
    }
    return slots;
  }, []);

  // Group events by date
  const eventsByDate = useMemo(() => {
    const grouped: { [key: string]: InterviewEvent[] } = {};
    
    events.forEach(event => {
      const eventDate = new Date(event.date);
      const dateKey = eventDate.toDateString();
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(event);
    });

    // Sort events by time within each day
    Object.keys(grouped).forEach(dateKey => {
      grouped[dateKey].sort((a, b) => {
        const timeA = a.time.split(':').map(Number);
        const timeB = b.time.split(':').map(Number);
        return timeA[0] * 60 + timeA[1] - (timeB[0] * 60 + timeB[1]);
      });
    });

    return grouped;
  }, [events]);

  const navigatePeriod = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction === 'next' ? 3 : -3));
    setCurrentDate(newDate);
    onDateChange?.(newDate);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    onDateChange?.(today);
  };

  const handleEventClick = (event: InterviewEvent) => {
    setSelectedEvent(event);
    setShowEventDetails(true);
    onEventClick(event);
  };

  const getEventStatusColor = (status: InterviewEvent['status']) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-50 text-blue-900 border-blue-300 hover:bg-blue-100';
      case 'confirmed': return 'bg-green-50 text-green-900 border-green-300 hover:bg-green-100';
      case 'completed': return 'bg-gray-50 text-gray-900 border-gray-300 hover:bg-gray-100';
      case 'cancelled': return 'bg-red-50 text-red-900 border-red-300 hover:bg-red-100';
      case 'rescheduled': return 'bg-yellow-50 text-yellow-900 border-yellow-300 hover:bg-yellow-100';
      default: return 'bg-gray-50 text-gray-900 border-gray-300 hover:bg-gray-100';
    }
  };

  const getEventTypeIcon = (type: InterviewEvent['type']) => {
    return <Building2 className="h-3 w-3" />;
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isPastDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Interview Calendar
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => navigatePeriod('prev')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={goToToday}
                className="min-w-[80px]"
              >
                Today
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => navigatePeriod('next')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="text-center">
            <h2 className="text-xl font-semibold">
              {threeDayStart.toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric' 
              })} - {weekDates[2].toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric',
                year: 'numeric'
              })}
            </h2>
          </div>
        </CardHeader>
        <CardContent>
          {/* Time-based Calendar Grid */}
          <div className="border border-border/50 rounded-lg overflow-hidden">
            {/* Header Row */}
            <div className="grid grid-cols-4 bg-muted/30 border-b border-border/50">
              <div className="p-3 text-center border-r border-border/30">
                <div className="text-sm font-medium text-muted-foreground">Time</div>
              </div>
              {weekDays.map((day, index) => (
                <div key={day} className="p-3 text-center border-r border-border/30 last:border-r-0">
                  <div className="text-sm font-medium text-muted-foreground mb-1">{day}</div>
                  <div className={cn(
                    "text-lg font-semibold p-2 rounded-full w-8 h-8 flex items-center justify-center mx-auto transition-colors",
                    isToday(weekDates[index]) && "bg-primary text-primary-foreground shadow-sm",
                    isPastDate(weekDates[index]) && !isToday(weekDates[index]) && "text-muted-foreground",
                    !isPastDate(weekDates[index]) && !isToday(weekDates[index]) && "hover:bg-muted/50"
                  )}>
                    {weekDates[index].getDate()}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Time Grid */}
            <div className="grid grid-cols-4">
              {/* Time Column */}
              <div className="border-r border-border/30">
                {timeSlots.map((slot) => (
                  <div key={slot.hour} className="h-16 border-b border-border/20 flex items-center justify-center">
                    <span className="text-sm font-medium text-muted-foreground">
                      {slot.displayTime}
                    </span>
                  </div>
                ))}
              </div>
              
              {/* Day Columns */}
              {weekDates.map((date, dayIndex) => {
                const dateKey = date.toDateString();
                const dayEvents = eventsByDate[dateKey] || [];
                
                return (
                  <div key={dayIndex} className="border-r border-border/30 last:border-r-0 relative">
                    {timeSlots.map((slot) => {
                      // Find events that start at this time slot
                      const eventsAtTime = dayEvents.filter(event => {
                        const eventHour = parseInt(event.time.split(':')[0]);
                        return eventHour === slot.hour;
                      });
                      
                      return (
                        <div 
                          key={slot.hour} 
                          className="h-16 border-b border-border/20 relative p-1 hover:bg-muted/20 transition-colors"
                        >
                          {eventsAtTime.map((event) => {
                            const duration = event.duration || 60;
                            const height = Math.max((duration / 60) * 64, 40); // Convert minutes to height
                            
                            return (
                              <Card 
                                key={event.id}
                                className={cn(
                                  "absolute left-1 right-1 cursor-pointer hover:shadow-lg transition-all duration-200 p-2 border-l-4 shadow-sm z-10",
                                  getEventStatusColor(event.status),
                                  "hover:scale-[1.02]"
                                )}
                                style={{ height: `${height}px` }}
                                onClick={() => handleEventClick(event)}
                              >
                                <div className="h-full flex flex-col justify-center">
                                  <div className="text-xs font-semibold truncate leading-tight">
                                    {event.candidateName}
                                  </div>
                                  <div className="text-xs text-muted-foreground truncate leading-tight">
                                    {event.jobTitle}
                                  </div>
                                </div>
                              </Card>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Event Details Modal */}
      <Dialog open={showEventDetails} onOpenChange={setShowEventDetails}>
        <DialogContent className="max-w-2xl">
          {selectedEvent && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Interview Details
                </DialogTitle>
                <DialogDescription>
                  {selectedEvent.date.toLocaleDateString('en-US', { 
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })} at {formatTime(selectedEvent.time)}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Candidate Information */}
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={selectedEvent.candidateAvatar} />
                    <AvatarFallback>
                      {selectedEvent.candidateName.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <div>
                      <h3 className="text-lg font-semibold">{selectedEvent.candidateName}</h3>
                      <p className="text-muted-foreground">{selectedEvent.candidateEmail}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {selectedEvent.candidateExperience} years experience
                      </Badge>
                      <Badge variant="secondary">
                        {selectedEvent.matchScore}% match
                      </Badge>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Interview Information */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Job Position</p>
                      <p className="text-sm text-muted-foreground">{selectedEvent.jobTitle}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Interviewers</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedEvent.interviewers.map((interviewer, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {interviewer}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge className={getEventStatusColor(selectedEvent.status)}>
                      {selectedEvent.status.charAt(0).toUpperCase() + selectedEvent.status.slice(1)}
                    </Badge>
                  </div>
                </div>

                {/* Skills */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Key Skills</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedEvent.candidateSkills.slice(0, 6).map((skill, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {selectedEvent.candidateSkills.length > 6 && (
                      <Badge variant="outline" className="text-xs">
                        +{selectedEvent.candidateSkills.length - 6} more
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Notes */}
                {selectedEvent.notes && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Notes</h4>
                    <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                      {selectedEvent.notes}
                    </p>
                  </div>
                )}

                {/* Mark as Complete Button */}
                {selectedEvent.status !== 'completed' && (
                  <div className="pt-4 border-t">
                    <Button 
                      onClick={() => {
                        onMarkComplete?.(selectedEvent.id);
                        setShowEventDetails(false);
                      }}
                      className="w-full"
                      variant="default"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark Interview as Complete
                    </Button>
                  </div>
                )}

              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
