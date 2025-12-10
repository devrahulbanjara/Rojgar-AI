"use client";

import React from 'react';
import { CheckCircle, Calendar, FileText, XCircle, Briefcase } from 'lucide-react';
import { cn } from '../../lib/utils';

interface Activity {
    id: string;
    type: 'offer' | 'interview' | 'application' | 'system' | 'alert';
    candidateName?: string;
    jobTitle: string;
    action: string;
    timestamp: string; // ISO date string
    subtext?: string;
}

const activities: Activity[] = [
    {
        id: '1',
        type: 'offer',
        candidateName: 'Ram Maharjan',
        jobTitle: 'Senior ML Engineer',
        action: 'accepted the offer for',
        timestamp: '2025-12-10T14:30:00',
        subtext: 'View offer details'
    },
    {
        id: '2',
        type: 'interview',
        candidateName: 'Sampada Poudel',
        jobTitle: 'Product Designer',
        action: 'scheduled an interview for',
        timestamp: '2025-12-10T10:15:00',
        subtext: 'See schedule'
    },
    {
        id: '3',
        type: 'application',
        candidateName: 'Rahul Dev Banjara',
        jobTitle: 'Senior ML Engineer',
        action: 'applied for',
        timestamp: '2025-12-09T16:45:00',
        subtext: 'View application'
    },
    {
        id: '4',
        type: 'system',
        jobTitle: 'Marketing Manager',
        action: 'posted a new job',
        timestamp: '2025-12-08T09:00:00',
        subtext: 'View job posting'
    },
    {
        id: '5',
        type: 'alert',
        candidateName: 'Sita Sharma',
        jobTitle: 'Frontend Developer',
        action: 'withdrew application for',
        timestamp: '2025-12-05T11:20:00',
        subtext: 'View details'
    }
];

const getActivityConfig = (type: Activity['type']) => {
    switch (type) {
        case 'offer':
            return {
                icon: CheckCircle,
                bgColor: 'bg-green-100',
                textColor: 'text-green-600',
                borderColor: 'border-green-200'
            };
        case 'interview':
            return {
                icon: Calendar,
                bgColor: 'bg-purple-100',
                textColor: 'text-purple-600',
                borderColor: 'border-purple-200'
            };
        case 'application':
            return {
                icon: FileText,
                bgColor: 'bg-blue-100',
                textColor: 'text-blue-600',
                borderColor: 'border-blue-200'
            };
        case 'alert':
            return {
                icon: XCircle,
                bgColor: 'bg-red-100',
                textColor: 'text-red-600',
                borderColor: 'border-red-200'
            };
        case 'system':
            return {
                icon: Briefcase,
                bgColor: 'bg-gray-100',
                textColor: 'text-gray-600',
                borderColor: 'border-gray-200'
            };
    }
};

// Helper function to format date and time
const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date('2025-12-10T12:00:00'); // Mock "now" for consistency

    // Calculate if it's today or yesterday
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const activityDate = new Date(date);
    activityDate.setHours(0, 0, 0, 0);

    let dateLabel: string;
    if (activityDate.getTime() === today.getTime()) {
        dateLabel = 'Today';
    } else if (activityDate.getTime() === yesterday.getTime()) {
        dateLabel = 'Yesterday';
    } else {
        // Format as "MMM dd"
        dateLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    // Format time as "hh:mm a"
    const timeLabel = date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });

    return { dateLabel, timeLabel };
};

export function RecentActivityTimeline() {
    return (
        <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            <div className="space-y-0">
                {activities.map((activity, index) => {
                    const config = getActivityConfig(activity.type);
                    const Icon = config.icon;
                    const isLast = index === activities.length - 1;
                    const { dateLabel, timeLabel } = formatDateTime(activity.timestamp);

                    return (
                        <div key={activity.id} className="group relative flex pb-8 last:pb-0">
                            {/* Time Column - Stacked Layout */}
                            <div className="w-28 flex-shrink-0 text-right pr-4">
                                <div className="text-sm font-bold text-gray-900">{dateLabel}</div>
                                <div className="text-xs font-medium text-gray-400 mt-0.5">{timeLabel}</div>
                            </div>

                            {/* Timeline Column */}
                            <div className="relative flex flex-col items-center">
                                {/* Vertical Line */}
                                {!isLast && (
                                    <div className="absolute top-8 bottom-0 w-0.5 bg-gray-100" />
                                )}

                                {/* Icon Circle */}
                                <div
                                    className={cn(
                                        'relative z-10 w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-200 group-hover:scale-110 border-2',
                                        config.bgColor,
                                        config.borderColor
                                    )}
                                >
                                    <Icon className={cn('h-4 w-4', config.textColor)} />
                                </div>
                            </div>

                            {/* Content Column */}
                            <div className="flex-1 ml-4 min-w-0">
                                <div className="text-sm text-gray-700 leading-relaxed">
                                    {activity.candidateName && (
                                        <span className="font-semibold text-gray-900">
                                            {activity.candidateName}
                                        </span>
                                    )}
                                    {!activity.candidateName && (
                                        <span className="font-semibold text-gray-900">System</span>
                                    )}
                                    <span className="mx-1">{activity.action}</span>
                                    <span className="font-medium text-primary hover:underline cursor-pointer">
                                        {activity.jobTitle}
                                    </span>
                                </div>

                                {activity.subtext && (
                                    <div className="mt-1">
                                        <a
                                            href="#"
                                            className="text-xs text-gray-500 hover:text-primary transition-colors"
                                            onClick={(e) => e.preventDefault()}
                                        >
                                            {activity.subtext} →
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
        </div>
    );
}
