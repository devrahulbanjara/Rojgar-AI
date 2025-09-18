# ConvexHire Frontend Architecture

## 🏗️ Modular, Scalable, and Maintainable Structure

This document outlines the refactored frontend architecture designed for scalability, maintainability, and easy FastAPI backend integration.

## 📁 Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── common/          # Generic components (ErrorBoundary, LoadingSpinner)
│   ├── forms/           # Form-specific components (FormInput, UserTypeSelector)
│   ├── layout/          # Layout components (AuthLayout, DashboardLayout)
│   └── ui/              # Base UI components (Button, Card, Input, etc.)
├── config/              # Configuration and constants
│   └── constants.ts     # App-wide constants and configuration
├── hooks/               # Custom React hooks
│   ├── useAuth.ts       # Authentication state management
│   └── useForm.ts       # Form state management with validation
├── pages/               # Page components
│   ├── candidate/       # Candidate-specific pages
│   ├── recruiter/       # Recruiter-specific pages
│   ├── LandingPage.tsx  # Home page
│   ├── Login.tsx        # Login page
│   └── Signup.tsx       # Signup page
├── router/              # Routing configuration
│   └── routes.tsx       # Centralized route definitions
├── services/            # API service layer
│   ├── apiService.ts    # Generic API client
│   └── authService.ts   # Authentication API calls
├── types/               # TypeScript type definitions
│   └── index.ts         # Centralized type definitions
├── utils/               # Utility functions
│   ├── helpers.ts       # General helper functions
│   └── validation.ts    # Form validation functions
├── App.tsx              # Main application component
└── main.tsx             # Application entry point
```

## 🔧 Key Features

### 1. **Modular Component Architecture**
- **Reusable Components**: Form inputs, layouts, and UI elements
- **Separation of Concerns**: Each component has a single responsibility
- **Props Interface**: Well-defined TypeScript interfaces for all components

### 2. **Custom Hooks**
- **useAuth**: Manages authentication state and operations
- **useForm**: Handles form state, validation, and submission
- **Scalable**: Easy to add more hooks for different concerns

### 3. **Service Layer (FastAPI Ready)**
- **authService**: Ready for FastAPI authentication endpoints
- **apiService**: Generic HTTP client with error handling
- **Token Management**: Automatic token handling and refresh

### 4. **Type Safety**
- **Comprehensive Types**: Full TypeScript coverage
- **API Response Types**: Ready for backend integration
- **Form Types**: Type-safe form handling

### 5. **Configuration Management**
- **Constants**: Centralized configuration
- **Environment Support**: Development and production configs
- **Route Management**: Centralized route definitions

## 🚀 FastAPI Integration Points

### Authentication Service
The `authService` is ready for FastAPI integration:

```typescript
// Current: Mock implementation
// TODO: Uncomment when FastAPI backend is ready

async login(credentials: LoginCredentials): Promise<AuthResponse> {
  const response = await fetch(`${this.baseUrl}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  // ... error handling and token storage
}
```

### API Configuration
Ready for backend URLs:

```typescript
export const API_CONFIG = {
  baseUrl: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api',
  version: 'v1',
  timeout: 10000,
} as const;
```

### Type Definitions
Backend-ready types:

```typescript
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
}
```

## 📋 Development Guidelines

### Adding New Components
1. Create in appropriate folder (`components/common/`, `components/forms/`, etc.)
2. Define TypeScript interface for props
3. Export from folder's index file (if applicable)
4. Document component purpose and usage

### Adding New Pages
1. Create in `pages/` directory
2. Use appropriate layout component (`AuthLayout`, `DashboardLayout`)
3. Add route to `router/routes.tsx`
4. Follow naming conventions

### Adding New Hooks
1. Create in `hooks/` directory
2. Follow `use[Name]` naming convention
3. Define return type interface in `types/index.ts`
4. Include proper error handling

### Adding New Services
1. Create in `services/` directory
2. Use `apiService` for HTTP requests
3. Define API response types
4. Include error handling and loading states

## 🔒 Authentication Flow

1. **Login/Signup**: User submits credentials
2. **Service Layer**: Makes API call to FastAPI backend
3. **Token Storage**: Stores JWT tokens securely
4. **Route Protection**: Guards protected routes
5. **Auto Refresh**: Handles token refresh automatically

## 🎨 UI/UX Principles

- **Consistent Design**: Reusable UI components
- **Loading States**: Proper loading indicators
- **Error Handling**: Graceful error boundaries
- **Responsive**: Mobile-first design
- **Accessibility**: Proper ARIA labels and semantic HTML

## 🚦 Future Enhancements

### Ready for Implementation:
- [ ] Authentication guards for routes
- [ ] Real-time notifications
- [ ] File upload functionality
- [ ] Advanced form validations
- [ ] Dashboard analytics
- [ ] Search and filtering
- [ ] Pagination components
- [ ] Theme switching
- [ ] Internationalization (i18n)

### Backend Integration Checklist:
- [ ] Update API endpoints in `authService`
- [ ] Enable route authentication guards
- [ ] Add error handling for API failures
- [ ] Implement token refresh logic
- [ ] Add loading states for API calls
- [ ] Set up environment variables for API URLs

## 🛠️ Best Practices Implemented

1. **Single Responsibility**: Each component/hook/service has one clear purpose
2. **DRY Principle**: No code duplication, reusable components
3. **Type Safety**: Full TypeScript coverage
4. **Error Boundaries**: Graceful error handling
5. **Separation of Concerns**: Clear separation between UI, logic, and data
6. **Scalable Architecture**: Easy to add new features and maintain
7. **Documentation**: Well-documented code and architecture

## 📚 Dependencies

### Core:
- React 18+ with TypeScript
- React Router v6 for routing
- Custom hooks for state management

### UI:
- Tailwind CSS for styling
- Framer Motion for animations
- Lucide React for icons

### Ready for:
- FastAPI backend integration
- JWT authentication
- Real-time features
- Advanced state management (Redux/Zustand if needed)

This architecture provides a solid foundation for scaling the ConvexHire application while maintaining code quality and developer experience.
