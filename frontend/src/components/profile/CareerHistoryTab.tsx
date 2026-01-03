import React, { useState } from 'react';
import { profileService } from '../../services/profileService';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Briefcase, GraduationCap, Plus, Trash2, Calendar, MapPin, Building, Pencil, CheckCircle2 } from 'lucide-react';
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
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string } } };
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
    } catch {
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
      });
      setIsAddingEducation(false);
      setEditingEduId(null);
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string } } };
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
    } catch {
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
        <div className="bg-white rounded-2xl p-8 border border-[#E5E7EB] shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm border border-blue-100">
                <Briefcase className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-[#0F172A]">Work Experience</h4>
                <p className="text-sm text-[#64748B]">Your professional journey</p>
              </div>
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
                className="flex items-center gap-2 px-5 py-2.5 bg-[#3056F5] hover:bg-[#1E40AF] text-white rounded-xl shadow-md shadow-blue-500/20 transition-all duration-200"
              >
                <Plus className="w-4 h-4" />
                Add Experience
              </Button>
            )}
          </div>

          {/* Add/Edit Experience Form */}
          {isAddingExperience && (
            <form onSubmit={handleAddExperience} className="mb-8 p-6 bg-gray-50 rounded-2xl border border-gray-200 animate-in fade-in slide-in-from-top-4 duration-300">
              <h5 className="text-lg font-bold text-[#0F172A] mb-6 flex items-center gap-2">
                {editingExpId ? <Pencil className="w-5 h-5 text-blue-600" /> : <Plus className="w-5 h-5 text-blue-600" />}
                {editingExpId ? 'Edit Work Experience' : 'Add New Work Experience'}
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="job_title" className="font-semibold text-gray-700">Job Title *</Label>
                  <Input
                    id="job_title"
                    value={experienceForm.job_title}
                    onChange={(e) => setExperienceForm(prev => ({ ...prev, job_title: e.target.value }))}
                    placeholder="e.g., Senior Software Engineer"
                    className="h-11 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company" className="font-semibold text-gray-700">Company *</Label>
                  <Input
                    id="company"
                    value={experienceForm.company}
                    onChange={(e) => setExperienceForm(prev => ({ ...prev, company: e.target.value }))}
                    placeholder="e.g., Google"
                    className="h-11 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location" className="font-semibold text-gray-700">Location</Label>
                  <Input
                    id="location"
                    value={experienceForm.location}
                    onChange={(e) => setExperienceForm(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="e.g., Kathmandu"
                    className="h-11 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="start_date" className="font-semibold text-gray-700">Start Date *</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={experienceForm.start_date}
                    onChange={(e) => setExperienceForm(prev => ({ ...prev, start_date: e.target.value }))}
                    className="h-11 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date" className="font-semibold text-gray-700">End Date</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={experienceForm.end_date}
                    onChange={(e) => setExperienceForm(prev => ({ ...prev, end_date: e.target.value }))}
                    className="h-11 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
                    disabled={experienceForm.is_current}
                  />
                </div>
                <div className="space-y-2 flex items-center pt-8">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center">
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
                        className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-gray-300 transition-all checked:border-blue-500 checked:bg-blue-500 hover:border-blue-400"
                      />
                      <CheckCircle2 className="pointer-events-none absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                    </div>
                    <span className="font-medium text-gray-700 group-hover:text-blue-600 transition-colors">Currently working here</span>
                  </label>
                </div>
              </div>
              <div className="mt-6 space-y-2">
                <Label htmlFor="description" className="font-semibold text-gray-700">Job Description</Label>
                <Textarea
                  id="description"
                  value={experienceForm.description}
                  onChange={(e) => setExperienceForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your responsibilities, achievements, and key projects..."
                  rows={4}
                  className="rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500/20 resize-none"
                />
              </div>
              <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
                <Button type="submit" className="px-6 py-2.5 bg-[#3056F5] hover:bg-[#1E40AF] text-white rounded-xl font-medium shadow-sm transition-all">
                  {editingExpId ? 'Save Changes' : 'Add Experience'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelExperience}
                  className="px-6 py-2.5 border-gray-300 text-gray-700 hover:bg-gray-100 rounded-xl font-medium transition-all"
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {/* Work Experience List */}
          {workExperiences.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-gray-100">
                <Briefcase className="w-8 h-8 text-gray-400" />
              </div>
              <h5 className="text-lg font-semibold text-gray-900 mb-2">No work experience added yet</h5>
              <p className="text-gray-500 max-w-sm mx-auto">Add your past work experience to showcase your professional background to recruiters.</p>
              {!isAddingExperience && (
                <Button
                  onClick={() => setIsAddingExperience(true)}
                  variant="outline"
                  className="mt-6 border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 rounded-xl"
                >
                  Add Experience
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {workExperiences.map((experience) => (
                <div key={experience.candidate_work_experience_id} className="group bg-white rounded-xl border border-[#E5E7EB] p-5 hover:border-blue-200 hover:shadow-md transition-all duration-300">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors">
                          <Building className="w-5 h-5" />
                        </div>
                        <div>
                          <h5 className="font-bold text-[#0F172A] text-lg">{experience.job_title}</h5>
                          <p className="text-[#475569] font-medium">{experience.company}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-[#64748B]">
                        <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">
                          <Calendar className="w-4 h-4 text-blue-500" />
                          <span className="font-medium">{formatDate(experience.start_date)} - {experience.is_current ? 'Present' : formatDate(experience.end_date || '')}</span>
                        </div>
                        {experience.location && (
                          <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">
                            <MapPin className="w-4 h-4 text-blue-500" />
                            <span className="font-medium">{experience.location}</span>
                          </div>
                        )}
                      </div>

                      {experience.description && (
                        <div className="mt-4 pl-4 border-l-2 border-gray-100">
                          <p className="text-sm text-[#475569] leading-relaxed line-clamp-3 group-hover:line-clamp-none transition-all">
                            {experience.description}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditExperience(experience)}
                        className="h-9 w-9 p-0 text-[#64748B] hover:text-[#3056F5] hover:bg-blue-50 rounded-lg"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteExperience(experience.candidate_work_experience_id)}
                        className="h-9 w-9 p-0 text-[#64748B] hover:text-red-600 hover:bg-red-50 rounded-lg"
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
        <div className="bg-white rounded-2xl p-8 border border-[#E5E7EB] shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-[#0F172A]">Education</h4>
                <p className="text-sm text-[#64748B]">Your academic background</p>
              </div>
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
                className="flex items-center gap-2 px-5 py-2.5 bg-[#3056F5] hover:bg-[#1E40AF] text-white rounded-xl shadow-md shadow-blue-500/20 transition-all duration-200"
              >
                <Plus className="w-4 h-4" />
                Add Education
              </Button>
            )}
          </div>

          {/* Add/Edit Education Form */}
          {isAddingEducation && (
            <form onSubmit={handleAddEducation} className="mb-8 p-6 bg-gray-50 rounded-2xl border border-gray-200 animate-in fade-in slide-in-from-top-4 duration-300">
              <h5 className="text-lg font-bold text-[#0F172A] mb-6 flex items-center gap-2">
                {editingEduId ? <Pencil className="w-5 h-5 text-indigo-600" /> : <Plus className="w-5 h-5 text-indigo-600" />}
                {editingEduId ? 'Edit Education Record' : 'Add New Education Record'}
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="school_university" className="font-semibold text-gray-700">College/University *</Label>
                  <Input
                    id="school_university"
                    value={educationForm.school_university}
                    onChange={(e) => setEducationForm(prev => ({ ...prev, school_university: e.target.value }))}
                    placeholder="e.g., Stanford University"
                    className="h-11 rounded-xl border-gray-300 focus:border-indigo-500 focus:ring-indigo-500/20"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="degree" className="font-semibold text-gray-700">Degree *</Label>
                  <Input
                    id="degree"
                    value={educationForm.degree}
                    onChange={(e) => setEducationForm(prev => ({ ...prev, degree: e.target.value }))}
                    placeholder="e.g., Bachelor of Science"
                    className="h-11 rounded-xl border-gray-300 focus:border-indigo-500 focus:ring-indigo-500/20"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location" className="font-semibold text-gray-700">Location</Label>
                  <Input
                    id="location"
                    value={educationForm.location}
                    onChange={(e) => setEducationForm(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="e.g., Stanford, CA"
                    className="h-11 rounded-xl border-gray-300 focus:border-indigo-500 focus:ring-indigo-500/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="start_date" className="font-semibold text-gray-700">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={educationForm.start_date}
                    onChange={(e) => setEducationForm(prev => ({ ...prev, start_date: e.target.value }))}
                    className="h-11 rounded-xl border-gray-300 focus:border-indigo-500 focus:ring-indigo-500/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date" className="font-semibold text-gray-700">End Date</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={educationForm.end_date}
                    onChange={(e) => setEducationForm(prev => ({ ...prev, end_date: e.target.value }))}
                    className="h-11 rounded-xl border-gray-300 focus:border-indigo-500 focus:ring-indigo-500/20"
                    disabled={educationForm.is_current}
                  />
                </div>
                <div className="space-y-2 flex items-center pt-8">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center">
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
                        className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-gray-300 transition-all checked:border-indigo-500 checked:bg-indigo-500 hover:border-indigo-400"
                      />
                      <CheckCircle2 className="pointer-events-none absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                    </div>
                    <span className="font-medium text-gray-700 group-hover:text-indigo-600 transition-colors">Currently studying</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
                <Button type="submit" className="px-6 py-2.5 bg-[#3056F5] hover:bg-[#1E40AF] text-white rounded-xl font-medium shadow-sm transition-all">
                  {editingEduId ? 'Save Changes' : 'Add Education'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelEducation}
                  className="px-6 py-2.5 border-gray-300 text-gray-700 hover:bg-gray-100 rounded-xl font-medium transition-all"
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {/* Education List */}
          {educationRecords.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-gray-100">
                <GraduationCap className="w-8 h-8 text-gray-400" />
              </div>
              <h5 className="text-lg font-semibold text-gray-900 mb-2">No education records added yet</h5>
              <p className="text-gray-500 max-w-sm mx-auto">Add your educational background to complete your profile.</p>
              {!isAddingEducation && (
                <Button
                  onClick={() => setIsAddingEducation(true)}
                  variant="outline"
                  className="mt-6 border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300 rounded-xl"
                >
                  Add Education
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {educationRecords.map((education) => (
                <div key={education.candidate_education_id} className="group bg-white rounded-xl border border-[#E5E7EB] p-5 hover:border-indigo-200 hover:shadow-md transition-all duration-300">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-100 transition-colors">
                          <GraduationCap className="w-5 h-5" />
                        </div>
                        <div>
                          <h5 className="font-bold text-[#0F172A] text-lg">{education.degree}</h5>
                          <p className="text-[#475569] font-medium">{education.college_name}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-[#64748B]">
                        {education.start_date && (
                          <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">
                            <Calendar className="w-4 h-4 text-indigo-500" />
                            <span className="font-medium">{formatDate(education.start_date)} - {education.is_current ? 'Present' : formatDate(education.end_date || '')}</span>
                          </div>
                        )}
                        {education.location && (
                          <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">
                            <MapPin className="w-4 h-4 text-indigo-500" />
                            <span className="font-medium">{education.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditEducation(education)}
                        className="h-9 w-9 p-0 text-[#64748B] hover:text-[#3056F5] hover:bg-blue-50 rounded-lg"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteEducation(education.candidate_education_id)}
                        className="h-9 w-9 p-0 text-[#64748B] hover:text-red-600 hover:bg-red-50 rounded-lg"
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
