"use client";

import * as React from "react"
import {
    MoreHorizontal,
    MapPin,
    Globe,
    Building,
    Briefcase,
    Calendar,
    Users,
    Eye,
    Edit,
    Copy,
    Trash,
    CheckCircle,
    XCircle,
    Share2
} from "lucide-react"
import { Card, CardContent, CardHeader, CardFooter, CardTitle, CardDescription } from "../../ui/card"
import { Button } from "../../ui/button"
import { Badge } from "../../ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../../ui/dropdown-menu"
import { cn, formatCurrency } from "../../../lib/utils"

export interface Job {
    id: string
    title: string
    department: string
    level: string
    status: 'active' | 'draft' | 'closed'
    isFeatured: boolean
    location: string
    locationType: 'on-site' | 'remote' | 'hybrid'
    employmentType: 'full-time' | 'part-time' | 'contract' | 'internship'
    salaryMin?: number
    salaryMax?: number
    currency: string
    description: string
    skills: string[]
    postedAt: string
    deadline?: string
    applicantsCount: number
    viewsCount: number
}

interface JobCardProps {
    job: Job
    onClick?: () => void
    onAction?: (action: string, jobId: string) => void
}

export const JobCard: React.FC<JobCardProps> = ({ job, onClick, onAction }) => {

    const statusColors = {
        active: "bg-green-100 text-green-700 hover:bg-green-100/80 dark:bg-green-900/30 dark:text-green-400",
        draft: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100/80 dark:bg-yellow-900/30 dark:text-yellow-400",
        closed: "bg-gray-100 text-gray-700 hover:bg-gray-100/80 dark:bg-gray-800 dark:text-gray-400",
    }

    const LocationIcon = {
        'on-site': MapPin,
        'remote': Globe,
        'hybrid': Building
    }[job.locationType]

    return (
        <Card
            className={cn(
                "group relative flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer border-l-4",
                job.status === 'active' ? "border-l-green-500" : job.status === 'draft' ? "border-l-yellow-500" : "border-l-gray-300"
            )}
            onClick={(e) => {
                // Prevent click when clicking dropdown or buttons
                if ((e.target as HTMLElement).closest('button')) return;
                onClick?.()
            }}
        >
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex flex-col gap-1.5 align-start">
                        <div className="flex gap-2 items-center">
                            <Badge variant="secondary" className={cn("capitalize px-2 py-0.5", statusColors[job.status])}>
                                {job.status}
                            </Badge>
                            {job.isFeatured && (
                                <Badge variant="secondary" className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0">
                                    Featured
                                </Badge>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1" title="Applicants">
                            <Users className="h-4 w-4" />
                            <span>{job.applicantsCount}</span>
                        </div>
                        <div className="flex items-center gap-1" title="Views">
                            <Eye className="h-4 w-4" />
                            <span>{job.viewsCount}</span>
                        </div>
                    </div>
                </div>

                <div className="mt-2 space-y-1">
                    <CardTitle className="text-xl font-semibold text-primary group-hover:text-blue-600 transition-colors">
                        {job.title}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">{job.department}</span>
                        <span>•</span>
                        <span>{job.level}</span>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-4 pb-4">
                <div className="grid grid-cols-2 gap-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                        <LocationIcon className="h-4 w-4 shrink-0" />
                        <span className="truncate">{job.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Briefcase className="h-4 w-4 shrink-0" />
                        <span className="capitalize">{job.employmentType}</span>
                    </div>
                    <div className="col-span-2 font-medium text-foreground">
                        {job.salaryMin && job.salaryMax ? (
                            `${formatCurrency(job.salaryMin)} - ${formatCurrency(job.salaryMax)}`
                        ) : 'Salary not disclosed'}
                    </div>
                </div>

                <p className="line-clamp-2 text-sm text-muted-foreground/90">
                    {job.description}
                </p>

                <div className="flex flex-wrap gap-2">
                    {job.skills.slice(0, 3).map((skill, i) => (
                        <Badge key={i} variant="secondary" className="bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            {skill}
                        </Badge>
                    ))}
                    {job.skills.length > 3 && (
                        <Badge variant="outline" className="opacity-70">
                            +{job.skills.length - 3} more
                        </Badge>
                    )}
                </div>
            </CardContent>

            <div className="px-6">
                <div className="h-px bg-border/50" />
            </div>

            <CardFooter className="pt-4 flex items-center justify-between text-sm">
                <div className="flex flex-col gap-0.5 text-muted-foreground text-xs">
                    <span>Posted {job.postedAt}</span>
                    {job.deadline && (
                        <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                            <Calendar className="h-3 w-3" />
                            Due {job.deadline}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={onClick}>
                        View Details
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onAction?.('edit', job.id)}>
                                <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onAction?.('duplicate', job.id)}>
                                <Copy className="mr-2 h-4 w-4" /> Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onAction?.('share', job.id)}>
                                <Share2 className="mr-2 h-4 w-4" /> Share
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {job.status === 'active' ? (
                                <DropdownMenuItem onClick={() => onAction?.('close', job.id)} className="text-orange-600">
                                    <XCircle className="mr-2 h-4 w-4" /> Close Job
                                </DropdownMenuItem>
                            ) : (
                                <DropdownMenuItem onClick={() => onAction?.('activate', job.id)} className="text-green-600">
                                    <CheckCircle className="mr-2 h-4 w-4" /> Activate
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => onAction?.('delete', job.id)} className="text-red-600">
                                <Trash className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardFooter>
        </Card>
    )
}
