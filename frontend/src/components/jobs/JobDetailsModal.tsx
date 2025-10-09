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
  X
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
                  {jobUtils.formatSalaryRange(job.salary_range)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Building2 className="w-4 h-4" />
                <span>{job.department}</span>
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

          {/* Job Description */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Job Description</h3>
            <div className="prose prose-sm max-w-none text-muted-foreground">
              <p className="whitespace-pre-wrap">{job.description}</p>
            </div>
          </div>

          {/* Requirements */}
          {job.requirements && job.requirements.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Requirements</h3>
              <ul className="space-y-2">
                {job.requirements.map((requirement, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{requirement}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Skills */}
          {job.skills && job.skills.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Required Skills</h3>
              <div className="flex flex-wrap gap-2">
                {job.skills.map((skill, index) => (
                  <Badge 
                    key={index} 
                    variant="outline" 
                    className="text-sm px-3 py-1"
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Company Information */}
          {job.company && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">About {job.company.name}</h3>
              {job.company.description && (
                <p className="text-muted-foreground">{job.company.description}</p>
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
