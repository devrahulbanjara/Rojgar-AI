import { type Id, type ToastOptions, toast } from 'react-toastify'

type NotifyType = 'success' | 'error' | 'info' | 'warning'

const DEFAULT_TITLES: Record<NotifyType, string> = {
  success: 'Success',
  error: 'Error',
  info: 'Info',
  warning: 'Warning',
}

function ToastBody({ title, description }: { title: string; description?: React.ReactNode }) {
  return (
    <div>
      <span className="toast-title">{title}</span>
      {description ? <span className="toast-description">{description}</span> : null}
    </div>
  )
}

function isOptions(v: unknown): v is ToastOptions {
  return typeof v === 'object' && v !== null
}

/**
 * Pastel toast notifications matching the design system.
 *
 * Calling forms:
 *   notify.success('Saved.')                          → title 'Success', description 'Saved.'
 *   notify.success('Saved.', 'All changes synced.')   → title 'Saved.',  description 'All changes synced.'
 *   notify.success('Saved.', { autoClose: 2000 })     → title 'Success', description 'Saved.', options
 *   notify.success('Saved.', 'desc', { autoClose: 0 })→ all three
 */
function fire(
  type: NotifyType,
  message: React.ReactNode,
  descriptionOrOptions?: React.ReactNode | ToastOptions,
  maybeOptions?: ToastOptions,
): Id {
  let title: React.ReactNode
  let description: React.ReactNode | undefined
  let options: ToastOptions | undefined

  if (
    typeof descriptionOrOptions === 'string' ||
    (descriptionOrOptions != null && typeof descriptionOrOptions !== 'object')
  ) {
    title = message
    description = descriptionOrOptions as React.ReactNode
    options = maybeOptions
  } else if (
    descriptionOrOptions &&
    isOptions(descriptionOrOptions) &&
    !('$$typeof' in descriptionOrOptions)
  ) {
    // ToastOptions object
    title = DEFAULT_TITLES[type]
    description = message
    options = descriptionOrOptions as ToastOptions
  } else if (descriptionOrOptions != null) {
    // ReactNode description (e.g. JSX element)
    title = message
    description = descriptionOrOptions as React.ReactNode
    options = maybeOptions
  } else {
    title = DEFAULT_TITLES[type]
    description = message
    options = maybeOptions
  }

  const content = <ToastBody title={String(title)} description={description} />
  switch (type) {
    case 'success':
      return toast.success(content, options)
    case 'error':
      return toast.error(content, options)
    case 'warning':
      return toast.warning(content, options)
    case 'info':
    default:
      return toast.info(content, options)
  }
}

export const notify = {
  success: (msg: React.ReactNode, d?: React.ReactNode | ToastOptions, o?: ToastOptions) =>
    fire('success', msg, d, o),
  error: (msg: React.ReactNode, d?: React.ReactNode | ToastOptions, o?: ToastOptions) =>
    fire('error', msg, d, o),
  info: (msg: React.ReactNode, d?: React.ReactNode | ToastOptions, o?: ToastOptions) =>
    fire('info', msg, d, o),
  warning: (msg: React.ReactNode, d?: React.ReactNode | ToastOptions, o?: ToastOptions) =>
    fire('warning', msg, d, o),
  warn: (msg: React.ReactNode, d?: React.ReactNode | ToastOptions, o?: ToastOptions) =>
    fire('warning', msg, d, o),
  dismiss: toast.dismiss,
  update: toast.update,
  isActive: toast.isActive,
}

export default notify
