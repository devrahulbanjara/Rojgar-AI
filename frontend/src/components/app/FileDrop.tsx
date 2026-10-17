'use client'

import { type DragEvent, useId, useRef, useState } from 'react'

import { cn } from '@/lib/utils'

import { FileIcon, UploadIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'

/**
 * Drop zone + file picker for one file. Validates type and size, shows the
 * chosen file with a Replace action. The hidden input is the only <input>.
 */
export function FileDrop({
  label,
  accept,
  acceptLabel,
  maxBytes,
  file,
  onFile,
  busy,
  busyLabel,
  error,
  id,
}: {
  label: string
  /** e.g. "application/pdf,.pdf" */
  accept: string
  /** e.g. "PDF" */
  acceptLabel: string
  maxBytes: number
  file: File | null
  onFile: (file: File) => void
  busy?: boolean
  busyLabel?: string
  error?: string
  id?: string
}) {
  const autoId = useId()
  const inputId = id ?? autoId
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [localError, setLocalError] = useState<string>()
  const shownError = localError ?? error

  function take(candidate: File | undefined) {
    if (!candidate) return
    const allowed = accept.split(',').map((s) => s.trim().toLowerCase())
    const ext = `.${candidate.name.split('.').pop()?.toLowerCase() ?? ''}`
    const okType = allowed.includes(candidate.type.toLowerCase()) || allowed.includes(ext)
    if (!okType) return setLocalError(`Upload a ${acceptLabel} file.`)
    if (candidate.size > maxBytes) {
      return setLocalError(`Use a file under ${Math.round(maxBytes / 1024 / 1024)} MB.`)
    }
    setLocalError(undefined)
    onFile(candidate)
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragging(false)
    take(e.dataTransfer.files?.[0])
  }

  const pick = () => inputRef.current?.click()

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={accept}
        className="sr-only"
        aria-label={label}
        aria-invalid={!!shownError}
        onChange={(e) => {
          take(e.target.files?.[0])
          e.target.value = ''
        }}
      />
      {file ? (
        <div className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3">
          <FileIcon className="size-5 shrink-0 text-primary" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
            <p className="text-xs text-muted-foreground">
              {busy && busyLabel ? busyLabel : `${Math.max(1, Math.round(file.size / 1024))} KB`}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={pick} disabled={busy}>
            Replace
          </Button>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={cn(
            'flex flex-col items-center gap-3 rounded-xl border border-dashed bg-card px-4 py-6 text-center transition-colors',
            dragging && 'border-primary bg-primary/5',
            shownError && 'border-destructive',
          )}
        >
          <UploadIcon className="size-6 text-muted-foreground" aria-hidden="true" />
          <Button variant="outline" onClick={pick}>
            {label}
          </Button>
          <p className="text-xs text-muted-foreground">
            {acceptLabel}, up to {Math.round(maxBytes / 1024 / 1024)} MB
          </p>
        </div>
      )}
      {shownError ? (
        <p role="alert" className="text-sm text-destructive">
          {shownError}
        </p>
      ) : null}
    </div>
  )
}
