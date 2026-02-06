export const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  applied: {
    label: 'Applied',
    color:
      'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700',
  },
  interviewing: {
    label: 'Interviewing',
    color:
      'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border-primary-200 dark:border-primary-700',
  },
  outcome: {
    label: 'Outcome',
    color:
      'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700',
  },
}

export const COLUMN_MAPPING: Record<string, string> = {
  applied: 'Applied',
  interviewing: 'Interviewing',
  outcome: 'Outcome',
}
