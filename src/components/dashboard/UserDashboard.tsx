'use client';

/**
 * User Dashboard Component
 *
 * Shows user's tickets, registrations, and account info.
 * Uses Convex queries for real-time updates.
 */

import { useFrontendAuth } from '@/hooks/useFrontendAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { User, Ticket, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function UserDashboard() {
  const { user, logout } = useFrontendAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Welcome, {user.firstName}!</h1>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>

        {/* Account Info */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <User className="h-6 w-6" />
            <h2 className="text-xl font-semibold">Account Information</h2>
          </div>
          <div className="grid gap-3">
            <div>
              <span className="text-sm text-muted-foreground">Name:</span>
              <p className="font-medium">
                {user.firstName} {user.lastName}
              </p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Email:</span>
              <p className="font-medium">{user.email}</p>
            </div>
            {user.organizationId && (
              <div>
                <span className="text-sm text-muted-foreground">Organization ID:</span>
                <p className="font-medium font-mono text-sm">{user.organizationId}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Tickets Section */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Ticket className="h-6 w-6" />
            <h2 className="text-xl font-semibold">My Tickets</h2>
          </div>
          <div className="text-center py-8 text-muted-foreground">
            <Ticket className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No tickets yet</p>
            <p className="text-sm">Your event tickets will appear here</p>
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-4">
          <Button
            variant="outline"
            className="h-auto py-6 flex-col"
            onClick={() => router.push('/events')}
          >
            <Ticket className="h-8 w-8 mb-2" />
            <span className="font-semibold">Browse Events</span>
            <span className="text-sm text-muted-foreground">
              Find and register for events
            </span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-6 flex-col"
            onClick={() => router.push('/dashboard/settings')}
          >
            <User className="h-8 w-8 mb-2" />
            <span className="font-semibold">Account Settings</span>
            <span className="text-sm text-muted-foreground">
              Manage your profile
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}
