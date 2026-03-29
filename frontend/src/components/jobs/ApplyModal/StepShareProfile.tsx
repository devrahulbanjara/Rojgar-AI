import { Lock, ShieldCheck } from 'lucide-react'

import styles from './applyModal.module.scss'

export interface ShareSettingsDraft {
  share_profile_all: boolean
  share_avatar: boolean
  share_email: boolean
  share_phone: boolean
  share_location: boolean
  share_links: boolean
  share_headline_summary: boolean
}

interface StepShareProfileProps {
  onBack: () => void
  onSubmit: () => void
  onToggle: <K extends keyof ShareSettingsDraft>(key: K, value: ShareSettingsDraft[K]) => void
  settings: ShareSettingsDraft
  submitting: boolean
}

const LIMITED_FIELDS: Array<{
  key: keyof ShareSettingsDraft
  label: string
  description: string
}> = [
  {
    key: 'share_avatar',
    label: 'Profile photo',
    description: 'Show your avatar in candidate lists and your detail page.',
  },
  {
    key: 'share_email',
    label: 'Email address',
    description: 'Let recruiters see your email directly from the candidate hub.',
  },
  {
    key: 'share_phone',
    label: 'Phone number',
    description: 'Share your phone number from your profile if you have added one.',
  },
  {
    key: 'share_location',
    label: 'Location',
    description: 'Show your location and availability context from your profile.',
  },
  {
    key: 'share_links',
    label: 'Professional links',
    description: 'Share LinkedIn, GitHub, and portfolio links from your profile.',
  },
  {
    key: 'share_headline_summary',
    label: 'Headline and summary',
    description: 'Share your profile headline and profile summary alongside the resume.',
  },
]

export default function StepShareProfile({
  onBack,
  onSubmit,
  onToggle,
  settings,
  submitting,
}: StepShareProfileProps) {
  return (
    <div className={`${styles.applyModal__body} ${styles.applyModal__shareStep}`}>
      <div className={styles.applyModal__shareHero}>
        <div className={styles.applyModal__shareIcon}>
          <ShieldCheck size={18} />
        </div>
        <div className={styles.applyModal__shareCopy}>
          <p className={styles.applyModal__shareTitle}>Control what recruiters can see</p>
          <p className={styles.applyModal__shareDescription}>
            Your selected resume is always included with this application. These settings only
            control which extra profile details are shown alongside it.
          </p>
        </div>
      </div>

      <div className={styles.applyModal__shareModeCard}>
        <div className={styles.applyModal__shareModeCopy}>
          <div className={styles.applyModal__shareModeTitle}>Share everything helpful</div>
          <p className={styles.applyModal__shareModeDescription}>
            Recommended. Recruiters can see your profile details, links, and contact information in
            addition to the resume you selected.
          </p>
        </div>
        <label className={styles.applyModal__toggle}>
          <input
            checked={settings.share_profile_all}
            onChange={(event) => onToggle('share_profile_all', event.target.checked)}
            type="checkbox"
          />
          <span className={styles.applyModal__toggleTrack}>
            <span className={styles.applyModal__toggleThumb} />
          </span>
        </label>
      </div>

      {!settings.share_profile_all ? (
        <div className={styles.applyModal__shareGrid}>
          {LIMITED_FIELDS.map((field) => (
            <label className={styles.applyModal__shareCard} key={field.key}>
              <div className={styles.applyModal__shareCardCopy}>
                <div className={styles.applyModal__shareCardTitle}>{field.label}</div>
                <p className={styles.applyModal__shareCardDescription}>{field.description}</p>
              </div>
              <label
                className={`${styles.applyModal__toggle} ${
                  field.key === 'share_email' ? styles['applyModal__toggle--locked'] : ''
                }`}
              >
                {field.key === 'share_email' ? (
                  <span className={styles.applyModal__toggleLock} aria-hidden="true">
                    <Lock size={12} />
                  </span>
                ) : null}
                <input
                  checked={settings[field.key]}
                  disabled={field.key === 'share_email'}
                  onChange={(event) => onToggle(field.key, event.target.checked)}
                  type="checkbox"
                />
                <span className={styles.applyModal__toggleTrack}>
                  <span className={styles.applyModal__toggleThumb} />
                </span>
              </label>
            </label>
          ))}
        </div>
      ) : null}

      <div className={styles.applyModal__stepActions}>
        <button className="btn btn--outline btn--primary" onClick={onBack} type="button">
          Back
        </button>
        <button className="btn btn--primary" disabled={submitting} onClick={onSubmit} type="button">
          Submit application
        </button>
      </div>
    </div>
  )
}
