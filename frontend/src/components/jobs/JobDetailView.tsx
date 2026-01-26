import React from 'react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import {
  MapPin,
  Banknote,
  CalendarDays,
  Building2,
  Clock,
  ArrowRight,
  ExternalLink,
  CircleCheck,
  Bookmark,
  Share2,
  Sparkles,
  Briefcase,
  Globe
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { jobUtils } from '../../services/jobService';
import type { Job } from '../../types/job';

interface JobDetailViewProps {
  job: Job;
  onApply?: (job: Job) => void;
  isApplying?: boolean;
  className?: string;
}

export const JobDetailView: React.FC<JobDetailViewProps> = ({
  job,
  onApply,
  isApplying = false,
  className
}) => {
  const handleApply = () => {
    onApply?.(job);
  };

  const handleSave = async () => {
    if (!job.job_id) return;
    // This will be handled by the parent component or we can add the hook here
    // For now, we'll leave it empty as it might be handled differently
  };

  const handleShare = () => {
  };

  return (
    <Card className={cn('h-fit overflow-hidden', className)}>
      {/* Header Section */}
      <CardHeader className="pb-6">
        <div className="space-y-4">
          {/* Job Title & Company */}
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2 leading-tight">
              {job.title}
            </h1>
            <p className="text-base text-muted-foreground font-medium">
              {job.company?.name || 'Company'}
            </p>
          </div>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              <span>{job.location}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>{jobUtils.formatPostedDate(job.created_at || job.posted_date)}</span>
            </div>
          </div>

          {/* Job Badges */}
          <div className="flex flex-wrap gap-2">
            {job.level && (
              <Badge
                variant="secondary"
                className={cn(
                  'text-sm font-medium px-3 py-1.5',
                  jobUtils.getJobLevelColor(job.level)
                )}
              >
                {job.level}
              </Badge>
            )}
            {job.location_type && (
              <Badge
                variant="outline"
                className={cn(
                  'text-sm px-3 py-1.5',
                  jobUtils.getLocationTypeColor(job.location_type)
                )}
              >
                {job.location_type}
              </Badge>
            )}
            {job.employment_type && (
              <Badge
                variant="outline"
                className={cn(
                  'text-sm px-3 py-1.5',
                  jobUtils.getEmploymentTypeColor(job.employment_type)
                )}
              >
                {job.employment_type}
              </Badge>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleApply}
              disabled={isApplying}
              className="flex-1 group h-11"
              size="lg"
              aria-label={`Apply to ${job.title} at ${job.company?.name || 'Company'}`}
            >
              {isApplying ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" aria-hidden="true" />
                  Applying...
                </>
              ) : (
                <>
                  Apply Now
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={handleSave}
              className="h-11 w-11 p-0"
              aria-label="Save job"
            >
              <Bookmark className="w-5 h-5" aria-hidden="true" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={handleShare}
              className="h-11 w-11 p-0"
              aria-label="Share job"
            >
              <Share2 className="w-5 h-5" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="pt-6 space-y-8">
        {/* Salary */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
            <Banknote className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="font-semibold text-foreground">
              {jobUtils.formatJobSalary(job)}
            </p>
            <p className="text-sm text-muted-foreground">Salary Range</p>
          </div>
        </div>

        <Separator />

        {/* About the Company */}
        {job.company && (
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50">
                <Building2 className="w-4 h-4 text-blue-600" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">About the Company</h2>
            </div>
            {job.company.description ? (
              <p className="text-muted-foreground text-sm leading-relaxed">{job.company.description}</p>
            ) : (
              <p className="text-muted-foreground text-sm leading-relaxed">
                {job.company.name} is looking for talented individuals to join their team.
              </p>
            )}
            <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
              {job.company.location && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{job.company.location}</span>
                </div>
              )}
              {job.company.industry && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building2 className="w-4 h-4" />
                  <span>{job.company.industry}</span>
                </div>
              )}
              {job.company.website && (
                <a
                  href={job.company.website.startsWith('http') ? job.company.website : `https://${job.company.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-primary hover:underline"
                >
                  <Globe className="w-4 h-4" />
                  <span>Website</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </section>
        )}

        {/* Job Summary */}
        {job.description && (
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-indigo-50">
                <Briefcase className="w-4 h-4 text-indigo-600" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Job Summary</h2>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
              {job.description}
            </p>
          </section>
        )}

        {/* Required Qualifications */}
        {job.requirements && job.requirements.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-emerald-50">
                <CircleCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Required Qualifications</h2>
            </div>
            <ul className="space-y-3 list-disc list-inside pl-4">
              {job.requirements.map((requirement, index) => (
                <li key={index} className="text-muted-foreground text-sm leading-relaxed">
                  {requirement}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Preferred */}
        {job.nice_to_have && job.nice_to_have.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-amber-50">
                <Sparkles className="w-4 h-4 text-amber-600" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Preferred</h2>
            </div>
            <ul className="space-y-3 list-disc list-inside pl-4">
              {job.nice_to_have.map((item, index) => (
                <li key={index} className="text-muted-foreground text-sm leading-relaxed">
                  {item}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Compensation & Benefits */}
        {job.benefits && job.benefits.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-violet-50">
                <Sparkles className="w-4 h-4 text-violet-600" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Compensation & Benefits</h2>
            </div>
            <ul className="space-y-3 list-disc list-inside pl-4">
              {job.benefits.map((benefit, index) => (
                <li key={index} className="text-muted-foreground text-sm leading-relaxed">
                  {benefit}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Application Deadline */}
        {job.application_deadline && (
          <>
            <Separator />
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Application Deadline</h2>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <CalendarDays className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    {new Date(job.application_deadline).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                  <p className="text-sm text-muted-foreground">Don&apos;t miss the deadline!</p>
                </div>
              </div>
            </section>
          </>
        )}
      </CardContent>
    </Card>
  );
};
