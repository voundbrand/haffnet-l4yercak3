'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail, Lock, User, Building2, Phone, Loader2 } from 'lucide-react';
import { useFrontendAuth } from '@/hooks/useFrontendAuth';
import { userApi } from '@/lib/api-client';

export default function RegisterPage() {
  const router = useRouter();
  const { register, loading } = useFrontendAuth();
  const [formData, setFormData] = useState({
    salutation: '',
    title: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    organization: '',
    profession: '',
    position: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
    newsletter: false,
  });
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.salutation || !formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      setError('Bitte füllen Sie alle Pflichtfelder aus');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwörter stimmen nicht überein');
      return;
    }

    if (formData.password.length < 8) {
      setError('Passwort muss mindestens 8 Zeichen lang sein');
      return;
    }

    if (!formData.acceptTerms) {
      setError('Bitte akzeptieren Sie die AGB und Datenschutzerklärung');
      return;
    }

    try {
      // STEP 1: Create Convex auth user
      console.log('[Registration] Creating Convex auth user...');
      const authResult = await register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone || undefined,
      });

      if (!authResult.success) {
        setError(authResult.message || 'Registrierung fehlgeschlagen');
        return;
      }

      // Get user ID from the auth result
      const convexUserId = authResult.user?._id || '';
      console.log('[Registration] Convex user created:', convexUserId);

      // STEP 2: Create Backend API user profile
      console.log('[Registration] Creating Backend API user profile...');
      const backendResult = await userApi.registerUser({
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone || undefined,
        convexUserId, // Link to Convex user
      });

      if (backendResult.success) {
        // SUCCESS: User created in both systems
        console.log('[Registration] ✅ User created in both systems:', {
          convexUserId,
          frontendUserId: backendResult.frontendUserId,
          crmContactId: backendResult.crmContactId,
        });

        // TODO: Store Backend IDs in Convex user record
        // This would require a Convex mutation to update the user
        // For now, we just log it

        // Redirect to dashboard
        router.push('/dashboard');
      } else {
        // Backend creation failed, but Convex user exists
        console.warn('[Registration] ⚠️ User created in Convex but not in Backend:', {
          convexUserId,
          backendError: backendResult.error,
        });

        // Still let them proceed - they can use the app
        // Backend sync can be retried later
        router.push('/dashboard?warning=backend_sync_pending');
      }

    } catch (error) {
      console.error('[Registration] Error:', error);
      setError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Back to Home */}
        <Link
          href="/"
          className="inline-flex items-center text-green-600 hover:text-green-700 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Zurück zur Startseite
        </Link>

        {/* Register Card */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Registrieren
            </h1>
            <p className="text-gray-600">
              Erstellen Sie Ihr persönliches Konto
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Persönliche Daten
              </h2>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Salutation */}
                <div>
                  <label htmlFor="salutation" className="block text-sm font-medium text-gray-700 mb-2">
                    Anrede *
                  </label>
                  <select
                    id="salutation"
                    name="salutation"
                    required
                    value={formData.salutation}
                    onChange={(e) => handleChange('salutation', e.target.value)}
                    disabled={loading}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Bitte wählen</option>
                    <option value="Herr">Herr</option>
                    <option value="Frau">Frau</option>
                    <option value="Divers">Divers</option>
                  </select>
                </div>

                {/* Title */}
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                    Titel
                  </label>
                  <select
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    disabled={loading}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Kein Titel</option>
                    <option value="Dr.">Dr.</option>
                    <option value="Prof.">Prof.</option>
                    <option value="Prof. Dr.">Prof. Dr.</option>
                  </select>
                </div>

                {/* First Name */}
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                    Vorname *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      required
                      value={formData.firstName}
                      onChange={(e) => handleChange('firstName', e.target.value)}
                      disabled={loading}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="Max"
                    />
                  </div>
                </div>

                {/* Last Name */}
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                    Nachname *
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    required
                    value={formData.lastName}
                    onChange={(e) => handleChange('lastName', e.target.value)}
                    disabled={loading}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Mustermann"
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Kontaktdaten
              </h2>

              <div className="space-y-4">
                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    E-Mail-Adresse *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      disabled={loading}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="ihre.email@beispiel.de"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Telefon
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      disabled={loading}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="+49 123 456789"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Professional Information */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Berufliche Angaben
              </h2>

              <div className="space-y-4">
                {/* Organization */}
                <div>
                  <label htmlFor="organization" className="block text-sm font-medium text-gray-700 mb-2">
                    Organisation / Klinik
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      id="organization"
                      name="organization"
                      value={formData.organization}
                      onChange={(e) => handleChange('organization', e.target.value)}
                      disabled={loading}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="z.B. Universitätsklinikum Berlin"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {/* Profession */}
                  <div>
                    <label htmlFor="profession" className="block text-sm font-medium text-gray-700 mb-2">
                      Fachrichtung / Beruf
                    </label>
                    <input
                      type="text"
                      id="profession"
                      name="profession"
                      value={formData.profession}
                      onChange={(e) => handleChange('profession', e.target.value)}
                      disabled={loading}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="z.B. Allgemeinmedizin"
                    />
                  </div>

                  {/* Position */}
                  <div>
                    <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-2">
                      Position
                    </label>
                    <input
                      type="text"
                      id="position"
                      name="position"
                      value={formData.position}
                      onChange={(e) => handleChange('position', e.target.value)}
                      disabled={loading}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="z.B. Oberarzt"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Password */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Passwort festlegen
              </h2>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Passwort *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="password"
                      id="password"
                      name="password"
                      required
                      value={formData.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      disabled={loading}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="••••••••"
                      minLength={8}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Mind. 8 Zeichen
                  </p>
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Passwort bestätigen *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      required
                      value={formData.confirmPassword}
                      onChange={(e) => handleChange('confirmPassword', e.target.value)}
                      disabled={loading}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Agreements */}
            <div className="space-y-3 pt-4 border-t border-gray-200">
              <label className="flex items-start cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={formData.acceptTerms}
                  onChange={(e) => handleChange('acceptTerms', e.target.checked)}
                  disabled={loading}
                  className="mt-0.5 mr-3 w-5 h-5 accent-green-600 cursor-pointer flex-shrink-0 disabled:cursor-not-allowed"
                  style={{ accentColor: '#16a34a' }}
                />
                <span className="text-sm text-gray-700">
                  Ich akzeptiere die{' '}
                  <Link href="/agb" target="_blank" className="text-green-600 hover:text-green-700 underline">
                    AGB
                  </Link>{' '}
                  und{' '}
                  <Link href="/datenschutz" target="_blank" className="text-green-600 hover:text-green-700 underline">
                    Datenschutzerklärung
                  </Link>
                  . *
                </span>
              </label>

              <label className="flex items-start cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.newsletter}
                  onChange={(e) => handleChange('newsletter', e.target.checked)}
                  disabled={loading}
                  className="mt-0.5 mr-3 w-5 h-5 accent-green-600 cursor-pointer flex-shrink-0 disabled:cursor-not-allowed"
                  style={{ accentColor: '#16a34a' }}
                />
                <span className="text-sm text-gray-700">
                  Ich möchte den Newsletter erhalten und über Seminare und Veranstaltungen informiert werden.
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Konto wird erstellt...
                </>
              ) : (
                'Konto erstellen'
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">oder</span>
            </div>
          </div>

          {/* Login Link */}
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              Bereits ein Konto?
            </p>
            <Button variant="outline" asChild className="w-full">
              <Link href="/anmelden">
                Jetzt anmelden
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
