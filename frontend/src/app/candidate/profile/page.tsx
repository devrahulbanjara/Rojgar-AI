'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { useRouter } from 'next/navigation'

import { parseApiError } from '@/lib/apiError'
import { notify } from '@/lib/notify'
import {
  calculateProfileCompletionPercentage,
  getProfileCompletionMeta,
} from '@/lib/profileCompletion'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { useDeleteAccountMutation } from '@/store/services/authApi'
import {
  useGetMyProfileQuery,
  useRemoveMyAvatarMutation,
  useUpdateMyAvatarMutation,
  useUpdateMyProfileMutation,
} from '@/store/services/profileApi'
import { clearCredentials, updateUser } from '@/store/slices/authSlice'

import DangerZoneCard from './_components/DangerZoneCard'
import EducationSection from './_components/EducationSection'
import ExperienceSection from './_components/ExperienceSection'
import IdentityCard from './_components/IdentityCard'
import OverviewSection from './_components/OverviewSection'
import { ProfileDataSkeleton } from './_components/ProfileSkeletons'
import ResumeImportModal from './_components/ResumeImportModal'
import ResumesSection from './_components/ResumesSection'
import SidePanel from './_components/SidePanel'
import SkillsSection from './_components/SkillsSection'
import {
  EMPTY_FORM,
  type FormEducation,
  type FormExperience,
  type FormProfile,
  SECTIONS,
  type Section,
  apiToForm,
  formToApiUpdate,
  uid,
} from './_components/profileForm'
import styles from './page.module.scss'

const OVERVIEW_KEY = 'overview'

