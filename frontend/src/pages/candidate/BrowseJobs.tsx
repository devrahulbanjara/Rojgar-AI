import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [selectedResume, setSelectedResume] = useState('');
  const [showCompatibilityTest, setShowCompatibilityTest] = useState(false);
  const [compatibilityResults, setCompatibilityResults] = useState<any>(null);

  // Mock jobs data
  const jobs = [
    {
      id: 1,
      title: 'Senior Frontend Engineer',
      company: 'TechCorp Solutions',
      location: 'San Francisco, CA',
      locationType: 'Hybrid',
      salary: '120k - 180k',
      currency: 'USD',
      postedDate: '2 days ago',
      matchScore: 85,
      tags: ['React', 'TypeScript', 'Node.js'],
      description: 'We are looking for a Senior Frontend Engineer to join our team...',
      requirements: [
        '5+ years of experience with React',
        'Strong TypeScript skills',
        'Experience with modern frontend tools'
      ]
    },
    {
      id: 2,
      title: 'Product Manager',
      company: 'InnovateTech',
      location: 'Remote',
      locationType: 'Remote',
      salary: '100k - 150k',
      currency: 'USD',
      postedDate: '1 week ago',
      matchScore: 72,
      tags: ['Product Strategy', 'Agile', 'Analytics'],
      description: 'Join our product team to drive innovation...',
      requirements: [
        '3+ years in product management',
        'Experience with agile methodologies',
        'Strong analytical skills'
      ]
    },
    {
      id: 3,
      title: 'Full Stack Developer',
      company: 'StartupXYZ',
      location: 'New York, NY',
      locationType: 'On-site',
      salary: '90k - 130k',
      currency: 'USD',
      postedDate: '3 days ago',
      matchScore: 78,
      tags: ['React', 'Python', 'AWS'],
      description: 'Looking for a versatile full stack developer...',
      requirements: [
        'Experience with React and Python',
        'AWS knowledge',
        'Strong problem-solving skills'
      ]
    },
    {
      id: 4,
      title: 'Software Engineer',
      company: 'TechNepal',
      location: 'Kathmandu, Nepal',
      locationType: 'On-site',
      salary: '15L - 25L',
      currency: 'NPR',
      postedDate: '1 day ago',
      matchScore: 88,
      tags: ['React', 'Node.js', 'MongoDB'],
      description: 'Join our growing tech company in Kathmandu...',
      requirements: [
        '3+ years of experience with React',
        'Node.js and MongoDB experience',
        'Good communication skills in English and Nepali'
      ]
    }
  ];

  // Mock resumes data
  const availableResumes = [
    { 
      id: '1', 
      name: 'Software Engineer Resume', 
      isDefault: true,
      skills: ['React', 'TypeScript', 'Node.js', 'JavaScript', 'HTML', 'CSS']
    },
    { 
      id: '2', 
      name: 'Frontend Specialist Resume', 
      isDefault: false,
      skills: ['React', 'Vue.js', 'Angular', 'TypeScript', 'SASS', 'Webpack']
    },
    { 
      id: '3', 
      name: 'Full Stack Developer Resume', 
      isDefault: false,
      skills: ['React', 'Python', 'Django', 'PostgreSQL', 'Docker', 'AWS']
    }
  ];

  const handleCompatibilityTest = () => {
    if (!selectedResume || !selectedJob) return;
    
    const resume = availableResumes.find(r => r.id === selectedResume);
    if (!resume) return;

    // Mock compatibility analysis
    const jobSkills = selectedJob.tags;
    const resumeSkills = resume.skills;
    
    const matchingSkills = resumeSkills.filter(skill => 
      jobSkills.some(jobSkill => 
        jobSkill.toLowerCase().includes(skill.toLowerCase()) || 
        skill.toLowerCase().includes(jobSkill.toLowerCase())
      )
    );
    
    const missingSkills = jobSkills.filter(jobSkill => 
      !resumeSkills.some(skill => 
        skill.toLowerCase().includes(jobSkill.toLowerCase()) || 
        jobSkill.toLowerCase().includes(skill.toLowerCase())
      )
    );

    const compatibilityScore = Math.round((matchingSkills.length / jobSkills.length) * 100);

    setCompatibilityResults({
      score: compatibilityScore,
      matchingSkills,
      missingSkills,
      resumeName: resume.name,
      suggestions: missingSkills.length > 0 ? [
        `Add ${missingSkills.join(', ')} to your skills section`,
        'Update your experience descriptions to include relevant keywords',
        'Consider adding projects that demonstrate missing skills'
      ] : []
    });
    
    setShowCompatibilityTest(true);
  };

  const handleApply = () => {
    if (!selectedResume) {
      toast({
        title: "Resume Required",
        description: "Please select a resume for your application.",
        variant: "destructive"
      });
      return;
    }
    
    const resumeName = availableResumes.find(r => r.id === selectedResume)?.name;
    toast({
      title: "Application Submitted",
      description: `Your application for ${selectedJob?.title} has been submitted with ${resumeName}.`
    });
    setShowApplyDialog(false);
    setSelectedResume('');
    setShowCompatibilityTest(false);
    setCompatibilityResults(null);
  };

  const handleFixResume = () => {
    // Navigate to resume editing page with the selected resume
    navigate('/candidate/resumes', { 
      state: { 
        editResumeId: selectedResume,
        fromJobApplication: true,
        jobTitle: selectedJob?.title 
      } 
    });
    setShowApplyDialog(false);
    setShowCompatibilityTest(false);
    setCompatibilityResults(null);
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
                  {job.currency} {job.salary}
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
              <p className="text-sm font-medium">Your application will include:</p>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                <li>• Selected resume (ATS-optimized)</li>
                <li>• Work experience from resume</li>
                <li>• Skills and certifications from resume</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="resume-select">Select Resume *</Label>
              <Select value={selectedResume} onValueChange={setSelectedResume}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a resume for this application" />
                </SelectTrigger>
                <SelectContent>
                  {availableResumes.map((resume) => (
                    <SelectItem key={resume.id} value={resume.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{resume.name}</span>
                        {resume.isDefault && (
                          <Badge variant="secondary" className="ml-2">Default</Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                This resume will be tailored and optimized for this specific job application.
              </p>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
                <div>
                  <p className="text-sm font-medium text-blue-900">ATS Optimization</p>
                  <p className="text-xs text-blue-700 mt-1">
                    Your selected resume will be automatically optimized with keywords from this job posting to improve your chances of passing ATS screening.
                  </p>
                </div>
              </div>
            </div>

            {selectedResume && (
              <div className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleCompatibilityTest}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Test Resume Compatibility
                </Button>
                
                {showCompatibilityTest && compatibilityResults && (
                  <div className="p-4 border rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">Compatibility Analysis</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-primary">
                          {compatibilityResults.score}%
                        </span>
                        <span className="text-sm text-muted-foreground">Match</span>
                      </div>
                    </div>
                    
                    <Progress value={compatibilityResults.score} className="h-2" />
                    
                    {compatibilityResults.matchingSkills.length > 0 && (
                      <div>
                        <h5 className="font-medium text-sm text-green-700 mb-2">✓ Matching Skills:</h5>
                        <div className="flex flex-wrap gap-1">
                          {compatibilityResults.matchingSkills.map((skill: string) => (
                            <Badge key={skill} variant="secondary" className="bg-green-100 text-green-800">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {compatibilityResults.missingSkills.length > 0 && (
                      <div>
                        <h5 className="font-medium text-sm text-red-700 mb-2">⚠ Missing Skills:</h5>
                        <div className="flex flex-wrap gap-1 mb-3">
                          {compatibilityResults.missingSkills.map((skill: string) => (
                            <Badge key={skill} variant="destructive" className="bg-red-100 text-red-800">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                        
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                          <h6 className="font-medium text-sm text-yellow-800 mb-2">Suggestions to improve:</h6>
                          <ul className="text-xs text-yellow-700 space-y-1">
                            {compatibilityResults.suggestions.map((suggestion: string, i: number) => (
                              <li key={i}>• {suggestion}</li>
                            ))}
                          </ul>
                          
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="mt-3 w-full"
                            onClick={handleFixResume}
                          >
                            Fix Resume
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {compatibilityResults.score >= 80 && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <p className="text-sm text-green-800 font-medium">
                          🎉 Great match! Your resume aligns well with this job.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
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