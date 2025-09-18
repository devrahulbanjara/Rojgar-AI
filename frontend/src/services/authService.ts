/**
 * Authentication Service
 * API service layer for authentication operations
 * Ready for FastAPI backend integration
 */

import type { LoginCredentials, SignupData, AuthResponse } from '../types';
// import { API_CONFIG } from '../config/constants'; // TODO: Enable when backend is ready

class AuthService {
  // private baseUrl = `${API_CONFIG.baseUrl}/${API_CONFIG.version}/auth`; // TODO: Enable when backend is ready

  // Login method - ready for FastAPI integration
  async login(_credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      // TODO: Uncomment and implement when FastAPI backend is ready
      /*
      const response = await fetch(`${this.baseUrl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        throw new Error(`Login failed: ${response.statusText}`);
      }

      const data: ApiResponse<AuthResponse> = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Login failed');
      }

      // Store token in localStorage or secure storage
      if (data.data?.token) {
        localStorage.setItem('auth_token', data.data.token);
        if (data.data.refreshToken) {
          localStorage.setItem('refresh_token', data.data.refreshToken);
        }
      }

      return data.data!;
      */

      // Mock implementation for demo
      throw new Error('FastAPI backend not implemented yet. Please integrate with backend.');
    } catch (error) {
      console.error('AuthService.login error:', error);
      throw error;
    }
  }

  // Signup method - ready for FastAPI integration
  async signup(_data: SignupData): Promise<AuthResponse> {
    try {
      // TODO: Uncomment and implement when FastAPI backend is ready
      /*
      const response = await fetch(`${this.baseUrl}/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Signup failed: ${response.statusText}`);
      }

      const result: ApiResponse<AuthResponse> = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Signup failed');
      }

      // Store token in localStorage or secure storage
      if (result.data?.token) {
        localStorage.setItem('auth_token', result.data.token);
        if (result.data.refreshToken) {
          localStorage.setItem('refresh_token', result.data.refreshToken);
        }
      }

      return result.data!;
      */

      // Mock implementation for demo
      throw new Error('FastAPI backend not implemented yet. Please integrate with backend.');
    } catch (error) {
      console.error('AuthService.signup error:', error);
      throw error;
    }
  }

  // Logout method
  async logout(): Promise<void> {
    try {
      // TODO: Uncomment and implement when FastAPI backend is ready
      /*
      const token = this.getToken();
      if (token) {
        await fetch(`${this.baseUrl}/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }
      */

      // Clear stored tokens
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
    } catch (error) {
      console.error('AuthService.logout error:', error);
      // Continue with logout even if API call fails
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
    }
  }

  // Get current user method
  async getCurrentUser(): Promise<AuthResponse['user'] | null> {
    try {
      const token = this.getToken();
      if (!token) {
        return null;
      }

      // TODO: Uncomment and implement when FastAPI backend is ready
      /*
      const response = await fetch(`${this.baseUrl}/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token is invalid, clear it
          this.logout();
          return null;
        }
        throw new Error(`Failed to get user: ${response.statusText}`);
      }

      const data: ApiResponse<AuthResponse['user']> = await response.json();
      return data.data || null;
      */

      // Mock implementation for demo
      return null;
    } catch (error) {
      console.error('AuthService.getCurrentUser error:', error);
      return null;
    }
  }

  // Refresh token method
  async refreshToken(): Promise<string | null> {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        return null;
      }

      // TODO: Uncomment and implement when FastAPI backend is ready
      /*
      const response = await fetch(`${this.baseUrl}/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        this.logout();
        return null;
      }

      const data: ApiResponse<{ token: string; refresh_token?: string }> = await response.json();
      
      if (data.data?.token) {
        localStorage.setItem('auth_token', data.data.token);
        if (data.data.refresh_token) {
          localStorage.setItem('refresh_token', data.data.refresh_token);
        }
        return data.data.token;
      }
      */

      return null;
    } catch (error) {
      console.error('AuthService.refreshToken error:', error);
      this.logout();
      return null;
    }
  }

  // Get stored token
  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

// Export singleton instance
export const authService = new AuthService();
