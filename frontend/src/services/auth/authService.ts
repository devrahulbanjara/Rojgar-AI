/**
 * Authentication Service
 * Handles all authentication-related operations
 */

import { User, SignupData } from '@/types';
import { AUTH, DEMO_USERS, API } from '@/config';
import { authStore } from './authStore';

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const authService = {
  /**
   * Login user with email and password
   */
  async login(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    await delay(API.DELAY);

    // Check demo users
    const demoUser = Object.values(DEMO_USERS).find(user => user.email === email);
    if (demoUser && password === AUTH.DEFAULT_PASSWORD) {
      const user: User = {
        id: email,
        email: demoUser.email,
        name: demoUser.name,
        role: email.includes('recruiter') ? 'recruiter' : 'candidate',
        createdAt: new Date(),
      };
      
      authStore.setUser(user);
      return { success: true, user };
    }

    // Check stored users
    const storedUsers = authStore.getStoredUsers();
    const user = storedUsers.find(u => u.email === email && u.password === password);
    
    if (user) {
      const { password: _, ...userWithoutPassword } = user;
      authStore.setUser(userWithoutPassword as User);
      return { success: true, user: userWithoutPassword as User };
    }

    return { success: false, error: 'Invalid email or password' };
  },

  /**
   * Sign up a new user
   */
  async signup(data: SignupData): Promise<{ success: boolean; error?: string }> {
    await delay(API.DELAY);

    const storedUsers = authStore.getStoredUsers();
    
    // Check if user already exists
    if (storedUsers.some(user => user.email === data.email)) {
      return { success: false, error: 'User already exists' };
    }

    // Create new user
    const newUser = {
      id: data.email,
      email: data.email,
      password: data.password,
      name: data.fullName || data.companyName || 'User',
      role: data.role,
      createdAt: new Date(),
    };

    authStore.addStoredUser(newUser);
    return { success: true };
  },

  /**
   * Logout current user
   */
  logout(): void {
    authStore.clearUser();
  },

  /**
   * Switch user role (for demo purposes)
   */
  switchRole(user: User): User {
    const newRole = user.role === 'recruiter' ? 'candidate' : 'recruiter';
    const updatedUser = { ...user, role: newRole };
    authStore.setUser(updatedUser);
    return updatedUser;
  },

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return authStore.getUser();
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return authStore.getUser() !== null;
  },
};
