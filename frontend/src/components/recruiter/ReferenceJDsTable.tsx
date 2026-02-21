'use client'

import React from 'react'
import { ReferenceJD } from '../../services/referenceJDService'
import { cn } from '../../lib/utils'
import { MoreVertical, Edit2, Trash2, FileText, Copy } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'

interface ReferenceJDsTableProps {
  jds: ReferenceJD[]
  onJDClick: (jd: ReferenceJD) => void
  onEdit: (jd: ReferenceJD) => void
  onDelete: (jd: ReferenceJD) => void
  onUseTemplate: (jd: ReferenceJD) => void
  className?: string
}

function ReferenceJDTableRow({
  jd,
  index,
  onJDClick,
  onEdit,
  onDelete,
  onUseTemplate,
}: {
  jd: ReferenceJD
  index: number
  onJDClick: (j: ReferenceJD) => void
  onEdit: (j: ReferenceJD) => void
  onDelete: (j: ReferenceJD) => void
  onUseTemplate: (j: ReferenceJD) => void
}) {
  const isEven = index % 2 === 0
  const summary = jd.job_summary || jd.role_overview || 'No description available'

  return (
    <tr
      onClick={() => onJDClick(jd)}
      className={cn(
        'border-b border-border-subtle cursor-pointer transition-all duration-200 group',
        isEven ? 'bg-background-surface' : 'bg-background-subtle/10',
        'hover:bg-primary-50/40 dark:hover:bg-primary-950/20 hover:border-primary-100 dark:hover:border-primary-900'
      )}
    >
      {/* Template Details */}
      <td className="py-5 px-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/40 flex items-center justify-center font-bold text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-800 shadow-sm transition-transform group-hover:scale-105">
            {(jd.department || 'JD').substring(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-bold text-text-primary group-hover:text-primary-600 transition-colors truncate">
              {jd.department ? `${jd.department} Template` : 'Reference JD'}
            </p>
            <p className="text-[11px] text-text-tertiary font-medium mt-0.5 truncate uppercase tracking-wider opacity-80 italic">
              {jd.department || 'General'} • Standard Reference
            </p>
          </div>
        </div>
      </td>

      {/* Summary */}
      <td className="py-5 px-6">
        <p
          className="text-[13px] text-text-secondary line-clamp-2 leading-relaxed opacity-90"
          title={summary}
        >
          {summary}
        </p>
      </td>

      {/* Actions */}
      <td className="py-5 px-6">
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={e => {
              e.stopPropagation()
              onUseTemplate(jd)
            }}
            className="px-5 py-2.5 border-2 border-[#2563EB] text-[#2563EB] hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-xl font-bold text-xs transition-all duration-200 active:scale-95 whitespace-nowrap hidden md:block"
          >
            Use Template
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                onClick={e => e.stopPropagation()}
                className="p-2.5 rounded-xl text-text-muted hover:bg-primary-100/50 hover:text-primary-600 transition-all focus:outline-none"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 p-2 shadow-2xl border-border-default rounded-xl"
            >
              <DropdownMenuItem
                onClick={e => {
                  e.stopPropagation()
                  onJDClick(jd)
                }}
                className="flex items-center gap-3 px-3 py-2.5 cursor-pointer font-semibold rounded-lg text-sm text-text-primary hover:bg-primary-50"
              >
                <FileText className="w-4 h-4 text-text-tertiary" /> View Detailed Template
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={e => {
                  e.stopPropagation()
                  onUseTemplate(jd)
                }}
                className="flex items-center gap-3 px-3 py-2.5 cursor-pointer font-semibold rounded-lg text-sm text-primary-600 hover:bg-primary-50 md:hidden"
              >
                <Copy className="w-4 h-4" /> Use This Template
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={e => {
                  e.stopPropagation()
                  onEdit(jd)
                }}
                className="flex items-center gap-3 px-3 py-2.5 cursor-pointer font-semibold rounded-lg text-sm text-text-primary hover:bg-primary-50"
              >
                <Edit2 className="w-4 h-4 text-text-tertiary" /> Edit Template Files
              </DropdownMenuItem>
              <div className="h-px bg-border-subtle my-1.5" />
              <DropdownMenuItem
                onClick={e => {
                  e.stopPropagation()
                  onDelete(jd)
                }}
                className="flex items-center gap-3 px-3 py-2.5 cursor-pointer font-semibold rounded-lg text-sm text-error-600 focus:text-error-600 focus:bg-error-50 dark:focus:bg-error-900/20"
              >
                <Trash2 className="w-4 h-4" /> Delete Template Folder
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </td>
    </tr>
  )
}

export function ReferenceJDsTable({
  jds,
  onJDClick,
  onEdit,
  onDelete,
  onUseTemplate,
  className,
}: ReferenceJDsTableProps) {
  return (
    <div className={cn('w-full', className)}>
      <div className="bg-background-surface border border-border-default rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_8px_rgba(0,0,0,0.02)]">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gradient-to-r from-background-subtle/80 to-background-subtle/30 border-b border-border-default">
              <th className="py-4 px-6 text-left" style={{ width: '40%' }}>
                <span className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">
                  Reference Template
                </span>
              </th>
              <th className="py-4 px-6 text-left" style={{ width: '40%' }}>
                <span className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">
                  Description Summary
                </span>
              </th>
              <th className="py-4 px-6 text-center" style={{ width: '20%' }}>
                <span className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">
                  Actions
                </span>
              </th>
            </tr>
          </thead>

          <tbody>
            {jds.map((jd, index) => (
              <ReferenceJDTableRow
                key={jd.id || index}
                jd={jd}
                index={index}
                onJDClick={onJDClick}
                onEdit={onEdit}
                onDelete={onDelete}
                onUseTemplate={onUseTemplate}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
