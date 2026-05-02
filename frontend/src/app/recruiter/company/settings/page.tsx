'use client'

import { useEffect, useRef, useState } from 'react'
import Cropper, { type Area } from 'react-easy-crop'

import { parseApiError } from '@/lib/apiError'
import { createCroppedImageFile } from '@/lib/cropImage'
import { formatBytes, validateImageFile } from '@/lib/mediaValidation'
import { notify } from '@/lib/notify'
import { useAppSelector } from '@/store/hooks'
import {
  useGetMyCompanyQuery,
  useRemoveCompanyLogoMutation,
  useUpdateCompanyMutation,
  useUploadCompanyLogoMutation,
} from '@/store/services/companyApi'
import { Camera, MapPin, Trash2, X } from 'lucide-react'

import Avatar from '@/components/common/Avatar'

import { CompanySettingsDataSkeleton } from './_components/CompanySettingsSkeletons'

type CompanyForm = {
  name: string
  industry: string
  company_size: string
  location: string
  website_url: string
  cal_booking_url: string
  cal_organizer_email: string
  description: string
}

const EMPTY_FORM: CompanyForm = {
  name: '',
  industry: '',
  company_size: '',
  location: '',
  website_url: '',
  cal_booking_url: '',
  cal_organizer_email: '',
  description: '',
}

