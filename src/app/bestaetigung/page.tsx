'use client';

import { use, useState, useEffect } from 'react';
import { notFound } from "next/navigation";
import Link from "next/link";
import { transactionApi, ticketApi, type Transaction, type Ticket } from '@/lib/api-client';

interface ConfirmationPageProps {
  searchParams: Promise<{ transaction?: string; ticket?: string }>;
}

/**
 * Confirmation Page
 * Displays ticket and transaction details after successful registration
 */
export default function ConfirmationPage({ searchParams }: ConfirmationPageProps) {
  const { transaction: transactionId, ticket: ticketId } = use(searchParams);

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        if (transactionId) {
          // Fetch transaction and its ticket
          const [transactionRes, ticketRes] = await Promise.all([
            transactionApi.getTransaction(transactionId),
            transactionApi.getTicketByTransaction(transactionId),
          ]);

          setTransaction(transactionRes.data);
          setTicket(ticketRes.data);
        } else if (ticketId) {
          // Fetch ticket only
          const ticketRes = await ticketApi.getTicket(ticketId);
          setTicket(ticketRes.data);
        } else {
          notFound();
        }
      } catch (err) {
        console.error('Error loading confirmation data:', err);
        setError('Fehler beim Laden der Buchungsdetails');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [transactionId, ticketId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Lädt Ihre Buchungsdetails...</p>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Fehler</h1>
          <p className="text-gray-600 mb-6">{error || 'Buchung nicht gefunden'}</p>
          <Link href="/events" className="text-green-600 hover:text-green-700 font-medium">
            Zurück zu Veranstaltungen
          </Link>
        </div>
      </div>
    );
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('de-DE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatPrice = (cents: number) => {
    return (cents / 100).toFixed(2);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Success Header */}
        <div className="text-center mb-8 space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100">
            <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Anmeldung erfolgreich!
            </h1>
            <p className="text-lg text-gray-600">
              Vielen Dank für Ihre Anmeldung. Eine Bestätigungs-E-Mail wurde an{' '}
              <span className="font-medium text-gray-900">{ticket.customProperties.holderEmail}</span> gesendet.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Ticket Details */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
              <h2 className="text-xl font-bold text-gray-900">Ihr Ticket</h2>
            </div>

            <div className="space-y-3">
              <div>
                <div className="text-sm text-gray-600">Ticket-Nummer</div>
                <div className="font-mono text-lg font-semibold text-gray-900">
                  {ticket.customProperties.ticketNumber}
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-600">Teilnehmer</div>
                <div className="font-medium text-gray-900">
                  {ticket.customProperties.title && `${ticket.customProperties.title} `}
                  {ticket.customProperties.holderName}
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-600">Kategorie</div>
                <div className="font-medium text-gray-900">
                  {ticket.customProperties.categoryLabel}
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-600">Status</div>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  Bestätigt
                </span>
              </div>
            </div>
          </div>

          {/* Event Details */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h2 className="text-xl font-bold text-gray-900">Veranstaltung</h2>
            </div>

            <div className="space-y-3">
              <div>
                <div className="text-sm text-gray-600">Name</div>
                <div className="font-medium text-gray-900">
                  {ticket.customProperties.eventName}
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-600">Datum</div>
                <div className="font-medium text-gray-900">
                  {formatDate(ticket.customProperties.eventDate)}
                </div>
              </div>

              {transaction?.customProperties.eventLocation && (
                <div>
                  <div className="text-sm text-gray-600">Ort</div>
                  <div className="font-medium text-gray-900">
                    {transaction.customProperties.eventLocation}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* QR Code */}
        {ticket.customProperties.qrCode && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">
              Ihr QR-Code für den Check-in
            </h2>
            <div className="flex justify-center">
              <img
                src={ticket.customProperties.qrCode}
                alt="Ticket QR Code"
                className="w-64 h-64 border-4 border-gray-200 rounded-lg"
              />
            </div>
            <p className="text-sm text-gray-600 text-center mt-4">
              Bitte zeigen Sie diesen QR-Code beim Check-in vor
            </p>
          </div>
        )}

        {/* Pricing Details */}
        {transaction && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-xl font-bold text-gray-900">Zahlungsdetails</h2>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">{transaction.customProperties.productName}</span>
                <span className="font-medium">
                  {formatPrice(transaction.customProperties.amountInCents)} €
                </span>
              </div>

              {ticket.customProperties.ucraParticipants && ticket.customProperties.ucraParticipants > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">
                    UCRA Abendveranstaltung ({ticket.customProperties.ucraParticipants}x)
                  </span>
                  <span className="font-medium">
                    {formatPrice(ticket.customProperties.ucraParticipants * 3000)} €
                  </span>
                </div>
              )}

              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">Gesamt</span>
                  <span className="text-2xl font-bold text-green-600">
                    {transaction.customProperties.amountInCents === 0
                      ? 'Kostenlos'
                      : `${formatPrice(transaction.customProperties.amountInCents)} €`}
                  </span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 mt-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Zahlungsmethode:</span>
                  <span className="font-medium text-gray-900">
                    {transaction.customProperties.paymentMethod === 'invoice'
                      ? 'Rechnung'
                      : transaction.customProperties.paymentMethod === 'stripe'
                      ? 'Kreditkarte'
                      : transaction.customProperties.paymentMethod}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm mt-2">
                  <span className="text-gray-600">Status:</span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {transaction.customProperties.paymentStatus === 'paid'
                      ? 'Bezahlt'
                      : transaction.customProperties.paymentStatus === 'awaiting_employer_payment'
                      ? 'Rechnung an Arbeitgeber'
                      : transaction.customProperties.paymentStatus}
                  </span>
                </div>
              </div>

              {transaction.customProperties.employerName && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-900">
                        Rechnung an Arbeitgeber
                      </p>
                      <p className="text-sm text-blue-700 mt-1">
                        Die Rechnung wird an <strong>{transaction.customProperties.employerName}</strong> gestellt.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Logistics Information */}
        {(ticket.customProperties.dietaryRequirements ||
          ticket.customProperties.arrivalTime ||
          ticket.customProperties.activityDay2 ||
          ticket.customProperties.bbqAttendance ||
          ticket.customProperties.accommodationNeeds ||
          ticket.customProperties.specialRequests) && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h2 className="text-xl font-bold text-gray-900">Ihre Angaben</h2>
            </div>

            <div className="space-y-3">
              {ticket.customProperties.dietaryRequirements && (
                <div>
                  <div className="text-sm text-gray-600">Ernährungsanforderungen</div>
                  <div className="font-medium text-gray-900">
                    {ticket.customProperties.dietaryRequirements}
                  </div>
                </div>
              )}

              {ticket.customProperties.arrivalTime && (
                <div>
                  <div className="text-sm text-gray-600">Geplante Anreisezeit</div>
                  <div className="font-medium text-gray-900">
                    {ticket.customProperties.arrivalTime} Uhr
                  </div>
                </div>
              )}

              {ticket.customProperties.activityDay2 && (
                <div>
                  <div className="text-sm text-gray-600">Aktivität am zweiten Tag</div>
                  <div className="font-medium text-gray-900">
                    {ticket.customProperties.activityDay2}
                  </div>
                </div>
              )}

              {ticket.customProperties.bbqAttendance && (
                <div>
                  <div className="text-sm text-gray-600">Grillen & Chillen</div>
                  <div className="inline-flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="font-medium text-gray-900">Teilnahme bestätigt</span>
                  </div>
                </div>
              )}

              {ticket.customProperties.accommodationNeeds && (
                <div>
                  <div className="text-sm text-gray-600">Übernachtungswünsche</div>
                  <div className="font-medium text-gray-900">
                    {ticket.customProperties.accommodationNeeds}
                  </div>
                </div>
              )}

              {ticket.customProperties.specialRequests && (
                <div>
                  <div className="text-sm text-gray-600">Besondere Hinweise</div>
                  <div className="font-medium text-gray-900">
                    {ticket.customProperties.specialRequests}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Next Steps */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Nächste Schritte</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">
                1
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">Bestätigungs-E-Mail prüfen</h3>
                <p className="text-sm text-gray-700">
                  Sie erhalten eine E-Mail mit Ihrem Ticket als PDF-Anhang an{' '}
                  <span className="font-medium">{ticket.customProperties.holderEmail}</span>.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">
                2
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">Ticket speichern</h3>
                <p className="text-sm text-gray-700">
                  Speichern Sie das Ticket-PDF oder machen Sie einen Screenshot des QR-Codes für den Check-in.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">
                3
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">Zur Veranstaltung kommen</h3>
                <p className="text-sm text-gray-700">
                  Zeigen Sie Ihr Ticket beim Check-in vor. Der QR-Code wird gescannt und Sie können direkt starten!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/events"
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 text-center font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Zurück zur Veranstaltungsübersicht
          </Link>
          {transaction && (
            <Link
              href={`/events/${transaction.customProperties.eventId}`}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white text-center font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Veranstaltungsdetails ansehen
            </Link>
          )}
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-blue-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-2">Fragen oder Probleme?</h3>
              <p className="text-sm text-blue-800 mb-3">
                Falls Sie Fragen zu Ihrer Anmeldung haben oder die Bestätigungs-E-Mail nicht erhalten haben, kontaktieren Sie uns bitte:
              </p>
              <div className="space-y-1 text-sm">
                <p className="text-blue-800">
                  <strong>E-Mail:</strong>{' '}
                  <a href="mailto:info@haffnet.de" className="underline hover:text-blue-900">
                    info@haffnet.de
                  </a>
                </p>
                <p className="text-blue-800">
                  <strong>Telefon:</strong> +49 (0) XXX XXXXXXX
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
