'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, Mail, Phone, Building2 } from 'lucide-react';

interface SeminarRegisterPageProps {
  params: Promise<{
    id: string;
  }>;
}

// Mock seminar data - in real app would fetch based on ID
const mockSeminar = {
  id: '1',
  title: 'Aktuelle Entwicklungen in der Kardiologie',
  date: '15. März 2025',
  time: '09:00 - 17:00 Uhr',
  location: 'Berlin',
  venue: 'Hotel Adlon Kempinski',
  price: 450,
  cmePoints: 8,
};

export default function SeminarRegisterPage({ params }: SeminarRegisterPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [isGuest, setIsGuest] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    // Personal
    salutation: '' as 'Herr' | 'Frau' | 'Divers' | '',
    title: '' as '' | 'Dr.' | 'Prof.' | 'Prof. Dr.',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',

    // Professional
    organization: '',
    profession: '',
    position: '',

    // Special requirements
    dietaryRequirements: '',
    specialRequests: '',

    // Consent
    consentPrivacy: false,
    newsletterSignup: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.consentPrivacy) {
      setError('Bitte akzeptieren Sie die Datenschutzerklärung');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      // In real app: submit to API
      console.log('Submitting seminar registration:', formData);

      // Redirect to confirmation
      router.push(`/seminare/${id}/bestaetigung?guest=${isGuest}`);
    } catch (err: any) {
      setError('Fehler bei der Anmeldung. Bitte versuchen Sie es erneut.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Back Button */}
        <Link
          href={`/seminare/${id}`}
          className="inline-flex items-center text-green-600 hover:text-green-700 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Zurück zum Seminar
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Anmeldung: {mockSeminar.title}
          </h1>
          <p className="text-gray-600">
            Bitte füllen Sie das Formular aus, um sich anzumelden.
          </p>
        </div>

        {/* Guest vs Login Options */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => setIsGuest(true)}
              className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                isGuest
                  ? 'border-green-600 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-center">
                <div className="font-semibold text-gray-900 mb-1">Als Gast anmelden</div>
                <div className="text-sm text-gray-600">Schnelle Anmeldung ohne Konto</div>
              </div>
            </button>
            <button
              onClick={() => router.push(`/anmelden?redirect=/seminare/${id}/anmelden`)}
              className="flex-1 p-4 rounded-lg border-2 border-gray-200 hover:border-gray-300 transition-all"
            >
              <div className="text-center">
                <div className="font-semibold text-gray-900 mb-1">Mit Konto anmelden</div>
                <div className="text-sm text-gray-600">Profil nutzen und Buchungen verwalten</div>
              </div>
            </button>
          </div>
          {isGuest && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                💡 <strong>Tipp:</strong> Mit einem kostenlosen Konto können Sie Ihre Buchungen verwalten und CME-Zertifikate einsehen.{' '}
                <Link href="/registrieren" className="underline hover:text-blue-900">
                  Jetzt registrieren
                </Link>
              </p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Persönliche Daten
            </h2>

            <div className="space-y-4">
              {/* Salutation & Title */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Anrede *
                  </label>
                  <select
                    value={formData.salutation}
                    onChange={(e) => setFormData({ ...formData, salutation: e.target.value as any })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"
                    required
                  >
                    <option value="">Bitte wählen</option>
                    <option value="Herr">Herr</option>
                    <option value="Frau">Frau</option>
                    <option value="Divers">Divers</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Titel
                  </label>
                  <select
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value as any })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"
                  >
                    <option value="">Kein Titel</option>
                    <option value="Dr.">Dr.</option>
                    <option value="Prof.">Prof.</option>
                    <option value="Prof. Dr.">Prof. Dr.</option>
                  </select>
                </div>
              </div>

              {/* Name */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vorname *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nachname *
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-Mail *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
                    required
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefon
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Professional Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Berufliche Angaben
            </h2>

            <div className="space-y-4">
              {/* Organization */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Organisation / Klinik
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.organization}
                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Profession */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fachrichtung / Beruf
                  </label>
                  <input
                    type="text"
                    value={formData.profession}
                    onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
                  />
                </div>

                {/* Position */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Position
                  </label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Special Requirements */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Besondere Anforderungen
            </h2>

            <div className="space-y-4">
              {/* Dietary Requirements */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ernährungsbedürfnisse
                </label>
                <textarea
                  value={formData.dietaryRequirements}
                  onChange={(e) => setFormData({ ...formData, dietaryRequirements: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
                  rows={2}
                  placeholder="z.B. Vegetarisch, Allergien"
                />
              </div>

              {/* Special Requests */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Weitere Hinweise
                </label>
                <textarea
                  value={formData.specialRequests}
                  onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
                  rows={3}
                  placeholder="Weitere Informationen..."
                />
              </div>
            </div>
          </div>

          {/* Consent */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Einwilligungen
            </h2>

            <div className="space-y-3">
              <label className="flex items-start cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.consentPrivacy}
                  onChange={(e) => setFormData({ ...formData, consentPrivacy: e.target.checked })}
                  className="mt-0.5 mr-3 w-5 h-5 accent-green-600 cursor-pointer flex-shrink-0"
                  style={{ accentColor: '#16a34a' }}
                  required
                />
                <span className="text-sm text-gray-700">
                  Ich habe die{' '}
                  <Link href="/datenschutz" target="_blank" className="text-green-600 hover:text-green-700 underline">
                    Datenschutzerklärung
                  </Link>{' '}
                  gelesen und akzeptiere diese. *
                </span>
              </label>

              <label className="flex items-start cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.newsletterSignup}
                  onChange={(e) => setFormData({ ...formData, newsletterSignup: e.target.checked })}
                  className="mt-0.5 mr-3 w-5 h-5 accent-green-600 cursor-pointer flex-shrink-0"
                  style={{ accentColor: '#16a34a' }}
                />
                <span className="text-sm text-gray-700">
                  Ich möchte den Newsletter erhalten und über weitere Seminare informiert werden.
                </span>
              </label>
            </div>
          </div>

          {/* Price Summary */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900">Teilnahmegebühr:</span>
              <span className="text-2xl font-bold text-green-600">
                {mockSeminar.price.toFixed(2)} €
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              zzgl. MwSt. · {mockSeminar.cmePoints} CME-Punkte
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-4">
            <Link
              href={`/seminare/${id}`}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 text-center font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Abbrechen
            </Link>
            <button
              type="submit"
              disabled={submitting || !formData.consentPrivacy}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Wird gesendet...
                </span>
              ) : (
                'Verbindlich anmelden'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
