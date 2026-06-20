import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';

import './index.css';
import { queryClient } from './lib/query-client';
import { AuthProvider, useAuth } from './features/auth';
import { router } from './routes/router';

// Inner component to dynamically inject auth state into TanStack Router context
const AppRouter = () => {
  const auth = useAuth();
  return <RouterProvider router={router} context={{ auth }} />;
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
