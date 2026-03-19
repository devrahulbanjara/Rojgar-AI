'use client'

import { useEffect, useRef, useState } from 'react'
import { use } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import type { Resume } from '@/lib/types/resume'
import type { RootState } from '@/store'
import { useGetResumeByIdQuery, useUpdateResumeMutation } from '@/store/services/resumeApi'
import { apiResumeToUi, updateResume, upsertResume } from '@/store/slices/resumeSlice'
import { ArrowLeft, Download } from 'lucide-react'

import Loader from '@/components/common/Loader'

import ResumeEditor from '../_components/ResumeEditor'
import ResumeTemplate from '../_components/ResumeTemplate'
import { resumePrintStyles } from '../_components/resumePrintStyles'

// ── Helpers ────────────────────────────────────────────────────────────────

/** Convert the UI Resume shape back to the PUT request body */
function uiResumeToApiUpdate(r: Resume) {
  return {
    resume_name: r.name,
    headline: r.headline || null,
    summary: r.summary || null,
    phone: r.phone || null,
    location: r.location || null,
    linkedin_url: r.linkedin_url || null,
    github_url: r.github_url || null,
    portfolio_url: r.website || null,
    experiences: r.experience.map((exp) => ({
      company_name: exp.company,
      title: exp.title,
      start_date: exp.startDate ? `${exp.startDate}-01` : null,
      end_date: exp.current ? null : exp.endDate ? `${exp.endDate}-01` : null,
      description: exp.description ? exp.description.split('\n').filter(Boolean) : [],
    })),
    educations: r.education.map((edu) => ({
      institution: edu.institution,
      degree: edu.degree || null,
      field_of_study: null,
      start_date: edu.startDate ? `${edu.startDate}-01` : null,
      end_date: edu.endDate ? `${edu.endDate}-01` : null,
    })),
    skills: r.skills.map((s) => ({ skill_name: s })),
  }
}

// ── Resume Viewer (full-screen) ────────────────────────────────────────────

function ResumeViewer({ resume, onEdit }: { resume: Resume; onEdit: () => void }) {
  const printRef = useRef<HTMLDivElement>(null)
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false)

  function handlePrintFallback() {
    const content = printRef.current
    if (!content) return
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`
      <html>
        <head>
          <title>${resume.fullName} - Resume</title>
          <style>${resumePrintStyles}</style>
        </head>
        <body>${content.innerHTML}</body>
      </html>
    `)
    win.document.close()
    win.focus()
    win.print()
    win.close()
  }

  async function handleDownloadPdf() {
    const content = printRef.current
    if (!content || isDownloadingPdf) return

    setIsDownloadingPdf(true)

    try {
      const html2pdf = (await import('html2pdf.js')).default
      const baseName = resume.fullName || resume.name || 'resume'
      const fileName = `${
        baseName
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .trim()
          .replace(/\s+/g, '-') || 'resume'
      }.pdf`

      await html2pdf()
        .set({
          filename: fileName,
          margin: [0.18, 0.18, 0.18, 0.18],
          enableLinks: true,
          html2canvas: {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
          },
          jsPDF: {
            unit: 'in',
            format: 'letter',
            orientation: 'portrait',
          },
        })
        .from(content)
        .save()
    } catch (error) {
      console.error('PDF download failed, falling back to print dialog.', error)
      handlePrintFallback()
    } finally {
      setIsDownloadingPdf(false)
    }
  }

  return (
    <div className="rv-overlay">
      <div className="rv-overlay__bar">
        <div className="rv-overlay__bar-left">
          <Link href="/candidate/resume" className="jd-back">
            <ArrowLeft size={16} aria-hidden="true" />
            Back to Resumes
          </Link>
        </div>
        <span className="rv-overlay__bar-title">{resume.name}</span>
        <div className="rv-overlay__bar-right rv-overlay__actions">
          <button
            className="btn btn--ghost btn--sm"
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
          >
            <Download size={14} />
            {isDownloadingPdf ? 'Downloading...' : 'Download PDF'}
          </button>
          <button className="btn btn--primary btn--sm" onClick={onEdit}>
            Edit
          </button>
        </div>
      </div>
      <div className="rv-overlay__scroll" data-lenis-prevent>
        <div className="rv-page-shadow">
          <div ref={printRef}>
            <ResumeTemplate resume={resume} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function ResumeDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ mode?: string }>
}) {
  const { id } = use(params)
  const { mode } = use(searchParams)
  const isEditMode = mode === 'edit'

  const router = useRouter()
  const dispatch = useDispatch()
  const user = useSelector((state: RootState) => state.auth.user)

  // Auto-fetch the full resume on mount
  const { data: resumeResponse, isLoading, isError } = useGetResumeByIdQuery(id)

  // Sync fetched data into Redux
  useEffect(() => {
    if (resumeResponse?.success && resumeResponse.data) {
      const ui = apiResumeToUi(resumeResponse.data, user?.full_name ?? '', user?.email ?? '')
      dispatch(upsertResume(ui))
    }
  }, [resumeResponse, dispatch, user])

  // Also read from Redux so edits stay live
  const resume = useSelector((state: RootState) => state.resumes.resumes.find((r) => r.id === id))

  const [updateResumeMutation, { isLoading: isSaving }] = useUpdateResumeMutation()
  const [saveError, setSaveError] = useState<string | null>(null)

  async function handleSave(updated: Resume) {
    setSaveError(null)
    try {
      const result = await updateResumeMutation({
        id,
        body: uiResumeToApiUpdate(updated),
      }).unwrap()
      if (result.success && result.data) {
        const ui = apiResumeToUi(result.data, user?.full_name ?? '', user?.email ?? '')
        dispatch(upsertResume(ui))
        // Go back to view mode after saving
        router.replace(`/candidate/resume/${id}`)
      } else {
        setSaveError('Failed to save. Please try again.')
      }
    } catch {
      setSaveError('An error occurred while saving.')
    }
  }

  function handleResumeChange(updated: Resume) {
    dispatch(updateResume(updated))
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="dash-content container">
        <div className="resume-empty-state">
          <Loader size="lg" />
        </div>
      </div>
    )
  }

  if (!resume) {
    return (
      <div className="dash-content container">
        <div className="resume-empty-state">
          <p>Resume not found.</p>
          <button
            className="btn btn--ghost btn--sm"
            onClick={() => router.push('/candidate/resume')}
          >
            Back to Resumes
          </button>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="dash-content container">
        <div className="resume-empty-state">
          <p>Failed to load resume.</p>
          <button
            className="btn btn--ghost btn--sm"
            onClick={() => router.push('/candidate/resume')}
          >
            Back to Resumes
          </button>
        </div>
      </div>
    )
  }

  if (isEditMode) {
    return (
      <div className="dash-content container">
        {saveError && <p className="resume-field__error">{saveError}</p>}
        <ResumeEditor
          resume={resume}
          onClose={() => router.push('/candidate/resume')}
          onPreview={() => router.replace(`/candidate/resume/${id}`)}
          onSave={handleSave}
          onChange={handleResumeChange}
          isSaving={isSaving}
        />
      </div>
    )
  }

  return (
    <ResumeViewer resume={resume} onEdit={() => router.push(`/candidate/resume/${id}?mode=edit`)} />
  )
}
