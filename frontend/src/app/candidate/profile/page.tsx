'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Cropper, { type Area } from 'react-easy-crop'
import { toast } from 'react-toastify'

import { useRouter } from 'next/navigation'

import { parseApiError } from '@/lib/apiError'
import { createCroppedImageFile } from '@/lib/cropImage'
import { formatBytes, getInitials, validateImageFile } from '@/lib/mediaValidation'
import {
  PROFILE_COMPLETION_LABEL,
  calculateProfileCompletionPercentage,
  getProfileCompletionMeta,
} from '@/lib/profileCompletion'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { useDeleteAccountMutation } from '@/store/services/authApi'
import {
  type CandidateProfileData,
  type UpdateProfileRequest,
  useGetMyProfileQuery,
  useRemoveMyAvatarMutation,
  useUpdateMyAvatarMutation,
  useUpdateMyProfileMutation,
} from '@/store/services/profileApi'
import { clearCredentials, updateUser } from '@/store/slices/authSlice'
import { AlertTriangle, Camera, FileUp, MapPin, Trash2, X } from 'lucide-react'

import ButtonSpinner from '@/components/common/ButtonSpinner'
import DashboardTabs from '@/components/common/DashboardTabs'
import MediaBadge from '@/components/common/MediaBadge'

import { ProfileDataSkeleton } from './_components/ProfileSkeletons'
import ResumeImportModal from './_components/ResumeImportModal'

export const AVAILABLE_ROLES = [
  // Software Engineering & Web Development
  'Software Engineer',
  'Frontend Engineer',
  'Backend Engineer',
  'Fullstack Engineer',
  'Web Developer',
  'Mobile Developer',
  'iOS Developer',
  'Android Developer',
  'Game Developer',
  'Embedded Systems Engineer',
  'Firmware Engineer',
  'API Developer',
  'Salesforce Developer',
  'CMS Developer (WordPress, Shopify, etc.)',

  // Cloud, Infrastructure & DevOps
  'DevOps Engineer',
  'Cloud Architect',
  'Cloud Engineer',
  'Site Reliability Engineer (SRE)',
  'Platform Engineer',
  'Network Engineer',
  'Network Administrator',
  'Systems Administrator',
  'Database Administrator (DBA)',
  'Infrastructure Engineer',
  'Release Manager',

  // Data, AI & Machine Learning
  'Data Scientist',
  'Data Engineer',
  'Machine Learning Engineer',
  'AI Engineer',
  'Data Analyst',
  'Business Intelligence (BI) Developer',
  'Big Data Engineer',
  'Deep Learning Engineer',
  'NLP Engineer',
  'Computer Vision Engineer',
  'Prompt Engineer',
  'Data Architect',

  // Cybersecurity
  'Security Engineer',
  'Cybersecurity Analyst',
  'Penetration Tester (Ethical Hacker)',
  'Security Architect',
  'DevSecOps Engineer',
  'Information Security Manager',
  'Incident Responder',
  'Cryptographer',

  // Quality Assurance & Testing
  'QA Tester',
  'QA Engineer',
  'QA Automation Engineer',
  'Software Development Engineer in Test (SDET)',
  'Performance Tester',
  'Manual Tester',

  // Design & User Experience
  'UI/UX Designer',
  'Product Designer',
  'UX Researcher',
  'Interaction Designer',
  'Visual Designer',
  'Web Designer',

  // Product, Project & Agile Management
  'Product Manager',
  'Project Manager',
  'Scrum Master',
  'Product Owner',
  'Technical Program Manager (TPM)',
  'Engineering Manager',
  'Business Analyst',

  // Emerging Tech & Specialized
  'Blockchain Developer',
  'Smart Contract Engineer',
  'Web3 Developer',
  'AR/VR Developer',
  'IoT Engineer',
  'Robotics Engineer',
  'RPA Developer (Robotic Process Automation)',

  // Developer Relations & Client-Facing Tech
  'Developer Advocate / Evangelist',
  'Sales Engineer',
  'Solutions Architect',
  'Technical Writer',
  'Implementation Consultant',

  // IT Support & Leadership
  'IT Support Specialist',
  'Helpdesk Technician',
  'IT Manager / Director',
  'Chief Technology Officer (CTO)',
  'Chief Information Officer (CIO)',
  'Chief Information Security Officer (CISO)',
]

// ── Local form types ───────────────────────────────────────────

type FormExperience = {
  /** Client-side stable key for list rendering. */
  _key: string
  title: string
  company_name: string
  /** "YYYY-MM" format used by <input type="month"> */
  startDate: string
  endDate: string
  /** When true, end_date is sent as null to the API. */
  current: boolean
  /** Multi-line text; each non-empty line becomes one item in description[]. */
  description: string
}

type FormEducation = {
  _key: string
  institution: string
  degree: string
  field_of_study: string
  startDate: string
  endDate: string
}

type FormProfile = {
  headline: string
  summary: string
  phone: string
  location: string
  linkedin_url: string
  github_url: string
  portfolio_url: string
  years_of_experience: string
  experiences: FormExperience[]
  educations: FormEducation[]
  skills: string[]
  target_roles: string[]
  is_open_to_work: boolean
}

// ── Helpers ────────────────────────────────────────────────────

function uid(): string {
  return Math.random().toString(36).slice(2)
}

/** "YYYY-MM-DD" → "YYYY-MM" suitable for <input type="month">. Null → "". */
function parseApiDate(d: string | null | undefined): string {
  if (!d) return ''
  return d.slice(0, 7)
}

/** "YYYY-MM" → "YYYY-MM-01" for the API. Empty string → null. */
function toApiDate(d: string): string | null {
  return d ? `${d}-01` : null
}

/** string[] → textarea value (one per line). */
function descToText(desc: string[]): string {
  return desc.join('\n')
}

/** textarea value → string[] (filter blank lines). */
function textToDesc(text: string): string[] {
  return text.split('\n').filter((l) => l.trim().length > 0)
}

