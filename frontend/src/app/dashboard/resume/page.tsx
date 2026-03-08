'use client'

import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { useRouter } from 'next/navigation'

import type { RootState } from '@/store'
import {
  useCreateResumeMutation,
  useDeleteResumeMutation,
  useGetMyResumesQuery,
} from '@/store/services/resumeApi'
import { apiResumeToUi, removeResume, setResumes, upsertResume } from '@/store/slices/resumeSlice'
import { FileText, Plus } from 'lucide-react'

import CreateResumeModal from './_components/CreateResumeModal'
import ResumeCard from './_components/ResumeCard'
import { ResumeGridSkeleton } from './_components/ResumeSkeletons'

// ── Resume list page ───────────────────────────────────────────────────────
// Clicking View or Edit routes to /dashboard/resume/[id] (view or edit mode).

export default function ResumePage() {
  const router = useRouter()
  const dispatch = useDispatch()
  const resumes = useSelector((state: RootState) => state.resumes.resumes)
  const user = useSelector((state: RootState) => state.auth.user)

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // ── RTK Query hooks ────────────────────────────────────────────────────────
  const { data: resumesResponse, isLoading: isLoadingResumes } = useGetMyResumesQuery()
  const [createResume, { isLoading: isCreating }] = useCreateResumeMutation()
  const [deleteResumeMutation] = useDeleteResumeMutation()

  // Sync API response → Redux
  useEffect(() => {
    if (resumesResponse?.data) {
      const uiResumes = resumesResponse.data.map((r) =>
        apiResumeToUi(r, user?.full_name ?? '', user?.email ?? ''),
      )
      dispatch(setResumes(uiResumes))
    }
  }, [resumesResponse, dispatch, user])

  // ── Handlers ───────────────────────────────────────────────────────────────

  async function handleCreateConfirm(name: string) {
    setCreateError(null)
    try {
      const result = await createResume({ resume_name: name }).unwrap()
      if (result.success && result.data) {
        const uiResume = apiResumeToUi(result.data, user?.full_name ?? '', user?.email ?? '')
        dispatch(upsertResume(uiResume))
        setShowCreateModal(false)
        // Open in edit mode immediately
        router.push(`/dashboard/resume/${uiResume.id}?mode=edit`)
      } else {
        setCreateError(result.message ?? 'Failed to create resume.')
      }
    } catch {
      setCreateError('An error occurred. Please try again.')
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      await deleteResumeMutation(id).unwrap()
      dispatch(removeResume(id))
    } catch {
      // silently fail — could add toast here
    } finally {
      setDeletingId(null)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="dash-content container">
      {/* Create Modal */}
      {showCreateModal && (
        <CreateResumeModal
          onConfirm={handleCreateConfirm}
          onCancel={() => {
            setShowCreateModal(false)
            setCreateError(null)
          }}
          isLoading={isCreating}
          error={createError}
        />
      )}

      {/* Page Header */}
      <div className="dash-page-header">
        <div className="dash-page-header__left">
          <h2 className="dash-page-header__title">My Resumes</h2>
          <p className="dash-page-header__subtitle">
            Build tailored resumes for different job applications.
          </p>
        </div>
        <div className="dash-page-header__actions">
          <button className="btn btn--primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={14} />
            New Resume
          </button>
        </div>
      </div>

      {/* API-backed content */}
      {isLoadingResumes ? (
        <ResumeGridSkeleton count={5} />
      ) : resumes.length === 0 ? (
        <div className="resume-empty-state">
          <FileText size={48} style={{ opacity: 0.4 }} />
          <p>No resumes yet. Create your first one.</p>
          <button className="btn btn--primary" onClick={() => setShowCreateModal(true)}>
            Create Resume
          </button>
        </div>
      ) : (
        <div className="resume-grid content-stagger">
          {resumes.map((r, index) => (
            <div
              key={r.id}
              className="content-stagger-item"
              style={{ '--stagger-index': index } as React.CSSProperties}
            >
              <ResumeCard
                resume={r}
                onView={() => router.push(`/dashboard/resume/${r.id}`)}
                onEdit={() => router.push(`/dashboard/resume/${r.id}?mode=edit`)}
                onDelete={() => handleDelete(r.id)}
                isDeleting={deletingId === r.id}
                isViewing={false}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
