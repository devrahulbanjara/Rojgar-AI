/**
 * PostJobModal - Modal for selecting job creation mode (Agent or Manual)
 * Features large clickable cards with icons and descriptions
 */

'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Bot, PenTool, Zap, CheckCircle2, ArrowRight } from 'lucide-react';
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
            {/* Backdrop with blur */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm"
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
                    'relative bg-white rounded-2xl shadow-2xl border border-slate-200/50',
                    'max-h-[90vh] overflow-hidden flex flex-col',
                    'animate-in zoom-in-95 duration-200',
                    selectedMode ? 'w-[900px] max-w-[95vw]' : 'w-[600px] max-w-[95vw]'
                )}
            >
                {/* Header */}
                <div className="bg-white px-6 py-5 border-b border-slate-200">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-slate-900">
                            {selectedMode ? 'Create New Job' : 'Create Job Posting'}
                        </h2>
                        <button
                            onClick={() => {
                                if (selectedMode && !initialMode) {
                                    setSelectedMode(null);
                                } else {
                                    onClose();
                                }
                            }}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
                            aria-label="Close modal"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto bg-white">
                    {!selectedMode ? (
                        /* Mode Selection - Clean Minimal Layout */
                        <div className="p-8">
                            <div className="space-y-3 max-w-xl mx-auto">
                                {/* Agent Mode Card */}
                                <button
                                    onClick={() => setSelectedMode('agent')}
                                    className={cn(
                                        'group w-full p-5 bg-white border border-slate-200 rounded-xl',
                                        'transition-all duration-200 cursor-pointer',
                                        'hover:border-indigo-300 hover:shadow-md',
                                        'focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500'
                                    )}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-500 transition-colors">
                                            <Bot className="w-6 h-6 text-indigo-600 group-hover:text-white transition-colors" />
                                        </div>
                                        <div className="flex-1 text-left">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-base font-semibold text-slate-900">
                                                    AI-Powered Generation
                                                </h3>
                                                <span className="px-2 py-0.5 text-xs font-medium text-indigo-700 bg-indigo-50 rounded">
                                                    Recommended
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-600">
                                                Let AI create your job posting from requirements
                                            </p>
                                        </div>
                                        <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors flex-shrink-0" />
                                    </div>
                                </button>

                                {/* Manual Mode Card */}
                                <button
                                    onClick={() => setSelectedMode('manual')}
                                    className={cn(
                                        'group w-full p-5 bg-white border border-slate-200 rounded-xl',
                                        'transition-all duration-200 cursor-pointer',
                                        'hover:border-slate-300 hover:shadow-md',
                                        'focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-400'
                                    )}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 group-hover:bg-slate-600 transition-colors">
                                            <PenTool className="w-6 h-6 text-slate-600 group-hover:text-white transition-colors" />
                                        </div>
                                        <div className="flex-1 text-left">
                                            <h3 className="text-base font-semibold text-slate-900 mb-1">
                                                Manual Creation
                                            </h3>
                                            <p className="text-sm text-slate-600">
                                                Build your job posting with full control
                                            </p>
                                        </div>
                                        <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors flex-shrink-0" />
                                    </div>
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