/** "YYYY-MM" → "Jan 2024" display label. "" → "Present". */
function formatDate(value: string): string {
  if (!value) return 'Present'
  const [year, month] = value.split('-')
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ]
  return `${months[parseInt(month, 10) - 1]} ${year}`
}

/** Map API profile data → local form state. */
function apiToForm(data: CandidateProfileData): FormProfile {
  return {
    headline: data.headline ?? '',
    summary: data.summary ?? '',
    phone: data.phone ?? '',
    location: data.location ?? '',
    linkedin_url: data.linkedin_url ?? '',
    github_url: data.github_url ?? '',
    portfolio_url: data.portfolio_url ?? '',
    years_of_experience: data.years_of_experience?.toString() ?? '',
    experiences: data.experiences.map((e) => ({
      _key: e.id ?? uid(),
      title: e.title,
      company_name: e.company_name,
      startDate: parseApiDate(e.start_date),
      endDate: parseApiDate(e.end_date),
      current: !e.end_date,
      description: descToText(e.description),
    })),
    educations: data.educations.map((e) => ({
      _key: e.id ?? uid(),
      institution: e.institution,
      degree: e.degree ?? '',
      field_of_study: e.field_of_study ?? '',
      startDate: parseApiDate(e.start_date),
      endDate: parseApiDate(e.end_date),
    })),
    skills: data.skills.map((s) => s.skill_name),
    target_roles: data.target_roles || [],
    is_open_to_work: data.is_open_to_work ?? false,
  }
}

/** Map local form state → PUT /profiles/me request body. */
function formToApiUpdate(form: FormProfile): UpdateProfileRequest {
  return {
    headline: form.headline || null,
    summary: form.summary || null,
    phone: form.phone || null,
    location: form.location || null,
    linkedin_url: form.linkedin_url || null,
    github_url: form.github_url || null,
    portfolio_url: form.portfolio_url || null,
    years_of_experience: form.years_of_experience ? parseInt(form.years_of_experience, 10) : null,
    is_open_to_work: form.is_open_to_work,
    experiences: form.experiences.map((e) => ({
      company_name: e.company_name,
      title: e.title,
      start_date: toApiDate(e.startDate),
      end_date: e.current ? null : toApiDate(e.endDate),
      description: textToDesc(e.description),
    })),
    educations: form.educations.map((e) => ({
      institution: e.institution,
      degree: e.degree || null,
      field_of_study: e.field_of_study || null,
      start_date: toApiDate(e.startDate),
      end_date: toApiDate(e.endDate),
    })),
    skills: form.skills.map((s) => ({ skill_name: s })),
    target_roles: form.target_roles,
  }
}

const EMPTY_FORM: FormProfile = {
  headline: '',
  summary: '',
  phone: '',
  location: '',
  linkedin_url: '',
  github_url: '',
  portfolio_url: '',
  years_of_experience: '',
  experiences: [],
  educations: [],
  skills: [],
  target_roles: [],
  is_open_to_work: false,
}

// ── Section tabs definition ────────────────────────────────────

const SECTIONS = ['Overview', 'Experience', 'Education', 'Skills'] as const
type Section = (typeof SECTIONS)[number]

type AvatarCropDraft = {
  sourceUrl: string
  fileName: string
  mimeType: string
  naturalWidth: number
  naturalHeight: number
}

function readImageDimensions(
  src: string,
): Promise<{ naturalWidth: number; naturalHeight: number }> {
  return new Promise((resolve, reject) => {
    const image = new window.Image()
    image.onload = () => {
      resolve({
        naturalWidth: image.naturalWidth,
        naturalHeight: image.naturalHeight,
      })
    }
    image.onerror = () => reject(new Error('Failed to load image preview.'))
    image.src = src
  })
}

// ════════════════════════════════════════════════════════════
// Main page component
// ════════════════════════════════════════════════════════════

