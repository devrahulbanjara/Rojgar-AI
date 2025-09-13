# ConvexHire Frontend - Complete Beginner's Guide

Welcome to ConvexHire! This is a modern web application built with React that helps recruiters and job candidates connect. If you're new to React and frontend development, this guide will explain everything you need to know about this codebase.

## 🎯 What is ConvexHire?

ConvexHire is a recruitment platform that serves two types of users:
- **Recruiters**: Companies looking to hire employees
- **Candidates**: People looking for jobs

The application allows recruiters to post jobs, review applications, and manage the hiring process. Candidates can browse jobs, apply for positions, and track their applications.

## 🏗️ How This Application Works (High-Level Overview)

Think of this application like a website with multiple pages:
1. **Landing Page**: The main page that welcomes visitors
2. **Login/Signup Pages**: Where users create accounts or sign in
3. **Dashboard Pages**: Different views for recruiters vs candidates
4. **Feature Pages**: Specific functionality like job listings, applications, etc.

The application uses **React** - a JavaScript library that makes it easy to build interactive web pages by breaking them into reusable components.

## 📁 Project Structure Explained

Let me walk you through every folder and file in this project:

### Root Level Files
- **`package.json`**: This is like a recipe book that tells the computer what ingredients (dependencies) are needed to run this project
- **`vite.config.ts`**: Configuration for Vite (the build tool that compiles our code)
- **`tailwind.config.ts`**: Configuration for Tailwind CSS (a styling framework)
- **`tsconfig.json`**: Configuration for TypeScript (adds type safety to JavaScript)

### 📂 `src/` - The Main Source Code Folder

This is where all the actual code lives. Let's explore each subfolder:

#### 📂 `src/config/` - Application Settings
This folder contains all the configuration and constants for the application.

**`routes.ts`**: Defines all the URLs (routes) in the application
```typescript
export const ROUTES = {
  HOME: '/',                    // The main page
  LOGIN: '/login',              // Login page
  SIGNUP: '/signup',            // Sign up page
  RECRUITER: {
    DASHBOARD: '/recruiter',    // Recruiter's main page
    JOBS: '/recruiter/jobs',    // Recruiter's job listings
    // ... more recruiter pages
  },
  CANDIDATE: {
    DASHBOARD: '/candidate',    // Candidate's main page
    BROWSE: '/candidate/browse', // Browse jobs page
    // ... more candidate pages
  }
}
```

**`constants.ts`**: Contains all the fixed values used throughout the app
- Demo user credentials for testing
- Company size options (1-10 employees, 11-50, etc.)
- Job levels (Intern, Entry, Mid, Senior, etc.)
- Application statuses (Applied, In Review, Hired, etc.)

**`index.ts`**: Exports everything from the config folder so other files can easily import them

#### 📂 `src/types/` - Data Structure Definitions
This folder defines what data looks like in our application using TypeScript.

**`auth.ts`**: Defines user and authentication-related data structures
```typescript
export interface User {
  id: string;           // Unique identifier
  email: string;        // User's email address
  name: string;         // User's full name
  role: 'recruiter' | 'candidate';  // What type of user they are
  avatarUrl?: string;   // Optional profile picture
  createdAt: Date;      // When the account was created
}
```

**`job.ts`**: Defines job and company-related data structures
```typescript
export interface Job {
  id: string;
  title: string;        // Job title like "Senior Frontend Engineer"
  company: Company;     // The company posting the job
  location: string;     // Where the job is located
  salaryRange: {        // How much the job pays
    min: number;
    max: number;
    currency: string;
  };
  requirements: string[]; // What skills are needed
  // ... more job details
}
```

**`dashboard.ts`**: Defines dashboard and analytics data structures

**`index.ts`**: Exports all type definitions

#### 📂 `src/services/` - Business Logic
This folder contains the "brain" of the application - the logic that handles data and operations.

**`auth/authService.ts`**: Handles all authentication operations
- `login()`: Checks if email/password are correct
- `signup()`: Creates new user accounts
- `logout()`: Signs users out
- `switchRole()`: Allows demo users to switch between recruiter/candidate views

**`auth/authStore.ts`**: Manages user data in the browser's local storage
- Saves user information so they stay logged in
- Retrieves saved user data when the app loads

#### 📂 `src/hooks/` - Reusable Logic
Hooks are special functions that let components share logic and state.

**`useAuth.ts`**: Provides authentication functionality to any component that needs it
```typescript
const { user, login, logout } = useAuth();
// Now any component can access the current user and login/logout functions
```

