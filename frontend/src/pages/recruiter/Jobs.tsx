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
import { Plus, FileText, Users, Calendar, Edit, Archive, Sparkles, Clock, ChevronRight, Upload, Eye, Settings, Trash2, Edit3 } from 'lucide-react';
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

interface JobTemplate {
  id: string;
  name: string;
  type: 'technical' | 'general' | 'leadership';
  description: string;
  content: string;
  createdAt: string;
  lastUsed?: string;
}

export default function Jobs() {
  const [jobs, setJobs] = useState<Job[]>([
    { id: '1', title: 'Senior Frontend Engineer', status: 'Active', applicants: 23, datePosted: '2024-01-15', expiryDate: '2024-01-20', daysLeft: 2, assignedTo: 'Rahul Dev Banjara', department: 'Engineering', location: 'San Francisco, CA', salary: '150k-200k', currency: 'USD' },
    { id: '2', title: 'Product Manager', status: 'Expired', applicants: 45, datePosted: '2024-01-10', expiryDate: '2024-01-15', daysLeft: 0, assignedTo: 'Diwas Adhikari', department: 'Product', location: 'Remote', salary: '130k-180k', currency: 'USD' },
    { id: '3', title: 'Data Scientist', status: 'Draft', applicants: 0, datePosted: '-', expiryDate: '-', daysLeft: 0, assignedTo: 'Ashim Khatri Chetri', department: 'Data', location: 'New York, NY', salary: '140k-190k', currency: 'USD' },
    { id: '4', title: 'DevOps Engineer', status: 'Closed', applicants: 67, datePosted: '2023-12-20', expiryDate: '2023-12-25', daysLeft: 0, assignedTo: 'Sampada Poudel', department: 'Infrastructure', location: 'Austin, TX', salary: '120k-170k', currency: 'USD' },
    { id: '5', title: 'Software Engineer', status: 'Active', applicants: 12, datePosted: '2024-01-18', expiryDate: '2024-01-25', daysLeft: 5, assignedTo: 'Ajit Koirala', department: 'Engineering', location: 'Kathmandu, Nepal', salary: '15L-25L', currency: 'NPR' },
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
    selectedTemplate: '',
  });

  // Template management state
  const [templates, setTemplates] = useState<JobTemplate[]>([
    {
      id: '1',
      name: 'Technical Role Template',
      type: 'technical',
      description: 'Perfect for engineering and technical positions',
      content: `# About Us

[Company Name] is an IT services company with expertise in cloud and DevOps. We help companies of all verticals and sizes to get the best out of their technology systems with our expertise and approach.

Our team is our biggest strength, & we value our members over anything else. We pride ourselves on our team, work environment, and employee-first approach, where we emphasise employee well-being & growth strongly.

## Job Responsibilities

We are seeking a motivated **[JOB_TITLE]** to join our team. The ideal candidate will split their time between developing cutting-edge solutions and contributing to our technical excellence.

As a **[JOB_TITLE]**, your responsibilities would typically be to:

### Technical Development
- Design, implement, and deploy solutions using **[SKILLS]**
- Build end-to-end systems and applications
- Stay updated with emerging technology trends and integrate them into solutions
- **[KEYWORDS]** environment experience preferred

### Collaboration & Growth
- Work closely with cross-functional teams to deliver high-quality products
- Provide technical guidance and mentorship to team members
- Participate in code reviews and technical decision-making processes

## Qualifications

- Bachelor's in computer science, engineering, or a related field
- **[EXPERIENCE_LEVEL]** years of hands-on experience in software development
- Strong expertise in **[SKILLS]**
- Experience with modern development practices and tools

## Required Skills

1. **Technical Skills**
   - Strong understanding of **[SKILLS]**
   - Experience with software development lifecycle
   - Familiarity with version control systems and CI/CD

2. **Soft Skills**
   - Excellent problem-solving and analytical skills
   - Strong communication and collaboration abilities
   - Ability to work in **[KEYWORDS]** environments

## Why Join Us?

[Company Name] is an equal opportunity employer and does not discriminate on the basis of race, national origin, gender, gender identity, sexual orientation, protected veteran status, disability, age, or other legally protected status.

- Great Learning & Development Opportunities
- Industry-leading People and Policies
- Work-life Balance
- Employee wellbeing programs
- Competitive compensation and benefits
- Opportunity to work with cutting-edge technology
- Weekends off (Saturday & Sunday)

## How to Apply?

We're constantly seeking exceptional individuals eager to bring their impressive talents to our team. If you're a dynamic force of skill and enthusiasm, join us in shaping our team's success! To apply, simply send your updated resume to careers@company.com`,
      createdAt: '2024-01-10',
      lastUsed: '2024-01-14'
    },
    {
      id: '2',
      name: 'General Role Template',
      type: 'general',
      description: 'Versatile template for various business roles',
      content: `# About [Company Name]

[Company Name] is a dynamic organization committed to excellence and innovation. We believe in creating an inclusive workplace where every team member can thrive and contribute to our shared success.

## Position Overview

We are looking for a talented **[JOB_TITLE]** to join our growing team. This role offers an exciting opportunity to make a meaningful impact while developing your career in a supportive environment.

## Key Responsibilities

- Lead and execute **[JOB_TITLE]** initiatives with focus on **[KEYWORDS]**
- Collaborate with cross-functional teams to achieve business objectives
- Utilize **[SKILLS]** to drive results and improve processes
- Contribute to strategic planning and decision-making processes
- Mentor and support team members in their professional development

## What We're Looking For

### Experience & Skills
- **[EXPERIENCE_LEVEL]** years of experience in relevant field
- Proficiency in **[SKILLS]**
- Strong analytical and problem-solving abilities
- Experience working in **[KEYWORDS]** environments

### Personal Qualities
- Excellent communication and interpersonal skills
- Self-motivated with strong attention to detail
- Ability to work independently and as part of a team
- Adaptable and eager to learn new technologies and processes

## What We Offer

- Competitive salary and comprehensive benefits package
- Professional development opportunities
- Flexible work arrangements
- Collaborative and inclusive work environment
- Health and wellness programs
- Paid time off and holidays

## Ready to Join Us?

If you're passionate about **[KEYWORDS]** and ready to take the next step in your career, we'd love to hear from you! Please submit your resume and a brief cover letter explaining why you're the perfect fit for this role.

Apply today at careers@company.com`,
      createdAt: '2024-01-08',
    },
    {
      id: '3',
      name: 'Leadership Role Template',
      type: 'leadership',
      description: 'Designed for management and senior positions',
      content: `# About [Company Name]

[Company Name] is a forward-thinking organization that values leadership, innovation, and strategic thinking. We are committed to building a diverse and inclusive workplace where leaders can drive meaningful change.

## Leadership Opportunity: [JOB_TITLE]

We are seeking an experienced **[JOB_TITLE]** to lead our team and drive strategic initiatives. This is an exceptional opportunity for a visionary leader to make a significant impact on our organization's growth and success.

## Leadership Responsibilities

### Strategic Leadership
- Develop and execute strategic plans aligned with **[KEYWORDS]** objectives
- Lead cross-functional teams to achieve ambitious goals
- Drive innovation and continuous improvement initiatives
- Build and maintain relationships with key stakeholders

### Team Development
- Lead, mentor, and develop high-performing teams
- Foster a culture of collaboration, accountability, and excellence
- Implement best practices in **[SKILLS]** areas
- Champion diversity, equity, and inclusion initiatives

### Operational Excellence
- Oversee day-to-day operations and ensure quality delivery
- Manage budgets and resources effectively
- Implement processes that support **[KEYWORDS]** environments
- Drive data-driven decision making

## Leadership Qualifications

### Experience Requirements
- **[EXPERIENCE_LEVEL]** years of progressive leadership experience
- Proven track record in **[SKILLS]** domains
- Experience managing teams and complex projects
- Strong background in strategic planning and execution

### Leadership Competencies
- Exceptional communication and presentation skills
- Strong emotional intelligence and interpersonal skills
- Ability to inspire and motivate diverse teams
- Experience with change management and organizational transformation

## What We Offer Our Leaders

- Competitive executive compensation package
- Comprehensive benefits including health, dental, and vision
- Professional development and executive coaching opportunities
- Flexible work arrangements and work-life balance
- Opportunity to shape the future of our organization
- Access to industry conferences and networking events

## Ready to Lead?

If you're a proven leader ready to take on new challenges and drive meaningful impact, we want to hear from you. Please submit your resume along with a cover letter detailing your leadership philosophy and vision.

Contact us at leadership@company.com`,
      createdAt: '2024-01-05',
    }
  ]);

  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<JobTemplate | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<JobTemplate | null>(null);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    type: 'general' as 'technical' | 'general' | 'leadership',
    description: '',
    content: '',
  });

  const generateJD = () => {
    let generatedJD = '';
    
    if (newJob.selectedTemplate) {
      // Use selected template
      const template = templates.find(t => t.id === newJob.selectedTemplate);
      if (template) {
        generatedJD = template.content
          .replace(/\[JOB_TITLE\]/g, newJob.title || 'Position')
          .replace(/\[SKILLS\]/g, newJob.skills || 'relevant technologies')
          .replace(/\[KEYWORDS\]/g, newJob.keywords || 'dynamic')
          .replace(/\[EXPERIENCE_LEVEL\]/g, '3-5')
          .replace(/\[Company Name\]/g, 'ConvexHire');
        
        // Update template last used
        setTemplates(prev => prev.map(t => 
          t.id === newJob.selectedTemplate 
            ? { ...t, lastUsed: new Date().toISOString().split('T')[0] }
            : t
        ));
      }
    } else {
      // Fallback to basic generation
      generatedJD = `We are seeking a talented ${newJob.title} to join our innovative team.

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
    }

    setNewJob({ ...newJob, generatedJD });
    setJdHistory([
      { id: jdHistory.length + 1, title: newJob.title, createdAt: new Date().toISOString().split('T')[0], keywords: newJob.keywords },
      ...jdHistory
    ]);
    toast({
      title: "JD Generated",
      description: newJob.selectedTemplate 
        ? "AI has generated a job description using your selected template."
        : "AI has generated a job description based on your inputs."
    });
  };

  const addTemplate = () => {
    const template: JobTemplate = {
      id: String(templates.length + 1),
      name: newTemplate.name,
      type: newTemplate.type,
      description: newTemplate.description,
      content: newTemplate.content,
      createdAt: new Date().toISOString().split('T')[0],
    };
    
    setTemplates([template, ...templates]);
    setNewTemplate({
      name: '',
      type: 'general',
      description: '',
      content: '',
    });
    setTemplateDialogOpen(false);
    
    toast({
      title: "Template Added",
      description: `${template.name} has been added to your templates.`
    });
  };

  const editTemplate = (template: JobTemplate) => {
    setEditingTemplate(template);
    setNewTemplate({
      name: template.name,
      type: template.type,
      description: template.description,
      content: template.content,
    });
    setTemplateDialogOpen(true);
  };

  const updateTemplate = () => {
    if (!editingTemplate) return;
    
    const updatedTemplate: JobTemplate = {
      ...editingTemplate,
      name: newTemplate.name,
      type: newTemplate.type,
      description: newTemplate.description,
      content: newTemplate.content,
    };
    
    setTemplates(prev => prev.map(t => 
      t.id === editingTemplate.id ? updatedTemplate : t
    ));
    
    setEditingTemplate(null);
    setNewTemplate({
      name: '',
      type: 'general',
      description: '',
      content: '',
    });
    setTemplateDialogOpen(false);
    
    toast({
      title: "Template Updated",
      description: `${updatedTemplate.name} has been updated successfully.`
    });
  };

  const deleteTemplate = (templateId: string) => {
    setTemplates(prev => prev.filter(t => t.id !== templateId));
    toast({
      title: "Template Deleted",
      description: "Template has been removed from your collection."
    });
  };

  const resetTemplateForm = () => {
    setEditingTemplate(null);
    setNewTemplate({
      name: '',
      type: 'general',
      description: '',
      content: '',
    });
  };

  const getTemplateTypeColor = (type: string) => {
    switch (type) {
      case 'technical': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'leadership': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'general': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
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
      selectedTemplate: '',
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

      {/* Template Management Section */}
      <Card className="border-orange-200">
        <CardHeader className="bg-orange-50">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-orange-600" />
              Job Description Templates
            </div>
            <Dialog open={templateDialogOpen} onOpenChange={(open) => {
              setTemplateDialogOpen(open);
              if (!open) resetTemplateForm();
            }}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingTemplate ? 'Edit Job Description Template' : 'Add New Job Description Template'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="template-name">Template Name</Label>
                      <Input
                        id="template-name"
                        value={newTemplate.name}
                        onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                        placeholder="e.g., Senior Developer Template"
                      />
                    </div>
                    <div>
                      <Label htmlFor="template-type">Template Type</Label>
                      <Select value={newTemplate.type} onValueChange={(value: 'technical' | 'general' | 'leadership') => setNewTemplate({ ...newTemplate, type: value })}>
                        <SelectTrigger id="template-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="technical">Technical</SelectItem>
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="leadership">Leadership</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="template-description">Description</Label>
                    <Input
                      id="template-description"
                      value={newTemplate.description}
                      onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                      placeholder="Brief description of when to use this template"
                    />
                  </div>
                  <div>
                    <Label htmlFor="template-content">Template Content (Markdown)</Label>
                    <Textarea
                      id="template-content"
                      value={newTemplate.content}
                      onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                      placeholder="Enter your job description template in markdown format. Use placeholders like [JOB_TITLE], [SKILLS], [KEYWORDS], [EXPERIENCE_LEVEL] for dynamic content."
                      className="min-h-[400px] font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Use placeholders: [JOB_TITLE], [SKILLS], [KEYWORDS], [EXPERIENCE_LEVEL], [Company Name]
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => {
                      setTemplateDialogOpen(false);
                      resetTemplateForm();
                    }}>Cancel</Button>
                    <Button 
                      onClick={editingTemplate ? updateTemplate : addTemplate} 
                      disabled={!newTemplate.name || !newTemplate.content}
                    >
                      {editingTemplate ? 'Update Template' : 'Add Template'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid md:grid-cols-3 gap-4">
            {templates.map((template) => (
              <Card key={template.id} className="relative group hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-sm font-medium">{template.name}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">{template.description}</p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setPreviewTemplate(template)}
                        className="h-6 w-6 p-0"
                        title="Preview template"
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => editTemplate(template)}
                        className="h-6 w-6 p-0"
                        title="Edit template"
                      >
                        <Edit3 className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteTemplate(template.id)}
                        className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                        title="Delete template"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
          
          {templates.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No templates yet. Create your first template to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Template Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {previewTemplate?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{previewTemplate?.description}</span>
            </div>
            <div className="border rounded-lg p-4 bg-muted/50 max-h-96 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm font-mono">
                {previewTemplate?.content}
              </pre>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setPreviewTemplate(null)}>Close</Button>
              <Button onClick={() => {
                setNewJob({ ...newJob, selectedTemplate: previewTemplate?.id || '' });
                setPreviewTemplate(null);
                toast({
                  title: "Template Selected",
                  description: `${previewTemplate?.name} will be used for JD generation.`
                });
              }}>
                Use This Template
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
                        <Label htmlFor="template-select">Select Template (Optional)</Label>
                        <Select value={newJob.selectedTemplate || "none"} onValueChange={(value) => setNewJob({ ...newJob, selectedTemplate: value === "none" ? "" : value })}>
                          <SelectTrigger id="template-select">
                            <SelectValue placeholder="Choose a template or leave blank for basic generation" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No template (Basic generation)</SelectItem>
                            {templates.map((template) => (
                              <SelectItem key={template.id} value={template.id}>
                                {template.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {newJob.selectedTemplate && (
                          <div className="mt-2 p-3 bg-muted rounded-lg">
                            <p className="text-sm font-medium">
                              {templates.find(t => t.id === newJob.selectedTemplate)?.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {templates.find(t => t.id === newJob.selectedTemplate)?.description}
                            </p>
                          </div>
                        )}
                      </div>
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
                        {newJob.selectedTemplate ? 'Generate JD with Template' : 'Generate JD with AI'}
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