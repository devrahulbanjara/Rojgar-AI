/**
 * ConvexHire Premium Color System - Central Export
 *
 * This file exports all color-related constants and utilities.
 * Import from this file for any color-related needs.
 *
 * @example
 * import {
 *   getDepartmentColor,
 *   getStatusColor,
 *   getScoreColor,
 *   getJobLevelColor,
 *   CHART_COLORS,
 *   SOCIAL_COLORS
 * } from '@/constants/colors'
 */

// Department Colors
export {
  DEPARTMENT_COLORS,
  getDepartmentColor,
  getDepartmentBadgeClasses,
  getDepartmentHexColors,
  type DepartmentName,
  type DepartmentColorConfig,
} from './departmentColors'

// Application Status Colors
export {
  STATUS_COLORS,
  getStatusColor,
  getStatusBadgeClasses,
  getStatusLabel,
  getStatusIcon,
  type ApplicationStatus,
  type StatusColorConfig,
} from './statusColors'

// AI Score Colors
export {
  AI_SCORE_COLORS,
  getScoreCategory,
  getScoreColor,
  getScoreBadgeClasses,
  getScoreLabel,
  getScoreIcon,
  getScoreHexColors,
  type ScoreCategory,
  type AIScoreColorConfig,
} from './aiScoreColors'

// Job Level Colors
export {
  JOB_LEVEL_COLORS,
  getJobLevelColor,
  getJobLevelBadgeClasses,
  getJobLevelIcon,
  getJobLevelHexColors,
  type JobLevel,
  type JobLevelColorConfig,
} from './jobLevelColors'

// Chart/Data Visualization Colors
export {
  CHART_COLORS,
  getChartColors,
  getSeriesColors,
  PIPELINE_CHART_COLORS,
  getPipelineColors,
  SCORE_CHART_COLORS,
  getScoreChartColors,
  type ChartColorPalette,
} from './chartColors'

// Social Media Colors
export {
  SOCIAL_COLORS,
  getSocialColor,
  getSocialButtonStyles,
  getInstagramGradient,
  hasGradientBackground,
  type SocialPlatform,
  type SocialColorConfig,
} from './socialColors'
