import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { FileText, Plus, Save, Send, X } from 'lucide-react';

export default function PostJobs() {
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [jdData, setJdData] = useState({
    title: '',
    department: '',
    location: '',
    salaryMin: '',
    salaryMax: '',
    employmentType: '',
    experienceLevel: '',
    description: ''
  });

  // Mock saved JDs
  const savedJDs = [
    { id: 1, title: 'Senior Frontend Engineer', department: 'Engineering', status: 'draft' },
    { id: 2, title: 'Product Manager', department: 'Product', status: 'published' },
    { id: 3, title: 'Data Scientist', department: 'Data', status: 'draft' }
  ];

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

  const handleSaveDraft = () => {
    toast({
      title: "Draft Saved",
      description: "Your job description has been saved as a draft."
    });
  };

  const handlePublish = () => {
    toast({
      title: "Job Published",
      description: "Your job has been published successfully."
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Post Jobs</h1>
        <p className="text-muted-foreground">Create and manage job postings</p>
      </div>

      <Tabs defaultValue="create" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="create">Create JD</TabsTrigger>
          <TabsTrigger value="post">Post Job</TabsTrigger>
          <TabsTrigger value="manage">Manage Jobs</TabsTrigger>
        </TabsList>

        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>Create Job Description</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Job Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Senior Frontend Engineer"
                    value={jdData.title}
                    onChange={(e) => setJdData({...jdData, title: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    placeholder="e.g., Engineering"
                    value={jdData.department}
                    onChange={(e) => setJdData({...jdData, department: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="e.g., San Francisco, CA"
                    value={jdData.location}
                    onChange={(e) => setJdData({...jdData, location: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employment-type">Employment Type</Label>
                  <Select value={jdData.employmentType} onValueChange={(value) => setJdData({...jdData, employmentType: value})}>
                    <SelectTrigger id="employment-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full-time">Full-time</SelectItem>
                      <SelectItem value="part-time">Part-time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="freelance">Freelance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="experience">Experience Level</Label>
                  <Select value={jdData.experienceLevel} onValueChange={(value) => setJdData({...jdData, experienceLevel: value})}>
                    <SelectTrigger id="experience">
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="intern">Intern</SelectItem>
                      <SelectItem value="entry">Entry</SelectItem>
                      <SelectItem value="mid">Mid</SelectItem>
                      <SelectItem value="senior">Senior</SelectItem>
                      <SelectItem value="lead">Lead</SelectItem>
                      <SelectItem value="executive">Executive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Salary Range</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Min"
                      type="number"
                      value={jdData.salaryMin}
                      onChange={(e) => setJdData({...jdData, salaryMin: e.target.value})}
                    />
                    <Input
                      placeholder="Max"
                      type="number"
                      value={jdData.salaryMax}
                      onChange={(e) => setJdData({...jdData, salaryMax: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="skills">Required Skills</Label>
                <Input
                  id="skills"
                  placeholder="Type a skill and press Enter"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={handleAddSkill}
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="flex items-center gap-1">
                      {skill}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => removeSkill(skill)} />
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Job Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the role, responsibilities, and requirements..."
                  className="min-h-[200px]"
                  value={jdData.description}
                  onChange={(e) => setJdData({...jdData, description: e.target.value})}
                />
              </div>

              <div className="flex gap-4">
                <Button onClick={handleSaveDraft} variant="outline">
                  <Save className="h-4 w-4 mr-2" />
                  Save Draft
                </Button>
                <Button onClick={handlePublish}>
                  <Send className="h-4 w-4 mr-2" />
                  Publish
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="post">
          <Card>
            <CardHeader>
              <CardTitle>Post Job from Saved JDs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {savedJDs.map((jd) => (
                  <Card key={jd.id}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-4">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{jd.title}</p>
                          <p className="text-sm text-muted-foreground">{jd.department}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={jd.status === 'published' ? 'default' : 'secondary'}>
                          {jd.status}
                        </Badge>
                        <Button size="sm">Select</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="visibility">Visibility</Label>
                  <Select>
                    <SelectTrigger id="visibility">
                      <SelectValue placeholder="Select visibility" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deadline">Application Deadline</Label>
                  <Input id="deadline" type="date" />
                </div>

                <Button className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Post Selected Job
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage">
          <Card>
            <CardHeader>
              <CardTitle>Manage Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { id: 1, title: 'Senior Frontend Engineer', datePosted: '2024-01-15', status: 'Open', applications: 23 },
                  { id: 2, title: 'Product Manager', datePosted: '2024-01-10', status: 'Open', applications: 45 },
                  { id: 3, title: 'Data Scientist', datePosted: '2024-01-05', status: 'Closed', applications: 67 }
                ].map((job) => (
                  <Card key={job.id}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div>
                        <p className="font-medium">{job.title}</p>
                        <p className="text-sm text-muted-foreground">Posted on {job.datePosted}</p>
                        <p className="text-sm text-muted-foreground">{job.applications} applications</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={job.status === 'Open' ? 'default' : 'secondary'}>
                          {job.status}
                        </Badge>
                        <Button size="sm" variant="outline">Edit</Button>
                        <Button size="sm" variant="outline">View Applicants</Button>
                        {job.status === 'Open' && (
                          <Button size="sm" variant="destructive">Close Job</Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}