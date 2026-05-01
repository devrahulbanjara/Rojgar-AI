'use client'

import { useEffect, useRef, useState } from 'react'
import Cropper, { type Area } from 'react-easy-crop'

import { createCroppedImageFile } from '@/lib/cropImage'
import { X } from 'lucide-react'

import ButtonSpinner from '@/components/common/ButtonSpinner'

export interface AvatarCropDraft {
  sourceUrl: string
  fileName: string
  mimeType: string
  naturalWidth: number
  naturalHeight: number
}

interface AvatarCropModalProps {
  draft: AvatarCropDraft | null
  busy: boolean
  onCancel: () => void
  onSubmit: (croppedFile: File) => Promise<void> | void
}

export default function AvatarCropModal({ draft, busy, onCancel, onSubmit }: AvatarCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [isClosing, setIsClosing] = useState(false)
  const closeTimeoutRef = useRef<number | null>(null)

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (draft) {
      setCrop({ x: 0, y: 0 })
      setZoom(1)
      setCroppedAreaPixels(null)
      setIsClosing(false)
    }
  }, [draft])
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(
    () => () => {
      if (closeTimeoutRef.current) window.clearTimeout(closeTimeoutRef.current)
    },
    [],
  )

  if (!draft) return null

  function handleClose() {
    if (isClosing || busy) return
    setIsClosing(true)
    if (closeTimeoutRef.current) window.clearTimeout(closeTimeoutRef.current)
    closeTimeoutRef.current = window.setTimeout(() => {
      setIsClosing(false)
      onCancel()
    }, 200)
  }

  async function handleConfirm() {
    if (!draft || !croppedAreaPixels) return
    const file = await createCroppedImageFile({
      src: draft.sourceUrl,
      crop: croppedAreaPixels,
      fileName: draft.fileName,
      mimeType: draft.mimeType,
    })
    await onSubmit(file)
  }

  return (
    <div
      className={`modal-backdrop modal-backdrop--animated${isClosing ? ' modal-backdrop--closing' : ''}`}
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) handleClose()
      }}
    >
      <div
        className="modal modal--cropper"
        role="dialog"
        aria-modal="true"
        aria-labelledby="avatar-crop-title"
      >
        <div className="modal__header">
          <div className="modal__title" id="avatar-crop-title">
            Crop Photo
          </div>
          <button
            type="button"
            className="btn btn--icon btn--sm"
            disabled={busy}
            onClick={handleClose}
            aria-label="Close crop dialog"
          >
            <X size={18} />
          </button>
        </div>
        <div className="modal__body">
          <div className="avatar-cropper">
            <div
              className="avatar-cropper__viewport"
              style={
                {
                  aspectRatio: `${draft.naturalWidth} / ${draft.naturalHeight}`,
                  '--cropper-ratio': draft.naturalWidth / draft.naturalHeight,
                } as React.CSSProperties
              }
            >
              <Cropper
                image={draft.sourceUrl}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_, area) => setCroppedAreaPixels(area)}
              />
            </div>
            <div className="avatar-cropper__controls">
              <label className="avatar-cropper__zoom-label" htmlFor="avatar-crop-zoom">
                Zoom
              </label>
              <input
                id="avatar-crop-zoom"
                className="avatar-cropper__zoom-input"
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(event) => setZoom(Number(event.target.value))}
              />
            </div>
          </div>
        </div>
        <div className="modal__footer">
          <button
            type="button"
            className="btn btn--secondary"
            disabled={busy}
            onClick={handleClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn--primary"
            disabled={!croppedAreaPixels || busy}
            onClick={() => void handleConfirm()}
          >
            {busy ? <ButtonSpinner label="Saving..." /> : 'Done'}
          </button>
        </div>
      </div>
    </div>
  )
}
