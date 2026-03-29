import type { Resume } from '@/lib/types/resume'
import type { RecruiterCandidateDetailView } from '@/store/services/applicationsApi'

function toMonthInput(date: string | null): string {
  if (!date) return ''
  return date.slice(0, 7)
}

export function mapRecruiterCandidateResume(
  candidate: RecruiterCandidateDetailView | null | undefined,
): Resume | null {
  if (!candidate?.resume) return null

  return {
    id: candidate.resume.id,
    name: candidate.resume.resume_name,
    updatedAt: new Date(candidate.resume.updated_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    targetRole: candidate.resume.headline ?? '',
    fullName: candidate.applicant_name,
    headline: candidate.resume.headline ?? '',
    email: candidate.applicant_email ?? '',
    phone: candidate.resume.phone ?? candidate.candidate_phone ?? '',
    location: candidate.resume.location ?? candidate.candidate_location ?? '',
    website: candidate.resume.portfolio_url ?? candidate.resume.linkedin_url ?? '',
    linkedin_url: candidate.resume.linkedin_url ?? '',
    github_url: candidate.resume.github_url ?? '',
    summary: candidate.resume.summary ?? '',
    experience: candidate.resume.experiences.map((experience) => ({
      id: experience.id,
      title: experience.title,
      company: experience.company_name,
      location: '',
      startDate: toMonthInput(experience.start_date),
      endDate: toMonthInput(experience.end_date),
      current: experience.end_date === null,
      description: experience.description.join('\n'),
    })),
    education: candidate.resume.educations.map((education) => ({
      id: education.id,
      degree: [education.degree, education.field_of_study].filter(Boolean).join(' in '),
      institution: education.institution,
      location: '',
      startDate: toMonthInput(education.start_date),
      endDate: toMonthInput(education.end_date),
      gpa: '',
    })),
    skills: candidate.resume.skills.map((skill) => skill.skill_name),
  }
}
