const AVATAR_COLORS = [
  'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
  'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
  'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
  'bg-lime-100 dark:bg-lime-900/30 text-lime-700 dark:text-lime-300',
  'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
  'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300',
  'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300',
  'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300',
  'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  'bg-primary-100 text-primary-700',
  'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300',
  'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
  'bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-700 dark:text-fuchsia-300',
  'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300',
  'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300',
]

export function getAvatarColor(name: string | null | undefined): string {
  if (!name) return 'bg-background-subtle text-text-secondary' // Default fallback

  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }

  const index = Math.abs(hash % AVATAR_COLORS.length)
  return AVATAR_COLORS[index]
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return '??'

  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase()
  }

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}
