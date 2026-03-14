'use client'

import { useEffect, useRef, useState } from 'react'
import { use } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { useRouter } from 'next/navigation'

import type { Resume } from '@/lib/types/resume'
import type { RootState } from '@/store'
import { useGetResumeByIdQuery, useUpdateResumeMutation } from '@/store/services/resumeApi'
import { apiResumeToUi, updateResume, upsertResume } from '@/store/slices/resumeSlice'
import { ArrowLeft, Printer } from 'lucide-react'

import Loader from '@/components/common/Loader'

import ResumeEditor from '../_components/ResumeEditor'
import ResumeTemplate from '../_components/ResumeTemplate'

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

function ResumeViewer({
  resume,
  onBack,
  onEdit,
}: {
  resume: Resume
  onBack: () => void
  onEdit: () => void
}) {
  const printRef = useRef<HTMLDivElement>(null)

  function handlePrint() {
    const content = printRef.current
    if (!content) return
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`
      <html>
        <head>
          <title>${resume.fullName} \u2014 Resume</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Lato:wght@400;700&display=swap');
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: 'Lato', sans-serif; font-size: 10pt; color: #111; padding: 40px 48px; }
            .rv-header__name { font-size: 24pt; font-weight: 900; text-transform: uppercase; letter-spacing: .02em; margin-bottom: 4px; }
            .rv-header__headline { font-size: 10pt; margin-bottom: 8px; font-style: italic; color: #444; }
            .rv-header__contacts { display: flex; flex-wrap: wrap; gap: 14px; font-size: 9pt; color: #444; margin-bottom: 6px; }
            .rv-header__contact { display: flex; align-items: center; gap: 4px; }
            .rv-link { color: #111; text-decoration: none; }
            .rv-section { margin-top: 16px; }
            .rv-section__heading { font-size: 10pt; font-weight: 900; text-transform: uppercase; letter-spacing: .1em; border-bottom: 1.5px solid #111; padding-bottom: 3px; margin-bottom: 10px; }
            .rv-section__body { font-size: 9.5pt; line-height: 1.55; color: #333; }
            .rv-exp { margin-bottom: 14px; }
            .rv-exp__title { font-weight: 700; font-size: 10pt; }
            .rv-exp__company { font-weight: 700; font-size: 9pt; color: #555; margin-bottom: 2px; }
            .rv-exp__meta { display: flex; gap: 14px; font-size: 8.5pt; color: #666; margin-top: 2px; margin-bottom: 4px; }
            .rv-exp__meta-item { display: flex; align-items: center; gap: 3px; }
            .rv-bullets { padding-left: 16px; font-size: 9.5pt; line-height: 1.5; color: #333; }
            .rv-bullets li { margin-bottom: 3px; }
            .rv-edu { margin-bottom: 10px; }
            .rv-edu__degree { font-weight: 700; font-size: 10pt; }
            .rv-edu__institution { font-weight: 700; font-size: 9pt; color: #555; }
            .rv-skills { display: flex; flex-wrap: wrap; gap: 6px; }
            .rv-skills__chip { border: 1px solid #ccc; border-radius: 3px; padding: 2px 10px; font-size: 9pt; }
          </style>
        </head>
        <body>${content.innerHTML}</body>
      </html>
    `)
    win.document.close()
    win.focus()
    win.print()
    win.close()
  }

  return (
    <div className="rv-overlay">
      <div className="rv-overlay__bar">
        <button className="btn btn--ghost btn--sm" onClick={onBack}>
          <ArrowLeft size={14} />
          Back
        </button>
        <span className="rv-overlay__title">{resume.name}</span>
        <div className="rv-overlay__actions">
          <button className="btn btn--ghost btn--sm" onClick={handlePrint}>
            <Printer size={14} />
            Print / PDF
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
    <ResumeViewer
      resume={resume}
      onBack={() => router.push('/candidate/resume')}
      onEdit={() => router.push(`/candidate/resume/${id}?mode=edit`)}
    />
  )
}
