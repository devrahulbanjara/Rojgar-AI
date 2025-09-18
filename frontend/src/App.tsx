import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { routes } from './router/routes';
import { queryClient } from './lib/queryClient';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { IS_DEVELOPMENT } from './config/constants';

// Create router with configuration
const router = createBrowserRouter(routes);

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        {IS_DEVELOPMENT && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;