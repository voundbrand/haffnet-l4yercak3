import { Button } from '@/components/ui/button';
import {
  User,
  Mail,
  Phone,
  Building2,
  Briefcase,
  MapPin,
  Calendar,
  Award,
  Edit,
  FileText,
  CheckCircle2
} from 'lucide-react';
import Link from 'next/link';

// Mock user data - mirrors CRM Contact and Organization data
const mockUser = {
  // Contact Information
  contact: {
    salutation: 'Herr',
    title: 'Dr.',
    firstName: 'Max',
    lastName: 'Mustermann',
    email: 'max.mustermann@beispiel.de',
    phone: '+49 123 456789',
    mobilePhone: '+49 171 1234567',
    profession: 'Facharzt für Innere Medizin und Kardiologie',
    specialties: ['Kardiologie', 'Innere Medizin'],
    address: {
      street: 'Musterstraße 123',
      city: 'Berlin',
      postalCode: '10115',
      country: 'Deutschland',
    },
    customProperties: {
      dietaryRequirements: 'Vegetarisch',
      newsletterOptIn: true,
      photoConsent: true,
    },
  },

  // Organization Information
  organization: {
    name: 'Universitätsklinikum Berlin',
    type: 'Krankenhaus',
    role: 'Oberarzt',
    department: 'Kardiologie',
    employeeId: 'UK-BER-12345',
    address: {
      street: 'Charité Platz 1',
      city: 'Berlin',
      postalCode: '10117',
      country: 'Deutschland',
    },
  },

  // Statistics
  stats: {
    totalBookings: 12,
    totalCMEPoints: 86,
    upcomingEvents: 2,
    completedCourses: 10,
  },

  // Recent Activity
  recentBookings: [
    {
      id: '1',
      type: 'seminar',
      title: 'Aktuelle Entwicklungen in der Kardiologie',
      date: '15. März 2025',
      status: 'confirmed',
      cmePoints: 8,
    },
    {
      id: '2',
      type: 'event',
      title: '8. HaffSymposium der Sportmedizin',
      date: '31. Mai 2025',
      status: 'confirmed',
      cmePoints: 10,
    },
  ],

  // Certificates
  certificates: [
    {
      id: '1',
      title: 'Notfallmedizin: Akutversorgung',
      issueDate: '10. Februar 2025',
      cmePoints: 10,
      certificateUrl: '#',
    },
    {
      id: '2',
      title: 'Moderne Onkologie',
      issueDate: '22. Januar 2025',
      cmePoints: 5,
      certificateUrl: '#',
    },
  ],
};

export default function ProfilePage() {
  const { contact, organization, stats, recentBookings, certificates } = mockUser;
  const fullName = `${contact.title ? contact.title + ' ' : ''}${contact.firstName} ${contact.lastName}`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Mein Profil
          </h1>
          <p className="text-lg text-gray-600">
            Verwalten Sie Ihre persönlichen Daten und Buchungen
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-2xl font-bold text-green-600">{stats.totalBookings}</div>
            <div className="text-sm text-gray-600">Buchungen</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-2xl font-bold text-green-600">{stats.totalCMEPoints}</div>
            <div className="text-sm text-gray-600">CME-Punkte</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-2xl font-bold text-green-600">{stats.upcomingEvents}</div>
            <div className="text-sm text-gray-600">Kommend</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-2xl font-bold text-green-600">{stats.completedCourses}</div>
            <div className="text-sm text-gray-600">Abgeschlossen</div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Persönliche Daten
                </h2>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/profil/bearbeiten">
                    <Edit className="w-4 h-4 mr-2" />
                    Bearbeiten
                  </Link>
                </Button>
              </div>

              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Name</div>
                    <div className="font-medium text-gray-900">{fullName}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Anrede</div>
                    <div className="font-medium text-gray-900">{contact.salutation}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-gray-700">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500">E-Mail</div>
                    <div className="font-medium">{contact.email}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-gray-700">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500">Telefon</div>
                    <div className="font-medium">{contact.phone}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-gray-700">
                  <Briefcase className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500">Fachrichtung</div>
                    <div className="font-medium">{contact.profession}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-gray-700">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-500">Adresse</div>
                    <div className="font-medium">
                      {contact.address.street}<br />
                      {contact.address.postalCode} {contact.address.city}<br />
                      {contact.address.country}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Organization Information */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Organisation
              </h2>

              <div className="space-y-4">
                <div className="flex items-center gap-3 text-gray-700">
                  <Building2 className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500">Organisation</div>
                    <div className="font-medium text-lg">{organization.name}</div>
                    <div className="text-sm text-gray-600">{organization.type}</div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Position</div>
                    <div className="font-medium text-gray-900">{organization.role}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Abteilung</div>
                    <div className="font-medium text-gray-900">{organization.department}</div>
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-500 mb-1">Mitarbeiter-ID</div>
                  <div className="font-medium text-gray-900">{organization.employeeId}</div>
                </div>

                <div className="flex items-start gap-3 text-gray-700">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-500">Adresse</div>
                    <div className="font-medium">
                      {organization.address.street}<br />
                      {organization.address.postalCode} {organization.address.city}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Bookings */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Aktuelle Buchungen
                </h2>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/profil/buchungen">
                    Alle anzeigen
                  </Link>
                </Button>
              </div>

              <div className="space-y-4">
                {recentBookings.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        booking.type === 'seminar' ? 'bg-blue-100' : 'bg-green-100'
                      }`}>
                        {booking.type === 'seminar' ? (
                          <FileText className="w-5 h-5 text-blue-600" />
                        ) : (
                          <Calendar className="w-5 h-5 text-green-600" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{booking.title}</div>
                        <div className="text-sm text-gray-600">{booking.date}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          <span className="text-xs text-green-600 font-medium">
                            {booking.status === 'confirmed' ? 'Bestätigt' : booking.status}
                          </span>
                          <span className="text-xs text-gray-500">·</span>
                          <Award className="w-4 h-4 text-gray-400" />
                          <span className="text-xs text-gray-600">{booking.cmePoints} Punkte</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                Schnellzugriff
              </h3>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/profil/buchungen">
                    <Calendar className="w-4 h-4 mr-2" />
                    Meine Buchungen
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/profil/zertifikate">
                    <Award className="w-4 h-4 mr-2" />
                    Zertifikate
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/profil/einstellungen">
                    <User className="w-4 h-4 mr-2" />
                    Einstellungen
                  </Link>
                </Button>
              </div>
            </div>

            {/* Recent Certificates */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">
                  Zertifikate
                </h3>
                <Link href="/profil/zertifikate" className="text-sm text-green-600 hover:text-green-700">
                  Alle
                </Link>
              </div>
              <div className="space-y-3">
                {certificates.map((cert) => (
                  <div key={cert.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Award className="w-4 h-4 text-green-600 mt-0.5" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900 leading-tight">
                          {cert.title}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {cert.issueDate} · {cert.cmePoints} Punkte
                        </div>
                        <a
                          href={cert.certificateUrl}
                          className="text-xs text-green-600 hover:text-green-700 mt-1 inline-block"
                        >
                          Download
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Preferences */}
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-3">
                Einstellungen
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Newsletter</span>
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Foto-Erlaubnis</span>
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                </div>
                {contact.customProperties.dietaryRequirements && (
                  <div className="pt-2 border-t border-blue-200">
                    <span className="text-gray-700">Ernährung:</span>
                    <div className="font-medium text-gray-900">
                      {contact.customProperties.dietaryRequirements}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
