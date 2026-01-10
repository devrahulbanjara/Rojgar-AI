import React from "react";
import { Sparkles, CheckCircle2, Star, Gift } from "lucide-react";
import { cn } from "../../lib/utils";
import { ReferenceJD } from "../../services/referenceJDService";

interface ReferenceJDCardProps {
  jd: ReferenceJD;
  onClick?: () => void;
  onUseTemplate?: (e: React.MouseEvent) => void;
  className?: string;
}

// Department color schemes - subtle tints only
const departmentColors: Record<
  string,
  { accent: string; bg: string; text: string }
> = {
  Engineering: {
    accent: "bg-gradient-to-r from-blue-500 to-indigo-500",
    bg: "bg-blue-50/50",
    text: "text-blue-700",
  },
  Sales: {
    accent: "bg-gradient-to-r from-green-500 to-emerald-500",
    bg: "bg-green-50/50",
    text: "text-green-700",
  },
  Marketing: {
    accent: "bg-gradient-to-r from-orange-500 to-amber-500",
    bg: "bg-orange-50/50",
    text: "text-orange-700",
  },
  Product: {
    accent: "bg-gradient-to-r from-purple-500 to-violet-500",
    bg: "bg-purple-50/50",
    text: "text-purple-700",
  },
  Design: {
    accent: "bg-gradient-to-r from-pink-500 to-rose-500",
    bg: "bg-pink-50/50",
    text: "text-pink-700",
  },
  "Data Science": {
    accent: "bg-gradient-to-r from-cyan-500 to-sky-500",
    bg: "bg-cyan-50/50",
    text: "text-cyan-700",
  },
  Default: {
    accent: "bg-gradient-to-r from-gray-500 to-slate-500",
    bg: "bg-gray-50/50",
    text: "text-gray-700",
  },
};

export function ReferenceJDCard({
  jd,
  onClick,
  onUseTemplate,
  className,
}: ReferenceJDCardProps) {
  const deptColor =
    departmentColors[jd.department || ""] || departmentColors.Default;

  return (
    <div
      onClick={onClick}
      className={cn(
        "group cursor-pointer transition-all duration-300 w-full bg-white rounded-xl border p-8",
        "hover:-translate-y-1 hover:shadow-lg hover:border-indigo-200",
        "border-slate-200",
        "min-h-[340px]",
        "flex flex-col",
        className,
      )}
    >
      {/* Card Content */}
      <div className="flex-1 flex flex-col">
        {/* Header: Department Badge */}
        <div className="flex items-start justify-between mb-6">
          {jd.department && (
            <span
              className={cn(
                "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium",
                deptColor.bg,
                deptColor.text,
              )}
            >
              {jd.department}
            </span>
          )}
        </div>

        {/* Skill Pills - First 2 + Counter */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {jd.requiredSkillsAndExperience.slice(0, 2).map((skill, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 rounded-md"
              >
                {skill.length > 30 ? skill.substring(0, 30) + "..." : skill}
              </span>
            ))}
            {jd.requiredSkillsAndExperience.length > 2 && (
              <span className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50/50 rounded-md">
                +{jd.requiredSkillsAndExperience.length - 2} more
              </span>
            )}
          </div>
        </div>

        {/* Statistics Badges - Primary Focus */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50/50 text-purple-700 rounded-lg">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-sm font-medium">
              {jd.requiredSkillsAndExperience.length} Required
            </span>
          </div>

          {jd.niceToHave.length > 0 && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50/50 text-blue-700 rounded-lg">
              <Star className="w-4 h-4" />
              <span className="text-sm font-medium">
                {jd.niceToHave.length} Nice-to-Have
              </span>
            </div>
          )}

          {jd.benefits.length > 0 && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50/50 text-green-700 rounded-lg">
              <Gift className="w-4 h-4" />
              <span className="text-sm font-medium">
                {jd.benefits.length} Benefits
              </span>
            </div>
          )}
        </div>

        {/* Spacer to push button to bottom */}
        <div className="flex-1" />

        {/* Use Template Button - Understated until hover */}
        <button
          onClick={onUseTemplate}
          className={cn(
            "flex items-center justify-center gap-2 w-full py-2.5 rounded-lg font-medium text-sm transition-all duration-200",
            "text-indigo-600 hover:text-white",
            "border border-indigo-200 hover:border-indigo-600",
            "hover:bg-indigo-600",
            "group-hover:shadow-sm",
          )}
        >
          <Sparkles className="w-4 h-4" />
          Use Template
        </button>
      </div>
    </div>
  );
}
