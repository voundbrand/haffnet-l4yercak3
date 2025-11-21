'use client';

/**
 * Protected Route Wrapper
 *
 * Redirects unauthenticated users to login.
 * Shows loading state while verifying session.
 */

import { ReactNode, useEffect, useState } from 'react';
import { useFrontendAuth } from '@/hooks/useFrontendAuth';
import { AuthModal } from './AuthModal';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { isAuthenticated, loading } = useFrontendAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      setShowAuthModal(true);
    }
  }, [loading, isAuthenticated]);

  if (loading) {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold">Authentication Required</h2>
            <p className="text-muted-foreground">
              Please log in to access this page
            </p>
          </div>
        </div>
        <AuthModal
          open={showAuthModal}
          onOpenChange={setShowAuthModal}
          onSuccess={() => setShowAuthModal(false)}
        />
      </>
    );
  }

  return <>{children}</>;
}
