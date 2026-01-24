import React, { memo, useCallback } from "react";
import {
  MapPin,
  DollarSign,
  Building2,
  Users,
  Clock,
  Briefcase,
  Eye,
  Calendar,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { jobUtils } from "../../services/jobService";
import type { Job } from "../../types/job";

interface JobCardProps {
  job: Job;
  isSelected?: boolean;
  onSelect?: (job: Job) => void;
  onApply?: (job: Job) => void;
  showApplyButton?: boolean;
  className?: string;
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

// Job level color schemes
const levelColors: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  Senior: {
    bg: "bg-indigo-50/80",
    text: "text-indigo-700",
    border: "border-indigo-200",
  },
  Mid: {
    bg: "bg-blue-50/80",
    text: "text-blue-700",
    border: "border-blue-200",
  },
  Junior: {
    bg: "bg-emerald-50/80",
    text: "text-emerald-700",
    border: "border-emerald-200",
  },
  Lead: {
    bg: "bg-violet-50/80",
    text: "text-violet-700",
    border: "border-violet-200",
  },
  Principal: {
    bg: "bg-amber-50/80",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  Entry: {
    bg: "bg-teal-50/80",
    text: "text-teal-700",
    border: "border-teal-200",
  },
  Default: {
    bg: "bg-slate-50/80",
    text: "text-slate-700",
    border: "border-slate-200",
  },
};

export const JobCard = memo<JobCardProps>(
  ({ job, isSelected = false, onSelect, className }) => {
    const handleClick = useCallback(() => {
      onSelect?.(job);
    }, [onSelect, job]);

    const deptColor =
      departmentColors[job.department || ""] || departmentColors.Default;
    const levelColor = levelColors[job.level || ""] || levelColors.Default;

    // Format deadline
    const formatDeadline = (deadline: string): string => {
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
    };

    return (
      <div
        className={cn(
          "group cursor-pointer transition-all duration-300 w-full bg-white rounded-xl border p-6",
          "hover:-translate-y-1",
          isSelected
            ? "border-indigo-500 shadow-lg bg-indigo-50/5"
            : "border-slate-200 hover:border-indigo-200",
          className,
        )}
        style={{
          boxShadow: isSelected
            ? "0 4px 16px rgba(99, 102, 241, 0.15)"
            : "0 2px 8px rgba(0,0,0,0.08)",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        aria-label={`View details for ${job.title} at ${job.company?.name || "Company"}`}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick();
          }
        }}
        onMouseEnter={(e) => {
          if (!isSelected) {
            e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.12)";
          }
        }}
        onMouseLeave={(e) => {
          if (!isSelected) {
            e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
          }
        }}
      >
        <div className="flex flex-col h-full">
          {/* Header Row: Department Badge + Level Badge */}
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
            {job.level && (
              <span
                className={cn(
                  "inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border",
                  levelColor.bg,
                  levelColor.text,
                  levelColor.border,
                )}
              >
                {job.level}
              </span>
            )}
          </div>

          {/* Job Title & Company - Refined Typography */}
          <div className="mb-5">
            <h3
              className={cn(
                "font-semibold text-[19px] leading-tight text-slate-900 transition-colors line-clamp-2 mb-2",
                isSelected ? "text-indigo-600" : "group-hover:text-indigo-600",
              )}
            >
              {job.title}
            </h3>
            <p className="text-base text-slate-600 font-semibold">
              {job.company?.name ||
                (job as unknown as { organization?: { name?: string } })
                  .organization?.name ||
                "Company"}
            </p>
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
                  {jobUtils.formatPostedDate(job.created_at || job.posted_date)}
                </span>
              </div>
            </div>

            {/* Row 2: Salary + Type + Work Mode */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1.5">
                <DollarSign className="w-[14px] h-[14px] text-slate-400" />
                <span className="font-medium">
                  {jobUtils.formatJobSalary(job)}
                </span>
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

          {/* Bottom Stats Row - Colored Badges */}
          <div className="flex items-center justify-between gap-3 pt-6 border-t border-slate-100">
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
                  <span className="text-xs font-semibold">{job.views_count}</span>
                </div>
              )}
            </div>
            {job.application_deadline && (
              <div className="inline-flex items-center gap-2 px-3 py-2 bg-amber-50/80 text-amber-700 rounded-lg border border-amber-200">
                <Calendar className="w-4 h-4" />
                <span className="text-xs font-semibold">
                  {formatDeadline(job.application_deadline)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  },
);

JobCard.displayName = "JobCard";
