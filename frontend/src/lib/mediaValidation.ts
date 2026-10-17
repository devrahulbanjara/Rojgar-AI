const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif'] as const

/** Plain error for an image that can't be used as a logo or photo, else null. */
export function validateImageFile(file: File): string | null {
  const extension = file.name.includes('.') ? (file.name.split('.').pop()?.toLowerCase() ?? '') : ''

  if (!file.type.startsWith('image/')) {
    return 'Please choose an image file.'
  }

  if (!ALLOWED_IMAGE_EXTENSIONS.includes(extension as (typeof ALLOWED_IMAGE_EXTENSIONS)[number])) {
    return `Allowed formats: ${ALLOWED_IMAGE_EXTENSIONS.join(', ')}`
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return 'Image must be 5 MB or smaller.'
  }

  return null
}
