import {
  differenceInCalendarDays,
  format,
  formatDistanceToNowStrict,
  isToday,
  isTomorrow,
} from 'date-fns'

/** "Today, 2:00 PM" · "Tomorrow, 8:45 PM" · "Tue 21 Oct, 2:00 PM" */
export function formatWhen(iso: string): string {
  const date = new Date(iso)
  const time = format(date, 'h:mm a')
  if (isToday(date)) return `Today, ${time}`
  if (isTomorrow(date)) return `Tomorrow, ${time}`
  return `${format(date, 'EEE d MMM')}, ${time}`
}

export function formatTime(iso: string): string {
  return format(new Date(iso), 'h:mm a')
}

/** "3 days ago" */
export function ago(iso: string): string {
  return `${formatDistanceToNowStrict(new Date(iso))} ago`
}

/** "Closes today" · "Closes in 5 days" · "Closed 2 days ago" */
export function closingLabel(iso: string | null | undefined): string | null {
  if (!iso) return null
  const days = differenceInCalendarDays(new Date(iso), new Date())
  if (days === 0) return 'Closes today'
  if (days === 1) return 'Closes tomorrow'
  if (days > 1) return `Closes in ${days} days`
  return `Closed ${formatDistanceToNowStrict(new Date(iso))} ago`
}

export function shortDate(iso: string): string {
  return format(new Date(iso), 'd MMM yyyy')
}
