import React, { memo } from "react";
import {
  MapPin,
  Briefcase,
  DollarSign,
  Clock,
  Users,
  Eye,
  BookmarkPlus,
  Building2,
  Calendar,
} from "lucide-react";
import { cn } from "../../lib/utils";
import type { Job } from "../../types/job";

interface RecruiterJobCardProps {
  job: Job;
  onClick?: () => void;
  onConvertToReferenceJD?: () => void;
  className?: string;
}

function formatSalary(job: Job): string {
  const min = job.salary_range?.min ?? job.salary_min;
  const max = job.salary_range?.max ?? job.salary_max;
  const currency = job.salary_range?.currency ?? job.salary_currency ?? "USD";

  if (!min && !max) return "Competitive";

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${Math.round(num / 1000)}K`;
    }
    return num.toString();
  };

  if (min && max)
    return `${currency} ${formatNumber(min)} - ${formatNumber(max)}`;
  if (min) return `${currency} From ${formatNumber(min)}`;
  if (max) return `${currency} Up to ${formatNumber(max)}`;
  return "Competitive";
}

function formatPostedDate(dateStr: string): string {
  if (!dateStr) return "Recently";

  const date = new Date(dateStr);
  const now = new Date();

  if (isNaN(date.getTime())) return "Recently";

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const postedDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );

  const diffTime = today.getTime() - postedDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks}w ago`;
  }
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months}mo ago`;
  }
  const years = Math.floor(diffDays / 365);
  return `${years}y ago`;
}

function formatDeadline(deadline: string): string {
  if (!deadline) return "";
  try {
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const diffInMs = deadlineDate.getTime() - now.getTime();
    const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays < 0) {
      return "Expired";
    } else if (diffInDays === 0) {
      return "Today";
    } else if (diffInDays === 1) {
      return "Tomorrow";
    } else if (diffInDays <= 7) {
      return `${diffInDays} days`;
    } else {
      return deadlineDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  } catch {
    return "";
  }
}

// Department color schemes matching Reference JD cards
const departmentColors: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  Engineering: {
    bg: "bg-blue-50/80",
    text: "text-blue-700",
    border: "border-blue-200",
  },
  Sales: {
    bg: "bg-green-50/80",
    text: "text-green-700",
    border: "border-green-200",
  },
  Marketing: {
    bg: "bg-orange-50/80",
    text: "text-orange-700",
    border: "border-orange-200",
  },
  Product: {
    bg: "bg-purple-50/80",
    text: "text-purple-700",
    border: "border-purple-200",
  },
  Design: {
    bg: "bg-pink-50/80",
    text: "text-pink-700",
    border: "border-pink-200",
  },
  "Data Science": {
    bg: "bg-cyan-50/80",
    text: "text-cyan-700",
    border: "border-cyan-200",
  },
  HR: {
    bg: "bg-rose-50/80",
    text: "text-rose-700",
    border: "border-rose-200",
  },
  Finance: {
    bg: "bg-emerald-50/80",
    text: "text-emerald-700",
    border: "border-emerald-200",
  },
  Operations: {
    bg: "bg-amber-50/80",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  Default: {
    bg: "bg-slate-50/80",
    text: "text-slate-700",
    border: "border-slate-200",
  },
};


export const RecruiterJobCard = memo<RecruiterJobCardProps>(
  ({ job, onClick, onConvertToReferenceJD, className }) => {
    const status = job.status || "Draft";
    // Normalize status: map "Closed" to "Expired" for display
    const displayStatus = status === "Closed" ? "Expired" : status;
    const deptColor =
      departmentColors[job.department || ""] || departmentColors.Default;

    const handleConvertClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onConvertToReferenceJD?.();
    };

    return (
      <div
        onClick={onClick}
        className={cn(
          "group cursor-pointer transition-all duration-300 w-full bg-white rounded-xl border p-6",
          "hover:-translate-y-1 hover:border-indigo-200",
          "border-slate-200",
          className,
        )}
        style={{
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.12)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
        }}
        role="button"
        tabIndex={0}
        aria-label={`View details for ${job.title}`}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick?.();
          }
        }}
      >
        <div className="flex flex-col h-full">
          {/* Header Row: Department Badge */}
          <div className="flex items-start justify-between mb-5">
            {job.department && (
              <span
                className={cn(
                  "inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border",
                  deptColor.bg,
                  deptColor.text,
                  deptColor.border,
                )}
              >
                {job.department}
              </span>
            )}
          </div>

          {/* Job Title - Refined Size */}
          <div className="mb-5">
            <h3 className="font-semibold text-[19px] leading-tight text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
              {job.title}
            </h3>
          </div>

          {/* Metadata - Cleanly Organized */}
          <div className="space-y-2.5 text-sm text-slate-600 mb-6">
            {/* Row 1: Location + Time */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-[14px] h-[14px] text-slate-400" />
                <span className="truncate">{job.location}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-[14px] h-[14px] text-slate-400" />
                <span>
                  {formatPostedDate(job.posted_date || job.created_at)}
                </span>
              </div>
            </div>

            {/* Row 2: Salary + Type + Work Mode */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1.5">
                <DollarSign className="w-[14px] h-[14px] text-slate-400" />
                <span className="font-medium">{formatSalary(job)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Briefcase className="w-[14px] h-[14px] text-slate-400" />
                <span>{job.employment_type}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Building2 className="w-[14px] h-[14px] text-slate-400" />
                <span>{job.location_type || "On-site"}</span>
              </div>
            </div>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Bottom Action Row - Statistics + Deadline/Action */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-100">
            {/* Left: Statistics - Colored Badges */}
            <div className="flex items-center gap-3">
              {job.applicant_count !== undefined && (
                <div className="inline-flex items-center gap-2 px-3 py-2 bg-purple-50/80 text-purple-700 rounded-lg border border-purple-200">
                  <Users className="w-4 h-4" />
                  <span className="text-xs font-semibold">
                    {job.applicant_count}
                  </span>
                </div>
              )}
              {job.views_count !== undefined && (
                <div className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50/80 text-blue-700 rounded-lg border border-blue-200">
                  <Eye className="w-4 h-4" />
                  <span className="text-xs font-semibold">
                    {job.views_count}
                  </span>
                </div>
              )}
            </div>

            {/* Right: Deadline Badge or Save Template Button */}
            <div className="flex items-center">
              {job.application_deadline ? (
                displayStatus === "Expired" ? (
                  <div className="inline-flex items-center gap-2 px-3 py-2 bg-red-50/80 text-red-700 rounded-lg border border-red-200">
                    <Calendar className="w-4 h-4" />
                    <span className="text-xs font-semibold">
                      Deadline: Expired
                    </span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 px-3 py-2 bg-amber-50/80 text-amber-700 rounded-lg border border-amber-200">
                    <Calendar className="w-4 h-4" />
                    <span className="text-xs font-semibold">
                      {formatDeadline(job.application_deadline)}
                    </span>
                  </div>
                )
              ) : (
                onConvertToReferenceJD && (
                  <button
                    onClick={handleConvertClick}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                      "text-indigo-600 hover:text-white",
                      "border border-indigo-200 hover:border-indigo-600",
                      "hover:bg-indigo-600",
                      "group-hover:shadow-sm",
                    )}
                    title="Save as Reference JD Template"
                  >
                    <BookmarkPlus className="w-4 h-4" />
                    <span className="hidden sm:inline">Save as Template</span>
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    );
  },
);

RecruiterJobCard.displayName = "RecruiterJobCard";
