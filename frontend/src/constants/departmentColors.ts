export type DepartmentName =
  | 'Engineering'
  | 'Product'
  | 'Design'
  | 'Marketing'
  | 'Data Science'
  | 'Sales'
  | 'HR'
  | 'Finance'
  | 'Operations'
  | 'Legal'

export interface DepartmentColorConfig {
  light: {
    bg: string
    text: string
    border: string
  }
  dark: {
    bg: string
    text: string
    border: string
  }
  hex: {
    bg: string
    text: string
    border: string
  }
}

export const DEPARTMENT_COLORS: Record<DepartmentName, DepartmentColorConfig> = {
  Engineering: {
    light: {
      bg: 'bg-blue-50/80',
      text: 'text-blue-700',
      border: 'border-blue-200',
    },
    dark: {
      bg: 'bg-blue-950/50',
      text: 'text-blue-300',
      border: 'border-blue-800',
    },
    hex: { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
  },
  Product: {
    light: {
      bg: 'bg-emerald-50/80',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
    },
    dark: {
      bg: 'bg-emerald-950/50',
      text: 'text-emerald-300',
      border: 'border-emerald-800',
    },
    hex: { bg: '#ECFDF5', text: '#047857', border: '#A7F3D0' },
  },
  Design: {
    light: {
      bg: 'bg-purple-50/80',
      text: 'text-purple-700',
      border: 'border-purple-200',
    },
    dark: {
      bg: 'bg-purple-950/50',
      text: 'text-purple-300',
      border: 'border-purple-800',
    },
    hex: { bg: '#FAF5FF', text: '#7E22CE', border: '#E9D5FF' },
  },
  Marketing: {
    light: {
      bg: 'bg-orange-50/80',
      text: 'text-orange-700',
      border: 'border-orange-200',
    },
    dark: {
      bg: 'bg-orange-950/50',
      text: 'text-orange-300',
      border: 'border-orange-800',
    },
    hex: { bg: '#FFF7ED', text: '#C2410C', border: '#FED7AA' },
  },
  'Data Science': {
    light: {
      bg: 'bg-cyan-50/80',
      text: 'text-cyan-700',
      border: 'border-cyan-200',
    },
    dark: {
      bg: 'bg-cyan-950/50',
      text: 'text-cyan-300',
      border: 'border-cyan-800',
    },
    hex: { bg: '#ECFEFF', text: '#0E7490', border: '#A5F3FC' },
  },
  Sales: {
    light: {
      bg: 'bg-teal-50/80',
      text: 'text-teal-700',
      border: 'border-teal-200',
    },
    dark: {
      bg: 'bg-teal-950/50',
      text: 'text-teal-300',
      border: 'border-teal-800',
    },
    hex: { bg: '#F0FDFA', text: '#0F766E', border: '#99F6E4' },
  },
  HR: {
    light: {
      bg: 'bg-pink-50/80',
      text: 'text-pink-700',
      border: 'border-pink-200',
    },
    dark: {
      bg: 'bg-pink-950/50',
      text: 'text-pink-300',
      border: 'border-pink-800',
    },
    hex: { bg: '#FDF2F8', text: '#BE185D', border: '#FBCFE8' },
  },
  Finance: {
    light: {
      bg: 'bg-lime-50/80',
      text: 'text-lime-700',
      border: 'border-lime-200',
    },
    dark: {
      bg: 'bg-lime-950/50',
      text: 'text-lime-300',
      border: 'border-lime-800',
    },
    hex: { bg: '#F7FEE7', text: '#4D7C0F', border: '#D9F99D' },
  },
  Operations: {
    light: {
      bg: 'bg-amber-50/80',
      text: 'text-amber-700',
      border: 'border-amber-200',
    },
    dark: {
      bg: 'bg-amber-950/50',
      text: 'text-amber-300',
      border: 'border-amber-800',
    },
    hex: { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' },
  },
  Legal: {
    light: {
      bg: 'bg-gray-50/80',
      text: 'text-gray-700',
      border: 'border-gray-200',
    },
    dark: {
      bg: 'bg-gray-950/50',
      text: 'text-gray-300',
      border: 'border-gray-800',
    },
    hex: { bg: '#F9FAFB', text: '#374151', border: '#E5E7EB' },
  },
} as const

export function getDepartmentColor(department: string): DepartmentColorConfig {
  const normalizedDept = department.trim() as DepartmentName
  return DEPARTMENT_COLORS[normalizedDept] ?? DEPARTMENT_COLORS.Legal
}

export function getDepartmentBadgeClasses(department: string): string {
  const colors = getDepartmentColor(department)
  return `${colors.light.bg} ${colors.light.text} ${colors.light.border} dark:${colors.dark.bg} dark:${colors.dark.text} dark:${colors.dark.border}`
}

export function getDepartmentHexColors(department: string): {
  bg: string
  text: string
  border: string
} {
  return getDepartmentColor(department).hex
}

export default DEPARTMENT_COLORS
