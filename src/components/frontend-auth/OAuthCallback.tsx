'use client';

/**
 * OAuth Callback Handler
 *
 * Handles Google OAuth redirect and creates user session.
 * This component should be used in /auth/google/callback route.
 */

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFrontendAuth } from '@/hooks/useFrontendAuth';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export function OAuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { verifyOAuth } = useFrontendAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleOAuth = async () => {
      // Get OAuth data from URL params
      const code = searchParams.get('code');
      const state = searchParams.get('state');

      if (!code) {
        setStatus('error');
        setError('Missing authorization code');
        return;
      }

      try {
        // TODO: Exchange code for Google user info
        // For now, simulate OAuth verification
        // In production, you'd call Google's token endpoint here

        // Mock Google user data (replace with actual Google API call)
        const googleUserData = {
          provider: 'google',
          oauthId: 'google_123456', // Google user ID
          email: 'user@example.com',
          firstName: 'John',
          lastName: 'Doe',
        };

        const result = await verifyOAuth(googleUserData);

        if (result.success) {
          setStatus('success');
          // Redirect to dashboard after short delay
          setTimeout(() => {
            router.push('/dashboard');
          }, 1500);
        } else {
          setStatus('error');
          setError(result.message || 'OAuth verification failed');
        }
      } catch (err) {
        setStatus('error');
        setError('An error occurred during authentication');
        console.error('OAuth error:', err);
      }
    };

    handleOAuth();
  }, [searchParams, verifyOAuth, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-4 max-w-md">
        {status === 'loading' && (
          <>
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <h2 className="text-xl font-semibold">Authenticating...</h2>
            <p className="text-muted-foreground">
              Please wait while we verify your account
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="h-12 w-12 mx-auto text-green-600" />
            <h2 className="text-xl font-semibold">Success!</h2>
            <p className="text-muted-foreground">
              Redirecting to your dashboard...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="h-12 w-12 mx-auto text-destructive" />
            <h2 className="text-xl font-semibold">Authentication Failed</h2>
            <p className="text-muted-foreground">{error}</p>
            <button
              onClick={() => router.push('/')}
              className="text-primary hover:underline"
            >
              Return to home page
            </button>
          </>
        )}
      </div>
    </div>
  );
}
