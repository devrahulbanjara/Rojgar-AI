// utils/statusStyles.ts

export const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    applied: { label: "Applied", color: "bg-blue-50 text-blue-700 border-blue-200" },
    shortlisting: { label: "Shortlisting", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
    shortlisted: { label: "Shortlisted", color: "bg-purple-50 text-purple-700 border-purple-200" },
    interview_scheduled: { label: "Interview Scheduled", color: "bg-amber-50 text-amber-700 border-amber-200" },
    interview_completed: { label: "Interview Completed", color: "bg-orange-50 text-orange-700 border-orange-200" },
    offer_made: { label: "Offer Made", color: "bg-emerald-100 text-emerald-800 border-emerald-300" },
    offer_accepted: { label: "Offer Accepted", color: "bg-green-100 text-green-800 border-green-300" },
    hired: { label: "Hired", color: "bg-green-600 text-white border-green-700" },
    rejected: { label: "Rejected", color: "bg-red-50 text-red-700 border-red-200" },
};

// Map backend status to the 3 Columns
export const COLUMN_MAPPING: Record<string, string> = {
    applied: "Applied",
    shortlisting: "Applied",
    shortlisted: "Applied",

    interview_scheduled: "Interviewing",
    interview_completed: "Interviewing",

    offer_made: "Outcome",
    offer_accepted: "Outcome",
    hired: "Outcome",
    rejected: "Outcome",
};
