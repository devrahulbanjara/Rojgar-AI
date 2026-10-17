import type { ReactNode } from 'react'

import { type ExternalToast, toast } from 'sonner'

type NotifyType = 'success' | 'error' | 'info' | 'warning'
type ToastId = string | number

/** Legacy react-toastify option names still accepted by callers. */
type NotifyOptions = ExternalToast & { autoClose?: number | false; toastId?: ToastId }

function isOptions(value: unknown): value is NotifyOptions {
  return (
    typeof value === 'object' && value !== null && !('$$typeof' in (value as object))
  )
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

export const notify = {
  success: make('success'),
  error: make('error'),
  info: make('info'),
  warning: make('warning'),
  warn: make('warning'),
  dismiss: (id?: ToastId) => toast.dismiss(id),
}

export default notify
