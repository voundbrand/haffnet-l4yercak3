import Link from 'next/link';
import { notFound } from 'next/navigation';
import { eventApi } from '@/lib/api-client';
import { getCapacityData, formatCapacityText, formatSpotsRemainingText, getCapacityWarning } from '@/lib/capacity-utils';
import { EventRegistrationSidebar } from '@/components/EventRegistrationSidebar';

interface EventDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  try {
    // Await params in Next.js 15
    const { id } = await params;

    // Fetch all events and find the matching one (since single event endpoint doesn't exist)
    console.log('Fetching events for ID:', id);
    const response = await eventApi.getEvents({ status: 'published' });
    console.log('API returned:', response.events.length, 'events');
    console.log('Event IDs:', response.events.map(e => e.id));

    const event = response.events.find(e => e.id === id);

    if (!event) {
      console.error('Event not found. Looking for:', id);
      notFound();
    }

    console.log('Found event:', event.name);
    console.log('Event object:', JSON.stringify(event, null, 2));

    // Try to fetch products, but handle if endpoint doesn't exist
    let products: any[] = [];
    try {
      const productsResponse = await eventApi.getEventProducts(id);
      products = productsResponse.products;
    } catch (error) {
      console.log('Products endpoint not available yet');
    }

    // Use top-level dates if available, otherwise fall back to customProperties
    const startDate = new Date(event.startDate || event.customProperties?.startDate || Date.now());
    const endDate = new Date(event.endDate || event.customProperties?.endDate || Date.now());

    // Get capacity data using utility function
    const capacityData = getCapacityData(event);
    const capacityText = formatCapacityText(event);
    const spotsRemainingText = formatSpotsRemainingText(event);
    const capacityWarning = getCapacityWarning(event);

    const isRegistrationOpen = event.registrationOpen !== false;

    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white py-16">
          <div className="container mx-auto px-4 max-w-4xl">
            <Link
              href="/events"
              className="inline-flex items-center text-green-100 hover:text-white mb-6 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Zurück zu Veranstaltungen
            </Link>

            <div className="flex items-start justify-between">
              <div>
                <p className="text-green-100 mb-2">
                  {event.subtype === 'conference' ? 'Symposium' : 'Veranstaltung'}
                </p>
                <h1 className="text-4xl font-bold mb-4">{event.name}</h1>
                {event.description && (
                  <p className="text-xl text-green-50">{event.description}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 max-w-4xl py-12">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="md:col-span-2 space-y-8">
              {/* Event Details */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Veranstaltungsdetails
                </h2>

                <div className="space-y-4">
                  {/* Date & Time */}
                  <div className="flex items-start">
                    <svg className="w-6 h-6 text-green-600 mr-3 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <p className="font-semibold text-gray-900">Datum & Uhrzeit</p>
                      <p className="text-gray-600">
                        {formatDateRange(startDate, endDate)}
                      </p>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="flex items-start">
                    <svg className="w-6 h-6 text-green-600 mr-3 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div>
                      <p className="font-semibold text-gray-900">Veranstaltungsort</p>
                      <p className="text-gray-600">{event.location || 'Standort wird noch bekanntgegeben'}</p>
                    </div>
                  </div>

                  {/* Capacity */}
                  <div className="flex items-start">
                    <svg className="w-6 h-6 text-green-600 mr-3 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <div>
                      <p className="font-semibold text-gray-900">Verfügbare Plätze</p>
                      <p className="text-gray-600">
                        {capacityText}
                      </p>
                      {spotsRemainingText && !capacityData.isFull && (
                        <p className={`font-medium ${
                          capacityData.isUnlimited ? 'text-blue-600' :
                          capacityData.isAlmostFull ? 'text-orange-600' : 'text-green-600'
                        }`}>
                          {spotsRemainingText}
                        </p>
                      )}
                      {capacityData.isFull && (
                        <p className="text-red-600 font-medium">
                          Ausgebucht
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Registration Categories */}
              {products.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    Teilnahmekategorien
                  </h2>

                  <div className="space-y-4">
                    {products.map((product) => (
                      <div
                        key={product.id}
                        className="border border-gray-200 rounded-lg p-4 hover:border-green-300 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-gray-900">
                            {product.customProperties.categoryLabel}
                          </h3>
                          <span className="text-lg font-bold text-green-600">
                            {product.customProperties.price === 0
                              ? 'Kostenlos'
                              : `${(product.customProperties.price / 100).toFixed(2)} €`}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{product.description}</p>

                        {/* Addons */}
                        {product.customProperties.addons.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <p className="text-xs font-medium text-gray-700 mb-2">
                              Zusätzliche Optionen:
                            </p>
                            {product.customProperties.addons.map((addon: any) => {
                              // Debug: log addon structure to see what fields are available
                              console.log('Addon data:', addon);

                              // Try different possible field names for price
                              const price = addon.pricePerPerson ?? addon.price ?? addon.pricePerUnit ?? 0;
                              const formattedPrice = typeof price === 'number'
                                ? (price / 100).toFixed(2)
                                : '0.00';

                              return (
                                <div key={addon.id} className="text-xs text-gray-600">
                                  • {addon.name} (+{formattedPrice} € pro Person)
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="md:col-span-1">
              <EventRegistrationSidebar
                eventId={event.id}
                isRegistrationOpen={isRegistrationOpen}
                isFull={capacityData.isFull}
                capacityWarning={capacityWarning || undefined}
              />
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading event:', error);
    notFound();
  }
}

function formatDateRange(start: Date, end: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  };

  const startStr = start.toLocaleDateString('de-DE', options);
  const endStr = end.toLocaleDateString('de-DE', options);

  // If same day
  if (start.toDateString() === end.toDateString()) {
    return startStr;
  }

  return `${startStr} bis ${endStr}`;
}
