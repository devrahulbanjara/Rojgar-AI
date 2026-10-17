const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** "2023-04" → "Apr 2023"; empty → fallback. */
export function fmtDate(val: string, fallback = 'Present') {
  if (!val) return fallback
  const [year, month] = val.split('-')
  return `${MONTHS[parseInt(month, 10) - 1]} ${year}`
}
