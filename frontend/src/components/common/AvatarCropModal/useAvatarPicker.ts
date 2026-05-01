'use client'

import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'

import { validateImageFile } from '@/lib/mediaValidation'

import type { AvatarCropDraft } from './AvatarCropModal'

function readImageDimensions(
  src: string,
): Promise<{ naturalWidth: number; naturalHeight: number }> {
  return new Promise((resolve, reject) => {
    const image = new window.Image()
    image.onload = () =>
      resolve({ naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight })
    image.onerror = () => reject(new Error('Failed to load image preview.'))
    image.src = src
  })
}

export function useAvatarPicker() {
  const [draft, setDraft] = useState<AvatarCropDraft | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(
    () => () => {
      if (draft?.sourceUrl.startsWith('blob:')) URL.revokeObjectURL(draft.sourceUrl)
    },
    [draft],
  )

  async function pick(file: File) {
    const validationError = validateImageFile(file)
    if (validationError) {
      setError(validationError)
      toast.error(validationError)
      return
    }

    setError(null)
    const sourceUrl = URL.createObjectURL(file)

    try {
      const { naturalWidth, naturalHeight } = await readImageDimensions(sourceUrl)
      setDraft((current) => {
        if (current?.sourceUrl.startsWith('blob:')) URL.revokeObjectURL(current.sourceUrl)
        return { sourceUrl, fileName: file.name, mimeType: file.type, naturalWidth, naturalHeight }
      })
    } catch {
      URL.revokeObjectURL(sourceUrl)
      const message = 'We could not open that image for cropping. Please try another file.'
      setError(message)
      toast.error(message)
    }
  }

  function clear() {
    setDraft((current) => {
      if (current?.sourceUrl.startsWith('blob:')) URL.revokeObjectURL(current.sourceUrl)
      return null
    })
  }

  return { draft, error, setError, pick, clear }
}
