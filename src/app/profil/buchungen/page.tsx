import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, MapPin, Award, FileText, Download, CheckCircle2, Clock } from 'lucide-react';

// Mock bookings data
const mockBookings = [
  {
    id: '1',
    type: 'event',
    status: 'upcoming',
    title: '8. HaffSymposium der Sportmedizin',
    date: '31. Mai - 1. Juni 2025',
    location: 'Ueckermünde',
    category: 'AMEOS Mitarbeiter',
    price: 0,
    cmePoints: 10,
    ticketNumber: 'HAFF-2025-0042',
    hasTicket: true,
  },
  {
    id: '2',
    type: 'seminar',
    status: 'upcoming',
    title: 'Aktuelle Entwicklungen in der Kardiologie',
    date: '15. März 2025',
    location: 'Berlin',
    category: 'CME-Seminar',
    price: 450,
    cmePoints: 8,
    ticketNumber: 'SEM-2025-0128',
    hasTicket: true,
  },
  {
    id: '3',
    type: 'seminar',
    status: 'completed',
    title: 'Notfallmedizin: Akutversorgung und Reanimation',
    date: '10. Februar 2025',
    location: 'München',
    category: 'CME-Seminar',
    price: 520,
    cmePoints: 10,
    ticketNumber: 'SEM-2025-0089',
    hasTicket: true,
    hasCertificate: true,
  },
  {
    id: '4',
    type: 'seminar',
    status: 'completed',
    title: 'Moderne Onkologie: Immuntherapie',
    date: '22. Januar 2025',
    location: 'Online',
    category: 'CME-Seminar',
    price: 280,
    cmePoints: 5,
    ticketNumber: 'SEM-2025-0034',
    hasTicket: true,
    hasCertificate: true,
  },
];

export default function BookingsPage() {
  const upcomingBookings = mockBookings.filter(b => b.status === 'upcoming');
  const completedBookings = mockBookings.filter(b => b.status === 'completed');

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Back Button */}
        <Link
          href="/profil"
          className="inline-flex items-center text-green-600 hover:text-green-700 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Zurück zum Profil
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Meine Buchungen
          </h1>
          <p className="text-lg text-gray-600">
            Übersicht über alle Ihre Seminare und Veranstaltungen
          </p>
        </div>

        {/* Upcoming Bookings */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Clock className="w-6 h-6 text-green-600" />
            Kommende Buchungen ({upcomingBookings.length})
          </h2>

          {upcomingBookings.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                Sie haben derzeit keine kommenden Buchungen
              </p>
              <Button asChild className="mt-4">
                <Link href="/seminare">Seminare durchsuchen</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingBookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          )}
        </div>

        {/* Completed Bookings */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
            Abgeschlossene Buchungen ({completedBookings.length})
          </h2>

          {completedBookings.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                Sie haben noch keine abgeschlossenen Buchungen
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {completedBookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BookingCard({ booking }: { booking: any }) {
  const isUpcoming = booking.status === 'upcoming';

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex flex-col lg:flex-row lg:items-center gap-6">
        {/* Icon */}
        <div className={`w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0 ${
          booking.type === 'event' ? 'bg-green-100' : 'bg-blue-100'
        }`}>
          {booking.type === 'event' ? (
            <Calendar className="w-8 h-8 text-green-600" />
          ) : (
            <FileText className="w-8 h-8 text-blue-600" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  isUpcoming ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {booking.type === 'event' ? 'Veranstaltung' : 'Seminar'}
                </span>
                {isUpcoming && (
                  <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-semibold">
                    Kommend
                  </span>
                )}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {booking.title}
              </h3>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div className="flex items-center gap-2 text-gray-700">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-sm">{booking.date}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span className="text-sm">{booking.location}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Award className="w-4 h-4 text-gray-400" />
              <span className="text-sm">{booking.cmePoints} CME-Punkte</span>
            </div>
            <div className="text-sm text-gray-700">
              Ticket: <span className="font-mono font-medium">{booking.ticketNumber}</span>
            </div>
          </div>

          {booking.price > 0 && (
            <div className="text-sm text-gray-600 mb-4">
              Preis: <span className="font-semibold">{booking.price.toFixed(2)} €</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 lg:w-48">
          {booking.hasTicket && (
            <Button variant="outline" size="sm" className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Ticket
            </Button>
          )}
          {booking.hasCertificate && (
            <Button variant="outline" size="sm" className="w-full">
              <Award className="w-4 h-4 mr-2" />
              Zertifikat
            </Button>
          )}
          {isUpcoming && (
            <Button size="sm" className="w-full">
              Details
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
