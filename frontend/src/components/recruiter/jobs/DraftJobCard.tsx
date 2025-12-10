"use client";

import React from 'react';
import { Job } from './JobCard';
import { Button } from '../../ui/button';
import {
    Calendar,
    Trash2,
    MapPin,
    ArrowRight,
    FileEdit,
    MoreHorizontal
} from 'lucide-react';
import { Badge } from '../../ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../ui/dropdown-menu';
import { Progress } from '../../ui/progress';

interface DraftJobCardProps {
    job: Job;
    onResume: (job: Job) => void;
    onDiscard: (jobId: string) => void;
}

export function DraftJobCard({ job, onResume, onDiscard }: DraftJobCardProps) {
    // Simulated "Step" based on missing data or just random for demo
    // In a real app, 'step' would be stored in the draft data
    const stepsCompleted = 2;
    const totalSteps = 4;
    const progress = (stepsCompleted / totalSteps) * 100;

    return (
        <div className="group relative flex flex-col justify-between rounded-xl border-2 border-dashed border-gray-300 bg-white/50 hover:bg-white hover:border-primary/50 dark:bg-slate-950/50 dark:border-slate-800 dark:hover:border-primary/50 p-5 shadow-sm transition-all duration-300 hover:shadow-md h-full">

            <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <Badge variant="secondary" className="mb-2 bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-yellow-200">
                            Draft
                        </Badge>
                        <h3 className="font-semibold text-lg text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                            {job.title || "Untitled Draft"}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                                <FileEdit className="h-3 w-3" />
                                {job.department || "No Department"}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {job.location || "No Location"}
                            </span>
                        </div>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onDiscard(job.id)} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                                <Trash2 className="mr-2 h-4 w-4" /> Discard Draft
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Progress */}
                <div className="space-y-2">
                    <div className="flex justify-between text-xs font-medium">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="text-primary">{stepsCompleted} of {totalSteps} steps</span>
                    </div>
                    <Progress value={progress} className="h-1.5 bg-gray-100" />
                    <p className="text-xs text-muted-foreground">Stopped at: <span className="font-medium text-foreground">AI Generation</span></p>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="mt-6 pt-4 border-t flex flex-col gap-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <Calendar className="h-3 w-3" />
                    Last edited {job.postedAt || "just now"}
                </div>
                <div className="flex gap-2">
                    <Button
                        onClick={() => onResume(job)}
                        className="w-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors border-0 shadow-none"
                    >
                        Resume Editing <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
