import React, { useEffect } from 'react'
import { cn } from '../../lib/utils'
import { X } from 'lucide-react'
import { createPortal } from 'react-dom'

interface SheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  hideClose?: boolean
}

export function Sheet({ open, onOpenChange, children, hideClose }: SheetProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  const content = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {}
      <div
        className="fixed inset-0 bg-black/5 backdrop-blur-[3px] animate-in fade-in duration-200"
        onClick={() => onOpenChange(false)}
      />

      {}
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-background-surface rounded-2xl shadow-2xl border border-default animate-in fade-in zoom-in-95 duration-300 flex flex-col overflow-hidden">
        {!hideClose && (
          <button
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 p-2 rounded-xl hover:bg-background-subtle transition-colors z-50"
          >
            <X className="w-5 h-5 text-text-tertiary" />
          </button>
        )}
        {children}
      </div>
    </div>
  )

  if (typeof document !== 'undefined') {
    return createPortal(content, document.body)
  }
  return content
}

export function SheetContent({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <div className={cn('h-full flex flex-col overflow-hidden', className)}>{children}</div>
}

export function SheetHeader({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'px-8 py-6 border-b bg-background-surface flex-shrink-0',
        className
      )}
    >
      {children}
    </div>
  )
}

export function SheetTitle({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <h2 className={cn('text-xl font-bold text-text-primary', className)}>{children}</h2>
}

export function SheetDescription({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <p className={cn('text-sm text-text-tertiary mt-1', className)}>{children}</p>
}
