import React, { useState } from 'react'
import { profileService } from '../../services/profileService'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Settings, Plus, X, Award, Pencil, CheckCircle2 } from 'lucide-react'
import type { Skill, Certification, SkillCreate, CertificationCreate } from '../../types/profile'
import { toast } from 'sonner'
import { queryClient } from '../../lib/queryClient'

// Helper function to invalidate job recommendations cache when skills change
const invalidateRecommendationsCache = () => {
  // Invalidate all job-related queries
  queryClient.invalidateQueries({ queryKey: ['jobs'] })
  // Also remove from localStorage
  if (typeof window !== 'undefined') {
    const cacheKey = 'convexhire-query-cache'
    try {
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        const cacheData = JSON.parse(cached)
        // Remove recommendation-related entries
        const newCache: Record<string, unknown> = {}
        Object.entries(cacheData).forEach(([key, value]) => {
          if (!key.includes('jobs') && !key.includes('recommendations')) {
            newCache[key] = value
          }
        })
        localStorage.setItem(cacheKey, JSON.stringify(newCache))
      }
    } catch {
      // Ignore errors
    }
  }
}

interface SkillsExpertiseTabProps {
  skills: Skill[]
  certifications: Certification[]
}

export function SkillsExpertiseTab({
  skills: initialSkills,
  certifications: initialCertifications,
}: SkillsExpertiseTabProps) {
  // Skills State
  const [skills, setSkills] = useState<Skill[]>(initialSkills)
  const [isAddingSkill, setIsAddingSkill] = useState(false)
  const [editingSkillId, setEditingSkillId] = useState<string | null>(null)
  const [skillForm, setSkillForm] = useState({
    skill_name: '',
  })

  // Certifications State
  const [certifications, setCertifications] = useState<Certification[]>(initialCertifications)
  const [isAddingCert, setIsAddingCert] = useState(false)
  const [editingCertId, setEditingCertId] = useState<string | null>(null)
  const [certForm, setCertForm] = useState<CertificationCreate>({
    certification_name: '',
    issuing_body: '',
    credential_id: '',
    credential_url: '',
    issue_date: '',
    expiration_date: '',
    does_not_expire: false,
  })

  // --- Skills Handlers ---

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const skillData: SkillCreate = {
        skill_name: skillForm.skill_name,
      }

      if (editingSkillId) {
        const updatedSkill = await profileService.updateSkill(editingSkillId, skillData)
        setSkills(prev =>
          prev.map(s =>
            s.candidate_skill_id === editingSkillId ? (updatedSkill as unknown as Skill) : s
          )
        )
        toast.success('Skill updated successfully!')
        invalidateRecommendationsCache() // Refresh recommendations
      } else {
        const newSkill = await profileService.addSkill(skillData)
        setSkills(prev => [...prev, newSkill as unknown as Skill])
        toast.success('Skill added successfully!')
        invalidateRecommendationsCache() // Refresh recommendations
      }

      setSkillForm({
        skill_name: '',
      })
      setIsAddingSkill(false)
      setEditingSkillId(null)
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string } } }
      toast.error(error.response?.data?.detail || 'Failed to save skill.')
    }
  }

  const handleEditSkill = (skill: Skill) => {
    setSkillForm({ skill_name: skill.skill_name })
    setEditingSkillId(skill.candidate_skill_id)
    setIsAddingSkill(true)
  }

  const handleDeleteSkill = async (id: string) => {
    if (!confirm('Are you sure you want to delete this skill?')) return
    try {
      await profileService.deleteSkill(id)
      setSkills(prev => prev.filter(skill => skill.candidate_skill_id !== id))
      toast.success('Skill deleted successfully!')
      invalidateRecommendationsCache() // Refresh recommendations
      if (editingSkillId === id) {
        setIsAddingSkill(false)
        setEditingSkillId(null)
      }
    } catch {
      toast.error('Failed to delete skill.')
    }
  }

  const handleCancelSkill = () => {
    setIsAddingSkill(false)
    setEditingSkillId(null)
    setSkillForm({
      skill_name: '',
    })
  }

  // --- Certifications Handlers ---

  const handleAddCert = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const certData: CertificationCreate = {
        ...certForm,
        credential_id: certForm.credential_id || undefined,
        credential_url: certForm.credential_url || undefined,
        issue_date: certForm.issue_date || undefined,
        expiration_date: certForm.expiration_date || undefined,
      }

      if (editingCertId) {
        const updatedCert = await profileService.updateCertification(editingCertId, certData)
        setCertifications(prev =>
          prev.map(c =>
            c.candidate_certification_id === editingCertId
              ? (updatedCert as unknown as Certification)
              : c
          )
        )
        toast.success('Certification updated successfully!')
      } else {
        const newCert = await profileService.addCertification(certData)
        setCertifications(prev => [...prev, newCert as unknown as Certification])
        toast.success('Certification added successfully!')
      }

      setCertForm({
        certification_name: '',
        issuing_body: '',
        credential_id: '',
        credential_url: '',
        issue_date: '',
        expiration_date: '',
        does_not_expire: false,
      })
      setIsAddingCert(false)
      setEditingCertId(null)
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string } } }
      toast.error(error.response?.data?.detail || 'Failed to save certification.')
    }
  }

  const handleEditCert = (cert: Certification) => {
    setCertForm({
      certification_name: cert.certification_name,
      issuing_body: cert.issuing_body,
      credential_id: cert.credential_id || '',
      credential_url: cert.credential_url || '',
      issue_date: cert.issue_date || '',
      expiration_date: cert.expiration_date || '',
      does_not_expire: cert.does_not_expire,
    })
    setEditingCertId(cert.candidate_certification_id)
    setIsAddingCert(true)
  }

  const handleDeleteCert = async (id: string) => {
    if (!confirm('Are you sure you want to delete this certification?')) return
    try {
      await profileService.deleteCertification(id)
      setCertifications(prev => prev.filter(cert => cert.candidate_certification_id !== id))
      toast.success('Certification deleted successfully!')
      if (editingCertId === id) {
        setIsAddingCert(false)
        setEditingCertId(null)
      }
    } catch {
      toast.error('Failed to delete certification.')
    }
  }

  const handleCancelCert = () => {
    setIsAddingCert(false)
    setEditingCertId(null)
    setCertForm({
      certification_name: '',
      issuing_body: '',
      credential_id: '',
      credential_url: '',
      issue_date: '',
      expiration_date: '',
      does_not_expire: false,
    })
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-[#0F172A] mb-2">Skills & Expertise</h3>
        <p className="text-[#475569]">Manage your professional skills and certifications.</p>
      </div>

      <div className="space-y-8">
        {/* Skills Section */}
        <div className="bg-white rounded-2xl p-8 border border-[#E5E7EB] shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm border border-blue-100">
                <Settings className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-[#0F172A]">Skills</h4>
                <p className="text-sm text-[#64748B]">Your technical competencies</p>
              </div>
            </div>
            {!isAddingSkill && (
              <Button
                onClick={() => {
                  setEditingSkillId(null)
                  setSkillForm({ skill_name: '' })
                  setIsAddingSkill(true)
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#3056F5] hover:bg-[#1E40AF] text-white rounded-xl shadow-md shadow-blue-500/20 transition-all duration-200"
              >
                <Plus className="w-4 h-4" />
                Add Skill
              </Button>
            )}
          </div>

          {/* Add/Edit Skill Form */}
          {isAddingSkill && (
            <form
              onSubmit={handleAddSkill}
              className="mb-8 p-6 bg-gray-50 rounded-2xl border border-gray-200 animate-in fade-in slide-in-from-top-4 duration-300"
            >
              <h5 className="text-lg font-bold text-[#0F172A] mb-6 flex items-center gap-2">
                {editingSkillId ? (
                  <Pencil className="w-5 h-5 text-blue-600" />
                ) : (
                  <Plus className="w-5 h-5 text-blue-600" />
                )}
                {editingSkillId ? 'Edit Skill' : 'Add New Skill'}
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="skill_name" className="font-semibold text-gray-700">
                    Skill Name *
                  </Label>
                  <Input
                    id="skill_name"
                    value={skillForm.skill_name}
                    onChange={e => setSkillForm(prev => ({ ...prev, skill_name: e.target.value }))}
                    placeholder="e.g., React, Python, Project Management"
                    className="h-11 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
                <Button
                  type="submit"
                  className="px-6 py-2.5 bg-[#3056F5] hover:bg-[#1E40AF] text-white rounded-xl font-medium shadow-sm transition-all"
                >
                  {editingSkillId ? 'Save Changes' : 'Add Skill'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelSkill}
                  className="px-6 py-2.5 border-gray-300 text-gray-700 hover:bg-gray-100 rounded-xl font-medium transition-all"
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {/* Skills List - Pill Layout */}
          {skills.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-gray-100">
                <Settings className="w-8 h-8 text-gray-400" />
              </div>
              <h5 className="text-lg font-semibold text-gray-900 mb-2">No skills added yet</h5>
              <p className="text-gray-500 max-w-sm mx-auto">
                Add your key skills to help recruiters find you for relevant opportunities.
              </p>
              {!isAddingSkill && (
                <Button
                  onClick={() => setIsAddingSkill(true)}
                  variant="outline"
                  className="mt-6 border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 rounded-xl"
                >
                  Add Skill
                </Button>
              )}
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              {skills.map(skill => (
                <div
                  key={skill.candidate_skill_id}
                  className="group inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100 hover:bg-indigo-100 hover:border-indigo-200 hover:shadow-sm transition-all duration-200"
                >
                  <span className="font-semibold">{skill.skill_name}</span>
                  <div className="flex items-center gap-1 border-l border-indigo-200 pl-2 ml-1 opacity-60 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEditSkill(skill)}
                      className="flex items-center justify-center w-6 h-6 text-indigo-600 hover:bg-white hover:shadow-sm rounded-lg transition-all duration-200"
                      title="Edit skill"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteSkill(skill.candidate_skill_id)}
                      className="flex items-center justify-center w-6 h-6 text-indigo-600 hover:text-red-600 hover:bg-white hover:shadow-sm rounded-lg transition-all duration-200"
                      title="Delete skill"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Certifications Section */}
        <div className="bg-white rounded-2xl p-8 border border-[#E5E7EB] shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shadow-sm border border-amber-100">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-[#0F172A]">Certifications</h4>
                <p className="text-sm text-[#64748B]">Licenses and professional certifications</p>
              </div>
            </div>
            {!isAddingCert && (
              <Button
                onClick={() => {
                  setEditingCertId(null)
                  setCertForm({
                    certification_name: '',
                    issuing_body: '',
                    credential_id: '',
                    credential_url: '',
                    issue_date: '',
                    expiration_date: '',
                    does_not_expire: false,
                  })
                  setIsAddingCert(true)
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#3056F5] hover:bg-[#1E40AF] text-white rounded-xl shadow-md shadow-blue-500/20 transition-all duration-200"
              >
                <Plus className="w-4 h-4" />
                Add Certification
              </Button>
            )}
          </div>

          {/* Add/Edit Certification Form */}
          {isAddingCert && (
            <form
              onSubmit={handleAddCert}
              className="mb-8 p-6 bg-gray-50 rounded-2xl border border-gray-200 animate-in fade-in slide-in-from-top-4 duration-300"
            >
              <h5 className="text-lg font-bold text-[#0F172A] mb-6 flex items-center gap-2">
                {editingCertId ? (
                  <Pencil className="w-5 h-5 text-amber-600" />
                ) : (
                  <Plus className="w-5 h-5 text-amber-600" />
                )}
                {editingCertId ? 'Edit Certification' : 'Add New Certification'}
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="cert_name" className="font-semibold text-gray-700">
                    Certification Name *
                  </Label>
                  <Input
                    id="cert_name"
                    value={certForm.certification_name}
                    onChange={e =>
                      setCertForm(prev => ({ ...prev, certification_name: e.target.value }))
                    }
                    placeholder="e.g., AWS Certified Solutions Architect"
                    className="h-11 rounded-xl border-gray-300 focus:border-amber-500 focus:ring-amber-500/20"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="issuing_body" className="font-semibold text-gray-700">
                    Issuing Organization *
                  </Label>
                  <Input
                    id="issuing_body"
                    value={certForm.issuing_body}
                    onChange={e => setCertForm(prev => ({ ...prev, issuing_body: e.target.value }))}
                    placeholder="e.g., Amazon Web Services"
                    className="h-11 rounded-xl border-gray-300 focus:border-amber-500 focus:ring-amber-500/20"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="issue_date" className="font-semibold text-gray-700">
                    Issue Date
                  </Label>
                  <Input
                    id="issue_date"
                    type="date"
                    value={certForm.issue_date}
                    onChange={e => setCertForm(prev => ({ ...prev, issue_date: e.target.value }))}
                    className="h-11 rounded-xl border-gray-300 focus:border-amber-500 focus:ring-amber-500/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiration_date" className="font-semibold text-gray-700">
                    Expiration Date
                  </Label>
                  <Input
                    id="expiration_date"
                    type="date"
                    value={certForm.expiration_date}
                    onChange={e =>
                      setCertForm(prev => ({ ...prev, expiration_date: e.target.value }))
                    }
                    className="h-11 rounded-xl border-gray-300 focus:border-amber-500 focus:ring-amber-500/20"
                    disabled={certForm.does_not_expire}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="credential_id" className="font-semibold text-gray-700">
                    Credential ID
                  </Label>
                  <Input
                    id="credential_id"
                    value={certForm.credential_id}
                    onChange={e =>
                      setCertForm(prev => ({ ...prev, credential_id: e.target.value }))
                    }
                    placeholder="Optional"
                    className="h-11 rounded-xl border-gray-300 focus:border-amber-500 focus:ring-amber-500/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="credential_url" className="font-semibold text-gray-700">
                    Credential URL
                  </Label>
                  <Input
                    id="credential_url"
                    value={certForm.credential_url}
                    onChange={e =>
                      setCertForm(prev => ({ ...prev, credential_url: e.target.value }))
                    }
                    placeholder="Optional (https://...)"
                    className="h-11 rounded-xl border-gray-300 focus:border-amber-500 focus:ring-amber-500/20"
                  />
                </div>
                <div className="space-y-2 flex items-center pt-8">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center">
                      <input
                        type="checkbox"
                        id="does_not_expire"
                        checked={certForm.does_not_expire}
                        onChange={e => {
                          const isChecked = e.target.checked
                          setCertForm(prev => ({
                            ...prev,
                            does_not_expire: isChecked,
                            expiration_date: isChecked ? '' : prev.expiration_date,
                          }))
                        }}
                        className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-gray-300 transition-all checked:border-amber-500 checked:bg-amber-500 hover:border-amber-400"
                      />
                      <CheckCircle2 className="pointer-events-none absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                    </div>
                    <span className="font-medium text-gray-700 group-hover:text-amber-600 transition-colors">
                      This certification does not expire
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
                <Button
                  type="submit"
                  className="px-6 py-2.5 bg-[#3056F5] hover:bg-[#1E40AF] text-white rounded-xl font-medium shadow-sm transition-all"
                >
                  {editingCertId ? 'Save Changes' : 'Add Certification'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelCert}
                  className="px-6 py-2.5 border-gray-300 text-gray-700 hover:bg-gray-100 rounded-xl font-medium transition-all"
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {/* Certifications List */}
          {certifications.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-gray-100">
                <Award className="w-8 h-8 text-gray-400" />
              </div>
              <h5 className="text-lg font-semibold text-gray-900 mb-2">
                No certifications added yet
              </h5>
              <p className="text-gray-500 max-w-sm mx-auto">
                Add your licenses and certifications to demonstrate your expertise.
              </p>
              {!isAddingCert && (
                <Button
                  onClick={() => setIsAddingCert(true)}
                  variant="outline"
                  className="mt-6 border-amber-200 text-amber-600 hover:bg-amber-50 hover:border-amber-300 rounded-xl"
                >
                  Add Certification
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {certifications.map(cert => (
                <div
                  key={cert.candidate_certification_id}
                  className="group flex items-start justify-between p-5 bg-white border border-[#E5E7EB] rounded-xl hover:border-amber-200 hover:shadow-md transition-all duration-300"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-amber-50 text-amber-600 rounded-lg group-hover:bg-amber-100 transition-colors">
                      <Award className="w-6 h-6" />
                    </div>
                    <div>
                      <h5 className="text-lg font-bold text-[#0F172A]">
                        {cert.certification_name}
                      </h5>
                      <p className="text-[#475569] font-medium">{cert.issuing_body}</p>
                      <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-[#64748B]">
                        {cert.issue_date && (
                          <span className="bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                            Issued: {new Date(cert.issue_date).toLocaleDateString()}
                          </span>
                        )}
                        {cert.expiration_date && (
                          <span className="bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                            Expires: {new Date(cert.expiration_date).toLocaleDateString()}
                          </span>
                        )}
                        {cert.does_not_expire && (
                          <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded border border-green-100 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> No Expiration
                          </span>
                        )}
                      </div>
                      {cert.credential_url && (
                        <a
                          href={cert.credential_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-[#3056F5] hover:underline mt-2 inline-flex items-center gap-1"
                        >
                          Show Credential
                          <Award className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={() => handleEditCert(cert)}
                      className="p-2 text-[#64748B] hover:text-[#3056F5] hover:bg-blue-50 rounded-lg transition-colors duration-200"
                      title="Edit certification"
                    >
                      <Pencil className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCert(cert.candidate_certification_id)}
                      className="p-2 text-[#64748B] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                      title="Delete certification"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
