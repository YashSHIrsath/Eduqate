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

  if (auth.isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="relative flex items-center justify-center">
          <div className="animate-ping absolute inline-flex h-16 w-16 rounded-full bg-brand-500 opacity-75" />
          <div className="relative rounded-full h-12 w-12 bg-brand-600 flex items-center justify-center font-bold text-lg shadow-lg">
            EQ
          </div>
        </div>
        <p className="mt-6 text-slate-400 text-sm tracking-wider uppercase font-semibold animate-pulse">
          Restoring session...
        </p>
      </div>
    );
  }

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
