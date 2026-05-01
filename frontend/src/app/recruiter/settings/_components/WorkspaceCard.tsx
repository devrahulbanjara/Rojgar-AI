'use client'

import styles from '../page.module.scss'
import type { SettingsForm } from './settingsForm'

interface Props {
  form: SettingsForm
  onChange: (next: SettingsForm) => void
}

export default function WorkspaceCard({ form, onChange }: Props) {
  function update<K extends keyof SettingsForm>(key: K, value: SettingsForm[K]) {
    onChange({ ...form, [key]: value })
  }

  return (
    <section className={styles.card} aria-label="Workspace defaults">
      <div className={styles.cardHeader}>
        <div>
          <div className={styles.cardEyebrow}>Your account</div>
          <h2 className={styles.cardTitle}>Workspace defaults</h2>
        </div>
      </div>

      <p className={styles.cardCopy}>
        These settings only apply to you. Company-wide defaults live in company settings.
      </p>

      <div className={styles.fields}>
        <div className={styles.field}>
          <label className={styles.fieldLabel} htmlFor="recruiter-timezone">
            Timezone
          </label>
          <input
            id="recruiter-timezone"
            className={styles.fieldInput}
            value={form.timezone}
            onChange={(e) => update('timezone', e.target.value)}
            placeholder="Asia/Kathmandu"
            autoComplete="off"
          />
          <span className={styles.fieldHint}>Used to render times across the app.</span>
        </div>

        <div className={styles.field}>
          <label className={styles.fieldLabel} htmlFor="recruiter-chat-scope">
            Recruiter chat default scope
          </label>
          <select
            id="recruiter-chat-scope"
            className={styles.fieldSelect}
            value={form.chat_default_scope}
            onChange={(e) => update('chat_default_scope', e.target.value)}
          >
            <option value="company">Company</option>
            <option value="jobs">Jobs</option>
            <option value="candidates">Candidates</option>
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.fieldLabel} htmlFor="recruiter-duration">
            Default interview duration (min)
          </label>
          <input
            id="recruiter-duration"
            type="number"
            min={5}
            className={styles.fieldInput}
            value={form.default_interview_duration_minutes}
            onChange={(e) =>
              update('default_interview_duration_minutes', Number(e.target.value) || 45)
            }
          />
        </div>

        <div className={styles.field}>
          <label className={styles.fieldLabel} htmlFor="recruiter-buffer">
            Default interview buffer (min)
          </label>
          <input
            id="recruiter-buffer"
            type="number"
            min={0}
            className={styles.fieldInput}
            value={form.default_interview_buffer_minutes}
            onChange={(e) =>
              update('default_interview_buffer_minutes', Number(e.target.value) || 0)
            }
          />
        </div>
      </div>
    </section>
  )
}
