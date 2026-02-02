'use client'

import { Sparkles } from 'lucide-react'

export default function AIPoweredBadge() {
  return (
    <div className="relative group inline-flex items-center gap-2 cursor-pointer">
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full transition-all duration-300 hover:bg-slate-50 hover:border-slate-300">
        <Sparkles className="w-4 h-4 text-indigo-600" />
        <span className="text-sm font-semibold text-slate-700">AI Powered</span>
      </div>

      {/* Tooltip */}
      <div className="absolute top-full mt-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 ease-out pointer-events-none z-50">
        {/* Arrow pointing up to badge */}
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-b-[6px] border-l-transparent border-r-transparent border-b-white drop-shadow-sm" />

        {/* Tooltip content */}
        <div className="relative bg-white text-slate-700 text-base leading-relaxed px-5 py-4 rounded-2xl shadow-xl max-w-sm text-center whitespace-normal">
          Our AI understands your skills and suggests you with the right opportunities.
        </div>
      </div>
    </div>
  )
}
