# React Query Integration Guide

## 🚀 Overview

ConvexHire frontend now uses **TanStack Query (React Query)** for all data fetching operations, providing superior caching, background updates, error handling, and loading states management.

## 📦 What's Included

### 1. **Query Client Setup**
- **Location**: `src/lib/queryClient.ts`
- **Features**: 
  - Optimized defaults for caching and retries
  - Global error handling
  - Development vs production configurations
  - Centralized query key management

### 2. **Query Hooks Structure**
```
src/hooks/queries/
├── useAuthQueries.ts      # Authentication-related queries
├── useDashboardQueries.ts # Dashboard data fetching
└── [future modules]       # Jobs, Applications, Users, etc.
```

### 3. **Enhanced Hook Layer**
- **`useAuth`**: Refactored to use React Query mutations
- **`useDashboard`**: New hook for dashboard data management
- **Backward compatible**: Same API, better internals

## 🔧 Key Features

### **Intelligent Caching**
```typescript
// Data is cached for 5 minutes, garbage collected after 10 minutes
const { data: user } = useCurrentUser(); // Instant if cached
```

### **Automatic Background Updates**
- Stale data refreshed automatically
- Optimistic updates for better UX
- Configurable refresh strategies

### **Error Handling & Retries**
```typescript
// Automatic retries with exponential backoff
// Smart retry logic (no retries for 4xx errors)
const { data, error, isLoading } = useDashboardStats();
```

### **Loading States**
```typescript
// Granular loading states
const { 
  isLoading,           // Initial load
  isFetching,          // Background refresh
  isRefetching,        // Manual refresh
  isPending            // Mutation in progress
} = useLogin();
```

## 📋 Query Key Management

### **Centralized Keys**
```typescript
// Organized, predictable query keys
export const queryKeys = {
  auth: {
    user: ['auth', 'user'],
    profile: (userId: string) => ['auth', 'profile', userId],
  },
  dashboard: {
    stats: (userType: string) => ['dashboard', 'stats', userType],
    activity: (userId: string) => ['dashboard', 'activity', userId],
  },
  // ... more modules
} as const;
```

### **Benefits**
- **Type Safety**: TypeScript autocomplete for query keys
- **Consistency**: Predictable key patterns
- **Invalidation**: Easy cache invalidation
- **Debugging**: Clear key hierarchy

## 🎯 Usage Examples

### **1. Authentication Flow**
```typescript
// Login with automatic cache updates
const { login, isLoading, error } = useAuth();

const handleLogin = async () => {
  try {
    await login({ email, password });
    // User automatically redirected, cache updated
  } catch (error) {
    // Error handled automatically
  }
};
```

### **2. Dashboard Data**
```typescript
// Automatic data fetching with loading states
const { 
  dashboardData, 
  isLoading, 
  error, 
  hasStats 
} = useDashboard();

if (isLoading) return <LoadingSpinner />;
if (error) return <ErrorMessage />;
return <DashboardContent data={dashboardData} />;
```

### **3. Background Data Sync**
```typescript
// Data automatically syncs in background
// User sees cached data immediately, fresh data loads behind the scenes
const { data: stats } = useDashboardStats('recruiter');
```

## 🔄 FastAPI Integration Ready

### **Current State: Mock Data**
```typescript
// hooks/queries/useAuthQueries.ts
const { data } = useQuery({
  queryKey: queryKeys.auth.user,
  queryFn: async () => {
    // TODO: Replace with actual API call
    // return await authService.getCurrentUser();
    
    // Mock implementation for demo
    return mockUser;
  },
});
```

### **Backend Integration Steps**
1. **Update Service Layer**: Uncomment API calls in `authService.ts`
2. **Environment Variables**: Set `VITE_API_BASE_URL`
3. **Query Functions**: Replace mock implementations with real API calls
4. **Error Handling**: Customize error responses per API

### **Example Integration**
```typescript
// Before (Mock)
queryFn: async () => mockUser

// After (Real API)
queryFn: async () => {
  const response = await authService.getCurrentUser();
  return response.data;
}
```

## 🛠️ Development Tools

### **React Query DevTools**
- **Enabled**: Development mode only
- **Access**: Bottom-left corner of app
- **Features**: 
  - Query cache inspection
  - Manual cache invalidation
  - Network request monitoring
  - Performance metrics

