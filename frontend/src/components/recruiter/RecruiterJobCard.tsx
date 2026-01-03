import React, { memo } from "react";
import {
  MapPin,
  Briefcase,
  Calendar,
  DollarSign,
  Clock,
  Users,
  Eye,
} from "lucide-react";
import { cn } from "../../lib/utils";
import type { Job } from "../../types/job";

interface RecruiterJobCardProps {
  job: Job;
  onClick?: () => void;
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

  // Check if date is valid
  if (isNaN(date.getTime())) return "Recently";

  // Reset time to midnight for accurate day comparison
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
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
  }
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} month${months > 1 ? "s" : ""} ago`;
  }
  const years = Math.floor(diffDays / 365);
  return `${years} year${years > 1 ? "s" : ""} ago`;
}

// Status config matching candidate design style
const statusConfig = {
  Active: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
  },
  Draft: { bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200" },
  Closed: { bg: "bg-rose-50", text: "text-rose-600", border: "border-rose-200" },
  Inactive: {
    bg: "bg-amber-50",
    text: "text-amber-600",
    border: "border-amber-200",
  },
};

export const RecruiterJobCard = memo<RecruiterJobCardProps>(
  ({ job, onClick, className }) => {
    const status = job.status || "Draft";
    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.Draft;

    return (
      <div
        onClick={onClick}
        className={cn(
          "group cursor-pointer transition-all duration-300 w-full bg-white rounded-xl border p-5",
          "hover:-translate-y-1 hover:shadow-lg hover:border-indigo-200",
          "border-slate-200",
          className,
        )}
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
        <div className="space-y-4">
          {/* Job Title & Department */}
          <div>
            <h3 className="font-bold text-lg text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1 mb-1">
              {job.title}
            </h3>
            <p className="text-sm text-slate-500 font-medium">
              {job.department}
            </p>
          </div>

          {/* Location & Posted Date */}
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              <span className="truncate">{job.location}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatPostedDate(job.posted_date || job.created_at)}</span>
            </div>
          </div>

          {/* Job Details */}
          <div className="flex items-center gap-4 text-sm text-slate-600">
            <div className="flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-slate-400" />
              <span className="font-medium">{formatSalary(job)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-slate-400" />
              <span>{job.employment_type}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>{job.location_type}</span>
            </div>
          </div>

          {/* Footer with Stats & Status */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <div className="flex items-center gap-4 text-xs text-slate-500">
              {job.applicant_count !== undefined && (
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  <span>{job.applicant_count} applicants</span>
                </div>
              )}
              {job.views_count !== undefined && (
                <div className="flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" />
                  <span>{job.views_count} views</span>
                </div>
              )}
            </div>

            {/* Status Badge - Only show for non-Active statuses */}
            {status !== 'Active' && (
              <span
                className={cn(
                  "px-2.5 py-1 text-xs font-semibold rounded-full border transition-transform duration-200 group-hover:scale-105",
                  config.bg,
                  config.text,
                  config.border,
                )}
              >
                {status}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  },
);

RecruiterJobCard.displayName = "RecruiterJobCard";
