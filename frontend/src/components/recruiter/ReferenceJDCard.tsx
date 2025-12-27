/**
 * ReferenceJDCard - Clean, minimal card for reference job descriptions
 */

import React from 'react';
import { Sparkles, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { ReferenceJD, departmentColors } from '../../constants/referenceJDs';

interface ReferenceJDCardProps {
    jd: ReferenceJD;
    onClick?: () => void;
    onUseTemplate?: (e: React.MouseEvent) => void;
    className?: string;
}

export function ReferenceJDCard({ jd, onClick, onUseTemplate, className }: ReferenceJDCardProps) {
    const deptColor = departmentColors[jd.department] || departmentColors.Engineering;

    return (
        <div
            onClick={onClick}
            className={cn(
                'group relative bg-white rounded-2xl p-6 cursor-pointer',
                'border border-gray-100',
                'transition-all duration-300 ease-out',
                'hover:border-gray-200 hover:shadow-lg hover:shadow-gray-100/50',
                'hover:-translate-y-0.5',
                className
            )}
        >
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <span
                    className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold"
                    style={{ backgroundColor: deptColor.bg, color: deptColor.text }}
                >
                    {jd.department}
                </span>
                <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-md">
                    {jd.level}
                </span>
            </div>

            {/* Title */}
            <h3 className="text-lg font-semibold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-200 line-clamp-2">
                {jd.title}
            </h3>

            {/* Description */}
            <p className="text-sm text-gray-500 line-clamp-2 mb-5 leading-relaxed">
                {jd.description}
            </p>

            {/* Skills */}
            <div className="flex flex-wrap gap-1.5 mb-5">
                {jd.skills.slice(0, 4).map((skill) => (
                    <span
                        key={skill}
                        className="px-2 py-0.5 text-xs text-gray-500 bg-gray-50 rounded-md"
                    >
                        {skill}
                    </span>
                ))}
                {jd.skills.length > 4 && (
                    <span className="px-2 py-0.5 text-xs text-gray-400">
                        +{jd.skills.length - 4}
                    </span>
                )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                <button
                    onClick={onUseTemplate}
                    className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                >
                    <Sparkles className="w-3.5 h-3.5" />
                    Use Pattern
                </button>

                <div className="flex items-center gap-1 text-gray-400 group-hover:text-blue-600 transition-colors">
                    <span className="text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">Details</span>
                    <ChevronRight className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" />
                </div>
            </div>
        </div>
    );
}
