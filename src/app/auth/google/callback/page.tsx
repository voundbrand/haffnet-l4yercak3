import { Suspense } from 'react';
import { OAuthCallback } from '@/components/frontend-auth/OAuthCallback';

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OAuthCallback />
    </Suspense>
  );
}
