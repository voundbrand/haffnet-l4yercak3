import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CourseCard } from "@/components/course-card"
import { Carousel } from "@/components/carousel"
import { ArrowRight, Award, Users, Calendar } from "lucide-react"
import { eventApi } from "@/lib/api-client"
import { getCapacityData, formatCapacityText, getCapacityWarning } from '@/lib/capacity-utils'

// Mock data for seminars (will be replaced with API data)
const mockSeminars = [
  {
    id: "1",
    title: "Aktuelle Entwicklungen in der Kardiologie",
    date: "15. März 2025",
    time: "09:00 - 17:00 Uhr",
    location: "Berlin",
    cmePoints: 8,
    instructor: "Prof. Dr. med. Schmidt",
    price: 450,
    format: "Präsenz",
    specialty: "Kardiologie",
  },
  {
    id: "2",
    title: "Moderne Onkologie: Immuntherapie und personalisierte Medizin",
    date: "22. März 2025",
    time: "14:00 - 18:00 Uhr",
    location: "Online",
    cmePoints: 5,
    instructor: "Dr. med. Weber",
    price: 280,
    format: "Online",
    specialty: "Onkologie",
  },
  {
    id: "3",
    title: "Notfallmedizin: Akutversorgung und Reanimation",
    date: "5. April 2025",
    time: "08:00 - 16:00 Uhr",
    location: "München",
    cmePoints: 10,
    instructor: "Prof. Dr. med. Müller",
    price: 520,
    format: "Präsenz",
    specialty: "Notfallmedizin",
  },
  {
    id: "4",
    title: "Diabetologie Update 2025",
    date: "12. April 2025",
    time: "13:00 - 17:00 Uhr",
    location: "Hamburg",
    cmePoints: 6,
    instructor: "Dr. med. Fischer",
    price: 320,
    format: "Hybrid",
    specialty: "Diabetologie",
  },
  {
    id: "5",
    title: "Psychiatrische Notfälle in der Praxis",
    date: "18. April 2025",
    time: "09:00 - 15:00 Uhr",
    location: "Online",
    cmePoints: 7,
    instructor: "Prof. Dr. med. Becker",
    price: 380,
    format: "Online",
    specialty: "Psychiatrie",
  },
  {
    id: "6",
    title: "Geriatrie: Multimorbidität im Alter",
    date: "25. April 2025",
    time: "10:00 - 16:00 Uhr",
    location: "Frankfurt",
    cmePoints: 8,
    instructor: "Dr. med. Hoffmann",
    price: 420,
    format: "Präsenz",
    specialty: "Geriatrie",
  },
]

export default async function HomePage() {
  // Fetch events from API
  const eventsResponse = await eventApi.getEvents({
    status: 'published',
  })
  const events = eventsResponse.events

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary via-primary to-accent overflow-hidden">
        <div className="absolute inset-0 bg-[url('/medical-professionals-in-modern-conference-room.jpg')] bg-cover bg-center opacity-10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6 text-balance">
              Medizinische Fortbildung
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/90 mb-8 leading-relaxed">
              Erweitern Sie Ihr medizinisches Fachwissen mit zertifizierten CME-Seminaren und Fachveranstaltungen.
              Professionelle Fortbildung für Ärzte in Deutschland.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" variant="secondary" asChild>
                <Link href="/seminare">
                  Seminare durchsuchen
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20"
                asChild
              >
                <Link href="/events">Veranstaltungen ansehen</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-muted border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg">
                <Award className="w-6 h-6 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">500+</div>
                <div className="text-sm text-muted-foreground">CME-Seminare</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">15.000+</div>
                <div className="text-sm text-muted-foreground">Teilnehmer</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">12+</div>
                <div className="text-sm text-muted-foreground">Jahre Erfahrung</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Seminare Section with Carousel */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">Aktuelle Seminare</h2>
              <p className="text-muted-foreground">Zertifizierte CME-Fortbildungen für Ärzte</p>
            </div>
            <Button variant="outline" asChild className="hidden sm:flex">
              <Link href="/seminare">
                Alle Seminare
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </div>

          <Carousel>
            {mockSeminars.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </Carousel>

          <div className="mt-8 text-center sm:hidden">
            <Button variant="outline" asChild className="w-full">
              <Link href="/seminare">
                Alle Seminare ansehen
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Events Section with Carousel */}
      <section className="py-16 bg-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">Kommende Veranstaltungen</h2>
              <p className="text-muted-foreground">Symposien, Kongresse und Fachtagungen</p>
            </div>
            <Button variant="outline" asChild className="hidden sm:flex">
              <Link href="/events">
                Alle Veranstaltungen
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </div>

          {events.length > 0 ? (
            <Carousel>
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </Carousel>
          ) : (
            <div className="text-center py-12 bg-background rounded-lg">
              <p className="text-muted-foreground">
                Derzeit sind keine Veranstaltungen geplant.
              </p>
            </div>
          )}

          <div className="mt-8 text-center sm:hidden">
            <Button variant="outline" asChild className="w-full">
              <Link href="/events">
                Alle Veranstaltungen ansehen
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-secondary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">Bereit für Ihre nächste Fortbildung?</h2>
          <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
            Registrieren Sie sich jetzt und sammeln Sie wertvolle CME-Punkte für Ihre ärztliche Fortbildungspflicht.
          </p>
          <Button size="lg" asChild>
            <Link href="/seminare">
              Jetzt Seminar finden
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}

// Event Card Component (similar to CourseCard but for events)
function EventCard({ event }: { event: any }) {
  const startDate = new Date(event.startDate || event.customProperties?.startDate)
  const endDate = new Date(event.endDate || event.customProperties?.endDate)

  // Get capacity data using utility function
  const capacityData = getCapacityData(event);
  const capacityText = formatCapacityText(event);
  const capacityWarning = getCapacityWarning(event);

  const isRegistrationOpen = event.registrationOpen !== false

  return (
    <Link
      href={`/events/${event.id}`}
      className="group bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden h-full flex flex-col"
    >
      {/* Event Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 text-white">
        <div className="flex flex-col gap-3">
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
          <h3 className="text-xl font-bold leading-tight group-hover:underline">
            {event.name}
          </h3>
        </div>
      </div>

      {/* Event Details */}
      <div className="p-6 flex-1 flex flex-col">
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
          <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-1">
            {event.description}
          </p>
        )}

        {/* Capacity */}
        <div className="flex items-center justify-between text-sm mt-auto pt-4 border-t">
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
        <div className="mt-4">
          <div className="text-green-600 font-semibold group-hover:text-green-700 flex items-center">
            Mehr erfahren
            <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  )
}

function formatDateRange(start: Date, end: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }

  const startStr = start.toLocaleDateString('de-DE', options)
  const endStr = end.toLocaleDateString('de-DE', options)

  if (startStr === endStr) {
    return startStr
  }

  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${start.getDate()}.–${endStr}`
  }

  return `${startStr} – ${endStr}`
}