type LogoCropDraft = {
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

export default function CompanySettingsPage() {
  const { user } = useAppSelector((state) => state.auth)
  const isCompanyAdmin = user?.primary_role === 'recruiter_admin'
  const isReadOnly = !isCompanyAdmin

  const { data: companyResp, isLoading, isError, refetch } = useGetMyCompanyQuery()

  const [updateCompany, { isLoading: isSaving }] = useUpdateCompanyMutation()
  const [uploadLogo, { isLoading: isUploadingLogo }] = useUploadCompanyLogoMutation()
  const [removeLogo, { isLoading: isRemovingLogo }] = useRemoveCompanyLogoMutation()

  const [form, setForm] = useState<CompanyForm>(EMPTY_FORM)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null)
  const [logoError, setLogoError] = useState<string | null>(null)
  const [logoCropDraft, setLogoCropDraft] = useState<LogoCropDraft | null>(null)
  const [logoCrop, setLogoCrop] = useState({ x: 0, y: 0 })
  const [logoZoom, setLogoZoom] = useState(1)
  const [logoCroppedAreaPixels, setLogoCroppedAreaPixels] = useState<Area | null>(null)
  const [isSubmittingCroppedLogo, setIsSubmittingCroppedLogo] = useState(false)
  const [isLogoCropModalClosing, setIsLogoCropModalClosing] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const logoCropModalTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    if (companyResp?.data) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        name: companyResp.data.name ?? '',
        industry: companyResp.data.industry ?? '',
        company_size: companyResp.data.company_size ?? '',
        location: companyResp.data.location ?? '',
        website_url: companyResp.data.website_url ?? '',
        cal_booking_url: companyResp.data.cal_booking_url ?? '',
        cal_organizer_email: companyResp.data.cal_organizer_email ?? '',
        description: companyResp.data.description ?? '',
      })
    }
  }, [companyResp])

  useEffect(() => {
    return () => {
      if (logoPreviewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(logoPreviewUrl)
      }
    }
  }, [logoPreviewUrl])

  useEffect(() => {
    return () => {
      if (logoCropModalTimeoutRef.current) {
        window.clearTimeout(logoCropModalTimeoutRef.current)
      }
      if (logoCropDraft?.sourceUrl.startsWith('blob:')) {
        URL.revokeObjectURL(logoCropDraft.sourceUrl)
      }
    }
  }, [logoCropDraft])

  async function handleSave() {
    setSaveError(null)
    setSaveSuccess(false)

    try {
      await updateCompany({
        name: form.name || null,
        industry: form.industry || null,
        company_size: form.company_size || null,
        location: form.location || null,
        website_url: form.website_url || null,
        cal_booking_url: form.cal_booking_url || null,
        cal_organizer_email: form.cal_organizer_email || null,
        description: form.description || null,
      }).unwrap()
      setSaveSuccess(true)
      notify.success('Company details updated.')
      setTimeout(() => setSaveSuccess(false), 2000)
    } catch (error: unknown) {
      const message =
        (error as { data?: { message?: string } })?.data?.message ??
        'Failed to update company details.'
      setSaveError(message)
      notify.error(message)
    }
  }

  function finalizeLogoCropModalClose() {
    setLogoCropDraft(null)
    setLogoCrop({ x: 0, y: 0 })
    setLogoZoom(1)
    setLogoCroppedAreaPixels(null)
    setIsSubmittingCroppedLogo(false)
    setIsLogoCropModalClosing(false)
    logoCropModalTimeoutRef.current = null
  }

  function closeLogoCropModal() {
    if (isLogoCropModalClosing) return
    setIsLogoCropModalClosing(true)
    if (logoCropModalTimeoutRef.current) {
      window.clearTimeout(logoCropModalTimeoutRef.current)
    }
    logoCropModalTimeoutRef.current = window.setTimeout(() => {
      finalizeLogoCropModalClose()
    }, 200)
  }

  async function handleLogoSelection(file: File) {
    const validationError = validateImageFile(file)
    if (validationError) {
      setLogoError(validationError)
      notify.error(validationError)
      return
    }

    setLogoError(null)
    const sourceUrl = URL.createObjectURL(file)

    try {
      const { naturalWidth, naturalHeight } = await readImageDimensions(sourceUrl)

      if (logoCropModalTimeoutRef.current) {
        window.clearTimeout(logoCropModalTimeoutRef.current)
        logoCropModalTimeoutRef.current = null
      }

      setIsLogoCropModalClosing(false)
      setLogoCropDraft((current) => {
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
      setLogoCrop({ x: 0, y: 0 })
      setLogoZoom(1)
      setLogoCroppedAreaPixels(null)
    } catch {
      URL.revokeObjectURL(sourceUrl)
      const message = 'We could not open that image for cropping. Please try another file.'
      setLogoError(message)
      notify.error(message)
    }
  }

  async function handleLogoCropConfirm() {
    if (!logoCropDraft || !logoCroppedAreaPixels) {
      setLogoError('Select the visible area you want to save first.')
      return
    }

    setLogoError(null)
    setIsSubmittingCroppedLogo(true)

    try {
      const croppedFile = await createCroppedImageFile({
        src: logoCropDraft.sourceUrl,
        crop: logoCroppedAreaPixels,
        fileName: logoCropDraft.fileName,
        mimeType: logoCropDraft.mimeType,
      })

      const formData = new FormData()
      formData.append('file', croppedFile)

      const response = await uploadLogo(formData).unwrap()
      const updatedLogoUrl = response.data.logo_url

      setLogoPreviewUrl((current) => {
        if (current?.startsWith('blob:')) {
          URL.revokeObjectURL(current)
        }
        return updatedLogoUrl
      })

      closeLogoCropModal()
      notify.success('Company logo updated.')
    } catch (error: unknown) {
      const parsed = parseApiError(
        error,
        {},
        'We could not update your company logo right now. Please try again.',
      )
      const message =
        typeof parsed.status === 'number' && parsed.status >= 500
          ? 'We could not update your company logo right now. Please try again.'
          : parsed.message
      setLogoError(message)
      notify.error(message)
      setIsSubmittingCroppedLogo(false)
    }
  }

  async function handleRemoveLogo() {
    setLogoError(null)

    try {
      await removeLogo().unwrap()
      setLogoPreviewUrl((current) => {
        if (current?.startsWith('blob:')) {
          URL.revokeObjectURL(current)
        }
        return null
      })
      notify.success('Company logo removed.')
    } catch (error: unknown) {
      const message =
        (error as { data?: { message?: string } })?.data?.message ?? 'Failed to remove logo.'
      setLogoError(message)
      notify.error(message)
    }
  }

  const company = companyResp?.data
  const companyName = form.name || company?.name || 'Your Company'
  const logoSrc = logoPreviewUrl ?? company?.logo_url ?? null
  const isWorking = isSaving || isUploadingLogo || isRemovingLogo || isSubmittingCroppedLogo

  return (
    <div className="dash-content container container--app-shell">
      <div className="dash-page-header">
        <div className="dash-page-header__left">
          <h2 className="dash-page-header__title">Company Settings</h2>
          <p className="dash-page-header__subtitle">
            {isReadOnly
              ? 'View your company profile and hiring brand settings.'
              : 'Update your public company profile and hiring brand assets.'}
          </p>
        </div>
        <div className="dash-page-header__actions">
          <span
            className={`page-header-hint${
              saveError
                ? ' page-header-hint--error'
                : saveSuccess
                  ? ' page-header-hint--success'
                  : ''
            }`}
          >
            {isReadOnly
              ? 'View only'
              : isSaving
                ? 'Saving…'
                : saveError
                  ? saveError
                  : saveSuccess
                    ? 'Saved ✓'
                    : 'Save to apply changes'}
          </span>
        </div>
      </div>

      {isLoading ? (
        <CompanySettingsDataSkeleton />
      ) : isError || !company ? (
        <div className="dash-card">
          <div className="dash-card__body">
            <div className="empty-state">
              <div className="empty-state__title">Unable to load company settings</div>
              <div className="empty-state__desc">
                There was a problem fetching your company profile.
              </div>
              <button
                className="btn btn--primary btn--sm"
                onClick={() => void refetch()}
                type="button"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="profile-layout content-fade-in">
          <aside className="profile-layout__aside">
            <div
              className="profile-aside-card content-stagger-item"
              style={{ '--stagger-index': 0 } as React.CSSProperties}
            >
              <div className="profile-media-control">
                <Avatar
                  name={companyName}
                  src={logoSrc}
                  seed={company?.id ?? companyName}
                  kind="company"
                  className="profile-aside-card__avatar"
                  sizes="96px"
                />
                <div className="profile-media-actions" aria-label="Company logo actions">
                  <button
                    className="btn btn--secondary btn--sm"
                    disabled={isWorking || isReadOnly}
                    onClick={() => logoInputRef.current?.click()}
                    title={`PNG, JPG, WEBP, GIF up to ${formatBytes(5 * 1024 * 1024)}`}
                    type="button"
                  >
                    <Camera size={14} />
                    <span>{logoSrc ? 'Replace' : 'Upload'}</span>
                  </button>
                  <button
                    className="btn btn--danger btn--sm"
                    disabled={!logoSrc || isWorking || isReadOnly}
                    onClick={() => void handleRemoveLogo()}
                    type="button"
                  >
                    <Trash2 size={14} />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
              <input
                ref={logoInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.gif,image/*"
                hidden
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) {
                    void handleLogoSelection(file)
                  }
                  event.currentTarget.value = ''
                }}
              />
              {logoError ? <div className="resume-field__error">{logoError}</div> : null}
              <div className="profile-aside-card__name">{companyName}</div>
              <div className="profile-aside-card__headline">
                {company.industry || 'Company profile'}
              </div>
              <div className="profile-media-hint">
                PNG, JPG, WEBP, GIF up to {formatBytes(5 * 1024 * 1024)}
              </div>
              {company.location && (
                <div className="profile-aside-card__location">
                  <MapPin size={13} aria-hidden="true" />
                  {company.location}
                </div>
              )}
              <div className="profile-aside-card__divider" />
              <div className="profile-block__title">Interview Booking</div>
              <p className="company-settings__booking-copy">
                Add your company&apos;s Cal link and organizer email.
              </p>
              <div className="resume-field company-settings__booking-field">
                <label className="resume-field__label" htmlFor="company-cal-booking-url">
                  Cal Booking Link
                </label>
                <input
                  id="company-cal-booking-url"
                  className="resume-field__input"
                  value={form.cal_booking_url}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, cal_booking_url: event.target.value }))
                  }
                  placeholder="https://cal.com/company-name/interview"
                  disabled={isReadOnly}
                  type="url"
                />
              </div>
              <div className="resume-field company-settings__booking-field">
                <label className="resume-field__label" htmlFor="company-cal-organizer-email">
                  Cal Organizer Email
                </label>
                <input
                  id="company-cal-organizer-email"
                  className="resume-field__input"
                  value={form.cal_organizer_email}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      cal_organizer_email: event.target.value,
                    }))
                  }
                  placeholder={user?.email ?? 'organizer@company.com'}
                  disabled={isReadOnly}
                  type="email"
                />
              </div>
              <div className="profile-aside-card__actions">
                <button
                  className={`btn btn--primary btn--sm${isSaving ? ' btn--loading' : ''}`}
                  disabled={isWorking || isReadOnly}
                  onClick={() => void handleSave()}
                  type="button"
                >
                  {isReadOnly ? 'Read only' : isSaving ? 'Saving...' : 'Save'}
                </button>
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
                  <div className="profile-block__title">Company Information</div>
                  <button
                    className="btn btn--primary btn--sm"
                    disabled={isWorking || isReadOnly}
                    onClick={() => void handleSave()}
                    type="button"
                  >
                    {isReadOnly ? 'Read only' : 'Save'}
                  </button>
                </div>

                <div className="resume-form-grid">
                  <div className="resume-field">
                    <label className="resume-field__label" htmlFor="company-name">
                      Company Name
                    </label>
                    <input
                      id="company-name"
                      className="resume-field__input"
                      value={form.name}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, name: event.target.value }))
                      }
                      placeholder="ConvexHire"
                      disabled={isReadOnly}
                      type="text"
                    />
                  </div>

                  <div className="resume-field">
                    <label className="resume-field__label" htmlFor="company-industry">
                      Industry
                    </label>
                    <input
                      id="company-industry"
                      className="resume-field__input"
                      value={form.industry}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, industry: event.target.value }))
                      }
                      placeholder="Human Resources Technology"
                      disabled={isReadOnly}
                      type="text"
                    />
                  </div>

                  <div className="resume-field">
                    <label className="resume-field__label" htmlFor="company-size">
                      Company Size
                    </label>
                    <input
                      id="company-size"
                      className="resume-field__input"
                      value={form.company_size}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, company_size: event.target.value }))
                      }
                      placeholder="51-200 employees"
                      disabled={isReadOnly}
                      type="text"
                    />
                  </div>

                  <div className="resume-field">
                    <label className="resume-field__label" htmlFor="company-location">
                      Location
                    </label>
                    <input
                      id="company-location"
                      className="resume-field__input"
                      value={form.location}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, location: event.target.value }))
                      }
                      placeholder="Bengaluru, India"
                      disabled={isReadOnly}
                      type="text"
                    />
                  </div>
                </div>

                <div className="resume-field">
                  <label className="resume-field__label" htmlFor="company-description">
                    Description
                  </label>
                  <textarea
                    id="company-description"
                    className="resume-field__textarea"
                    value={form.description}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, description: event.target.value }))
                    }
                    placeholder="Tell candidates what your company does, how it hires, and why they should care."
                    disabled={isReadOnly}
                    rows={6}
                  />
                </div>

                <div className="resume-field">
                  <label className="resume-field__label" htmlFor="company-website">
                    Website
                  </label>
                  <input
                    id="company-website"
                    className="resume-field__input"
                    value={form.website_url}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, website_url: event.target.value }))
                    }
                    placeholder="https://example.com"
                    disabled={isReadOnly}
                    type="url"
                  />
                </div>

                {saveError ? <div className="resume-field__error">{saveError}</div> : null}
              </div>
            </div>
          </div>
        </div>
      )}

      {logoCropDraft ? (
        <div
          className={`modal-backdrop modal-backdrop--animated${isLogoCropModalClosing ? ' modal-backdrop--closing' : ''}`}
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget && !isSubmittingCroppedLogo) {
              closeLogoCropModal()
            }
          }}
        >
          <div
            className="modal modal--cropper"
            role="dialog"
            aria-modal="true"
            aria-labelledby="logo-crop-title"
          >
            <div className="modal__header">
              <div className="modal__title" id="logo-crop-title">
                Crop Logo
              </div>
              <button
                className="btn btn--icon btn--sm"
                disabled={isSubmittingCroppedLogo}
                onClick={closeLogoCropModal}
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
                      aspectRatio: `${logoCropDraft.naturalWidth} / ${logoCropDraft.naturalHeight}`,
                      '--cropper-ratio': logoCropDraft.naturalWidth / logoCropDraft.naturalHeight,
                    } as React.CSSProperties
                  }
                >
                  <Cropper
                    image={logoCropDraft.sourceUrl}
                    crop={logoCrop}
                    zoom={logoZoom}
                    aspect={1}
                    cropShape="rect"
                    showGrid={false}
                    onCropChange={setLogoCrop}
                    onZoomChange={setLogoZoom}
                    onCropComplete={(_, croppedAreaPixels) => {
                      setLogoCroppedAreaPixels(croppedAreaPixels)
                    }}
                  />
                </div>
                <div className="avatar-cropper__controls">
                  <label className="avatar-cropper__zoom-label" htmlFor="logo-crop-zoom">
                    Zoom
                  </label>
                  <input
                    id="logo-crop-zoom"
                    className="avatar-cropper__zoom-input"
                    type="range"
                    min={1}
                    max={3}
                    step={0.1}
                    value={logoZoom}
                    onChange={(event) => setLogoZoom(Number(event.target.value))}
                  />
                </div>
              </div>
            </div>
            <div className="modal__footer">
              <button
                className="btn btn--secondary"
                disabled={isSubmittingCroppedLogo}
                onClick={closeLogoCropModal}
                type="button"
              >
                Cancel
              </button>
              <button
                className={`btn btn--primary${isSubmittingCroppedLogo ? ' btn--loading' : ''}`}
                disabled={!logoCroppedAreaPixels || isSubmittingCroppedLogo}
                onClick={() => void handleLogoCropConfirm()}
                type="button"
              >
                {isSubmittingCroppedLogo ? 'Saving...' : 'Done'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
