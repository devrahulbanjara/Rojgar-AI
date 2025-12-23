/**
 * JobDetailsModal Component
 * Displays detailed job information in a modal dialog
 */

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
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
  X,
  Briefcase,
  Sparkles,
  Globe
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { jobUtils } from '../../services/jobService';
import type { JobDetailsModalProps } from '../../types/job';

export const JobDetailsModal: React.FC<JobDetailsModalProps> = ({
  job,
  isOpen,
  onClose,
  onApply,
  showApplyButton = true
}) => {
  if (!job) return null;

  const handleApply = () => {
    onApply?.(job);
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog isOpen={isOpen} onClose={handleClose} className="max-w-4xl mx-4">
      <DialogContent className="max-h-[90vh] overflow-y-auto w-full max-w-4xl">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-3">
                {job.company?.logo && (
                  <img 
                    src={job.company.logo} 
                    alt={job.company.name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <DialogTitle className="text-xl font-bold text-foreground mb-1">
                    {job.title}
                  </DialogTitle>
                  <p className="text-lg text-muted-foreground">
                    {job.company?.name || 'Company'}
                  </p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge 
                  variant="secondary" 
                  className={cn(
                    'text-sm font-medium',
                    jobUtils.getJobLevelColor(job.level)
                  )}
                >
                  {job.level}
                </Badge>
                <Badge 
                  variant="outline" 
                  className={cn(
                    'text-sm',
                    jobUtils.getLocationTypeColor(job.location_type)
                  )}
                >
                  {job.location_type}
                </Badge>
                <Badge 
                  variant="outline" 
                  className={cn(
                    'text-sm',
                    jobUtils.getEmploymentTypeColor(job.employment_type)
                  )}
                >
                  {job.employment_type}
                </Badge>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Job Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span className="font-medium">{job.location}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <DollarSign className="w-4 h-4" />
                <span className="font-medium">
                  {jobUtils.formatJobSalary(job)}
                </span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>Posted {jobUtils.formatPostedDate(job.posted_date)}</span>
              </div>
              {job.applicant_count !== undefined && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>{job.applicant_count} applicants</span>
                </div>
              )}
              {job.application_deadline && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>Apply by {new Date(job.application_deadline).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* About the Company */}
          {job.company && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50">
                  <Building2 className="w-4 h-4 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">About the Company</h3>
              </div>
              {job.company.description ? (
                <p className="text-muted-foreground">{job.company.description}</p>
              ) : (
                <p className="text-muted-foreground">
                  {job.company.name} is looking for talented individuals to join their team.
                </p>
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
                    href={job.company.website.startsWith('http') ? job.company.website : `https://${job.company.website}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary hover:underline"
                  >
                    <Globe className="w-4 h-4" />
                    <span>Website</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Role Overview */}
          {job.description && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-indigo-50">
                  <Briefcase className="w-4 h-4 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Role Overview</h3>
              </div>
              <div className="prose prose-sm max-w-none text-muted-foreground">
                <p className="whitespace-pre-wrap">{job.description}</p>
              </div>
            </div>
          )}

          {/* Required Skills and Experience */}
          {job.requirements && job.requirements.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-emerald-50">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Required Skills and Experience</h3>
              </div>
              <ul className="space-y-2 list-disc list-inside pl-4">
                {job.requirements.map((requirement, index) => (
                  <li key={index} className="text-muted-foreground">
                    {requirement}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Nice to Have (Preferred) */}
          {job.nice_to_have && job.nice_to_have.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-amber-50">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Nice to Have (Preferred)</h3>
              </div>
              <ul className="space-y-2 list-disc list-inside pl-4">
                {job.nice_to_have.map((item, index) => (
                  <li key={index} className="text-muted-foreground">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* What We Offer (Benefits) */}
          {job.benefits && job.benefits.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-violet-50">
                  <Sparkles className="w-4 h-4 text-violet-600" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">What We Offer</h3>
              </div>
              <ul className="space-y-2 list-disc list-inside pl-4">
                {job.benefits.map((benefit, index) => (
                  <li key={index} className="text-muted-foreground">
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-3">
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
          {showApplyButton && (
            <Button onClick={handleApply} className="group">
              Apply Now
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
