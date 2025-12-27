'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { resumeService } from '@/services/resumeService';
import { profileService } from '@/services/profileService';
import { ResumeListResponse, ResumeCreate } from '@/types/resume';
import { Loader2, Plus, FileText, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { AppShell } from '@/components/layout/AppShell';
import { PageTransition, AnimatedContainer, PageHeader } from '@/components/common';
import ResumeDetailSheet from '@/components/resume/ResumeDetailSheet';

// --- Enhanced Modal Component ---

interface CreateResumeModalProps {
  onClose: () => void;
  onCreated: (resume: ResumeListResponse) => void;
}

function CreateResumeModal({ onClose, onCreated }: CreateResumeModalProps) {
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Simple form state
  const [formData, setFormData] = useState<ResumeCreate>({
    resume_name: '',
    target_job_title: '',
    custom_summary: '',
    work_experiences: [],
    educations: [],
    skills: [],
    certifications: [],
    social_links: []
  });

  // Fetch Profile on Mount to pre-fill Name/Title/Summary
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profile = await profileService.getProfile();
        setFormData(prev => ({
          ...prev,
          resume_name: `${profile.full_name}'s Resume`,
          target_job_title: profile.professional_headline || '',
          custom_summary: profile.professional_summary || '',
          // We won't pre-fill the arrays here to keep creation fast.
          // User can add them in the editor.
          // OR: If requirement is to copy profile data, we should keep mapping.
          // Requirement: "from there to upto he complete creating, like adding... adding..."
          // Unifying experience means we usually copy everything or nothing.
          // Let's copy everything to be helpful, but only show Name/Title fields in this modal.

          work_experiences: profile.work_experiences.map(exp => ({
            job_title: exp.job_title,
            company: exp.company,
            location: exp.location || '',
            start_date: exp.start_date,
            end_date: exp.end_date,
            is_current: exp.is_current,
            description: exp.description
          })),
          educations: profile.educations.map(edu => ({
            college_name: edu.college_name,
            degree: edu.degree,
            location: edu.location,
            start_date: edu.start_date,
            end_date: edu.end_date,
            is_current: edu.is_current
          })),
          skills: profile.skills.map(s => ({ skill_name: s.skill_name })),
          certifications: profile.certifications.map(c => ({
            certification_name: c.certification_name,
            issuing_body: c.issuing_body,
            credential_url: c.credential_url,
            issue_date: c.issue_date,
            expiration_date: c.expiration_date,
            does_not_expire: c.does_not_expire
          })),
          social_links: profile.social_links.map(l => ({ type: l.type, url: l.url }))
        }));
      } catch {
        toast.error('Could not load profile data');
      } finally {
        setLoadingProfile(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.resume_name) {
      toast.error('Resume Name is required');
      return;
    }
    setLoading(true);
    try {
      const newResume = await resumeService.createResumeFork(formData);
      const listResume: ResumeListResponse = {
        resume_id: newResume.resume_id,
        resume_name: newResume.resume_name,
        target_job_title: newResume.target_job_title,
        updated_at: newResume.updated_at
      };
      toast.success('Resume created successfully!');
      onCreated(listResume);
    } catch (error) {
      console.error('Failed to create resume', error);
      toast.error('Failed to create resume');
    } finally {
      setLoading(false);
    }
  };

  if (loadingProfile) {
    const loadingContent = (
      <div className="fixed inset-0 z-[100] flex items-center justify-center">
        <div className="fixed inset-0 bg-black/5 backdrop-blur-[3px]" onClick={onClose} />
        <div className="relative bg-white p-6 rounded-2xl shadow-2xl border border-gray-200 flex items-center gap-3 animate-in fade-in zoom-in-95 duration-200">
          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
          <p className="text-gray-600 font-medium">Initializing...</p>
        </div>
      </div>
    );
    return typeof document !== 'undefined' ? createPortal(loadingContent, document.body) : loadingContent;
  }

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Very subtle backdrop blur */}
      <div
        className="fixed inset-0 bg-black/5 backdrop-blur-[3px] animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 border-b flex justify-between items-center bg-gradient-to-b from-gray-50 to-white">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Create New Resume</h2>
            <p className="text-sm text-gray-500 mt-1">Start by naming your resume</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Resume Name <span className="text-red-500">*</span></label>
            <input
              autoFocus
              type="text"
              value={formData.resume_name}
              onChange={(e) => setFormData({ ...formData, resume_name: e.target.value })}
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="e.g. Senior Backend Engineer"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Target Job Title</label>
            <input
              type="text"
              value={formData.target_job_title || ''}
              onChange={(e) => setFormData({ ...formData, target_job_title: e.target.value })}
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="e.g. Product Manager"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 font-medium shadow-lg shadow-blue-500/25 hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Create & Edit Resume
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}

export default function ResumeListPage() {
  const [resumes, setResumes] = useState<ResumeListResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);

  // Load Resumes
  const loadResumes = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await resumeService.getAllResumes();
      setResumes(data);
    } catch (err) {
      // Ignore 404 or just log it
      console.warn("Failed to load resumes", err);
      // Don't set user-facing error for empty list
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResumes();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this resume?')) return;
    try {
      await resumeService.deleteResume(id);
      toast.success('Resume deleted successfully');
      loadResumes(); // Refresh
    } catch {
      toast.error('Failed to delete resume');
    }
  };

  return (
    <AppShell>
      <PageTransition className="min-h-screen" style={{ background: '#F9FAFB' }}>
        <div className="space-y-6">
          <AnimatedContainer direction="up" delay={0.1}>
            <div className="mb-8">
              <PageHeader
                title="Resume Builder"
                subtitle="Create and manage tailored resumes from your profile data"
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 flex items-center gap-2 border border-red-100">
                <span className="font-medium">!</span> {error}
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border p-6 min-h-[400px]">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-semibold flex items-center gap-2 text-gray-800">
                  <FileText className="w-5 h-5 text-blue-600" /> Your Resumes
                </h2>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 transition shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Create New Resume
                </button>
              </div>

              {loading ? (
                <div className="flex justify-center items-center h-48">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : resumes.length === 0 ? (
                <div className="text-center py-16">
                  <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No resumes created yet</h3>
                  <p className="text-gray-500 mb-6">Create your first resume to get started!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {resumes.map((resume) => (
                    <div
                      key={resume.resume_id}
                      onClick={() => setSelectedResumeId(resume.resume_id)}
                      className="group bg-white border rounded-xl p-5 hover:shadow-lg hover:border-blue-200 transition cursor-pointer relative"
                    >
                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition">
                        <button
                          onClick={(e) => handleDelete(resume.resume_id, e)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                          <FileText className="w-6 h-6" />
                        </div>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1 truncate pr-8">{resume.resume_name}</h3>
                      <p className="text-sm text-gray-500 mb-4">{resume.target_job_title || 'No target title'}</p>
                      <div className="text-xs text-gray-400 pt-4 border-t">
                        Updated {new Date(resume.updated_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </AnimatedContainer>

          {isModalOpen && (
            <CreateResumeModal
              onClose={() => setIsModalOpen(false)}
              onCreated={(newResume) => {
                setResumes([...(resumes || []), newResume]);
                setIsModalOpen(false);
                setSelectedResumeId(newResume.resume_id); // Open editor immediately
              }}
            />
          )}


          {selectedResumeId && (
            <ResumeDetailSheet
              resumeId={selectedResumeId}
              isOpen={!!selectedResumeId}
              onClose={() => setSelectedResumeId(null)}
              onUpdate={loadResumes}
            />
          )}
        </div>
      </PageTransition>
    </AppShell>
  );
}
