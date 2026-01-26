
export const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    applied: { label: "Applied", color: "bg-blue-50 text-blue-700 border-blue-200" },
    interviewing: { label: "Interviewing", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
    outcome: { label: "Outcome", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

export const COLUMN_MAPPING: Record<string, string> = {
    applied: "Applied",
    interviewing: "Interviewing",
    outcome: "Outcome",
};
