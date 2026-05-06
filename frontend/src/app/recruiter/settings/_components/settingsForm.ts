export type SettingsForm = {
  timezone: string
  default_interview_duration_minutes: number
  default_interview_buffer_minutes: number
  outreach_signature: string
  chat_default_scope: string
}

export type RawSettings = {
  timezone: string | null
  default_interview_duration_minutes: number
  default_interview_buffer_minutes: number
  outreach_signature: string | null
  chat_default_scope: string
}

export const EMPTY_SETTINGS_FORM: SettingsForm = {
  timezone: '',
  default_interview_duration_minutes: 45,
  default_interview_buffer_minutes: 15,
  outreach_signature: '',
  chat_default_scope: 'company',
}

export function toSettingsForm(data?: RawSettings): SettingsForm {
  if (!data) return EMPTY_SETTINGS_FORM
  return {
    timezone: data.timezone ?? '',
    default_interview_duration_minutes: data.default_interview_duration_minutes,
    default_interview_buffer_minutes: data.default_interview_buffer_minutes,
    outreach_signature: data.outreach_signature ?? '',
    chat_default_scope: data.chat_default_scope,
  }
}
