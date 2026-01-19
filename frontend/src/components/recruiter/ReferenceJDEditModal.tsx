"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Loader2 } from "lucide-react";
import { ReferenceJD, CreateReferenceJDRequest } from "../../services/referenceJDService";
import { cn } from "../../lib/utils";

interface ReferenceJDEditModalProps {
  jd: ReferenceJD | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, data: CreateReferenceJDRequest) => Promise<void>;
}

export function ReferenceJDEditModal({
  jd,
  isOpen,
  onClose,
  onSave,
}: ReferenceJDEditModalProps) {
  const [formData, setFormData] = useState({
    role_overview: "",
    requiredSkillsAndExperience: [""],
    niceToHave: [""],
    benefits: [""],
    department: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (jd) {
      setFormData({
        role_overview: jd.role_overview || "",
        requiredSkillsAndExperience:
          jd.requiredSkillsAndExperience && jd.requiredSkillsAndExperience.length > 0
            ? jd.requiredSkillsAndExperience
            : [""],
        niceToHave: jd.niceToHave && jd.niceToHave.length > 0 ? jd.niceToHave : [""],
        benefits: jd.benefits && jd.benefits.length > 0 ? jd.benefits : [""],
        department: jd.department || "",
      });
    }
  }, [jd]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jd) return;

    const filteredRequired = formData.requiredSkillsAndExperience.filter(
      (item) => item.trim() !== "",
    );
    const filteredNiceToHave = formData.niceToHave.filter((item) => item.trim() !== "");
    const filteredBenefits = formData.benefits.filter((item) => item.trim() !== "");

    if (!formData.role_overview.trim() || filteredRequired.length === 0) {
      return;
    }

    setIsSaving(true);
    try {
      await onSave(jd.id, {
        role_overview: formData.role_overview.trim(),
        requiredSkillsAndExperience: filteredRequired,
        niceToHave: filteredNiceToHave.length > 0 ? filteredNiceToHave : [],
        benefits: filteredBenefits.length > 0 ? filteredBenefits : [],
        department: formData.department.trim() || undefined,
      });
      onClose();
    } catch (error) {
      console.error("Failed to save reference JD:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const updateArrayField = (field: string, index: number, value: string) => {
    setFormData((prev) => {
      const arr = [...(prev[field as keyof typeof prev] as string[])];
      arr[index] = value;
      return { ...prev, [field]: arr };
    });
  };

  const addArrayItem = (field: string) => {
    setFormData((prev) => {
      const arr = [...(prev[field as keyof typeof prev] as string[]), ""];
      return { ...prev, [field]: arr };
    });
  };

  const removeArrayItem = (field: string, index: number) => {
    setFormData((prev) => {
      const arr = (prev[field as keyof typeof prev] as string[]).filter(
        (_, i) => i !== index,
      );
      return { ...prev, [field]: arr.length ? arr : [""] };
    });
  };

  if (!isOpen || !jd) return null;

  const content = (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-[20px] bg-white shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
        <div className="bg-white px-10 py-8 border-b border-slate-100 relative">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all duration-200"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <h2 className="text-3xl font-bold text-slate-900 leading-tight tracking-tight">
            Edit Reference JD
          </h2>
          <p className="text-slate-500 mt-2 font-medium text-lg">
            Update the reference job description details.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-10 py-8 bg-slate-50">
          <div className="space-y-8">
            {/* Basic Information Section */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="px-8 py-6 border-b border-slate-100">
                <h4 className="text-xl font-bold text-slate-900">
                  Basic Information
                </h4>
              </div>
              <div className="px-8 py-6 space-y-6">
                {/* Department */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    Department
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, department: e.target.value }))
                    }
                    placeholder="e.g. Engineering"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-base text-slate-800 placeholder:text-slate-400 transition-all"
                  />
                </div>

                {/* Role Overview */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    Role Overview <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={formData.role_overview}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, role_overview: e.target.value }))
                    }
                    placeholder="Describe the role overview..."
                    rows={5}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-base leading-relaxed text-slate-800 placeholder:text-slate-400 resize-y"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Required Skills & Experience Section */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="px-8 py-6 border-b border-slate-100">
                <h4 className="text-xl font-bold text-slate-900">
                  Required Skills & Experience
                </h4>
                <p className="text-sm text-slate-500 mt-2">
                  Add requirements, skills, and experience here.
                </p>
              </div>
              <div className="px-8 py-6 space-y-4">
                {formData.requiredSkillsAndExperience.map((item, index) => (
                  <div key={index} className="flex gap-3 items-start">
                    <div className="flex-1">
                      <textarea
                        value={item}
                        onChange={(e) =>
                          updateArrayField("requiredSkillsAndExperience", index, e.target.value)
                        }
                        placeholder="e.g. 5+ years of experience with Python for backend development"
                        rows={Math.max(2, Math.ceil(item.length / 60))}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-base leading-relaxed text-slate-800 placeholder:text-slate-400 transition-colors duration-200 resize-y min-h-[60px] max-h-[200px] overflow-y-auto whitespace-pre-wrap break-words"
                      />
                    </div>
                    {formData.requiredSkillsAndExperience.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArrayItem("requiredSkillsAndExperience", index)}
                        className="px-3 py-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors text-base cursor-pointer font-medium flex-shrink-0 mt-1"
                        aria-label="Remove requirement"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayItem("requiredSkillsAndExperience")}
                  className="text-sm text-indigo-500 font-medium hover:underline cursor-pointer"
                >
                  + Add requirements
                </button>
              </div>
            </div>

            {/* Nice to Have Section */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="px-8 py-6 border-b border-slate-100">
                <h4 className="text-xl font-bold text-slate-900">
                  Nice to Have
                </h4>
                <p className="text-sm text-slate-500 mt-2">
                  Optional experiences, qualities that would be beneficial but not
                  strictly required for this role.
                </p>
              </div>
              <div className="px-8 py-6 space-y-4">
                {formData.niceToHave.map((item, index) => (
                  <div key={index} className="flex gap-3 items-start">
                    <div className="flex-1">
                      <textarea
                        value={item}
                        onChange={(e) =>
                          updateArrayField("niceToHave", index, e.target.value)
                        }
                        placeholder="e.g. Experience with Kubernetes and container orchestration"
                        rows={Math.max(2, Math.ceil(item.length / 60))}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-base leading-relaxed text-slate-800 placeholder:text-slate-400 transition-colors duration-200 resize-y min-h-[60px] max-h-[200px] overflow-y-auto whitespace-pre-wrap break-words"
                      />
                    </div>
                    {formData.niceToHave.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArrayItem("niceToHave", index)}
                        className="px-3 py-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors text-base cursor-pointer font-medium flex-shrink-0 mt-1"
                        aria-label="Remove nice to have"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayItem("niceToHave")}
                  className="text-sm text-indigo-500 font-medium hover:underline cursor-pointer"
                >
                  + Add nice to have
                </button>
              </div>
            </div>

            {/* Benefits & Perks Section */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="px-8 py-6 border-b border-slate-100">
                <h4 className="text-xl font-bold text-slate-900">
                  Benefits & Perks
                </h4>
              </div>
              <div className="px-8 py-6 space-y-4">
                {formData.benefits.map((item, index) => (
                  <div key={index} className="flex gap-3 items-start">
                    <div className="flex-1">
                      <textarea
                        value={item}
                        onChange={(e) =>
                          updateArrayField("benefits", index, e.target.value)
                        }
                        placeholder="Add what we offer..."
                        rows={Math.max(2, Math.ceil(item.length / 60))}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-base leading-relaxed text-slate-800 placeholder:text-slate-400 transition-colors duration-200 resize-y min-h-[60px] max-h-[200px] overflow-y-auto whitespace-pre-wrap break-words"
                      />
                    </div>
                    {formData.benefits.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArrayItem("benefits", index)}
                        className="px-3 py-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors text-base cursor-pointer font-medium flex-shrink-0 mt-1"
                        aria-label="Remove benefit"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayItem("benefits")}
                  className="text-sm text-indigo-500 font-medium hover:underline cursor-pointer"
                >
                  + Add offering
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 bg-white px-10 py-6 flex items-center justify-end gap-4 mt-8 -mx-10 -mb-8">
            <button
              type="button"
              onClick={onClose}
              className="h-12 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !formData.role_overview.trim() || formData.requiredSkillsAndExperience.filter((item) => item.trim() !== "").length === 0}
              className={cn(
                "h-12 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-all duration-200 flex items-center gap-2",
                (isSaving || !formData.role_overview.trim() || formData.requiredSkillsAndExperience.filter((item) => item.trim() !== "").length === 0)
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:scale-105 active:scale-95",
              )}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  if (typeof document !== "undefined") {
    return createPortal(content, document.body);
  }
  return content;
}
