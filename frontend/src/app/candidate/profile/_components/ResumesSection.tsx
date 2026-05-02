'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { notify } from '@/lib/notify'
import { useRouter } from 'next/navigation'

import type { RootState } from '@/store'
import {
  useCreateResumeMutation,
  useDeleteResumeMutation,
  useGetMyResumesQuery,
} from '@/store/services/resumeApi'
import { apiResumeToUi, removeResume, setResumes, upsertResume } from '@/store/slices/resumeSlice'
import { ChevronRight, FileText, Plus, X } from 'lucide-react'

import CreateResumeModal from '../../resume/_components/CreateResumeModal'
import styles from './resumesSection.module.scss'

function DeleteResumeModal({
  resumeName,
  isDeleting,
  onConfirm,
  onCancel,
}: {
  resumeName: string
  isDeleting: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal__header">
          <h3 className="modal__title">Delete Resume</h3>
          <button
            type="button"
            className="btn btn--icon btn--sm"
            onClick={onCancel}
            aria-label="Close"
            disabled={isDeleting}
          >
            <X size={18} />
          </button>
        </div>
        <div className="modal__body">
          <p>
            Are you sure you want to delete <strong>{resumeName}</strong>? This action cannot be
            undone.
          </p>
        </div>
        <div className="modal__footer">
          <button type="button" className="btn btn--ghost" onClick={onCancel} disabled={isDeleting}>
            Cancel
          </button>
          <button
            type="button"
            className={`btn btn--danger${isDeleting ? ' btn--loading' : ''}`}
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ResumesSection() {
  const router = useRouter()
  const dispatch = useDispatch()
  const resumes = useSelector((state: RootState) => state.resumes.resumes)
  const user = useSelector((state: RootState) => state.auth.user)

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const {
    data: resumesResponse,
    isLoading: isLoadingResumes,
    isError: isResumesError,
  } = useGetMyResumesQuery()
  const [createResume, { isLoading: isCreating }] = useCreateResumeMutation()
  const [deleteResumeMutation] = useDeleteResumeMutation()

  useEffect(() => {
    if (resumesResponse?.data) {
      const uiResumes = resumesResponse.data.map((r) =>
        apiResumeToUi(r, user?.full_name ?? '', user?.email ?? ''),
      )
      dispatch(setResumes(uiResumes))
    }
  }, [resumesResponse, dispatch, user])

  const confirmResume = useMemo(
    () => resumes.find((r) => r.id === confirmDeleteId),
    [resumes, confirmDeleteId],
  )

  async function handleCreateConfirm(name: string) {
    setCreateError(null)
    try {
      const result = await createResume({ resume_name: name }).unwrap()
      if (result.success && result.data) {
        const uiResume = apiResumeToUi(result.data, user?.full_name ?? '', user?.email ?? '')
        dispatch(upsertResume(uiResume))
        setShowCreateModal(false)
        router.push(`/candidate/resume/${uiResume.id}?mode=edit`)
      } else {
        setCreateError(result.message ?? 'Failed to create resume.')
      }
    } catch {
      setCreateError('An error occurred. Please try again.')
    }
  }

  const handleDeleteConfirm = useCallback(async () => {
    if (!confirmDeleteId) return
    setDeletingId(confirmDeleteId)
    try {
      await deleteResumeMutation(confirmDeleteId).unwrap()
      dispatch(removeResume(confirmDeleteId))
      setConfirmDeleteId(null)
    } catch {
      notify.error('Failed to delete resume. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }, [confirmDeleteId, deleteResumeMutation, dispatch])

  const openResume = useCallback(
    (resumeId: string) => {
      router.push(`/candidate/resume/${resumeId}`)
    },
    [router],
  )

  return (
    <>
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

      {confirmDeleteId && confirmResume && (
        <DeleteResumeModal
          resumeName={confirmResume.name}
          isDeleting={deletingId === confirmDeleteId}
          onConfirm={() => void handleDeleteConfirm()}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}

      <div className={styles.section}>
        <div className={styles.header}>
          <div>
            <h3 className={styles.title}>My Resumes</h3>
            <p className={styles.subtitle}>
              Build tailored resumes for different job applications.
            </p>
          </div>
          <button className="btn btn--primary btn--sm" onClick={() => setShowCreateModal(true)}>
            <Plus size={14} />
            New Resume
          </button>
        </div>

        {isLoadingResumes ? (
          <div className={styles.skeleton}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} />
            ))}
          </div>
        ) : isResumesError ? (
          <div className={styles.empty}>
            <FileText size={24} aria-hidden="true" />
            <p>Failed to load resumes.</p>
          </div>
        ) : resumes.length === 0 ? (
          <div className={styles.empty}>
            <FileText size={24} aria-hidden="true" />
            <p>No resumes yet. Create one to get started.</p>
            <button className="btn btn--secondary btn--sm" onClick={() => setShowCreateModal(true)}>
              Create Resume
            </button>
          </div>
        ) : (
          <div className={styles.grid}>
            {resumes.map((resume) => (
              <article
                key={resume.id}
                className={styles.card}
                onClick={() => openResume(resume.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    openResume(resume.id)
                  }
                }}
                aria-label={`Open ${resume.name}`}
              >
                <div className={styles.identity}>
                  <p className={styles.name}>{resume.name}</p>
                  <p className={styles.meta}>Updated {resume.updatedAt}</p>
                </div>
                <div className={styles.actions}>
                  <button
                    type="button"
                    className={styles.deleteBtn}
                    onClick={(e) => {
                      e.stopPropagation()
                      setConfirmDeleteId(resume.id)
                    }}
                    aria-label={`Delete ${resume.name}`}
                  >
                    <X size={14} />
                  </button>
                  <span className={styles.chevron} aria-hidden="true">
                    <ChevronRight size={16} />
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
