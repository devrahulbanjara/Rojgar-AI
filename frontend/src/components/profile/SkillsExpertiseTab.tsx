import React, { useState, useEffect } from 'react';
import { profileService } from '../../services/profileService';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { Settings, Award, Plus, Edit, Trash2, CheckCircle, AlertCircle, X } from 'lucide-react';
import type { ProfileSkill, Certification, ProfileSkillCreateRequest, CertificationCreateRequest } from '../../types/profile';

export function SkillsExpertiseTab() {
  const [skills, setSkills] = useState<ProfileSkill[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [isAddingCertification, setIsAddingCertification] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [skillForm, setSkillForm] = useState({
    skill_name: '',
    proficiency_level: 'Intermediate',
    years_of_experience: '',
  });

  const [certificationForm, setCertificationForm] = useState({
    name: '',
    issuing_body: '',
    credential_id: '',
    credential_url: '',
    issue_date: '',
    expiration_date: '',
    does_not_expire: false,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [skillsData, certificationsData] = await Promise.all([
        profileService.getProfileSkills(),
        profileService.getCertifications()
      ]);
      setSkills(skillsData);
      setCertifications(certificationsData);
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: 'Failed to load skills and certifications. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const skillData: ProfileSkillCreateRequest = {
        skill_name: skillForm.skill_name,
        proficiency_level: skillForm.proficiency_level,
        years_of_experience: skillForm.years_of_experience ? parseInt(skillForm.years_of_experience) : undefined,
      };

      const newSkill = await profileService.createProfileSkill(skillData);
      setSkills(prev => [...prev, newSkill]);
      setSkillForm({
        skill_name: '',
        proficiency_level: 'Intermediate',
        years_of_experience: '',
      });
      setIsAddingSkill(false);
      setMessage({ type: 'success', text: 'Skill added successfully!' });
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.detail || 'Failed to add skill. Please try again.'
      });
    }
  };

  const handleAddCertification = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const certificationData: CertificationCreateRequest = {
        name: certificationForm.name,
        issuing_body: certificationForm.issuing_body,
        credential_id: certificationForm.credential_id || undefined,
        credential_url: certificationForm.credential_url || undefined,
        issue_date: certificationForm.issue_date || undefined,
        expiration_date: certificationForm.expiration_date || undefined,
        does_not_expire: certificationForm.does_not_expire,
      };

      const newCertification = await profileService.createCertification(certificationData);
      setCertifications(prev => [...prev, newCertification]);
      setCertificationForm({
        name: '',
        issuing_body: '',
        credential_id: '',
        credential_url: '',
        issue_date: '',
        expiration_date: '',
        does_not_expire: false,
      });
      setIsAddingCertification(false);
      setMessage({ type: 'success', text: 'Certification added successfully!' });
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.detail || 'Failed to add certification. Please try again.'
      });
    }
  };

  const handleDeleteSkill = async (id: string) => {
    if (!confirm('Are you sure you want to delete this skill?')) return;

    try {
      await profileService.deleteProfileSkill(id);
      setSkills(prev => prev.filter(skill => skill.id !== id));
      setMessage({ type: 'success', text: 'Skill deleted successfully!' });
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.detail || 'Failed to delete skill.'
      });
    }
  };

  const handleDeleteCertification = async (id: string) => {
    if (!confirm('Are you sure you want to delete this certification?')) return;

    try {
      await profileService.deleteCertification(id);
      setCertifications(prev => prev.filter(cert => cert.id !== id));
      setMessage({ type: 'success', text: 'Certification deleted successfully!' });
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.detail || 'Failed to delete certification.'
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
          Skills & Expertise
        </h3>
        <p className="text-[#475569]">
          Manage your professional skills and certifications.
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
        {/* Skills Section */}
        <div className="bg-[#F9FAFB] rounded-xl p-6 border border-[#E5E7EB]">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-[#3056F5]" />
              <h4 className="text-lg font-semibold text-[#0F172A]">Skills</h4>
            </div>
            <Button
              onClick={() => setIsAddingSkill(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#3056F5] hover:bg-[#1E40AF] text-white rounded-xl"
            >
              <Plus className="w-4 h-4" />
              Add Skill
            </Button>
          </div>

          {/* Add Skill Form */}
          {isAddingSkill && (
            <form onSubmit={handleAddSkill} className="mb-6 p-4 bg-white rounded-xl border border-[#E5E7EB]">
              <h5 className="text-lg font-semibold text-[#0F172A] mb-4">Add New Skill</h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <div className="space-y-2">
                  <Label htmlFor="proficiency_level">Proficiency Level</Label>
                  <select
                    id="proficiency_level"
                    value={skillForm.proficiency_level}
                    onChange={(e) => setSkillForm(prev => ({ ...prev, proficiency_level: e.target.value }))}
                    className="w-full h-12 px-4 border border-[#D1D5DB] focus:border-[#3056F5] focus:ring-2 focus:ring-[#3056F5]/20 rounded-xl transition-all duration-200"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Expert">Expert</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="years_of_experience">Years of Experience</Label>
                  <Input
                    id="years_of_experience"
                    type="number"
                    value={skillForm.years_of_experience}
                    onChange={(e) => setSkillForm(prev => ({ ...prev, years_of_experience: e.target.value }))}
                    placeholder="e.g., 3"
                    min="0"
                    max="50"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <Button type="submit" className="px-6 py-2 bg-[#3056F5] text-white rounded-xl">
                  Add Skill
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddingSkill(false)}
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
                  key={skill.id}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#F3F4F6] text-[#0F172A] rounded-full border border-[#E5E7EB] hover:bg-[#E5E7EB] transition-colors duration-200 group"
                >
                  <span className="text-sm font-medium">{skill.skill_name}</span>
                  <span className="text-xs text-[#6B7280] bg-white px-2 py-1 rounded-full">
                    {skill.proficiency_level}
                  </span>
                  {skill.years_of_experience && (
                    <span className="text-xs text-[#6B7280]">
                      {skill.years_of_experience}y
                    </span>
                  )}
                  <button
                    onClick={() => handleDeleteSkill(skill.id)}
                    className="flex items-center justify-center w-5 h-5 text-[#6B7280] hover:text-red-600 hover:bg-red-100 rounded-full transition-colors duration-200 opacity-0 group-hover:opacity-100"
                    title="Delete skill"
                  >
                    <X className="w-3 h-3" />
                  </button>
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
            <Button
              onClick={() => setIsAddingCertification(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#3056F5] hover:bg-[#1E40AF] text-white rounded-xl"
            >
              <Plus className="w-4 h-4" />
              Add Certification
            </Button>
          </div>

          {/* Add Certification Form */}
          {isAddingCertification && (
            <form onSubmit={handleAddCertification} className="mb-6 p-4 bg-white rounded-xl border border-[#E5E7EB]">
              <h5 className="text-lg font-semibold text-[#0F172A] mb-4">Add New Certification</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Certification Name *</Label>
                  <Input
                    id="name"
                    value={certificationForm.name}
                    onChange={(e) => setCertificationForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., AWS Certified Solutions Architect"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="issuing_body">Issuing Body *</Label>
                  <Input
                    id="issuing_body"
                    value={certificationForm.issuing_body}
                    onChange={(e) => setCertificationForm(prev => ({ ...prev, issuing_body: e.target.value }))}
                    placeholder="e.g., Amazon Web Services"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="credential_id">Credential ID</Label>
                  <Input
                    id="credential_id"
                    value={certificationForm.credential_id}
                    onChange={(e) => setCertificationForm(prev => ({ ...prev, credential_id: e.target.value }))}
                    placeholder="e.g., AWS-123456"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="credential_url">Credential URL</Label>
                  <Input
                    id="credential_url"
                    type="url"
                    value={certificationForm.credential_url}
                    onChange={(e) => setCertificationForm(prev => ({ ...prev, credential_url: e.target.value }))}
                    placeholder="https://www.credly.com/badges/..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="issue_date">Issue Date</Label>
                  <Input
                    id="issue_date"
                    type="date"
                    value={certificationForm.issue_date}
                    onChange={(e) => setCertificationForm(prev => ({ ...prev, issue_date: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiration_date">Expiration Date</Label>
                  <Input
                    id="expiration_date"
                    type="date"
                    value={certificationForm.expiration_date}
                    onChange={(e) => setCertificationForm(prev => ({ ...prev, expiration_date: e.target.value }))}
                    disabled={certificationForm.does_not_expire}
                  />
                </div>
                <div className="space-y-2 flex items-center">
                  <input
                    type="checkbox"
                    id="does_not_expire"
                    checked={certificationForm.does_not_expire}
                    onChange={(e) => setCertificationForm(prev => ({ ...prev, does_not_expire: e.target.checked }))}
                    className="mr-2"
                  />
                  <Label htmlFor="does_not_expire">Does not expire</Label>
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <Button type="submit" className="px-6 py-2 bg-[#3056F5] text-white rounded-xl">
                  Add Certification
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddingCertification(false)}
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
              <p className="text-sm">Add your first certification to get started!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {certifications.map((certification) => (
                <div key={certification.id} className="bg-white rounded-xl border border-[#E5E7EB] p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Award className="w-4 h-4 text-[#6B7280]" />
                        <h5 className="font-semibold text-[#0F172A]">{certification.name}</h5>
                      </div>
                      <p className="text-[#475569] font-medium">{certification.issuing_body}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-[#6B7280]">
                        {certification.credential_id && (
                          <span>ID: {certification.credential_id}</span>
                        )}
                        {certification.issue_date && (
                          <span>Issued: {formatDate(certification.issue_date)}</span>
                        )}
                        {certification.expiration_date && !certification.does_not_expire && (
                          <span>Expires: {formatDate(certification.expiration_date)}</span>
                        )}
                        {certification.does_not_expire && (
                          <span className="text-green-600 font-medium">No expiration</span>
                        )}
                      </div>
                      {certification.credential_url && (
                        <a
                          href={certification.credential_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-[#3056F5] hover:underline mt-1 inline-block"
                        >
                          View Credential
                        </a>
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
                        onClick={() => handleDeleteCertification(certification.id)}
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
