"use client";

import { Sparkles } from "lucide-react";

export default function AIPoweredBadge() {
  return (
    <div className="relative group inline-flex items-center gap-1 cursor-pointer">
      <Sparkles className="w-4 h-4 text-blue-500" />
      <span className="text-sm font-medium text-gray-600">AI Powered</span>
      
      {/* Tooltip */}
      <div
        className="absolute top-full mt-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 group-hover:translate-y-1 transition-all duration-300 ease-out pointer-events-none z-50"
      >
        <div className="bg-white/95 text-gray-700 text-sm px-3 py-2 rounded-xl shadow-md max-w-sm text-center whitespace-normal">
          Our AI understands your skills and suggests you with the right opportunities.
        </div>
      </div>
    </div>
  );
}

