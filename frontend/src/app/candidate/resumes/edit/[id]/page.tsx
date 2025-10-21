'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../../../hooks/useAuth';
import { AppShell } from '../../../../../components/layout/AppShell';
import { PageTransition, AnimatedContainer, PageHeader } from '../../../../../components/common';
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
  AlertCircle
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
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  
  const [resumeForm, setResumeForm] = useState({
    name: '',
    contact_full_name: '',
    contact_email: '',
    contact_phone: '',
    contact_location: '',
    custom_summary: '',
    linkedin_url: '',
    github_url: '',
    portfolio_url: '',
  });

  const [selectedExperiences, setSelectedExperiences] = useState<string[]>([]);
  const [selectedEducation, setSelectedEducation] = useState<string[]>([]);
  const [selectedCertifications, setSelectedCertifications] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  // New section form states
  const [showNewExperienceForm, setShowNewExperienceForm] = useState(false);
  const [showNewEducationForm, setShowNewEducationForm] = useState(false);
  const [showNewCertificationForm, setShowNewCertificationForm] = useState(false);
  const [showNewSkillForm, setShowNewSkillForm] = useState(false);

  // New section form data
  const [newExperienceForm, setNewExperienceForm] = useState({
    job_title: '',
    company: '',
    location: '',
    start_date: '',
    end_date: '',
    is_current: false,
    master_description: ''
  });

  const [newEducationForm, setNewEducationForm] = useState({
    school_university: '',
    degree: '',
    field_of_study: '',
    location: '',
    start_date: '',
    end_date: '',
    is_current: false,
    gpa: '',
    honors: ''
  });

  const [newCertificationForm, setNewCertificationForm] = useState({
    name: '',
    issuing_body: '',
    credential_id: '',
    credential_url: '',
    issue_date: '',
    expiration_date: '',
    does_not_expire: false
  });

  const [newSkillForm, setNewSkillForm] = useState({
    skill_name: '',
    proficiency_level: 'Intermediate',
    years_of_experience: ''
  });

  // State for editing existing items
  const [editingExperience, setEditingExperience] = useState<{[key: string]: any}>({});
  const [editingEducation, setEditingEducation] = useState<{[key: string]: any}>({});
  const [editingCertification, setEditingCertification] = useState<{[key: string]: any}>({});
  const [editingSkill, setEditingSkill] = useState<{[key: string]: any}>({});

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
        linkedin_url: resumeData.linkedin_url || '',
        github_url: resumeData.github_url || '',
        portfolio_url: resumeData.portfolio_url || '',
      });

      // Set selected items
      setSelectedExperiences(resumeData.experiences?.map(exp => exp.work_experience_id) || []);
      setSelectedEducation(resumeData.educations?.map(edu => edu.education_record_id) || []);
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
      
      // First, save all pending work experience edits
      const experienceUpdatePromises = Object.entries(editingExperience).map(async ([resumeExpId, experienceData]) => {
        if (experienceData && Object.keys(experienceData).length > 0) {
          return handleUpdateExperience(resumeExpId, experienceData);
        }
      });
      
      // Save all pending education edits
      const educationUpdatePromises = Object.entries(editingEducation).map(async ([resumeEduId, educationData]) => {
        if (educationData && Object.keys(educationData).length > 0) {
          return handleUpdateEducation(resumeEduId, educationData);
        }
      });
      
      // Save all pending certification edits
      const certificationUpdatePromises = Object.entries(editingCertification).map(async ([resumeCertId, certificationData]) => {
        if (certificationData && Object.keys(certificationData).length > 0) {
          return handleUpdateCertification(resumeCertId, certificationData);
        }
      });
      
      // Save all pending skill edits
      const skillUpdatePromises = Object.entries(editingSkill).map(async ([resumeSkillId, skillData]) => {
        if (skillData && Object.keys(skillData).length > 0) {
          return handleUpdateSkill(resumeSkillId, skillData);
        }
      });
      
      // Wait for all updates to complete
      await Promise.all([
        ...experienceUpdatePromises,
        ...educationUpdatePromises,
        ...certificationUpdatePromises,
        ...skillUpdatePromises
      ]);
      
      // Clear all editing states after successful updates
      setEditingExperience({});
      setEditingEducation({});
      setEditingCertification({});
      setEditingSkill({});
      
      // Then save the resume basic information
      const updateData: ResumeUpdateRequest = {
        name: resumeForm.name,
        contact_full_name: resumeForm.contact_full_name || undefined,
        contact_email: resumeForm.contact_email || undefined,
        contact_phone: resumeForm.contact_phone || undefined,
        contact_location: resumeForm.contact_location || undefined,
        custom_summary: resumeForm.custom_summary || undefined,
        linkedin_url: resumeForm.linkedin_url || undefined,
        github_url: resumeForm.github_url || undefined,
        portfolio_url: resumeForm.portfolio_url || undefined,
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
        const resumeEducation = resume?.educations?.find(edu => edu.education_record_id === educationId);
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

  const handleRemoveEducation = async (resumeEducationId: string) => {
    try {
      await resumeService.removeEducationFromResume(resumeId, resumeEducationId);
      // Reload the resume data to get updated education list
      await loadData();
      setMessage({ type: 'success', text: 'Education removed from resume successfully!' });
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.detail || 'Failed to remove education.' 
      });
    }
  };

  const handleAddEducation = async (educationId: string) => {
    try {
      const addData: AddEducationToResumeRequest = {
        education_record_id: educationId
      };
      await resumeService.addEducationToResume(resumeId, addData);
      // Reload the resume data to get updated education list
      await loadData();
      setMessage({ type: 'success', text: 'Education added to resume successfully!' });
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.detail || 'Failed to add education.' 
      });
    }
  };

  const handleAddSkill = async (skillId: string) => {
    try {
      const addData: AddSkillToResumeRequest = {
        profile_skill_id: skillId
      };
      await resumeService.addSkillToResume(resumeId, addData);
      // Reload the resume data to get updated skills list
      await loadData();
      setMessage({ type: 'success', text: 'Skill added to resume successfully!' });
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.detail || 'Failed to add skill.' 
      });
    }
  };

  const handleAddCertification = async (certificationId: string) => {
    try {
      const addData: AddCertificationToResumeRequest = {
        certification_id: certificationId
      };
      await resumeService.addCertificationToResume(resumeId, addData);
      // Reload the resume data to get updated certifications list
      await loadData();
      setMessage({ type: 'success', text: 'Certification added to resume successfully!' });
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.detail || 'Failed to add certification.' 
      });
    }
  };

  const handleAddExperience = async (experienceId: string) => {
    try {
      const experience = profileData.workExperiences.find(exp => exp.id === experienceId);
      if (experience) {
        const addData: AddExperienceToResumeRequest = {
          work_experience_id: experienceId,
          custom_description: experience.master_description
        };
        await resumeService.addExperienceToResume(resumeId, addData);
        // Reload the resume data to get updated experiences list
        await loadData();
        setMessage({ type: 'success', text: 'Work experience added to resume successfully!' });
      }
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.detail || 'Failed to add work experience.' 
      });
    }
  };

  const handleRemoveExperience = async (resumeExperienceId: string) => {
    try {
      await resumeService.removeExperienceFromResume(resumeId, resumeExperienceId);
      // Reload the resume data to get updated experiences list
      await loadData();
      setMessage({ type: 'success', text: 'Work experience removed from resume successfully!' });
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.detail || 'Failed to remove work experience.' 
      });
    }
  };

  const handleRemoveCertification = async (resumeCertificationId: string) => {
    try {
      await resumeService.removeCertificationFromResume(resumeId, resumeCertificationId);
      // Reload the resume data to get updated certifications list
      await loadData();
      setMessage({ type: 'success', text: 'Certification removed from resume successfully!' });
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.detail || 'Failed to remove certification.' 
      });
    }
  };

  const handleRemoveSkill = async (resumeSkillId: string) => {
    try {
      await resumeService.removeSkillFromResume(resumeId, resumeSkillId);
      // Reload the resume data to get updated skills list
      await loadData();
      setMessage({ type: 'success', text: 'Skill removed from resume successfully!' });
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.detail || 'Failed to remove skill.' 
      });
    }
  };

  // Update handlers for inline editing
  const handleUpdateExperience = async (resumeExperienceId: string, experienceData: any) => {
    try {
      if (!experienceData) {
        setMessage({ type: 'error', text: 'No changes to save.' });
        return;
      }

      // Send all work experience data to the backend
      const updateData = {
        custom_description: experienceData.custom_description || '',
        job_title: experienceData.job_title || undefined,
        company: experienceData.company || undefined,
        location: experienceData.location || undefined,
        start_date: experienceData.start_date || undefined,
        end_date: experienceData.end_date || undefined,
        is_current: experienceData.is_current || undefined,
        master_description: experienceData.master_description || undefined
      };

      await resumeService.updateExperienceInResume(resumeId, resumeExperienceId, updateData);
      await loadData();
      setMessage({ type: 'success', text: 'Work experience updated successfully!' });
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.detail || 'Failed to update work experience.' 
      });
    }
  };

  const handleUpdateEducation = async (resumeEducationId: string, educationData: any) => {
    try {
      if (!educationData) {
        setMessage({ type: 'error', text: 'No changes to save.' });
        return;
      }

      await resumeService.updateEducationInResume(resumeId, resumeEducationId, educationData);
      await loadData();
      setMessage({ type: 'success', text: 'Education updated successfully!' });
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.detail || 'Failed to update education.' 
      });
    }
  };

  const handleUpdateCertification = async (resumeCertificationId: string, certificationData: any) => {
    try {
      if (!certificationData) {
        setMessage({ type: 'error', text: 'No changes to save.' });
        return;
      }

      await resumeService.updateCertificationInResume(resumeId, resumeCertificationId, certificationData);
      await loadData();
      setMessage({ type: 'success', text: 'Certification updated successfully!' });
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.detail || 'Failed to update certification.' 
      });
    }
  };

  const handleUpdateSkill = async (resumeSkillId: string, skillData: any) => {
    try {
      if (!skillData) {
        setMessage({ type: 'error', text: 'No changes to save.' });
        return;
      }

      await resumeService.updateSkillInResume(resumeId, resumeSkillId, skillData);
      await loadData();
      setMessage({ type: 'success', text: 'Skill updated successfully!' });
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.detail || 'Failed to update skill.' 
      });
    }
  };

  // New section creation handlers
  const handleCreateNewExperience = async () => {
    try {
      if (!newExperienceForm.job_title || !newExperienceForm.company) {
        setMessage({ type: 'error', text: 'Please fill in required fields (Job Title and Company).' });
        return;
      }

      // Create new work experience directly for this resume (doesn't affect profile)
      const experienceData = {
        job_title: newExperienceForm.job_title,
        company: newExperienceForm.company,
        location: newExperienceForm.location || undefined,
        start_date: newExperienceForm.start_date || new Date().toISOString().split('T')[0],
        end_date: newExperienceForm.end_date || undefined,
        is_current: newExperienceForm.is_current,
        master_description: newExperienceForm.master_description
      };

      await resumeService.createExperienceForResume(resumeId, experienceData);

      // Reset form and reload data
      setNewExperienceForm({
        job_title: '',
        company: '',
        location: '',
        start_date: '',
        end_date: '',
        is_current: false,
        master_description: ''
      });
      setShowNewExperienceForm(false);
      await loadData();
      setMessage({ type: 'success', text: 'New work experience created and added to resume!' });
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.detail || 'Failed to create work experience.' 
      });
    }
  };

  const handleCreateNewEducation = async () => {
    try {
      if (!newEducationForm.school_university || !newEducationForm.degree) {
        setMessage({ type: 'error', text: 'Please fill in required fields (School/University and Degree).' });
        return;
      }

      // Create new education record directly for this resume (doesn't affect profile)
      const educationData = {
        school_university: newEducationForm.school_university,
        degree: newEducationForm.degree,
        field_of_study: newEducationForm.field_of_study || 'General Studies',
        location: newEducationForm.location || undefined,
        start_date: newEducationForm.start_date || undefined,
        end_date: newEducationForm.end_date || undefined,
        is_current: newEducationForm.is_current,
        gpa: newEducationForm.gpa || undefined,
        honors: newEducationForm.honors || undefined
      };

      await resumeService.createEducationForResume(resumeId, educationData);

      // Reset form and reload data
      setNewEducationForm({
        school_university: '',
        degree: '',
        field_of_study: '',
        location: '',
        start_date: '',
        end_date: '',
        is_current: false,
        gpa: '',
        honors: ''
      });
      setShowNewEducationForm(false);
      await loadData();
      setMessage({ type: 'success', text: 'New education record created and added to resume!' });
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.detail || 'Failed to create education record.' 
      });
    }
  };

  const handleCreateNewCertification = async () => {
    try {
      if (!newCertificationForm.name || !newCertificationForm.issuing_body) {
        setMessage({ type: 'error', text: 'Please fill in required fields (Certification Name and Issuing Body).' });
        return;
      }

      // Create new certification directly for this resume (doesn't affect profile)
      const certificationData = {
        name: newCertificationForm.name,
        issuing_body: newCertificationForm.issuing_body,
        credential_id: newCertificationForm.credential_id || undefined,
        credential_url: newCertificationForm.credential_url || undefined,
        issue_date: newCertificationForm.issue_date || undefined,
        expiration_date: newCertificationForm.expiration_date || undefined,
        does_not_expire: newCertificationForm.does_not_expire
      };

      await resumeService.createCertificationForResume(resumeId, certificationData);

      // Reset form and reload data
      setNewCertificationForm({
        name: '',
        issuing_body: '',
        credential_id: '',
        credential_url: '',
        issue_date: '',
        expiration_date: '',
        does_not_expire: false
      });
      setShowNewCertificationForm(false);
      await loadData();
      setMessage({ type: 'success', text: 'New certification created and added to resume!' });
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.detail || 'Failed to create certification.' 
      });
    }
  };

  const handleCreateNewSkill = async () => {
    try {
      if (!newSkillForm.skill_name) {
        setMessage({ type: 'error', text: 'Please fill in the skill name.' });
        return;
      }

      // Create new skill directly for this resume (doesn't affect profile)
      const skillData = {
        skill_name: newSkillForm.skill_name,
        proficiency_level: newSkillForm.proficiency_level,
        years_of_experience: newSkillForm.years_of_experience ? parseInt(newSkillForm.years_of_experience) : undefined
      };

      await resumeService.createSkillForResume(resumeId, skillData);

      // Reset form and reload data
      setNewSkillForm({
        skill_name: '',
        proficiency_level: 'Intermediate',
        years_of_experience: ''
      });
      setShowNewSkillForm(false);
      await loadData();
      setMessage({ type: 'success', text: 'New skill created and added to resume!' });
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.detail || 'Failed to create skill.' 
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
        <div className="space-y-6">
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
                  <PageHeader
                    title="Resume Editor"
                    subtitle="Customize your resume by selecting from your profile data"
                  />
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
                  : message.type === 'error'
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}>
                {message.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                ) : message.type === 'error' ? (
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                )}
                <span className="font-medium">{message.text}</span>
              </div>
            </AnimatedContainer>
          )}

          {/* Resume Details - Single Full-Width Card */}
          <AnimatedContainer direction="up" delay={0.3}>
            <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6">
              <div className="flex items-center gap-2 mb-6">
                <FileText className="w-5 h-5 text-[#3056F5]" />
                <h3 className="text-lg font-semibold text-[#0F172A]">Resume Details</h3>
              </div>
              
              <div className="space-y-6">
                {/* Resume Name - Full Width */}
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

                {/* Contact Information Section Divider */}
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-[#3056F5]" />
                  <h4 className="text-md font-medium text-[#0F172A]">Contact Information</h4>
                </div>
                
                {/* Contact Fields - Two Column Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                {/* Professional Summary - Full Width */}
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

                {/* Professional Links Section Divider */}
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-[#3056F5]" />
                  <h4 className="text-md font-medium text-[#0F172A]">Professional Links</h4>
                </div>
                
                {/* Professional Links - Two Column Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="linkedin_url">LinkedIn URL</Label>
                    <Input
                      id="linkedin_url"
                      value={resumeForm.linkedin_url}
                      onChange={(e) => setResumeForm(prev => ({ ...prev, linkedin_url: e.target.value }))}
                      placeholder="https://linkedin.com/in/yourname"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="github_url">GitHub URL</Label>
                    <Input
                      id="github_url"
                      value={resumeForm.github_url}
                      onChange={(e) => setResumeForm(prev => ({ ...prev, github_url: e.target.value }))}
                      placeholder="https://github.com/yourname"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="portfolio_url">Portfolio URL</Label>
                    <Input
                      id="portfolio_url"
                      value={resumeForm.portfolio_url}
                      onChange={(e) => setResumeForm(prev => ({ ...prev, portfolio_url: e.target.value }))}
                      placeholder="https://yourportfolio.com"
                    />
                  </div>
                </div>
              </div>
            </div>
          </AnimatedContainer>

          {/* Content Sections - Full Width Cards Stacked Vertically */}
          <div className="space-y-6">
            {/* Work Experience Editor */}
            <AnimatedContainer direction="up" delay={0.4}>
              <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-[#3056F5]" />
                    <h3 className="text-lg font-semibold text-[#0F172A]">Work Experience</h3>
                    </div>
                    <Button
                      onClick={() => setShowNewExperienceForm(!showNewExperienceForm)}
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
                    <div className="space-y-3">
                      {resume?.experiences?.map((resumeExp, index) => (
                        <div key={resumeExp.id} className="border border-[#E5E7EB] rounded-xl p-4 hover:border-[#3056F5]/30 transition-colors">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                <div>
                                  <Label className="text-xs text-[#6B7280]">Job Title</Label>
                                  <Input
                                    value={editingExperience[resumeExp.id]?.job_title ?? (resumeExp.job_title || resumeExp.work_experience?.job_title || '')}
                                    onChange={(e) => {
                                      setEditingExperience(prev => ({
                                        ...prev,
                                        [resumeExp.id]: {
                                          ...prev[resumeExp.id],
                                          job_title: e.target.value
                                        }
                                      }));
                                    }}
                                    className="h-8 text-sm"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs text-[#6B7280]">Company</Label>
                                  <Input
                                    value={editingExperience[resumeExp.id]?.company ?? (resumeExp.company || resumeExp.work_experience?.company || '')}
                                    onChange={(e) => {
                                      setEditingExperience(prev => ({
                                        ...prev,
                                        [resumeExp.id]: {
                                          ...prev[resumeExp.id],
                                          company: e.target.value
                                        }
                                      }));
                                    }}
                                    className="h-8 text-sm"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs text-[#6B7280]">Location</Label>
                                  <Input
                                    value={editingExperience[resumeExp.id]?.location ?? (resumeExp.location || resumeExp.work_experience?.location || '')}
                                    onChange={(e) => {
                                      setEditingExperience(prev => ({
                                        ...prev,
                                        [resumeExp.id]: {
                                          ...prev[resumeExp.id],
                                          location: e.target.value
                                        }
                                      }));
                                    }}
                                    className="h-8 text-sm"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs text-[#6B7280]">Duration</Label>
                                  <div className="space-y-2">
                                    <Input
                                      type="date"
                                      value={editingExperience[resumeExp.id]?.start_date ?? (resumeExp.start_date || resumeExp.work_experience?.start_date || '')}
                                      onChange={(e) => {
                                        setEditingExperience(prev => ({
                                          ...prev,
                                          [resumeExp.id]: {
                                            ...prev[resumeExp.id],
                                            start_date: e.target.value
                                          }
                                        }));
                                      }}
                                      className="h-8 text-sm w-full px-3"
                                      placeholder="Start date"
                                    />
                                    <Input
                                      type="date"
                                      value={editingExperience[resumeExp.id]?.end_date ?? (resumeExp.end_date || resumeExp.work_experience?.end_date || '')}
                                      onChange={(e) => {
                                        setEditingExperience(prev => ({
                                          ...prev,
                                          [resumeExp.id]: {
                                            ...prev[resumeExp.id],
                                            end_date: e.target.value
                                          }
                                        }));
                                      }}
                                      className="h-8 text-sm w-full px-3"
                                      placeholder="End date"
                                    />
                                  </div>
                                </div>
                              </div>
                              <div>
                                <Label className="text-xs text-[#6B7280]">Custom Description (Editable)</Label>
                                <Textarea
                                  value={editingExperience[resumeExp.id]?.custom_description ?? resumeExp.custom_description}
                                  onChange={(e) => {
                                    setEditingExperience(prev => ({
                                      ...prev,
                                      [resumeExp.id]: {
                                        ...prev[resumeExp.id],
                                        custom_description: e.target.value
                                      }
                                    }));
                                  }}
                                  rows={3}
                                  className="text-sm"
                                />
                              </div>
                            </div>
                            <div className="flex gap-2 ml-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUpdateExperience(resumeExp.id, editingExperience[resumeExp.id])}
                                className="p-2 border-green-200 text-green-600 hover:bg-green-50"
                                title="Save Changes"
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRemoveExperience(resumeExp.id)}
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

                  {/* New Experience Form */}
                  {showNewExperienceForm && (
                    <div className="mt-6 p-4 border-2 border-dashed border-[#3056F5] rounded-xl bg-blue-50">
                      <h4 className="text-md font-medium text-[#0F172A] mb-4">Add New Work Experience</h4>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm text-[#6B7280]">Job Title *</Label>
                            <Input
                              value={newExperienceForm.job_title}
                              onChange={(e) => setNewExperienceForm(prev => ({ ...prev, job_title: e.target.value }))}
                              placeholder="e.g., Software Engineer"
                              className="h-10"
                            />
                          </div>
                          <div>
                            <Label className="text-sm text-[#6B7280]">Company *</Label>
                            <Input
                              value={newExperienceForm.company}
                              onChange={(e) => setNewExperienceForm(prev => ({ ...prev, company: e.target.value }))}
                              placeholder="e.g., Google"
                              className="h-10"
                            />
                          </div>
                          <div>
                            <Label className="text-sm text-[#6B7280]">Location</Label>
                            <Input
                              value={newExperienceForm.location}
                              onChange={(e) => setNewExperienceForm(prev => ({ ...prev, location: e.target.value }))}
                              placeholder="e.g., San Francisco, CA"
                              className="h-10"
                            />
                          </div>
                          <div>
                            <Label className="text-sm text-[#6B7280]">Start Date</Label>
                            <Input
                              type="date"
                              value={newExperienceForm.start_date}
                              onChange={(e) => setNewExperienceForm(prev => ({ ...prev, start_date: e.target.value }))}
                              className="h-10"
                            />
                          </div>
                          <div>
                            <Label className="text-sm text-[#6B7280]">End Date</Label>
                            <Input
                              type="date"
                              value={newExperienceForm.end_date}
                              onChange={(e) => setNewExperienceForm(prev => ({ ...prev, end_date: e.target.value }))}
                              className="h-10"
                              disabled={newExperienceForm.is_current}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="is_current_exp"
                              checked={newExperienceForm.is_current}
                              onChange={(e) => setNewExperienceForm(prev => ({ ...prev, is_current: e.target.checked }))}
                              className="h-4 w-4 text-[#3056F5] border-[#D1D5DB] rounded focus:ring-[#3056F5]"
                            />
                            <Label htmlFor="is_current_exp" className="text-sm text-[#6B7280]">Currently working here</Label>
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm text-[#6B7280]">Description</Label>
                          <Textarea
                            value={newExperienceForm.master_description}
                            onChange={(e) => setNewExperienceForm(prev => ({ ...prev, master_description: e.target.value }))}
                            placeholder="Describe your role and achievements..."
                            rows={3}
                            className="text-sm"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={handleCreateNewExperience}
                            className="px-4 py-2 bg-[#3056F5] text-white rounded-lg text-sm"
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Create & Add
                          </Button>
                          <Button
                            onClick={() => setShowNewExperienceForm(false)}
                            variant="outline"
                            className="px-4 py-2 border-[#D1D5DB] text-[#6B7280] rounded-lg text-sm"
                          >
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

              </div>
            </AnimatedContainer>

            {/* Education Editor */}
            <AnimatedContainer direction="up" delay={0.5}>
              <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-[#3056F5]" />
                    <h3 className="text-lg font-semibold text-[#0F172A]">Education</h3>
                    </div>
                    <Button
                      onClick={() => setShowNewEducationForm(!showNewEducationForm)}
                      className="flex items-center gap-2 px-3 py-2 bg-[#3056F5] text-white rounded-lg text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Add Education
                    </Button>
                  </div>
                  
                  {!resume?.educations || resume.educations.length === 0 ? (
                    <div className="text-center py-8 text-[#6B7280]">
                      <GraduationCap className="w-12 h-12 mx-auto mb-3 text-[#9CA3AF]" />
                      <p>No education added yet</p>
                      <p className="text-sm">Add your education to build your resume</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {resume.educations.map((resumeEdu, index) => (
                        <div key={resumeEdu.id} className="border border-[#E5E7EB] rounded-xl p-4 hover:border-[#3056F5]/30 transition-colors">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                <div>
                                  <Label className="text-xs text-[#6B7280]">Degree</Label>
                                  <Input
                                    value={editingEducation[resumeEdu.id]?.degree ?? (resumeEdu.degree || resumeEdu.education_record?.degree || '')}
                                    onChange={(e) => {
                                      setEditingEducation(prev => ({
                                        ...prev,
                                        [resumeEdu.id]: {
                                          ...prev[resumeEdu.id],
                                          degree: e.target.value
                                        }
                                      }));
                                    }}
                                    className="h-8 text-sm"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs text-[#6B7280]">School/University</Label>
                                  <Input
                                    value={editingEducation[resumeEdu.id]?.school_university ?? (resumeEdu.school_university || resumeEdu.education_record?.school_university || '')}
                                    onChange={(e) => {
                                      setEditingEducation(prev => ({
                                        ...prev,
                                        [resumeEdu.id]: {
                                          ...prev[resumeEdu.id],
                                          school_university: e.target.value
                                        }
                                      }));
                                    }}
                                    className="h-8 text-sm"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs text-[#6B7280]">Field of Study</Label>
                                  <Input
                                    value={editingEducation[resumeEdu.id]?.field_of_study ?? (resumeEdu.field_of_study || resumeEdu.education_record?.field_of_study || '')}
                                    onChange={(e) => {
                                      setEditingEducation(prev => ({
                                        ...prev,
                                        [resumeEdu.id]: {
                                          ...prev[resumeEdu.id],
                                          field_of_study: e.target.value
                                        }
                                      }));
                                    }}
                                    className="h-8 text-sm"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs text-[#6B7280]">GPA</Label>
                                  <Input
                                    value={editingEducation[resumeEdu.id]?.gpa ?? (resumeEdu.gpa || resumeEdu.education_record?.gpa || '')}
                                    onChange={(e) => {
                                      setEditingEducation(prev => ({
                                        ...prev,
                                        [resumeEdu.id]: {
                                          ...prev[resumeEdu.id],
                                          gpa: e.target.value
                                        }
                                      }));
                                    }}
                                    className="h-8 text-sm"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs text-[#6B7280]">Location</Label>
                                  <Input
                                    value={editingEducation[resumeEdu.id]?.location ?? (resumeEdu.location || resumeEdu.education_record?.location || '')}
                                    onChange={(e) => {
                                      setEditingEducation(prev => ({
                                        ...prev,
                                        [resumeEdu.id]: {
                                          ...prev[resumeEdu.id],
                                          location: e.target.value
                                        }
                                      }));
                                    }}
                                    className="h-8 text-sm"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs text-[#6B7280]">Duration</Label>
                                  <div className="space-y-2">
                                    <Input
                                      type="date"
                                      value={editingEducation[resumeEdu.id]?.start_date ?? (resumeEdu.start_date || resumeEdu.education_record?.start_date || '')}
                                      onChange={(e) => {
                                        setEditingEducation(prev => ({
                                          ...prev,
                                          [resumeEdu.id]: {
                                            ...prev[resumeEdu.id],
                                            start_date: e.target.value
                                          }
                                        }));
                                      }}
                                      className="h-8 text-sm w-full px-3"
                                      placeholder="Start date"
                                    />
                                    <Input
                                      type="date"
                                      value={editingEducation[resumeEdu.id]?.end_date ?? (resumeEdu.end_date || resumeEdu.education_record?.end_date || '')}
                                      onChange={(e) => {
                                        setEditingEducation(prev => ({
                                          ...prev,
                                          [resumeEdu.id]: {
                                            ...prev[resumeEdu.id],
                                            end_date: e.target.value
                                          }
                                        }));
                                      }}
                                      className="h-8 text-sm w-full px-3"
                                      placeholder="End date"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2 ml-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUpdateEducation(resumeEdu.id, editingEducation[resumeEdu.id])}
                                className="p-2 border-green-200 text-green-600 hover:bg-green-50"
                                title="Save Changes"
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRemoveEducation(resumeEdu.id)}
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

                  {/* New Education Form */}
                  {showNewEducationForm && (
                    <div className="mt-6 p-4 border-2 border-dashed border-[#3056F5] rounded-xl bg-blue-50">
                      <h4 className="text-md font-medium text-[#0F172A] mb-4">Add New Education</h4>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm text-[#6B7280]">School/University *</Label>
                            <Input
                              value={newEducationForm.school_university}
                              onChange={(e) => setNewEducationForm(prev => ({ ...prev, school_university: e.target.value }))}
                              placeholder="e.g., Stanford University"
                              className="h-10"
                            />
                          </div>
                          <div>
                            <Label className="text-sm text-[#6B7280]">Degree *</Label>
                            <Input
                              value={newEducationForm.degree}
                              onChange={(e) => setNewEducationForm(prev => ({ ...prev, degree: e.target.value }))}
                              placeholder="e.g., Bachelor of Science"
                              className="h-10"
                            />
                          </div>
                          <div>
                            <Label className="text-sm text-[#6B7280]">Field of Study</Label>
                            <Input
                              value={newEducationForm.field_of_study}
                              onChange={(e) => setNewEducationForm(prev => ({ ...prev, field_of_study: e.target.value }))}
                              placeholder="e.g., Computer Science"
                              className="h-10"
                            />
                          </div>
                          <div>
                            <Label className="text-sm text-[#6B7280]">Location</Label>
                            <Input
                              value={newEducationForm.location}
                              onChange={(e) => setNewEducationForm(prev => ({ ...prev, location: e.target.value }))}
                              placeholder="e.g., Stanford, CA"
                              className="h-10"
                            />
                          </div>
                          <div>
                            <Label className="text-sm text-[#6B7280]">Start Date</Label>
                            <Input
                              type="date"
                              value={newEducationForm.start_date}
                              onChange={(e) => setNewEducationForm(prev => ({ ...prev, start_date: e.target.value }))}
                              className="h-10"
                            />
                          </div>
                          <div>
                            <Label className="text-sm text-[#6B7280]">End Date</Label>
                            <Input
                              type="date"
                              value={newEducationForm.end_date}
                              onChange={(e) => setNewEducationForm(prev => ({ ...prev, end_date: e.target.value }))}
                              className="h-10"
                              disabled={newEducationForm.is_current}
                            />
                          </div>
                          <div>
                            <Label className="text-sm text-[#6B7280]">GPA</Label>
                            <Input
                              value={newEducationForm.gpa}
                              onChange={(e) => setNewEducationForm(prev => ({ ...prev, gpa: e.target.value }))}
                              placeholder="e.g., 3.8"
                              className="h-10"
                            />
                          </div>
                          <div>
                            <Label className="text-sm text-[#6B7280]">Honors</Label>
                            <Input
                              value={newEducationForm.honors}
                              onChange={(e) => setNewEducationForm(prev => ({ ...prev, honors: e.target.value }))}
                              placeholder="e.g., Magna Cum Laude"
                              className="h-10"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="is_current_edu"
                              checked={newEducationForm.is_current}
                              onChange={(e) => setNewEducationForm(prev => ({ ...prev, is_current: e.target.checked }))}
                              className="h-4 w-4 text-[#3056F5] border-[#D1D5DB] rounded focus:ring-[#3056F5]"
                            />
                            <Label htmlFor="is_current_edu" className="text-sm text-[#6B7280]">Currently studying</Label>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={handleCreateNewEducation}
                            className="px-4 py-2 bg-[#3056F5] text-white rounded-lg text-sm"
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Create & Add
                          </Button>
                          <Button
                            onClick={() => setShowNewEducationForm(false)}
                            variant="outline"
                            className="px-4 py-2 border-[#D1D5DB] text-[#6B7280] rounded-lg text-sm"
                          >
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

              </div>
            </AnimatedContainer>

            {/* Skills Editor */}
            <AnimatedContainer direction="up" delay={0.6}>
              <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-[#3056F5]" />
                    <h3 className="text-lg font-semibold text-[#0F172A]">Skills</h3>
                    </div>
                    <Button
                      onClick={() => setShowNewSkillForm(!showNewSkillForm)}
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
                                  value={editingSkill[resumeSkill.id]?.skill_name ?? (resumeSkill.skill_name || resumeSkill.profile_skill?.skill_name || '')}
                                  onChange={(e) => {
                                    setEditingSkill(prev => ({
                                      ...prev,
                                      [resumeSkill.id]: {
                                        ...prev[resumeSkill.id],
                                        skill_name: e.target.value
                                      }
                                    }));
                                  }}
                                  className="h-8 text-sm"
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-[#6B7280]">Proficiency Level</Label>
                                <select
                                  value={editingSkill[resumeSkill.id]?.proficiency_level ?? (resumeSkill.proficiency_level || resumeSkill.profile_skill?.proficiency_level || '')}
                                  onChange={(e) => {
                                    setEditingSkill(prev => ({
                                      ...prev,
                                      [resumeSkill.id]: {
                                        ...prev[resumeSkill.id],
                                        proficiency_level: e.target.value
                                      }
                                    }));
                                  }}
                                  className="h-8 text-sm w-full px-3 py-1 border border-[#D1D5DB] rounded-lg"
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
                                  value={editingSkill[resumeSkill.id]?.years_of_experience ?? (resumeSkill.years_of_experience || resumeSkill.profile_skill?.years_of_experience || '')}
                                  onChange={(e) => {
                                    setEditingSkill(prev => ({
                                      ...prev,
                                      [resumeSkill.id]: {
                                        ...prev[resumeSkill.id],
                                        years_of_experience: parseInt(e.target.value) || 0
                                      }
                                    }));
                                  }}
                                  className="h-8 text-sm"
                                />
                              </div>
                            </div>
                            <div className="flex gap-2 ml-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUpdateSkill(resumeSkill.id, editingSkill[resumeSkill.id])}
                                className="p-2 border-green-200 text-green-600 hover:bg-green-50"
                                title="Save Changes"
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRemoveSkill(resumeSkill.id)}
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

                  {/* New Skill Form */}
                  {showNewSkillForm && (
                    <div className="mt-6 p-4 border-2 border-dashed border-[#3056F5] rounded-xl bg-blue-50">
                      <h4 className="text-md font-medium text-[#0F172A] mb-4">Add New Skill</h4>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label className="text-sm text-[#6B7280]">Skill Name *</Label>
                            <Input
                              value={newSkillForm.skill_name}
                              onChange={(e) => setNewSkillForm(prev => ({ ...prev, skill_name: e.target.value }))}
                              placeholder="e.g., JavaScript"
                              className="h-10"
                            />
                          </div>
                          <div>
                            <Label className="text-sm text-[#6B7280]">Proficiency Level</Label>
                            <select
                              value={newSkillForm.proficiency_level}
                              onChange={(e) => setNewSkillForm(prev => ({ ...prev, proficiency_level: e.target.value }))}
                              className="h-10 w-full px-3 py-2 border border-[#D1D5DB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3056F5]"
                            >
                              <option value="Beginner">Beginner</option>
                              <option value="Intermediate">Intermediate</option>
                              <option value="Advanced">Advanced</option>
                              <option value="Expert">Expert</option>
                            </select>
                          </div>
                          <div>
                            <Label className="text-sm text-[#6B7280]">Years of Experience</Label>
                            <Input
                              type="number"
                              value={newSkillForm.years_of_experience}
                              onChange={(e) => setNewSkillForm(prev => ({ ...prev, years_of_experience: e.target.value }))}
                              placeholder="e.g., 3"
                              className="h-10"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={handleCreateNewSkill}
                            className="px-4 py-2 bg-[#3056F5] text-white rounded-lg text-sm"
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Create & Add
                          </Button>
                          <Button
                            onClick={() => setShowNewSkillForm(false)}
                            variant="outline"
                            className="px-4 py-2 border-[#D1D5DB] text-[#6B7280] rounded-lg text-sm"
                          >
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

              </div>
            </AnimatedContainer>

            {/* Certifications Editor */}
            <AnimatedContainer direction="up" delay={0.7}>
              <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-[#3056F5]" />
                    <h3 className="text-lg font-semibold text-[#0F172A]">Certifications</h3>
                    </div>
                    <Button
                      onClick={() => setShowNewCertificationForm(!showNewCertificationForm)}
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
                    <div className="space-y-3">
                      {resume?.certifications?.map((resumeCert, index) => (
                        <div key={resumeCert.id} className="border border-[#E5E7EB] rounded-xl p-4 hover:border-[#3056F5]/30 transition-colors">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                <div>
                                  <Label className="text-xs text-[#6B7280]">Certification Name</Label>
                                  <Input
                                    value={editingCertification[resumeCert.id]?.name ?? (resumeCert.name || resumeCert.certification?.name || '')}
                                    onChange={(e) => {
                                      setEditingCertification(prev => ({
                                        ...prev,
                                        [resumeCert.id]: {
                                          ...prev[resumeCert.id],
                                          name: e.target.value
                                        }
                                      }));
                                    }}
                                    className="h-8 text-sm"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs text-[#6B7280]">Issuing Body</Label>
                                  <Input
                                    value={editingCertification[resumeCert.id]?.issuing_body ?? (resumeCert.issuing_body || resumeCert.certification?.issuing_body || '')}
                                    onChange={(e) => {
                                      setEditingCertification(prev => ({
                                        ...prev,
                                        [resumeCert.id]: {
                                          ...prev[resumeCert.id],
                                          issuing_body: e.target.value
                                        }
                                      }));
                                    }}
                                    className="h-8 text-sm"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs text-[#6B7280]">Credential ID</Label>
                                  <Input
                                    value={editingCertification[resumeCert.id]?.credential_id ?? (resumeCert.credential_id || resumeCert.certification?.credential_id || '')}
                                    onChange={(e) => {
                                      setEditingCertification(prev => ({
                                        ...prev,
                                        [resumeCert.id]: {
                                          ...prev[resumeCert.id],
                                          credential_id: e.target.value
                                        }
                                      }));
                                    }}
                                    className="h-8 text-sm"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs text-[#6B7280]">Credential URL</Label>
                                  <Input
                                    value={editingCertification[resumeCert.id]?.credential_url ?? (resumeCert.credential_url || resumeCert.certification?.credential_url || '')}
                                    onChange={(e) => {
                                      setEditingCertification(prev => ({
                                        ...prev,
                                        [resumeCert.id]: {
                                          ...prev[resumeCert.id],
                                          credential_url: e.target.value
                                        }
                                      }));
                                    }}
                                    className="h-8 text-sm"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs text-[#6B7280]">Issue Date</Label>
                                  <Input
                                    type="date"
                                    value={editingCertification[resumeCert.id]?.issue_date ?? (resumeCert.issue_date || resumeCert.certification?.issue_date || '')}
                                    onChange={(e) => {
                                      setEditingCertification(prev => ({
                                        ...prev,
                                        [resumeCert.id]: {
                                          ...prev[resumeCert.id],
                                          issue_date: e.target.value
                                        }
                                      }));
                                    }}
                                    className="h-8 text-sm min-w-[140px] px-3"
                                    placeholder="Issue date"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs text-[#6B7280]">Expiration Date</Label>
                                  <Input
                                    type="date"
                                    value={editingCertification[resumeCert.id]?.expiration_date ?? (resumeCert.expiration_date || resumeCert.certification?.expiration_date || '')}
                                    onChange={(e) => {
                                      setEditingCertification(prev => ({
                                        ...prev,
                                        [resumeCert.id]: {
                                          ...prev[resumeCert.id],
                                          expiration_date: e.target.value
                                        }
                                      }));
                                    }}
                                    className="h-8 text-sm min-w-[140px] px-3"
                                    placeholder="Expiration date"
                                  />
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2 ml-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUpdateCertification(resumeCert.id, editingCertification[resumeCert.id])}
                                className="p-2 border-green-200 text-green-600 hover:bg-green-50"
                                title="Save Changes"
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRemoveCertification(resumeCert.id)}
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

                  {/* New Certification Form */}
                  {showNewCertificationForm && (
                    <div className="mt-6 p-4 border-2 border-dashed border-[#3056F5] rounded-xl bg-blue-50">
                      <h4 className="text-md font-medium text-[#0F172A] mb-4">Add New Certification</h4>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm text-[#6B7280]">Certification Name *</Label>
                            <Input
                              value={newCertificationForm.name}
                              onChange={(e) => setNewCertificationForm(prev => ({ ...prev, name: e.target.value }))}
                              placeholder="e.g., AWS Certified Solutions Architect"
                              className="h-10"
                            />
                          </div>
                          <div>
                            <Label className="text-sm text-[#6B7280]">Issuing Body *</Label>
                            <Input
                              value={newCertificationForm.issuing_body}
                              onChange={(e) => setNewCertificationForm(prev => ({ ...prev, issuing_body: e.target.value }))}
                              placeholder="e.g., Amazon Web Services"
                              className="h-10"
                            />
                          </div>
                          <div>
                            <Label className="text-sm text-[#6B7280]">Credential ID</Label>
                            <Input
                              value={newCertificationForm.credential_id}
                              onChange={(e) => setNewCertificationForm(prev => ({ ...prev, credential_id: e.target.value }))}
                              placeholder="e.g., AWS-123456"
                              className="h-10"
                            />
                          </div>
                          <div>
                            <Label className="text-sm text-[#6B7280]">Credential URL</Label>
                            <Input
                              value={newCertificationForm.credential_url}
                              onChange={(e) => setNewCertificationForm(prev => ({ ...prev, credential_url: e.target.value }))}
                              placeholder="https://..."
                              className="h-10"
                            />
                          </div>
                          <div>
                            <Label className="text-sm text-[#6B7280]">Issue Date</Label>
                            <Input
                              type="date"
                              value={newCertificationForm.issue_date}
                              onChange={(e) => setNewCertificationForm(prev => ({ ...prev, issue_date: e.target.value }))}
                              className="h-10"
                            />
                          </div>
                          <div>
                            <Label className="text-sm text-[#6B7280]">Expiration Date</Label>
                            <Input
                              type="date"
                              value={newCertificationForm.expiration_date}
                              onChange={(e) => setNewCertificationForm(prev => ({ ...prev, expiration_date: e.target.value }))}
                              className="h-10"
                              disabled={newCertificationForm.does_not_expire}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="does_not_expire"
                              checked={newCertificationForm.does_not_expire}
                              onChange={(e) => setNewCertificationForm(prev => ({ ...prev, does_not_expire: e.target.checked }))}
                              className="h-4 w-4 text-[#3056F5] border-[#D1D5DB] rounded focus:ring-[#3056F5]"
                            />
                            <Label htmlFor="does_not_expire" className="text-sm text-[#6B7280]">Does not expire</Label>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={handleCreateNewCertification}
                            className="px-4 py-2 bg-[#3056F5] text-white rounded-lg text-sm"
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Create & Add
                          </Button>
                          <Button
                            onClick={() => setShowNewCertificationForm(false)}
                            variant="outline"
                            className="px-4 py-2 border-[#D1D5DB] text-[#6B7280] rounded-lg text-sm"
                          >
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

              </div>
            </AnimatedContainer>
          </div>
        </div>
      </PageTransition>
    </AppShell>
  );
}
