'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useFrontendAuth } from '@/hooks/useFrontendAuth';

interface EventRegistrationSidebarProps {
  eventId: string;
  isRegistrationOpen: boolean;
  isFull: boolean;
  capacityWarning?: string;
}

export function EventRegistrationSidebar({
  eventId,
  isRegistrationOpen,
  isFull,
  capacityWarning,
}: EventRegistrationSidebarProps) {
  const { isAuthenticated, user } = useFrontendAuth();

  return (
    <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Anmeldung</h3>

      {!isRegistrationOpen && !isFull && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-yellow-800">
            Die Anmeldung ist derzeit geschlossen.
          </p>
        </div>
      )}

      {isFull && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-red-800">
            Diese Veranstaltung ist ausgebucht.
          </p>
        </div>
      )}

      {isRegistrationOpen && !isFull && (
        <>
          <p className="text-sm text-gray-600 mb-6">
            Melden Sie sich jetzt an und sichern Sie sich Ihren Platz.
          </p>

          {/* CTA Buttons - Now auth-aware */}
          {isAuthenticated && user ? (
            // User is logged in - show single button to register with account
            <div className="space-y-3 mb-4">
              <Button size="lg" className="w-full" asChild>
                <Link href={`/events/${eventId}/register`}>
                  Jetzt anmelden
                </Link>
              </Button>
              <div className="text-center">
                <p className="text-sm text-green-600 font-medium mb-1">
                  ✓ Angemeldet als {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-gray-500">
                  Ihre Buchung wird mit Ihrem Konto verknüpft
                </p>
              </div>
            </div>
          ) : (
            // User is NOT logged in - show both options
            <div className="space-y-3 mb-4">
              <Button size="lg" className="w-full" asChild>
                <Link href={`/events/${eventId}/register`}>
                  Als Gast anmelden
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="w-full" asChild>
                <Link href={`/anmelden?redirect=/events/${eventId}/register`}>
                  Mit Konto anmelden
                </Link>
              </Button>
            </div>
          )}

          <div className="text-center text-sm text-gray-500 mb-4">
            Sichere Anmeldung über verschlüsselte Verbindung
          </div>

          {!isAuthenticated && (
            <div className="text-center text-xs text-blue-600 mb-4">
              <Link href="/registrieren" className="hover:underline">
                Noch kein Konto? Jetzt registrieren
              </Link>
            </div>
          )}

          {capacityWarning && (
            <p className="text-xs text-center mt-2 text-orange-600">
              {capacityWarning}
            </p>
          )}
        </>
      )}

      {/* Contact */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <p className="text-xs text-gray-500 mb-2">Fragen?</p>
        <a
          href="mailto:info@haffnet.de"
          className="text-sm text-green-600 hover:text-green-700"
        >
          info@haffnet.de
        </a>
      </div>
    </div>
  );
}
