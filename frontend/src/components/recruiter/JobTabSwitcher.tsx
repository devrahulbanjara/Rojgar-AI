/**
 * JobTabSwitcher - Premium pill-style tab switcher with icons
 */

import React, { memo } from 'react';
import { Briefcase, FileEdit, BookOpen } from 'lucide-react';
import { cn } from '../../lib/utils';

type TabType = 'active' | 'drafts' | 'reference-jds';

interface JobTabSwitcherProps {
    activeTab: TabType;
    onTabChange: (tab: TabType) => void;
    activeCount: number;
    draftCount: number;
    className?: string;
}

const tabs = [
    { id: 'active' as TabType, label: 'Active Jobs', icon: Briefcase, color: 'blue' },
    { id: 'drafts' as TabType, label: 'Drafts', icon: FileEdit, color: 'amber' },
    { id: 'reference-jds' as TabType, label: 'Reference JDs', icon: BookOpen, color: 'purple' },
];

export const JobTabSwitcher = memo<JobTabSwitcherProps>(({
    activeTab,
    onTabChange,
    activeCount,
    draftCount,
    className,
}) => {
    const getCount = (tabId: TabType) => {
        if (tabId === 'active') return activeCount;
        if (tabId === 'drafts') return draftCount;
        return null;
    };

    return (
        <div className={cn(
            'inline-flex items-center gap-1 p-1 bg-gray-100/80 backdrop-blur-sm rounded-2xl',
            className
        )}>
            {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                const count = getCount(tab.id);

                return (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={cn(
                            'relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium',
                            'transition-all duration-300 ease-out',
                            isActive
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
                        )}
                    >
                        <Icon className={cn(
                            'w-4 h-4 transition-colors duration-300',
                            isActive && tab.color === 'blue' && 'text-blue-600',
                            isActive && tab.color === 'amber' && 'text-amber-600',
                            isActive && tab.color === 'purple' && 'text-purple-600',
                            !isActive && 'text-gray-400'
                        )} />
                        <span>{tab.label}</span>
                        {count !== null && (
                            <span className={cn(
                                'px-2 py-0.5 rounded-full text-xs font-semibold transition-all duration-300',
                                isActive && tab.color === 'blue' && 'bg-blue-100 text-blue-700',
                                isActive && tab.color === 'amber' && 'bg-amber-100 text-amber-700',
                                !isActive && 'bg-gray-200/80 text-gray-500'
                            )}>
                                {count}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
});

JobTabSwitcher.displayName = 'JobTabSwitcher';
