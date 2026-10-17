import type { ReactNode } from 'react'

import { type ExternalToast, toast } from 'sonner'

import { Button } from '@/components/ui/button'

type NotifyType = 'success' | 'error' | 'info' | 'warning'
type ToastId = string | number

/** Legacy react-toastify option names still accepted by callers. */
type NotifyOptions = ExternalToast & { autoClose?: number | false; toastId?: ToastId }

function isOptions(value: unknown): value is NotifyOptions {
  return typeof value === 'object' && value !== null && !('$$typeof' in (value as object))
}

function toSonnerOptions(options?: NotifyOptions): ExternalToast | undefined {
  if (!options) return undefined
  const { autoClose, toastId, ...rest } = options
  return {
    ...rest,
    ...(toastId !== undefined ? { id: toastId } : {}),
    ...(autoClose === false ? { duration: Infinity } : {}),
    ...(typeof autoClose === 'number' ? { duration: autoClose } : {}),
  }
}

/**
 * Thin compatibility layer over sonner that keeps the old notify() API:
 *   notify.success('Saved.')
 *   notify.success('Saved.', 'All changes synced.')
 *   notify.success('Saved.', { autoClose: 2000 })
 *   notify.success('Saved.', 'desc', { autoClose: 0 })
 * With a single argument the message is the toast title — no generic
 * "Success"/"Error" headings.
 */
function fire(
  type: NotifyType,
  message: ReactNode,
  descriptionOrOptions?: ReactNode | NotifyOptions,
  maybeOptions?: NotifyOptions,
): ToastId {
  let description: ReactNode | undefined
  let options: NotifyOptions | undefined

  if (isOptions(descriptionOrOptions)) {
    options = descriptionOrOptions
  } else {
    description = descriptionOrOptions
    options = maybeOptions
  }

  return toast[type](message, { ...toSonnerOptions(options), description })
}

type NotifyFn = (
  message: ReactNode,
  descriptionOrOptions?: ReactNode | NotifyOptions,
  options?: NotifyOptions,
) => ToastId

const make =
  (type: NotifyType): NotifyFn =>
  (message, descriptionOrOptions, options) =>
    fire(type, message, descriptionOrOptions, options)

type UndoableOptions = {
  /** Called when the person presses Undo. Revert the optimistic change here. */
  onUndo: () => void
  /** Called once the window closes without Undo (e.g. actually send the email). */
  onCommit?: () => void
  description?: ReactNode
  /** Undo window in ms. Default 8 s. */
  duration?: number
}

/**
 * A toast for a reversible action: message, Undo, and a bar that shows the
 * time left. Make the change optimistically, pass a revert in onUndo, and put
 * anything that can't be taken back (sending an email) in onCommit.
 */
function undoable(
  message: ReactNode,
  { onUndo, onCommit, description, duration = 8000 }: UndoableOptions,
) {
  let undone = false
  return toast.custom(
    (id) => (
      <div className="relative w-[356px] max-w-[calc(100vw-32px)] overflow-hidden rounded-xl border bg-card p-4 pr-3 text-card-foreground shadow-lg">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{message}</p>
            {description ? (
              <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              undone = true
              onUndo()
              toast.dismiss(id)
            }}
          >
            Undo
          </Button>
        </div>
        <span
          aria-hidden="true"
          className="toast-countdown absolute inset-x-0 bottom-0 h-0.5 bg-primary"
          style={{ animationDuration: `${duration}ms` }}
        />
      </div>
    ),
    {
      duration,
      onAutoClose: () => {
        if (!undone) onCommit?.()
      },
    },
  )
}

export const notify = {
  success: make('success'),
  error: make('error'),
  info: make('info'),
  warning: make('warning'),
  warn: make('warning'),
  undoable,
  dismiss: (id?: ToastId) => toast.dismiss(id),
}

export default notify