**`useNavigation.ts`**: Provides navigation functions
```typescript
const { goToDashboard, goToLogin } = useNavigation();
// Easy functions to navigate between pages
```

**`useLocalStorage.ts`**: Manages data in the browser's local storage with type safety

#### 📂 `src/contexts/` - Global State Management
Contexts allow data to be shared across the entire application.

**`AuthContext.tsx`**: Manages the global authentication state
- Keeps track of who is currently logged in
- Provides login/logout functions to all components
- Automatically redirects users to the right dashboard based on their role

#### 📂 `src/providers/` - Application Setup
Providers wrap the entire application and set up global functionality.

**`AppProviders.tsx`**: Sets up all the global providers
- React Query (for data fetching)
- Router (for navigation)
- Authentication context
- Toast notifications
- Tooltips

#### 📂 `src/routes/` - Navigation Configuration
This folder defines how the application navigates between pages.

**`routeDefinitions.tsx`**: Defines all the routes with lazy loading
```typescript
// Lazy loading means pages are only loaded when needed
const LandingPage = lazy(() => import('@/pages/landing/LandingPage'));
const Login = lazy(() => import('@/pages/auth/Login'));
```

**`AppRouter.tsx`**: The main router component that handles navigation
- Shows a loading spinner while pages are loading
- Renders the correct page based on the URL

#### 📂 `src/components/` - Reusable UI Elements
Components are like LEGO blocks - small, reusable pieces that build the user interface.

##### 📂 `src/components/ui/` - Basic UI Components
These are the fundamental building blocks (buttons, inputs, cards, etc.) built with shadcn/ui:
- **Button**: Clickable buttons with different styles
- **Input**: Text input fields
- **Card**: Container boxes with borders and shadows
- **Badge**: Small labels for status or categories
- **Dialog**: Pop-up windows
- **Dropdown**: Menus that appear when clicked
- **Toast**: Temporary notification messages
- And many more...

##### 📂 `src/components/common/` - Custom Reusable Components
**`StatCard.tsx`**: Displays statistics with icons and trend indicators
```typescript
<StatCard 
  title="Active Jobs" 
  value="8" 
  change={12}  // 12% increase
  icon={<BriefcaseIcon />} 
/>
```

**`FormField.tsx`**: A reusable form input with label, validation, and icons
```typescript
<FormField
  label="Email"
  type="email"
  value={email}
  onChange={setEmail}
  icon={Mail}
  required
/>
```

**`LoadingSpinner.tsx`**: Shows a spinning loading indicator
**`PageHeader.tsx`**: Standard page header with title and description
**`EmptyState.tsx`**: Shows a message when there's no data to display
**`RoleBadge.tsx`**: Displays user roles (Recruiter/Candidate) as badges

##### 📂 `src/components/layout/` - Layout Components
**`AppShell.tsx`**: The main layout wrapper that includes:
- Top navigation bar
- Sidebar navigation
- Main content area
- Responsive design for mobile/desktop

**`Topbar.tsx`**: The top navigation bar with:
- App logo and branding
- Search bar
- Notification bell
- User profile dropdown with logout option

**`Sidebar.tsx`**: The left navigation menu with:
- Different menu items for recruiters vs candidates
- Active page highlighting
- Collapsible design

**`ProtectedRoute.tsx`**: A security component that:
- Checks if users are logged in
- Redirects to login if not authenticated
- Ensures users can only access pages for their role

#### 📂 `src/pages/` - Full Page Components
Each file represents a complete page in the application.

##### 📂 `src/pages/landing/`
**`LandingPage.tsx`**: The main marketing page with:
- Hero section explaining what ConvexHire does
- Feature highlights
- Call-to-action buttons
- Trust indicators (company stats)

##### 📂 `src/pages/auth/`
**`Login.tsx`**: The login page with:
- Email and password fields
- Demo credentials for testing
- Role detection based on email
- Form validation and error handling

**`Signup.tsx`**: The registration page with:
- Tabs for recruiter vs candidate signup
- Different fields based on user type
- Form validation
- Automatic redirect to login after signup

##### 📂 `src/pages/recruiter/`
**`Dashboard.tsx`**: Recruiter's main dashboard showing:
- Key metrics (active jobs, applicants, interviews)
- Upcoming interviews list
- Recent activity feed

**`Jobs.tsx`**: Job management page for:
- Viewing all posted jobs
- Creating new job postings
- Managing job status

