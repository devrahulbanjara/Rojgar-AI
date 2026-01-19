import React from "react";
import { createPortal } from "react-dom";
import { X, Briefcase, Sparkles, CheckCircle2, Gift, Trash2, Edit } from "lucide-react";
import { ReferenceJD } from "../../services/referenceJDService";

interface ReferenceJDModalProps {
  jd: ReferenceJD | null;
  isOpen: boolean;
  onClose: () => void;
  onUseTemplate: (jd: ReferenceJD) => void;
  onDelete?: (jd: ReferenceJD) => void;
  onEdit?: (jd: ReferenceJD) => void;
}

export function ReferenceJDModal({
  jd,
  isOpen,
  onClose,
  onUseTemplate,
  onDelete,
  onEdit,
}: ReferenceJDModalProps) {
  if (!isOpen || !jd) return null;

  const handleDelete = () => {
    if (onDelete) {
      onDelete(jd);
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(jd);
    }
  };

  const content = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-[900px] max-h-[90vh] flex flex-col rounded-[20px] bg-white shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
        {/* Enhanced Header with gradient background */}
        <div className="bg-gradient-to-b from-gray-50/80 to-white px-12 py-12 border-b border-gray-100 relative rounded-t-[20px]">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-8 right-8 p-2.5 rounded-full hover:bg-gray-100 transition-all duration-200 hover:scale-110 active:scale-95 group"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-gray-400 group-hover:text-gray-700 transition-colors" />
          </button>

          {/* Job Title & Department */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-700 text-sm font-semibold rounded-lg border border-blue-200">
                Reference JD
              </span>
              <span className="px-3 py-1.5 text-sm font-semibold rounded-lg border bg-gray-50 text-gray-600 border-gray-200">
                Template
              </span>
            </div>
            <h2 className="text-[28px] font-bold text-gray-900 leading-tight tracking-[0.3px]">
              Reference Job Description
            </h2>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-12 py-12">
          {/* Role Overview */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-8 bg-indigo-600 rounded-full"></div>
              <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-indigo-50">
                <Briefcase className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="text-[22px] font-semibold text-gray-900 tracking-[0.5px]">
                Role Overview
              </h3>
            </div>
            <div className="pl-14">
              <p className="text-[16px] text-gray-700 leading-[1.8]">
                {jd.role_overview}
              </p>
            </div>
          </section>

          {/* Required Skills and Experience */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-8 bg-emerald-600 rounded-full"></div>
              <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-emerald-50">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="text-[22px] font-semibold text-gray-900 tracking-[0.5px]">
                Required Skills and Experience
              </h3>
            </div>
            <div className="pl-14">
              <ul className="space-y-3 list-disc list-inside">
                {jd.requiredSkillsAndExperience.map((req, i) => (
                  <li
                    key={i}
                    className="text-[15px] text-gray-700 leading-relaxed pl-2"
                  >
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Nice to Have (Preferred) */}
          {jd.niceToHave && jd.niceToHave.length > 0 && (
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-8 bg-amber-600 rounded-full"></div>
                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-amber-50">
                  <Sparkles className="w-5 h-5 text-amber-600" />
                </div>
                <h3 className="text-[22px] font-semibold text-gray-900 tracking-[0.5px]">
                  Nice to Have (Preferred)
                </h3>
              </div>
              <div className="pl-14">
                <ul className="space-y-3 list-disc list-inside">
                  {jd.niceToHave.map((skill, i) => (
                    <li
                      key={i}
                      className="text-[15px] text-gray-700 leading-relaxed pl-2"
                    >
                      {skill}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          {/* What We Offer / Benefits */}
          {jd.benefits && jd.benefits.length > 0 && (
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-8 bg-violet-600 rounded-full"></div>
                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-violet-50">
                  <Gift className="w-5 h-5 text-violet-600" />
                </div>
                <h3 className="text-[22px] font-semibold text-gray-900 tracking-[0.5px]">
                  What We Offer
                </h3>
              </div>
              <div className="pl-14">
                <ul className="space-y-3 list-disc list-inside">
                  {jd.benefits.map((benefit, i) => (
                    <li
                      key={i}
                      className="text-[15px] text-gray-700 leading-relaxed pl-2"
                    >
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          {/* About the Company */}
          {jd.about_the_company && (
            <section className="mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-8 bg-blue-600 rounded-full"></div>
                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-50">
                  <Briefcase className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-[22px] font-semibold text-gray-900 tracking-[0.5px]">
                  About the Company
                </h3>
              </div>
              <div className="pl-14">
                <p className="text-[16px] text-gray-700 leading-[1.8]">
                  {jd.about_the_company}
                </p>
              </div>
            </section>
          )}
        </div>

        {/* Sticky Footer */}
        <div className="border-t border-gray-200 bg-white px-12 py-6 flex items-center justify-between gap-4 shadow-lg rounded-b-[20px]">
          <div className="flex items-center gap-4">
            {onEdit && (
              <button
                onClick={handleEdit}
                className="h-12 px-6 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-2 border border-indigo-200"
              >
                <Edit className="w-5 h-5" />
                Edit
              </button>
            )}
            {onDelete && (
              <button
                onClick={handleDelete}
                className="h-12 px-6 bg-red-50 hover:bg-red-100 text-red-700 font-semibold rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-2 border border-red-200"
              >
                <Trash2 className="w-5 h-5" />
                Delete
              </button>
            )}
          </div>
          <div className="flex items-center gap-4 ml-auto">
            <button
              onClick={onClose}
              className="h-12 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-all duration-200"
            >
              Close
            </button>
            <button
              onClick={() => onUseTemplate(jd)}
              className="h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Use Template
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document !== "undefined") {
    return createPortal(content, document.body);
  }
  return content;
}
