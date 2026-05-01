'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-toastify'

import { useRouter } from 'next/navigation'

import type { RootState } from '@/store'
import {
  useCreateResumeMutation,
  useDeleteResumeMutation,
  useGetMyResumesQuery,
} from '@/store/services/resumeApi'
import { apiResumeToUi, removeResume, setResumes, upsertResume } from '@/store/slices/resumeSlice'
import { ChevronRight, FileText, Plus, X } from 'lucide-react'

import ButtonSpinner from '@/components/common/ButtonSpinner'
import { SearchInput, Toolbar, ToolbarCount } from '@/components/common/Toolbar'

import CreateResumeModal from './_components/CreateResumeModal'
import { ResumeGridSkeleton } from './_components/ResumeSkeletons'
import styles from './page.module.scss'

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
            className="btn btn--danger"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? <ButtonSpinner label="Deleting…" /> : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ResumePage() {
  const router = useRouter()
  const dispatch = useDispatch()
  const resumes = useSelector((state: RootState) => state.resumes.resumes)
  const user = useSelector((state: RootState) => state.auth.user)

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

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

  const filteredResumes = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()
    if (!normalizedSearch) return resumes
    return resumes.filter(
      (resume) =>
        resume.name.toLowerCase().includes(normalizedSearch) ||
        resume.headline?.toLowerCase().includes(normalizedSearch),
    )
  }, [resumes, searchTerm])

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
      toast.error('Failed to delete resume. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }, [confirmDeleteId, deleteResumeMutation, dispatch])

  const confirmResume = resumes.find((r) => r.id === confirmDeleteId)

  const openResume = useCallback(
    (resumeId: string) => {
      router.push(`/candidate/resume/${resumeId}`)
    },
    [router],
  )

  return (
    <div className={`dash-content container container--app-shell ${styles.page}`}>
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

      <Toolbar>
        <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Search resumes" />
        <ToolbarCount>
          {filteredResumes.length} resume{filteredResumes.length === 1 ? '' : 's'} found
        </ToolbarCount>
      </Toolbar>

      {isLoadingResumes ? (
        <ResumeGridSkeleton rows={6} />
      ) : isResumesError ? (
        <div className={styles.empty}>
          <FileText size={28} aria-hidden="true" />
          <p>Failed to load resumes.</p>
        </div>
      ) : filteredResumes.length === 0 ? (
        <div className={styles.empty}>
          <FileText size={28} aria-hidden="true" />
          <p>No resumes match these filters.</p>
          <button className="btn btn--secondary btn--sm" onClick={() => setShowCreateModal(true)}>
            Create Resume
          </button>
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredResumes.map((resume) => {
            return (
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
                <span className={styles.chevron} aria-hidden="true">
                  <ChevronRight size={18} />
                </span>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