**`Candidates.tsx`**: Candidate management showing:
- All applicants across jobs
- Match scores and explanations
- Application status tracking

**`Interviews.tsx`**: Interview scheduling and management
**`Shortlist.tsx`**: Managing shortlisted candidates
**`FinalSelection.tsx`**: Final hiring decisions
**`CompanyProfile.tsx`**: Company information and settings

##### 📂 `src/pages/candidate/`
**`Dashboard.tsx`**: Candidate's main dashboard showing:
- Application statistics
- Resume quality score
- Improvement tips

**`BrowseJobs.tsx`**: Job search and browsing
**`MyApplications.tsx`**: Track all job applications
**`Profile.tsx`**: Candidate profile management

**`NotFound.tsx`**: 404 error page for invalid URLs

#### 📂 `src/data/` - Sample Data
This folder contains mock data for demonstration purposes.

**`jobs.ts`**: Sample job postings with:
- Job titles, descriptions, requirements
- Company information
- Salary ranges
- Application counts

**`applicants.ts`**: Sample candidate profiles and applications with:
- Candidate information and skills
- Match scores and explanations
- Application statuses
- Interview feedback

**`company.ts`**: Sample company profiles
**`applications.ts`**: Sample application data

#### 📂 `src/lib/` - Utility Functions
**`utils.ts`**: Helper functions used throughout the app:
- `formatDate()`: Formats dates nicely
- `formatSalary()`: Formats salary ranges
- `getInitials()`: Creates initials from names
- `timeAgo()`: Shows "2 hours ago" style timestamps
- `cn()`: Combines CSS classes

**`constants.ts`**: Legacy constants (being replaced by config folder)

## 🚀 How to Run This Application

### Prerequisites
You need these installed on your computer:
- **Node.js** (version 18 or higher) - JavaScript runtime
- **npm** (comes with Node.js) - Package manager

### Installation Steps
1. **Open Terminal/Command Prompt** in the project folder
2. **Install dependencies**: `npm install`
3. **Start development server**: `npm run dev`
4. **Open browser**: Go to `http://localhost:8080`

### Available Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Check code quality

## 🎮 How to Use the Application

### Demo Credentials
The app comes with demo accounts for testing:

**Recruiter Account:**
- Email: `recruiter@convexhire.com`
- Password: `password123`

**Candidate Account:**
- Email: `candidate@convexhire.com`
- Password: `password123`

### User Flow
1. **Visit Landing Page**: See what ConvexHire offers
2. **Login**: Use demo credentials or create new account
3. **Dashboard**: See role-specific dashboard
4. **Navigate**: Use sidebar to access different features
5. **Switch Roles**: Use dropdown menu to switch between recruiter/candidate views

## 🛠️ Key Technologies Explained

### React
- **What it is**: A JavaScript library for building user interfaces
- **Why we use it**: Makes it easy to create interactive, reusable components
- **Key concepts**: Components, props, state, hooks

### TypeScript
- **What it is**: JavaScript with type checking
- **Why we use it**: Catches errors before they happen, makes code more maintainable
- **Key concepts**: Interfaces, types, type safety

### Vite
- **What it is**: Fast build tool and development server
- **Why we use it**: Quick development, fast builds, modern tooling

### Tailwind CSS
- **What it is**: Utility-first CSS framework
- **Why we use it**: Rapid styling, consistent design, responsive layouts

### React Router
- **What it is**: Navigation library for React
- **Why we use it**: Handles page routing, URL management, navigation

### Framer Motion
- **What it is**: Animation library for React
- **Why we use it**: Smooth animations, better user experience

### shadcn/ui
- **What it is**: Pre-built component library
- **Why we use it**: Beautiful, accessible components out of the box

## 🔧 Understanding the Code Structure

### Component Structure
Every React component follows this pattern:
```typescript
import React from 'react';
import { SomeComponent } from '@/components/ui/some-component';

interface MyComponentProps {
  title: string;
  onClick: () => void;
}

export function MyComponent({ title, onClick }: MyComponentProps) {
  return (
    <div>
      <h1>{title}</h1>
      <button onClick={onClick}>Click me</button>
    </div>
  );
}
```

### State Management
The app uses React's built-in state management:
- **useState**: For component-level state
- **useContext**: For global state (authentication)
- **Custom hooks**: For reusable stateful logic

### Data Flow
1. **User interacts** with UI (clicks button, fills form)
2. **Component updates** state or calls service function
3. **Service function** processes the request
4. **UI updates** to reflect changes
5. **User sees** the result

