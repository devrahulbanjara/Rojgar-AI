'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { AppShell } from '../../../components/layout/AppShell';
import { PageTransition, AnimatedContainer } from '../../../components/common';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import { resumeService, ResumeAutofillData, WorkExperienceAutofill, EducationAutofill, CertificationAutofill, SkillAutofill } from '../../../services/resumeService';
import { FileText, Plus, Edit, Eye, Trash2, Calendar, CheckCircle, AlertCircle, User, Briefcase, GraduationCap, Award, Code, ChevronDown, ChevronUp } from 'lucide-react';
import type { Resume, ResumeCreateRequest } from '../../../types/resume';

export default function ResumeDashboard() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [createForm, setCreateForm] = useState({
    name: '',
    contact_full_name: '',
    contact_email: '',
    contact_phone: '',
    contact_location: '',
    custom_summary: '',
  });

  const [autofillData, setAutofillData] = useState<ResumeAutofillData | null>(null);
  const [selectedExperiences, setSelectedExperiences] = useState<Set<string>>(new Set());
  const [selectedEducation, setSelectedEducation] = useState<Set<string>>(new Set());
  const [selectedCertifications, setSelectedCertifications] = useState<Set<string>>(new Set());
  const [selectedSkills, setSelectedSkills] = useState<Set<string>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['experiences', 'education', 'certifications', 'skills']));


  useEffect(() => {
    if (isAuthenticated) {
      loadResumes();
    }
  }, [isAuthenticated]);

  const loadResumes = async () => {
    try {
      setIsLoading(true);
      const resumesData = await resumeService.getResumes();
      setResumes(resumesData);
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: 'Failed to load resumes. Please try again.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadAutofillData = async () => {
    try {
      const data = await resumeService.getAutofillData();
      setAutofillData(data);
      
      // Autofill the form with profile data
      setCreateForm(prev => ({
        ...prev,
        contact_full_name: data.contact_full_name || '',
        contact_email: data.contact_email || '',
        contact_phone: data.contact_phone || '',
        contact_location: data.contact_location || '',
        custom_summary: data.professional_summary || '',
      }));

      // Select all items by default for autofill
      setSelectedExperiences(new Set(data.work_experiences.map(exp => exp.id)));
      setSelectedEducation(new Set(data.education_records.map(edu => edu.id)));
      setSelectedCertifications(new Set(data.certifications.map(cert => cert.id)));
      setSelectedSkills(new Set(data.skills.map(skill => skill.id)));
    } catch (error: any) {
      console.warn('Failed to load autofill data:', error);
      // Don't show error to user, just continue without autofill
    }
  };

  const handleCreateResume = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name.trim()) return;

    try {
      const resumeData: ResumeCreateRequest = {
        name: createForm.name,
        contact_full_name: createForm.contact_full_name || undefined,
        contact_email: createForm.contact_email || undefined,
        contact_phone: createForm.contact_phone || undefined,
        contact_location: createForm.contact_location || undefined,
        custom_summary: createForm.custom_summary || undefined,
      };

      const newResume = await resumeService.createResume(resumeData);
      setResumes(prev => [...prev, newResume]);
      setCreateForm({ 
        name: '', 
        contact_full_name: '', 
        contact_email: '', 
        contact_phone: '', 
        contact_location: '', 
        custom_summary: '' 
      });
      setIsCreating(false);
      setMessage({ type: 'success', text: 'Resume created successfully!' });
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.detail || 'Failed to create resume. Please try again.' 
      });
    }
  };

  const handleDeleteResume = async (id: string) => {
    if (!confirm('Are you sure you want to delete this resume? This action cannot be undone.')) return;

    try {
      await resumeService.deleteResume(id);
      setResumes(prev => prev.filter(resume => resume.id !== id));
      setMessage({ type: 'success', text: 'Resume deleted successfully!' });
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.detail || 'Failed to delete resume.' 
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const toggleExperience = (id: string) => {
    setSelectedExperiences(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleEducation = (id: string) => {
    setSelectedEducation(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleCertification = (id: string) => {
    setSelectedCertifications(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleSkill = (id: string) => {
    setSelectedSkills(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Show loading state while fetching user data
  if (authLoading) {
    return (
      <AppShell>
        <PageTransition className="min-h-screen" style={{ background: '#F9FAFB' }}>
          <div className="space-y-8">
            <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-8">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
                <div className="h-6 bg-gray-200 rounded w-96"></div>
              </div>
            </div>
          </div>
        </PageTransition>
      </AppShell>
    );
  }

  // Show error state if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <AppShell>
        <PageTransition className="min-h-screen" style={{ background: '#F9FAFB' }}>
          <div className="space-y-8">
            <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-8">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-[#0F172A] mb-2">
                  Authentication Required
                </h1>
                <p className="text-[#475569] mb-4">
                  Please log in to view your resumes.
                </p>
                <div className="mt-4">
                  <a 
                    href="/login" 
                    className="inline-flex items-center px-4 py-2 bg-[#3056F5] text-white rounded-lg hover:bg-[#1E40AF] transition-colors"
                  >
                    Go to Login
                  </a>
                </div>
              </div>
            </div>
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
            <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-[#0F172A] mb-2">
                    Resume Builder
                  </h1>
                  <p className="text-[#475569]">
                    Create and manage tailored resumes from your profile data.
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setIsCreating(true);
                    loadAutofillData();
                  }}
                  className="flex items-center gap-2 px-6 py-3 bg-[#3056F5] hover:bg-[#1E40AF] text-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <Plus className="w-5 h-5" />
                  Create New Resume
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

          {/* Create Resume Form */}
          {isCreating && (
            <AnimatedContainer direction="up" delay={0.2}>
              <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6">
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-[#0F172A]">Create New Resume</h3>
                </div>
                
                <form onSubmit={handleCreateResume} className="space-y-6">
                  {/* Resume Information */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-medium text-[#0F172A] flex items-center gap-2">
                      <FileText className="w-5 h-5 text-[#3056F5]" />
                      Resume Information
                    </h4>
                    <div className="space-y-2">
                      <Label htmlFor="name">Resume Name *</Label>
                      <Input
                        id="name"
                        value={createForm.name}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Software Engineer Resume"
                        required
                        className="h-12"
                      />
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-medium text-[#0F172A] flex items-center gap-2">
                      <User className="w-5 h-5 text-[#3056F5]" />
                      Contact Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="contact_full_name">Full Name</Label>
                        <Input
                          id="contact_full_name"
                          value={createForm.contact_full_name}
                          onChange={(e) => setCreateForm(prev => ({ ...prev, contact_full_name: e.target.value }))}
                          placeholder="Your full name"
                          className="h-12"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contact_email">Email</Label>
                        <Input
                          id="contact_email"
                          type="email"
                          value={createForm.contact_email}
                          onChange={(e) => setCreateForm(prev => ({ ...prev, contact_email: e.target.value }))}
                          placeholder="your.email@example.com"
                          className="h-12"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contact_phone">Phone</Label>
                        <Input
                          id="contact_phone"
                          value={createForm.contact_phone}
                          onChange={(e) => setCreateForm(prev => ({ ...prev, contact_phone: e.target.value }))}
                          placeholder="+1 (555) 123-4567"
                          className="h-12"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contact_location">Location</Label>
                        <Input
                          id="contact_location"
                          value={createForm.contact_location}
                          onChange={(e) => setCreateForm(prev => ({ ...prev, contact_location: e.target.value }))}
                          placeholder="City, State"
                          className="h-12"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Professional Summary */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-medium text-[#0F172A] flex items-center gap-2">
                      <FileText className="w-5 h-5 text-[#3056F5]" />
                      Professional Summary
                    </h4>
                    <div className="space-y-2">
                      <Label htmlFor="custom_summary">Summary</Label>
                      <textarea
                        id="custom_summary"
                        value={createForm.custom_summary}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, custom_summary: e.target.value }))}
                        placeholder="Write a professional summary for this resume..."
                        rows={4}
                        className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3056F5] focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Work Experiences Autofill */}
                  {autofillData && autofillData.work_experiences.length > 0 && (
                    <div className="space-y-4">
                      <div 
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => toggleSection('experiences')}
                      >
                        <h4 className="text-lg font-medium text-[#0F172A] flex items-center gap-2">
                          <Briefcase className="w-5 h-5 text-[#3056F5]" />
                          Work Experiences ({selectedExperiences.size} selected)
                        </h4>
                        {expandedSections.has('experiences') ? (
                          <ChevronUp className="w-5 h-5 text-[#6B7280]" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-[#6B7280]" />
                        )}
                      </div>
                      
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-sm text-blue-700">
                          <strong>Note:</strong> All profile data will be automatically included in your resume. 
                          You can customize which items to include after creation.
                        </p>
                      </div>
                      
                      {expandedSections.has('experiences') && (
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                          {autofillData.work_experiences.map((exp) => (
                            <div key={exp.id} className="border border-[#E5E7EB] rounded-lg p-4">
                              <div className="flex items-start gap-3">
                                <input
                                  type="checkbox"
                                  checked={selectedExperiences.has(exp.id)}
                                  onChange={() => toggleExperience(exp.id)}
                                  className="mt-1 h-4 w-4 text-[#3056F5] border-[#D1D5DB] rounded focus:ring-[#3056F5]"
                                />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h5 className="font-medium text-[#0F172A]">{exp.job_title}</h5>
                                    <span className="text-[#6B7280]">at</span>
                                    <span className="font-medium text-[#3056F5]">{exp.company}</span>
                                  </div>
                                  <div className="text-sm text-[#6B7280] mb-2">
                                    {exp.start_date && formatDate(exp.start_date)} - {exp.is_current ? 'Present' : (exp.end_date ? formatDate(exp.end_date) : '')}
                                    {exp.location && ` • ${exp.location}`}
                                  </div>
                                  <p className="text-sm text-[#475569] line-clamp-3">{exp.master_description}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Education Autofill */}
                  {autofillData && autofillData.education_records.length > 0 && (
                    <div className="space-y-4">
                      <div 
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => toggleSection('education')}
                      >
                        <h4 className="text-lg font-medium text-[#0F172A] flex items-center gap-2">
                          <GraduationCap className="w-5 h-5 text-[#3056F5]" />
                          Education ({selectedEducation.size} selected)
                        </h4>
                        {expandedSections.has('education') ? (
                          <ChevronUp className="w-5 h-5 text-[#6B7280]" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-[#6B7280]" />
                        )}
                      </div>
                      
                      {expandedSections.has('education') && (
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                          {autofillData.education_records.map((edu) => (
                            <div key={edu.id} className="border border-[#E5E7EB] rounded-lg p-4">
                              <div className="flex items-start gap-3">
                                <input
                                  type="checkbox"
                                  checked={selectedEducation.has(edu.id)}
                                  onChange={() => toggleEducation(edu.id)}
                                  className="mt-1 h-4 w-4 text-[#3056F5] border-[#D1D5DB] rounded focus:ring-[#3056F5]"
                                />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h5 className="font-medium text-[#0F172A]">{edu.degree}</h5>
                                    <span className="text-[#6B7280]">in</span>
                                    <span className="font-medium text-[#3056F5]">{edu.field_of_study}</span>
                                  </div>
                                  <div className="text-sm text-[#6B7280] mb-1">
                                    {edu.school_university}
                                    {edu.location && ` • ${edu.location}`}
                                  </div>
                                  <div className="text-sm text-[#6B7280]">
                                    {edu.start_date && formatDate(edu.start_date)} - {edu.is_current ? 'Present' : (edu.end_date ? formatDate(edu.end_date) : '')}
                                    {edu.gpa && ` • GPA: ${edu.gpa}`}
                                    {edu.honors && ` • ${edu.honors}`}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Certifications Autofill */}
                  {autofillData && autofillData.certifications.length > 0 && (
                    <div className="space-y-4">
                      <div 
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => toggleSection('certifications')}
                      >
                        <h4 className="text-lg font-medium text-[#0F172A] flex items-center gap-2">
                          <Award className="w-5 h-5 text-[#3056F5]" />
                          Certifications ({selectedCertifications.size} selected)
                        </h4>
                        {expandedSections.has('certifications') ? (
                          <ChevronUp className="w-5 h-5 text-[#6B7280]" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-[#6B7280]" />
                        )}
                      </div>
                      
                      {expandedSections.has('certifications') && (
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                          {autofillData.certifications.map((cert) => (
                            <div key={cert.id} className="border border-[#E5E7EB] rounded-lg p-4">
                              <div className="flex items-start gap-3">
                                <input
                                  type="checkbox"
                                  checked={selectedCertifications.has(cert.id)}
                                  onChange={() => toggleCertification(cert.id)}
                                  className="mt-1 h-4 w-4 text-[#3056F5] border-[#D1D5DB] rounded focus:ring-[#3056F5]"
                                />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h5 className="font-medium text-[#0F172A]">{cert.name}</h5>
                                    <span className="text-[#6B7280]">by</span>
                                    <span className="font-medium text-[#3056F5]">{cert.issuing_body}</span>
                                  </div>
                                  <div className="text-sm text-[#6B7280]">
                                    {cert.issue_date && `Issued: ${formatDate(cert.issue_date)}`}
                                    {cert.expiration_date && !cert.does_not_expire && ` • Expires: ${formatDate(cert.expiration_date)}`}
                                    {cert.does_not_expire && ' • No expiration'}
                                    {cert.credential_id && ` • ID: ${cert.credential_id}`}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Skills Autofill */}
                  {autofillData && autofillData.skills.length > 0 && (
                    <div className="space-y-4">
                      <div 
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => toggleSection('skills')}
                      >
                        <h4 className="text-lg font-medium text-[#0F172A] flex items-center gap-2">
                          <Code className="w-5 h-5 text-[#3056F5]" />
                          Skills ({selectedSkills.size} selected)
                        </h4>
                        {expandedSections.has('skills') ? (
                          <ChevronUp className="w-5 h-5 text-[#6B7280]" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-[#6B7280]" />
                        )}
                      </div>
                      
                      {expandedSections.has('skills') && (
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {autofillData.skills.map((skill) => (
                              <div key={skill.id} className="border border-[#E5E7EB] rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                  <input
                                    type="checkbox"
                                    checked={selectedSkills.has(skill.id)}
                                    onChange={() => toggleSkill(skill.id)}
                                    className="mt-1 h-4 w-4 text-[#3056F5] border-[#D1D5DB] rounded focus:ring-[#3056F5]"
                                  />
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h5 className="font-medium text-[#0F172A]">{skill.skill_name}</h5>
                                      <span className="text-sm text-[#6B7280] bg-[#F3F4F6] px-2 py-1 rounded">
                                        {skill.proficiency_level}
                                      </span>
                                    </div>
                                    {skill.years_of_experience && (
                                      <div className="text-sm text-[#6B7280]">
                                        {skill.years_of_experience} years experience
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <Button type="submit" className="px-6 py-2 bg-[#3056F5] text-white rounded-xl">
                      Create Resume
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsCreating(false)}
                      className="px-6 py-2 border-[#D1D5DB] rounded-xl"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            </AnimatedContainer>
          )}

          {/* Resumes Grid - Only show when not creating */}
          {!isCreating && (
            <AnimatedContainer direction="up" delay={0.3}>
              <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-8">
                <div className="flex items-center gap-2 mb-6">
                  <FileText className="w-5 h-5 text-[#3056F5]" />
                  <h2 className="text-xl font-semibold text-[#0F172A]">Your Resumes</h2>
                </div>

                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <LoadingSpinner size="lg" />
                  </div>
                ) : resumes.length === 0 ? (
                  <div className="text-center py-12 text-[#6B7280]">
                    <FileText className="w-16 h-16 mx-auto mb-4 text-[#9CA3AF]" />
                    <h3 className="text-xl font-semibold mb-2">No resumes created yet</h3>
                    <p className="mb-6">Create your first resume to get started!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {resumes.map((resume) => (
                      <div key={resume.id} className="bg-white rounded-2xl border border-[#E5E7EB] p-6 hover:shadow-lg hover:border-[#3056F5]/20 transition-all duration-300">
                        {/* Header */}
                        <div className="mb-4">
                          <h3 className="font-semibold text-[#0F172A] text-lg mb-2">{resume.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-[#6B7280]">
                            <Calendar className="w-4 h-4" />
                            <span>Created {formatDate(resume.created_at)}</span>
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <Button
                            className="flex-1 px-4 py-2.5 bg-[#3056F5] hover:bg-[#1E40AF] text-white rounded-xl text-sm font-medium"
                            onClick={() => window.location.href = `/candidate/resumes/edit/${resume.id}`}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            className="px-4 py-2.5 border-[#D1D5DB] hover:bg-gray-50 hover:border-[#3056F5] hover:text-[#3056F5] rounded-xl text-sm font-medium transition-colors"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Preview
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleDeleteResume(resume.id)}
                            className="px-4 py-2.5 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 rounded-xl transition-colors"
                            title="Delete resume"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </AnimatedContainer>
          )}
        </div>
      </PageTransition>
    </AppShell>
  );
}
