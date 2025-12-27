import React from 'react';
import { ApplicationTrackingCard } from './ApplicationTrackingCard';
import { Inbox } from 'lucide-react';
import type { Application } from '../../types/application';

interface ApplicationTrackingColumnProps {
  title: string;
  description: string;
  applications: Application[];
  columnType: 'applied' | 'interviewing' | 'outcome';
}

export const ApplicationTrackingColumn: React.FC<ApplicationTrackingColumnProps> = ({
  title,
  description,
  applications,
  columnType
}) => {
  const getEmptyStateMessage = () => {
    switch (columnType) {
      case 'applied':
        return 'No applications yet';
      case 'interviewing':
        return 'No interviews scheduled';
      case 'outcome':
        return 'No outcomes yet';
      default:
        return 'No applications';
    }
  };

  // Get column-specific border color
  const getBorderColor = () => {
    switch (columnType) {
      case 'applied':
        return '#94A3B8'; // Slate gray
      case 'interviewing':
        return '#3056F5'; // Brand blue
      case 'outcome':
        return '#16A34A'; // Success green
      default:
        return '#94A3B8';
    }
  };

  // Get column-specific text color
  const getTextColor = () => {
    switch (columnType) {
      case 'applied':
        return 'text-[#94A3B8]';
      case 'interviewing':
        return 'text-[#3056F5]';
      case 'outcome':
        return 'text-[#16A34A]';
      default:
        return 'text-[#94A3B8]';
    }
  };

  const borderColor = getBorderColor();
  const textColor = getTextColor();

  return (
    <section className="flex flex-col">
      {/* Column Header - No background, just border-bottom */}
      <header className="pb-4 mb-5" style={{ borderBottom: `2px solid ${borderColor}` }}>
        <h3 className={`font-semibold text-lg ${textColor} mb-1`}>
          {title}
        </h3>
        <p className="text-[13px] text-[#94A3B8]">
          {description}
        </p>
      </header>

      {/* Column Content */}
      <div className="flex-1 space-y-4 min-h-[200px]">
        {applications.length === 0 ? (
          <div className="bg-[#F9FAFB] border border-dashed border-[#E5E7EB] rounded-xl p-8 text-center">
            <Inbox className="h-8 w-8 text-[#CBD5E1] mx-auto mb-3" />
            <p className="text-sm font-medium text-[#94A3B8]">
              {getEmptyStateMessage()}
            </p>
          </div>
        ) : (
          applications.map(application => (
            <ApplicationTrackingCard
              key={application.id}
              application={application}
            />
          ))
        )}
      </div>

      {/* Column Footer - Application Count */}
      {applications.length > 0 && (
        <footer className="mt-4 px-4 py-3 bg-[#F9FAFB] rounded-lg">
          <p className={`text-[13px] font-semibold ${textColor} text-center`}>
            {applications.length} {applications.length === 1 ? 'application' : 'applications'}
          </p>
        </footer>
      )}
    </section>
  );
};
