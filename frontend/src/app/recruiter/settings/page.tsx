'use client'

import { useMemo, useState } from 'react'
import { toast } from 'react-toastify'

import Link from 'next/link'

import { parseApiError } from '@/lib/apiError'
import { useAppSelector } from '@/store/hooks'
import {
  useGetRecruiterPreferencesQuery,
  useUpdateRecruiterPreferencesMutation,
} from '@/store/services/recruiterPreferencesApi'

import DashboardErrorState from '@/components/common/DashboardErrorState'

type SettingsForm = {
  timezone: string
  notification_email_enabled: boolean
  notification_in_app_enabled: boolean
  default_interview_duration_minutes: number
  default_interview_buffer_minutes: number
  outreach_signature: string
  chat_default_scope: string
}

function toSettingsForm(data?: {
  timezone: string | null
  notification_email_enabled: boolean
  notification_in_app_enabled: boolean
  default_interview_duration_minutes: number
  default_interview_buffer_minutes: number
  outreach_signature: string | null
  chat_default_scope: string
}): SettingsForm {
  return {
    timezone: data?.timezone ?? '',
    notification_email_enabled: data?.notification_email_enabled ?? true,
    notification_in_app_enabled: data?.notification_in_app_enabled ?? true,
    default_interview_duration_minutes: data?.default_interview_duration_minutes ?? 45,
    default_interview_buffer_minutes: data?.default_interview_buffer_minutes ?? 15,
    outreach_signature: data?.outreach_signature ?? '',
    chat_default_scope: data?.chat_default_scope ?? 'company',
  }
}

