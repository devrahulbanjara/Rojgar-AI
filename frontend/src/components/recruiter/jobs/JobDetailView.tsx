"use client";

import * as React from "react"
import {
    X,
    MapPin,
    Briefcase,
    Gift,
    Share2,
    Download,
    Edit,
    BarChart,
    CheckCircle,
    Clock // Assuming Clock is used somewhere or just generic
} from "lucide-react"
import { Button } from "../../ui/button"
import { Badge } from "../../ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../ui/tabs"
import { Separator } from "../../ui/separator"
import { Job } from "./JobCard"
import { cn } from "../../../lib/utils"

interface JobDetailViewProps {
    job: Job
    onClose: () => void
    onEdit: () => void
    // isMobile prop can be passed if we need different internal layouts, but CSS should handle most
}

export const JobDetailView: React.FC<JobDetailViewProps> = ({ job, onClose, onEdit }) => {
    return (
        <div className="flex h-full flex-col bg-background sm:rounded-2xl overflow-hidden">
            {/* Sticky Header - Hero Section */}
            {/* Added 'sm:rounded-t-2xl' to match container rounding on desktop */}
            <div className="relative z-10 bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 p-6 pb-6 border-b shrink-0 sm:rounded-t-2xl">
                {/* Close button handled by Dialog wrapper on Desktop, but kept here for Mobile Sheet or fallback */}
                <div className="absolute top-4 right-4 sm:hidden">
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                        <X className="h-5 w-5 text-muted-foreground" />
                    </button>
                </div>

                <div className="flex flex-col space-y-4 pt-2">
                    <div className="space-y-2 pr-8">
                        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">
                            {job.title}
                        </h2>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="font-medium text-foreground">ConvexHire Inc.</span>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {job.location} ({job.locationType})
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-2">
                        <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md rounded-full px-6">
                            View Applicants
                            <Badge variant="secondary" className="ml-2 bg-white/20 text-white hover:bg-white/30 border-0">
                                {job.applicantsCount}
                            </Badge>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Scrollable Content Body */}
            <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-950">
                <Tabs defaultValue="overview" className="flex flex-col min-h-full">
                    <div className="px-6 py-4 sticky top-0 z-10 bg-white/95 dark:bg-slate-950/95 backdrop-blur-sm border-b">
                        <TabsList className="w-full justify-start h-auto bg-muted/30 p-1 rounded-full space-x-1 inline-flex w-auto">
                            <TabsTrigger
                                value="overview"
                                className="rounded-full px-4 py-1.5 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow transition-all"
                            >
                                Overview
                            </TabsTrigger>
                            <TabsTrigger
                                value="analytics"
                                className="rounded-full px-4 py-1.5 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow transition-all"
                            >
                                Analytics
                            </TabsTrigger>
                            <TabsTrigger
                                value="activity"
                                className="rounded-full px-4 py-1.5 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow transition-all"
                            >
                                Activity Log
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <div className="p-6 pb-24"> {/* Extra padding bottom for scrolling behind footer */}
                        <TabsContent value="overview" className="space-y-8 mt-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">

                            <section className="space-y-4">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <Briefcase className="h-5 w-5 text-primary" /> Role Overview
                                </h3>
                                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap text-[15px]">
                                    {job.description}
                                </p>
                            </section>

                            <Separator className="bg-border/50" />

                            <section className="space-y-4">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <CheckCircle className="h-5 w-5 text-primary" /> Requirements & Skills
                                </h3>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {job.skills.map(skill => (
                                        <Badge key={skill} variant="secondary" className="px-3 py-1 text-sm bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors">
                                            {skill}
                                        </Badge>
                                    ))}
                                </div>
                                <ul className="space-y-3">
                                    {[
                                        "4+ years of experience in similar role",
                                        "Strong proficiency in TypeScript and React",
                                        "Experience with cloud platforms (AWS/GCP)",
                                        "Excellent communication skills"
                                    ].map((req, i) => (
                                        <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                            <span>{req}</span>
                                        </li>
                                    ))}
                                </ul>
                            </section>

                            <Separator className="bg-border/50" />

                            <section className="space-y-4">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <Gift className="h-5 w-5 text-primary" /> Benefits & Perks
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {[
                                        "Competitive Salary",
                                        "Remote Work Options",
                                        "Health Insurance",
                                        "Annual Retreats"
                                    ].map((benefit, i) => (
                                        <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground p-3 rounded-xl border bg-card/50 hover:bg-card transition-colors">
                                            <Gift className="h-4 w-4 text-purple-500" />
                                            {benefit}
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </TabsContent>

                        <TabsContent value="analytics" className="mt-0 h-full flex flex-col items-center justify-center text-muted-foreground py-12 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="text-center space-y-6 w-full max-w-2xl">
                                <div className="flex items-center justify-center h-24 w-24 rounded-full bg-blue-50 dark:bg-blue-900/10 mx-auto">
                                    <BarChart className="h-10 w-10 text-blue-500" />
                                </div>

                                <div className="grid grid-cols-3 gap-4 sm:gap-8 text-left w-full">
                                    <div className="p-5 border rounded-2xl bg-card shadow-sm hover:shadow-md transition-shadow">
                                        <div className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Total Views</div>
                                        <div className="text-2xl sm:text-3xl font-bold text-foreground">{job.viewsCount}</div>
                                        <div className="text-xs text-green-500 mt-1 flex items-center">+12% vs last week</div>
                                    </div>
                                    <div className="p-5 border rounded-2xl bg-card shadow-sm hover:shadow-md transition-shadow">
                                        <div className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Applicants</div>
                                        <div className="text-2xl sm:text-3xl font-bold text-foreground">{job.applicantsCount}</div>
                                        <div className="text-xs text-green-500 mt-1 flex items-center">+5 new today</div>
                                    </div>
                                    <div className="p-5 border rounded-2xl bg-card shadow-sm hover:shadow-md transition-shadow">
                                        <div className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Conversion</div>
                                        <div className="text-2xl sm:text-3xl font-bold text-foreground">{job.viewsCount > 0 ? ((job.applicantsCount / job.viewsCount) * 100).toFixed(1) : 0}%</div>
                                        <div className="text-xs text-muted-foreground mt-1">Industry avg: 12%</div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="activity" className="mt-0 h-full flex items-center justify-center text-muted-foreground py-20 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="text-center space-y-2">
                                <Clock className="h-10 w-10 mx-auto opacity-20 mb-2" />
                                <p>Activity timeline coming soon.</p>
                            </div>
                        </TabsContent>
                    </div>
                </Tabs>
            </div>

            {/* Sticky Footer */}
            <div className="p-4 border-t bg-white/90 dark:bg-slate-950/90 backdrop-blur-lg sticky bottom-0 z-20 flex flex-col sm:flex-row justify-between items-center gap-3 sm:rounded-b-2xl">
                <div className="flex gap-2 w-full sm:w-auto">
                    <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                        <Share2 className="h-4 w-4 mr-2" /> Share
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                        <Download className="h-4 w-4 mr-2" /> PDF
                    </Button>
                    <Button variant="outline" size="sm" onClick={onEdit} className="flex-1 sm:flex-none">
                        <Edit className="h-4 w-4 mr-2" /> Edit
                    </Button>
                </div>
                <Button variant="ghost" onClick={onClose} className="w-full sm:w-auto hover:bg-neutral-100">Close</Button>
            </div>
        </div>
    )
}
