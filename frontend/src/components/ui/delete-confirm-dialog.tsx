'use client'

import * as React from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './alert-dialog'

interface DeleteConfirmDialogProps {
  title: string
  description: string
  itemName?: string
  onConfirm: () => void
  trigger?: React.ReactNode
}

interface DeleteConfirmHookProps extends DeleteConfirmDialogProps {
  additionalInfo?: string
}

export function DeleteConfirmDialog({
  title,
  description,
  itemName,
  onConfirm,
  trigger,
}: DeleteConfirmDialogProps) {
  return (
    <AlertDialog>
      {trigger && <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>}
      <AlertDialogContent className="max-w-[480px] p-0 gap-0 rounded-3xl border-0 shadow-2xl">
        <AlertDialogHeader className="p-8 pb-6 text-left space-y-3">
          <AlertDialogTitle className="text-[22px] font-semibold text-slate-900 dark:text-white leading-tight">
            {title}
          </AlertDialogTitle>

          <AlertDialogDescription className="text-[15px] leading-relaxed text-slate-500 dark:text-slate-400">
            {itemName ? (
              <>
                {description}{' '}
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  "{itemName}"
                </span>
                . This action cannot be undone.
              </>
            ) : (
              <>{description} This action cannot be undone.</>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="h-px bg-slate-200 dark:bg-slate-700" />

        <AlertDialogFooter className="p-6 flex flex-row gap-3 justify-end">
          <AlertDialogCancel className="mt-0 px-6 h-11 rounded-xl border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="px-6 h-11 rounded-xl font-medium text-white shadow-sm bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
          >
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// Hook version for programmatic usage
export function useDeleteConfirm() {
  const [isOpen, setIsOpen] = React.useState(false)
  const [config, setConfig] = React.useState<Omit<DeleteConfirmHookProps, 'trigger'>>({
    title: '',
    description: '',
    onConfirm: () => {},
  })

  const confirm = (props: Omit<DeleteConfirmHookProps, 'trigger'>) => {
    return new Promise<boolean>(resolve => {
      setConfig({
        ...props,
        onConfirm: () => {
          props.onConfirm()
          setIsOpen(false)
          resolve(true)
        },
      })
      setIsOpen(true)
    })
  }

  const Dialog = () => (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent className="max-w-[480px] p-0 gap-0 rounded-3xl border-0 shadow-2xl">
        <AlertDialogHeader className="p-8 pb-6 text-left space-y-3">
          <AlertDialogTitle className="text-[22px] font-semibold text-slate-900 dark:text-white leading-tight">
            {config.title}
          </AlertDialogTitle>

          <AlertDialogDescription className="text-[15px] leading-relaxed text-slate-500 dark:text-slate-400">
            {config.itemName ? (
              <>
                {config.description}{' '}
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  "{config.itemName}"
                </span>
                {config.additionalInfo && (
                  <>
                    {'. '}
                    <span className="font-semibold text-orange-600 dark:text-orange-400">
                      {config.additionalInfo}
                    </span>
                  </>
                )}
                . This action cannot be undone.
              </>
            ) : (
              <>
                {config.description}
                {config.additionalInfo && (
                  <>
                    {' '}
                    <span className="font-semibold text-orange-600 dark:text-orange-400">
                      {config.additionalInfo}
                    </span>
                  </>
                )}
                . This action cannot be undone.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="h-px bg-slate-200 dark:bg-slate-700" />

        <AlertDialogFooter className="p-6 flex flex-row gap-3 justify-end">
          <AlertDialogCancel className="mt-0 px-6 h-11 rounded-xl border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={config.onConfirm}
            className="px-6 h-11 rounded-xl font-medium text-white shadow-sm bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
          >
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )

  return { confirm, Dialog }
}
