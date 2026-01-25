import { useEffect, useState, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import { STATUS_CONFIG, COLUMN_MAPPING } from "@/utils/statusStyles";
import { Loader2, Briefcase, Video, Trophy, MapPin, CalendarClock } from "lucide-react";

interface JobSummary {
    job_id: string;
    title: string;
    location_city?: string;
    employment_type?: string;
}

interface OrganizationSummary {
    organization_id: string;
    name: string;
    organization_logo?: string;
}

interface ApplicationResponse {
    application_id: string;
    current_status: string;
    applied_at: string;
    updated_at: string;
    job: JobSummary;
    organization: OrganizationSummary;
}

export default function CandidateDashboard() {
    const [applications, setApplications] = useState<ApplicationResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const fetchApplications = useCallback(async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

            const res = await fetch(`${apiUrl}/api/v1/candidate/applications`, {
                credentials: "include"
            });
            if (!res.ok) throw new Error("Failed");
            const data = await res.json();
            setApplications(data);
        } catch (err) {
            console.error(err)
            setError(true);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchApplications();
    }, [fetchApplications]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (
                (event.ctrlKey || event.metaKey) &&
                event.shiftKey &&
                event.key === "R"
            ) {
                event.preventDefault();
                fetchApplications();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [fetchApplications]);

    const columns: Record<string, ApplicationResponse[]> = {
        Applied: [],
        Interviewing: [],
        Outcome: []
    };

    applications.forEach(app => {
        const colKey = COLUMN_MAPPING[app.current_status] || "Applied";
        if (columns[colKey]) {
            columns[colKey].push(app);
        } else {
            columns["Applied"].push(app);
        }
    });

    if (loading) return <div className="flex justify-center p-20 min-h-[500px] items-center"><Loader2 className="animate-spin text-blue-600 w-8 h-8" /></div>;
    if (error) return <div className="text-center p-20 text-red-500">Failed to load applications.</div>;

    return (
        <div className="h-full flex flex-col space-y-8 pb-10">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Your Applications</h1>
                <p className="text-slate-500 mt-2 text-lg">Track your job application journey</p>
            </div>

            {/* Kanban Columns - Equal Height via Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">

                {/* Applied Column */}
                <div className="bg-blue-50/50 rounded-2xl p-6 flex flex-col gap-6 border border-blue-100/60 shadow-sm/50">
                    <ColumnHeader
                        title="Applied"
                        count={columns.Applied.length}
                        icon={<Briefcase className="w-5 h-5 text-blue-600" />}
                        textColor="text-blue-900"
                        badgeColor="bg-blue-100 text-blue-700"
                    />
                    <div className="flex-1 flex flex-col gap-4">
                        {columns.Applied.map(app => (
                            <ApplicationCard key={app.application_id} app={app} />
                        ))}
                        {columns.Applied.length === 0 && <EmptyState message="No active applications" />}
                    </div>
                </div>

                {/* Interviewing Column */}
                <div className="bg-indigo-50/50 rounded-2xl p-6 flex flex-col gap-6 border border-indigo-100/60 shadow-sm/50">
                    <ColumnHeader
                        title="Interviewing"
                        count={columns.Interviewing.length}
                        icon={<Video className="w-5 h-5 text-indigo-600" />}
                        textColor="text-indigo-900"
                        badgeColor="bg-indigo-100 text-indigo-700"
                    />
                    <div className="flex-1 flex flex-col gap-4">
                        {columns.Interviewing.map(app => (
                            <ApplicationCard key={app.application_id} app={app} />
                        ))}
                        {columns.Interviewing.length === 0 && <EmptyState message="No interviews yet" />}
                    </div>
                </div>

                {/* Outcome Column */}
                <div className="bg-emerald-50/50 rounded-2xl p-6 flex flex-col gap-6 border border-emerald-100/60 shadow-sm/50">
                    <ColumnHeader
                        title="Outcome"
                        count={columns.Outcome.length}
                        icon={<Trophy className="w-5 h-5 text-emerald-600" />}
                        textColor="text-emerald-900"
                        badgeColor="bg-emerald-100 text-emerald-700"
                    />
                    <div className="flex-1 flex flex-col gap-4">
                        {columns.Outcome.map(app => (
                            <ApplicationCard key={app.application_id} app={app} />
                        ))}
                        {columns.Outcome.length === 0 && <EmptyState message="No outcomes yet" />}
                    </div>
                </div>

            </div>
        </div>
    );
}

// Sub-components

function ColumnHeader({ title, count, icon, textColor, badgeColor }: { title: string, count: number, icon: React.ReactNode, textColor: string, badgeColor: string }) {
    return (
        <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-3">
                {icon}
                <h3 className={`font-bold ${textColor}`}>{title}</h3>
            </div>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${badgeColor}`}>
                {count}
            </span>
        </div>
    );
}

function ApplicationCard({ app }: { app: ApplicationResponse }) {
    const statusStyle = STATUS_CONFIG[app.current_status] || STATUS_CONFIG.applied;

    // Determine left border color based on specific status.
    // We can map the bg-color from config to a border color roughly, or just use the config's text/border colors.
    // Let's rely on the config but map it to a border-l color.
    // Since STATUS_CONFIG has 'color' class string, we can parse it or just use a lookup.
    // For simplicity and cleanest look, let's use the status color's main hue.

    // Quick helper to extract border color from the status config class or default
    const getBorderColorClass = (statusStr: string) => {
        if (statusStr === 'interviewing') return 'border-l-indigo-500';
        if (statusStr === 'outcome') return 'border-l-emerald-500';
        return 'border-l-blue-500'; // Default applied
    };

    return (
        <div className={`bg-white p-4 rounded-lg shadow-sm border border-slate-200 border-l-[4px] ${getBorderColorClass(app.current_status)} hover:shadow-md transition-all cursor-default group`}>
            {/* Header: Title & Company */}
            <div className="mb-3">
                <h4 className="font-bold text-slate-900 text-sm leading-tight mb-1 group-hover:text-blue-600 transition-colors">
                    {app.job.title}
                </h4>
                <p className="text-sm font-medium text-slate-500">
                    {app.organization.name}
                </p>
            </div>

            {/* Metadata: Location & Type */}
            <div className="flex items-center gap-3 text-xs text-slate-400 mb-4">
                {app.job.location_city && (
                    <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {app.job.location_city}
                    </div>
                )}
                {app.job.employment_type && (
                    <div className="flex items-center gap-1">
                        <Briefcase className="w-3 h-3" />
                        {app.job.employment_type}
                    </div>
                )}
            </div>

            {/* Footer: Date & Status Chip */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                    <CalendarClock className="w-3 h-3" />
                    {formatDistanceToNow(new Date(app.applied_at), { addSuffix: true })}
                </div>

                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${statusStyle.color.replace('border', '')} border`}>
                    {statusStyle.label}
                </span>
            </div>
        </div>
    );
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="h-32 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-lg">
            <div className="text-sm italic">{message}</div>
        </div>
    );
}
