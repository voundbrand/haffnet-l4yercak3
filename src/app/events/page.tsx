import Link from 'next/link';
import { eventApi } from '@/lib/api-client';
import { getCapacityData, formatCapacityText, getCapacityWarning } from '@/lib/capacity-utils';

export default async function EventsPage() {
  // Fetch all published events
  const response = await eventApi.getEvents({
    status: 'published',
  });

  const events = response.events;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Veranstaltungen
          </h1>
          <p className="text-lg text-gray-600">
            Aktuelle Fortbildungsveranstaltungen der HaffNet Management GmbH
          </p>
        </div>

        {/* Events Grid */}
        {events.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              Derzeit sind keine Veranstaltungen geplant.
            </p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EventCard({ event }: { event: any }) {
  // Use top-level dates if available, otherwise fall back to customProperties
  const startDate = new Date(event.startDate || event.customProperties.startDate);
  const endDate = new Date(event.endDate || event.customProperties.endDate);

  // Get capacity data using utility function
  const capacityData = getCapacityData(event);
  const capacityText = formatCapacityText(event);
  const capacityWarning = getCapacityWarning(event);

  const isRegistrationOpen = event.registrationOpen !== false;

  return (
    <Link
      href={`/events/${event.id}`}
      className="group bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden"
    >
      {/* Event Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 text-white">
        <div className="flex flex-col gap-3">
          {/* Top row: Event type and registration badge */}
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium opacity-90">
              {event.subtype === 'symposium' ? 'Symposium' : 'Veranstaltung'}
            </p>
            <span className={`flex-shrink-0 whitespace-nowrap text-xs px-3 py-1.5 rounded-full font-semibold ${
              isRegistrationOpen
                ? 'bg-green-500 text-white'
                : 'bg-red-500 text-white'
            }`}>
              {isRegistrationOpen ? 'Anmeldung offen' : 'Anmeldung geschlossen'}
            </span>
          </div>
          {/* Title row: Full width for the event name */}
          <h3 className="text-xl font-bold leading-tight group-hover:underline">
            {event.name}
          </h3>
        </div>
      </div>

      {/* Event Details */}
      <div className="p-6">
        {/* Date */}
        <div className="flex items-center text-gray-700 mb-3">
          <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-sm font-medium">
            {formatDateRange(startDate, endDate)}
          </span>
        </div>

        {/* Location */}
        <div className="flex items-center text-gray-700 mb-4">
          <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-sm">
            {event.location || 'Standort wird noch bekanntgegeben'}
          </span>
        </div>

        {/* Description */}
        {event.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-3">
            {event.description}
          </p>
        )}

        {/* Capacity */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center text-gray-600">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>
              {capacityText}
            </span>
          </div>
          {capacityWarning && (
            <span className={`font-medium ${
              capacityData.isFull ? 'text-red-600' : 'text-orange-600'
            }`}>
              {capacityWarning}
            </span>
          )}
        </div>

        {/* CTA */}
        <div className="mt-6">
          <div className="text-green-600 font-semibold group-hover:text-green-700 flex items-center">
            Mehr erfahren
            <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}

function formatDateRange(start: Date, end: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  };

  const startStr = start.toLocaleDateString('de-DE', options);
  const endStr = end.toLocaleDateString('de-DE', options);

  // If same day, show only once
  if (startStr === endStr) {
    return startStr;
  }

  // If same month and year
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${start.getDate()}.–${endStr}`;
  }

  return `${startStr} – ${endStr}`;
}
