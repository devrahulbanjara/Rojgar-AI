'use client'

import Link from 'next/link'

import { ArrowRight } from 'lucide-react'

import styles from '../page.module.scss'
import type { SettingsForm } from './settingsForm'

interface Props {
  form: SettingsForm
  isAdmin: boolean
  onChange: (next: SettingsForm) => void
}

export default function CommunicationCard({ form, isAdmin, onChange }: Props) {
  function update<K extends keyof SettingsForm>(key: K, value: SettingsForm[K]) {
    onChange({ ...form, [key]: value })
  }

  return (
    <section className={styles.card} aria-label="Communication defaults">
      <div className={styles.cardHeader}>
        <div>
          <div className={styles.cardEyebrow}>Notifications &amp; outreach</div>
          <h2 className={styles.cardTitle}>Communication</h2>
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.fieldLabel} htmlFor="recruiter-signature">
          Outreach signature
        </label>
        <textarea
          id="recruiter-signature"
          className={styles.fieldTextarea}
          rows={6}
          value={form.outreach_signature}
          onChange={(e) => update('outreach_signature', e.target.value)}
          placeholder={'Priya Maharjan\nSenior Recruiter\nPinnacle Tech Nepal Pvt. Ltd.'}
        />
        <span className={styles.fieldHint}>
          Appended to outreach emails you send from ConvexHire.
        </span>
      </div>

      {isAdmin && (
        <div className={styles.cardActions}>
          <Link
            href="/recruiter/company/settings"
            className="btn btn--secondary btn--sm"
            aria-label="Open company settings"
          >
            Company settings
            <ArrowRight size={13} />
          </Link>
        </div>
      )}
    </section>
  )
}
