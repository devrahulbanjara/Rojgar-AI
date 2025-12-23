/**
 * PostJobModal - Modal for selecting job creation mode (Agent or Manual)
 * Features large clickable cards with icons and descriptions
 */

'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Sparkles, Edit3 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { JobCreationWizard } from './JobCreationWizard';

interface PostJobModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialMode?: CreationMode;
}

type CreationMode = 'agent' | 'manual' | null;

export function PostJobModal({ isOpen, onClose, initialMode }: PostJobModalProps) {
    const [selectedMode, setSelectedMode] = useState<CreationMode>(null);

    // Initialize mode when opening
    useEffect(() => {
        if (isOpen && initialMode) {
            setSelectedMode(initialMode);
        }
    }, [isOpen, initialMode]);

    // Prevent body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    // Handle escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (selectedMode && !initialMode) {
                    setSelectedMode(null);
                } else {
                    onClose();
                }
            }
        };
        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            return () => document.removeEventListener('keydown', handleEscape);
        }
    }, [isOpen, onClose, selectedMode, initialMode]);

    // Reset mode when modal closes
    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => setSelectedMode(null), 300);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const content = (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200"
                onClick={() => {
                    if (selectedMode && !initialMode) {
                        setSelectedMode(null);
                    } else {
                        onClose();
                    }
                }}
            />

            {/* Modal */}
            <div
                className={cn(
                    'relative bg-white rounded-xl shadow-lg animate-zoom-in',
                    'max-h-[90vh] overflow-hidden flex flex-col',
                    selectedMode ? 'w-[900px] max-w-[95vw]' : 'w-[540px] max-w-[95vw]'
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#F1F5F9]">
                    <div>
                        <h2 className="text-lg font-medium text-[#1E293B]">
                            {selectedMode ? 'Create New Job' : 'Post New Job'}
                        </h2>
                        <p className="text-xs text-[#94A3B8] mt-0.5">
                            {selectedMode
                                ? selectedMode === 'agent'
                                    ? 'Let AI generate your job posting'
                                    : 'Create your job posting manually'
                                : 'Choose how you want to create your job posting'}
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            if (selectedMode && !initialMode) {
                                setSelectedMode(null);
                            } else {
                                onClose();
                            }
                        }}
                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#F8FAFC] transition-colors"
                    >
                        <X className="w-4 h-4 text-[#94A3B8]" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    {!selectedMode ? (
                        /* Mode Selection */
                        <div className="p-6">
                            <div className="grid grid-cols-2 gap-4">
                                {/* Agent Mode Card */}
                                <button
                                    onClick={() => setSelectedMode('agent')}
                                    className={cn(
                                        'group p-5 border border-[#E2E8F0] rounded-xl text-center',
                                        'transition-all duration-200 ease-out',
                                        'hover:border-[#6366F1]/40 hover:shadow-sm hover:scale-[1.02]',
                                        'focus:outline-none focus:ring-2 focus:ring-[#6366F1]/15'
                                    )}
                                >
                                    <div
                                        className="w-11 h-11 mx-auto mb-3 rounded-xl flex items-center justify-center"
                                        style={{
                                            background: 'linear-gradient(135deg, #6366F1, #818CF8)',
                                        }}
                                    >
                                        <Sparkles className="w-5 h-5 text-white" />
                                    </div>
                                    <h3 className="text-sm font-medium text-[#1E293B] mb-1.5 group-hover:text-[#6366F1] transition-colors">
                                        Agent Mode
                                    </h3>
                                    <p className="text-xs text-[#94A3B8] leading-relaxed">
                                        Let AI generate your job posting from reference JDs.
                                    </p>
                                </button>

                                {/* Manual Mode Card */}
                                <button
                                    onClick={() => setSelectedMode('manual')}
                                    className={cn(
                                        'group p-5 border border-[#E2E8F0] rounded-xl text-center',
                                        'transition-all duration-200 ease-out',
                                        'hover:border-[#6366F1]/40 hover:shadow-sm hover:scale-[1.02]',
                                        'focus:outline-none focus:ring-2 focus:ring-[#6366F1]/15'
                                    )}
                                >
                                    <div
                                        className="w-11 h-11 mx-auto mb-3 rounded-xl flex items-center justify-center bg-[#64748B]"
                                    >
                                        <Edit3 className="w-5 h-5 text-white" />
                                    </div>
                                    <h3 className="text-sm font-medium text-[#1E293B] mb-1.5 group-hover:text-[#6366F1] transition-colors">
                                        Manual Mode
                                    </h3>
                                    <p className="text-xs text-[#94A3B8] leading-relaxed">
                                        Create job posting with full control.
                                    </p>
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* Job Creation Wizard */
                        <JobCreationWizard
                            mode={selectedMode}
                            onBack={() => setSelectedMode(null)}
                            onComplete={() => {
                                onClose();
                            }}
                        />
                    )}
                </div>
            </div>
        </div>
    );

    // Render using portal
    if (typeof document !== 'undefined') {
        return createPortal(content, document.body);
    }
    return content;
}
