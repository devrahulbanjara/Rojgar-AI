import React, { useState } from 'react';
import { profileService } from '../../services/profileService';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Settings, Plus, X, Award, Info, Pencil } from 'lucide-react';
import type { Skill, Certification, SkillCreate, CertificationCreate } from '../../types/profile';
import { toast } from 'sonner';
import { queryClient, clearQueryCache } from '../../lib/queryClient';

// Helper function to invalidate job recommendations cache when skills change
const invalidateRecommendationsCache = () => {
  // Invalidate all job-related queries
  queryClient.invalidateQueries({ queryKey: ['jobs'] });
  // Also remove from localStorage
  if (typeof window !== 'undefined') {
    const cacheKey = 'convexhire-query-cache';
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const cacheData = JSON.parse(cached);
        // Remove recommendation-related entries
        const newCache: Record<string, any> = {};
        Object.entries(cacheData).forEach(([key, value]) => {
          if (!key.includes('jobs') && !key.includes('recommendations')) {
            newCache[key] = value;
          }
        });
        localStorage.setItem(cacheKey, JSON.stringify(newCache));
      }
    } catch (e) {
      // Ignore errors
    }
  }
};

interface SkillsExpertiseTabProps {
  skills: Skill[];
  certifications: Certification[];
}

export function SkillsExpertiseTab({ skills: initialSkills, certifications: initialCertifications }: SkillsExpertiseTabProps) {
  // Skills State
  const [skills, setSkills] = useState<Skill[]>(initialSkills);
  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [editingSkillId, setEditingSkillId] = useState<string | null>(null);
  const [skillForm, setSkillForm] = useState({
    skill_name: '',
  });

  // Certifications State
  const [certifications, setCertifications] = useState<Certification[]>(initialCertifications);
  const [isAddingCert, setIsAddingCert] = useState(false);
  const [editingCertId, setEditingCertId] = useState<string | null>(null);
  const [certForm, setCertForm] = useState<CertificationCreate>({
    certification_name: '',
    issuing_body: '',
    credential_id: '',
    credential_url: '',
    issue_date: '',
    expiration_date: '',
    does_not_expire: false,
  });

  // --- Skills Handlers ---

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const skillData: SkillCreate = {
        skill_name: skillForm.skill_name,
      };

      if (editingSkillId) {
        const updatedSkill = await profileService.updateSkill(editingSkillId, skillData);
        setSkills(prev => prev.map(s => s.candidate_skill_id === editingSkillId ? (updatedSkill as unknown as Skill) : s));
        toast.success('Skill updated successfully!');
        invalidateRecommendationsCache(); // Refresh recommendations
      } else {
        const newSkill = await profileService.addSkill(skillData);
        setSkills(prev => [...prev, newSkill as unknown as Skill]);
        toast.success('Skill added successfully!');
        invalidateRecommendationsCache(); // Refresh recommendations
      }

      setSkillForm({
        skill_name: '',
      });
      setIsAddingSkill(false);
      setEditingSkillId(null);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to save skill.');
    }
  };

  const handleEditSkill = (skill: Skill) => {
    setSkillForm({ skill_name: skill.skill_name });
    setEditingSkillId(skill.candidate_skill_id);
    setIsAddingSkill(true);
  };

  const handleDeleteSkill = async (id: string) => {
    if (!confirm('Are you sure you want to delete this skill?')) return;
    try {
      await profileService.deleteSkill(id);
      setSkills(prev => prev.filter(skill => skill.candidate_skill_id !== id));
      toast.success('Skill deleted successfully!');
      invalidateRecommendationsCache(); // Refresh recommendations
      if (editingSkillId === id) {
        setIsAddingSkill(false);
        setEditingSkillId(null);
      }
    } catch (error: any) {
      toast.error('Failed to delete skill.');
    }
  };

  const handleCancelSkill = () => {
    setIsAddingSkill(false);
    setEditingSkillId(null);
    setSkillForm({
      skill_name: '',
    });
  };

  // --- Certifications Handlers ---

  const handleAddCert = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const certData: CertificationCreate = {
        ...certForm,
        credential_id: certForm.credential_id || undefined,
        credential_url: certForm.credential_url || undefined,
        issue_date: certForm.issue_date || undefined,
        expiration_date: certForm.expiration_date || undefined,
      };

      if (editingCertId) {
        const updatedCert = await profileService.updateCertification(editingCertId, certData);
        setCertifications(prev => prev.map(c => c.candidate_certification_id === editingCertId ? (updatedCert as unknown as Certification) : c));
        toast.success('Certification updated successfully!');
      } else {
        const newCert = await profileService.addCertification(certData);
        setCertifications(prev => [...prev, newCert as unknown as Certification]);
        toast.success('Certification added successfully!');
      }

      setCertForm({
        certification_name: '',
        issuing_body: '',
        credential_id: '',
        credential_url: '',
        issue_date: '',
        expiration_date: '',
        does_not_expire: false,
      });
      setIsAddingCert(false);
      setEditingCertId(null);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to save certification.');
    }
  };

  const handleEditCert = (cert: Certification) => {
    setCertForm({
      certification_name: cert.certification_name,
      issuing_body: cert.issuing_body,
      credential_id: cert.credential_id || '',
      credential_url: cert.credential_url || '',
      issue_date: cert.issue_date || '',
      expiration_date: cert.expiration_date || '',
      does_not_expire: cert.does_not_expire,
    });
    setEditingCertId(cert.candidate_certification_id);
    setIsAddingCert(true);
  };

  const handleDeleteCert = async (id: string) => {
    if (!confirm('Are you sure you want to delete this certification?')) return;
    try {
      await profileService.deleteCertification(id);
      setCertifications(prev => prev.filter(cert => cert.candidate_certification_id !== id));
      toast.success('Certification deleted successfully!');
      if (editingCertId === id) {
        setIsAddingCert(false);
        setEditingCertId(null);
      }
    } catch (error: any) {
      toast.error('Failed to delete certification.');
    }
  };

  const handleCancelCert = () => {
    setIsAddingCert(false);
    setEditingCertId(null);
    setCertForm({
      certification_name: '',
      issuing_body: '',
      credential_id: '',
      credential_url: '',
      issue_date: '',
      expiration_date: '',
      does_not_expire: false,
    });
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-[#0F172A] mb-2">
          Skills & Expertise
        </h3>
        <p className="text-[#475569]">
          Manage your professional skills and certifications.
        </p>
      </div>

      <div className="space-y-8">
        {/* Skills Section */}
        <div className="bg-[#F9FAFB] rounded-xl p-6 border border-[#E5E7EB]">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-[#3056F5]" />
              <h4 className="text-lg font-semibold text-[#0F172A]">Skills</h4>
            </div>
            {!isAddingSkill && (
              <Button
                onClick={() => {
                  setEditingSkillId(null);
                  setSkillForm({ skill_name: '' });
                  setIsAddingSkill(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-[#3056F5] hover:bg-[#1E40AF] text-white rounded-xl"
              >
                <Plus className="w-4 h-4" />
                Add Skill
              </Button>
            )}
          </div>

          {/* Add/Edit Skill Form */}
          {isAddingSkill && (
            <form onSubmit={handleAddSkill} className="mb-6 p-4 bg-white rounded-xl border border-[#E5E7EB]">
              <h5 className="text-lg font-semibold text-[#0F172A] mb-4">
                {editingSkillId ? 'Edit Skill' : 'Add New Skill'}
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="skill_name">Skill Name *</Label>
                  <Input
                    id="skill_name"
                    value={skillForm.skill_name}
                    onChange={(e) => setSkillForm(prev => ({ ...prev, skill_name: e.target.value }))}
                    placeholder="e.g., React, Python, Project Management"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <Button type="submit" className="px-6 py-2 bg-[#3056F5] text-white rounded-xl">
                  {editingSkillId ? 'Save Changes' : 'Add Skill'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelSkill}
                  className="px-6 py-2 border-[#D1D5DB] rounded-xl"
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {/* Skills List - Pill Layout */}
          {skills.length === 0 ? (
            <div className="text-center py-8 text-[#6B7280]">
              <Settings className="w-12 h-12 mx-auto mb-4 text-[#9CA3AF]" />
              <p className="text-lg font-medium mb-2">No skills added yet</p>
              <p className="text-sm">Add your first skill to get started!</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              {skills.map((skill) => (
                <div
                  key={skill.candidate_skill_id}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#F3F4F6] text-[#0F172A] rounded-full border border-[#E5E7EB] hover:bg-[#E5E7EB] transition-colors duration-200 group"
                >
                  <span className="text-sm font-medium">{skill.skill_name}</span>
                  <div className="flex items-center gap-1 border-l border-gray-300 pl-2 ml-2">
                    <button
                      onClick={() => handleEditSkill(skill)}
                      className="flex items-center justify-center w-5 h-5 text-[#6B7280] hover:text-[#3056F5] hover:bg-blue-100 rounded-full transition-colors duration-200"
                      title="Edit skill"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleDeleteSkill(skill.candidate_skill_id)}
                      className="flex items-center justify-center w-5 h-5 text-[#6B7280] hover:text-red-600 hover:bg-red-100 rounded-full transition-colors duration-200"
                      title="Delete skill"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Certifications Section */}
        <div className="bg-[#F9FAFB] rounded-xl p-6 border border-[#E5E7EB]">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-[#3056F5]" />
              <h4 className="text-lg font-semibold text-[#0F172A]">Certifications</h4>
            </div>
            {!isAddingCert && (
              <Button
                onClick={() => {
                  setEditingCertId(null);
                  setCertForm({
                    certification_name: '',
                    issuing_body: '',
                    credential_id: '',
                    credential_url: '',
                    issue_date: '',
                    expiration_date: '',
                    does_not_expire: false,
                  });
                  setIsAddingCert(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-[#3056F5] hover:bg-[#1E40AF] text-white rounded-xl"
              >
                <Plus className="w-4 h-4" />
                Add Certification
              </Button>
            )}
          </div>

          {/* Add/Edit Certification Form */}
          {isAddingCert && (
            <form onSubmit={handleAddCert} className="mb-6 p-4 bg-white rounded-xl border border-[#E5E7EB]">
              <h5 className="text-lg font-semibold text-[#0F172A] mb-4">
                {editingCertId ? 'Edit Certification' : 'Add New Certification'}
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cert_name">Certification Name *</Label>
                  <Input
                    id="cert_name"
                    value={certForm.certification_name}
                    onChange={(e) => setCertForm(prev => ({ ...prev, certification_name: e.target.value }))}
                    placeholder="e.g., AWS Certified Solutions Architect"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="issuing_body">Issuing Organization *</Label>
                  <Input
                    id="issuing_body"
                    value={certForm.issuing_body}
                    onChange={(e) => setCertForm(prev => ({ ...prev, issuing_body: e.target.value }))}
                    placeholder="e.g., Amazon Web Services"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="issue_date">Issue Date</Label>
                  <Input
                    id="issue_date"
                    type="date"
                    value={certForm.issue_date}
                    onChange={(e) => setCertForm(prev => ({ ...prev, issue_date: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiration_date">Expiration Date</Label>
                  <Input
                    id="expiration_date"
                    type="date"
                    value={certForm.expiration_date}
                    onChange={(e) => setCertForm(prev => ({ ...prev, expiration_date: e.target.value }))}
                    disabled={certForm.does_not_expire}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="credential_id">Credential ID</Label>
                  <Input
                    id="credential_id"
                    value={certForm.credential_id}
                    onChange={(e) => setCertForm(prev => ({ ...prev, credential_id: e.target.value }))}
                    placeholder="Optional"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="credential_url">Credential URL</Label>
                  <Input
                    id="credential_url"
                    value={certForm.credential_url}
                    onChange={(e) => setCertForm(prev => ({ ...prev, credential_url: e.target.value }))}
                    placeholder="Optional (https://...)"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4 map-2">
                <input
                  type="checkbox"
                  id="does_not_expire"
                  checked={certForm.does_not_expire}
                  onChange={(e) => {
                    const isChecked = e.target.checked;
                    setCertForm(prev => ({
                      ...prev,
                      does_not_expire: isChecked,
                      expiration_date: isChecked ? '' : prev.expiration_date
                    }));
                  }}
                  className="h-4 w-4 text-[#3056F5] border-gray-300 rounded focus:ring-[#3056F5]"
                />
                <Label htmlFor="does_not_expire">This certification does not expire</Label>
              </div>

              <div className="flex gap-3 mt-4">
                <Button type="submit" className="px-6 py-2 bg-[#3056F5] text-white rounded-xl">
                  {editingCertId ? 'Save Changes' : 'Add Certification'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelCert}
                  className="px-6 py-2 border-[#D1D5DB] rounded-xl"
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {/* Certifications List */}
          {certifications.length === 0 ? (
            <div className="text-center py-8 text-[#6B7280]">
              <Award className="w-12 h-12 mx-auto mb-4 text-[#9CA3AF]" />
              <p className="text-lg font-medium mb-2">No certifications added yet</p>
              <p className="text-sm">Add your licenses and certifications here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {certifications.map((cert) => (
                <div
                  key={cert.candidate_certification_id}
                  className="flex items-start justify-between p-4 bg-white border border-[#E5E7EB] rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-[#EFF6FF] text-[#3056F5] rounded-lg">
                      <Award className="w-6 h-6" />
                    </div>
                    <div>
                      <h5 className="text-lg font-semibold text-[#0F172A]">{cert.certification_name}</h5>
                      <p className="text-[#475569]">{cert.issuing_body}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-[#6B7280]">
                        {cert.issue_date && (
                          <span>Issued: {new Date(cert.issue_date).toLocaleDateString()}</span>
                        )}
                        {cert.expiration_date && (
                          <span>Expires: {new Date(cert.expiration_date).toLocaleDateString()}</span>
                        )}
                        {cert.does_not_expire && (
                          <span>No Expiration</span>
                        )}
                      </div>
                      {cert.credential_url && (
                        <a href={cert.credential_url} target="_blank" rel="noopener noreferrer" className="text-sm text-[#3056F5] hover:underline mt-1 block">
                          Show Credential
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEditCert(cert)}
                      className="p-2 text-[#6B7280] hover:text-[#3056F5] hover:bg-blue-50 rounded-lg transition-colors duration-200"
                      title="Edit certification"
                    >
                      <Pencil className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCert(cert.candidate_certification_id)}
                      className="p-2 text-[#6B7280] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
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
  );
}
