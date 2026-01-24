"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Loader2, Pencil } from "lucide-react";
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
    job_summary: "",
    job_responsibilities: [""],
    required_qualifications: [""],
    preferred: [""],
    compensation_and_benefits: [""],
    department: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [editingField, setEditingField] = useState<{
    field: string;
    index: number;
  } | null>(null);
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    if (jd) {
      // Map new backend fields with fallback to legacy fields
      const jobSummary = jd.job_summary || jd.role_overview || "";
      const jobResponsibilities = jd.job_responsibilities && jd.job_responsibilities.length > 0
        ? jd.job_responsibilities
        : [""];
      const requiredQualifications = (jd.required_qualifications || jd.requiredSkillsAndExperience || []);
      const preferred = (jd.preferred || jd.niceToHave || []);
      const compensationAndBenefits = (jd.compensation_and_benefits || jd.benefits || []);

      setFormData({
        job_summary: jobSummary,
        job_responsibilities: jobResponsibilities.length > 0 ? jobResponsibilities : [""],
        required_qualifications: requiredQualifications.length > 0 ? requiredQualifications : [""],
        preferred: preferred.length > 0 ? preferred : [""],
        compensation_and_benefits: compensationAndBenefits.length > 0 ? compensationAndBenefits : [""],
        department: jd.department || "",
      });
    }
  }, [jd]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jd) return;

    const filteredJobResponsibilities = formData.job_responsibilities.filter(
      (item) => item.trim() !== "",
    );
    const filteredRequired = formData.required_qualifications.filter(
      (item) => item.trim() !== "",
    );
    const filteredPreferred = formData.preferred.filter((item) => item.trim() !== "");
    const filteredCompensationAndBenefits = formData.compensation_and_benefits.filter((item) => item.trim() !== "");

    if (!formData.job_summary.trim() || filteredRequired.length === 0) {
      return;
    }

    setIsSaving(true);
    try {
      await onSave(jd.id, {
        job_summary: formData.job_summary.trim(),
        job_responsibilities: filteredJobResponsibilities,
        required_qualifications: filteredRequired,
        preferred: filteredPreferred.length > 0 ? filteredPreferred : [],
        compensation_and_benefits: filteredCompensationAndBenefits.length > 0 ? filteredCompensationAndBenefits : [],
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
    if (editingField?.field === field && editingField.index === index) {
      setEditingField(null);
    }
  };

  const startEditing = (field: string, index: number, currentValue: string) => {
    setEditingField({ field, index });
    setEditValue(currentValue);
  };

  const saveEdit = () => {
    if (editingField) {
      updateArrayField(editingField.field, editingField.index, editValue);
      setEditingField(null);
      setEditValue("");
    }
  };

  const cancelEdit = () => {
    setEditingField(null);
    setEditValue("");
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

                {/* Job Summary (Role Overview) */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    Job Summary <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={formData.job_summary}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, job_summary: e.target.value }))
                    }
                    placeholder="Describe the role overview..."
                    rows={5}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-base leading-relaxed text-slate-800 placeholder:text-slate-400 resize-y"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Job Responsibilities Section */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="px-8 py-6 border-b border-slate-100">
                <h4 className="text-xl font-bold text-slate-900">
                  Job Responsibilities
                </h4>
                <p className="text-sm text-slate-500 mt-2">
                  Add key responsibilities and duties for this role.
                </p>
              </div>
              <div className="px-8 py-6 space-y-4">
                {formData.job_responsibilities.map((item, index) => {
                  const isEditing =
                    editingField?.field === "job_responsibilities" &&
                    editingField.index === index;
                  return (
                    <div key={index} className="relative">
                      {isEditing ? (
                        <div className="space-y-2">
                          <textarea
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            placeholder="e.g. Design and implement scalable backend services"
                            rows={Math.max(2, Math.ceil(editValue.length / 60))}
                            className="w-full px-4 pr-14 py-3 border-2 border-indigo-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-base leading-relaxed text-slate-800 placeholder:text-slate-400 transition-colors duration-200 resize-y min-h-[60px] max-h-[200px] overflow-y-auto whitespace-pre-wrap break-words"
                            autoFocus
                          />
                          <div className="flex gap-2 justify-end">
                            <button
                              type="button"
                              onClick={cancelEdit}
                              className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={saveEdit}
                              className="px-3 py-1.5 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="relative">
                          <textarea
                            value={item}
                            onChange={(e) =>
                              updateArrayField("job_responsibilities", index, e.target.value)
                            }
                            placeholder="e.g. Design and implement scalable backend services"
                            rows={Math.max(2, Math.ceil(item.length / 60))}
                            className="w-full px-4 pr-14 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-base leading-relaxed text-slate-800 placeholder:text-slate-400 transition-colors duration-200 resize-y min-h-[60px] max-h-[200px] overflow-y-auto whitespace-pre-wrap break-words"
                          />
                          <div className="absolute right-0 top-1/2 -translate-y-1/2">
                            <button
                              type="button"
                              onClick={() =>
                                startEditing("job_responsibilities", index, item)
                              }
                              className="absolute p-1.5 text-slate-400 hover:text-indigo-600 transition-colors rounded hover:bg-indigo-50"
                              style={{ right: "40px", top: "50%", transform: "translateY(-50%)" }}
                              aria-label="Edit responsibility"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            {formData.job_responsibilities.length > 1 && (
                              <button
                                type="button"
                                onClick={() =>
                                  removeArrayItem("job_responsibilities", index)
                                }
                                className="absolute p-1.5 text-slate-400 hover:text-red-500 transition-colors rounded hover:bg-red-50"
                                style={{ right: "12px", top: "50%", transform: "translateY(-50%)" }}
                                aria-label="Remove responsibility"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                <button
                  type="button"
                  onClick={() => addArrayItem("job_responsibilities")}
                  className="text-sm text-indigo-500 font-medium hover:underline cursor-pointer"
                >
                  + Add responsibility
                </button>
              </div>
            </div>

            {/* Required Qualifications Section */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="px-8 py-6 border-b border-slate-100">
                <h4 className="text-xl font-bold text-slate-900">
                  Required Qualifications
                </h4>
                <p className="text-sm text-slate-500 mt-2">
                  Add requirements, skills, and experience here.
                </p>
              </div>
              <div className="px-8 py-6 space-y-4">
                {formData.required_qualifications.map((item, index) => {
                  const isEditing =
                    editingField?.field === "required_qualifications" &&
                    editingField.index === index;
                  return (
                    <div key={index} className="relative">
                      {isEditing ? (
                        <div className="space-y-2">
                          <textarea
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            placeholder="e.g. 5+ years of experience with Python for backend development"
                            rows={Math.max(2, Math.ceil(editValue.length / 60))}
                            className="w-full px-4 pr-14 py-3 border-2 border-indigo-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-base leading-relaxed text-slate-800 placeholder:text-slate-400 transition-colors duration-200 resize-y min-h-[60px] max-h-[200px] overflow-y-auto whitespace-pre-wrap break-words"
                            autoFocus
                          />
                          <div className="flex gap-2 justify-end">
                            <button
                              type="button"
                              onClick={cancelEdit}
                              className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={saveEdit}
                              className="px-3 py-1.5 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="relative">
                          <textarea
                            value={item}
                            onChange={(e) =>
                              updateArrayField("required_qualifications", index, e.target.value)
                            }
                            placeholder="e.g. 5+ years of experience with Python for backend development"
                            rows={Math.max(2, Math.ceil(item.length / 60))}
                            className="w-full px-4 pr-14 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-base leading-relaxed text-slate-800 placeholder:text-slate-400 transition-colors duration-200 resize-y min-h-[60px] max-h-[200px] overflow-y-auto whitespace-pre-wrap break-words"
                          />
                          <div className="absolute right-0 top-1/2 -translate-y-1/2">
                            <button
                              type="button"
                              onClick={() =>
                                startEditing("required_qualifications", index, item)
                              }
                              className="absolute p-1.5 text-slate-400 hover:text-indigo-600 transition-colors rounded hover:bg-indigo-50"
                              style={{ right: "40px", top: "50%", transform: "translateY(-50%)" }}
                              aria-label="Edit requirement"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            {formData.required_qualifications.length > 1 && (
                              <button
                                type="button"
                                onClick={() =>
                                  removeArrayItem("required_qualifications", index)
                                }
                                className="absolute p-1.5 text-slate-400 hover:text-red-500 transition-colors rounded hover:bg-red-50"
                                style={{ right: "12px", top: "50%", transform: "translateY(-50%)" }}
                                aria-label="Remove requirement"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                <button
                  type="button"
                  onClick={() => addArrayItem("required_qualifications")}
                  className="text-sm text-indigo-500 font-medium hover:underline cursor-pointer"
                >
                  + Add requirements
                </button>
              </div>
            </div>

            {/* Preferred Section */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="px-8 py-6 border-b border-slate-100">
                <h4 className="text-xl font-bold text-slate-900">
                  Preferred
                </h4>
                <p className="text-sm text-slate-500 mt-2">
                  Optional experiences, qualities that would be beneficial but not
                  strictly required for this role.
                </p>
              </div>
              <div className="px-8 py-6 space-y-4">
                {formData.preferred.map((item, index) => {
                  const isEditing =
                    editingField?.field === "preferred" &&
                    editingField.index === index;
                  return (
                    <div key={index} className="relative">
                      {isEditing ? (
                        <div className="space-y-2">
                          <textarea
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            placeholder="e.g. Experience with Kubernetes and container orchestration"
                            rows={Math.max(2, Math.ceil(editValue.length / 60))}
                            className="w-full px-4 pr-14 py-3 border-2 border-indigo-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-base leading-relaxed text-slate-800 placeholder:text-slate-400 transition-colors duration-200 resize-y min-h-[60px] max-h-[200px] overflow-y-auto whitespace-pre-wrap break-words"
                            autoFocus
                          />
                          <div className="flex gap-2 justify-end">
                            <button
                              type="button"
                              onClick={cancelEdit}
                              className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={saveEdit}
                              className="px-3 py-1.5 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="relative">
                          <textarea
                            value={item}
                            onChange={(e) =>
                              updateArrayField("preferred", index, e.target.value)
                            }
                            placeholder="e.g. Experience with Kubernetes and container orchestration"
                            rows={Math.max(2, Math.ceil(item.length / 60))}
                            className="w-full px-4 pr-14 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-base leading-relaxed text-slate-800 placeholder:text-slate-400 transition-colors duration-200 resize-y min-h-[60px] max-h-[200px] overflow-y-auto whitespace-pre-wrap break-words"
                          />
                          <div className="absolute right-0 top-1/2 -translate-y-1/2">
                            <button
                              type="button"
                              onClick={() => startEditing("preferred", index, item)}
                              className="absolute p-1.5 text-slate-400 hover:text-indigo-600 transition-colors rounded hover:bg-indigo-50"
                              style={{ right: "40px", top: "50%", transform: "translateY(-50%)" }}
                              aria-label="Edit nice to have"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            {formData.preferred.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeArrayItem("preferred", index)}
                                className="absolute p-1.5 text-slate-400 hover:text-red-500 transition-colors rounded hover:bg-red-50"
                                style={{ right: "12px", top: "50%", transform: "translateY(-50%)" }}
                                aria-label="Remove nice to have"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                <button
                  type="button"
                  onClick={() => addArrayItem("preferred")}
                  className="text-sm text-indigo-500 font-medium hover:underline cursor-pointer"
                >
                  + Add nice to have
                </button>
              </div>
            </div>

            {/* Compensation & Benefits Section */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="px-8 py-6 border-b border-slate-100">
                <h4 className="text-xl font-bold text-slate-900">
                  Compensation & Benefits
                </h4>
              </div>
              <div className="px-8 py-6 space-y-4">
                {formData.compensation_and_benefits.map((item, index) => {
                  const isEditing =
                    editingField?.field === "compensation_and_benefits" &&
                    editingField.index === index;
                  return (
                    <div key={index} className="relative">
                      {isEditing ? (
                        <div className="space-y-2">
                          <textarea
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            placeholder="Add what we offer..."
                            rows={Math.max(2, Math.ceil(editValue.length / 60))}
                            className="w-full px-4 pr-14 py-3 border-2 border-indigo-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-base leading-relaxed text-slate-800 placeholder:text-slate-400 transition-colors duration-200 resize-y min-h-[60px] max-h-[200px] overflow-y-auto whitespace-pre-wrap break-words"
                            autoFocus
                          />
                          <div className="flex gap-2 justify-end">
                            <button
                              type="button"
                              onClick={cancelEdit}
                              className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={saveEdit}
                              className="px-3 py-1.5 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="relative">
                          <textarea
                            value={item}
                            onChange={(e) =>
                              updateArrayField("compensation_and_benefits", index, e.target.value)
                            }
                            placeholder="Add what we offer..."
                            rows={Math.max(2, Math.ceil(item.length / 60))}
                            className="w-full px-4 pr-14 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-base leading-relaxed text-slate-800 placeholder:text-slate-400 transition-colors duration-200 resize-y min-h-[60px] max-h-[200px] overflow-y-auto whitespace-pre-wrap break-words"
                          />
                          <div className="absolute right-0 top-1/2 -translate-y-1/2">
                            <button
                              type="button"
                              onClick={() => startEditing("compensation_and_benefits", index, item)}
                              className="absolute p-1.5 text-slate-400 hover:text-indigo-600 transition-colors rounded hover:bg-indigo-50"
                              style={{ right: "40px", top: "50%", transform: "translateY(-50%)" }}
                              aria-label="Edit benefit"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            {formData.compensation_and_benefits.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeArrayItem("compensation_and_benefits", index)}
                                className="absolute p-1.5 text-slate-400 hover:text-red-500 transition-colors rounded hover:bg-red-50"
                                style={{ right: "12px", top: "50%", transform: "translateY(-50%)" }}
                                aria-label="Remove benefit"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                <button
                  type="button"
                  onClick={() => addArrayItem("compensation_and_benefits")}
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
              disabled={isSaving || !formData.job_summary.trim() || formData.required_qualifications.filter((item) => item.trim() !== "").length === 0}
              className={cn(
                "h-12 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-all duration-200 flex items-center gap-2",
                (isSaving || !formData.job_summary.trim() || formData.required_qualifications.filter((item) => item.trim() !== "").length === 0)
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
