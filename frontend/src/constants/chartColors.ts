/**
 * ConvexHire Design System - Chart/Data Visualization Colors
 *
 * For charts, graphs, and analytics dashboards.
 * Colors are chosen for visual distinction and accessibility.
 */

export interface ChartColorPalette {
  series1: string
  series2: string
  series3: string
  series4: string
  series5: string
  series6: string
  series7: string
  series8: string
  grid: string
  axis: string
}

export const CHART_COLORS = {
  light: {
    series1: '#2563EB', // Blue-600
    series2: '#7C3AED', // Violet-600
    series3: '#059669', // Emerald-600
    series4: '#DC2626', // Red-600
    series5: '#D97706', // Amber-600
    series6: '#DB2777', // Pink-600
    series7: '#0891B2', // Cyan-600
    series8: '#65A30D', // Lime-600
    grid: '#E2E8F0', // Slate-200
    axis: '#64748B', // Slate-500
  },
  dark: {
    series1: '#60A5FA', // Blue-400
    series2: '#A78BFA', // Violet-400
    series3: '#34D399', // Emerald-400
    series4: '#F87171', // Red-400
    series5: '#FBBF24', // Amber-400
    series6: '#F472B6', // Pink-400
    series7: '#22D3EE', // Cyan-400
    series8: '#A3E635', // Lime-400
    grid: '#334155', // Slate-700
    axis: '#94A3B8', // Slate-400
  },
} as const

/**
 * Get chart color palette for current theme
 */
export function getChartColors(isDark: boolean = false): ChartColorPalette {
  return isDark ? CHART_COLORS.dark : CHART_COLORS.light
}

/**
 * Get an array of series colors for charts
 */
export function getSeriesColors(isDark: boolean = false, count: number = 8): string[] {
  const palette = getChartColors(isDark)
  const allColors = [
    palette.series1,
    palette.series2,
    palette.series3,
    palette.series4,
    palette.series5,
    palette.series6,
    palette.series7,
    palette.series8,
  ]
  return allColors.slice(0, count)
}

/**
 * Hiring Pipeline Chart Colors
 * Specific colors for pipeline stages
 */
export const PIPELINE_CHART_COLORS = {
  light: {
    applied: '#0EA5E9', // Sky-500
    screening: '#3B82F6', // Blue-500
    interviewing: '#F59E0B', // Amber-500
    shortlisted: '#14B8A6', // Teal-500
    offered: '#10B981', // Emerald-500
    hired: '#22C55E', // Green-500
    rejected: '#EF4444', // Red-500
    withdrawn: '#6B7280', // Gray-500
  },
  dark: {
    applied: '#38BDF8', // Sky-400
    screening: '#60A5FA', // Blue-400
    interviewing: '#FBBF24', // Amber-400
    shortlisted: '#2DD4BF', // Teal-400
    offered: '#34D399', // Emerald-400
    hired: '#4ADE80', // Green-400
    rejected: '#F87171', // Red-400
    withdrawn: '#9CA3AF', // Gray-400
  },
} as const

/**
 * Get pipeline chart colors for current theme
 */
export function getPipelineColors(isDark: boolean = false) {
  return isDark ? PIPELINE_CHART_COLORS.dark : PIPELINE_CHART_COLORS.light
}

/**
 * AI Score Distribution Chart Colors
 */
export const SCORE_CHART_COLORS = {
  light: {
    excellent: '#10B981', // Emerald-500 (90-100)
    great: '#14B8A6', // Teal-500 (80-89)
    good: '#3B82F6', // Blue-500 (70-79)
    moderate: '#F59E0B', // Amber-500 (60-69)
    weak: '#F97316', // Orange-500 (40-59)
    poor: '#EF4444', // Red-500 (0-39)
  },
  dark: {
    excellent: '#34D399', // Emerald-400
    great: '#2DD4BF', // Teal-400
    good: '#60A5FA', // Blue-400
    moderate: '#FBBF24', // Amber-400
    weak: '#FB923C', // Orange-400
    poor: '#F87171', // Red-400
  },
} as const

/**
 * Get score distribution chart colors
 */
export function getScoreChartColors(isDark: boolean = false) {
  return isDark ? SCORE_CHART_COLORS.dark : SCORE_CHART_COLORS.light
}

export default CHART_COLORS
