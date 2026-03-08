import type { Resume } from '@/lib/types/resume'
import { PayloadAction, createSlice } from '@reduxjs/toolkit'

import type { ApiResumeData } from '../services/resumeApi'

// ---------------------------------------------------------------------------
// Helpers — map API shape → UI Resume shape
// ---------------------------------------------------------------------------

/** Convert "YYYY-MM-DD" (API) → "YYYY-MM" (month input value). */
function toMonthInput(date: string | null | undefined): string {
  if (!date) return ''
  return date.slice(0, 7) // "YYYY-MM"
}

/** Convert an API resume object into the local Resume UI type. */
export function apiResumeToUi(raw: ApiResumeData, userFullName = '', userEmail = ''): Resume {
  return {
    id: raw.id,
    name: raw.resume_name,
    updatedAt: new Date(raw.updated_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    targetRole: raw.headline ?? '',
    fullName: userFullName,
    headline: raw.headline ?? '',
    email: userEmail,
    phone: raw.phone ?? '',
    location: raw.location ?? '',
    website: raw.portfolio_url ?? raw.linkedin_url ?? '',
    linkedin_url: raw.linkedin_url ?? '',
    github_url: raw.github_url ?? '',
    summary: raw.summary ?? '',
    experience: (raw.experiences ?? []).map((exp) => ({
      id: exp.id,
      title: exp.title,
      company: exp.company_name,
      location: '',
      startDate: toMonthInput(exp.start_date),
      endDate: toMonthInput(exp.end_date),
      current: exp.end_date === null,
      description: exp.description.join('\n'),
    })),
    education: (raw.educations ?? []).map((edu) => ({
      id: edu.id,
      degree: [edu.degree, edu.field_of_study].filter(Boolean).join(' in '),
      institution: edu.institution,
      location: '',
      startDate: toMonthInput(edu.start_date),
      endDate: toMonthInput(edu.end_date),
      gpa: '',
    })),
    skills: (raw.skills ?? []).map((sk) => sk.skill_name),
  }
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

export interface ResumeState {
  resumes: Resume[]
}

const initialState: ResumeState = {
  resumes: [],
}

// ---------------------------------------------------------------------------
// Slice
// ---------------------------------------------------------------------------

const resumeSlice = createSlice({
  name: 'resumes',
  initialState,
  reducers: {
    /** Replace the full list (called after getMyResumes or on initial load). */
    setResumes(state, action: PayloadAction<Resume[]>) {
      state.resumes = action.payload
    },

    /** Add or replace a single resume (called after createResume). */
    upsertResume(state, action: PayloadAction<Resume>) {
      const idx = state.resumes.findIndex((r) => r.id === action.payload.id)
      if (idx >= 0) {
        state.resumes[idx] = action.payload
      } else {
        state.resumes.unshift(action.payload)
      }
    },

    /** Update a resume locally (live edits in the editor). */
    updateResume(state, action: PayloadAction<Resume>) {
      const idx = state.resumes.findIndex((r) => r.id === action.payload.id)
      if (idx >= 0) {
        state.resumes[idx] = action.payload
      }
    },

    /** Remove a resume by id. */
    removeResume(state, action: PayloadAction<string>) {
      state.resumes = state.resumes.filter((r) => r.id !== action.payload)
    },
  },
})

export const { setResumes, upsertResume, updateResume, removeResume } = resumeSlice.actions

export default resumeSlice.reducer
