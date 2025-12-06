import React, { useState, useEffect } from 'react';
import { profileService } from '../../services/profileService';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { Briefcase, GraduationCap, Plus, Edit, Trash2, CheckCircle, AlertCircle, Calendar, MapPin, Building } from 'lucide-react';
import type { WorkExperience, EducationRecord, WorkExperienceCreateRequest, EducationCreateRequest } from '../../types/profile';

export function CareerHistoryTab() {
  const [workExperiences, setWorkExperiences] = useState<WorkExperience[]>([]);
  const [educationRecords, setEducationRecords] = useState<EducationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingExperience, setIsAddingExperience] = useState(false);
  const [isAddingEducation, setIsAddingEducation] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [experienceForm, setExperienceForm] = useState({
    job_title: '',
    company: '',
    location: '',
    start_date: '',
    end_date: '',
    is_current: false,
    master_description: '',
  });

  const [educationForm, setEducationForm] = useState({
    school_university: '',
    degree: '',
    field_of_study: '',
    location: '',
    start_date: '',
    end_date: '',
    is_current: false,
    gpa: '',
    honors: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [experiences, education] = await Promise.all([
        profileService.getWorkExperiences(),
        profileService.getEducationRecords()
      ]);
      setWorkExperiences(experiences);
      setEducationRecords(education);
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: 'Failed to load career data. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddExperience = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const experienceData: WorkExperienceCreateRequest = {
        job_title: experienceForm.job_title,
        company: experienceForm.company,
        location: experienceForm.location || undefined,
        start_date: experienceForm.start_date,
        end_date: experienceForm.end_date || undefined,
        is_current: experienceForm.is_current,
        master_description: experienceForm.master_description,
      };

      const newExperience = await profileService.createWorkExperience(experienceData);
      setWorkExperiences(prev => [...prev, newExperience]);
      setExperienceForm({
        job_title: '',
        company: '',
        location: '',
        start_date: '',
        end_date: '',
        is_current: false,
        master_description: '',
      });
      setIsAddingExperience(false);
      setMessage({ type: 'success', text: 'Work experience added successfully!' });
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.detail || 'Failed to add work experience. Please try again.'
      });
    }
  };

  const handleAddEducation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const educationData: EducationCreateRequest = {
        school_university: educationForm.school_university,
        degree: educationForm.degree,
        field_of_study: educationForm.field_of_study,
        location: educationForm.location || undefined,
        start_date: educationForm.start_date || undefined,
        end_date: educationForm.end_date || undefined,
        is_current: educationForm.is_current,
        gpa: educationForm.gpa || undefined,
        honors: educationForm.honors || undefined,
      };

      const newEducation = await profileService.createEducationRecord(educationData);
      setEducationRecords(prev => [...prev, newEducation]);
      setEducationForm({
        school_university: '',
        degree: '',
        field_of_study: '',
        location: '',
        start_date: '',
        end_date: '',
        is_current: false,
        gpa: '',
        honors: '',
      });
      setIsAddingEducation(false);
      setMessage({ type: 'success', text: 'Education record added successfully!' });
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.detail || 'Failed to add education record. Please try again.'
      });
    }
  };

  const handleDeleteExperience = async (id: string) => {
    if (!confirm('Are you sure you want to delete this work experience?')) return;

    try {
      await profileService.deleteWorkExperience(id);
      setWorkExperiences(prev => prev.filter(exp => exp.id !== id));
      setMessage({ type: 'success', text: 'Work experience deleted successfully!' });
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.detail || 'Failed to delete work experience.'
      });
    }
  };

  const handleDeleteEducation = async (id: string) => {
    if (!confirm('Are you sure you want to delete this education record?')) return;

    try {
      await profileService.deleteEducationRecord(id);
      setEducationRecords(prev => prev.filter(edu => edu.id !== id));
      setMessage({ type: 'success', text: 'Education record deleted successfully!' });
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.detail || 'Failed to delete education record.'
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

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

      {message && (
        <div className={`mb-6 p-4 rounded-xl border flex items-center gap-3 ${
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
      )}

      <div className="space-y-8">
        {/* Work Experience Section */}
        <div className="bg-[#F9FAFB] rounded-xl p-6 border border-[#E5E7EB]">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-[#3056F5]" />
              <h4 className="text-lg font-semibold text-[#0F172A]">Work Experience</h4>
            </div>
            <Button
              onClick={() => setIsAddingExperience(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#3056F5] hover:bg-[#1E40AF] text-white rounded-xl"
            >
              <Plus className="w-4 h-4" />
              Add Experience
            </Button>
          </div>

          {/* Add Experience Form */}
          {isAddingExperience && (
            <form onSubmit={handleAddExperience} className="mb-6 p-4 bg-white rounded-xl border border-[#E5E7EB]">
              <h5 className="text-lg font-semibold text-[#0F172A] mb-4">Add New Work Experience</h5>
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
                    placeholder="e.g., San Francisco, CA"
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
                    onChange={(e) => setExperienceForm(prev => ({ ...prev, is_current: e.target.checked }))}
                    className="mr-2"
                  />
                  <Label htmlFor="is_current">Currently working here</Label>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <Label htmlFor="master_description">Job Description *</Label>
                <Textarea
                  id="master_description"
                  value={experienceForm.master_description}
                  onChange={(e) => setExperienceForm(prev => ({ ...prev, master_description: e.target.value }))}
                  placeholder="Describe your responsibilities, achievements, and key projects..."
                  rows={4}
                  required
                />
              </div>
              <div className="flex gap-3 mt-4">
                <Button type="submit" className="px-6 py-2 bg-[#3056F5] text-white rounded-xl">
                  Add Experience
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddingExperience(false)}
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
                <div key={experience.id} className="bg-white rounded-xl border border-[#E5E7EB] p-4">
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
                        {experience.master_description}
                      </p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="p-2 border-[#D1D5DB] hover:bg-gray-50"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteExperience(experience.id)}
                        className="p-2 border-red-200 text-red-600 hover:bg-red-50"
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
            <Button
              onClick={() => setIsAddingEducation(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#3056F5] hover:bg-[#1E40AF] text-white rounded-xl"
            >
              <Plus className="w-4 h-4" />
              Add Education
            </Button>
          </div>

          {/* Add Education Form */}
          {isAddingEducation && (
            <form onSubmit={handleAddEducation} className="mb-6 p-4 bg-white rounded-xl border border-[#E5E7EB]">
              <h5 className="text-lg font-semibold text-[#0F172A] mb-4">Add New Education Record</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="school_university">School/University *</Label>
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
                  <Label htmlFor="field_of_study">Field of Study *</Label>
                  <Input
                    id="field_of_study"
                    value={educationForm.field_of_study}
                    onChange={(e) => setEducationForm(prev => ({ ...prev, field_of_study: e.target.value }))}
                    placeholder="e.g., Computer Science"
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
                    onChange={(e) => setEducationForm(prev => ({ ...prev, is_current: e.target.checked }))}
                    className="mr-2"
                  />
                  <Label htmlFor="is_current_edu">Currently studying</Label>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gpa">GPA</Label>
                  <Input
                    id="gpa"
                    value={educationForm.gpa}
                    onChange={(e) => setEducationForm(prev => ({ ...prev, gpa: e.target.value }))}
                    placeholder="e.g., 3.8/4.0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="honors">Honors</Label>
                  <Input
                    id="honors"
                    value={educationForm.honors}
                    onChange={(e) => setEducationForm(prev => ({ ...prev, honors: e.target.value }))}
                    placeholder="e.g., Magna Cum Laude"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <Button type="submit" className="px-6 py-2 bg-[#3056F5] text-white rounded-xl">
                  Add Education
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddingEducation(false)}
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
                <div key={education.id} className="bg-white rounded-xl border border-[#E5E7EB] p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <GraduationCap className="w-4 h-4 text-[#6B7280]" />
                        <h5 className="font-semibold text-[#0F172A]">{education.degree}</h5>
                      </div>
                      <p className="text-[#475569] font-medium">{education.school_university}</p>
                      <p className="text-[#475569]">{education.field_of_study}</p>
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
                        {education.gpa && (
                          <span>GPA: {education.gpa}</span>
                        )}
                      </div>
                      {education.honors && (
                        <p className="text-sm text-[#3056F5] mt-1 font-medium">{education.honors}</p>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="p-2 border-[#D1D5DB] hover:bg-gray-50"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteEducation(education.id)}
                        className="p-2 border-red-200 text-red-600 hover:bg-red-50"
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
