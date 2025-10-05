import React from 'react';
import { ApplicationTrackingCard } from './ApplicationTrackingCard';
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
        return 'You haven\'t applied for any jobs yet';
      case 'interviewing':
        return 'No interviews scheduled';
      case 'outcome':
        return 'No outcomes yet';
      default:
        return 'No applications';
    }
  };

  // Get column-specific styling
  const getColumnStyling = () => {
    switch (columnType) {
      case 'applied':
        return {
          headerBg: 'bg-slate-50',
          borderColor: 'border-slate-200',
          accentColor: 'text-slate-600'
        };
      case 'interviewing':
        return {
          headerBg: 'bg-blue-50',
          borderColor: 'border-blue-200',
          accentColor: 'text-blue-600'
        };
      case 'outcome':
        return {
          headerBg: 'bg-green-50',
          borderColor: 'border-green-200',
          accentColor: 'text-green-600'
        };
      default:
        return {
          headerBg: 'bg-slate-50',
          borderColor: 'border-slate-200',
          accentColor: 'text-slate-600'
        };
    }
  };

  const styling = getColumnStyling();

  return (
    <section className={`flex-1 min-w-[280px] bg-white rounded-xl border ${styling.borderColor} shadow-sm overflow-hidden flex flex-col`}>
      {/* Column Header */}
      <header className={`p-6 border-b ${styling.borderColor} ${styling.headerBg}`}>
        <h3 className={`font-semibold text-lg ${styling.accentColor} mb-1`}>{title}</h3>
        <p className="text-sm text-slate-500">{description}</p>
      </header>
      
      {/* Column Content */}
      <div className="flex-1 p-4 overflow-y-auto max-h-[600px] space-y-4">
        {applications.length === 0 ? (
          <div className="h-32 flex items-center justify-center">
            <p className="text-sm text-slate-400 text-center px-4">{getEmptyStateMessage()}</p>
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
      
      {/* Column Footer */}
      <footer className={`p-4 ${styling.headerBg} border-t ${styling.borderColor} text-sm ${styling.accentColor} font-medium`}>
        {applications.length} {applications.length === 1 ? 'application' : 'applications'}
      </footer>
    </section>
  );
};