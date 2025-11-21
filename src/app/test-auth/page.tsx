'use client';

/**
 * Authentication Test Page
 *
 * Use this page to test authentication features:
 * - Login
 * - Register
 * - Logout
 * - Session persistence
 * - Protected routes
 */

import { useState } from 'react';
import { useFrontendAuth } from '@/hooks/useFrontendAuth';
import { Button } from '@/components/ui/button';
import { AuthModal } from '@/components/frontend-auth/AuthModal';
import { Card } from '@/components/ui/card';

export default function TestAuthPage() {
  const [showModal, setShowModal] = useState(false);
  const [modalView, setModalView] = useState<'login' | 'register'>('login');
  const { user, isAuthenticated, loading, logout } = useFrontendAuth();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Authentication Test Page</h1>
          <p className="text-muted-foreground">
            Test login, registration, and session management features
          </p>
        </div>

        {/* Status Card */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Status</h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Loading:</span>
              <span className={loading ? 'text-orange-600' : 'text-green-600'}>
                {loading ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Authenticated:</span>
              <span className={isAuthenticated ? 'text-green-600' : 'text-red-600'}>
                {isAuthenticated ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </Card>

        {/* User Info Card */}
        {user && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">User Information</h2>
            <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded text-sm overflow-x-auto">
              {JSON.stringify(user, null, 2)}
            </pre>
          </Card>
        )}

        {/* Actions Card */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => {
                setModalView('login');
                setShowModal(true);
              }}
            >
              Open Login Modal
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setModalView('register');
                setShowModal(true);
              }}
            >
              Open Register Modal
            </Button>
            {isAuthenticated && (
              <Button variant="destructive" onClick={logout}>
                Logout
              </Button>
            )}
          </div>
        </Card>

        {/* Test Results Card */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Test Checklist</h2>
          <div className="space-y-2 text-sm">
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="rounded" />
              <span>User can register with email/password</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="rounded" />
              <span>User can log in with existing credentials</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="rounded" />
              <span>Invalid credentials show error message</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="rounded" />
              <span>Session persists after page refresh</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="rounded" />
              <span>User can log out successfully</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="rounded" />
              <span>Protected routes redirect to login</span>
            </label>
          </div>
        </Card>

        {/* Links Card */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Test Pages</h2>
          <div className="space-y-2">
            <a
              href="/dashboard"
              className="block text-primary hover:underline"
            >
              → /dashboard (Protected Route)
            </a>
            <a
              href="/test-checkout"
              className="block text-primary hover:underline"
            >
              → /test-checkout (Checkout Test)
            </a>
          </div>
        </Card>
      </div>

      <AuthModal
        open={showModal}
        onOpenChange={setShowModal}
        defaultView={modalView}
        onSuccess={() => {
          console.log('Auth success!');
          setShowModal(false);
        }}
      />
    </div>
  );
}