### **Cache Debugging**
```typescript
// Manual cache operations (for debugging)
import { queryClient } from '../lib/queryClient';

// Invalidate specific queries
queryClient.invalidateQueries({ queryKey: queryKeys.auth.user });

// Set cache data manually
queryClient.setQueryData(queryKeys.dashboard.stats('recruiter'), newStats);

// Get cached data
const cachedUser = queryClient.getQueryData(queryKeys.auth.user);
```

## 📊 Performance Benefits

### **Before React Query**
- ❌ No caching - every page load refetches data
- ❌ Manual loading states management
- ❌ Inconsistent error handling
- ❌ No background updates
- ❌ Poor user experience during loading

### **After React Query**
- ✅ **Intelligent Caching**: Data cached across components
- ✅ **Instant Loading**: Cached data shows immediately
- ✅ **Background Sync**: Fresh data loads behind the scenes
- ✅ **Automatic Retries**: Failed requests retry intelligently
- ✅ **Optimistic Updates**: UI updates before API confirmation
- ✅ **Better UX**: Smooth, responsive interface

## 🚦 Future Enhancements

### **Ready for Implementation**
- [ ] **Infinite Queries**: For paginated data (job listings, applications)
- [ ] **Mutations**: Create, update, delete operations
- [ ] **Optimistic Updates**: Instant UI feedback
- [ ] **Real-time Sync**: WebSocket integration
- [ ] **Offline Support**: Cache-first strategies

### **Advanced Patterns**
```typescript
// Infinite queries for pagination
const {
  data,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
} = useInfiniteQuery({
  queryKey: queryKeys.jobs.list(filters),
  queryFn: ({ pageParam = 0 }) => fetchJobs(pageParam, filters),
  getNextPageParam: (lastPage) => lastPage.nextCursor,
});

// Optimistic mutations
const updateJobMutation = useMutation({
  mutationFn: updateJob,
  onMutate: async (updatedJob) => {
    // Cancel ongoing queries
    await queryClient.cancelQueries({ queryKey: queryKeys.jobs.detail(jobId) });
    
    // Snapshot current value
    const previousJob = queryClient.getQueryData(queryKeys.jobs.detail(jobId));
    
    // Optimistically update
    queryClient.setQueryData(queryKeys.jobs.detail(jobId), updatedJob);
    
    return { previousJob };
  },
  onError: (err, newJob, context) => {
    // Rollback on error
    queryClient.setQueryData(queryKeys.jobs.detail(jobId), context.previousJob);
  },
  onSettled: () => {
    // Refetch after mutation
    queryClient.invalidateQueries({ queryKey: queryKeys.jobs.detail(jobId) });
  },
});
```

## 🎯 Best Practices

### **1. Query Key Consistency**
```typescript
// ✅ Good - Use centralized keys
const { data } = useQuery({
  queryKey: queryKeys.dashboard.stats(userType),
  queryFn: () => fetchStats(userType),
});

// ❌ Bad - Hardcoded keys
const { data } = useQuery({
  queryKey: ['dashboard', 'stats', userType],
  queryFn: () => fetchStats(userType),
});
```

### **2. Error Boundaries**
```typescript
// ✅ Good - Errors handled at component level
const { data, error } = useQuery(/* ... */);
if (error) return <ErrorMessage error={error} />;

// ✅ Better - Global error boundary catches unhandled errors
<ErrorBoundary>
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
</ErrorBoundary>
```

### **3. Loading States**
```typescript
// ✅ Good - Show different loading states
const { data, isLoading, isFetching } = useQuery(/* ... */);

return (
  <>
    {isFetching && <LoadingIndicator />}
    {isLoading ? <Skeleton /> : <Content data={data} />}
  </>
);
```

## 📚 Resources

- **TanStack Query Docs**: https://tanstack.com/query/latest
- **React Query DevTools**: Built-in development tools
- **Query Key Factories**: Centralized in `src/lib/queryClient.ts`
- **Example Patterns**: See `src/hooks/queries/` directory

The React Query integration provides a robust foundation for data management that will scale with the ConvexHire application as it grows! 🚀
