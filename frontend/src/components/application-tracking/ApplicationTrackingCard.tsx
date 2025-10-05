import React from 'react';
import type { Application, ApplicationStatus } from '../../types/application';
import { formatDistanceToNow } from 'date-fns';
import { Calendar, CheckCircle, XCircle, Clock, Eye, Users } from 'lucide-react';

interface ApplicationTrackingCardProps {
  application: Application;
}

export const ApplicationTrackingCard: React.FC<ApplicationTrackingCardProps> = ({ application }) => {
  // Format the date to show as "X days ago"
  const formattedDate = formatDistanceToNow(new Date(application.applied_date), { addSuffix: true });
  
  // Get status icon and color
  const getStatusInfo = (status: ApplicationStatus) => {
    switch (status) {
      case "pending":
        return { icon: Clock, color: "text-slate-500", bgColor: "bg-slate-50" };
      case "under_review":
        return { icon: Eye, color: "text-blue-600", bgColor: "bg-blue-50" };
      case "interview_scheduled":
        return { icon: Calendar, color: "text-blue-600", bgColor: "bg-blue-50" };
      case "offer_extended":
        return { icon: CheckCircle, color: "text-green-600", bgColor: "bg-green-50" };
      case "accepted":
        return { icon: CheckCircle, color: "text-green-600", bgColor: "bg-green-50" };
      case "rejected":
        return { icon: XCircle, color: "text-red-600", bgColor: "bg-red-50" };
      default:
        return { icon: Clock, color: "text-slate-500", bgColor: "bg-slate-50" };
    }
  };

  const statusInfo = getStatusInfo(application.status);
  const StatusIcon = statusInfo.icon;

  return (
    <article className="bg-white rounded-lg border border-slate-100 hover:border-slate-200 transition-colors p-4">
      <div className="space-y-3">
        {/* Job Title - Bold */}
        <h4 className="font-semibold text-slate-900 text-base leading-tight">
          {application.job_title}
        </h4>
        
        {/* Company Name - Subtle */}
        <p className="text-sm text-slate-600 font-medium">
          {application.company_name}
        </p>
        
        {/* Status and Date Row */}
        <div className="flex items-center justify-between">
          {/* Status Badge with Icon */}
          <div 
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color}`}
            role="status"
            aria-label={`Application status: ${application.status.replace('_', ' ')}`}
          >
            <StatusIcon className="h-3 w-3" aria-hidden="true" />
            <span className="capitalize">
              {application.status.replace('_', ' ')}
            </span>
          </div>
          
          {/* Applied Date */}
          <time 
            className="text-xs text-slate-400"
            dateTime={application.applied_date}
            title={`Applied on ${new Date(application.applied_date).toLocaleDateString()}`}
          >
            {formattedDate}
          </time>
        </div>
      </div>
    </article>
  );
};