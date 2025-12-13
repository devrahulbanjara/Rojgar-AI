/**
 * JobDetailView Component
 * Clean, modern job detail view with proper spacing and visual hierarchy
 */

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

  const handleSave = () => {
    // TODO: Implement save functionality
  };

  const handleShare = () => {
    // TODO: Implement share functionality
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
        {/* Salary & Department */}
        <div className="grid grid-cols-2 gap-6">
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
          {job.department && (
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                <Briefcase className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{job.department}</p>
                <p className="text-sm text-muted-foreground">Department</p>
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Job Description */}
        {job.description && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">About this role</h2>
            <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
              {job.description}
            </p>
          </section>
        )}

        {/* Requirements */}
        {job.requirements && job.requirements.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Requirements</h2>
            <ul className="space-y-3">
              {job.requirements.map((requirement, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CircleCheck className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground text-sm leading-relaxed">{requirement}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Skills */}
        {job.skills && job.skills.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Required Skills</h2>
            <div className="flex flex-wrap gap-2">
              {job.skills.map((skill, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="text-sm px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                >
                  {skill}
                </Badge>
              ))}
            </div>
          </section>
        )}

        {/* Benefits & Offers */}
        {job.benefits && job.benefits.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Benefits & Perks</h2>
            <ul className="space-y-3">
              {job.benefits.map((benefit, index) => (
                <li key={index} className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-violet-500 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground text-sm leading-relaxed">{benefit}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <Separator />

        {/* Company Information */}
        {job.company && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">About {job.company.name}</h2>
            {job.company.description && (
              <p className="text-muted-foreground text-sm leading-relaxed">{job.company.description}</p>
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
                  <p className="text-sm text-muted-foreground">Don't miss the deadline!</p>
                </div>
              </div>
            </section>
          </>
        )}
      </CardContent>
    </Card>
  );
};
