import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Award,
  User,
  Euro,
  CheckCircle2,
  Users,
  Video,
  FileText
} from 'lucide-react';

// Mock data - in real app, this would be fetched based on the ID
const mockSeminar = {
  id: "1",
  title: "Aktuelle Entwicklungen in der Kardiologie",
  date: "15. März 2025",
  time: "09:00 - 17:00 Uhr",
  location: "Berlin",
  venue: "Hotel Adlon Kempinski, Unter den Linden 77, 10117 Berlin",
  cmePoints: 8,
  instructor: "Prof. Dr. med. Schmidt",
  instructorBio: "Prof. Dr. med. Schmidt ist Chefarzt der Kardiologie am Universitätsklinikum Berlin und hat über 25 Jahre Erfahrung in der interventionellen Kardiologie.",
  price: 450,
  format: "Präsenz",
  specialty: "Kardiologie",
  maxParticipants: 50,
  currentParticipants: 32,
  description: "Dieses Seminar bietet einen umfassenden Überblick über die neuesten Entwicklungen in der Kardiologie. Sie erhalten praxisrelevante Informationen zu modernen Diagnostik- und Therapieverfahren.",
  learningObjectives: [
    "Aktuelle Leitlinien in der Kardiologie verstehen und anwenden",
    "Neue interventionelle Verfahren kennenlernen",
    "Optimierte Medikationsstrategien bei Herzinsuffizienz",
    "Risikostratifizierung bei koronarer Herzerkrankung",
  ],
  agenda: [
    { time: "09:00 - 09:30", topic: "Registrierung und Begrüßungskaffee" },
    { time: "09:30 - 11:00", topic: "Aktuelle Leitlinien in der Kardiologie" },
    { time: "11:00 - 11:15", topic: "Kaffeepause" },
    { time: "11:15 - 12:45", topic: "Interventionelle Kardiologie - Neue Verfahren" },
    { time: "12:45 - 13:45", topic: "Mittagspause" },
    { time: "13:45 - 15:15", topic: "Medikamentöse Therapie der Herzinsuffizienz" },
    { time: "15:15 - 15:30", topic: "Kaffeepause" },
    { time: "15:30 - 17:00", topic: "Fallbesprechungen und Diskussion" },
  ],
  included: [
    "Seminarunterlagen (digital und gedruckt)",
    "Verpflegung (Kaffeepausen, Mittagessen)",
    "CME-Zertifikat",
    "Zugang zur Online-Bibliothek",
  ],
  targetAudience: "Fachärzte für Innere Medizin, Kardiologie, Allgemeinmedizin",
  requirements: "Approbation als Arzt/Ärztin",
};

interface SeminarDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function SeminarDetailPage({ params }: SeminarDetailPageProps) {
  const { id } = await params;

  // In real app: const seminar = await fetchSeminar(id);
  const seminar = mockSeminar;

