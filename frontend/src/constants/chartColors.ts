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
    series1: '#2563EB',

    series2: '#7C3AED',

    series3: '#059669',

    series4: '#DC2626',

    series5: '#D97706',

    series6: '#DB2777',

    series7: '#0891B2',

    series8: '#65A30D',

    grid: '#E2E8F0',

    axis: '#64748B',
  },
  dark: {
    series1: '#60A5FA',

    series2: '#A78BFA',

    series3: '#34D399',

    series4: '#F87171',

    series5: '#FBBF24',

    series6: '#F472B6',

    series7: '#22D3EE',

    series8: '#A3E635',

    grid: '#334155',

    axis: '#94A3B8',
  },
} as const

export function getChartColors(isDark: boolean = false): ChartColorPalette {
  return isDark ? CHART_COLORS.dark : CHART_COLORS.light
}

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

export const PIPELINE_CHART_COLORS = {
  light: {
    applied: '#0EA5E9',

    screening: '#3B82F6',

    interviewing: '#F59E0B',

    shortlisted: '#14B8A6',

    offered: '#10B981',

    hired: '#22C55E',

    rejected: '#EF4444',

    withdrawn: '#6B7280',
  },
  dark: {
    applied: '#38BDF8',

    screening: '#60A5FA',

    interviewing: '#FBBF24',

    shortlisted: '#2DD4BF',

    offered: '#34D399',

    hired: '#4ADE80',

    rejected: '#F87171',

    withdrawn: '#9CA3AF',
  },
} as const

export function getPipelineColors(isDark: boolean = false) {
  return isDark ? PIPELINE_CHART_COLORS.dark : PIPELINE_CHART_COLORS.light
}

export const SCORE_CHART_COLORS = {
  light: {
    excellent: '#10B981',

    great: '#14B8A6',

    good: '#3B82F6',

    moderate: '#F59E0B',

    weak: '#F97316',

    poor: '#EF4444',
  },
  dark: {
    excellent: '#34D399',

    great: '#2DD4BF',

    good: '#60A5FA',

    moderate: '#FBBF24',

    weak: '#FB923C',

    poor: '#F87171',
  },
} as const

export function getScoreChartColors(isDark: boolean = false) {
  return isDark ? SCORE_CHART_COLORS.dark : SCORE_CHART_COLORS.light
}

export default CHART_COLORS
