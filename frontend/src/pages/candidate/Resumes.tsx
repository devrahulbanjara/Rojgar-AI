import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { 
  User, Mail, Phone, MapPin, Briefcase, GraduationCap, 
  Plus, X, Save, FileText, Eye, Download, Copy, Trash2,
  Github, Linkedin, Globe, Award, Calendar, Building2, Pencil
} from 'lucide-react';

interface Experience {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
}

interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startYear: string;
  endYear: string;
}

interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string;
  expiryDate?: string;
}

interface Resume {
  id: string;
  name: string;
  createdAt: string;
  lastModified: string;
  jobTitle?: string;
  isDefault: boolean;
}

export default function Resumes() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('my-resumes');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  const [editingResume, setEditingResume] = useState<Resume | null>(null);
  const [skills, setSkills] = useState(['React', 'TypeScript', 'Node.js', 'Python', 'AWS']);
  const [skillInput, setSkillInput] = useState('');

  // Resume form state
  const [resumeForm, setResumeForm] = useState({
    name: '',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@email.com',
    phone: '+1 (555) 123-4567',
    location: 'San Francisco, CA',
    currentRole: 'Senior Frontend Engineer',
    summary: 'Passionate software engineer with 7+ years of experience building scalable web applications using modern technologies.',
    githubUrl: 'https://github.com/johndoe',
    linkedinUrl: 'https://linkedin.com/in/johndoe',
    portfolioUrl: 'https://johndoe.dev'
  });

  const [experiences, setExperiences] = useState<Experience[]>([
    {
      id: '1',
      company: 'TechCorp Solutions',
      position: 'Senior Frontend Engineer',
      startDate: '2021-03',
      endDate: '',
      current: true,
      description: 'Leading frontend development for the main product, mentoring junior developers, and implementing best practices. Built responsive web applications using React, TypeScript, and modern CSS frameworks.'
    },
    {
      id: '2',
      company: 'StartupXYZ',
      position: 'Frontend Developer',
      startDate: '2018-06',
      endDate: '2021-02',
      current: false,
      description: 'Developed and maintained multiple client-facing applications. Improved application performance by 40% through code optimization and lazy loading implementation.'
    }
  ]);

  const [education, setEducation] = useState<Education[]>([
    {
      id: '1',
      institution: 'Stanford University',
      degree: 'Bachelor of Science',
      field: 'Computer Science',
      startYear: '2014',
      endYear: '2018'
    }
  ]);

  const [certifications, setCertifications] = useState<Certification[]>([
    {
      id: '1',
      name: 'AWS Certified Solutions Architect',
      issuer: 'Amazon Web Services',
      date: '2023-06',
      expiryDate: '2026-06'
    },
    {
      id: '2',
      name: 'React Developer Certification',
      issuer: 'Meta',
      date: '2022-11'
    }
  ]);

  // Mock existing resumes
  const [resumes, setResumes] = useState<Resume[]>([
    {
      id: '1',
      name: 'Software Engineer Resume',
      createdAt: '2024-01-15',
      lastModified: '2024-01-20',
      jobTitle: 'Software Engineer',
      isDefault: true
    },
    {
      id: '2',
      name: 'Frontend Specialist Resume',
      createdAt: '2024-01-10',
      lastModified: '2024-01-18',
      jobTitle: 'Frontend Developer',
      isDefault: false
    },
    {
      id: '3',
      name: 'Full Stack Developer Resume',
      createdAt: '2024-01-05',
      lastModified: '2024-01-12',
      jobTitle: 'Full Stack Developer',
      isDefault: false
    }
  ]);

  const handleEditResume = (resume: Resume) => {
    setEditingResume(resume);
    setResumeForm({ ...resumeForm, name: resume.name });
    setActiveTab('create-resume');
  };

  // Handle navigation from job application
  useEffect(() => {
    const state = location.state as any;
    if (state?.editResumeId && state?.fromJobApplication) {
      const resumeToEdit = resumes.find(r => r.id === state.editResumeId);
      if (resumeToEdit) {
        handleEditResume(resumeToEdit);
        
        // Show a helpful message
        toast({
          title: "Resume Editing Mode",
          description: `Editing ${resumeToEdit.name} for ${state.jobTitle || 'job application'}. Add missing skills to improve compatibility.`
        });
      }
    }
  }, [location.state, resumes]);

  const handleAddSkill = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && skillInput.trim()) {
      e.preventDefault();
      if (!skills.includes(skillInput.trim())) {
        setSkills([...skills, skillInput.trim()]);
      }
      setSkillInput('');
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter(s => s !== skill));
  };

  const handleCreateResume = () => {
    if (!resumeForm.name.trim()) {
      toast({
        title: "Resume Name Required",
        description: "Please enter a name for your resume.",
        variant: "destructive"
      });
      return;
    }

    if (editingResume) {
      // Update existing resume
      const updatedResume: Resume = {
        ...editingResume,
        name: resumeForm.name,
        lastModified: new Date().toISOString().split('T')[0],
      };

      setResumes(resumes.map(r => r.id === editingResume.id ? updatedResume : r));
      setEditingResume(null);
      setActiveTab('my-resumes');
      
      toast({
        title: "Resume Updated",
        description: `${updatedResume.name} has been updated successfully.`
      });
    } else {
      // Create new resume
      const newResume: Resume = {
        id: Date.now().toString(),
        name: resumeForm.name,
        createdAt: new Date().toISOString().split('T')[0],
        lastModified: new Date().toISOString().split('T')[0],
        isDefault: resumes.length === 0
      };

      setResumes([...resumes, newResume]);
      setActiveTab('my-resumes');
      
      toast({
        title: "Resume Created",
        description: `${newResume.name} has been created successfully.`
      });
    }

    setShowCreateDialog(false);
    setResumeForm({ ...resumeForm, name: '' });
  };

  const handlePreviewResume = (resume: Resume) => {
    setSelectedResume(resume);
    setShowPreviewDialog(true);
  };

  const handleDownloadResume = (resume: Resume) => {
    toast({
      title: "Resume Downloaded",
      description: `${resume.name} has been downloaded as PDF.`
    });
  };

  const handleDuplicateResume = (resume: Resume) => {
    const duplicatedResume: Resume = {
      ...resume,
      id: Date.now().toString(),
      name: `${resume.name} (Copy)`,
      createdAt: new Date().toISOString().split('T')[0],
      lastModified: new Date().toISOString().split('T')[0],
      isDefault: false
    };

    setResumes([...resumes, duplicatedResume]);
    toast({
      title: "Resume Duplicated",
      description: `${duplicatedResume.name} has been created.`
    });
  };

  const handleDeleteResume = (resumeId: string) => {
    setResumes(resumes.filter(r => r.id !== resumeId));
    toast({
      title: "Resume Deleted",
      description: "Resume has been deleted successfully."
    });
  };

  const handleSetDefault = (resumeId: string) => {
    setResumes(resumes.map(r => ({ ...r, isDefault: r.id === resumeId })));
    toast({
      title: "Default Resume Updated",
      description: "This resume is now your default resume."
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">My Resumes</h1>
        <p className="text-muted-foreground">Create ATS-friendly resumes tailored for different job applications</p>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => {
        if (value === 'my-resumes' && editingResume) {
          setEditingResume(null);
          setResumeForm({ ...resumeForm, name: '' });
        }
        setActiveTab(value);
      }} className="space-y-6">
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="my-resumes">My Resumes</TabsTrigger>
          <TabsTrigger value="create-resume">
            {editingResume ? 'Edit Resume' : 'Create Resume'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-resumes" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Your Resumes ({resumes.length})</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resumes.map((resume) => (
              <Card key={resume.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{resume.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {resume.jobTitle && `${resume.jobTitle} • `}
                        Modified {resume.lastModified}
                      </p>
                    </div>
                    {resume.isDefault && (
                      <Badge variant="secondary">Default</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => handlePreviewResume(resume)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Preview
                    </Button>
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleDownloadResume(resume)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => handleEditResume(resume)}
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => handleDuplicateResume(resume)}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Duplicate
                    </Button>
                  </div>
                  
                  <div className="flex gap-2">
                    {!resume.isDefault && (
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleSetDefault(resume.id)}
                      >
                        Set Default
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => handleDeleteResume(resume.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {resumes.length === 0 && (
            <Card className="text-center py-12">
              <CardContent>
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No resumes yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first ATS-friendly resume to start applying for jobs
                </p>
                <Button onClick={() => setActiveTab('create-resume')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Resume
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="create-resume" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {editingResume ? `Editing: ${editingResume.name}` : 'Resume Details'}
                  </CardTitle>
                  {editingResume && (
                    <p className="text-sm text-muted-foreground">
                      Last modified: {editingResume.lastModified}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="resume-name">Resume Name *</Label>
                    <Input 
                      id="resume-name"
                      placeholder="e.g., Software Engineer Resume"
                      value={resumeForm.name}
                      onChange={(e) => setResumeForm({...resumeForm, name: e.target.value})}
                    />
                  </div>
                </CardContent>
              </Card>

              <Tabs defaultValue="personal" className="space-y-4">
                <TabsList className="grid grid-cols-5 w-full">
                  <TabsTrigger value="personal">Personal</TabsTrigger>
                  <TabsTrigger value="experience">Experience</TabsTrigger>
                  <TabsTrigger value="education">Education</TabsTrigger>
                  <TabsTrigger value="skills">Skills</TabsTrigger>
                  <TabsTrigger value="certifications">Certifications</TabsTrigger>
                </TabsList>

                <TabsContent value="personal">
                  <Card>
                    <CardHeader>
                      <CardTitle>Personal Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="firstName">First Name *</Label>
                          <Input 
                            id="firstName" 
                            value={resumeForm.firstName}
                            onChange={(e) => setResumeForm({...resumeForm, firstName: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="lastName">Last Name *</Label>
                          <Input 
                            id="lastName" 
                            value={resumeForm.lastName}
                            onChange={(e) => setResumeForm({...resumeForm, lastName: e.target.value})}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="email">Email *</Label>
                        <Input 
                          id="email" 
                          type="email"
                          value={resumeForm.email}
                          onChange={(e) => setResumeForm({...resumeForm, email: e.target.value})}
                        />
                      </div>

                      <div>
                        <Label htmlFor="phone">Phone *</Label>
                        <Input 
                          id="phone" 
                          value={resumeForm.phone}
                          onChange={(e) => setResumeForm({...resumeForm, phone: e.target.value})}
                        />
                      </div>

                      <div>
                        <Label htmlFor="location">Location *</Label>
                        <Input 
                          id="location" 
                          value={resumeForm.location}
                          onChange={(e) => setResumeForm({...resumeForm, location: e.target.value})}
                        />
                      </div>

                      <div>
                        <Label htmlFor="currentRole">Current Role</Label>
                        <Input 
                          id="currentRole" 
                          value={resumeForm.currentRole}
                          onChange={(e) => setResumeForm({...resumeForm, currentRole: e.target.value})}
                        />
                      </div>

                      <div>
                        <Label htmlFor="summary">Professional Summary</Label>
                        <Textarea 
                          id="summary" 
                          value={resumeForm.summary}
                          onChange={(e) => setResumeForm({...resumeForm, summary: e.target.value})}
                          className="min-h-[100px]"
                          placeholder="Write a compelling summary that highlights your key achievements and skills..."
                        />
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-medium">Links</h4>
                        <div className="grid gap-4">
                          <div>
                            <Label htmlFor="github">GitHub URL</Label>
                            <div className="flex">
                              <div className="flex items-center px-3 border border-r-0 rounded-l-md bg-muted">
                                <Github className="h-4 w-4" />
                              </div>
                              <Input 
                                id="github" 
                                value={resumeForm.githubUrl}
                                onChange={(e) => setResumeForm({...resumeForm, githubUrl: e.target.value})}
                                className="rounded-l-none"
                                placeholder="https://github.com/username"
                              />
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="linkedin">LinkedIn URL</Label>
                            <div className="flex">
                              <div className="flex items-center px-3 border border-r-0 rounded-l-md bg-muted">
                                <Linkedin className="h-4 w-4" />
                              </div>
                              <Input 
                                id="linkedin" 
                                value={resumeForm.linkedinUrl}
                                onChange={(e) => setResumeForm({...resumeForm, linkedinUrl: e.target.value})}
                                className="rounded-l-none"
                                placeholder="https://linkedin.com/in/username"
                              />
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="portfolio">Portfolio URL</Label>
                            <div className="flex">
                              <div className="flex items-center px-3 border border-r-0 rounded-l-md bg-muted">
                                <Globe className="h-4 w-4" />
                              </div>
                              <Input 
                                id="portfolio" 
                                value={resumeForm.portfolioUrl}
                                onChange={(e) => setResumeForm({...resumeForm, portfolioUrl: e.target.value})}
                                className="rounded-l-none"
                                placeholder="https://yourportfolio.com"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="experience">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex justify-between items-center">
                        Work Experience
                        <Button size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Experience
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {experiences.map((exp) => (
                        <Card key={exp.id}>
                          <CardContent className="pt-6">
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex-1">
                                <p className="font-semibold">{exp.position}</p>
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Building2 className="h-3 w-3" />
                                  {exp.company}
                                </p>
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                                </p>
                              </div>
                              <Button size="sm" variant="ghost">
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            <p className="text-sm">{exp.description}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="education">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex justify-between items-center">
                        Education
                        <Button size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Education
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {education.map((edu) => (
                        <Card key={edu.id}>
                          <CardContent className="pt-6">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-semibold">{edu.degree} in {edu.field}</p>
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                  <GraduationCap className="h-3 w-3" />
                                  {edu.institution}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {edu.startYear} - {edu.endYear}
                                </p>
                              </div>
                              <Button size="sm" variant="ghost">
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="skills">
                  <Card>
                    <CardHeader>
                      <CardTitle>Skills & Expertise</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="skills">Add Skills</Label>
                        <Input
                          id="skills"
                          placeholder="Type a skill and press Enter"
                          value={skillInput}
                          onChange={(e) => setSkillInput(e.target.value)}
                          onKeyDown={handleAddSkill}
                        />
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {skills.map((skill) => (
                          <Badge key={skill} variant="secondary" className="flex items-center gap-1">
                            {skill}
                            <X className="h-3 w-3 cursor-pointer" onClick={() => removeSkill(skill)} />
                          </Badge>
                        ))}
                      </div>

                      <Alert>
                        <AlertDescription>
                          <strong>Tip:</strong> Add skills that are mentioned in the job description to improve your ATS score.
                        </AlertDescription>
                      </Alert>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="certifications">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex justify-between items-center">
                        Certifications
                        <Button size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Certification
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {certifications.map((cert) => (
                        <Card key={cert.id}>
                          <CardContent className="pt-6">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-semibold">{cert.name}</p>
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Award className="h-3 w-3" />
                                  {cert.issuer}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Issued: {cert.date}
                                  {cert.expiryDate && ` • Expires: ${cert.expiryDate}`}
                                </p>
                              </div>
                              <Button size="sm" variant="ghost">
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              <div className="flex gap-4">
                <Button onClick={handleCreateResume} className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  {editingResume ? 'Update Resume' : 'Save Resume'}
                </Button>
                <Button variant="outline" onClick={() => setShowPreviewDialog(true)}>
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
                {editingResume && (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setEditingResume(null);
                      setActiveTab('my-resumes');
                      setResumeForm({ ...resumeForm, name: '' });
                    }}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>ATS Tips</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                    <p>Use keywords from the job description</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                    <p>Keep formatting simple and clean</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                    <p>Use standard section headings</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                    <p>Include relevant certifications</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                    <p>Quantify your achievements</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Resume Templates</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    Modern Professional
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    ATS Optimized
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    Tech Focused
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Resume Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Resume</DialogTitle>
            <DialogDescription>
              Give your resume a descriptive name to help you identify it later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-resume-name">Resume Name</Label>
              <Input 
                id="new-resume-name"
                placeholder="e.g., Software Engineer Resume"
                value={resumeForm.name}
                onChange={(e) => setResumeForm({...resumeForm, name: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateResume}>
              Create Resume
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Resume Preview</DialogTitle>
            <DialogDescription>
              This is how your resume will look when downloaded as PDF
            </DialogDescription>
          </DialogHeader>
          
          {/* Mock PDF Preview */}
          <div className="bg-white border rounded-lg p-8 space-y-6 text-black">
            <div className="text-center border-b pb-4">
              <h1 className="text-2xl font-bold">{resumeForm.firstName} {resumeForm.lastName}</h1>
              <p className="text-lg text-gray-600">{resumeForm.currentRole}</p>
              <div className="flex justify-center gap-4 text-sm text-gray-600 mt-2">
                <span>{resumeForm.email}</span>
                <span>•</span>
                <span>{resumeForm.phone}</span>
                <span>•</span>
                <span>{resumeForm.location}</span>
              </div>
              <div className="flex justify-center gap-4 text-sm text-blue-600 mt-1">
                <span>{resumeForm.githubUrl}</span>
                <span>•</span>
                <span>{resumeForm.linkedinUrl}</span>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-bold mb-2">PROFESSIONAL SUMMARY</h2>
              <p className="text-sm">{resumeForm.summary}</p>
            </div>

            <div>
              <h2 className="text-lg font-bold mb-2">WORK EXPERIENCE</h2>
              {experiences.map((exp) => (
                <div key={exp.id} className="mb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{exp.position}</h3>
                      <p className="text-gray-600">{exp.company}</p>
                    </div>
                    <p className="text-sm text-gray-600">
                      {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                    </p>
                  </div>
                  <p className="text-sm mt-1">{exp.description}</p>
                </div>
              ))}
            </div>

            <div>
              <h2 className="text-lg font-bold mb-2">EDUCATION</h2>
              {education.map((edu) => (
                <div key={edu.id} className="mb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{edu.degree} in {edu.field}</h3>
                      <p className="text-gray-600">{edu.institution}</p>
                    </div>
                    <p className="text-sm text-gray-600">{edu.startYear} - {edu.endYear}</p>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <h2 className="text-lg font-bold mb-2">SKILLS</h2>
              <p className="text-sm">{skills.join(' • ')}</p>
            </div>

            <div>
              <h2 className="text-lg font-bold mb-2">CERTIFICATIONS</h2>
              {certifications.map((cert) => (
                <div key={cert.id} className="mb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{cert.name}</h3>
                      <p className="text-gray-600">{cert.issuer}</p>
                    </div>
                    <p className="text-sm text-gray-600">{cert.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreviewDialog(false)}>
              Close
            </Button>
            <Button onClick={() => {
              toast({
                title: "Resume Downloaded",
                description: "Your resume has been downloaded as PDF."
              });
              setShowPreviewDialog(false);
            }}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
