import React, { useState } from 'react'
import { profileService } from '../../services/profileService'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import {
  Briefcase,
  GraduationCap,
  Plus,
  Trash2,
  Calendar,
  MapPin,
  Building,
  Pencil,
  CheckCircle2,
} from 'lucide-react'
import type {
  WorkExperience,
  Education,
  WorkExperienceCreate,
  EducationCreate,
} from '../../types/profile'
import { toast } from 'sonner'
import { useDeleteConfirm } from '../ui/delete-confirm-dialog'

interface CareerHistoryTabProps {
  experiences: WorkExperience[]
  educations: Education[]
}

export function CareerHistoryTab({
  experiences: initialExperiences,
  educations: initialEducations,
}: CareerHistoryTabProps) {
  const [workExperiences, setWorkExperiences] = useState<WorkExperience[]>(initialExperiences)
  const [educationRecords, setEducationRecords] = useState<Education[]>(initialEducations)

  const [isAddingExperience, setIsAddingExperience] = useState(false)
  const [isAddingEducation, setIsAddingEducation] = useState(false)

  const [editingExpId, setEditingExpId] = useState<string | null>(null)
  const [editingEduId, setEditingEduId] = useState<string | null>(null)

  const { confirm, Dialog } = useDeleteConfirm()

  const [experienceForm, setExperienceForm] = useState({
    job_title: '',
    company: '',
    location: '',
    start_date: '',
    end_date: '',
    is_current: false,
    description: '',
  })

  const [educationForm, setEducationForm] = useState({
    school_university: '',
    degree: '',
    location: '',
    start_date: '',
    end_date: '',
    is_current: false,
  })

  const handleAddExperience = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const experienceData: WorkExperienceCreate = {
        job_title: experienceForm.job_title,
        company: experienceForm.company,
        location: experienceForm.location || undefined,
        start_date: experienceForm.start_date,
        end_date: experienceForm.end_date || undefined,
        is_current: experienceForm.is_current,
        description: experienceForm.description || undefined,
      }

      if (editingExpId) {
        const updatedExp = await profileService.updateExperience(editingExpId, experienceData)
        setWorkExperiences(prev =>
          prev.map(exp =>
            exp.candidate_work_experience_id === editingExpId
              ? (updatedExp as unknown as WorkExperience)
              : exp
          )
        )
        toast.success('Work experience updated successfully!')
      } else {
        const newExperience = await profileService.addExperience(experienceData)
        setWorkExperiences(prev => [...prev, newExperience as unknown as WorkExperience])
        toast.success('Work experience added successfully!')
      }

      setExperienceForm({
        job_title: '',
        company: '',
        location: '',
        start_date: '',
        end_date: '',
        is_current: false,
        description: '',
      })
      setIsAddingExperience(false)
      setEditingExpId(null)
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string } } }
      toast.error(error.response?.data?.detail || 'Failed to save work experience.')
    }
  }

  const handleEditExperience = (exp: WorkExperience) => {
    setExperienceForm({
      job_title: exp.job_title,
      company: exp.company,
      location: exp.location || '',
      start_date: exp.start_date ? new Date(exp.start_date).toISOString().split('T')[0] : '',
      end_date: exp.end_date ? new Date(exp.end_date).toISOString().split('T')[0] : '',
      is_current: exp.is_current,
      description: exp.description || '',
    })
    setEditingExpId(exp.candidate_work_experience_id)
    setIsAddingExperience(true)
  }

  const handleDeleteExperience = async (id: string, jobTitle: string, company: string) => {
    await confirm({
      title: 'Delete Work Experience',
      description: "You're about to permanently delete",
      itemName: `${jobTitle} at ${company}`,
      onConfirm: async () => {
        try {
          await profileService.deleteExperience(id)
          setWorkExperiences(prev => prev.filter(exp => exp.candidate_work_experience_id !== id))
          toast.success('Work experience deleted successfully!')
          if (editingExpId === id) {
            setIsAddingExperience(false)
            setEditingExpId(null)
          }
        } catch {
          toast.error('Failed to delete work experience.')
        }
      },
    })
  }

  const handleCancelExperience = () => {
    setIsAddingExperience(false)
    setEditingExpId(null)
    setExperienceForm({
      job_title: '',
      company: '',
      location: '',
      start_date: '',
      end_date: '',
      is_current: false,
      description: '',
    })
  }

  const handleAddEducation = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const educationData: EducationCreate = {
        college_name: educationForm.school_university,
        degree: educationForm.degree,
        location: educationForm.location || undefined,
        start_date: educationForm.start_date || undefined,
        end_date: educationForm.end_date || undefined,
        is_current: educationForm.is_current,
      }

      if (editingEduId) {
        const updatedEdu = await profileService.updateEducation(editingEduId, educationData)
        setEducationRecords(prev =>
          prev.map(edu =>
            edu.candidate_education_id === editingEduId ? (updatedEdu as unknown as Education) : edu
          )
        )
        toast.success('Education record updated successfully!')
      } else {
        const newEducation = await profileService.addEducation(educationData)
        setEducationRecords(prev => [...prev, newEducation as unknown as Education])
        toast.success('Education record added successfully!')
      }

      setEducationForm({
        school_university: '',
        degree: '',
        location: '',
        start_date: '',
        end_date: '',
        is_current: false,
      })
      setIsAddingEducation(false)
      setEditingEduId(null)
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string } } }
      toast.error(error.response?.data?.detail || 'Failed to save education record.')
    }
  }

  const handleEditEducation = (edu: Education) => {
    setEducationForm({
      school_university: edu.college_name,
      degree: edu.degree,
      location: edu.location || '',
      start_date: edu.start_date ? new Date(edu.start_date).toISOString().split('T')[0] : '',
      end_date: edu.end_date ? new Date(edu.end_date).toISOString().split('T')[0] : '',
      is_current: edu.is_current,
    })
    setEditingEduId(edu.candidate_education_id)
    setIsAddingEducation(true)
  }

  const handleDeleteEducation = async (id: string, degree: string, institution: string) => {
    await confirm({
      title: 'Delete Education',
      description: "You're about to permanently delete",
      itemName: `${degree} from ${institution}`,
      onConfirm: async () => {
        try {
          await profileService.deleteEducation(id)
          setEducationRecords(prev => prev.filter(edu => edu.candidate_education_id !== id))
          toast.success('Education record deleted successfully!')
          if (editingEduId === id) {
            setIsAddingEducation(false)
            setEditingEduId(null)
          }
        } catch {
          toast.error('Failed to delete education record.')
        }
      },
    })
  }

  const handleCancelEducation = () => {
    setIsAddingEducation(false)
    setEditingEduId(null)
    setEducationForm({
      school_university: '',
      degree: '',
      location: '',
      start_date: '',
      end_date: '',
      is_current: false,
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
    })
  }

  return (
    <div className="px-10 py-8">
      <div className="space-y-8">
        {}
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-border-default">
            <div>
              <h4 className="text-lg font-bold text-text-primary">Work Experience</h4>
              <p className="text-sm text-text-tertiary mt-0.5">Your professional journey</p>
            </div>
            {!isAddingExperience && (
              <Button
                onClick={() => {
                  setEditingExpId(null)
                  setExperienceForm({
                    job_title: '',
                    company: '',
                    location: '',
                    start_date: '',
                    end_date: '',
                    is_current: false,
                    description: '',
                  })
                  setIsAddingExperience(true)
                }}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded font-medium"
              >
                <Plus className="w-4 h-4" />
                Add Experience
              </Button>
            )}
          </div>

          {}
          {isAddingExperience && (
            <form
              onSubmit={handleAddExperience}
              className="mb-6 p-6 bg-background-subtle rounded border border-border-default"
            >
              <h5 className="text-base font-bold text-text-primary mb-4 flex items-center gap-2">
                {editingExpId ? (
                  <Pencil className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                ) : (
                  <Plus className="w-5 h-5 text-primary-600" />
                )}
                {editingExpId ? 'Edit Work Experience' : 'Add New Work Experience'}
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="job_title" className="font-semibold text-text-secondary">
                    Job Title *
                  </Label>
                  <Input
                    id="job_title"
                    value={experienceForm.job_title}
                    onChange={e =>
                      setExperienceForm(prev => ({
                        ...prev,
                        job_title: e.target.value,
                      }))
                    }
                    placeholder="e.g., Senior Software Engineer"
                    className="h-11 rounded-xl border-border-default focus:border-primary focus:ring-primary/20"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company" className="font-semibold text-text-secondary">
                    Company *
                  </Label>
                  <Input
                    id="company"
                    value={experienceForm.company}
                    onChange={e =>
                      setExperienceForm(prev => ({
                        ...prev,
                        company: e.target.value,
                      }))
                    }
                    placeholder="e.g., Google"
                    className="h-11 rounded-xl border-border-default focus:border-primary focus:ring-primary/20"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location" className="font-semibold text-text-secondary">
                    Location
                  </Label>
                  <Input
                    id="location"
                    value={experienceForm.location}
                    onChange={e =>
                      setExperienceForm(prev => ({
                        ...prev,
                        location: e.target.value,
                      }))
                    }
                    placeholder="e.g., Kathmandu"
                    className="h-11 rounded-xl border-border-default focus:border-primary focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="start_date" className="font-semibold text-text-secondary">
                    Start Date *
                  </Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={experienceForm.start_date}
                    onChange={e =>
                      setExperienceForm(prev => ({
                        ...prev,
                        start_date: e.target.value,
                      }))
                    }
                    className="h-11 rounded-xl border-border-default focus:border-primary focus:ring-primary/20"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date" className="font-semibold text-text-secondary">
                    End Date
                  </Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={experienceForm.end_date}
                    onChange={e =>
                      setExperienceForm(prev => ({
                        ...prev,
                        end_date: e.target.value,
                      }))
                    }
                    className="h-11 rounded-xl border-border-default focus:border-primary focus:ring-primary/20"
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
                        onChange={e => {
                          const isChecked = e.target.checked
                          setExperienceForm(prev => ({
                            ...prev,
                            is_current: isChecked,
                            end_date: isChecked ? '' : prev.end_date,
                          }))
                        }}
                        className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-border-default transition-all checked:border-primary-500 checked:bg-primary-500 hover:border-primary-400"
                      />
                      <CheckCircle2 className="pointer-events-none absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                    </div>
                    <span className="font-medium text-text-secondary group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      Currently working here
                    </span>
                  </label>
                </div>
              </div>
              <div className="mt-6 space-y-2">
                <Label htmlFor="description" className="font-semibold text-text-secondary">
                  Job Description
                </Label>
                <Textarea
                  id="description"
                  value={experienceForm.description}
                  onChange={e =>
                    setExperienceForm(prev => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Describe your responsibilities, achievements, and key projects..."
                  rows={4}
                  className="rounded-xl border-border-default focus:border-primary focus:ring-primary/20 resize-none"
                />
              </div>
              <div className="flex gap-3 mt-6 pt-4 border-t border-border-default">
                <Button
                  type="submit"
                  className="px-6 py-2.5 bg-primary hover:bg-primary-700 text-white rounded-xl font-medium shadow-sm transition-all"
                >
                  {editingExpId ? 'Save Changes' : 'Add Experience'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelExperience}
                  className="px-6 py-2.5 border-border-default text-text-secondary hover:bg-background-subtle rounded-xl font-medium transition-all"
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {}
          {workExperiences.length === 0 ? (
            <div className="text-center py-12 bg-background-subtle rounded-2xl border border-dashed border-border-default">
              <div className="w-16 h-16 bg-background-surface rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-border-subtle">
                <Briefcase className="w-8 h-8 text-text-muted" />
              </div>
              <h5 className="text-lg font-semibold text-text-primary mb-2">
                No work experience added yet
              </h5>
              <p className="text-text-tertiary max-w-sm mx-auto">
                Add your past work experience to showcase your professional background to
                recruiters.
              </p>
              {!isAddingExperience && (
                <Button
                  onClick={() => setIsAddingExperience(true)}
                  variant="outline"
                  className="mt-6 border-primary-200 dark:border-primary-800 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/30 hover:border-primary-300 dark:hover:border-primary-700 rounded"
                >
                  Add Experience
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {workExperiences.map(experience => (
                <div
                  key={experience.candidate_work_experience_id}
                  className="group bg-background-surface rounded-xl border border-border-default p-5 hover:border-primary-200 hover:shadow-md transition-all duration-300"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400 rounded-lg group-hover:bg-primary-100 dark:group-hover:bg-primary-900/30 transition-colors">
                          <Building className="w-5 h-5" />
                        </div>
                        <div>
                          <h5 className="font-bold text-text-primary text-lg">
                            {experience.job_title}
                          </h5>
                          <p className="text-text-secondary font-medium">{experience.company}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-text-tertiary">
                        <div className="flex items-center gap-1.5 bg-background-subtle px-3 py-1 rounded-lg border border-border-subtle">
                          <Calendar className="w-4 h-4 text-primary-500" />
                          <span className="font-medium">
                            {formatDate(experience.start_date)} -{' '}
                            {experience.is_current
                              ? 'Present'
                              : formatDate(experience.end_date || '')}
                          </span>
                        </div>
                        {experience.location && (
                          <div className="flex items-center gap-1.5 bg-background-subtle px-3 py-1 rounded-lg border border-border-subtle">
                            <MapPin className="w-4 h-4 text-primary-500" />
                            <span className="font-medium">{experience.location}</span>
                          </div>
                        )}
                      </div>

                      {experience.description && (
                        <div className="mt-4 pl-4 border-l-2 border-border-subtle">
                          <p className="text-sm text-text-secondary leading-relaxed line-clamp-3 group-hover:line-clamp-none transition-all">
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
                        className="h-9 w-9 p-0 text-text-tertiary hover:text-primary hover:bg-primary-50 dark:hover:bg-primary-950/30 rounded-lg"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleDeleteExperience(
                            experience.candidate_work_experience_id,
                            experience.job_title,
                            experience.company
                          )
                        }
                        className="h-9 w-9 p-0 text-text-tertiary hover:text-error-600 hover:bg-error-50 rounded-lg"
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

        {}
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-border-default">
            <div>
              <h4 className="text-lg font-bold text-text-primary">Education</h4>
              <p className="text-sm text-text-tertiary mt-0.5">Your academic background</p>
            </div>
            {!isAddingEducation && (
              <Button
                onClick={() => {
                  setEditingEduId(null)
                  setEducationForm({
                    school_university: '',
                    degree: '',
                    location: '',
                    start_date: '',
                    end_date: '',
                    is_current: false,
                  })
                  setIsAddingEducation(true)
                }}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded font-medium"
              >
                <Plus className="w-4 h-4" />
                Add Education
              </Button>
            )}
          </div>

          {}
          {isAddingEducation && (
            <form
              onSubmit={handleAddEducation}
              className="mb-6 p-6 bg-background-subtle rounded border border-border-default"
            >
              <h5 className="text-base font-bold text-text-primary mb-4 flex items-center gap-2">
                {editingEduId ? (
                  <Pencil className="w-5 h-5 text-ai-600" />
                ) : (
                  <Plus className="w-5 h-5 text-ai-600" />
                )}
                {editingEduId ? 'Edit Education Record' : 'Add New Education Record'}
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="school_university" className="font-semibold text-text-secondary">
                    College/University *
                  </Label>
                  <Input
                    id="school_university"
                    value={educationForm.school_university}
                    onChange={e =>
                      setEducationForm(prev => ({
                        ...prev,
                        school_university: e.target.value,
                      }))
                    }
                    placeholder="e.g., Herald College Kathmandu"
                    className="h-11 rounded-xl border-border-default focus:border-ai-500 focus:ring-ai-500/20"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="degree" className="font-semibold text-text-secondary">
                    Degree *
                  </Label>
                  <Input
                    id="degree"
                    value={educationForm.degree}
                    onChange={e =>
                      setEducationForm(prev => ({
                        ...prev,
                        degree: e.target.value,
                      }))
                    }
                    placeholder="e.g., B(Hons) in Computer Science"
                    className="h-11 rounded-xl border-border-default focus:border-ai-500 focus:ring-ai-500/20"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location" className="font-semibold text-text-secondary">
                    Location
                  </Label>
                  <Input
                    id="location"
                    value={educationForm.location}
                    onChange={e =>
                      setEducationForm(prev => ({
                        ...prev,
                        location: e.target.value,
                      }))
                    }
                    placeholder="e.g., Kathmandu, Nepal"
                    className="h-11 rounded-xl border-border-default focus:border-ai-500 focus:ring-ai-500/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="start_date" className="font-semibold text-text-secondary">
                    Start Date
                  </Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={educationForm.start_date}
                    onChange={e =>
                      setEducationForm(prev => ({
                        ...prev,
                        start_date: e.target.value,
                      }))
                    }
                    className="h-11 rounded-xl border-border-default focus:border-ai-500 focus:ring-ai-500/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date" className="font-semibold text-text-secondary">
                    End Date
                  </Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={educationForm.end_date}
                    onChange={e =>
                      setEducationForm(prev => ({
                        ...prev,
                        end_date: e.target.value,
                      }))
                    }
                    className="h-11 rounded-xl border-border-default focus:border-ai-500 focus:ring-ai-500/20"
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
                        onChange={e => {
                          const isChecked = e.target.checked
                          setEducationForm(prev => ({
                            ...prev,
                            is_current: isChecked,
                            end_date: isChecked ? '' : prev.end_date,
                          }))
                        }}
                        className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-border-default transition-all checked:border-ai-500 checked:bg-ai-500 hover:border-ai-400"
                      />
                      <CheckCircle2 className="pointer-events-none absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                    </div>
                    <span className="font-medium text-text-secondary group-hover:text-ai-600 transition-colors">
                      Currently studying
                    </span>
                  </label>
                </div>
              </div>
              <div className="flex gap-3 mt-6 pt-4 border-t border-border-default">
                <Button
                  type="submit"
                  className="px-6 py-2.5 bg-primary hover:bg-primary-700 text-white rounded-xl font-medium shadow-sm transition-all"
                >
                  {editingEduId ? 'Save Changes' : 'Add Education'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelEducation}
                  className="px-6 py-2.5 border-border-default text-text-secondary hover:bg-background-subtle rounded-xl font-medium transition-all"
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {}
          {educationRecords.length === 0 ? (
            <div className="text-center py-12 bg-background-subtle rounded-2xl border border-dashed border-border-default">
              <div className="w-16 h-16 bg-background-surface rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-border-subtle">
                <GraduationCap className="w-8 h-8 text-text-muted" />
              </div>
              <h5 className="text-lg font-semibold text-text-primary mb-2">
                No education records added yet
              </h5>
              <p className="text-text-tertiary max-w-sm mx-auto">
                Add your educational background to complete your profile.
              </p>
              {!isAddingEducation && (
                <Button
                  onClick={() => setIsAddingEducation(true)}
                  variant="outline"
                  className="mt-6 border-ai-200 text-ai-600 hover:bg-ai-50 hover:border-ai-300 rounded"
                >
                  Add Education
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {educationRecords.map(education => (
                <div
                  key={education.candidate_education_id}
                  className="group bg-background-surface rounded-xl border border-border-default p-5 hover:border-ai-200 hover:shadow-md transition-all duration-300"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-ai-50 dark:bg-ai-950/30 text-ai-600 dark:text-ai-400 rounded-lg group-hover:bg-ai-100 dark:group-hover:bg-ai-900/30 transition-colors">
                          <GraduationCap className="w-5 h-5" />
                        </div>
                        <div>
                          <h5 className="font-bold text-text-primary text-lg">
                            {education.degree}
                          </h5>
                          <p className="text-text-secondary font-medium">
                            {education.college_name}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-text-tertiary">
                        {education.start_date && (
                          <div className="flex items-center gap-1.5 bg-background-subtle px-3 py-1 rounded-lg border border-border-subtle">
                            <Calendar className="w-4 h-4 text-ai-500" />
                            <span className="font-medium">
                              {formatDate(education.start_date)} -{' '}
                              {education.is_current
                                ? 'Present'
                                : formatDate(education.end_date || '')}
                            </span>
                          </div>
                        )}
                        {education.location && (
                          <div className="flex items-center gap-1.5 bg-background-subtle px-3 py-1 rounded-lg border border-border-subtle">
                            <MapPin className="w-4 h-4 text-ai-500" />
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
                        className="h-9 w-9 p-0 text-text-tertiary hover:text-primary hover:bg-primary-50 dark:hover:bg-primary-950/30 rounded-lg"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleDeleteEducation(
                            education.candidate_education_id,
                            education.degree,
                            education.college_name
                          )
                        }
                        className="h-9 w-9 p-0 text-text-tertiary hover:text-error-600 hover:bg-error-50 rounded-lg"
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
      <Dialog />
    </div>
  )
}
