import Link from 'next/link';
import { CourseCard } from '@/components/course-card';
import { Button } from '@/components/ui/button';
import { Search, SlidersHorizontal } from 'lucide-react';

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
  {
    id: "7",
    title: "Orthopädie: Moderne Gelenkchirurgie",
    date: "3. Mai 2025",
    time: "09:00 - 17:00 Uhr",
    location: "Stuttgart",
    cmePoints: 9,
    instructor: "Prof. Dr. med. Klein",
    price: 480,
    format: "Präsenz",
    specialty: "Orthopädie",
  },
  {
    id: "8",
    title: "Dermatologie: Hautkrebs-Früherkennung",
    date: "10. Mai 2025",
    time: "14:00 - 18:00 Uhr",
    location: "Online",
    cmePoints: 5,
    instructor: "Dr. med. Wagner",
    price: 250,
    format: "Online",
    specialty: "Dermatologie",
  },
  {
    id: "9",
    title: "Pädiatrie: Impfungen und Infektionskrankheiten",
    date: "17. Mai 2025",
    time: "09:00 - 16:00 Uhr",
    location: "Köln",
    cmePoints: 8,
    instructor: "Prof. Dr. med. Richter",
    price: 400,
    format: "Hybrid",
    specialty: "Pädiatrie",
  },
];

export default function SeminarePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            CME-Seminare
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Zertifizierte medizinische Fortbildungen für Ärzte - Sammeln Sie CME-Punkte
          </p>

          {/* Search and Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Seminare durchsuchen..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
              />
            </div>
            <Button variant="outline" className="sm:w-auto">
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>

        {/* Seminars Grid */}
        {mockSeminars.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              Derzeit sind keine Seminare verfügbar.
            </p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {mockSeminars.map((seminar) => (
              <CourseCard key={seminar.id} course={seminar} />
            ))}
          </div>
        )}

        {/* Load More */}
        {mockSeminars.length > 0 && (
          <div className="mt-12 text-center">
            <Button variant="outline" size="lg">
              Weitere Seminare laden
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
