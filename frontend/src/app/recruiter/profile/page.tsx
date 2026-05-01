'use client'

import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'

import { parseApiError } from '@/lib/apiError'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  useChangeMyPasswordMutation,
  useGetMeQuery,
  useRemoveMyAuthAvatarMutation,
  useUpdateMeMutation,
  useUpdateMyAuthAvatarMutation,
} from '@/store/services/authApi'
import { useGetMyCompanyQuery } from '@/store/services/companyApi'
import { updateUser } from '@/store/slices/authSlice'

import CompanyCard from './_components/CompanyCard'
import RecruiterIdentityCard from './_components/RecruiterIdentityCard'
import { RecruiterProfileDataSkeleton } from './_components/RecruiterProfileSkeletons'
import SecurityCard, { type PasswordForm } from './_components/SecurityCard'
import styles from './page.module.scss'

const EMPTY_PASSWORD_FORM: PasswordForm = {
  current_password: '',
  new_password: '',
  confirm_password: '',
}

export default function RecruiterProfilePage() {
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((state) => state.auth)

  const { data: meResp, isLoading, isError, refetch } = useGetMeQuery()
  const { data: companyResp, isError: isCompanyError } = useGetMyCompanyQuery()

  const [updateMe, { isLoading: isSavingProfile }] = useUpdateMeMutation()
  const [updateMyAvatar, { isLoading: isUploadingAvatar }] = useUpdateMyAuthAvatarMutation()
  const [removeMyAvatar, { isLoading: isRemovingAvatar }] = useRemoveMyAuthAvatarMutation()
  const [changeMyPassword, { isLoading: isSavingPassword }] = useChangeMyPasswordMutation()

  const [fullName, setFullName] = useState<string>(user?.full_name ?? '')
  const [passwordForm, setPasswordForm] = useState<PasswordForm>(EMPTY_PASSWORD_FORM)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    if (meResp?.data) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFullName(meResp.data.full_name)
    }
  }, [meResp])

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl?.startsWith('blob:')) URL.revokeObjectURL(avatarPreviewUrl)
    }
  }, [avatarPreviewUrl])

  async function handleSaveProfile() {
    setProfileError(null)
    setProfileSuccess(false)
    try {
      const response = await updateMe({ full_name: fullName }).unwrap()
      dispatch(updateUser(response.data))
      setProfileSuccess(true)
      toast.success('Profile updated.')
      window.setTimeout(() => setProfileSuccess(false), 2000)
    } catch (error: unknown) {
      const message =
        (error as { data?: { message?: string } })?.data?.message ?? 'Failed to update profile.'
      setProfileError(message)
      toast.error(message)
    }
  }

  async function handleChangePassword() {
    setPasswordError(null)
    setPasswordSuccess(false)

    if (!passwordForm.new_password) {
      setPasswordError('New password is required.')
      return
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordError('Passwords do not match.')
      return
    }

    try {
      await changeMyPassword({
        current_password: passwordForm.current_password || null,
        new_password: passwordForm.new_password,
      }).unwrap()
      setPasswordForm(EMPTY_PASSWORD_FORM)
      setPasswordSuccess(true)
      toast.success('Password updated.')
      window.setTimeout(() => setPasswordSuccess(false), 2000)
    } catch (error: unknown) {
      const message =
        (error as { data?: { message?: string } })?.data?.message ?? 'Failed to update password.'
      setPasswordError(message)
      toast.error(message)
    }
  }

  async function handleUploadAvatar(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    try {
      const response = await updateMyAvatar(formData).unwrap()
      setAvatarPreviewUrl((current) => {
        if (current?.startsWith('blob:')) URL.revokeObjectURL(current)
        return response.data.avatar_url
      })
      dispatch(updateUser(response.data))
      toast.success('Avatar updated.')
    } catch (error) {
      const parsed = parseApiError(
        error,
        {},
        'We could not update your avatar right now. Please try again.',
      )
      toast.error(parsed.message)
      throw error
    }
  }

  async function handleRemoveAvatar() {
    try {
      await removeMyAvatar().unwrap()
      setAvatarPreviewUrl((current) => {
        if (current?.startsWith('blob:')) URL.revokeObjectURL(current)
        return null
      })
      if (user) dispatch(updateUser({ ...user, avatar_url: null }))
      toast.success('Avatar removed.')
    } catch (error: unknown) {
      const message =
        (error as { data?: { message?: string } })?.data?.message ?? 'Failed to remove avatar.'
      toast.error(message)
    }
  }

  const me = meResp?.data
  const company = companyResp?.data
  const avatarSrc = avatarPreviewUrl ?? me?.avatar_url ?? user?.avatar_url ?? null
  const roleLabel = me?.primary_role === 'recruiter_admin' ? 'Recruiter Admin' : 'Recruiter'
  const companyName = isCompanyError
    ? 'Unable to load company'
    : (company?.name ?? 'No company linked')
  const isAvatarBusy = isUploadingAvatar || isRemovingAvatar

  return (
    <div className="dash-content container container--app-shell">
      <div className="dash-page-header">
        <div className="dash-page-header__left">
          <h2 className="dash-page-header__title">Your account</h2>
          <p className="dash-page-header__subtitle">Manage your details, photo, and password.</p>
        </div>
      </div>

      {isLoading ? (
        <RecruiterProfileDataSkeleton />
      ) : isError || !me ? (
        <div className={styles.errorState}>
          <p>Unable to load your profile.</p>
          <button className="btn btn--primary btn--sm" onClick={() => void refetch()}>
            Try again
          </button>
        </div>
      ) : (
        <div className={styles.page}>
          <RecruiterIdentityCard
            fullName={me.full_name}
            email={me.email}
            roleLabel={roleLabel}
            membershipStatus={me.membership_status}
            companyName={companyName}
            avatarSrc={avatarSrc}
            userId={me.id}
            isAvatarBusy={isAvatarBusy}
            isSaving={isSavingProfile}
            inputName={fullName}
            error={profileError}
            success={profileSuccess}
            onChangeName={setFullName}
            onSave={handleSaveProfile}
            onUploadAvatar={handleUploadAvatar}
            onRemoveAvatar={handleRemoveAvatar}
          />

          <SecurityCard
            form={passwordForm}
            isSaving={isSavingPassword}
            error={passwordError}
            success={passwordSuccess}
            onChange={setPasswordForm}
            onSubmit={() => void handleChangePassword()}
          />

          {company && (
            <CompanyCard
              companyName={company.name}
              domain={company.website_url}
              logoUrl={company.logo_url}
              companyId={company.id}
            />
          )}
        </div>
      )}
    </div>
  )
}
