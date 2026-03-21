'use client'

import { useCopilotAction, useLangGraphInterrupt } from '@copilotkit/react-core'

import type { RecruiterChatJobEditProposal } from '@/store/services/recruiterChatApi'

import CandidateCardGrid from './CandidateCardGrid'
import CandidateDetailPanel from './CandidateDetailPanel'
import JobEditDiffCard from './JobEditDiffCard'
import SalaryBandCard from './SalaryBandCard'
import {
  normalizeCandidateDetail,
  normalizeCandidateSearch,
  normalizeSalaryPayload,
  unwrapToolEnvelope,
} from './utils'

function LoadingHint({ text }: { text: string }) {
  return <div className="recruiter-chat-inline-note">{text}</div>
}

export default function ChatActions() {
  useCopilotAction({
    name: 'search_company_candidates',
    available: 'disabled',
    render: ({ result, status }) => {
      if (status === 'executing' || status === 'inProgress') {
        return <LoadingHint text="Searching candidate history…" />
      }

      const payload = normalizeCandidateSearch(result)
      if (!payload) return <></>
      return <CandidateCardGrid results={payload.candidates} />
    },
  })

  useCopilotAction({
    name: 'research_salary',
    available: 'disabled',
    render: ({ result, status }) => {
      if (status === 'executing' || status === 'inProgress') {
        return <LoadingHint text="Researching salary data…" />
      }

      const payload = normalizeSalaryPayload(result)
      if (!payload) return <></>
      return <SalaryBandCard data={payload} />
    },
  })

  useCopilotAction({
    name: 'get_candidate_detail',
    available: 'disabled',
    render: ({ result, status }) => {
      if (status === 'executing' || status === 'inProgress') {
        return <LoadingHint text="Loading candidate profile…" />
      }

      const payload = normalizeCandidateDetail(result)
      if (!payload) return <></>
      return <CandidateDetailPanel candidate={payload} />
    },
  })

  useCopilotAction({
    name: 'find_company_job',
    available: 'disabled',
    render: () => <></>,
  })

  useCopilotAction({
    name: 'prepare_job_edit',
    available: 'disabled',
    render: () => <></>,
  })

  useLangGraphInterrupt<{
    type?: string
    proposal?: RecruiterChatJobEditProposal
  }>({
    enabled: ({ eventValue }) => eventValue?.type === 'job_edit_preview' && Boolean(eventValue?.proposal),
    render: ({ event, resolve }) => {
      const proposal = unwrapToolEnvelope<RecruiterChatJobEditProposal>(
        event.value?.proposal ?? event.value,
      )

      if (!proposal) return <></>

      return (
        <JobEditDiffCard
          proposal={proposal}
          onConfirm={(patch) =>
            resolve(JSON.stringify({ action: 'confirm', patch_override: patch }))
          }
          onCancel={() => resolve(JSON.stringify({ action: 'cancel' }))}
        />
      )
    },
  })

  return null
}
