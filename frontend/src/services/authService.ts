/**
 * Authentication Service
 * API service layer for authentication operations
 * Integrated with FastAPI backend and Google OAuth
 */

import type { LoginCredentials, SignupData, AuthResponse } from '../types';
import { API_CONFIG, GOOGLE_CONFIG } from '../config/constants';

interface TokenResponse {
  access_token: string;
  token_type: string;
  user: {
    id: number;
    google_id: string;
    email: string;
    name: string;
    picture?: string;
    role?: 'candidate' | 'recruiter';
    is_active: boolean;
    created_at: string;
    updated_at: string;
  };
}

class AuthService {
  private baseUrl = `${API_CONFIG.baseUrl}/auth`;

  // Google OAuth Login
  async initiateGoogleLogin(): Promise<void> {
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', GOOGLE_CONFIG.clientId);
    authUrl.searchParams.set('redirect_uri', `${API_CONFIG.baseUrl}/auth/google/callback`);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', GOOGLE_CONFIG.scope);
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');

    window.location.href = authUrl.toString();
  }


  // Select user role after Google authentication
  async selectRole(role: 'candidate' | 'recruiter'): Promise<{ redirect_url: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/select-role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies
        body: JSON.stringify({ role }),
      });

      if (!response.ok) {
        throw new Error(`Failed to select role: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('AuthService.selectRole error:', error);
      throw error;
    }
  }

  // Get current user
  async getCurrentUser(): Promise<TokenResponse['user'] | null> {
    try {
      const response = await fetch(`${API_CONFIG.baseUrl}/users/me`, {
        credentials: 'include', // Include cookies
      });

      if (response.status === 401) {
        // Token is invalid, clear it
        this.logout();
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to get user: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('AuthService.getCurrentUser error:', error);
      return null;
    }
  }

  // Traditional login method
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
          remember_me: credentials.rememberMe || false,
        }),
      });

      if (!response.ok) {
        throw new Error('Invalid email or password');
      }

      const data = await response.json();
      return {
        user: data.user,
        token: data.access_token,
      };
    } catch (error) {
      console.error('AuthService.login error:', error);
      throw error;
    }
  }

  // Traditional signup method
  async signup(data: SignupData): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
          role: data.userType,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Signup failed');
      }

      const responseData = await response.json();
      return {
        user: responseData.user,
        token: responseData.access_token,
      };
    } catch (error) {
      console.error('AuthService.signup error:', error);
      throw error;
    }
  }

  // Logout method
  async logout(): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/logout`, {
        method: 'POST',
        credentials: 'include', // Include cookies
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('AuthService.logout error:', error);
    }
  }

  // Handle Google callback (not needed with cookies)
  handleGoogleCallback(token: string): void {
    // Token is now set via cookie by the backend
    console.log('Google authentication completed');
  }

  // Check if user is authenticated (check if we can get current user)
  async isAuthenticated(): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      return !!user;
    } catch {
      return false;
    }
  }

  // Refresh token method (placeholder for future implementation)
  async refreshToken(): Promise<string | null> {
    // JWT tokens from FastAPI don't typically use refresh tokens
    // This would be implemented if refresh tokens are added to the backend
    return null;
  }
}

// Export singleton instance
export const authService = new AuthService();