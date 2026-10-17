'use client'

import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

import { EmptyState } from './EmptyState'

/** Something failed to load: one line + Try again. */
export function ErrorState({
  children = "Couldn't load this.",
  onRetry,
  retrying = false,
}: {
  children?: ReactNode
  onRetry?: () => void
  retrying?: boolean
}) {
  return (
    <EmptyState
      action={
        onRetry ? (
          <Button size="sm" variant="outline" loading={retrying} onClick={onRetry}>
            Try again
          </Button>
        ) : undefined
      }
    >
      {children}
    </EmptyState>
  )
}

/**
 * Confirmation for IRREVERSIBLE actions only (delete, remove member, send to
 * everyone). Reversible actions should just happen, with an undo toast.
 */
export function ConfirmDialog({
  trigger,
  title,
  consequence,
  confirmLabel,
  onConfirm,
  busy = false,
  open,
  onOpenChange,
}: {
  trigger?: ReactNode
  title: string
  /** One sentence on what can't be undone. */
  consequence?: string
  confirmLabel: string
  onConfirm: () => void | Promise<void>
  busy?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="sm:max-w-sm" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {consequence ? <DialogDescription>{consequence}</DialogDescription> : null}
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button variant="destructive" loading={busy} onClick={() => void onConfirm()}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
