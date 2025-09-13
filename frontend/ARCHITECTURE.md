# ConvexHire Frontend Architecture

This document outlines the modular architecture of the ConvexHire frontend application, designed for scalability, maintainability, and beginner-friendliness.

## 📁 Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── common/          # Common/shared components
│   ├── layout/          # Layout components (AppShell, Sidebar, etc.)
│   └── ui/              # Base UI components (shadcn/ui)
├── config/              # Application configuration
│   ├── constants.ts     # App-wide constants
│   ├── routes.ts        # Route definitions
│   └── index.ts         # Config exports
├── contexts/            # React contexts
│   └── AuthContext.tsx  # Authentication context
├── hooks/               # Custom React hooks
│   ├── useAuth.ts       # Authentication hook
│   ├── useNavigation.ts # Navigation utilities
│   ├── useLocalStorage.ts # Local storage management
│   └── index.ts         # Hooks exports
├── pages/               # Page components
│   ├── auth/            # Authentication pages
│   ├── candidate/       # Candidate-specific pages
│   ├── recruiter/       # Recruiter-specific pages
│   └── landing/         # Landing page
├── providers/           # Provider components
│   └── AppProviders.tsx # Main app providers
├── routes/              # Routing configuration
│   ├── AppRouter.tsx    # Main router component
│   ├── routeDefinitions.tsx # Route definitions
│   └── index.ts         # Router exports
├── services/            # Business logic services
│   └── auth/            # Authentication services
├── types/               # TypeScript type definitions
│   ├── auth.ts          # Authentication types
│   ├── job.ts           # Job/application types
│   ├── dashboard.ts     # Dashboard types
│   └── index.ts         # Types exports
└── lib/                 # Utility libraries
    └── utils.ts         # Helper functions
```

## 🏗️ Architecture Principles

### 1. **Separation of Concerns**
- **Components**: Pure UI components with minimal business logic
- **Hooks**: Custom hooks for reusable stateful logic
- **Services**: Business logic and API interactions
- **Types**: TypeScript definitions for type safety

### 2. **Modular Design**
- Each feature is self-contained with its own types, services, and components
- Clear boundaries between different parts of the application
- Easy to add, remove, or modify features without affecting others

### 3. **Configuration-Driven**
- Centralized configuration for routes, constants, and settings
- Easy to modify application behavior without touching components
- Environment-specific configurations

### 4. **Type Safety**
- Comprehensive TypeScript coverage
- Domain-specific type definitions
- Clear interfaces between modules

## 🔧 Key Features

### **Lazy Loading**
- All page components are lazy-loaded for better performance
- Reduced initial bundle size
- Faster application startup

### **Centralized Providers**
- All React providers are organized in one place
- Easy to add new providers (themes, notifications, etc.)
- Better testing capabilities

### **Custom Hooks**
- `useAuth`: Authentication state and operations
- `useNavigation`: Navigation utilities
- `useLocalStorage`: Type-safe localStorage management

### **Service Layer**
- Clean separation between UI and business logic
- Easy to mock for testing
- Reusable across different components

## 🚀 Getting Started

### **For Beginners**

1. **Start with Types**: Check `src/types/` to understand the data structures
2. **Explore Components**: Look at `src/components/common/` for reusable UI elements
3. **Understand Routing**: Review `src/routes/` to see how navigation works
4. **Study Services**: Examine `src/services/` to understand business logic

### **For Developers**

1. **Adding a New Page**:
   ```typescript
   // 1. Create the page component in src/pages/
   // 2. Add route definition in src/routes/routeDefinitions.tsx
   // 3. Update route constants in src/config/routes.ts
   ```

2. **Adding a New Service**:
   ```typescript
   // 1. Create service in src/services/[feature]/
   // 2. Define types in src/types/[feature].ts
   // 3. Export from src/services/index.ts
   ```

3. **Adding a New Hook**:
   ```typescript
   // 1. Create hook in src/hooks/
   // 2. Export from src/hooks/index.ts
   // 3. Use in components as needed
   ```

## 📋 Best Practices

### **Component Organization**
- Keep components small and focused
- Use TypeScript interfaces for props
- Prefer composition over inheritance

### **State Management**
- Use React hooks for local state
- Use context for global state
- Keep state as close to where it's used as possible

### **File Naming**
- Use PascalCase for components (`UserProfile.tsx`)
- Use camelCase for utilities (`formatDate.ts`)
- Use kebab-case for pages (`user-profile/`)

### **Import Organization**
```typescript
// 1. React imports
import React from 'react';

// 2. Third-party imports
import { motion } from 'framer-motion';

// 3. Internal imports (absolute paths)
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks';

// 4. Relative imports
import './Component.css';
```

## 🔍 Code Examples

### **Using Custom Hooks**
```typescript
import { useAuth, useNavigation } from '@/hooks';

function MyComponent() {
  const { user, logout } = useAuth();
  const { goToDashboard } = useNavigation();
  
  // Component logic
}
```

### **Service Usage**
```typescript
import { authService } from '@/services';

const handleLogin = async (email: string, password: string) => {
  const result = await authService.login(email, password);
  if (result.success) {
    // Handle success
  }
};
```

### **Type Definitions**
```typescript
import { User, Job } from '@/types';

interface MyComponentProps {
  user: User;
  jobs: Job[];
}
```

## 🧪 Testing Strategy

- **Unit Tests**: Test individual functions and hooks
- **Component Tests**: Test component behavior and rendering
- **Integration Tests**: Test service interactions
- **E2E Tests**: Test complete user workflows

## 📈 Performance Considerations

- **Lazy Loading**: Pages are loaded on demand
- **Code Splitting**: Automatic code splitting with React.lazy
- **Memoization**: Use React.memo for expensive components
- **Bundle Analysis**: Regular bundle size monitoring

## 🔄 Migration Guide

If you're working with the old structure:

1. **Imports**: Update import paths to use the new structure
2. **Types**: Use types from `@/types` instead of `@/lib/types`
3. **Services**: Use services from `@/services` instead of `@/lib/auth`
4. **Hooks**: Use hooks from `@/hooks` for better functionality

## 🤝 Contributing

1. Follow the established patterns
2. Add types for new features
3. Write tests for new functionality
4. Update documentation as needed
5. Keep components small and focused

This architecture ensures the codebase remains maintainable, scalable, and easy to understand for developers of all skill levels.
