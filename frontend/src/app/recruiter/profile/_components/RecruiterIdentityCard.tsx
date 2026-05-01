'use client'

import { useRef, useState } from 'react'

import { formatBytes } from '@/lib/mediaValidation'
import { BriefcaseBusiness, Camera, Mail, Shield, Trash2 } from 'lucide-react'

import Avatar from '@/components/common/Avatar'
import AvatarCropModal from '@/components/common/AvatarCropModal/AvatarCropModal'
import { useAvatarPicker } from '@/components/common/AvatarCropModal/useAvatarPicker'

import styles from '../page.module.scss'

const AVATAR_SIZE_LIMIT_BYTES = 5 * 1024 * 1024

interface Props {
  fullName: string
  email: string
  roleLabel: string
  membershipStatus: string | null | undefined
  companyName: string
  avatarSrc: string | null
  userId?: string | null
  isAvatarBusy: boolean
  isSaving: boolean
  inputName: string
  error: string | null
  success: boolean
  onChangeName: (value: string) => void
  onSave: () => Promise<void> | void
  onUploadAvatar: (file: File) => Promise<void>
  onRemoveAvatar: () => Promise<void>
}

export default function RecruiterIdentityCard({
  fullName,
  email,
  roleLabel,
  membershipStatus,
  companyName,
  avatarSrc,
  userId,
  isAvatarBusy,
  isSaving,
  inputName,
  error,
  success,
  onChangeName,
  onSave,
  onUploadAvatar,
  onRemoveAvatar,
}: Props) {
  const picker = useAvatarPicker()
  const [busyCrop, setBusyCrop] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleConfirmCrop(file: File) {
    setBusyCrop(true)
    try {
      await onUploadAvatar(file)
      picker.clear()
    } finally {
      setBusyCrop(false)
    }
  }

  return (
    <>
      <section className={styles.identityCard} aria-label="Account identity">
        <div className={styles.avatarWrap}>
          <Avatar
            name={fullName}
            src={avatarSrc}
            seed={userId ?? undefined}
            className={styles.avatar}
            sizes="80px"
          />
          <button
            type="button"
            className={`btn btn--icon btn--sm ${styles.avatarEdit}`}
            disabled={isAvatarBusy}
            onClick={() => fileInputRef.current?.click()}
            aria-label={avatarSrc ? 'Replace photo' : 'Upload photo'}
            title={`PNG, JPG, WEBP, GIF up to ${formatBytes(AVATAR_SIZE_LIMIT_BYTES)}`}
          >
            <Camera size={14} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.gif,image/*"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) void picker.pick(file)
              event.currentTarget.value = ''
            }}
          />
        </div>

        <div className={styles.identityBody}>
          <h1 className={styles.identityName}>{fullName || '—'}</h1>
          <div className={styles.identityMeta}>
            <span className={styles.rolePill}>{roleLabel}</span>
            {membershipStatus && (
              <span className={styles.identityMetaItem}>
                <Shield size={13} aria-hidden="true" />
                {membershipStatus === 'active' ? 'Active member' : 'Membership pending'}
              </span>
            )}
            <span className={styles.identityMetaItem}>
              <Mail size={13} aria-hidden="true" />
              {email}
            </span>
            <span className={styles.identityMetaItem}>
              <BriefcaseBusiness size={13} aria-hidden="true" />
              {companyName}
            </span>
            {avatarSrc && (
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                disabled={isAvatarBusy}
                onClick={() => void onRemoveAvatar()}
              >
                <Trash2 size={13} />
                Remove photo
              </button>
            )}
          </div>
          {picker.error && <div className={styles.fieldError}>{picker.error}</div>}
        </div>
      </section>

      <section className={styles.card} aria-label="Basic information">
        <div className={styles.cardHeader}>
          <div>
            <div className={styles.cardEyebrow}>About you</div>
            <h2 className={styles.cardTitle}>Basic Information</h2>
          </div>
          <button
            type="button"
            className={`btn btn--primary btn--sm${isSaving ? ' btn--loading' : ''}`}
            disabled={isSaving}
            onClick={() => void onSave()}
          >
            Save
          </button>
        </div>

        <div className={styles.fields}>
          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="recruiter-full-name">
              Full Name
            </label>
            <input
              id="recruiter-full-name"
              className={styles.fieldInput}
              value={inputName}
              onChange={(e) => onChangeName(e.target.value)}
              placeholder="Your full name"
              type="text"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="recruiter-email">
              Email
            </label>
            <input
              id="recruiter-email"
              className={styles.fieldInput}
              value={email}
              disabled
              type="email"
            />
          </div>
        </div>

        {error && <div className={styles.fieldError}>{error}</div>}
        {success && <div className={styles.fieldSuccess}>Profile saved.</div>}
      </section>

      <AvatarCropModal
        draft={picker.draft}
        busy={busyCrop}
        onCancel={picker.clear}
        onSubmit={handleConfirmCrop}
      />
    </>
  )
}
