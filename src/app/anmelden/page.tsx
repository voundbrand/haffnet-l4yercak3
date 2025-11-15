import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail, Lock } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
      <div className="container mx-auto px-4 max-w-md">
        {/* Back to Home */}
        <Link
          href="/"
          className="inline-flex items-center text-green-600 hover:text-green-700 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Zurück zur Startseite
        </Link>

        {/* Login Card */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Anmelden
            </h1>
            <p className="text-gray-600">
              Melden Sie sich in Ihrem Konto an
            </p>
          </div>

          <form className="space-y-6">
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
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
                  placeholder="ihre.email@beispiel.de"
                />
              </div>
            </div>

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
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-green-600 cursor-pointer"
                  style={{ accentColor: '#16a34a' }}
                />
                <span className="ml-2 text-sm text-gray-600">
                  Angemeldet bleiben
                </span>
              </label>
              <Link
                href="/passwort-vergessen"
                className="text-sm text-green-600 hover:text-green-700"
              >
                Passwort vergessen?
              </Link>
            </div>

            {/* Submit Button */}
            <Button type="submit" className="w-full" size="lg">
              Anmelden
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

          {/* Sign Up Link */}
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              Noch kein Konto?
            </p>
            <Button variant="outline" asChild className="w-full">
              <Link href="/registrieren">
                Jetzt registrieren
              </Link>
            </Button>
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>
            Bei Problemen kontaktieren Sie uns:{' '}
            <a href="mailto:support@haffnet.de" className="text-green-600 hover:text-green-700">
              support@haffnet.de
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