  const spotsRemaining = seminar.maxParticipants - seminar.currentParticipants;
  const isAlmostFull = spotsRemaining <= 10;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Back Button */}
        <Link
          href="/seminare"
          className="inline-flex items-center text-green-600 hover:text-green-700 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Zurück zur Übersicht
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Header */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-semibold rounded-full">
                  {seminar.specialty}
                </span>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full">
                  {seminar.format}
                </span>
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                {seminar.title}
              </h1>
              <p className="text-lg text-gray-600">
                {seminar.description}
              </p>
            </div>

            {/* Key Info Grid */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-gray-200">
                <Calendar className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-sm text-gray-500">Datum</div>
                  <div className="font-semibold text-gray-900">{seminar.date}</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-gray-200">
                <Clock className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-sm text-gray-500">Uhrzeit</div>
                  <div className="font-semibold text-gray-900">{seminar.time}</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-gray-200">
                <MapPin className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-sm text-gray-500">Ort</div>
                  <div className="font-semibold text-gray-900">{seminar.location}</div>
                  <div className="text-sm text-gray-600 mt-1">{seminar.venue}</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-gray-200">
                <Award className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-sm text-gray-500">CME-Punkte</div>
                  <div className="font-semibold text-gray-900">{seminar.cmePoints} Punkte</div>
                </div>
              </div>
            </div>

            {/* Learning Objectives */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Lernziele</h2>
              <ul className="space-y-3">
                {seminar.learningObjectives.map((objective, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{objective}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Agenda */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Programm</h2>
              <div className="space-y-4">
                {seminar.agenda.map((item, index) => (
                  <div key={index} className="flex gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                    <div className="text-sm font-semibold text-green-600 w-32 flex-shrink-0">
                      {item.time}
                    </div>
                    <div className="text-gray-700">
                      {item.topic}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Instructor */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Referent</h2>
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {seminar.instructor}
                  </h3>
                  <p className="text-gray-700">
                    {seminar.instructorBio}
                  </p>
                </div>
              </div>
            </div>

            {/* Included */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Leistungen</h2>
              <ul className="space-y-3">
                {seminar.included.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Target Audience */}
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Zielgruppe</h3>
              <p className="text-gray-700">{seminar.targetAudience}</p>

              {seminar.requirements && (
                <>
                  <h3 className="font-semibold text-gray-900 mt-4 mb-2">Voraussetzungen</h3>
                  <p className="text-gray-700">{seminar.requirements}</p>
                </>
              )}
            </div>
          </div>

          {/* Sidebar - Registration Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Euro className="w-5 h-5 text-gray-500" />
                    <span className="text-sm text-gray-500">Teilnahmegebühr</span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900">
                    {seminar.price.toFixed(2)} €
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    zzgl. MwSt.
                  </div>
                </div>

                {/* Availability */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Verfügbarkeit</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {spotsRemaining} von {seminar.maxParticipants} Plätzen
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        isAlmostFull ? 'bg-orange-500' : 'bg-green-600'
                      }`}
                      style={{
                        width: `${(seminar.currentParticipants / seminar.maxParticipants) * 100}%`,
                      }}
                    />
                  </div>
                  {isAlmostFull && (
                    <p className="text-sm text-orange-600 font-medium mt-2">
                      Nur noch wenige Plätze verfügbar!
                    </p>
                  )}
                </div>

                {/* CTA Buttons */}
                <div className="space-y-3 mb-4">
                  <Button size="lg" className="w-full" asChild>
                    <Link href={`/seminare/${seminar.id}/anmelden`}>
                      Als Gast anmelden
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" className="w-full" asChild>
                    <Link href={`/anmelden?redirect=/seminare/${seminar.id}/anmelden`}>
                      Mit Konto anmelden
                    </Link>
                  </Button>
                </div>

                <div className="text-center text-sm text-gray-500 mb-6">
                  Sichere Anmeldung über verschlüsselte Verbindung
                </div>

                <div className="text-center text-xs text-blue-600 mb-6">
                  <Link href="/registrieren" className="hover:underline">
                    Noch kein Konto? Jetzt registrieren
                  </Link>
                </div>

                {/* Quick Info */}
                <div className="space-y-3 pt-6 border-t border-gray-200">
                  <div className="flex items-center gap-3 text-sm">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Max. {seminar.maxParticipants} Teilnehmer</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Award className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">{seminar.cmePoints} CME-Punkte</span>
                  </div>
                  {seminar.format === 'Online' && (
                    <div className="flex items-center gap-3 text-sm">
                      <Video className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Live-Webinar</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-sm">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Inkl. Seminarunterlagen</span>
                  </div>
                </div>

                {/* Contact */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-2">Fragen zum Seminar?</p>
                  <a
                    href="mailto:seminare@haffnet.de"
                    className="text-sm text-green-600 hover:text-green-700 font-medium"
                  >
                    seminare@haffnet.de
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
