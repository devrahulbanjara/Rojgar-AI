import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { Search, Filter, MapPin, DollarSign, Calendar, Building2, Users, CheckCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function BrowseJobs() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');

  // Mock jobs data
  const jobs = [
    {
      id: 1,
      title: 'Senior Frontend Engineer',
      company: 'TechCorp Solutions',
      location: 'San Francisco, CA',
      locationType: 'Hybrid',
      salary: '$120k - $180k',
      postedDate: '2 days ago',
      matchScore: 85,
      tags: ['React', 'TypeScript', 'Node.js'],
      description: 'We are looking for a Senior Frontend Engineer to join our team...',
      requirements: [
        '5+ years of experience with React',
        'Strong TypeScript skills',
        'Experience with modern frontend tools'
      ],
      whyMatch: [
        'Your React experience matches perfectly',
        'You have the required TypeScript skills',
        'Your portfolio shows relevant projects'
      ]
    },
    {
      id: 2,
      title: 'Product Manager',
      company: 'InnovateTech',
      location: 'Remote',
      locationType: 'Remote',
      salary: '$100k - $150k',
      postedDate: '1 week ago',
      matchScore: 72,
      tags: ['Product Strategy', 'Agile', 'Analytics'],
      description: 'Join our product team to drive innovation...',
      requirements: [
        '3+ years in product management',
        'Experience with agile methodologies',
        'Strong analytical skills'
      ],
      whyMatch: [
        'Your product management background is relevant',
        'You have agile experience',
        'Good analytical skills demonstrated'
      ]
    },
    {
      id: 3,
      title: 'Full Stack Developer',
      company: 'StartupXYZ',
      location: 'New York, NY',
      locationType: 'On-site',
      salary: '$90k - $130k',
      postedDate: '3 days ago',
      matchScore: 78,
      tags: ['React', 'Python', 'AWS'],
      description: 'Looking for a versatile full stack developer...',
      requirements: [
        'Experience with React and Python',
        'AWS knowledge',
        'Strong problem-solving skills'
      ],
      whyMatch: [
        'Your full stack experience is relevant',
        'You have React expertise',
        'AWS certification is a plus'
      ]
    }
  ];

  const handleApply = () => {
    if (!coverLetter.trim()) {
      toast({
        title: "Cover Letter Required",
        description: "Please add a cover letter to your application.",
        variant: "destructive"
      });
      return;
    }
    toast({
      title: "Application Submitted",
      description: `Your application for ${selectedJob?.title} has been submitted successfully.`
    });
    setShowApplyDialog(false);
    setCoverLetter('');
  };

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Browse Jobs</h1>
        <p className="text-muted-foreground">Find your next opportunity</p>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title, company, or skills..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Filter Jobs</SheetTitle>
            </SheetHeader>
            <div className="space-y-6 mt-6">
              <div className="space-y-2">
                <Label>Location</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="All locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All locations</SelectItem>
                    <SelectItem value="remote">Remote</SelectItem>
                    <SelectItem value="sf">San Francisco</SelectItem>
                    <SelectItem value="ny">New York</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Experience Level</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="All levels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All levels</SelectItem>
                    <SelectItem value="entry">Entry</SelectItem>
                    <SelectItem value="mid">Mid</SelectItem>
                    <SelectItem value="senior">Senior</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Work Type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    <SelectItem value="remote">Remote</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                    <SelectItem value="onsite">On-site</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Salary Range</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input type="number" placeholder="Min" />
                  <Input type="number" placeholder="Max" />
                </div>
              </div>
              <Button className="w-full">Apply Filters</Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredJobs.map((job) => (
          <Card key={job.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{job.title}</CardTitle>
                  <CardDescription className="flex items-center gap-1 mt-1">
                    <Building2 className="h-3 w-3" />
                    {job.company}
                  </CardDescription>
                </div>
                <Badge variant="secondary">{job.matchScore}% match</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {job.location} • {job.locationType}
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  {job.salary}
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Posted {job.postedDate}
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {job.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setSelectedJob(job)}
                >
                  View Details
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    setSelectedJob(job);
                    setShowApplyDialog(true);
                  }}
                >
                  Apply
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Job Details Dialog */}
      {selectedJob && !showApplyDialog && (
        <Dialog open={!!selectedJob && !showApplyDialog} onOpenChange={() => setSelectedJob(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedJob.title}</DialogTitle>
              <DialogDescription>
                {selectedJob.company} • {selectedJob.location}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">Match Score</h3>
                  <span className="text-sm font-medium">{selectedJob.matchScore}%</span>
                </div>
                <Progress value={selectedJob.matchScore} className="mb-4" />
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Why you're a match:</h4>
                  {selectedJob.whyMatch.map((reason: string, i: number) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-success mt-0.5" />
                      <span className="text-sm">{reason}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-2">Job Description</h3>
                <p className="text-sm text-muted-foreground">{selectedJob.description}</p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Requirements</h3>
                <ul className="space-y-1">
                  {selectedJob.requirements.map((req: string, i: number) => (
                    <li key={i} className="text-sm text-muted-foreground">• {req}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedJob.tags.map((tag: string) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedJob(null)}>
                Close
              </Button>
              <Button onClick={() => setShowApplyDialog(true)}>
                Apply Now
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Apply Dialog */}
      <Dialog open={showApplyDialog} onOpenChange={setShowApplyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply for {selectedJob?.title}</DialogTitle>
            <DialogDescription>
              Submit your application to {selectedJob?.company}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium">Your profile will be shared:</p>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                <li>• Resume</li>
                <li>• Work experience</li>
                <li>• Skills and certifications</li>
              </ul>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cover-letter">Cover Letter</Label>
              <textarea
                id="cover-letter"
                placeholder="Tell the employer why you're interested in this role..."
                className="w-full min-h-[150px] p-3 border rounded-lg"
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="resume-upload">Resume (Optional)</Label>
              <Button variant="outline" className="w-full">
                Upload Different Resume
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApplyDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleApply}>
              Submit Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}