export default function RecruiterSettingsPage() {
  const { user } = useAppSelector((state) => state.auth)
  const isAdmin = user?.primary_role === 'recruiter_admin'
  const { data, isLoading, isError, error, isFetching, refetch } = useGetRecruiterPreferencesQuery()
  const [updatePreferences, { isLoading: isSaving }] = useUpdateRecruiterPreferencesMutation()
  const [draftForm, setDraftForm] = useState<SettingsForm | null>(null)
  const form = useMemo(() => draftForm ?? toSettingsForm(data?.data), [data?.data, draftForm])

  async function handleSave() {
    try {
      await updatePreferences({
        timezone: form.timezone || null,
        notification_email_enabled: form.notification_email_enabled,
        notification_in_app_enabled: form.notification_in_app_enabled,
        default_interview_duration_minutes: form.default_interview_duration_minutes,
        default_interview_buffer_minutes: form.default_interview_buffer_minutes,
        outreach_signature: form.outreach_signature || null,
        chat_default_scope: form.chat_default_scope,
      }).unwrap()
      setDraftForm(null)
      toast.success('Recruiter settings updated.')
    } catch (err) {
      const parsed = parseApiError(err, {}, 'Could not save recruiter settings.')
      toast.error(parsed.message)
    }
  }

  return (
    <div className="dash-content container container--app-shell">
      <div className="dash-page-header">
        <div className="dash-page-header__left">
          <h1 className="dash-page-header__title">Recruiter Settings</h1>
          <p className="dash-page-header__subtitle">
            Personal workspace defaults for notifications, outreach, and interviews.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="dash-card">
          <div className="dash-card__body">Loading your recruiter settings...</div>
        </div>
      ) : isError ? (
        <DashboardErrorState error={error} isRetrying={isFetching} onRetry={() => void refetch()} />
      ) : (
        <div className="dash-grid dash-grid--2col recruiter-dashboard__grid">
          <div className="dash-card">
            <div className="dash-card__header">
              <div>
                <div className="dash-card__title">Workspace defaults</div>
                <div className="dash-card__subtitle">
                  These settings apply to your recruiter account only.
                </div>
              </div>
            </div>
            <div className="dash-card__body recruiter-candidate-detail__section">
              <div className="resume-field">
                <label className="resume-field__label" htmlFor="recruiter-timezone">
                  Timezone
                </label>
                <input
                  id="recruiter-timezone"
                  className="resume-field__input"
                  value={form.timezone}
                  onChange={(event) =>
                    setDraftForm((prev) => ({
                      ...(prev ?? toSettingsForm(data?.data)),
                      timezone: event.target.value,
                    }))
                  }
                  placeholder="Asia/Katmandu"
                />
              </div>

              <div className="resume-field">
                <label className="resume-field__label" htmlFor="recruiter-chat-scope">
                  Recruiter chat default scope
                </label>
                <select
                  id="recruiter-chat-scope"
                  className="resume-field__input"
                  value={form.chat_default_scope}
                  onChange={(event) =>
                    setDraftForm((prev) => ({
                      ...(prev ?? toSettingsForm(data?.data)),
                      chat_default_scope: event.target.value,
                    }))
                  }
                >
                  <option value="company">Company</option>
                  <option value="jobs">Jobs</option>
                  <option value="candidates">Candidates</option>
                </select>
              </div>

              <div className="resume-field">
                <label className="resume-field__label" htmlFor="recruiter-duration">
                  Default interview duration
                </label>
                <input
                  id="recruiter-duration"
                  type="number"
                  className="resume-field__input"
                  value={form.default_interview_duration_minutes}
                  onChange={(event) =>
                    setDraftForm((prev) => ({
                      ...(prev ?? toSettingsForm(data?.data)),
                      default_interview_duration_minutes: Number(event.target.value) || 45,
                    }))
                  }
                />
              </div>

              <div className="resume-field">
                <label className="resume-field__label" htmlFor="recruiter-buffer">
                  Default interview buffer
                </label>
                <input
                  id="recruiter-buffer"
                  type="number"
                  className="resume-field__input"
                  value={form.default_interview_buffer_minutes}
                  onChange={(event) =>
                    setDraftForm((prev) => ({
                      ...(prev ?? toSettingsForm(data?.data)),
                      default_interview_buffer_minutes: Number(event.target.value) || 0,
                    }))
                  }
                />
              </div>
            </div>
          </div>

          <div className="dash-card">
            <div className="dash-card__header">
              <div>
                <div className="dash-card__title">Communication defaults</div>
                <div className="dash-card__subtitle">
                  Notification and outreach preferences for your account.
                </div>
              </div>
            </div>
            <div className="dash-card__body recruiter-candidate-detail__section">
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={form.notification_in_app_enabled}
                  onChange={(event) =>
                    setDraftForm((prev) => ({
                      ...(prev ?? toSettingsForm(data?.data)),
                      notification_in_app_enabled: event.target.checked,
                    }))
                  }
                />
                <span>Enable in-app notifications</span>
              </label>

              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={form.notification_email_enabled}
                  onChange={(event) =>
                    setDraftForm((prev) => ({
                      ...(prev ?? toSettingsForm(data?.data)),
                      notification_email_enabled: event.target.checked,
                    }))
                  }
                />
                <span>Enable email notifications</span>
              </label>

              <div className="resume-field">
                <label className="resume-field__label" htmlFor="recruiter-signature">
                  Outreach signature
                </label>
                <textarea
                  id="recruiter-signature"
                  className="resume-field__input"
                  rows={6}
                  value={form.outreach_signature}
                  onChange={(event) =>
                    setDraftForm((prev) => ({
                      ...(prev ?? toSettingsForm(data?.data)),
                      outreach_signature: event.target.value,
                    }))
                  }
                  placeholder={'Priya Maharjan\nSenior Recruiter\nPinnacle Tech Nepal Pvt. Ltd.'}
                />
              </div>

              {isAdmin ? (
                <p className="cell-muted">
                  Need to update booking links or company profile?{' '}
                  <Link href="/recruiter/company/settings" className="auth__inline-link">
                    Open company settings
                  </Link>
                </p>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {!isLoading && !isError ? (
        <div className="dash-card">
          <div className="dash-card__body">
            <button
              className="btn btn--primary"
              onClick={() => void handleSave()}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save settings'}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
