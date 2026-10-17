'use client'

import { useCallback } from 'react'

import { type DecideAction, useDecideMutation, useUndoMutation } from '@/lib/api/recruiter'
import { notify } from '@/lib/notify'

const DONE: Record<DecideAction, (who: string) => string> = {
  shortlist: (who) => `Shortlisted ${who}`,
  reject: (who) => `Rejected ${who}`,
  invite_to_interview: (who) => `Invited ${who} to interview`,
  make_offer: (who) => `Offer made to ${who}`,
  mark_hired: (who) => `${who} marked hired`,
  move_back: (who) => `${who} moved back`,
  withdraw: (who) => `${who} marked withdrawn`,
}

const EMAIL: Partial<Record<DecideAction, string>> = {
  shortlist: 'Email',
  reject: 'Kind email',
  invite_to_interview: 'Interview email',
  make_offer: 'Offer email',
}

/** Every decision is saved at once; the server holds its email for the Undo window. */
export function useDecisions(jobId?: string) {
  const [decideMutation] = useDecideMutation()
  const [undoMutation] = useUndoMutation()

  return useCallback(
    async (applicationIds: string[], action: DecideAction, who: string) => {
      if (!applicationIds.length) return
      let result
      try {
        result = await decideMutation({ application_ids: applicationIds, action, jobId }).unwrap()
      } catch {
        notify.error("Couldn't save that. Nothing changed. Try again.")
        return
      }
      const failed = result.results.filter((r) => !r.ok).length
      if (failed === result.results.length) {
        notify.error("Couldn't save that. Someone may have moved them already.")
        return
      }
      if (failed) notify.error(`${failed} couldn't be moved. Someone may have moved them already.`)
      const emails = result.results.filter((r) => r.email_scheduled).length
      const email = EMAIL[action]
      notify.undoable(DONE[action](who), {
        description:
          emails && email
            ? `${email}${emails > 1 ? 's' : ''} sends in ${result.undo_seconds} s`
            : undefined,
        duration: result.undo_seconds * 1000,
        onUndo: () => {
          void undoMutation(result.undo_event_ids)
            .unwrap()
            .then((undo) => {
              if (undo.failed.length)
                notify.error(
                  undo.failed.some((f) => f.reason === 'email_sent')
                    ? 'Too late to undo: the email already went.'
                    : "Couldn't undo. Someone changed it since.",
                )
            })
            .catch(() => notify.error("Couldn't undo. Try again."))
        },
      })
    },
    [decideMutation, jobId, undoMutation],
  )
}
