/**
 * Authentication Store
 * Manages authentication state in localStorage
 */

import { User } from '@/types';
import { AUTH } from '@/config';

interface StoredUser extends User {
  password: string;
}

class AuthStore {
  private readonly STORAGE_KEY = AUTH.STORAGE_KEY;
  private readonly USERS_STORAGE_KEY = 'convexhire_users';

  /**
   * Set current user in localStorage
   */
  setUser(user: User): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
  }

  /**
   * Get current user from localStorage
   */
  getUser(): User | null {
    try {
      const userData = localStorage.getItem(this.STORAGE_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error reading user from localStorage:', error);
      return null;
    }
  }

  /**
   * Clear current user from localStorage
   */
  clearUser(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Add a new user to stored users
   */
  addStoredUser(user: StoredUser): void {
    const users = this.getStoredUsers();
    users.push(user);
    localStorage.setItem(this.USERS_STORAGE_KEY, JSON.stringify(users));
  }

  /**
   * Get all stored users
   */
  getStoredUsers(): StoredUser[] {
    try {
      const usersData = localStorage.getItem(this.USERS_STORAGE_KEY);
      return usersData ? JSON.parse(usersData) : [];
    } catch (error) {
      console.error('Error reading users from localStorage:', error);
      return [];
    }
  }

  /**
   * Clear all stored data
   */
  clearAll(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.USERS_STORAGE_KEY);
  }
}

export const authStore = new AuthStore();