export default function ProfilePage() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const user = useAppSelector((state) => state.auth.user)

  const { data: profileResp, isLoading, isError, refetch } = useGetMyProfileQuery()
  const [updateProfile, { isLoading: isSaving }] = useUpdateMyProfileMutation()
  const [updateAvatar, { isLoading: isUploadingAvatar }] = useUpdateMyAvatarMutation()
  const [removeAvatar, { isLoading: isRemovingAvatar }] = useRemoveMyAvatarMutation()
  const [deleteAccount, { isLoading: isDeleting }] = useDeleteAccountMutation()

  const [form, setForm] = useState<FormProfile>(EMPTY_FORM)
  const [activeSection, setActiveSection] = useState<Section>('Overview')
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [skillInput, setSkillInput] = useState('')
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [showResumeImportModal, setShowResumeImportModal] = useState(false)
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    if (profileResp?.data) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm(apiToForm(profileResp.data))
    }
  }, [profileResp])

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl?.startsWith('blob:')) URL.revokeObjectURL(avatarPreviewUrl)
    }
  }, [avatarPreviewUrl])

  const saveProfile = useCallback(
    async (targetForm?: FormProfile) => {
      setSaveError(null)
      setSaveSuccess(false)
      try {
        await updateProfile(formToApiUpdate(targetForm ?? form)).unwrap()
        setSaveSuccess(true)
        window.setTimeout(() => setSaveSuccess(false), 2000)
      } catch (err: unknown) {
        const msg =
          (err as { data?: { message?: string } })?.data?.message ??
          'Failed to save. Please try again.'
        setSaveError(msg)
      }
    },
    [form, updateProfile],
  )

  function set<K extends keyof FormProfile>(key: K, value: FormProfile[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function revertForm() {
    if (profileResp?.data) setForm(apiToForm(profileResp.data))
  }

  // ── Experience helpers ────────────────────────────────────────
  function updateExp(key: string, field: keyof FormExperience, value: string | boolean) {
    set(
      'experiences',
      form.experiences.map((e) => (e._key === key ? { ...e, [field]: value } : e)),
    )
  }

  function addExperience() {
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
    setEditingKey(entry._key)
  }

  async function removeExperience(key: string) {
    const next = form.experiences.filter((e) => e._key !== key)
    if (editingKey === key) setEditingKey(null)
    const nextForm = { ...form, experiences: next }
    setForm(nextForm)
    await saveProfile(nextForm)
  }

  // ── Education helpers ─────────────────────────────────────────
  function updateEdu(key: string, field: keyof FormEducation, value: string) {
    set(
      'educations',
      form.educations.map((e) => (e._key === key ? { ...e, [field]: value } : e)),
    )
  }

  function addEducation() {
    const entry: FormEducation = {
      _key: uid(),
      institution: '',
      degree: '',
      field_of_study: '',
      startDate: '',
      endDate: '',
    }
    set('educations', [...form.educations, entry])
    setEditingKey(entry._key)
  }

  async function removeEducation(key: string) {
    const next = form.educations.filter((e) => e._key !== key)
    if (editingKey === key) setEditingKey(null)
    const nextForm = { ...form, educations: next }
    setForm(nextForm)
    await saveProfile(nextForm)
  }

  // ── Skills helpers ────────────────────────────────────────────
  function addSkill() {
    const s = skillInput.trim()
    if (!s || form.skills.includes(s)) return
    const nextForm = { ...form, skills: [...form.skills, s] }
    setSkillInput('')
    setForm(nextForm)
    void saveProfile(nextForm)
  }

  function removeSkill(skill: string) {
    const nextForm = { ...form, skills: form.skills.filter((s) => s !== skill) }
    setForm(nextForm)
    void saveProfile(nextForm)
  }

  // ── Target roles helpers ──────────────────────────────────────
  function addTargetRole(role: string) {
    if (form.target_roles.includes(role)) return
    const nextForm = { ...form, target_roles: [...form.target_roles, role] }
    setForm(nextForm)
    void saveProfile(nextForm)
  }

  function removeTargetRole(role: string) {
    const nextForm = { ...form, target_roles: form.target_roles.filter((r) => r !== role) }
    setForm(nextForm)
    void saveProfile(nextForm)
  }

  // ── Open-to-work toggle ───────────────────────────────────────
  function toggleOpenToWork(next: boolean) {
    const nextForm = { ...form, is_open_to_work: next }
    setForm(nextForm)
    void saveProfile(nextForm)
    notify.success(next ? "You're now 'Open to Work'!" : 'Open to Work disabled.')
  }

  // ── Avatar handlers ───────────────────────────────────────────
  async function handleUploadAvatar(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    try {
      const response = await updateAvatar(formData).unwrap()
      const updatedAvatarUrl = response.data.avatar_url
      setAvatarPreviewUrl((current) => {
        if (current?.startsWith('blob:')) URL.revokeObjectURL(current)
        return updatedAvatarUrl
      })
      if (user) dispatch(updateUser({ ...user, avatar_url: updatedAvatarUrl }))
      notify.success('Avatar updated.')
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
      notify.error(message)
      throw error
    }
  }

  async function handleRemoveAvatar() {
    try {
      await removeAvatar().unwrap()
      setAvatarPreviewUrl((current) => {
        if (current?.startsWith('blob:')) URL.revokeObjectURL(current)
        return null
      })
      if (user) dispatch(updateUser({ ...user, avatar_url: null }))
      notify.success('Avatar removed.')
    } catch (error) {
      const message =
        (error as { data?: { message?: string } })?.data?.message ?? 'Failed to remove avatar.'
      notify.error(message)
    }
  }

  // ── Delete account ────────────────────────────────────────────
  async function handleDeleteAccount() {
    try {
      await deleteAccount().unwrap()
      dispatch(clearCredentials())
      router.push('/login')
    } catch {
      notify.error('Failed to delete account. Please try again.')
    }
  }

  // ── Derived ───────────────────────────────────────────────────
  const displayName = user?.full_name ?? '—'
  const avatarSrc = avatarPreviewUrl ?? profileResp?.data?.avatar_url ?? user?.avatar_url ?? null
  const isAvatarBusy = isUploadingAvatar || isRemovingAvatar

  const completion = useMemo(() => calculateProfileCompletionPercentage(form), [form])
  const completionMeta = useMemo(() => getProfileCompletionMeta(completion), [completion])

  const statusHint = isSaving
    ? 'Saving…'
    : saveError
      ? saveError
      : saveSuccess
        ? 'Saved ✓'
        : 'Changes saved automatically'

  const statusHintClass = [
    styles.statusHint,
    saveError ? styles.statusHintError : '',
    saveSuccess ? styles.statusHintSuccess : '',
  ]
    .filter(Boolean)
    .join(' ')

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="dash-content container container--app-shell">
      <div className="dash-page-header">
        <div className="dash-page-header__left">
          <h2 className="dash-page-header__title">Your profile</h2>
          <p className="dash-page-header__subtitle">
            Keep this fresh — recruiters see exactly this.
          </p>
        </div>
        <div className="dash-page-header__actions">
          <span className={statusHintClass}>{statusHint}</span>
        </div>
      </div>

      {isLoading ? (
        <ProfileDataSkeleton />
      ) : isError ? (
        <div className={styles.errorState}>
          <p>Failed to load profile.</p>
          <button className="btn btn--primary btn--sm" onClick={() => void refetch()}>
            Retry
          </button>
        </div>
      ) : (
        <div className={styles.page}>
          <IdentityCard
            form={form}
            displayName={displayName}
            email={user?.email ?? '—'}
            avatarSrc={avatarSrc}
            userId={user?.id}
            isAvatarBusy={isAvatarBusy}
            isSaving={isSaving}
            completion={completion}
            completionTone={completionMeta.tone}
            onUploadAvatar={handleUploadAvatar}
            onRemoveAvatar={handleRemoveAvatar}
            onToggleOpenToWork={toggleOpenToWork}
          />

          <div className={styles.layoutGrid}>
            <div className={styles.mainCol}>
              <div className="team-tabs" role="tablist" aria-label="Profile sections">
                {SECTIONS.map((section) => {
                  const isActive = activeSection === section
                  return (
                    <button
                      key={section}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      className={`team-tabs__btn ${isActive ? 'team-tabs__btn--active' : ''}`}
                      onClick={() => {
                        setActiveSection(section)
                        setEditingKey(null)
                      }}
                    >
                      {section}
                    </button>
                  )
                })}
              </div>

              {activeSection === 'Overview' && (
                <OverviewSection
                  form={form}
                  displayName={displayName}
                  email={user?.email ?? '—'}
                  isEditing={editingKey === OVERVIEW_KEY}
                  isSaving={isSaving}
                  onEdit={() => setEditingKey(OVERVIEW_KEY)}
                  onSave={() => {
                    setEditingKey(null)
                    void saveProfile()
                  }}
                  onCancel={() => {
                    revertForm()
                    setEditingKey(null)
                  }}
                  onChange={set}
                />
              )}

              {activeSection === 'Experience' && (
                <ExperienceSection
                  experiences={form.experiences}
                  editingKey={editingKey}
                  isSaving={isSaving}
                  onAdd={addExperience}
                  onEdit={(k) => setEditingKey(k)}
                  onSaveEdit={() => {
                    setEditingKey(null)
                    void saveProfile()
                  }}
                  onCancelEdit={() => {
                    revertForm()
                    setEditingKey(null)
                  }}
                  onRemove={(k) => void removeExperience(k)}
                  onChange={updateExp}
                />
              )}

              {activeSection === 'Education' && (
                <EducationSection
                  educations={form.educations}
                  editingKey={editingKey}
                  isSaving={isSaving}
                  onAdd={addEducation}
                  onEdit={(k) => setEditingKey(k)}
                  onSaveEdit={() => {
                    setEditingKey(null)
                    void saveProfile()
                  }}
                  onCancelEdit={() => {
                    revertForm()
                    setEditingKey(null)
                  }}
                  onRemove={(k) => void removeEducation(k)}
                  onChange={updateEdu}
                />
              )}

              {activeSection === 'Skills' && (
                <SkillsSection
                  skills={form.skills}
                  skillInput={skillInput}
                  isSaving={isSaving}
                  onInputChange={setSkillInput}
                  onAdd={addSkill}
                  onRemove={removeSkill}
                />
              )}

              {activeSection === 'Resumes' && <ResumesSection />}
            </div>

            <div className={styles.sideCol}>
              <SidePanel
                form={form}
                isSaving={isSaving}
                onAddTargetRole={addTargetRole}
                onRemoveTargetRole={removeTargetRole}
                onOpenImport={() => setShowResumeImportModal(true)}
                highlightImport={activeSection === 'Resumes'}
              />
            </div>
          </div>

          <DangerZoneCard isDeleting={isDeleting} onDelete={handleDeleteAccount} />
        </div>
      )}

      {showResumeImportModal && (
        <ResumeImportModal
          currentProfile={profileResp?.data ?? null}
          onClose={() => setShowResumeImportModal(false)}
        />
      )}
    </div>
  )
}
