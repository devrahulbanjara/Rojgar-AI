'use client'

import { useCallback } from 'react'

import {
  type DecisionAction,
  UNDO_WINDOW_MS,
  sendsEmail,
  useDecideMutation,
  useUndoMutation,
} from '@/lib/api/recruiter'
import { notify } from '@/lib/notify'

const DONE: Record<DecisionAction, (who: string) => string> = {
  shortlist: (who) => `Shortlisted ${who}`,
  reject: (who) => `${who} moved to Not now`,
  invite: (who) => `${who} moved to Interview`,
  offer: (who) => `Offer made to ${who}`,
  hire: (who) => `${who} marked hired`,
  move_back: (who) => `${who} moved back to Shortlisted`,
  withdraw: (who) => `${who} withdrawn`,
}

const EMAIL: Partial<Record<DecisionAction, string>> = {
  shortlist: 'Invite',
  reject: 'Kind email',
  offer: 'Offer email',
}

/** Every decision: queued with a 10 s Undo; the email only goes when the window closes. */
export function useDecisions(jobId?: string) {
  const [decideMutation] = useDecideMutation()
  const [undoMutation] = useUndoMutation()

  return useCallback(
    async (applicationIds: string[], action: DecisionAction, who: string) => {
      if (!applicationIds.length) return
      const { event_ids } = await decideMutation({
        application_ids: applicationIds,
        action,
        jobId,
      }).unwrap()
      const email = EMAIL[action]
      notify.undoable(DONE[action](who), {
        description:
          sendsEmail(action) && email
            ? `${email} sends in ${UNDO_WINDOW_MS / 1000} s`
            : undefined,
        duration: UNDO_WINDOW_MS,
        onUndo: () => {
          for (const id of event_ids) void undoMutation(id)
        },
      })
    },
    [decideMutation, jobId, undoMutation],
  )
}
