'use client'

import { useRef, useState } from 'react'

import { formatBytes } from '@/lib/mediaValidation'
import { PROFILE_COMPLETION_LABEL, type ProfileCompletionTone } from '@/lib/profileCompletion'
import { Camera, MapPin, Trash2 } from 'lucide-react'

import Avatar from '@/components/common/Avatar'
import AvatarCropModal from '@/components/common/AvatarCropModal/AvatarCropModal'
import { useAvatarPicker } from '@/components/common/AvatarCropModal/useAvatarPicker'

import styles from '../page.module.scss'
import type { FormProfile } from './profileForm'

const AVATAR_SIZE_LIMIT_BYTES = 5 * 1024 * 1024

interface IdentityCardProps {
  form: FormProfile
  displayName: string
  email: string
  avatarSrc: string | null
  userId?: string | null
  isAvatarBusy: boolean
  isSaving: boolean
  completion: number
  completionTone: ProfileCompletionTone
  onUploadAvatar: (file: File) => Promise<void>
  onRemoveAvatar: () => Promise<void>
  onToggleOpenToWork: (next: boolean) => void
}

const TONE_FILL: Record<ProfileCompletionTone, string> = {
  danger: styles.completionFillDanger,
  warning: styles.completionFillWarning,
  success: styles.completionFillSuccess,
}

export default function IdentityCard({
  form,
  displayName,
  email,
  avatarSrc,
  userId,
  isAvatarBusy,
  isSaving,
  completion,
  completionTone,
  onUploadAvatar,
  onRemoveAvatar,
  onToggleOpenToWork,
}: IdentityCardProps) {
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
    <section className={styles.identityCard} aria-label="Profile identity">
      <div className={styles.identityAvatarWrap}>
        <Avatar
          name={displayName}
          src={avatarSrc}
          seed={userId ?? undefined}
          className={styles.identityAvatar}
          sizes="96px"
        />
        <span className={styles.identityAvatarEdit}>
          <button
            type="button"
            className="btn btn--icon btn--sm"
            disabled={isAvatarBusy}
            onClick={() => fileInputRef.current?.click()}
            aria-label={avatarSrc ? 'Replace photo' : 'Upload photo'}
            title={`PNG, JPG, WEBP, GIF up to ${formatBytes(AVATAR_SIZE_LIMIT_BYTES)}`}
          >
            <Camera size={14} />
          </button>
        </span>
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
        <h1 className={styles.identityName}>{displayName}</h1>
        <p className={styles.identityHeadline}>
          {form.headline || 'Add a headline to introduce yourself'}
        </p>
        <div className={styles.identityMeta}>
          {form.location && (
            <span className={styles.identityMetaItem}>
              <MapPin size={13} aria-hidden="true" />
              {form.location}
            </span>
          )}
          <span className={styles.identityMetaItem}>{email}</span>
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

      <div className={styles.identityActions}>
        <button
          type="button"
          className={`${styles.openToWork} ${form.is_open_to_work ? styles.openToWorkActive : ''}`}
          aria-pressed={form.is_open_to_work}
          disabled={isSaving}
          onClick={() => onToggleOpenToWork(!form.is_open_to_work)}
        >
          <span className={styles.openToWorkDot} />
          {form.is_open_to_work ? 'Open to work · On' : 'Open to work · Off'}
        </button>

        <div className={styles.completion}>
          <div className={styles.completionHeader}>
            <span>{PROFILE_COMPLETION_LABEL}</span>
            <span className={styles.completionPct}>{completion}%</span>
          </div>
          <div className={styles.completionBar}>
            <div
              className={`${styles.completionFill} ${TONE_FILL[completionTone]}`}
              style={{ width: `${completion}%` }}
            />
          </div>
        </div>
      </div>

      <AvatarCropModal
        draft={picker.draft}
        busy={busyCrop}
        onCancel={picker.clear}
        onSubmit={handleConfirmCrop}
      />
    </section>
  )
}