export default function ProfilePage() {
  // ── Auth user (name / email come from auth, not from profile API) ──────
  const router = useRouter()
  const dispatch = useAppDispatch()
  const user = useAppSelector((state) => state.auth.user)

  // ── RTK Query ───────────────────────────────────────────────────────────
  const { data: profileResp, isLoading, isError, refetch } = useGetMyProfileQuery()

  const [updateProfile, { isLoading: isSaving }] = useUpdateMyProfileMutation()
  const [updateAvatar, { isLoading: isUploadingAvatar }] = useUpdateMyAvatarMutation()
  const [removeAvatar, { isLoading: isRemovingAvatar }] = useRemoveMyAvatarMutation()
  const [deleteAccount, { isLoading: isDeleting }] = useDeleteAccountMutation()

  // ── Local form state ─────────────────────────────────────────────────────
  const [form, setForm] = useState<FormProfile>(EMPTY_FORM)
  const [activeSection, setActiveSection] = useState<Section>('Overview')
  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [skillInput, setSkillInput] = useState('')
  const [targetRoleInput, setTargetRoleInput] = useState('')
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false)
  const roleDropdownRef = useRef<HTMLDivElement>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [showResumeImportModal, setShowResumeImportModal] = useState(false)
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const [avatarCropDraft, setAvatarCropDraft] = useState<AvatarCropDraft | null>(null)
  const [avatarCrop, setAvatarCrop] = useState({ x: 0, y: 0 })
  const [avatarZoom, setAvatarZoom] = useState(1)
  const [avatarCroppedAreaPixels, setAvatarCroppedAreaPixels] = useState<Area | null>(null)
  const [isSubmittingCroppedAvatar, setIsSubmittingCroppedAvatar] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [isAvatarCropModalClosing, setIsAvatarCropModalClosing] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const avatarCropModalTimeoutRef = useRef<number | null>(null)

  // Populate local form when API data arrives.
  useEffect(() => {
    if (profileResp?.data) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm(apiToForm(profileResp.data))
    }
  }, [profileResp])

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreviewUrl)
      }
    }
  }, [avatarPreviewUrl])

  useEffect(() => {
    return () => {
      if (avatarCropModalTimeoutRef.current) {
        window.clearTimeout(avatarCropModalTimeoutRef.current)
      }
      if (avatarCropDraft?.sourceUrl.startsWith('blob:')) {
        URL.revokeObjectURL(avatarCropDraft.sourceUrl)
      }
    }
  }, [avatarCropDraft])

  // ── Save helpers ─────────────────────────────────────────────────────────

  const saveProfile = useCallback(
    async (targetForm?: FormProfile) => {
      setSaveError(null)
      setSaveSuccess(false)
      try {
        await updateProfile(formToApiUpdate(targetForm ?? form)).unwrap()
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 2000)
      } catch (err: unknown) {
        const msg =
          (err as { data?: { message?: string } })?.data?.message ??
          'Failed to save. Please try again.'
        setSaveError(msg)
      }
    },
    [form, updateProfile],
  )

  async function finishEditing(key: string, latestForm?: FormProfile) {
    void key
    setEditingSection(null)
    await saveProfile(latestForm)
  }

  // ── Generic field setter ─────────────────────────────────────────────────

  function set<K extends keyof FormProfile>(key: K, value: FormProfile[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  // ── Experience helpers ────────────────────────────────────────────────────

  function updateExp(k: string, field: keyof FormExperience, value: string | boolean) {
    set(
      'experiences',
      form.experiences.map((e) => (e._key === k ? { ...e, [field]: value } : e)),
    )
  }

  function addExp() {
    const entry: FormExperience = {
      _key: uid(),
      title: '',
      company_name: '',
      startDate: '',
      endDate: '',
      current: false,
      description: '',
    }
    set('experiences', [...form.experiences, entry])
    setEditingSection(entry._key)
  }

  async function removeExp(k: string) {
    const next = form.experiences.filter((e) => e._key !== k)
    if (editingSection === k) setEditingSection(null)
    const nextForm = { ...form, experiences: next }
    setForm(nextForm)
    await saveProfile(nextForm)
  }

  // ── Education helpers ─────────────────────────────────────────────────────

  function updateEdu(k: string, field: keyof FormEducation, value: string) {
    set(
      'educations',
      form.educations.map((e) => (e._key === k ? { ...e, [field]: value } : e)),
    )
  }

  function addEdu() {
    const entry: FormEducation = {
      _key: uid(),
      institution: '',
      degree: '',
      field_of_study: '',
      startDate: '',
      endDate: '',
    }
    set('educations', [...form.educations, entry])
    setEditingSection(entry._key)
  }

  async function removeEdu(k: string) {
    const next = form.educations.filter((e) => e._key !== k)
    if (editingSection === k) setEditingSection(null)
    const nextForm = { ...form, educations: next }
    setForm(nextForm)
    await saveProfile(nextForm)
  }

  // ── Skills helpers ────────────────────────────────────────────────────────

  function addSkill() {
    const s = skillInput.trim()
    if (!s || form.skills.includes(s)) return
    const next = [...form.skills, s]
    setSkillInput('')
    const nextForm = { ...form, skills: next }
    setForm(nextForm)
    saveProfile(nextForm)
  }

  function removeSkill(sk: string) {
    const next = form.skills.filter((s) => s !== sk)
    const nextForm = { ...form, skills: next }
    setForm(nextForm)
    saveProfile(nextForm)
  }

  // ── Target Roles helpers ──────────────────────────────────────────────────

  const filteredTargetRoles = AVAILABLE_ROLES.filter(
    (role) =>
      role.toLowerCase().includes(targetRoleInput.toLowerCase()) &&
      !form.target_roles.includes(role),
  )

  function addTargetRole(role: string) {
    const r = role.trim()
    if (!r || form.target_roles.includes(r)) return
    const next = [...form.target_roles, r]
    setTargetRoleInput('')
    setIsRoleDropdownOpen(false)
    const nextForm = { ...form, target_roles: next }
    setForm(nextForm)
    saveProfile(nextForm)
  }

  function removeTargetRole(role: string) {
    const next = form.target_roles.filter((r) => r !== role)
    const nextForm = { ...form, target_roles: next }
    setForm(nextForm)
    saveProfile(nextForm)
  }

  // Handle clicking outside to close role dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target as Node)) {
        setIsRoleDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function finalizeAvatarCropModalClose() {
    setAvatarCropDraft(null)
    setAvatarCrop({ x: 0, y: 0 })
    setAvatarZoom(1)
    setAvatarCroppedAreaPixels(null)
    setIsSubmittingCroppedAvatar(false)
    setIsAvatarCropModalClosing(false)
    avatarCropModalTimeoutRef.current = null
  }

  function closeAvatarCropModal() {
    if (isAvatarCropModalClosing) return
    setIsAvatarCropModalClosing(true)
    if (avatarCropModalTimeoutRef.current) {
      window.clearTimeout(avatarCropModalTimeoutRef.current)
    }
    avatarCropModalTimeoutRef.current = window.setTimeout(() => {
      finalizeAvatarCropModalClose()
    }, 200)
  }

  async function handleAvatarSelection(file: File) {
    const validationError = validateImageFile(file)
    if (validationError) {
      setAvatarError(validationError)
      toast.error(validationError)
      return
    }

    setAvatarError(null)
    const sourceUrl = URL.createObjectURL(file)

    try {
      const { naturalWidth, naturalHeight } = await readImageDimensions(sourceUrl)

      if (avatarCropModalTimeoutRef.current) {
        window.clearTimeout(avatarCropModalTimeoutRef.current)
        avatarCropModalTimeoutRef.current = null
      }

      setIsAvatarCropModalClosing(false)
      setAvatarCropDraft((current) => {
        if (current?.sourceUrl.startsWith('blob:')) {
          URL.revokeObjectURL(current.sourceUrl)
        }

        return {
          sourceUrl,
          fileName: file.name,
          mimeType: file.type,
          naturalWidth,
          naturalHeight,
        }
      })
      setAvatarCrop({ x: 0, y: 0 })
      setAvatarZoom(1)
      setAvatarCroppedAreaPixels(null)
    } catch {
      URL.revokeObjectURL(sourceUrl)
      const message = 'We could not open that image for cropping. Please try another file.'
      setAvatarError(message)
      toast.error(message)
    }
  }

  async function handleDeleteAccount() {
    try {
      await deleteAccount().unwrap()
      dispatch(clearCredentials())
      router.push('/login')
    } catch {
      toast.error('Failed to delete account. Please try again.')
    }
  }

  async function handleAvatarCropConfirm() {
    if (!avatarCropDraft || !avatarCroppedAreaPixels) {
      setAvatarError('Select the visible area you want to save first.')
      return
    }

    setAvatarError(null)
    setIsSubmittingCroppedAvatar(true)

    try {
      const croppedFile = await createCroppedImageFile({
        src: avatarCropDraft.sourceUrl,
        crop: avatarCroppedAreaPixels,
        fileName: avatarCropDraft.fileName,
        mimeType: avatarCropDraft.mimeType,
      })

      const formData = new FormData()
      formData.append('file', croppedFile)

      const response = await updateAvatar(formData).unwrap()
      const updatedAvatarUrl = response.data.avatar_url

      setAvatarPreviewUrl((current) => {
        if (current?.startsWith('blob:')) {
          URL.revokeObjectURL(current)
        }
        return updatedAvatarUrl
      })

      if (user) {
        dispatch(updateUser({ ...user, avatar_url: updatedAvatarUrl }))
      }

      closeAvatarCropModal()
      toast.success('Avatar updated.')
    } catch (error) {
      const parsed = parseApiError(
        error,
        {},
        'We could not update your profile picture right now. Please try again.',
      )
      const message =
        typeof parsed.status === 'number' && parsed.status >= 500
          ? 'We could not update your profile picture right now. Please try again.'
          : parsed.message
      setAvatarError(message)
      toast.error(message)
      setIsSubmittingCroppedAvatar(false)
    }
  }

  async function handleAvatarRemove() {
    try {
      await removeAvatar().unwrap()
      setAvatarError(null)
      setAvatarPreviewUrl((current) => {
        if (current?.startsWith('blob:')) URL.revokeObjectURL(current)
        return null
      })

      if (user) {
        dispatch(updateUser({ ...user, avatar_url: null }))
      }

      toast.success('Avatar removed.')
    } catch (error) {
      const message =
        (error as { data?: { message?: string } })?.data?.message ?? 'Failed to remove avatar.'
      setAvatarError(message)
      toast.error(message)
    }
  }

  // ── Derived display values ────────────────────────────────────────────────

  const displayName = user?.full_name ?? '—'
  const initials = getInitials(displayName, 'CP')
  const avatarSrc = avatarPreviewUrl ?? profileResp?.data?.avatar_url ?? user?.avatar_url ?? null
  const isAvatarBusy = isUploadingAvatar || isRemovingAvatar || isSubmittingCroppedAvatar

  // ── Profile completion score (0–100) ─────────────────────────────────────

  const profileCompletion = useMemo(() => calculateProfileCompletionPercentage(form), [form])
  const profileCompletionMeta = useMemo(
    () => getProfileCompletionMeta(profileCompletion),
    [profileCompletion],
  )

  const statusHint = isSaving
    ? 'Saving…'
    : saveError
      ? saveError
      : saveSuccess
        ? 'Saved ✓'
        : 'Changes saved automatically'

  const statusClass =
    'page-header-hint' +
    (saveError ? ' page-header-hint--error' : '') +
    (saveSuccess ? ' page-header-hint--success' : '')

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="dash-content container container--app-shell">
      {/* ── Page header ── */}
      <div className="dash-page-header">
        <div className="dash-page-header__left">
          <h2 className="dash-page-header__title">My Profile</h2>
          <p className="dash-page-header__subtitle">
            Build your professional profile to power your resumes and applications.
          </p>
        </div>
        <div className="dash-page-header__actions">
          <button
            type="button"
            className="btn btn--outline btn--sm"
            onClick={() => setShowResumeImportModal(true)}
          >
            <FileUp size={14} aria-hidden="true" />
            Import Resume
          </button>
          <span className={statusClass}>{statusHint}</span>
        </div>
      </div>

      {isLoading ? (
        <ProfileDataSkeleton />
      ) : isError ? (
        <div className="profile-error">
          <p>Failed to load profile.</p>
          <button className="btn btn--primary btn--sm" onClick={refetch}>
            Retry
          </button>
        </div>
      ) : (
        <div className="profile-layout content-fade-in">
          {/* ── Aside: avatar + summary card ── */}
          <aside className="profile-layout__aside">
            <div
              className="profile-aside-card content-stagger-item"
              style={{ '--stagger-index': 0 } as React.CSSProperties}
            >
              <div className="profile-completion" style={{ marginBottom: '1.5rem' }}>
                <div className="profile-completion__header">
                  <span className="profile-completion__label">{PROFILE_COMPLETION_LABEL}</span>
                  <span className="profile-completion__pct">{profileCompletion}%</span>
                </div>
                <div className="profile-completion__bar">
                  <div
                    className={`profile-completion__fill profile-completion__fill--${profileCompletionMeta.tone}`}
                    style={{ width: `${profileCompletion}%` }}
                  />
                </div>
              </div>

              <div className="profile-media-control">
                <MediaBadge
                  src={avatarSrc}
                  alt={displayName}
                  fallback={initials}
                  className="profile-aside-card__avatar"
                  sizes="96px"
                />
                <div className="profile-media-actions" aria-label="Profile picture actions">
                  <button
                    className="btn btn--outline btn--sm"
                    disabled={isAvatarBusy}
                    onClick={() => avatarInputRef.current?.click()}
                    title={`PNG, JPG, WEBP, GIF up to ${formatBytes(5 * 1024 * 1024)}`}
                    type="button"
                  >
                    <Camera size={14} />
                    <span>{avatarSrc ? 'Replace' : 'Upload'}</span>
                  </button>
                  <button
                    className="btn btn--danger btn--sm"
                    disabled={!avatarSrc || isAvatarBusy}
                    onClick={() => void handleAvatarRemove()}
                    type="button"
                  >
                    <Trash2 size={14} />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
              <input
                ref={avatarInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.gif,image/*"
                hidden
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) {
                    handleAvatarSelection(file)
                  }
                  event.currentTarget.value = ''
                }}
              />
              {avatarError ? <div className="resume-field__error">{avatarError}</div> : null}
              <div className="profile-aside-card__name">{displayName}</div>
              <div className="profile-aside-card__headline">
                {form.headline || 'No headline set'}
              </div>
              <div className="profile-media-hint">
                PNG, JPG, WEBP, GIF up to {formatBytes(5 * 1024 * 1024)}
              </div>
              {form.location && (
                <div className="profile-aside-card__location">
                  <MapPin size={13} aria-hidden="true" />
                  {form.location}
                </div>
              )}

              <div
                className="open-to-work-status"
                style={{ padding: '0.25rem 0', marginTop: '0.25rem' }}
              >
                <span
                  className={`open-to-work-status__dot ${form.is_open_to_work ? 'open-to-work-status__dot--active' : ''}`}
                />
                <span className="open-to-work-status__text">
                  Open to Work · {form.is_open_to_work ? 'Active' : 'Off'}
                </span>
                <button
                  className={`open-to-work-status__toggle ${isSaving ? 'open-to-work-status__toggle--loading' : ''}`}
                  onClick={() => {
                    const next = !form.is_open_to_work
                    const nextForm = { ...form, is_open_to_work: next }
                    setForm(nextForm)
                    saveProfile(nextForm)
                    toast.success(next ? "You're now 'Open to Work'!" : 'Open to Work disabled.')
                  }}
                  disabled={isSaving}
                >
                  {form.is_open_to_work ? 'Turn off' : 'Turn on'}
                </button>
              </div>

              <div className="profile-aside-card__divider" />
              <div className="profile-aside-card__stats">
                <div className="profile-aside-card__stat">
                  <div className="profile-aside-card__stat-value">{form.experiences.length}</div>
                  <div className="profile-aside-card__stat-label">Roles</div>
                </div>
                <div className="profile-aside-card__stat">
                  <div className="profile-aside-card__stat-value">{form.educations.length}</div>
                  <div className="profile-aside-card__stat-label">Degrees</div>
                </div>
                <div className="profile-aside-card__stat">
                  <div className="profile-aside-card__stat-value">{form.skills.length}</div>
                  <div className="profile-aside-card__stat-label">Skills</div>
                </div>
              </div>
              <div className="profile-aside-card__divider" />
              <div className="profile-target-roles" style={{ padding: '0.5rem 0' }}>
                <div className="profile-block__header" style={{ marginBottom: '0.75rem' }}>
                  <div
                    className="profile-block__title"
                    style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-color)' }}
                  >
                    Target Roles
                  </div>
                </div>

                <div className="skills-wrap" style={{ marginBottom: '1rem', gap: '6px' }}>
                  {form.target_roles.map((role) => (
                    <div
                      className="skill-item"
                      key={role}
                      style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                    >
                      {role}
                      <button
                        className="skill-item__remove"
                        disabled={isSaving}
                        onClick={() => removeTargetRole(role)}
                        aria-label={`Remove ${role}`}
                        style={{ marginLeft: '4px' }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {form.target_roles.length === 0 && (
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-light)',
                        fontStyle: 'italic',
                      }}
                    >
                      No target roles set
                    </div>
                  )}
                </div>

                <div style={{ position: 'relative' }} ref={roleDropdownRef}>
                  <input
                    className="resume-field__input"
                    style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem', height: 'auto' }}
                    placeholder="Add target role..."
                    value={targetRoleInput}
                    onFocus={() => setIsRoleDropdownOpen(true)}
                    onChange={(e) => {
                      setTargetRoleInput(e.target.value)
                      setIsRoleDropdownOpen(true)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        if (targetRoleInput.trim()) addTargetRole(targetRoleInput)
                      }
                    }}
                  />
                  {isRoleDropdownOpen &&
                    (targetRoleInput.length > 0 || filteredTargetRoles.length > 0) && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          zIndex: 100,
                          backgroundColor: '#fff',
                          border: '1px solid var(--border-color)',
                          borderRadius: '6px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          maxHeight: '160px',
                          overflowY: 'auto',
                          marginTop: '4px',
                        }}
                      >
                        {filteredTargetRoles.map((role) => (
                          <button
                            key={role}
                            type="button"
                            onClick={() => addTargetRole(role)}
                            style={{
                              width: '100%',
                              textAlign: 'left',
                              padding: '8px 12px',
                              background: 'transparent',
                              border: 'none',
                              borderBottom: '1px solid var(--border-color)',
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                              color: 'var(--text-color)',
                              transition: 'background-color 0.2s',
                            }}
                            onMouseOver={(e) =>
                              (e.currentTarget.style.backgroundColor = 'var(--bg-secondary)')
                            }
                            onMouseOut={(e) =>
                              (e.currentTarget.style.backgroundColor = 'transparent')
                            }
                          >
                            {role}
                          </button>
                        ))}
                        {targetRoleInput.trim() &&
                          !filteredTargetRoles.some(
                            (r) => r.toLowerCase() === targetRoleInput.trim().toLowerCase(),
                          ) && (
                            <button
                              type="button"
                              onClick={() => addTargetRole(targetRoleInput)}
                              style={{
                                width: '100%',
                                textAlign: 'left',
                                padding: '8px 12px',
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                color: 'var(--primary-color)',
                                fontWeight: 600,
                                transition: 'background-color 0.2s',
                              }}
                              onMouseOver={(e) =>
                                (e.currentTarget.style.backgroundColor = 'var(--bg-secondary)')
                              }
                              onMouseOut={(e) =>
                                (e.currentTarget.style.backgroundColor = 'transparent')
                              }
                            >
                              + Add &quot;{targetRoleInput.trim()}&quot;
                            </button>
                          )}
                      </div>
                    )}
                </div>
              </div>
            </div>
          </aside>

          {/* ── Main: tabs + sections ── */}
          <div className="profile-layout__main">
            {/* Tabs */}
            <DashboardTabs
              options={SECTIONS.map((section) => ({ label: section, value: section }))}
              activeValue={activeSection}
              onChange={setActiveSection}
              className="content-stagger-item"
              style={{ '--stagger-index': 1 } as React.CSSProperties}
            />

            {/* ── Overview ──────────────────────────────────────────────── */}
            {activeSection === 'Overview' && (
              <div className="profile-section">
                {/* Personal info block */}
                <div
                  className="profile-block content-stagger-item"
                  style={{ '--stagger-index': 2 } as React.CSSProperties}
                >
                  <div className="profile-block__header">
                    <div className="profile-block__title">Personal Information</div>
                    <button
                      className="btn btn--primary btn--sm"
                      disabled={isSaving}
                      onClick={() =>
                        editingSection === 'personal'
                          ? finishEditing('personal')
                          : setEditingSection('personal')
                      }
                    >
                      {editingSection === 'personal' ? 'Save' : 'Edit'}
                    </button>
                  </div>

                  {editingSection === 'personal' ? (
                    <div className="resume-form-grid">
                      {(
                        [
                          ['headline', 'Professional Headline', 'text'],
                          ['phone', 'Phone', 'tel'],
                          ['location', 'Location', 'text'],
                          ['years_of_experience', 'Years of Experience', 'number'],
                          ['linkedin_url', 'LinkedIn URL', 'url'],
                          ['github_url', 'GitHub URL', 'url'],
                          ['portfolio_url', 'Portfolio / Website URL', 'url'],
                        ] as [keyof FormProfile, string, string][]
                      ).map(([field, label, type]) => (
                        <div className="resume-field" key={field}>
                          <label className="resume-field__label">{label}</label>
                          <input
                            className="resume-field__input"
                            type={type}
                            value={form[field] as string}
                            onChange={(e) => set(field, e.target.value)}
                            placeholder={label}
                            min={type === 'number' ? 0 : undefined}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="profile-info-grid">
                      {[
                        { label: 'Full Name', value: displayName },
                        { label: 'Email', value: user?.email ?? '—' },
                        { label: 'Headline', value: form.headline },
                        { label: 'Phone', value: form.phone },
                        { label: 'Location', value: form.location },
                        {
                          label: 'Years of Experience',
                          value: form.years_of_experience,
                        },
                        { label: 'LinkedIn', value: form.linkedin_url },
                        { label: 'GitHub', value: form.github_url },
                        { label: 'Portfolio', value: form.portfolio_url },
                      ].map(({ label, value }) => (
                        <div className="profile-info-item" key={label}>
                          <span className="profile-info-item__label">{label}</span>
                          <span className="profile-info-item__value">{value || '—'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Summary block */}
                <div
                  className="profile-block content-stagger-item"
                  style={{ '--stagger-index': 3 } as React.CSSProperties}
                >
                  <div className="profile-block__header">
                    <div className="profile-block__title">Professional Summary</div>
                    <button
                      className="btn btn--primary btn--sm"
                      disabled={isSaving}
                      onClick={() =>
                        editingSection === 'summary'
                          ? finishEditing('summary')
                          : setEditingSection('summary')
                      }
                    >
                      {editingSection === 'summary' ? 'Save' : 'Edit'}
                    </button>
                  </div>

                  {editingSection === 'summary' ? (
                    <textarea
                      className="resume-field__textarea"
                      rows={6}
                      value={form.summary}
                      onChange={(e) => set('summary', e.target.value)}
                      placeholder="Write a compelling professional summary…"
                    />
                  ) : (
                    <p className="profile-about-text">{form.summary || 'No summary added yet.'}</p>
                  )}
                </div>
              </div>
            )}

            {/* ── Experience ──────────────────────────────────────────────── */}
            {activeSection === 'Experience' && (
              <div className="profile-section">
                <div
                  className="profile-section__header content-stagger-item"
                  style={{ '--stagger-index': 2 } as React.CSSProperties}
                >
                  <div className="profile-section__title">Work Experience</div>
                  <button className="btn btn--outline btn--sm" onClick={addExp} disabled={isSaving}>
                    + Add
                  </button>
                </div>

                {form.experiences.length === 0 && (
                  <div className="profile-empty">No experience added yet.</div>
                )}

                {form.experiences.map((exp) => (
                  <div
                    className="profile-block content-stagger-item"
                    key={exp._key}
                    style={
                      {
                        '--stagger-index': form.experiences.indexOf(exp) + 3,
                      } as React.CSSProperties
                    }
                  >
                    <div className="profile-block__header">
                      <div className="profile-block__title">
                        {exp.title || 'Untitled Role'}
                        {exp.company_name && (
                          <span className="profile-block__sub"> · {exp.company_name}</span>
                        )}
                      </div>
                      <div className="profile-block__header-actions">
                        <button
                          className="btn btn--primary btn--sm"
                          disabled={isSaving}
                          onClick={() =>
                            editingSection === exp._key
                              ? finishEditing(exp._key)
                              : setEditingSection(exp._key)
                          }
                        >
                          {editingSection === exp._key ? 'Save' : 'Edit'}
                        </button>
                        <button
                          className="btn btn--danger btn--sm"
                          disabled={isSaving}
                          onClick={() => removeExp(exp._key)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    {editingSection === exp._key ? (
                      <>
                        <div className="resume-form-grid">
                          <div className="resume-field">
                            <label className="resume-field__label">Job Title</label>
                            <input
                              className="resume-field__input"
                              value={exp.title}
                              onChange={(e) => updateExp(exp._key, 'title', e.target.value)}
                              placeholder="Job Title"
                            />
                          </div>
                          <div className="resume-field">
                            <label className="resume-field__label">Company</label>
                            <input
                              className="resume-field__input"
                              value={exp.company_name}
                              onChange={(e) => updateExp(exp._key, 'company_name', e.target.value)}
                              placeholder="Company Name"
                            />
                          </div>
                          <div className="resume-field">
                            <label className="resume-field__label">Start Date</label>
                            <input
                              className="resume-field__input"
                              type="month"
                              value={exp.startDate}
                              onChange={(e) => updateExp(exp._key, 'startDate', e.target.value)}
                            />
                          </div>
                          <div className="resume-field">
                            <label className="resume-field__label">End Date</label>
                            <input
                              className="resume-field__input"
                              type="month"
                              value={exp.endDate}
                              disabled={exp.current}
                              onChange={(e) => updateExp(exp._key, 'endDate', e.target.value)}
                            />
                          </div>
                          <div className="resume-field resume-field--checkbox">
                            <label className="resume-field__checkbox-label">
                              <input
                                type="checkbox"
                                checked={exp.current}
                                onChange={(e) => updateExp(exp._key, 'current', e.target.checked)}
                              />
                              Currently working here
                            </label>
                          </div>
                        </div>
                        <div className="resume-field">
                          <label className="resume-field__label">
                            Description{' '}
                            <span className="resume-field__hint">(one achievement per line)</span>
                          </label>
                          <textarea
                            className="resume-field__textarea"
                            rows={4}
                            value={exp.description}
                            onChange={(e) => updateExp(exp._key, 'description', e.target.value)}
                            placeholder={
                              'Led end-to-end design for the core product\nIncreased engagement by 32%'
                            }
                          />
                        </div>
                      </>
                    ) : (
                      <div className="profile-exp-view">
                        <div className="profile-exp-view__meta">
                          {(exp.startDate || exp.endDate || exp.current) && (
                            <span>
                              {formatDate(exp.startDate)} —{' '}
                              {exp.current ? 'Present' : formatDate(exp.endDate)}
                            </span>
                          )}
                          {exp.current && (
                            <span className="status-dot status-dot--success">Current</span>
                          )}
                        </div>
                        {exp.description && (
                          <ul className="profile-exp-view__desc-list">
                            {exp.description
                              .split('\n')
                              .filter(Boolean)
                              .map((line, i) => (
                                <li key={i}>{line}</li>
                              ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* ── Education ───────────────────────────────────────────────── */}
            {activeSection === 'Education' && (
              <div className="profile-section">
                <div
                  className="profile-section__header content-stagger-item"
                  style={{ '--stagger-index': 2 } as React.CSSProperties}
                >
                  <div className="profile-section__title">Education</div>
                  <button className="btn btn--outline btn--sm" onClick={addEdu} disabled={isSaving}>
                    + Add
                  </button>
                </div>

                {form.educations.length === 0 && (
                  <div className="profile-empty">No education added yet.</div>
                )}

                {form.educations.map((edu) => (
                  <div
                    className="profile-block content-stagger-item"
                    key={edu._key}
                    style={
                      { '--stagger-index': form.educations.indexOf(edu) + 3 } as React.CSSProperties
                    }
                  >
                    <div className="profile-block__header">
                      <div className="profile-block__title">
                        {edu.degree || 'Untitled Degree'}
                        {edu.institution && (
                          <span className="profile-block__sub"> · {edu.institution}</span>
                        )}
                      </div>
                      <div className="profile-block__header-actions">
                        <button
                          className="btn btn--primary btn--sm"
                          disabled={isSaving}
                          onClick={() =>
                            editingSection === edu._key
                              ? finishEditing(edu._key)
                              : setEditingSection(edu._key)
                          }
                        >
                          {editingSection === edu._key ? 'Save' : 'Edit'}
                        </button>
                        <button
                          className="btn btn--danger btn--sm"
                          disabled={isSaving}
                          onClick={() => removeEdu(edu._key)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    {editingSection === edu._key ? (
                      <div className="resume-form-grid">
                        <div className="resume-field">
                          <label className="resume-field__label">Degree / Certification</label>
                          <input
                            className="resume-field__input"
                            value={edu.degree}
                            onChange={(e) => updateEdu(edu._key, 'degree', e.target.value)}
                            placeholder="B.S. Computer Science"
                          />
                        </div>
                        <div className="resume-field">
                          <label className="resume-field__label">Institution</label>
                          <input
                            className="resume-field__input"
                            value={edu.institution}
                            onChange={(e) => updateEdu(edu._key, 'institution', e.target.value)}
                            placeholder="University Name"
                          />
                        </div>
                        <div className="resume-field">
                          <label className="resume-field__label">Field of Study</label>
                          <input
                            className="resume-field__input"
                            value={edu.field_of_study}
                            onChange={(e) => updateEdu(edu._key, 'field_of_study', e.target.value)}
                            placeholder="e.g. Computer Science"
                          />
                        </div>
                        <div className="resume-field">
                          <label className="resume-field__label">Start Date</label>
                          <input
                            className="resume-field__input"
                            type="month"
                            value={edu.startDate}
                            onChange={(e) => updateEdu(edu._key, 'startDate', e.target.value)}
                          />
                        </div>
                        <div className="resume-field">
                          <label className="resume-field__label">End Date</label>
                          <input
                            className="resume-field__input"
                            type="month"
                            value={edu.endDate}
                            onChange={(e) => updateEdu(edu._key, 'endDate', e.target.value)}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="profile-exp-view">
                        <div className="profile-exp-view__meta">
                          {edu.field_of_study && <span>{edu.field_of_study}</span>}
                          {(edu.startDate || edu.endDate) && (
                            <span>
                              {formatDate(edu.startDate)} — {formatDate(edu.endDate)}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* ── Skills ──────────────────────────────────────────────────── */}
            {activeSection === 'Skills' && (
              <div className="profile-section">
                <div
                  className="profile-section__header content-stagger-item"
                  style={{ '--stagger-index': 2 } as React.CSSProperties}
                >
                  <div className="profile-section__title">Skills</div>
                </div>
                <div
                  className="profile-block content-stagger-item"
                  style={{ '--stagger-index': 3 } as React.CSSProperties}
                >
                  <div className="skills-input-row">
                    <input
                      className="resume-field__input"
                      placeholder="Add a skill (e.g. React) and press Enter"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addSkill()
                        }
                      }}
                    />
                    <button
                      className="btn btn--primary btn--sm"
                      onClick={addSkill}
                      disabled={isSaving}
                    >
                      Add
                    </button>
                  </div>

                  <div className="skills-wrap">
                    {form.skills.map((sk) => (
                      <div className="skill-item" key={sk}>
                        {sk}
                        <button
                          className="skill-item__remove"
                          disabled={isSaving}
                          onClick={() => removeSkill(sk)}
                          aria-label={`Remove ${sk}`}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>

                  {form.skills.length === 0 && (
                    <div className="profile-empty">No skills added yet.</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showResumeImportModal ? (
        <ResumeImportModal
          currentProfile={profileResp?.data ?? null}
          onClose={() => setShowResumeImportModal(false)}
        />
      ) : null}

      {avatarCropDraft ? (
        <div
          className={`modal-backdrop modal-backdrop--animated${isAvatarCropModalClosing ? ' modal-backdrop--closing' : ''}`}
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget && !isSubmittingCroppedAvatar) {
              closeAvatarCropModal()
            }
          }}
        >
          <div
            className="modal modal--cropper"
            role="dialog"
            aria-modal="true"
            aria-labelledby="avatar-crop-title"
          >
            <div className="modal__header">
              <div className="modal__title" id="avatar-crop-title">
                Crop Photo
              </div>
              <button
                className="modal__close"
                disabled={isSubmittingCroppedAvatar}
                onClick={closeAvatarCropModal}
                type="button"
                aria-label="Close crop dialog"
              >
                <X size={18} />
              </button>
            </div>
            <div className="modal__body">
              <div className="avatar-cropper">
                <div
                  className="avatar-cropper__viewport"
                  style={
                    {
                      aspectRatio: `${avatarCropDraft.naturalWidth} / ${avatarCropDraft.naturalHeight}`,
                      '--cropper-ratio':
                        avatarCropDraft.naturalWidth / avatarCropDraft.naturalHeight,
                    } as React.CSSProperties
                  }
                >
                  <Cropper
                    image={avatarCropDraft.sourceUrl}
                    crop={avatarCrop}
                    zoom={avatarZoom}
                    aspect={1}
                    cropShape="round"
                    showGrid={false}
                    onCropChange={setAvatarCrop}
                    onZoomChange={setAvatarZoom}
                    onCropComplete={(_, croppedAreaPixels) => {
                      setAvatarCroppedAreaPixels(croppedAreaPixels)
                    }}
                  />
                </div>
                <div className="avatar-cropper__controls">
                  <label className="avatar-cropper__zoom-label" htmlFor="avatar-crop-zoom">
                    Zoom
                  </label>
                  <input
                    id="avatar-crop-zoom"
                    className="avatar-cropper__zoom-input"
                    type="range"
                    min={1}
                    max={3}
                    step={0.1}
                    value={avatarZoom}
                    onChange={(event) => setAvatarZoom(Number(event.target.value))}
                  />
                </div>
              </div>
            </div>
            <div className="modal__footer">
              <button
                className="btn btn--outline btn--primary"
                disabled={isSubmittingCroppedAvatar}
                onClick={closeAvatarCropModal}
                type="button"
              >
                Cancel
              </button>
              <button
                className="btn btn--primary"
                disabled={!avatarCroppedAreaPixels || isSubmittingCroppedAvatar}
                onClick={() => void handleAvatarCropConfirm()}
                type="button"
              >
                {isSubmittingCroppedAvatar ? <ButtonSpinner label="Saving..." /> : 'Done'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Danger Zone */}
      <div className="dash-card dash-card--danger">
        <div className="dash-card__header">
          <div>
            <div className="dash-card__title">Danger Zone</div>
            <div className="dash-card__subtitle">Irreversible actions — proceed with caution.</div>
          </div>
        </div>
        <div className="dash-card__body">
          <div className="danger-zone-row">
            <div className="danger-zone-row__icon" aria-hidden="true">
              <Trash2 size={18} />
            </div>
            <div className="danger-zone-row__copy">
              <div className="danger-zone-row__title">Delete Account</div>
              <div className="danger-zone-row__desc">
                Permanently remove your account, profile, resumes, and all application history. This
                cannot be undone.
              </div>
            </div>
            <button
              type="button"
              className="btn btn--outline btn--danger btn--sm"
              onClick={() => setShowDeleteModal(true)}
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {showDeleteModal && (
        <div className="modal-backdrop modal-backdrop--animated" role="presentation">
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
          >
            <div className="modal__header">
              <h3 className="modal__title" id="delete-account-title">
                Delete Account
              </h3>
              <button
                type="button"
                className="modal__close"
                onClick={() => {
                  setShowDeleteModal(false)
                  setDeleteConfirmText('')
                }}
                aria-label="Close"
                disabled={isDeleting}
              >
                <X size={18} />
              </button>
            </div>
            <div className="modal__body">
              <div className="modal-danger-warning" role="alert">
                <AlertTriangle size={16} aria-hidden="true" />
                <span>This action is permanent and cannot be undone.</span>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text)', lineHeight: 1.6 }}>
                Your account, profile, resume data, and all application history will be permanently
                deleted. You will be immediately signed out.
              </p>
              <div className="resume-field">
                <label className="resume-field__label" htmlFor="delete-confirm-input">
                  Type <strong>DELETE</strong> to confirm
                </label>
                <input
                  id="delete-confirm-input"
                  className="resume-field__input"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  autoComplete="off"
                  autoFocus
                />
              </div>
            </div>
            <div className="modal__footer">
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => {
                  setShowDeleteModal(false)
                  setDeleteConfirmText('')
                }}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn--danger"
                onClick={() => void handleDeleteAccount()}
                disabled={isDeleting || deleteConfirmText !== 'DELETE'}
              >
                {isDeleting ? <ButtonSpinner label="Deleting…" /> : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
