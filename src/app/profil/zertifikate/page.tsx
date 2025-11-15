import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Award, Download, Calendar, FileText } from 'lucide-react';

// Mock certificates data
const mockCertificates = [
  {
    id: '1',
    title: 'Notfallmedizin: Akutversorgung und Reanimation',
    issuer: 'HaffNet Management GmbH',
    issueDate: '10. Februar 2025',
    eventDate: '10. Februar 2025',
    cmePoints: 10,
    certificateNumber: 'CME-2025-0089',
    type: 'seminar',
    downloadUrl: '#',
  },
  {
    id: '2',
    title: 'Moderne Onkologie: Immuntherapie und personalisierte Medizin',
    issuer: 'HaffNet Management GmbH',
    issueDate: '22. Januar 2025',
    eventDate: '22. Januar 2025',
    cmePoints: 5,
    certificateNumber: 'CME-2025-0034',
    type: 'seminar',
    downloadUrl: '#',
  },
  {
    id: '3',
    title: 'Diabetologie Update 2024',
    issuer: 'HaffNet Management GmbH',
    issueDate: '15. Dezember 2024',
    eventDate: '15. Dezember 2024',
    cmePoints: 6,
    certificateNumber: 'CME-2024-0876',
    type: 'seminar',
    downloadUrl: '#',
  },
  {
    id: '4',
    title: '7. HaffSymposium der Sportmedizin',
    issuer: 'HaffNet Management GmbH',
    issueDate: '5. Juni 2024',
    eventDate: '1-2. Juni 2024',
    cmePoints: 10,
    certificateNumber: 'HAFF-2024-0234',
    type: 'event',
    downloadUrl: '#',
  },
];

export default function CertificatesPage() {
  const totalCMEPoints = mockCertificates.reduce((sum, cert) => sum + cert.cmePoints, 0);

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
            Meine Zertifikate
          </h1>
          <p className="text-lg text-gray-600">
            Übersicht über alle erworbenen CME-Zertifikate
          </p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <Award className="w-8 h-8 opacity-80" />
            </div>
            <div className="text-3xl font-bold mb-1">{totalCMEPoints}</div>
            <div className="text-green-100">CME-Punkte gesamt</div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{mockCertificates.length}</div>
            <div className="text-gray-600">Zertifikate</div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">2025</div>
            <div className="text-gray-600">Aktuelles Jahr</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Alle herunterladen
          </Button>
          <Button variant="outline">
            <FileText className="w-4 h-4 mr-2" />
            Jahresübersicht erstellen
          </Button>
        </div>

        {/* Certificates List */}
        <div className="space-y-4">
          {mockCertificates.map((cert) => (
            <CertificateCard key={cert.id} certificate={cert} />
          ))}
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-2">
            Informationen zu CME-Punkten
          </h3>
          <p className="text-sm text-gray-700 mb-3">
            Als Arzt/Ärztin sind Sie verpflichtet, innerhalb von 5 Jahren mindestens 250 CME-Punkte zu sammeln
            (durchschnittlich 50 Punkte pro Jahr).
          </p>
          <p className="text-sm text-gray-700">
            Ihr aktueller Stand: <span className="font-semibold">{totalCMEPoints} Punkte</span>
          </p>
        </div>
      </div>
    </div>
  );
}

function CertificateCard({ certificate }: { certificate: any }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex flex-col lg:flex-row lg:items-center gap-6">
        {/* Icon */}
        <div className={`w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0 ${
          certificate.type === 'event' ? 'bg-green-100' : 'bg-blue-100'
        }`}>
          <Award className={`w-8 h-8 ${
            certificate.type === 'event' ? 'text-green-600' : 'text-blue-600'
          }`} />
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                certificate.type === 'event'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {certificate.type === 'event' ? 'Veranstaltung' : 'Seminar'}
              </span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                {certificate.cmePoints} CME-Punkte
              </span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {certificate.title}
            </h3>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Ausgestellt von:</span>
              <div className="font-medium text-gray-900">{certificate.issuer}</div>
            </div>
            <div>
              <span className="text-gray-500">Ausstellungsdatum:</span>
              <div className="font-medium text-gray-900">{certificate.issueDate}</div>
            </div>
            <div>
              <span className="text-gray-500">Veranstaltungsdatum:</span>
              <div className="font-medium text-gray-900">{certificate.eventDate}</div>
            </div>
            <div>
              <span className="text-gray-500">Zertifikat-Nr.:</span>
              <div className="font-mono font-medium text-gray-900">{certificate.certificateNumber}</div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 lg:w-48">
          <Button size="sm" className="w-full">
            <Download className="w-4 h-4 mr-2" />
            Herunterladen
          </Button>
          <Button variant="outline" size="sm" className="w-full">
            <FileText className="w-4 h-4 mr-2" />
            Vorschau
          </Button>
        </div>
      </div>
    </div>
  );
}
