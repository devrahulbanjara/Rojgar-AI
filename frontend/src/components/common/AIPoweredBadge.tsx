'use client'

import { Sparkles } from 'lucide-react'

export default function AIPoweredBadge() {
  return (
    <div className="relative group inline-flex items-center gap-2 cursor-pointer">
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-ai-50 dark:bg-ai-950/30 border border-ai-200 dark:border-ai-800 rounded-full transition-all duration-300 hover:bg-ai-100 dark:hover:bg-ai-900/30 hover:border-ai-300 dark:hover:border-ai-700">
        <Sparkles className="w-4 h-4 text-ai-600 dark:text-ai-400" />
        <span className="text-sm font-semibold text-ai-700 dark:text-ai-300 font-mono">
          AI Powered
        </span>
      </div>

      {/* Tooltip */}
      <div className="absolute top-full mt-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 ease-out pointer-events-none z-50">
        {/* Tooltip arrow */}
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-b-[6px] border-l-transparent border-r-transparent border-b-background-surface drop-shadow-sm" />

        {/* Tooltip content */}
        <div className="relative bg-background-surface text-text-secondary text-base leading-relaxed px-5 py-4 rounded-2xl shadow-xl max-w-sm text-center whitespace-normal">
          Our AI understands your skills and suggests you with the right opportunities.
        </div>
      </div>
    </div>
  )
}
