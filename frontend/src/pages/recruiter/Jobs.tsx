import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { Plus, FileText, Users, Calendar, Edit, Archive, Sparkles, Clock, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Job {
  id: string;
  title: string;
  status: 'Draft' | 'Active' | 'Closed' | 'Expired';
  applicants: number;
  datePosted: string;
  expiryDate: string;
  daysLeft: number;
  assignedTo: string;
  department: string;
  location: string;
  salary: string;
  currency: string;
  description?: string;
}

export default function Jobs() {
  const [jobs, setJobs] = useState<Job[]>([
    { id: '1', title: 'Senior Frontend Engineer', status: 'Active', applicants: 23, datePosted: '2024-01-15', expiryDate: '2024-01-20', daysLeft: 2, assignedTo: 'John Smith', department: 'Engineering', location: 'San Francisco, CA', salary: '150k-200k', currency: 'USD' },
    { id: '2', title: 'Product Manager', status: 'Expired', applicants: 45, datePosted: '2024-01-10', expiryDate: '2024-01-15', daysLeft: 0, assignedTo: 'Sarah Chen', department: 'Product', location: 'Remote', salary: '130k-180k', currency: 'USD' },
    { id: '3', title: 'Data Scientist', status: 'Draft', applicants: 0, datePosted: '-', expiryDate: '-', daysLeft: 0, assignedTo: 'Mike Johnson', department: 'Data', location: 'New York, NY', salary: '140k-190k', currency: 'USD' },
    { id: '4', title: 'DevOps Engineer', status: 'Closed', applicants: 67, datePosted: '2023-12-20', expiryDate: '2023-12-25', daysLeft: 0, assignedTo: 'Emily Davis', department: 'Infrastructure', location: 'Austin, TX', salary: '120k-170k', currency: 'USD' },
    { id: '5', title: 'Software Engineer', status: 'Active', applicants: 12, datePosted: '2024-01-18', expiryDate: '2024-01-25', daysLeft: 5, assignedTo: 'Raj Sharma', department: 'Engineering', location: 'Kathmandu, Nepal', salary: '15L-25L', currency: 'NPR' },
  ]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [jdHistory, setJdHistory] = useState([
    { id: 1, title: 'Senior Frontend Engineer', createdAt: '2024-01-14', keywords: 'React, TypeScript, GraphQL' },
    { id: 2, title: 'Backend Developer', createdAt: '2024-01-08', keywords: 'Node.js, PostgreSQL, AWS' },
  ]);

  const [newJob, setNewJob] = useState({
    title: '',
    keywords: '',
    skills: '',
    generatedJD: '',
    location: '',
    salary: '',
    currency: 'NPR', // Default to NPR as requested
    department: '',
    expiryDays: '5',
  });

  const generateJD = () => {
    // Mock AI JD generation
    const mockJD = `We are seeking a talented ${newJob.title} to join our innovative team.

Key Responsibilities:
• Design and implement scalable solutions using ${newJob.skills || 'modern technologies'}
• Collaborate with cross-functional teams to deliver high-quality products
• Mentor junior team members and contribute to technical decision-making
• Drive continuous improvement in our development processes

Required Qualifications:
• 5+ years of experience in software development
• Strong expertise in ${newJob.skills || 'relevant technologies'}
• Excellent problem-solving and communication skills
• Bachelor's degree in Computer Science or related field

We offer competitive compensation, comprehensive benefits, and a culture of innovation.`;

    setNewJob({ ...newJob, generatedJD: mockJD });
    setJdHistory([
      { id: jdHistory.length + 1, title: newJob.title, createdAt: new Date().toISOString().split('T')[0], keywords: newJob.keywords },
      ...jdHistory
    ]);
    toast({
      title: "JD Generated",
      description: "AI has generated a job description based on your inputs."
    });
  };

  const publishJob = () => {
    const postedDate = new Date();
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + parseInt(newJob.expiryDays));
    
    const newJobEntry: Job = {
      id: String(jobs.length + 1),
      title: newJob.title,
      status: 'Active',
      applicants: Math.floor(Math.random() * 30) + 5, // Mock applicants
      datePosted: postedDate.toISOString().split('T')[0],
      expiryDate: expiryDate.toISOString().split('T')[0],
      daysLeft: parseInt(newJob.expiryDays),
      assignedTo: 'Current User',
      department: newJob.department,
      location: newJob.location,
      salary: newJob.salary,
      currency: newJob.currency,
      description: newJob.generatedJD,
    };
    
    setJobs([newJobEntry, ...jobs]);
    setDialogOpen(false);
    setCurrentStep(1);
    setNewJob({
      title: '',
      keywords: '',
      skills: '',
      generatedJD: '',
      location: '',
      salary: '',
      currency: 'NPR',
      department: '',
      expiryDays: '5',
    });
    
    toast({
      title: "Job Published",
      description: `${newJob.title} has been published successfully and will expire in ${newJob.expiryDays} days.`
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'default';
      case 'Draft': return 'secondary';
      case 'Expired': return 'destructive';
      case 'Closed': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Jobs Management</h1>
        <p className="text-muted-foreground">Create, manage, and track all your job postings</p>
      </div>

      {/* Create JD Section */}
      <Card className="border-primary/20">
        <CardHeader className="bg-gradient-subtle">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI-Powered JD Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Input
              placeholder="Enter job title or keywords..."
              value={newJob.keywords}
              onChange={(e) => setNewJob({ ...newJob, keywords: e.target.value })}
              className="flex-1"
            />
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Job
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Job Posting</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-6">
                  {/* Step Indicator */}
                  <div className="flex items-center justify-between">
                    {[1, 2, 3].map((step) => (
                      <div key={step} className="flex items-center">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${currentStep >= step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                          {step}
                        </div>
                        {step < 3 && <ChevronRight className="h-4 w-4 mx-2 text-muted-foreground" />}
                      </div>
                    ))}
                  </div>

                  {currentStep === 1 && (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="title">Job Title</Label>
                        <Input
                          id="title"
                          value={newJob.title}
                          onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                          placeholder="e.g., Senior Frontend Engineer"
                        />
                      </div>
                      <div>
                        <Label htmlFor="keywords">Keywords</Label>
                        <Input
                          id="keywords"
                          value={newJob.keywords}
                          onChange={(e) => setNewJob({ ...newJob, keywords: e.target.value })}
                          placeholder="e.g., remote, startup, fast-paced"
                        />
                      </div>
                      <div>
                        <Label htmlFor="skills">Required Skills</Label>
                        <Input
                          id="skills"
                          value={newJob.skills}
                          onChange={(e) => setNewJob({ ...newJob, skills: e.target.value })}
                          placeholder="e.g., React, TypeScript, GraphQL"
                        />
                      </div>
                      <Button onClick={() => { generateJD(); setCurrentStep(2); }} className="w-full">
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate JD with AI
                      </Button>
                    </div>
                  )}

                  {currentStep === 2 && (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="jd">Generated Job Description</Label>
                        <Textarea
                          id="jd"
                          value={newJob.generatedJD}
                          onChange={(e) => setNewJob({ ...newJob, generatedJD: e.target.value })}
                          className="min-h-[300px]"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setCurrentStep(1)}>Back</Button>
                        <Button onClick={() => setCurrentStep(3)} className="flex-1">Continue</Button>
                      </div>
                    </div>
                  )}

                  {currentStep === 3 && (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          value={newJob.location}
                          onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                          placeholder="e.g., San Francisco, CA or Remote"
                        />
                      </div>
                      <div>
                        <Label htmlFor="salary">Salary Range</Label>
                        <div className="flex gap-2">
                          <Select 
                            value={newJob.currency} 
                            onValueChange={(value) => setNewJob({ ...newJob, currency: value })}
                          >
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="NPR">NPR</SelectItem>
                              <SelectItem value="USD">USD</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            id="salary"
                            className="flex-1"
                            value={newJob.salary}
                            onChange={(e) => setNewJob({ ...newJob, salary: e.target.value })}
                            placeholder={newJob.currency === 'NPR' ? 'e.g., 15L-20L' : 'e.g., 150k-200k'}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {newJob.currency === 'NPR' 
                            ? 'Enter salary in Nepali Rupees (L = Lakh)' 
                            : 'Enter salary in US Dollars (k = thousand)'
                          }
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="department">Department</Label>
                        <Select value={newJob.department} onValueChange={(value) => setNewJob({ ...newJob, department: value })}>
                          <SelectTrigger id="department">
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Engineering">Engineering</SelectItem>
                            <SelectItem value="Product">Product</SelectItem>
                            <SelectItem value="Design">Design</SelectItem>
                            <SelectItem value="Data">Data</SelectItem>
                            <SelectItem value="Sales">Sales</SelectItem>
                            <SelectItem value="Marketing">Marketing</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="expiry">Job Expiry Duration</Label>
                        <Select value={newJob.expiryDays} onValueChange={(value) => setNewJob({ ...newJob, expiryDays: value })}>
                          <SelectTrigger id="expiry">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="3">3 days</SelectItem>
                            <SelectItem value="5">5 days</SelectItem>
                            <SelectItem value="7">7 days</SelectItem>
                            <SelectItem value="14">14 days</SelectItem>
                            <SelectItem value="30">30 days</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setCurrentStep(2)}>Back</Button>
                        <Button onClick={publishJob} className="flex-1">Publish Job</Button>
                      </div>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* JD History */}
          <div className="mt-4">
            <p className="text-sm text-muted-foreground mb-2">Recent JD History:</p>
            <div className="flex gap-2 flex-wrap">
              {jdHistory.slice(0, 3).map((jd) => (
                <Badge key={jd.id} variant="secondary" className="cursor-pointer">
                  {jd.title} • {jd.createdAt}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Jobs Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Applicants</TableHead>
                <TableHead>Salary</TableHead>
                <TableHead>Date Posted</TableHead>
                <TableHead>Time Until Expiry</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="font-medium">{job.title}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(job.status)}>
                      {job.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      {job.applicants}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">
                      {job.currency} {job.salary}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {job.datePosted}
                    </div>
                  </TableCell>
                  <TableCell>
                    {job.status === 'Active' ? (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-warning" />
                        <span className={cn(
                          "text-sm font-medium",
                          job.daysLeft <= 2 ? "text-destructive" : "text-muted-foreground"
                        )}>
                          {job.daysLeft} days left
                        </span>
                      </div>
                    ) : job.status === 'Expired' ? (
                      <Badge variant="destructive">Ready for shortlisting</Badge>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>{job.assignedTo}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Edit className="h-3 w-3" />
                      </Button>
                      {job.status === 'Active' && (
                        <Button size="sm" variant="outline">
                          <Archive className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}