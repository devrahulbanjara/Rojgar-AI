"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Bot, PenTool, ArrowRight } from "lucide-react";
import { cn } from "../../lib/utils";
import { JobCreationWizard } from "./JobCreationWizard";
import type { Job } from "../../types/job";

interface PostJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: CreationMode;
  jobToEdit?: Job;
}

type CreationMode = "agent" | "manual" | null;

export function PostJobModal({
  isOpen,
  onClose,
  initialMode,
  jobToEdit,
}: PostJobModalProps) {
  const [selectedMode, setSelectedMode] = useState<CreationMode>(null);

  // Initialize mode when opening
  useEffect(() => {
    if (isOpen && initialMode) {
      setSelectedMode(initialMode);
    }
    // If editing, default to manual mode
    if (isOpen && jobToEdit) {
      setSelectedMode("manual");
    }
  }, [isOpen, initialMode, jobToEdit]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (selectedMode && !initialMode) {
          setSelectedMode(null);
        } else {
          onClose();
        }
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
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
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
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
          "relative bg-white rounded-3xl shadow-2xl border border-white/20",
          "max-h-[90vh] overflow-hidden flex flex-col",
          "animate-in zoom-in-95 duration-300 ease-out",
          selectedMode ? "w-[900px] max-w-[95vw]" : "w-[600px] max-w-[95vw]",
        )}
        style={{
          boxShadow:
            "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)",
        }}
      >
        {/* Clean Header */}
        <div className="bg-white px-10 py-8 border-b border-slate-100 relative">
          {/* Close Button */}
          <button
            onClick={() => {
              if (selectedMode && !initialMode) {
                setSelectedMode(null);
              } else {
                onClose();
              }
            }}
            className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all duration-200 hover:scale-110 active:scale-95 border border-slate-100"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Title */}
          <div className="relative z-10">
            <h2 className="text-3xl font-bold text-slate-900 leading-tight tracking-tight">
              {jobToEdit
                ? "Edit Job Posting"
                : selectedMode
                  ? "Create New Job"
                  : "Create Job Posting"}
            </h2>
            <p className="text-slate-500 mt-2 font-medium text-lg">
              {jobToEdit
                ? "Update your job posting details"
                : selectedMode
                  ? selectedMode === "agent"
                    ? "Let AI help you create a compelling job description"
                    : "Build your job posting step by step"
                  : "Choose how you want to create your job posting"}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-slate-50">
          {!selectedMode && !jobToEdit ? (
            /* Mode Selection - Vibrant Colorful Layout */
            <div className="px-10 py-10">
              <div className="space-y-4 max-w-2xl mx-auto">
                {/* Agent Mode Card */}
                <button
                  onClick={() => setSelectedMode("agent")}
                  className={cn(
                    "group w-full p-5 bg-white border border-slate-200 rounded-2xl",
                    "transition-all duration-300 cursor-pointer text-left relative overflow-hidden",
                    "hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1",
                    "focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500",
                  )}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  <div className="flex items-center gap-4 relative z-10">
                    {/* Colorful Icon Box */}
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-300">
                      <Bot className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <h3 className="text-base font-bold text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors">
                          AI-Powered Generation
                        </h3>
                        <span className="px-2 py-0.5 text-[10px] font-bold text-white bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full shadow-sm">
                          Recommended
                        </span>
                      </div>
                      <p className="text-slate-600 leading-relaxed text-sm">
                        Let AI create a professional job posting from your
                        requirements in seconds. Perfect for quick drafts.
                      </p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                </button>

                {/* Manual Mode Card */}
                <button
                  onClick={() => setSelectedMode("manual")}
                  className={cn(
                    "group w-full p-5 bg-white border border-slate-200 rounded-2xl",
                    "transition-all duration-300 cursor-pointer text-left relative overflow-hidden",
                    "hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500",
                  )}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  <div className="flex items-center gap-4 relative z-10">
                    {/* Colorful Icon Box */}
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform duration-300">
                      <PenTool className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-bold text-slate-900 mb-1.5 tracking-tight group-hover:text-blue-600 transition-colors">
                        Manual Creation
                      </h3>
                      <p className="text-slate-600 leading-relaxed text-sm">
                        Build your job posting step-by-step with complete
                        control over every detail. Best for specific
                        requirements.
                      </p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                </button>
              </div>
            </div>
          ) : (
            /* Job Creation/Edit Wizard */
            <JobCreationWizard
              mode={selectedMode || "manual"}
              onBack={() => setSelectedMode(null)}
              onComplete={() => {
                onClose();
              }}
              jobToEdit={jobToEdit}
            />
          )}
        </div>
      </div>
    </div>
  );

  // Render using portal
  if (typeof document !== "undefined") {
    return createPortal(content, document.body);
  }
  return content;
}
