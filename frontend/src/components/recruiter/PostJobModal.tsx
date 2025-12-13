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
                className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300"
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
                    'relative bg-white rounded-2xl shadow-2xl animate-zoom-in',
                    'max-h-[90vh] overflow-hidden flex flex-col',
                    selectedMode ? 'w-[900px] max-w-[95vw]' : 'w-[800px] max-w-[95vw]'
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-8 py-6 border-b border-[#E5E7EB]">
                    <div>
                        <h2 className="text-2xl font-semibold text-[#111827]">
                            {selectedMode ? 'Create New Job' : 'Post New Job'}
                        </h2>
                        <p className="text-sm text-[#6B7280] mt-1">
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
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#F3F4F6] hover:bg-[#E5E7EB] transition-colors"
                    >
                        <X className="w-5 h-5 text-[#6B7280]" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    {!selectedMode ? (
                        /* Mode Selection */
                        <div className="p-10">
                            <div className="grid grid-cols-2 gap-6">
                                {/* Agent Mode Card */}
                                <button
                                    onClick={() => setSelectedMode('agent')}
                                    className={cn(
                                        'group p-10 border-2 border-[#E5E7EB] rounded-2xl text-center',
                                        'transition-all duration-300',
                                        'hover:border-[#3B82F6] hover:scale-[1.02]',
                                        'focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20'
                                    )}
                                >
                                    <div
                                        className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center"
                                        style={{
                                            background: 'linear-gradient(135deg, #3B82F6,  #60A5FA)',
                                        }}
                                    >
                                        <Sparkles className="w-10 h-10 text-white" />
                                    </div>
                                    <h3 className="text-2xl font-semibold text-[#111827] mb-3 group-hover:text-[#3B82F6] transition-colors">
                                        Agent Mode
                                    </h3>
                                    <p className="text-sm text-[#6B7280] leading-relaxed">
                                        Let AI generate your job posting from reference JDs. Perfect for quick, professional job descriptions.
                                    </p>
                                </button>

                                {/* Manual Mode Card */}
                                <button
                                    onClick={() => setSelectedMode('manual')}
                                    className={cn(
                                        'group p-10 border-2 border-[#E5E7EB] rounded-2xl text-center',
                                        'transition-all duration-300',
                                        'hover:border-[#3B82F6] hover:scale-[1.02]',
                                        'focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20'
                                    )}
                                >
                                    <div
                                        className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center bg-[#6B7280]"
                                    >
                                        <Edit3 className="w-10 h-10 text-white" />
                                    </div>
                                    <h3 className="text-2xl font-semibold text-[#111827] mb-3 group-hover:text-[#3B82F6] transition-colors">
                                        Manual Mode
                                    </h3>
                                    <p className="text-sm text-[#6B7280] leading-relaxed">
                                        Create job posting with full control. Ideal when you have specific requirements and preferences.
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
