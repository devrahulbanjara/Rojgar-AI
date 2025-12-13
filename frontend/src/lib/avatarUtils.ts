/**
 * Utility functions for User Avatars
 */

// Paste-like colors for avatars
const AVATAR_COLORS = [
    'bg-red-100 text-red-700',
    'bg-orange-100 text-orange-700',
    'bg-amber-100 text-amber-700',
    'bg-yellow-100 text-yellow-700',
    'bg-lime-100 text-lime-700',
    'bg-green-100 text-green-700',
    'bg-emerald-100 text-emerald-700',
    'bg-teal-100 text-teal-700',
    'bg-cyan-100 text-cyan-700',
    'bg-sky-100 text-sky-700',
    'bg-blue-100 text-blue-700',
    'bg-indigo-100 text-indigo-700',
    'bg-violet-100 text-violet-700',
    'bg-purple-100 text-purple-700',
    'bg-fuchsia-100 text-fuchsia-700',
    'bg-pink-100 text-pink-700',
    'bg-rose-100 text-rose-700'
];

/**
 * Deterministically generates a consistent pastel color based on the input string (name).
 * @param name - The user's name or string to hash.
 * @returns A Tailwind CSS class string for background and text color.
 */
export function getAvatarColor(name: string | null | undefined): string {
    if (!name) return 'bg-slate-100 text-slate-700'; // Default fallback

    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    const index = Math.abs(hash % AVATAR_COLORS.length);
    return AVATAR_COLORS[index];
}

/**
 * Extracts initials from a full name.
 * e.g., "Rahul Dev Banjara" -> "RB"
 * @param name 
 * @returns Initials string (max 2 chars)
 */
export function getInitials(name: string | null | undefined): string {
    if (!name) return "??";

    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
        return parts[0].substring(0, 2).toUpperCase();
    }

    // First and Last name
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
