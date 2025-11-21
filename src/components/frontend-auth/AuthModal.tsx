'use client';

/**
 * Authentication Modal
 *
 * Combines login and registration forms in a modal dialog.
 * Supports switching between login and register views.
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultView?: 'login' | 'register';
  onSuccess?: () => void;
}

export function AuthModal({
  open,
  onOpenChange,
  defaultView = 'login',
  onSuccess,
}: AuthModalProps) {
  const [view, setView] = useState<'login' | 'register'>(defaultView);

  const handleSuccess = () => {
    onSuccess?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {view === 'login' ? 'Welcome Back' : 'Create Account'}
          </DialogTitle>
          <DialogDescription>
            {view === 'login'
              ? 'Log in to access your tickets and registrations'
              : 'Create an account to register for events and courses'}
          </DialogDescription>
        </DialogHeader>

        {view === 'login' ? (
          <LoginForm
            onSuccess={handleSuccess}
            onSwitchToRegister={() => setView('register')}
          />
        ) : (
          <RegisterForm
            onSuccess={handleSuccess}
            onSwitchToLogin={() => setView('login')}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
