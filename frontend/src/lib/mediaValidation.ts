export const MAX_IMAGE_BYTES = 5 * 1024 * 1024
export const ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif'] as const

export function getInitials(value: string | null | undefined, fallback = 'U'): string {
  if (!value?.trim()) return fallback

  return (
    value
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || fallback
  )
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function validateImageFile(file: File): string | null {
  const extension = file.name.includes('.') ? (file.name.split('.').pop()?.toLowerCase() ?? '') : ''

  if (!file.type.startsWith('image/')) {
    return 'Please choose an image file.'
  }

  if (!ALLOWED_IMAGE_EXTENSIONS.includes(extension as (typeof ALLOWED_IMAGE_EXTENSIONS)[number])) {
    return `Allowed formats: ${ALLOWED_IMAGE_EXTENSIONS.join(', ')}`
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return `Image must be ${formatBytes(MAX_IMAGE_BYTES)} or smaller.`
  }

  return null
}
