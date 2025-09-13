import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { 
  User, Mail, Phone, MapPin, Briefcase, GraduationCap, 
  Plus, X, Save, Upload, FileText, Sparkles, CheckCircle,
  Target, TrendingUp, Award, Download
} from 'lucide-react';

interface Experience {
  id: string;
  company: string;
  position: string;
  duration: string;
  description: string;
}

interface Education {
  id: string;
  institution: string;
  degree: string;
  year: string;
}

export default function Profile() {
  const [profileCompletion, setProfileCompletion] = useState(75);
  const [skills, setSkills] = useState(['React', 'TypeScript', 'Node.js', 'GraphQL']);
  const [skillInput, setSkillInput] = useState('');
  const [atsScore, setAtsScore] = useState(82);
  
  const [profile, setProfile] = useState({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@email.com',
    phone: '+1 (555) 123-4567',
    location: 'San Francisco, CA',
    currentRole: 'Senior Frontend Engineer',
    bio: 'Passionate frontend engineer with 7+ years of experience building scalable web applications.',
  });

  const [experiences, setExperiences] = useState<Experience[]>([
    {
      id: '1',
      company: 'TechCorp',
      position: 'Senior Frontend Engineer',
      duration: '2021 - Present',
      description: 'Leading frontend development for the main product, mentoring junior developers, and implementing best practices.',
    },
    {
      id: '2',
      company: 'StartupXYZ',
      position: 'Frontend Developer',
      duration: '2018 - 2021',
      description: 'Built responsive web applications using React and TypeScript. Improved performance by 40%.',
    },
  ]);

  const [education, setEducation] = useState<Education[]>([
    {
      id: '1',
      institution: 'Stanford University',
      degree: 'BS Computer Science',
      year: '2017',
    },
  ]);

  const keywordSuggestions = [
    'Implemented CI/CD pipelines',
    'Reduced load time by 50%',
    'Led cross-functional team',
    'Optimized database queries',
    'Mentored 5+ developers',
  ];

  const actionVerbs = [
    'Achieved', 'Developed', 'Implemented', 'Led', 'Optimized',
    'Designed', 'Managed', 'Collaborated', 'Streamlined', 'Delivered',
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

  const optimizeResume = () => {
    setAtsScore(92);
    toast({
      title: "Resume Optimized",
      description: "Your resume has been optimized for ATS systems. Score improved from 82% to 92%!",
    });
  };

  const exportResume = () => {
    toast({
      title: "Resume Exported",
      description: "Your resume has been exported as PDF.",
    });
  };

  const saveProfile = () => {
    toast({
      title: "Profile Saved",
      description: "Your profile has been updated successfully.",
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">My Profile</h1>
        <p className="text-muted-foreground">Manage your profile and optimize your resume</p>
      </div>

      {/* Profile Completion */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Profile Completion
            <span className="text-2xl font-bold text-primary">{profileCompletion}%</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={profileCompletion} className="mb-4" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">Basic Info</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">Experience</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">Education</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />
              <span className="text-sm text-muted-foreground">Skills (Add 3+)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Profile Form */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="profile" className="space-y-4">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="experience">Experience</TabsTrigger>
              <TabsTrigger value="education">Education</TabsTrigger>
              <TabsTrigger value="skills">Skills</TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input 
                        id="firstName" 
                        value={profile.firstName}
                        onChange={(e) => setProfile({...profile, firstName: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input 
                        id="lastName" 
                        value={profile.lastName}
                        onChange={(e) => setProfile({...profile, lastName: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({...profile, email: e.target.value})}
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input 
                      id="phone" 
                      value={profile.phone}
                      onChange={(e) => setProfile({...profile, phone: e.target.value})}
                    />
                  </div>

                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input 
                      id="location" 
                      value={profile.location}
                      onChange={(e) => setProfile({...profile, location: e.target.value})}
                    />
                  </div>

                  <div>
                    <Label htmlFor="currentRole">Current Role</Label>
                    <Input 
                      id="currentRole" 
                      value={profile.currentRole}
                      onChange={(e) => setProfile({...profile, currentRole: e.target.value})}
                    />
                  </div>

                  <div>
                    <Label htmlFor="bio">Professional Summary</Label>
                    <Textarea 
                      id="bio" 
                      value={profile.bio}
                      onChange={(e) => setProfile({...profile, bio: e.target.value})}
                      className="min-h-[100px]"
                    />
                  </div>

                  <Button onClick={saveProfile}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="experience">
              <Card>
                <CardHeader>
                  <CardTitle>Work Experience</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {experiences.map((exp) => (
                    <Card key={exp.id}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-semibold">{exp.position}</p>
                            <p className="text-sm text-muted-foreground">{exp.company} • {exp.duration}</p>
                            <p className="mt-2 text-sm">{exp.description}</p>
                          </div>
                          <Button size="sm" variant="ghost">
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  <Button variant="outline" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Experience
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="education">
              <Card>
                <CardHeader>
                  <CardTitle>Education</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {education.map((edu) => (
                    <Card key={edu.id}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold">{edu.degree}</p>
                            <p className="text-sm text-muted-foreground">{edu.institution} • {edu.year}</p>
                          </div>
                          <Button size="sm" variant="ghost">
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  <Button variant="outline" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Education
                  </Button>
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
                    <TrendingUp className="h-4 w-4" />
                    <AlertDescription>
                      Popular skills in your field: AWS, Docker, Kubernetes, CI/CD, Agile
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* AI Resume Coach Sidebar */}
        <div className="space-y-6">
          {/* ATS Score */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                ATS Compatibility Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-4">
                <span className="text-4xl font-bold text-primary">{atsScore}%</span>
              </div>
              <Progress value={atsScore} className="mb-4" />
              <Button onClick={optimizeResume} className="w-full">
                <Sparkles className="h-4 w-4 mr-2" />
                Optimize Resume
              </Button>
            </CardContent>
          </Card>

          {/* Keyword Suggestions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Keyword Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {keywordSuggestions.map((keyword, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">{keyword}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Action Verbs */}
          <Card>
            <CardHeader>
              <CardTitle>Power Words</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {actionVerbs.map((verb) => (
                  <Badge key={verb} variant="outline">
                    {verb}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Resume Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Resume Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full">
                <Upload className="h-4 w-4 mr-2" />
                Upload Resume
              </Button>
              <Button variant="outline" className="w-full">
                <FileText className="h-4 w-4 mr-2" />
                Preview Resume
              </Button>
              <Button onClick={exportResume} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Export as PDF
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}