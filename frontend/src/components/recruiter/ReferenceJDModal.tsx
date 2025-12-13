/**
 * ReferenceJDModal - Detailed view of a reference JD
 */

import React from 'react';
import { createPortal } from 'react-dom';
import { X, MapPin, Briefcase, DollarSign, Sparkles, CheckCircle2, Building2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { ReferenceJD, departmentColors } from '../../constants/referenceJDs';

interface ReferenceJDModalProps {
    jd: ReferenceJD | null;
    isOpen: boolean;
    onClose: () => void;
    onUseTemplate: (jd: ReferenceJD) => void;
}

export function ReferenceJDModal({ jd, isOpen, onClose, onUseTemplate }: ReferenceJDModalProps) {
    if (!isOpen || !jd) return null;

    const deptColor = departmentColors[jd.department] || departmentColors.Engineering;

    const content = (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Modal */}
            <div
                className={cn(
                    'relative bg-white rounded-2xl shadow-2xl animate-in zoom-in-95 duration-300',
                    'w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden'
                )}
            >
                {/* Header */}
                <div className="relative px-8 py-8 border-b border-gray-100 bg-white z-10">
                    <div className="absolute top-0 left-0 w-full h-1.5" style={{ background: deptColor.gradient }} />

                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="flex items-start justify-between pr-10">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <span
                                    className="px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase"
                                    style={{ backgroundColor: deptColor.bg, color: deptColor.text }}
                                >
                                    {jd.department}
                                </span>
                                <span className="text-sm text-gray-500 font-medium px-2 py-0.5 bg-gray-100 rounded">
                                    {jd.level} Level
                                </span>
                            </div>
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">{jd.title}</h2>
                            <div className="flex items-center gap-6 text-sm text-gray-500 font-medium">
                                <div className="flex items-center gap-1.5">
                                    <Building2 className="w-4 h-4 text-gray-400" />
                                    <span>ConvexHire (Example)</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <MapPin className="w-4 h-4 text-gray-400" />
                                    <span>United States (Remote)</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <DollarSign className="w-4 h-4 text-gray-400" />
                                    <span>${(jd.salaryRange.min / 1000).toFixed(0)}k - ${(jd.salaryRange.max / 1000).toFixed(0)}k</span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => onUseTemplate(jd)}
                            className="hidden sm:flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 hover:-translate-y-0.5"
                        >
                            <Sparkles className="w-5 h-5" />
                            Use Pattern for AI
                        </button>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-8 py-8 space-y-10">
                    {/* Description */}
                    <section>
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Briefcase className="w-5 h-5 text-gray-400" />
                            Role Overview
                        </h3>
                        <p className="text-gray-600 leading-relaxed text-lg">
                            {jd.description}
                        </p>
                    </section>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {/* Requirements */}
                        <section>
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-gray-400" />
                                Requirements
                            </h3>
                            <ul className="space-y-3">
                                {jd.requirements.map((req, i) => (
                                    <li key={i} className="flex items-start gap-3 text-gray-600">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2.5 flex-shrink-0" />
                                        <span className="leading-relaxed">{req}</span>
                                    </li>
                                ))}
                            </ul>
                        </section>

                        {/* Skills */}
                        <section>
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-gray-400" />
                                Key Skills
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {jd.skills.map((skill, i) => (
                                    <span
                                        key={i}
                                        className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg"
                                    >
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* Helper Box */}
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 mt-8">
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                                <Sparkles className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <h4 className="text-base font-semibold text-blue-900 mb-1">AI Generation Tip</h4>
                                <p className="text-sm text-blue-700 leading-relaxed">
                                    Use this reference JD as a structural pattern. When you click "Use Pattern for AI",
                                    we'll copy the key structure keywords to the Agent Mode input, where you can customize them further.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile Footer */}
                <div className="sm:hidden border-t border-gray-100 p-4 bg-white">
                    <button
                        onClick={() => onUseTemplate(jd)}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/20"
                    >
                        <Sparkles className="w-5 h-5" />
                        Use Pattern for AI
                    </button>
                </div>
            </div>
        </div>
    );

    if (typeof document !== 'undefined') {
        return createPortal(content, document.body);
    }
    return content;
}
