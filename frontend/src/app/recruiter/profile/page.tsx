'use client'

import { useEffect, useRef, useState } from 'react'
import Cropper, { type Area } from 'react-easy-crop'
import { toast } from 'react-toastify'

import { parseApiError } from '@/lib/apiError'
import { createCroppedImageFile } from '@/lib/cropImage'
import { formatBytes, validateImageFile } from '@/lib/mediaValidation'
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
import { BriefcaseBusiness, Camera, Mail, Shield, Trash2, X } from 'lucide-react'

import Avatar from '@/components/common/Avatar'
import ButtonSpinner from '@/components/common/ButtonSpinner'

import { RecruiterProfileDataSkeleton } from './_components/RecruiterProfileSkeletons'

type ProfileForm = {
  full_name: string
}

type PasswordForm = {
  current_password: string
  new_password: string
  confirm_password: string
}

type AvatarCropDraft = {
  sourceUrl: string
  fileName: string
  mimeType: string
  naturalWidth: number
  naturalHeight: number
}

const EMPTY_PASSWORD_FORM: PasswordForm = {
  current_password: '',
  new_password: '',
  confirm_password: '',
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

export default function RecruiterProfilePage() {
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((state) => state.auth)

  const { data: meResp, isLoading, isError, refetch } = useGetMeQuery()
  const { data: companyResp } = useGetMyCompanyQuery()

  const [updateMe, { isLoading: isSavingProfile }] = useUpdateMeMutation()
  const [updateMyAvatar, { isLoading: isUploadingAvatar }] = useUpdateMyAuthAvatarMutation()
  const [removeMyAvatar, { isLoading: isRemovingAvatar }] = useRemoveMyAuthAvatarMutation()
  const [changeMyPassword, { isLoading: isSavingPassword }] = useChangeMyPasswordMutation()

  const [profileForm, setProfileForm] = useState<ProfileForm>({
    full_name: user?.full_name ?? '',
  })
  const [passwordForm, setPasswordForm] = useState<PasswordForm>(EMPTY_PASSWORD_FORM)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const [avatarCropDraft, setAvatarCropDraft] = useState<AvatarCropDraft | null>(null)
  const [avatarCrop, setAvatarCrop] = useState({ x: 0, y: 0 })
  const [avatarZoom, setAvatarZoom] = useState(1)
  const [avatarCroppedAreaPixels, setAvatarCroppedAreaPixels] = useState<Area | null>(null)
  const [isSubmittingCroppedAvatar, setIsSubmittingCroppedAvatar] = useState(false)
  const [isAvatarCropModalClosing, setIsAvatarCropModalClosing] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const avatarCropModalTimeoutRef = useRef<number | null>(null)

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

  async function handleSaveProfile() {
    setProfileError(null)
    setProfileSuccess(false)

    try {
      const response = await updateMe({ full_name: profileForm.full_name }).unwrap()
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

      const response = await updateMyAvatar(formData).unwrap()
      setAvatarPreviewUrl(response.data.avatar_url)
      dispatch(updateUser(response.data))
      closeAvatarCropModal()
      toast.success('Avatar updated.')
    } catch (error: unknown) {
      const parsed = parseApiError(
        error,
        {},
        'We could not update your avatar right now. Please try again.',
      )
      setAvatarError(parsed.message)
      toast.error(parsed.message)
      setIsSubmittingCroppedAvatar(false)
    }
  }

  async function handleAvatarRemove() {
    setAvatarError(null)

    try {
      await removeMyAvatar().unwrap()
      setAvatarPreviewUrl((current) => {
        if (current?.startsWith('blob:')) {
          URL.revokeObjectURL(current)
        }
        return null
      })
      if (user) {
        dispatch(updateUser({ ...user, avatar_url: null }))
      }
      toast.success('Avatar removed.')
    } catch (error: unknown) {
      const message =
        (error as { data?: { message?: string } })?.data?.message ?? 'Failed to remove avatar.'
      setAvatarError(message)
      toast.error(message)
    }
  }

  const me = meResp?.data
  const company = companyResp?.data
  const avatarSrc = avatarPreviewUrl ?? me?.avatar_url ?? user?.avatar_url ?? null
  const displayRole = me?.primary_role === 'recruiter_admin' ? 'Recruiter Admin' : 'Recruiter'
  const companyLabel = company?.name ?? 'No company linked'
  const isAvatarBusy = isUploadingAvatar || isRemovingAvatar || isSubmittingCroppedAvatar

  return (
    <div className="dash-content container container--app-shell">
      <div className="dash-page-header">
        <div className="dash-page-header__left">
          <h2 className="dash-page-header__title">Profile</h2>
          <p className="dash-page-header__subtitle">
            Manage your account details, photo, and password.
          </p>
        </div>
      </div>

      {isLoading ? (
        <RecruiterProfileDataSkeleton />
      ) : isError || !me ? (
        <div className="dash-card">
          <div className="dash-card__body">
            <div className="empty-state">
              <div className="empty-state__title">Unable to load your profile</div>
              <div className="empty-state__desc">
                There was a problem fetching your account details.
              </div>
              <button className="btn btn--primary btn--sm" onClick={() => void refetch()}>
                Try again
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="team-tabs" role="tablist" aria-label="Profile sections">
            <button
              type="button"
              role="tab"
              aria-selected={true}
              className="team-tabs__btn team-tabs__btn--active"
            >
              <span>Profile</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={false}
              className="team-tabs__btn"
              disabled
            >
              <span>Security</span>
            </button>
          </div>

          <div className="profile-layout content-fade-in">
            <aside className="profile-layout__aside">
              <div
                className="profile-aside-card content-stagger-item"
                style={{ '--stagger-index': 0 } as React.CSSProperties}
              >
                <div className="profile-media-control">
                  <Avatar
                    name={me.full_name}
                    src={avatarSrc}
                    seed={me.id}
                    className="profile-aside-card__avatar"
                    sizes="96px"
                  />
                  <div className="profile-media-actions" aria-label="Profile photo actions">
                    <button
                      className="btn btn--secondary btn--sm"
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
                      void handleAvatarSelection(file)
                    }
                    event.currentTarget.value = ''
                  }}
                />
                {avatarError ? <div className="resume-field__error">{avatarError}</div> : null}
                <div className="profile-aside-card__name">{me.full_name}</div>
                <div className="profile-aside-card__headline">{displayRole}</div>
                <div className="profile-media-hint">
                  PNG, JPG, WEBP, GIF up to {formatBytes(5 * 1024 * 1024)}
                </div>
                <div className="profile-aside-card__divider" />
                <div className="profile-aside-card__location">
                  <BriefcaseBusiness size={13} aria-hidden="true" />
                  {companyLabel}
                </div>
                <div className="profile-aside-card__location">
                  <Mail size={13} aria-hidden="true" />
                  {me.email}
                </div>
                <div className="profile-aside-card__location">
                  <Shield size={13} aria-hidden="true" />
                  {me.membership_status === 'active' ? 'Active member' : 'Membership pending'}
                </div>
              </div>
            </aside>

            <div className="profile-layout__main">
              <div className="profile-section">
                <div
                  className="profile-block content-stagger-item"
                  style={{ '--stagger-index': 1 } as React.CSSProperties}
                >
                  <div className="profile-block__header">
                    <div className="profile-block__title">Basic Information</div>
                    <button
                      className="btn btn--primary btn--sm"
                      disabled={isSavingProfile}
                      onClick={() => void handleSaveProfile()}
                      type="button"
                    >
                      Save
                    </button>
                  </div>

                  <div className="resume-form-grid">
                    <div className="resume-field">
                      <label className="resume-field__label" htmlFor="recruiter-full-name">
                        Full Name
                      </label>
                      <input
                        id="recruiter-full-name"
                        className="resume-field__input"
                        value={profileForm.full_name}
                        onChange={(event) =>
                          setProfileForm((prev) => ({ ...prev, full_name: event.target.value }))
                        }
                        placeholder="Your full name"
                        type="text"
                      />
                    </div>

                    <div className="resume-field">
                      <label className="resume-field__label" htmlFor="recruiter-email">
                        Email
                      </label>
                      <input
                        id="recruiter-email"
                        className="resume-field__input"
                        value={me.email}
                        disabled
                        type="email"
                      />
                    </div>
                  </div>

                  {profileError ? <div className="resume-field__error">{profileError}</div> : null}
                  {profileSuccess ? <div className="resume-field__hint">Profile saved.</div> : null}
                </div>

                <div
                  className="profile-block content-stagger-item"
                  style={{ '--stagger-index': 2 } as React.CSSProperties}
                >
                  <div className="profile-block__header">
                    <div className="profile-block__title">Password</div>
                    <button
                      className="btn btn--primary btn--sm"
                      disabled={isSavingPassword}
                      onClick={() => void handleChangePassword()}
                      type="button"
                    >
                      Update password
                    </button>
                  </div>

                  <p className="company-settings__booking-copy company-settings__booking-copy--left">
                    Enter your current password if you already have one. If you signed up with
                    Google, you can leave it blank and set a password now.
                  </p>

                  <div className="resume-form-grid">
                    <div className="resume-field">
                      <label className="resume-field__label" htmlFor="current-password">
                        Current Password
                      </label>
                      <input
                        id="current-password"
                        className="resume-field__input"
                        value={passwordForm.current_password}
                        onChange={(event) =>
                          setPasswordForm((prev) => ({
                            ...prev,
                            current_password: event.target.value,
                          }))
                        }
                        placeholder="Current password"
                        type="password"
                      />
                    </div>
                    <div className="resume-field">
                      <label className="resume-field__label" htmlFor="new-password">
                        New Password
                      </label>
                      <input
                        id="new-password"
                        className="resume-field__input"
                        value={passwordForm.new_password}
                        onChange={(event) =>
                          setPasswordForm((prev) => ({ ...prev, new_password: event.target.value }))
                        }
                        placeholder="New password"
                        type="password"
                      />
                    </div>
                    <div className="resume-field">
                      <label className="resume-field__label" htmlFor="confirm-password">
                        Confirm New Password
                      </label>
                      <input
                        id="confirm-password"
                        className="resume-field__input"
                        value={passwordForm.confirm_password}
                        onChange={(event) =>
                          setPasswordForm((prev) => ({
                            ...prev,
                            confirm_password: event.target.value,
                          }))
                        }
                        placeholder="Confirm new password"
                        type="password"
                      />
                    </div>
                  </div>

                  {passwordError ? (
                    <div className="resume-field__error">{passwordError}</div>
                  ) : null}
                  {passwordSuccess ? (
                    <div className="resume-field__hint">Password saved.</div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

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
                className="btn btn--icon btn--sm"
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
                className="btn btn--secondary"
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
    </div>
  )
}
