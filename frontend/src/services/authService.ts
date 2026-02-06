import type {
  LoginCredentials,
  SignupData,
  AuthResponse,
  OrganizationSignupData,
  OrganizationAuthResponse,
} from '../types'
import { API_CONFIG, GOOGLE_CONFIG } from '../config/constants'

interface TokenResponse {
  access_token: string
  token_type: string
  user: {
    id: string
    google_id?: string
    email: string
    name: string
    picture?: string
    role?: 'candidate' | 'recruiter'
    company_id?: string
    is_active: boolean
    created_at: string
    updated_at: string
  }
}

class AuthService {
  private baseUrl = `${API_CONFIG.baseUrl}/api/v1/auth`

  async initiateGoogleLogin(): Promise<void> {
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    authUrl.searchParams.set('client_id', GOOGLE_CONFIG.clientId)
    authUrl.searchParams.set('redirect_uri', `${API_CONFIG.baseUrl}/api/v1/auth/google/callback`)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('scope', GOOGLE_CONFIG.scope)
    authUrl.searchParams.set('access_type', 'offline')
    authUrl.searchParams.set('prompt', 'consent')

    window.location.href = authUrl.toString()
  }

  async getCurrentUser(): Promise<TokenResponse['user'] | null> {
    try {
      const response = await fetch(`${API_CONFIG.baseUrl}/api/v1/users/me`, {
        credentials: 'include',
      })

      if (response.status === 401) {
        return null
      }

      if (response.ok) {
        return await response.json()
      }

      if (response.status === 403) {
        const orgResponse = await fetch(`${API_CONFIG.baseUrl}/api/v1/organization/me`, {
          credentials: 'include',
        })

        if (orgResponse.status === 401) {
          return null
        }

        if (orgResponse.ok) {
          const orgData = await orgResponse.json()
          return {
            id: orgData.id.toString(),
            name: orgData.name,
            email: orgData.email,
            userType: 'organization',
            role: 'organization',
            organization_id: orgData.id.toString(),
            organization: {
              id: orgData.id.toString(),
              name: orgData.name,
              location_city: orgData.location_city,
              location_country: orgData.location_country,
              website: orgData.website,
              industry: orgData.industry,
            },
            createdAt: orgData.created_at,
            updatedAt: orgData.updated_at,
          } as TokenResponse['user']
        }
      }

      return null
    } catch {
      return null
    }
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await fetch(`${this.baseUrl}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password,
        remember_me: credentials.rememberMe || false,
      }),
    })

    if (response.ok) {
      const data = await response.json()
      return {
        user: data.user,
        token: data.access_token,
      }
    }

    if (response.status === 401) {
      const orgResponse = await fetch(`${this.baseUrl}/organization/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
          remember_me: credentials.rememberMe || false,
        }),
      })

      if (!orgResponse.ok) {
        throw new Error('Invalid email or password')
      }

      const orgData = await orgResponse.json()
      return {
        user: {
          id: orgData.organization.id.toString(),
          name: orgData.organization.name,
          email: orgData.organization.email,
          userType: 'organization',
          role: 'organization',
          organization_id: orgData.organization.id.toString(),
          organization: {
            id: orgData.organization.id.toString(),
            name: orgData.organization.name,
            location_city: orgData.organization.location_city,
            location_country: orgData.organization.location_country,
            website: orgData.organization.website,
            industry: orgData.organization.industry,
          },
          createdAt: orgData.organization.created_at,
          updatedAt: orgData.organization.updated_at,
        },
        token: orgData.access_token,
      }
    }

    throw new Error('Invalid email or password')
  }

  async signup(data: SignupData): Promise<AuthResponse> {
    const response = await fetch(`${this.baseUrl}/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        name: data.name,
        email: data.email,
        password: data.password,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || 'Signup failed')
    }

    const responseData = await response.json()
    return {
      user: responseData.user,
      token: responseData.access_token,
    }
  }

  async organizationSignup(data: OrganizationSignupData): Promise<OrganizationAuthResponse> {
    const response = await fetch(`${this.baseUrl}/organization/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        email: data.email,
        password: data.password,
        name: data.name,
        location_city: data.locationCity,
        location_country: data.locationCountry,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || 'Organization signup failed')
    }

    const responseData = await response.json()
    return {
      organization: responseData.organization,
      token: responseData.access_token,
    }
  }

  async organizationLogin(credentials: LoginCredentials): Promise<OrganizationAuthResponse> {
    const response = await fetch(`${this.baseUrl}/organization/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password,
        remember_me: credentials.rememberMe || false,
      }),
    })

    if (!response.ok) {
      throw new Error('Invalid email or password')
    }

    const data = await response.json()
    return {
      organization: data.organization,
      token: data.access_token,
    }
  }

  async logout(): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/logout`, {
        method: 'POST',
        credentials: 'include',

        headers: {
          'Content-Type': 'application/json',
        },
      })
    } catch {
      // Ignore logout errors
    }
  }

  handleGoogleCallback(): void {
    // Not implemented
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      const user = await this.getCurrentUser()
      return !!user
    } catch {
      return false
    }
  }

  async refreshToken(): Promise<string | null> {
    return null
  }
}

export const authService = new AuthService()
