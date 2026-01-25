import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Dialog, DialogContent } from "../ui/dialog";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  MapPin,
  DollarSign,
  Calendar,
  Building2,
  Clock,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  X,
  Briefcase,
  Sparkles,
  Globe,
  Bookmark,
  BookmarkCheck,
  Share2,
  TrendingUp,
  MapPinned,
  ClockIcon,
  UserCircle2,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { jobUtils } from "../../services/jobService";
import { useToggleSaveJob } from "../../hooks/queries/useJobs";
import type { JobDetailsModalProps, Job } from "../../types/job";

interface JobWithExtras extends Job {
  job_responsibilities?: string[];
  job_summary?: string;
  required_qualifications?: string[];
  preferred?: string[];
  compensation_and_benefits?: string[];
}

export const JobDetailsModal: React.FC<JobDetailsModalProps> = ({
  job,
  isOpen,
  onClose,
  onApply,
  showApplyButton = true,
}) => {
  const [isSaved, setIsSaved] = useState(job?.is_saved || false);
  const toggleSaveMutation = useToggleSaveJob();

  // Sync is_saved state when job changes or modal opens
  useEffect(() => {
    if (job) {
      setIsSaved(job.is_saved || false);
    }
  }, [job?.job_id, job?.is_saved, isOpen]);

  if (!job) return null;

  const handleApply = () => {
    onApply?.(job);
  };

  const handleClose = () => {
    onClose();
  };

  const handleSave = async () => {
    if (!job.job_id) return;
    const previousSavedState = isSaved;
    // Optimistically update UI
    setIsSaved(!previousSavedState);
    try {
      const result = await toggleSaveMutation.mutateAsync(job.job_id);
      // Update state based on actual API response
      const isNowSaved = result.status === "Job saved successfully";
      setIsSaved(isNowSaved);
    } catch (error) {
      // Revert optimistic update on error
      setIsSaved(previousSavedState);
      // Error is handled by the mutation's onError
      console.error("Failed to toggle save:", error);
    }
  };

  const handleShare = () => {
    // TODO: Implement share functionality
  };

  const daysLeft = job.application_deadline
    ? Math.ceil(
        (new Date(job.application_deadline).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24),
      )
    : null;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      className="max-w-[900px] mx-4 rounded-[20px]"
      showCloseButton={false}
    >
      <DialogContent className="max-h-[90vh] overflow-hidden w-full max-w-[900px] p-0 flex flex-col rounded-[20px]">
        {/* Enhanced Header with subtle background */}
        <div className="bg-gradient-to-b from-gray-50/80 to-white px-12 py-12 border-b border-gray-100 relative">
          {/* Close Button - More prominent */}
          <button
            onClick={handleClose}
            className="absolute top-8 right-8 p-2.5 rounded-full hover:bg-gray-100 transition-all duration-200 hover:scale-110 active:scale-95 group"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-gray-400 group-hover:text-gray-700 transition-colors" />
          </button>

          {/* Company Logo & Title */}
          <div className="flex items-start gap-4 mb-6">
            {job.company?.logo && (
              <div className="flex-shrink-0">
                <Image
                  src={job.company.logo}
                  alt={job.company.name}
                  width={64}
                  height={64}
                  className="w-16 h-16 rounded-xl object-cover border border-gray-200 shadow-sm"
                />
              </div>
            )}
            <div className="flex-1 min-w-0 pt-1">
              <h2 className="text-[28px] font-bold text-gray-900 leading-tight mb-2">
                {job.title}
              </h2>
              <p className="text-lg text-gray-600 font-medium tracking-[0.3px]">
                {job.company?.name ||
                  (job as unknown as { organization?: { name?: string } })
                    .organization?.name ||
                  "Company"}
              </p>
            </div>
          </div>

          {/* Enhanced Badges with icons */}
          <div className="flex flex-wrap gap-3">
            <Badge
              className={cn(
                "px-4 py-2 text-sm font-semibold rounded-full border transition-all duration-200 hover:scale-105",
                {
                  "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100":
                    job.level === "Senior",
                  "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100":
                    job.level === "Mid",
                  "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100":
                    job.level === "Junior",
                  "bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100":
                    job.level === "Lead",
                  "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100":
                    job.level === "Principal",
                  "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100":
                    !["Senior", "Mid", "Junior", "Lead", "Principal"].includes(
                      job.level as string,
                    ),
                },
              )}
            >
              <UserCircle2 className="w-4 h-4 mr-1.5" />
              {job.level}
            </Badge>
            <Badge
              className={cn(
                "px-4 py-2 text-sm font-semibold rounded-full border-0 transition-all duration-200 hover:scale-105",
                "bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
              )}
            >
              <MapPinned className="w-4 h-4 mr-1.5" />
              {job.location_type}
            </Badge>
            <Badge
              className={cn(
                "px-4 py-2 text-sm font-semibold rounded-full border-0 transition-all duration-200 hover:scale-105",
                "bg-purple-50 text-purple-700 hover:bg-purple-100",
              )}
            >
              <ClockIcon className="w-4 h-4 mr-1.5" />
              {job.employment_type}
            </Badge>
            {job.applicant_count !== undefined && job.applicant_count > 0 && (
              <Badge
                className={cn(
                  "px-4 py-2 text-sm font-semibold rounded-full border-0 transition-all duration-200 hover:scale-105",
                  "bg-orange-50 text-orange-700 hover:bg-orange-100",
                )}
              >
                <TrendingUp className="w-4 h-4 mr-1.5" />
                {job.applicant_count} applicants
              </Badge>
            )}
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto px-12 py-12">
          {/* Key Information Grid with dividers */}
          <div className="grid grid-cols-3 gap-10 mb-12 p-6 bg-gray-50 rounded-xl border border-gray-100">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 font-medium mb-0.5 whitespace-nowrap">
                  Location
                </p>
                <p className="text-sm font-semibold text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis">
                  {job.location_city && job.location_country
                    ? `${job.location_city}, ${job.location_country}`
                    : job.location_city || job.location_country || job.location || "Not specified"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 border-l border-gray-200 pl-8 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 font-medium mb-0.5 whitespace-nowrap">
                  Salary
                </p>
                <p className="text-sm font-bold text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis">
                  {jobUtils.formatJobSalary(job)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 border-l border-gray-200 pl-8 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 font-medium mb-0.5 whitespace-nowrap">
                  Posted
                </p>
                <p className="text-sm font-semibold text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis">
                  {jobUtils.formatPostedDate(job.created_at || job.posted_date)}
                </p>
              </div>
            </div>
          </div>

          {/* Deadline Warning if applicable */}
          {daysLeft !== null && daysLeft <= 7 && daysLeft > 0 && (
            <div className="mb-10 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
              <Calendar className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-900">
                  {daysLeft} {daysLeft === 1 ? "day" : "days"} left to apply
                </p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Application deadline:{" "}
                  {new Date(job.application_deadline!).toLocaleDateString(
                    "en-US",
                    {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    },
                  )}
                </p>
              </div>
            </div>
          )}

          {/* About the Company - Enhanced */}
          {(() => {
            const organization = (job as unknown as { organization?: { 
              id?: string | number;
              name?: string;
              description?: string;
              website?: string;
              location_city?: string;
              location_country?: string;
              industry?: string;
              founded_year?: number;
            } }).organization;
            
            const company = job.company || organization;
            
            return company && (
              <section className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1 h-8 bg-blue-600 rounded-full"></div>
                  <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-50">
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="text-[22px] font-semibold text-gray-900 tracking-[0.5px]">
                    About the Company
                  </h3>
                </div>
                <div className="pl-14">
                  {company.description ? (
                    <p className="text-[15px] text-gray-700 leading-relaxed mb-6">
                      {company.description}
                    </p>
                  ) : (
                    <p className="text-[15px] text-gray-700 leading-relaxed mb-6">
                      {company.name} is looking for talented individuals to
                      join their team.
                    </p>
                  )}
                  <div className="flex flex-wrap gap-3">
                    {(() => {
                      const location = (company as { location?: string }).location || 
                        (organization && organization.location_city && organization.location_country 
                          ? `${organization.location_city}, ${organization.location_country}`
                          : organization?.location_city || organization?.location_country);
                      return location && (
                        <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 hover:scale-105">
                          <MapPin className="w-4 h-4" />
                          <span className="font-medium">{location}</span>
                        </button>
                      );
                    })()}
                    {company.industry && (
                      <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 hover:scale-105">
                        <Building2 className="w-4 h-4" />
                        <span className="font-medium">
                          {company.industry}
                        </span>
                      </button>
                    )}
                    {company.website && (
                      <a
                        href={
                          company.website.startsWith("http")
                            ? company.website
                            : `https://${company.website}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 hover:scale-105 font-medium"
                      >
                        <Globe className="w-4 h-4" />
                        <span>Visit Website</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </section>
            );
          })()}

          {/* Job Summary - Enhanced */}
          {(() => {
            const jobWithExtras = job as JobWithExtras;
            return (jobWithExtras.job_summary || job.description) && (
              <section className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1 h-8 bg-indigo-600 rounded-full"></div>
                  <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-indigo-50">
                    <Briefcase className="w-5 h-5 text-indigo-600" />
                  </div>
                  <h3 className="text-[22px] font-semibold text-gray-900 tracking-[0.5px]">
                    Job Summary
                  </h3>
                </div>
                <div className="pl-14 prose prose-sm max-w-none">
                  <p className="text-[16px] text-gray-700 leading-[1.8] whitespace-pre-wrap">
                    {jobWithExtras.job_summary || job.description}
                  </p>
                </div>
              </section>
            );
          })()}

          {/* Job Responsibilities - Enhanced */}
          {(() => {
            const jobWithExtras = job as JobWithExtras;
            return jobWithExtras.job_responsibilities && jobWithExtras.job_responsibilities.length > 0 && (
              <section className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1 h-8 bg-blue-600 rounded-full"></div>
                  <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-50">
                    <Briefcase className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="text-[22px] font-semibold text-gray-900 tracking-[0.5px]">
                    Job Responsibilities
                  </h3>
                </div>
                <div className="pl-14">
                  <ul className="space-y-3 list-disc list-inside">
                    {jobWithExtras.job_responsibilities.map((resp: string, index: number) => (
                      <li
                        key={index}
                        className="text-[15px] text-gray-700 leading-relaxed pl-2"
                      >
                        {resp}
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            );
          })()}

          {/* Required Qualifications - Enhanced with checkmarks */}
          {(() => {
            const jobWithExtras = job as JobWithExtras;
            const requiredQuals = jobWithExtras.required_qualifications || job.requirements;
            return requiredQuals && requiredQuals.length > 0 && (
              <section className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1 h-8 bg-emerald-600 rounded-full"></div>
                  <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-emerald-50">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <h3 className="text-[22px] font-semibold text-gray-900 tracking-[0.5px]">
                    Required Qualifications
                  </h3>
                </div>
                <div className="pl-14">
                  <ul className="space-y-3 list-disc list-inside">
                    {(jobWithExtras.required_qualifications || job.requirements || []).map((requirement: string, index: number) => (
                      <li
                        key={index}
                        className="text-[15px] text-gray-700 leading-relaxed pl-2"
                      >
                        {requirement}
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            );
          })()}

          {/* Preferred - Enhanced */}
          {(() => {
            const jobWithExtras = job as JobWithExtras;
            const preferred = jobWithExtras.preferred || job.nice_to_have;
            return preferred && Array.isArray(preferred) && preferred.length > 0 && (
              <section className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1 h-8 bg-amber-600 rounded-full"></div>
                  <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-amber-50">
                    <Sparkles className="w-5 h-5 text-amber-600" />
                  </div>
                  <h3 className="text-[22px] font-semibold text-gray-900 tracking-[0.5px]">
                    Preferred
                  </h3>
                </div>
                <div className="pl-14">
                  <ul className="space-y-3 list-disc list-inside">
                    {(jobWithExtras.preferred || job.nice_to_have || []).map((item: string, index: number) => (
                      <li
                        key={index}
                        className="text-[15px] text-gray-700 leading-relaxed pl-2"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            );
          })()}

          {/* Compensation & Benefits - Enhanced */}
          {(() => {
            const jobWithExtras = job as JobWithExtras;
            const benefits = jobWithExtras.compensation_and_benefits || job.benefits;
            return benefits && Array.isArray(benefits) && benefits.length > 0 && (
              <section className="mb-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1 h-8 bg-violet-600 rounded-full"></div>
                  <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-violet-50">
                    <Sparkles className="w-5 h-5 text-violet-600" />
                  </div>
                  <h3 className="text-[22px] font-semibold text-gray-900 tracking-[0.5px]">
                    Compensation & Benefits
                  </h3>
                </div>
                <div className="pl-14">
                  <ul className="space-y-3 list-disc list-inside">
                    {(jobWithExtras.compensation_and_benefits || job.benefits || []).map((benefit: string, index: number) => (
                      <li
                        key={index}
                        className="text-[15px] text-gray-700 leading-relaxed pl-2"
                      >
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            );
          })()}
        </div>

        {/* Sticky Footer with CTAs */}
        <div className="border-t border-gray-200 bg-white px-12 py-6 flex items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="lg"
              onClick={handleSave}
              disabled={toggleSaveMutation.isPending}
              className={cn(
                "h-12 px-5 border-2 transition-all duration-200 hover:scale-105 active:scale-95",
                isSaved
                  ? "bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100"
                  : "hover:bg-gray-50 hover:border-gray-300"
              )}
            >
              {toggleSaveMutation.isPending ? (
                <>
                  <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2" />
                  {isSaved ? "Unsaving..." : "Saving..."}
                </>
              ) : (
                <>
                  {isSaved ? (
                    <BookmarkCheck className="w-5 h-5 mr-2" />
                  ) : (
                    <Bookmark className="w-5 h-5 mr-2" />
                  )}
                  {isSaved ? "Saved" : "Save Job"}
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={handleShare}
              className="h-12 px-5 border-2 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <Share2 className="w-5 h-5" />
            </Button>
          </div>

          {showApplyButton && (
            <Button
              onClick={handleApply}
              size="lg"
              className="h-12 px-8 text-base font-semibold bg-blue-600 hover:bg-blue-700 transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl group"
            >
              Apply Now
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
