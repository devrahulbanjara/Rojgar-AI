import React, { useState } from 'react';
import { profileService } from '../../services/profileService';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Briefcase, GraduationCap, Plus, Trash2, Calendar, MapPin, Building, Pencil } from 'lucide-react';
import type { WorkExperience, Education, WorkExperienceCreate, EducationCreate } from '../../types/profile';
import { toast } from 'sonner';

interface CareerHistoryTabProps {
  experiences: WorkExperience[];
  educations: Education[];
}

export function CareerHistoryTab({ experiences: initialExperiences, educations: initialEducations }: CareerHistoryTabProps) {
  const [workExperiences, setWorkExperiences] = useState<WorkExperience[]>(initialExperiences);
  const [educationRecords, setEducationRecords] = useState<Education[]>(initialEducations);

  const [isAddingExperience, setIsAddingExperience] = useState(false);
  const [isAddingEducation, setIsAddingEducation] = useState(false);

  const [editingExpId, setEditingExpId] = useState<string | null>(null);
  const [editingEduId, setEditingEduId] = useState<string | null>(null);

  const [experienceForm, setExperienceForm] = useState({
    job_title: '',
    company: '',
    location: '',
    start_date: '',
    end_date: '',
    is_current: false,
    description: '',
  });

  const [educationForm, setEducationForm] = useState({
    school_university: '',
    degree: '',
    location: '',
    start_date: '',
    end_date: '',
    is_current: false,
  });

  // --- Experience Handlers ---

  const handleAddExperience = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const experienceData: WorkExperienceCreate = {
        job_title: experienceForm.job_title,
        company: experienceForm.company,
        location: experienceForm.location || undefined,
        start_date: experienceForm.start_date,
        end_date: experienceForm.end_date || undefined,
        is_current: experienceForm.is_current,
        description: experienceForm.description || undefined,
      };

      if (editingExpId) {
        const updatedExp = await profileService.updateExperience(editingExpId, experienceData);
        setWorkExperiences(prev => prev.map(exp => exp.candidate_work_experience_id === editingExpId ? (updatedExp as unknown as WorkExperience) : exp));
        toast.success('Work experience updated successfully!');
      } else {
        const newExperience = await profileService.addExperience(experienceData);
        setWorkExperiences(prev => [...prev, newExperience as unknown as WorkExperience]);
        toast.success('Work experience added successfully!');
      }

      setExperienceForm({
        job_title: '',
        company: '',
        location: '',
        start_date: '',
        end_date: '',
        is_current: false,
        description: '',
      });
      setIsAddingExperience(false);
      setEditingExpId(null);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to save work experience.');
    }
  };

  const handleEditExperience = (exp: WorkExperience) => {
    setExperienceForm({
      job_title: exp.job_title,
      company: exp.company,
      location: exp.location || '',
      start_date: exp.start_date ? new Date(exp.start_date).toISOString().split('T')[0] : '',
      end_date: exp.end_date ? new Date(exp.end_date).toISOString().split('T')[0] : '',
      is_current: exp.is_current,
      description: exp.description || '',
    });
    setEditingExpId(exp.candidate_work_experience_id);
    setIsAddingExperience(true);
  };

  const handleDeleteExperience = async (id: string) => {
    if (!confirm('Are you sure you want to delete this work experience?')) return;
    try {
      await profileService.deleteExperience(id);
      setWorkExperiences(prev => prev.filter(exp => exp.candidate_work_experience_id !== id));
      toast.success('Work experience deleted successfully!');
      if (editingExpId === id) {
        setIsAddingExperience(false);
        setEditingExpId(null);
      }
    } catch (error: any) {
      toast.error('Failed to delete work experience.');
    }
  };

  const handleCancelExperience = () => {
    setIsAddingExperience(false);
    setEditingExpId(null);
    setExperienceForm({
      job_title: '',
      company: '',
      location: '',
      start_date: '',
      end_date: '',
      is_current: false,
      description: '',
    });
  };

  // --- Education Handlers ---

  const handleAddEducation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const educationData: EducationCreate = {
        college_name: educationForm.school_university,
        degree: educationForm.degree,
        location: educationForm.location || undefined,
        start_date: educationForm.start_date || undefined,
        end_date: educationForm.end_date || undefined,
        is_current: educationForm.is_current,
      };

      if (editingEduId) {
        const updatedEdu = await profileService.updateEducation(editingEduId, educationData);
        setEducationRecords(prev => prev.map(edu => edu.candidate_education_id === editingEduId ? (updatedEdu as unknown as Education) : edu));
        toast.success('Education record updated successfully!');
      } else {
        const newEducation = await profileService.addEducation(educationData);
        setEducationRecords(prev => [...prev, newEducation as unknown as Education]);
        toast.success('Education record added successfully!');
      }

      setEducationForm({
        school_university: '',
        degree: '',
        location: '',
        start_date: '',
        end_date: '',
        is_current: false,
        description: '',
      });
      setIsAddingEducation(false);
      setEditingEduId(null);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to save education record.');
    }
  };

  const handleEditEducation = (edu: Education) => {
    setEducationForm({
      school_university: edu.college_name,
      degree: edu.degree,
      location: edu.location || '',
      start_date: edu.start_date ? new Date(edu.start_date).toISOString().split('T')[0] : '',
      end_date: edu.end_date ? new Date(edu.end_date).toISOString().split('T')[0] : '',
      is_current: edu.is_current,
    });
    setEditingEduId(edu.candidate_education_id);
    setIsAddingEducation(true);
  };

  const handleDeleteEducation = async (id: string) => {
    if (!confirm('Are you sure you want to delete this education record?')) return;
    try {
      await profileService.deleteEducation(id);
      setEducationRecords(prev => prev.filter(edu => edu.candidate_education_id !== id));
      toast.success('Education record deleted successfully!');
      if (editingEduId === id) {
        setIsAddingEducation(false);
        setEditingEduId(null);
      }
    } catch (error: any) {
      toast.error('Failed to delete education record.');
    }
  };

  const handleCancelEducation = () => {
    setIsAddingEducation(false);
    setEditingEduId(null);
    setEducationForm({
      school_university: '',
      degree: '',
      location: '',
      start_date: '',
      end_date: '',
      is_current: false,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short'
    });
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-[#0F172A] mb-2">
          Career History
        </h3>
        <p className="text-[#475569]">
          Manage your work experience and education records.
        </p>
      </div>

      <div className="space-y-8">
        {/* Work Experience Section */}
        <div className="bg-[#F9FAFB] rounded-xl p-6 border border-[#E5E7EB]">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-[#3056F5]" />
              <h4 className="text-lg font-semibold text-[#0F172A]">Work Experience</h4>
            </div>
            {!isAddingExperience && (
              <Button
                onClick={() => {
                  setEditingExpId(null);
                  setExperienceForm({
                    job_title: '',
                    company: '',
                    location: '',
                    start_date: '',
                    end_date: '',
                    is_current: false,
                    description: '',
                  });
                  setIsAddingExperience(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-[#3056F5] hover:bg-[#1E40AF] text-white rounded-xl"
              >
                <Plus className="w-4 h-4" />
                Add Experience
              </Button>
            )}
          </div>

          {/* Add/Edit Experience Form */}
          {isAddingExperience && (
            <form onSubmit={handleAddExperience} className="mb-6 p-4 bg-white rounded-xl border border-[#E5E7EB]">
              <h5 className="text-lg font-semibold text-[#0F172A] mb-4">
                {editingExpId ? 'Edit Work Experience' : 'Add New Work Experience'}
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="job_title">Job Title *</Label>
                  <Input
                    id="job_title"
                    value={experienceForm.job_title}
                    onChange={(e) => setExperienceForm(prev => ({ ...prev, job_title: e.target.value }))}
                    placeholder="e.g., Senior Software Engineer"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company *</Label>
                  <Input
                    id="company"
                    value={experienceForm.company}
                    onChange={(e) => setExperienceForm(prev => ({ ...prev, company: e.target.value }))}
                    placeholder="e.g., Google"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={experienceForm.location}
                    onChange={(e) => setExperienceForm(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="e.g., Kathmandu"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date *</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={experienceForm.start_date}
                    onChange={(e) => setExperienceForm(prev => ({ ...prev, start_date: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={experienceForm.end_date}
                    onChange={(e) => setExperienceForm(prev => ({ ...prev, end_date: e.target.value }))}
                    disabled={experienceForm.is_current}
                  />
                </div>
                <div className="space-y-2 flex items-center">
                  <input
                    type="checkbox"
                    id="is_current"
                    checked={experienceForm.is_current}
                    onChange={(e) => {
                      const isChecked = e.target.checked;
                      setExperienceForm(prev => ({
                        ...prev,
                        is_current: isChecked,
                        end_date: isChecked ? '' : prev.end_date
                      }));
                    }}
                    className="mr-2"
                  />
                  <Label htmlFor="is_current">Currently working here</Label>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <Label htmlFor="description">Job Description</Label>
                <Textarea
                  id="description"
                  value={experienceForm.description}
                  onChange={(e) => setExperienceForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your responsibilities, achievements, and key projects..."
                  rows={4}
                />
              </div>
              <div className="flex gap-3 mt-4">
                <Button type="submit" className="px-6 py-2 bg-[#3056F5] text-white rounded-xl">
                  {editingExpId ? 'Save Changes' : 'Add Experience'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelExperience}
                  className="px-6 py-2 border-[#D1D5DB] rounded-xl"
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {/* Work Experience List */}
          {workExperiences.length === 0 ? (
            <div className="text-center py-8 text-[#6B7280]">
              <Briefcase className="w-12 h-12 mx-auto mb-4 text-[#9CA3AF]" />
              <p className="text-lg font-medium mb-2">No work experience added yet</p>
              <p className="text-sm">Add your first work experience to get started!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {workExperiences.map((experience) => (
                <div key={experience.candidate_work_experience_id} className="bg-white rounded-xl border border-[#E5E7EB] p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Building className="w-4 h-4 text-[#6B7280]" />
                        <h5 className="font-semibold text-[#0F172A]">{experience.job_title}</h5>
                      </div>
                      <p className="text-[#475569] font-medium">{experience.company}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-[#6B7280]">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(experience.start_date)} - {experience.is_current ? 'Present' : formatDate(experience.end_date || '')}
                        </div>
                        {experience.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {experience.location}
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-[#475569] mt-2 line-clamp-2">
                        {experience.description}
                      </p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditExperience(experience)}
                        className="p-2 text-[#6B7280] hover:text-[#3056F5] hover:bg-blue-50"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteExperience(experience.candidate_work_experience_id)}
                        className="p-2 text-[#6B7280] hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Education Section */}
        <div className="bg-[#F9FAFB] rounded-xl p-6 border border-[#E5E7EB]">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-[#3056F5]" />
              <h4 className="text-lg font-semibold text-[#0F172A]">Education</h4>
            </div>
            {!isAddingEducation && (
              <Button
                onClick={() => {
                  setEditingEduId(null);
                  setEducationForm({
                    school_university: '',
                    degree: '',
                    location: '',
                    start_date: '',
                    end_date: '',
                    is_current: false,
                  });
                  setIsAddingEducation(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-[#3056F5] hover:bg-[#1E40AF] text-white rounded-xl"
              >
                <Plus className="w-4 h-4" />
                Add Education
              </Button>
            )}
          </div>

          {/* Add/Edit Education Form */}
          {isAddingEducation && (
            <form onSubmit={handleAddEducation} className="mb-6 p-4 bg-white rounded-xl border border-[#E5E7EB]">
              <h5 className="text-lg font-semibold text-[#0F172A] mb-4">
                {editingEduId ? 'Edit Education Record' : 'Add New Education Record'}
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="school_university">College/University *</Label>
                  <Input
                    id="school_university"
                    value={educationForm.school_university}
                    onChange={(e) => setEducationForm(prev => ({ ...prev, school_university: e.target.value }))}
                    placeholder="e.g., Stanford University"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="degree">Degree *</Label>
                  <Input
                    id="degree"
                    value={educationForm.degree}
                    onChange={(e) => setEducationForm(prev => ({ ...prev, degree: e.target.value }))}
                    placeholder="e.g., Bachelor of Science"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={educationForm.location}
                    onChange={(e) => setEducationForm(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="e.g., Stanford, CA"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={educationForm.start_date}
                    onChange={(e) => setEducationForm(prev => ({ ...prev, start_date: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={educationForm.end_date}
                    onChange={(e) => setEducationForm(prev => ({ ...prev, end_date: e.target.value }))}
                    disabled={educationForm.is_current}
                  />
                </div>
                <div className="space-y-2 flex items-center">
                  <input
                    type="checkbox"
                    id="is_current_edu"
                    checked={educationForm.is_current}
                    onChange={(e) => {
                      const isChecked = e.target.checked;
                      setEducationForm(prev => ({
                        ...prev,
                        is_current: isChecked,
                        end_date: isChecked ? '' : prev.end_date
                      }));
                    }}
                    className="mr-2"
                  />
                  <Label htmlFor="is_current_edu">Currently studying</Label>
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <Button type="submit" className="px-6 py-2 bg-[#3056F5] text-white rounded-xl">
                  {editingEduId ? 'Save Changes' : 'Add Education'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelEducation}
                  className="px-6 py-2 border-[#D1D5DB] rounded-xl"
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {/* Education List */}
          {educationRecords.length === 0 ? (
            <div className="text-center py-8 text-[#6B7280]">
              <GraduationCap className="w-12 h-12 mx-auto mb-4 text-[#9CA3AF]" />
              <p className="text-lg font-medium mb-2">No education records added yet</p>
              <p className="text-sm">Add your first education record to get started!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {educationRecords.map((education) => (
                <div key={education.candidate_education_id} className="bg-white rounded-xl border border-[#E5E7EB] p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <GraduationCap className="w-4 h-4 text-[#6B7280]" />
                        <h5 className="font-semibold text-[#0F172A]">{education.degree}</h5>
                      </div>
                      <p className="text-[#475569] font-medium">{education.college_name}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-[#6B7280]">
                        {education.start_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(education.start_date)} - {education.is_current ? 'Present' : formatDate(education.end_date || '')}
                          </div>
                        )}
                        {education.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {education.location}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditEducation(education)}
                        className="p-2 text-[#6B7280] hover:text-[#3056F5] hover:bg-blue-50"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteEducation(education.candidate_education_id)}
                        className="p-2 text-[#6B7280] hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
