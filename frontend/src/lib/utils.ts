import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import React from "react"
import type { UserType } from '../types';
import { ROUTES, VALIDATION } from '../config/constants';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export function formatDate(
  date: Date | string | number,
  options: Intl.DateTimeFormatOptions = {}
): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    ...options,
  }).format(new Date(date))
}

export function formatCurrency(
  amount: number,
  currency: string = "USD"
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount)
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function generateId(length: number = 8): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let result = ""
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}


export function isEmpty(value: unknown): boolean {
  if (value == null) return true
  if (typeof value === "string") return value.trim() === ""
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === "object") return Object.keys(value).length === 0
  return false
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export function truncate(text: string, length: number, suffix: string = "..."): string {
  if (text.length <= length) return text
  return text.slice(0, length) + suffix
}

export const formatUserName = (name: string): string => {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export const getDashboardRoute = (userType: UserType): string => {
  return userType === 'recruiter'
    ? ROUTES.RECRUITER.DASHBOARD
    : ROUTES.CANDIDATE.DASHBOARD;
};


export const getUserInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};


export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const validateEmail = (email: string): string | undefined => {
  if (!email) {
    return 'Email is required';
  }

  if (!VALIDATION.email.pattern.test(email)) {
    return VALIDATION.email.message;
  }

  return undefined;
};

export const validatePassword = (password: string): string | undefined => {
  if (!password) {
    return 'Password is required';
  }

  if (password.length < VALIDATION.password.minLength) {
    return VALIDATION.password.message;
  }

  return undefined;
};

export const validateName = (name: string): string | undefined => {
  if (!name) {
    return 'Name is required';
  }

  if (name.length < VALIDATION.name.minLength) {
    return VALIDATION.name.message;
  }

  return undefined;
};

export const validateConfirmPassword = (confirmPassword: string, password: string): string | undefined => {
  if (!confirmPassword) {
    return 'Please confirm your password';
  }

  if (confirmPassword !== password) {
    return 'Passwords do not match';
  }

  return undefined;
};

export const validateRequired = (value: string, fieldName: string): string | undefined => {
  if (!value || value.trim() === '') {
    return `${fieldName} is required`;
  }

  return undefined;
};

export const createDynamicImport = <T extends React.ComponentType<unknown>>(
  importFn: () => Promise<{ default: T }>
) => {
  return React.lazy(importFn);
};

export const preloadComponent = (importFn: () => Promise<unknown>) => {
  importFn();
};
