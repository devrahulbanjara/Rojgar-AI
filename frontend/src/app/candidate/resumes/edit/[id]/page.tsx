'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../../../hooks/useAuth';
import { AppShell } from '../../../../../components/layout/AppShell';
import { PageTransition, AnimatedContainer } from '../../../../../components/common';
import { Button } from '../../../../../components/ui/button';
import { Input } from '../../../../../components/ui/input';
import { Label } from '../../../../../components/ui/label';
import { Textarea } from '../../../../../components/ui/textarea';
import { LoadingSpinner } from '../../../../../components/common/LoadingSpinner';
import { resumeService } from '../../../../../services/resumeService';
import { profileService } from '../../../../../services/profileService';
import { 
  FileText, 
  User, 
  Briefcase, 
  GraduationCap, 
  Award, 
  Settings, 
  Save, 
  ArrowLeft,
  Plus,
  Check,
  X,
  Edit,
  CheckCircle,
  AlertCircle,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import type { 
  Resume, 
  ResumeUpdateRequest,
  WorkExperience,
  EducationRecord,
  Certification,
  ProfileSkill,
  AddExperienceToResumeRequest,
  AddEducationToResumeRequest,
  AddCertificationToResumeRequest,
  AddSkillToResumeRequest
} from '../../../../../types';

export default function ResumeEditor() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const resumeId = params.id as string;

  const [resume, setResume] = useState<Resume | null>(null);
  const [profileData, setProfileData] = useState<{
    workExperiences: WorkExperience[];
    educationRecords: EducationRecord[];
    certifications: Certification[];
    skills: ProfileSkill[];
  }>({
    workExperiences: [],
    educationRecords: [],
    certifications: [],
    skills: []
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [resumeForm, setResumeForm] = useState({
    name: '',
    contact_full_name: '',
    contact_email: '',
    contact_phone: '',
    contact_location: '',
    custom_summary: '',
  });

  const [selectedExperiences, setSelectedExperiences] = useState<string[]>([]);
  const [selectedEducation, setSelectedEducation] = useState<string[]>([]);
  const [selectedCertifications, setSelectedCertifications] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  useEffect(() => {
    if (isAuthenticated && resumeId) {
      loadData();
    }
  }, [isAuthenticated, resumeId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [resumeData, workExperiences, educationRecords, certifications, skills] = await Promise.all([
        resumeService.getResume(resumeId),
        profileService.getWorkExperiences(),
        profileService.getEducationRecords(),
        profileService.getCertifications(),
        profileService.getProfileSkills()
      ]);

      setResume(resumeData);
      setProfileData({
        workExperiences,
        educationRecords,
        certifications,
        skills
      });

      // Populate form with resume data
      setResumeForm({
        name: resumeData.name,
        contact_full_name: resumeData.contact_full_name || '',
        contact_email: resumeData.contact_email || '',
        contact_phone: resumeData.contact_phone || '',
        contact_location: resumeData.contact_location || '',
        custom_summary: resumeData.custom_summary || '',
      });

      // Set selected items
      setSelectedExperiences(resumeData.experiences?.map(exp => exp.work_experience_id) || []);
      setSelectedEducation(resumeData.education?.map(edu => edu.education_record_id) || []);
      setSelectedCertifications(resumeData.certifications?.map(cert => cert.certification_id) || []);
      setSelectedSkills(resumeData.skills?.map(skill => skill.profile_skill_id) || []);
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: 'Failed to load resume data. Please try again.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveResume = async () => {
    try {
      setIsSaving(true);
      const updateData: ResumeUpdateRequest = {
        name: resumeForm.name,
        contact_full_name: resumeForm.contact_full_name || undefined,
        contact_email: resumeForm.contact_email || undefined,
        contact_phone: resumeForm.contact_phone || undefined,
        contact_location: resumeForm.contact_location || undefined,
        custom_summary: resumeForm.custom_summary || undefined,
      };

      await resumeService.updateResume(resumeId, updateData);
      setMessage({ type: 'success', text: 'Resume saved successfully!' });
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.detail || 'Failed to save resume.' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleExperience = async (experienceId: string) => {
    const isSelected = selectedExperiences.includes(experienceId);
    
    try {
      if (isSelected) {
        // Remove from resume
        const resumeExperience = resume?.experiences?.find(exp => exp.work_experience_id === experienceId);
        if (resumeExperience) {
          await resumeService.removeExperienceFromResume(resumeId, resumeExperience.id);
          setSelectedExperiences(prev => prev.filter(id => id !== experienceId));
        }
      } else {
        // Add to resume
        const experience = profileData.workExperiences.find(exp => exp.id === experienceId);
        if (experience) {
          const addData: AddExperienceToResumeRequest = {
            work_experience_id: experienceId,
            custom_description: experience.master_description
          };
          await resumeService.addExperienceToResume(resumeId, addData);
          setSelectedExperiences(prev => [...prev, experienceId]);
        }
      }
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.detail || 'Failed to update experience.' 
      });
    }
  };

  const handleToggleEducation = async (educationId: string) => {
    const isSelected = selectedEducation.includes(educationId);
    
    try {
      if (isSelected) {
        // Remove from resume
        const resumeEducation = resume?.education?.find(edu => edu.education_record_id === educationId);
        if (resumeEducation) {
          await resumeService.removeEducationFromResume(resumeId, resumeEducation.id);
          setSelectedEducation(prev => prev.filter(id => id !== educationId));
        }
      } else {
        // Add to resume
        const addData: AddEducationToResumeRequest = {
          education_record_id: educationId
        };
        await resumeService.addEducationToResume(resumeId, addData);
        setSelectedEducation(prev => [...prev, educationId]);
      }
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.detail || 'Failed to update education.' 
      });
    }
  };

  const handleToggleCertification = async (certificationId: string) => {
    const isSelected = selectedCertifications.includes(certificationId);
    
    try {
      if (isSelected) {
        // Remove from resume
        const resumeCertification = resume?.certifications?.find(cert => cert.certification_id === certificationId);
        if (resumeCertification) {
          await resumeService.removeCertificationFromResume(resumeId, resumeCertification.id);
          setSelectedCertifications(prev => prev.filter(id => id !== certificationId));
        }
      } else {
        // Add to resume
        const addData: AddCertificationToResumeRequest = {
          certification_id: certificationId
        };
        await resumeService.addCertificationToResume(resumeId, addData);
        setSelectedCertifications(prev => [...prev, certificationId]);
      }
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.detail || 'Failed to update certification.' 
      });
    }
  };

  const handleToggleSkill = async (skillId: string) => {
    const isSelected = selectedSkills.includes(skillId);
    
    try {
      if (isSelected) {
        // Remove from resume
        const resumeSkill = resume?.skills?.find(skill => skill.profile_skill_id === skillId);
        if (resumeSkill) {
          await resumeService.removeSkillFromResume(resumeId, resumeSkill.id);
          setSelectedSkills(prev => prev.filter(id => id !== skillId));
        }
      } else {
        // Add to resume
        const addData: AddSkillToResumeRequest = {
          profile_skill_id: skillId
        };
        await resumeService.addSkillToResume(resumeId, addData);
        setSelectedSkills(prev => [...prev, skillId]);
      }
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.detail || 'Failed to update skill.' 
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short' 
    });
  };

  if (authLoading || isLoading) {
    return (
      <AppShell>
        <PageTransition className="min-h-screen" style={{ background: '#F9FAFB' }}>
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        </PageTransition>
      </AppShell>
    );
  }

  if (!isAuthenticated || !user) {
    router.push('/login');
    return null;
  }

  if (!resume) {
    return (
      <AppShell>
        <PageTransition className="min-h-screen" style={{ background: '#F9FAFB' }}>
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-[#0F172A] mb-2">Resume Not Found</h1>
            <p className="text-[#475569] mb-4">The resume you're looking for doesn't exist.</p>
            <Button onClick={() => router.push('/candidate/resumes')} className="px-6 py-2 bg-[#3056F5] text-white rounded-xl">
              Back to Resumes
            </Button>
          </div>
        </PageTransition>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageTransition className="min-h-screen" style={{ background: '#F9FAFB' }}>
        <div className="space-y-8">
          {/* Header */}
          <AnimatedContainer direction="up" delay={0.1}>
            <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    onClick={() => router.push('/candidate/resumes')}
                    className="p-2 border-[#D1D5DB] hover:bg-gray-50"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  <div>
                    <h1 className="text-2xl font-bold text-[#0F172A]">Resume Editor</h1>
                    <p className="text-[#475569]">Customize your resume by selecting from your profile data</p>
                  </div>
                </div>
                <Button
                  onClick={handleSaveResume}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-3 bg-[#3056F5] hover:bg-[#1E40AF] text-white rounded-xl"
                >
                  {isSaving ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {isSaving ? 'Saving...' : 'Save Resume'}
                </Button>
              </div>
            </div>
          </AnimatedContainer>

          {message && (
            <AnimatedContainer direction="up" delay={0.2}>
              <div className={`p-4 rounded-xl border flex items-center gap-3 ${
                message.type === 'success' 
                  ? 'bg-green-50 text-green-700 border-green-200' 
                  : 'bg-red-50 text-red-700 border-red-200'
              }`}>
                {message.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                )}
                <span className="font-medium">{message.text}</span>
              </div>
            </AnimatedContainer>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Resume Setup */}
            <AnimatedContainer direction="up" delay={0.3}>
              <div className="space-y-6">
                {/* Resume Information */}
                <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <FileText className="w-5 h-5 text-[#3056F5]" />
                    <h3 className="text-lg font-semibold text-[#0F172A]">Resume Information</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Resume Name *</Label>
                      <Input
                        id="name"
                        value={resumeForm.name}
                        onChange={(e) => setResumeForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Software Engineer Resume"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <User className="w-5 h-5 text-[#3056F5]" />
                    <h3 className="text-lg font-semibold text-[#0F172A]">Contact Information</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="contact_full_name">Full Name</Label>
                        <Input
                          id="contact_full_name"
                          value={resumeForm.contact_full_name}
                          onChange={(e) => setResumeForm(prev => ({ ...prev, contact_full_name: e.target.value }))}
                          placeholder="Your full name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contact_email">Email</Label>
                        <Input
                          id="contact_email"
                          type="email"
                          value={resumeForm.contact_email}
                          onChange={(e) => setResumeForm(prev => ({ ...prev, contact_email: e.target.value }))}
                          placeholder="your.email@example.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contact_phone">Phone</Label>
                        <Input
                          id="contact_phone"
                          value={resumeForm.contact_phone}
                          onChange={(e) => setResumeForm(prev => ({ ...prev, contact_phone: e.target.value }))}
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contact_location">Location</Label>
                        <Input
                          id="contact_location"
                          value={resumeForm.contact_location}
                          onChange={(e) => setResumeForm(prev => ({ ...prev, contact_location: e.target.value }))}
                          placeholder="City, State"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="custom_summary">Professional Summary</Label>
                      <Textarea
                        id="custom_summary"
                        value={resumeForm.custom_summary}
                        onChange={(e) => setResumeForm(prev => ({ ...prev, custom_summary: e.target.value }))}
                        placeholder="Write a custom summary for this resume..."
                        rows={4}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedContainer>

            {/* Right Column - Resume Content Editor */}
            <AnimatedContainer direction="up" delay={0.4}>
              <div className="space-y-6">
                {/* Work Experience Editor */}
                <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-[#3056F5]" />
                    <h3 className="text-lg font-semibold text-[#0F172A]">Work Experience</h3>
                    </div>
                    <Button
                      onClick={() => {/* Add new experience */}}
                      className="flex items-center gap-2 px-3 py-2 bg-[#3056F5] text-white rounded-lg text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Add Experience
                    </Button>
                  </div>
                  
                  {resume?.experiences?.length === 0 ? (
                    <div className="text-center py-8 text-[#6B7280]">
                      <Briefcase className="w-12 h-12 mx-auto mb-3 text-[#9CA3AF]" />
                      <p>No work experience added yet</p>
                      <p className="text-sm">Add your work experience to build your resume</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {resume?.experiences?.map((resumeExp, index) => (
                        <div key={resumeExp.id} className="border border-[#E5E7EB] rounded-xl p-4 hover:border-[#3056F5]/30 transition-colors">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                <div>
                                  <Label className="text-xs text-[#6B7280]">Job Title</Label>
                                  <Input
                                    value={resumeExp.work_experience?.job_title || ''}
                                    onChange={(e) => {/* Handle edit */}}
                                    className="h-8 text-sm"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs text-[#6B7280]">Company</Label>
                                  <Input
                                    value={resumeExp.work_experience?.company || ''}
                                    onChange={(e) => {/* Handle edit */}}
                                    className="h-8 text-sm"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs text-[#6B7280]">Location</Label>
                                  <Input
                                    value={resumeExp.work_experience?.location || ''}
                                    onChange={(e) => {/* Handle edit */}}
                                    className="h-8 text-sm"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs text-[#6B7280]">Duration</Label>
                                  <div className="flex gap-2">
                                    <Input
                                      type="date"
                                      value={resumeExp.work_experience?.start_date || ''}
                                      onChange={(e) => {/* Handle edit */}}
                                      className="h-8 text-sm"
                                    />
                                    <Input
                                      type="date"
                                      value={resumeExp.work_experience?.end_date || ''}
                                      onChange={(e) => {/* Handle edit */}}
                                      className="h-8 text-sm"
                                    />
                                  </div>
                                </div>
                              </div>
                              <div>
                                <Label className="text-xs text-[#6B7280]">Description</Label>
                                <Textarea
                                  value={resumeExp.custom_description}
                                  onChange={(e) => {/* Handle edit */}}
                                  rows={3}
                                  className="text-sm"
                                />
                              </div>
                            </div>
                            <div className="flex gap-1 ml-4">
                              <Button
                                variant="outline"
                                size="sm"
                                className="p-2 border-[#D1D5DB] hover:bg-gray-50"
                                title="Move up"
                              >
                                <ArrowUp className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="p-2 border-[#D1D5DB] hover:bg-gray-50"
                                title="Move down"
                              >
                                <ArrowDown className="w-4 h-4" />
                              </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {/* Remove experience */}}
                                className="p-2 border-red-200 text-red-600 hover:bg-red-50"
                                title="Remove"
                              >
                                <X className="w-4 h-4" />
                            </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Education Editor */}
                <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-[#3056F5]" />
                    <h3 className="text-lg font-semibold text-[#0F172A]">Education</h3>
                    </div>
                    <Button
                      onClick={() => {/* Add new education */}}
                      className="flex items-center gap-2 px-3 py-2 bg-[#3056F5] text-white rounded-lg text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Add Education
                    </Button>
                  </div>
                  
                  {resume?.educations?.length === 0 ? (
                    <div className="text-center py-8 text-[#6B7280]">
                      <GraduationCap className="w-12 h-12 mx-auto mb-3 text-[#9CA3AF]" />
                      <p>No education added yet</p>
                      <p className="text-sm">Add your education to build your resume</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {resume?.educations?.map((resumeEdu, index) => (
                        <div key={resumeEdu.id} className="border border-[#E5E7EB] rounded-xl p-4 hover:border-[#3056F5]/30 transition-colors">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                <div>
                                  <Label className="text-xs text-[#6B7280]">Degree</Label>
                                  <Input
                                    value={resumeEdu.education_record?.degree || ''}
                                    onChange={(e) => {/* Handle edit */}}
                                    className="h-8 text-sm"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs text-[#6B7280]">School/University</Label>
                                  <Input
                                    value={resumeEdu.education_record?.school_university || ''}
                                    onChange={(e) => {/* Handle edit */}}
                                    className="h-8 text-sm"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs text-[#6B7280]">Field of Study</Label>
                                  <Input
                                    value={resumeEdu.education_record?.field_of_study || ''}
                                    onChange={(e) => {/* Handle edit */}}
                                    className="h-8 text-sm"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs text-[#6B7280]">GPA</Label>
                                  <Input
                                    value={resumeEdu.education_record?.gpa || ''}
                                    onChange={(e) => {/* Handle edit */}}
                                    className="h-8 text-sm"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs text-[#6B7280]">Location</Label>
                                  <Input
                                    value={resumeEdu.education_record?.location || ''}
                                    onChange={(e) => {/* Handle edit */}}
                                    className="h-8 text-sm"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs text-[#6B7280]">Duration</Label>
                                  <div className="flex gap-2">
                                    <Input
                                      type="date"
                                      value={resumeEdu.education_record?.start_date || ''}
                                      onChange={(e) => {/* Handle edit */}}
                                      className="h-8 text-sm"
                                    />
                                    <Input
                                      type="date"
                                      value={resumeEdu.education_record?.end_date || ''}
                                      onChange={(e) => {/* Handle edit */}}
                                      className="h-8 text-sm"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-1 ml-4">
                              <Button
                                variant="outline"
                                size="sm"
                                className="p-2 border-[#D1D5DB] hover:bg-gray-50"
                                title="Move up"
                              >
                                <ArrowUp className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="p-2 border-[#D1D5DB] hover:bg-gray-50"
                                title="Move down"
                              >
                                <ArrowDown className="w-4 h-4" />
                              </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {/* Remove education */}}
                                className="p-2 border-red-200 text-red-600 hover:bg-red-50"
                                title="Remove"
                              >
                                <X className="w-4 h-4" />
                            </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Skills Editor */}
                <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-[#3056F5]" />
                    <h3 className="text-lg font-semibold text-[#0F172A]">Skills</h3>
                    </div>
                    <Button
                      onClick={() => {/* Add new skill */}}
                      className="flex items-center gap-2 px-3 py-2 bg-[#3056F5] text-white rounded-lg text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Add Skill
                    </Button>
                  </div>
                  
                  {resume?.skills?.length === 0 ? (
                    <div className="text-center py-8 text-[#6B7280]">
                      <Settings className="w-12 h-12 mx-auto mb-3 text-[#9CA3AF]" />
                      <p>No skills added yet</p>
                      <p className="text-sm">Add your skills to build your resume</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {resume?.skills?.map((resumeSkill, index) => (
                        <div key={resumeSkill.id} className="border border-[#E5E7EB] rounded-xl p-4 hover:border-[#3056F5]/30 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div>
                                <Label className="text-xs text-[#6B7280]">Skill Name</Label>
                                <Input
                                  value={resumeSkill.profile_skill?.skill_name || ''}
                                  onChange={(e) => {/* Handle edit */}}
                                  className="h-8 text-sm"
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-[#6B7280]">Proficiency Level</Label>
                                <select
                                  value={resumeSkill.profile_skill?.proficiency_level || ''}
                                  onChange={(e) => {/* Handle edit */}}
                                  className="h-8 text-sm w-full px-3 py-1 border border-[#D1D5DB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3056F5]"
                                >
                                  <option value="Beginner">Beginner</option>
                                  <option value="Intermediate">Intermediate</option>
                                  <option value="Advanced">Advanced</option>
                                  <option value="Expert">Expert</option>
                                </select>
                              </div>
                              <div>
                                <Label className="text-xs text-[#6B7280]">Years of Experience</Label>
                                <Input
                                  type="number"
                                  value={resumeSkill.profile_skill?.years_of_experience || ''}
                                  onChange={(e) => {/* Handle edit */}}
                                  className="h-8 text-sm"
                                />
                              </div>
                            </div>
                            <div className="flex gap-1 ml-4">
                              <Button
                                variant="outline"
                                size="sm"
                                className="p-2 border-[#D1D5DB] hover:bg-gray-50"
                                title="Move up"
                              >
                                <ArrowUp className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="p-2 border-[#D1D5DB] hover:bg-gray-50"
                                title="Move down"
                              >
                                <ArrowDown className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {/* Remove skill */}}
                                className="p-2 border-red-200 text-red-600 hover:bg-red-50"
                                title="Remove"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Certifications Editor */}
                <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-[#3056F5]" />
                    <h3 className="text-lg font-semibold text-[#0F172A]">Certifications</h3>
                    </div>
                    <Button
                      onClick={() => {/* Add new certification */}}
                      className="flex items-center gap-2 px-3 py-2 bg-[#3056F5] text-white rounded-lg text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Add Certification
                    </Button>
                  </div>
                  
                  {resume?.certifications?.length === 0 ? (
                    <div className="text-center py-8 text-[#6B7280]">
                      <Award className="w-12 h-12 mx-auto mb-3 text-[#9CA3AF]" />
                      <p>No certifications added yet</p>
                      <p className="text-sm">Add your certifications to build your resume</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {resume?.certifications?.map((resumeCert, index) => (
                        <div key={resumeCert.id} className="border border-[#E5E7EB] rounded-xl p-4 hover:border-[#3056F5]/30 transition-colors">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                <div>
                                  <Label className="text-xs text-[#6B7280]">Certification Name</Label>
                                  <Input
                                    value={resumeCert.certification?.name || ''}
                                    onChange={(e) => {/* Handle edit */}}
                                    className="h-8 text-sm"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs text-[#6B7280]">Issuing Body</Label>
                                  <Input
                                    value={resumeCert.certification?.issuing_body || ''}
                                    onChange={(e) => {/* Handle edit */}}
                                    className="h-8 text-sm"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs text-[#6B7280]">Credential ID</Label>
                                  <Input
                                    value={resumeCert.certification?.credential_id || ''}
                                    onChange={(e) => {/* Handle edit */}}
                                    className="h-8 text-sm"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs text-[#6B7280]">Credential URL</Label>
                                  <Input
                                    value={resumeCert.certification?.credential_url || ''}
                                    onChange={(e) => {/* Handle edit */}}
                                    className="h-8 text-sm"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs text-[#6B7280]">Issue Date</Label>
                                  <Input
                                    type="date"
                                    value={resumeCert.certification?.issue_date || ''}
                                    onChange={(e) => {/* Handle edit */}}
                                    className="h-8 text-sm"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs text-[#6B7280]">Expiration Date</Label>
                                  <Input
                                    type="date"
                                    value={resumeCert.certification?.expiration_date || ''}
                                    onChange={(e) => {/* Handle edit */}}
                                    className="h-8 text-sm"
                                  />
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-1 ml-4">
                              <Button
                                variant="outline"
                                size="sm"
                                className="p-2 border-[#D1D5DB] hover:bg-gray-50"
                                title="Move up"
                              >
                                <ArrowUp className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="p-2 border-[#D1D5DB] hover:bg-gray-50"
                                title="Move down"
                              >
                                <ArrowDown className="w-4 h-4" />
                              </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {/* Remove certification */}}
                                className="p-2 border-red-200 text-red-600 hover:bg-red-50"
                                title="Remove"
                              >
                                <X className="w-4 h-4" />
                            </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </AnimatedContainer>
          </div>
        </div>
      </PageTransition>
    </AppShell>
  );
}