### Styling Approach
- **Tailwind CSS**: Utility classes for styling
- **CSS Variables**: For consistent colors and spacing
- **Component variants**: Different styles for different states
- **Responsive design**: Mobile-first approach

## 🎨 Design System

### Color Palette
- **Primary**: Main brand color (blue)
- **Secondary**: Supporting color (gray)
- **Success**: Green for positive actions
- **Destructive**: Red for errors/danger
- **Warning**: Yellow for warnings
- **Muted**: Subtle text and backgrounds

### Typography
- **Headings**: Bold, large text for titles
- **Body**: Regular text for content
- **Muted**: Lighter text for secondary information
- **Code**: Monospace font for technical content

### Spacing
- **Consistent spacing**: 4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px
- **Responsive spacing**: Different spacing for mobile/desktop

### Components
- **Cards**: Rounded corners, subtle shadows
- **Buttons**: Multiple variants (primary, secondary, outline, ghost)
- **Forms**: Consistent styling, validation states
- **Navigation**: Clear hierarchy, active states

## 🔍 Understanding the User Experience

### For Recruiters
1. **Dashboard**: Overview of hiring activities
2. **Jobs**: Manage job postings
3. **Candidates**: Review applicants with AI-powered match scores
4. **Interviews**: Schedule and manage interviews
5. **Company Profile**: Manage company information

### For Candidates
1. **Dashboard**: Track applications and profile strength
2. **Browse Jobs**: Search and filter job opportunities
3. **Applications**: Monitor application status
4. **Profile**: Manage personal information and skills

### Key Features
- **AI-Powered Matching**: Automatic candidate-job matching with scores
- **Transparent Feedback**: Clear explanations for match scores
- **Real-time Updates**: Live status updates for applications
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Role Switching**: Demo users can switch between recruiter/candidate views

## 🚨 Common Issues and Solutions

### Build Errors
- **TypeScript errors**: Check type definitions in `src/types/`
- **Import errors**: Verify import paths use `@/` prefix
- **Missing dependencies**: Run `npm install`

### Runtime Errors
- **Authentication issues**: Check `AuthContext.tsx` and `authService.ts`
- **Navigation problems**: Verify routes in `routeDefinitions.tsx`
- **Styling issues**: Check Tailwind classes and CSS variables

### Development Tips
- **Use browser dev tools**: Inspect elements, check console for errors
- **Hot reload**: Changes appear automatically in development
- **Type checking**: TypeScript will highlight errors in your editor

## 📚 Learning Resources

### React Basics
- [React Official Tutorial](https://react.dev/learn)
- [React Hooks Guide](https://react.dev/reference/react)

### TypeScript
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React + TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)

### Tailwind CSS
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Tailwind UI Components](https://tailwindui.com/)

### Vite
- [Vite Guide](https://vitejs.dev/guide/)

## 🤝 Contributing

### Code Style
- Use TypeScript for all new code
- Follow existing naming conventions
- Add comments for complex logic
- Use meaningful variable and function names

### File Organization
- Keep components small and focused
- Use the established folder structure
- Export components from index files
- Group related functionality together

### Testing
- Test user flows manually
- Check responsive design on different screen sizes
- Verify accessibility features
- Test with different user roles

## 🎯 Next Steps

### For Beginners
1. **Start with the landing page**: Understand the basic structure
2. **Explore the login flow**: See how authentication works
3. **Check the dashboard**: Understand role-based interfaces
4. **Look at components**: See how reusable pieces work together

### For Developers
1. **Read the architecture document**: `ARCHITECTURE.md`
2. **Explore the type definitions**: Understand the data structures
3. **Study the service layer**: See how business logic is organized
4. **Check the routing**: Understand navigation patterns

### For Contributors
1. **Set up development environment**: Follow installation steps
2. **Make small changes**: Start with styling or text updates
3. **Add new features**: Follow existing patterns
4. **Improve documentation**: Help others understand the code

## 📞 Support

If you have questions about this codebase:
1. **Check this README**: Most questions are answered here
2. **Look at the code**: Well-commented code explains itself
3. **Check the architecture document**: `ARCHITECTURE.md` has technical details
4. **Explore the demo**: Use the demo credentials to understand the user experience

---

**Remember**: This is a learning project designed to be educational. Take your time to understand each part, and don't hesitate to experiment with the code. The best way to learn is by doing!

Happy coding! 🚀
