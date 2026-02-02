'use client'

export const useAuth = () => {
  return {
    user: {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'candidate',
      picture: null,
    },
    isAuthenticated: true,
    isLoading: false,
    login: async () => {},
    signup: async () => {},
    logout: () => {},
    refetchUser: () => {},
  }
}
