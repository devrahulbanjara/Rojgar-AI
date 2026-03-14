'use client'

import { useEffect, useRef, useState } from 'react'
import Cropper, { type Area } from 'react-easy-crop'
import { toast } from 'react-toastify'

import { parseApiError } from '@/lib/apiError'
import { createCroppedImageFile } from '@/lib/cropImage'
import { formatBytes, getInitials, validateImageFile } from '@/lib/mediaValidation'
import { useAppSelector } from '@/store/hooks'
import {
  useGetMyCompanyQuery,
  useRemoveCompanyLogoMutation,
  useUpdateCompanyMutation,
  useUploadCompanyLogoMutation,
} from '@/store/services/companyApi'
import { Building2, Camera, Globe, MapPin, Save, Trash2, X } from 'lucide-react'

import MediaBadge from '@/components/common/MediaBadge'

type CompanyForm = {
  name: string
  industry: string
  company_size: string
  location: string
  website_url: string
  description: string
}

const EMPTY_FORM: CompanyForm = {
  name: '',
  industry: '',
  company_size: '',
  location: '',
  website_url: '',
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

  const {
    data: companyResp,
    isLoading,
    isError,
    refetch,
  } = useGetMyCompanyQuery(undefined, {
    skip: !isCompanyAdmin,
  })

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
        description: form.description || null,
      }).unwrap()
      setSaveSuccess(true)
      toast.success('Company details updated.')
      setTimeout(() => setSaveSuccess(false), 2000)
    } catch (error: unknown) {
      const message =
        (error as { data?: { message?: string } })?.data?.message ??
        'Failed to update company details.'
      setSaveError(message)
      toast.error(message)
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
      toast.error(validationError)
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
      toast.error(message)
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
      toast.success('Company logo updated.')
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
      toast.error(message)
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
      toast.success('Company logo removed.')
    } catch (error: unknown) {
      const message =
        (error as { data?: { message?: string } })?.data?.message ?? 'Failed to remove logo.'
      setLogoError(message)
      toast.error(message)
    }
  }

  if (!isCompanyAdmin) {
    return (
      <div className="dash-content container container--app-shell">
        <div className="dash-card">
          <div className="dash-card__body">
            <div className="empty-state">
              <div className="empty-state__icon">
                <Building2 size={22} />
              </div>
              <div className="empty-state__title">Company settings are admin-only</div>
              <div className="empty-state__desc">
                Ask a recruiter admin to update company branding and profile details.
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="dash-content container container--app-shell">
        <div className="dash-card dash-card--loading">
          <div className="dash-card__body">Loading company settings...</div>
        </div>
      </div>
    )
  }

  if (isError || !companyResp?.data) {
    return (
      <div className="dash-content container container--app-shell">
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
      </div>
    )
  }

  const company = companyResp.data
  const companyName = form.name || company.name || 'Your Company'
  const logoSrc = logoPreviewUrl ?? company.logo_url ?? null
  const isWorking = isSaving || isUploadingLogo || isRemovingLogo || isSubmittingCroppedLogo

  return (
    <div className="dash-content container container--app-shell">
      <div className="dash-page-header">
        <div className="dash-page-header__left">
          <h2 className="dash-page-header__title">Company Settings</h2>
          <p className="dash-page-header__subtitle">
            Update your public company profile and hiring brand assets.
          </p>
        </div>
        <div className="dash-page-header__actions">
          <button
            className="btn btn--primary btn--icon-right"
            disabled={isWorking}
            onClick={() => void handleSave()}
            type="button"
          >
            Save Changes
            <Save size={16} />
          </button>
        </div>
      </div>

      <div className="profile-layout">
        <aside className="profile-layout__aside">
          <div className="profile-aside-card">
            <div className="profile-media-control profile-media-control--rounded">
              <MediaBadge
                src={logoSrc}
                alt={companyName}
                fallback={getInitials(companyName, 'C').slice(0, 1)}
                className="profile-aside-card__avatar profile-aside-card__avatar--rounded"
                sizes="96px"
              />
              <div className="profile-media-actions" aria-label="Company logo actions">
                <button
                  className="btn btn--outline btn--sm"
                  disabled={isWorking}
                  onClick={() => logoInputRef.current?.click()}
                  title={`PNG, JPG, WEBP, GIF up to ${formatBytes(5 * 1024 * 1024)}`}
                  type="button"
                >
                  <Camera size={14} />
                  <span>{logoSrc ? 'Replace' : 'Upload'}</span>
                </button>
                <button
                  className="btn btn--danger btn--sm"
                  disabled={!logoSrc || isWorking}
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
            <div className="profile-aside-card__title">{company.industry || 'Company profile'}</div>
            <div className="profile-meta-list">
              <div className="profile-meta-row">
                <Building2 size={14} />
                <span>{company.company_size || 'Size not specified'}</span>
              </div>
              <div className="profile-meta-row">
                <MapPin size={14} />
                <span>{company.location || 'Location not specified'}</span>
              </div>
              <div className="profile-meta-row">
                <Globe size={14} />
                <span>{company.website_url || 'Website not specified'}</span>
              </div>
            </div>
          </div>
        </aside>

        <section className="profile-layout__main">
          <div className="dash-card">
            <div className="dash-card__header">
              <div>
                <div className="dash-card__title">Company Profile</div>
                <div className="dash-card__subtitle">
                  These details appear across company-facing candidate experiences.
                </div>
              </div>
            </div>

            <div className="dash-card__body">
              <div className="resume-form-grid">
                <div className="resume-field">
                  <label className="resume-field__label" htmlFor="company-name">
                    Company Name
                  </label>
                  <input
                    id="company-name"
                    className="resume-field__input"
                    value={form.name}
                    onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                    placeholder="ConvexHire"
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
                    type="text"
                  />
                </div>

                <div className="resume-field resume-field--full">
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
                    type="url"
                  />
                </div>

                <div className="resume-field resume-field--full">
                  <label className="resume-field__label" htmlFor="company-description">
                    Description
                  </label>
                  <textarea
                    id="company-description"
                    className="resume-field__input resume-field__textarea"
                    value={form.description}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, description: event.target.value }))
                    }
                    placeholder="Tell candidates what your company does, how it hires, and why they should care."
                    rows={6}
                  />
                </div>
              </div>

              {saveError ? <div className="resume-field__error">{saveError}</div> : null}
              {saveSuccess ? (
                <div className="resume-field__hint">Changes saved successfully.</div>
              ) : null}
            </div>
          </div>
        </section>
      </div>

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
                className="modal__close"
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
                className="btn btn--outline btn--primary"
                disabled={isSubmittingCroppedLogo}
                onClick={closeLogoCropModal}
                type="button"
              >
                Cancel
              </button>
              <button
                className="btn btn--primary"
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
