import React from 'react';
import Image from 'next/image';
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
  CheckCircle2,
  X,
  Briefcase,
  Sparkles,
  Globe,
  Bookmark,
  Share2,
  TrendingUp,
  MapPinned,
  ClockIcon,
  UserCircle2
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

  const handleSave = () => {
    // TODO: Implement save functionality
  };

  const handleShare = () => {
    // TODO: Implement share functionality
  };

  // Calculate days left to apply
  const daysLeft = job.application_deadline 
    ? Math.ceil((new Date(job.application_deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
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
                {job.company?.name || 'Company'}
              </p>
            </div>
          </div>

          {/* Enhanced Badges with icons */}
          <div className="flex flex-wrap gap-3">
            <Badge
              className={cn(
                'px-4 py-2 text-sm font-semibold rounded-full border-0 transition-all duration-200 hover:scale-105',
                'bg-blue-50 text-blue-700 hover:bg-blue-100'
              )}
            >
              <UserCircle2 className="w-4 h-4 mr-1.5" />
              {job.level}
            </Badge>
            <Badge
              className={cn(
                'px-4 py-2 text-sm font-semibold rounded-full border-0 transition-all duration-200 hover:scale-105',
                'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              )}
            >
              <MapPinned className="w-4 h-4 mr-1.5" />
              {job.location_type}
            </Badge>
            <Badge
              className={cn(
                'px-4 py-2 text-sm font-semibold rounded-full border-0 transition-all duration-200 hover:scale-105',
                'bg-purple-50 text-purple-700 hover:bg-purple-100'
              )}
            >
              <ClockIcon className="w-4 h-4 mr-1.5" />
              {job.employment_type}
            </Badge>
            {job.applicant_count !== undefined && job.applicant_count > 0 && (
              <Badge
                className={cn(
                  'px-4 py-2 text-sm font-semibold rounded-full border-0 transition-all duration-200 hover:scale-105',
                  'bg-orange-50 text-orange-700 hover:bg-orange-100'
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
                <p className="text-xs text-gray-500 font-medium mb-0.5 whitespace-nowrap">Location</p>
                <p className="text-sm font-semibold text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis">
                  {job.location}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 border-l border-gray-200 pl-8 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 font-medium mb-0.5 whitespace-nowrap">Salary</p>
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
                <p className="text-xs text-gray-500 font-medium mb-0.5 whitespace-nowrap">Posted</p>
                <p className="text-sm font-semibold text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis">
                  {jobUtils.formatPostedDate(job.posted_date)}
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
                  {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left to apply
                </p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Application deadline: {new Date(job.application_deadline!).toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </p>
              </div>
            </div>
          )}

          {/* About the Company - Enhanced */}
          {job.company && (
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-8 bg-blue-600 rounded-full"></div>
                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-50">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-[22px] font-semibold text-gray-900 tracking-[0.5px]">About the Company</h3>
              </div>
              <div className="pl-14">
                {job.company.description ? (
                  <p className="text-[15px] text-gray-700 leading-relaxed mb-6">{job.company.description}</p>
                ) : (
                  <p className="text-[15px] text-gray-700 leading-relaxed mb-6">
                    {job.company.name} is looking for talented individuals to join their team.
                  </p>
                )}
                <div className="flex flex-wrap gap-3">
                  {job.company.location && (
                    <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 hover:scale-105">
                      <MapPin className="w-4 h-4" />
                      <span className="font-medium">{job.company.location}</span>
                    </button>
                  )}
                  {job.company.industry && (
                    <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 hover:scale-105">
                      <Building2 className="w-4 h-4" />
                      <span className="font-medium">{job.company.industry}</span>
                    </button>
                  )}
                  {job.company.website && (
                    <a
                      href={job.company.website.startsWith('http') ? job.company.website : `https://${job.company.website}`}
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
          )}

          {/* Role Overview - Enhanced */}
          {job.description && (
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-8 bg-indigo-600 rounded-full"></div>
                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-indigo-50">
                  <Briefcase className="w-5 h-5 text-indigo-600" />
                </div>
                <h3 className="text-[22px] font-semibold text-gray-900 tracking-[0.5px]">Role Overview</h3>
              </div>
              <div className="pl-14 prose prose-sm max-w-none">
                <p className="text-[16px] text-gray-700 leading-[1.8] whitespace-pre-wrap">{job.description}</p>
              </div>
            </section>
          )}

          {/* Required Skills and Experience - Enhanced with checkmarks */}
          {job.requirements && job.requirements.length > 0 && (
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-8 bg-emerald-600 rounded-full"></div>
                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-emerald-50">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="text-[22px] font-semibold text-gray-900 tracking-[0.5px]">Required Skills and Experience</h3>
              </div>
              <div className="pl-14">
                <ul className="space-y-3 list-disc list-inside">
                  {job.requirements.map((requirement, index) => (
                    <li key={index} className="text-[15px] text-gray-700 leading-relaxed pl-2">
                      {requirement}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          {/* Nice to Have (Preferred) - Enhanced */}
          {job.nice_to_have && job.nice_to_have.length > 0 && (
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-8 bg-amber-600 rounded-full"></div>
                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-amber-50">
                  <Sparkles className="w-5 h-5 text-amber-600" />
                </div>
                <h3 className="text-[22px] font-semibold text-gray-900 tracking-[0.5px]">Nice to Have (Preferred)</h3>
              </div>
              <div className="pl-14">
                <ul className="space-y-3 list-disc list-inside">
                  {job.nice_to_have.map((item, index) => (
                    <li key={index} className="text-[15px] text-gray-700 leading-relaxed pl-2">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          {/* What We Offer (Benefits) - Enhanced */}
          {job.benefits && job.benefits.length > 0 && (
            <section className="mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-8 bg-violet-600 rounded-full"></div>
                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-violet-50">
                  <Sparkles className="w-5 h-5 text-violet-600" />
                </div>
                <h3 className="text-[22px] font-semibold text-gray-900 tracking-[0.5px]">What We Offer</h3>
              </div>
              <div className="pl-14">
                <ul className="space-y-3 list-disc list-inside">
                  {job.benefits.map((benefit, index) => (
                    <li key={index} className="text-[15px] text-gray-700 leading-relaxed pl-2">
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}
        </div>

        {/* Sticky Footer with CTAs */}
        <div className="border-t border-gray-200 bg-white px-12 py-6 flex items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="lg"
              onClick={handleSave}
              className="h-12 px-5 border-2 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <Bookmark className="w-5 h-5 mr-2" />
              Save Job
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
