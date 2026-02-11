import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

import { ROUTES } from '../config/constants'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getDashboardRoute(role: string): string {
  switch (role) {
    case 'recruiter':
      return ROUTES.RECRUITER_DASHBOARD
    case 'candidate':
      return ROUTES.CANDIDATE_DASHBOARD
    case 'organization':
      return ROUTES.ORGANIZATION_DASHBOARD
    default:
      return ROUTES.LOGIN
  }
}

export function validateEmail(email: string): string | null {
  if (!email) {
    return 'Email is required'
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return 'Please enter a valid email address'
  }
  return null
}

export function validatePassword(password: string): string | null {
  if (!password) {
    return 'Password is required'
  }
  if (password.length < 8) {
    return 'Password must be at least 8 characters'
  }
  return null
}

export function validateName(name: string): string | null {
  if (!name) {
    return 'Name is required'
  }
  if (name.trim().length < 2) {
    return 'Name must be at least 2 characters'
  }
  return null
}
