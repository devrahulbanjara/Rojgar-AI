'use client'

import styles from '../page.module.scss'

export interface PasswordForm {
  current_password: string
  new_password: string
  confirm_password: string
}

interface Props {
  form: PasswordForm
  isSaving: boolean
  error: string | null
  success: boolean
  onChange: (next: PasswordForm) => void
  onSubmit: () => void
}

export default function SecurityCard({
  form,
  isSaving,
  error,
  success,
  onChange,
  onSubmit,
}: Props) {
  function update<K extends keyof PasswordForm>(key: K, value: string) {
    onChange({ ...form, [key]: value })
  }

  return (
    <section className={styles.card} aria-label="Password">
      <div className={styles.cardHeader}>
        <div>
          <div className={styles.cardEyebrow}>Security</div>
          <h2 className={styles.cardTitle}>Password</h2>
        </div>
        <button
          type="button"
          className={`btn btn--primary btn--sm${isSaving ? ' btn--loading' : ''}`}
          disabled={isSaving}
          onClick={onSubmit}
        >
          Update password
        </button>
      </div>

      <p className={styles.cardCopy}>
        Enter your current password if you already have one. If you signed up with Google, leave it
        blank to set a password now.
      </p>

      <div className={styles.fields}>
        <div className={styles.field}>
          <label className={styles.fieldLabel} htmlFor="current-password">
            Current Password
          </label>
          <input
            id="current-password"
            className={styles.fieldInput}
            value={form.current_password}
            onChange={(e) => update('current_password', e.target.value)}
            placeholder="Current password"
            type="password"
            autoComplete="current-password"
          />
        </div>
        <div className={styles.field}>
          <label className={styles.fieldLabel} htmlFor="new-password">
            New Password
          </label>
          <input
            id="new-password"
            className={styles.fieldInput}
            value={form.new_password}
            onChange={(e) => update('new_password', e.target.value)}
            placeholder="New password"
            type="password"
            autoComplete="new-password"
          />
        </div>
        <div className={`${styles.field} ${styles.fieldsSingle}`}>
          <label className={styles.fieldLabel} htmlFor="confirm-password">
            Confirm New Password
          </label>
          <input
            id="confirm-password"
            className={styles.fieldInput}
            value={form.confirm_password}
            onChange={(e) => update('confirm_password', e.target.value)}
            placeholder="Confirm new password"
            type="password"
            autoComplete="new-password"
          />
        </div>
      </div>

      {error && <div className={styles.fieldError}>{error}</div>}
      {success && <div className={styles.fieldSuccess}>Password saved.</div>}
    </section>
  )
}
