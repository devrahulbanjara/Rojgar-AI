/**
 * JobDetailView Component
 * LinkedIn-inspired job detail view for the right column
 */

import React from 'react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { 
  MapPin, 
  DollarSign, 
  Calendar, 
  Building2, 
  Users,
  Clock,
  ArrowRight,
  ExternalLink,
  CheckCircle,
  TrendingUp,
  Heart,
  Share2
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
    <Card className={cn('h-fit', className)}>
      <CardHeader className="pb-4">
        {/* Company Header */}
        <div className="flex items-start gap-4 mb-4">
          {job.company?.logo && (
            <img 
              src={job.company.logo} 
              alt={job.company.name}
              className="w-16 h-16 rounded-xl object-cover flex-shrink-0 border border-border"
            />
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-foreground mb-1 leading-tight">
              {job.title}
            </h1>
            <p className="text-lg text-muted-foreground font-medium">
              {job.company?.name || 'Company'}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>{job.location}</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>{jobUtils.formatPostedDate(job.posted_date)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button 
            onClick={handleApply}
            disabled={isApplying}
            className="flex-1 group"
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
            className="px-3"
            aria-label="Save job"
          >
            <Heart className="w-4 h-4" aria-hidden="true" />
          </Button>
          <Button 
            variant="outline" 
            size="lg"
            onClick={handleShare}
            className="px-3"
            aria-label="Share job"
          >
            <Share2 className="w-4 h-4" aria-hidden="true" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Job Badges */}
        <div className="flex flex-wrap gap-2">
          <Badge 
            variant="secondary" 
            className={cn(
              'text-sm font-medium px-3 py-1',
              jobUtils.getJobLevelColor(job.level)
            )}
          >
            {job.level}
          </Badge>
          <Badge 
            variant="outline" 
            className={cn(
              'text-sm px-3 py-1',
              jobUtils.getLocationTypeColor(job.location_type)
            )}
          >
            {job.location_type}
          </Badge>
          <Badge 
            variant="outline" 
            className={cn(
              'text-sm px-3 py-1',
              jobUtils.getEmploymentTypeColor(job.employment_type)
            )}
          >
            {job.employment_type}
          </Badge>
        </div>

        {/* Job Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 text-sm">
            <DollarSign className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="font-medium text-foreground">
                {jobUtils.formatSalaryRange(job.salary_range)}
              </p>
              <p className="text-xs text-muted-foreground">Salary</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Building2 className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="font-medium text-foreground">{job.department}</p>
              <p className="text-xs text-muted-foreground">Department</p>
            </div>
          </div>
          {job.applicant_count !== undefined && (
            <div className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="font-medium text-foreground">{job.applicant_count}</p>
                <p className="text-xs text-muted-foreground">Applicants</p>
              </div>
            </div>
          )}
          {job.views_count !== undefined && (
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="font-medium text-foreground">{job.views_count}</p>
                <p className="text-xs text-muted-foreground">Views</p>
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Job Description */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">About this job</h2>
          <div className="prose prose-sm max-w-none text-muted-foreground">
            <p className="whitespace-pre-wrap leading-relaxed">{job.description}</p>
          </div>
        </section>

        {/* Requirements */}
        {job.requirements && job.requirements.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Requirements</h2>
            <ul className="space-y-2">
              {job.requirements.map((requirement, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground text-sm leading-relaxed">{requirement}</span>
                </li>
              ))}
              </ul>
            </section>
          )}

        {/* Skills */}
        {job.skills && job.skills.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Required Skills</h2>
            <div className="flex flex-wrap gap-2">
              {job.skills.map((skill, index) => (
                <Badge 
                  key={index} 
                  variant="outline" 
                  className="text-sm px-3 py-1.5 hover:bg-muted/50 transition-colors"
                >
                  {skill}
                </Badge>
              ))}
            </div>
          </section>
        )}

        {/* Company Information */}
        {job.company && (
          <>
            <Separator />
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">About {job.company.name}</h2>
              {job.company.description && (
                <p className="text-muted-foreground text-sm leading-relaxed">{job.company.description}</p>
              )}
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {job.company.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{job.company.location}</span>
                  </div>
                )}
                {job.company.size && (
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{job.company.size}</span>
                  </div>
                )}
                {job.company.industry && (
                  <div className="flex items-center gap-1">
                    <Building2 className="w-4 h-4" />
                    <span>{job.company.industry}</span>
                  </div>
                )}
                {job.company.website && (
                  <a 
                    href={job.company.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary hover:underline"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Company Website</span>
                  </a>
                )}
              </div>
            </section>
          </>
        )}

        {/* Application Deadline */}
        {job.application_deadline && (
          <>
            <Separator />
            <div className="bg-muted/30 rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">
                    Apply by {new Date(job.application_deadline).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-muted-foreground">Application deadline</p>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
