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
import { Ellipsis, FileText, Pencil, Plus, Trash2 } from 'lucide-react'

import CreateResumeModal from './_components/CreateResumeModal'
import { ResumeTableSkeleton } from './_components/ResumeSkeletons'

// ── Resume list page ───────────────────────────────────────────────────────
// Clicking View or Edit routes to /candidate/resume/[id] (view or edit mode).

export default function ResumePage() {
  const router = useRouter()
  const dispatch = useDispatch()
  const resumes = useSelector((state: RootState) => state.resumes.resumes)
  const user = useSelector((state: RootState) => state.auth.user)

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

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

  useEffect(() => {
    if (!openMenuId) return

    function handlePointerDown(event: MouseEvent) {
      if (!(event.target instanceof Element)) return
      if (!event.target.closest('[data-resume-row-actions]')) {
        setOpenMenuId(null)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpenMenuId(null)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [openMenuId])

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
        router.push(`/candidate/resume/${uiResume.id}?mode=edit`)
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
    <div className="dash-content container container--app-shell">
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
        <ResumeTableSkeleton rows={6} />
      ) : resumes.length === 0 ? (
        <div className="resume-empty-state">
          <FileText size={48} style={{ opacity: 0.4 }} />
          <p>No resumes yet. Create your first one.</p>
          <button className="btn btn--primary" onClick={() => setShowCreateModal(true)}>
            Create Resume
          </button>
        </div>
      ) : (
        <div className="dash-card resume-table-card">
          <div className="table-scroll">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Resume Title</th>
                  <th>Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {resumes.map((resume) => (
                  <tr
                    key={resume.id}
                    className="resume-row resume-row--clickable"
                    role="link"
                    tabIndex={0}
                    onClick={() => router.push(`/candidate/resume/${resume.id}`)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        router.push(`/candidate/resume/${resume.id}`)
                      }
                    }}
                  >
                    <td className="resume-row__title">{resume.name}</td>
                    <td className="cell-muted">Updated {resume.updatedAt}</td>
                    <td className="resume-row__actions-cell">
                      <div
                        className={`resume-row-actions${openMenuId === resume.id ? ' resume-row-actions--open' : ''}`}
                        data-resume-row-actions
                        onClick={(event) => event.stopPropagation()}
                      >
                        <button
                          type="button"
                          className="resume-row-actions__trigger"
                          aria-label={`Open actions for ${resume.name}`}
                          aria-haspopup="menu"
                          aria-expanded={openMenuId === resume.id}
                          onClick={(event) => {
                            event.stopPropagation()
                            setOpenMenuId((current) => (current === resume.id ? null : resume.id))
                          }}
                        >
                          <Ellipsis size={16} aria-hidden="true" />
                        </button>

                        {openMenuId === resume.id ? (
                          <div className="resume-row-actions__menu" role="menu">
                            <button
                              type="button"
                              className="resume-row-actions__item"
                              onClick={() => {
                                setOpenMenuId(null)
                                router.push(`/candidate/resume/${resume.id}?mode=edit`)
                              }}
                            >
                              <Pencil size={15} aria-hidden="true" />
                              Edit
                            </button>
                            <button
                              type="button"
                              className="resume-row-actions__item resume-row-actions__item--danger"
                              onClick={() => {
                                setOpenMenuId(null)
                                void handleDelete(resume.id)
                              }}
                              disabled={deletingId === resume.id}
                            >
                              <Trash2 size={15} aria-hidden="true" />
                              {deletingId === resume.id ? 'Deleting…' : 'Delete'}
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
