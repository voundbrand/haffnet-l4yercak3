# Event System Implementation Plan

## Overview

Build a complete event system for HaffNet that displays events (non-seminar) from the backend and includes the HaffSymposium registration form.

## Architecture

```
Backend (L4yerCak3)
├── Events Collection (already exists)
│   ├── type: "event" (for HaffSymposium, conferences, etc.)
│   └── type: "seminar" (existing CME seminars)
│
├── Form Schema (optional)
│   └── Field definitions for HaffSymposium form
│
└── Workflow Behaviors
    ├── calculate-event-costs
    ├── employer-detection
    ├── contact-creation
    └── email-notification

Frontend (Next.js)
├── /src/app/seminare/[slug] (existing - CME seminars)
│
├── /src/app/events/[slug] (NEW - general events)
│   ├── page.tsx (event detail page)
│   ├── register/page.tsx (registration form)
│   └── components/
│       └── HaffSymposiumForm.tsx
│
└── /src/app/events/page.tsx (NEW - events listing)
```

---

## Phase 1: Backend Setup

### 1.1 Event Data Structure

**Events already exist in backend, ensure this structure:**

```typescript
// Backend event object
{
  _id: "event_haffsymposium_2024",
  type: "event",
  subtype: "symposium", // or "conference", "workshop"

  name: "8. HaffSymposium der Sportmedizin",
  slug: "haffsymposium-2024",
  description: "...",

  eventDetails: {
    startDate: "2024-05-31",
    endDate: "2024-06-01",
    location: "Ueckermünde",
    venue: "Bürgersaal"
  },

  registration: {
    enabled: true,
    formId: "haffsymposium_registration_2024",
    categories: [
      { value: "1", label: "External participant", price: 150 },
      { value: "2", label: "AMEOS employee", price: 0 },
      { value: "3", label: "HaffNet member", price: 100 },
      { value: "4", label: "Speaker", price: 0 },
      { value: "5", label: "Sponsor", price: 0 },
      { value: "6", label: "Orga team", price: 0 }
    ],
    addons: [
      { id: "ucra", name: "UCRA boat trip", price: 30 }
    ]
  },

  workflow: {
    triggerOn: "event_registration_complete",
    workflowId: "wf_haffsymposium_2024"
  }
}
```

### 1.2 Form Schema (Optional)

**Option A: Store in backend for validation**
```typescript
// Backend: Form schema for validation
{
  formId: "haffsymposium_registration_2024",
  eventId: "event_haffsymposium_2024",

  fields: [
    {
      id: "attendee_category",
      type: "radio",
      label: "Anmeldekategorie",
      required: true,
      options: [ /* ... */ ]
    },
    {
      id: "salutation",
      type: "select",
      label: "Anrede",
      required: true,
      options: ["Herr", "Frau", "Divers"]
    },
    // ... all other fields
  ],

  conditionalSections: {
    "external-section": { showWhen: { attendee_category: "1" } },
    "ameos-section": { showWhen: { attendee_category: "2" } },
    // ...
  }
}
```

**Option B: Just use for validation on submit (simpler)**
- Build form in React
- Send submission to backend
- Backend validates required fields

**Recommendation: Option B** - Less complexity, form is custom anyway

### 1.3 Workflow Configuration

```typescript
// Backend workflow for HaffSymposium registrations
{
  triggerOn: "event_registration_complete",
  name: "HaffSymposium Registration Workflow",

  behaviors: [
    {
      type: "event-cost-calculation",
      priority: 100,
      config: {
        basePrices: {
          "1": 150, // External
          "2": 0,   // AMEOS (employer pays)
          "3": 100, // HaffNet member
          "4": 0,   // Speaker
          "5": 0,   // Sponsor
          "6": 0    // Orga team
        },
        addons: {
          "ucra": 30
        }
      }
    },
    {
      type: "employer-detection",
      priority: 90,
      config: {
        employerDomains: ["ameos.de"]
      }
    },
    {
      type: "contact-creation",
      priority: 80,
      config: {
        updateIfExists: true
      }
    },
    {
      type: "invoice-generation",
      priority: 70,
      config: {
        templateId: "haffsymposium_invoice"
      }
    },
    {
      type: "email-notification",
      priority: 60,
      config: {
        template: "haffsymposium_confirmation",
        recipients: ["customer", "admin"]
      }
    }
  ]
}
```

---

## Phase 2: Frontend - Events Listing Page

### 2.1 Events API Route

**File: `/src/app/api/events/route.ts`**

```typescript
// Server-side API route to fetch events from backend
export async function GET() {
  const response = await fetch(`${process.env.BACKEND_API_URL}/api/v1/events`, {
    headers: {
      'Authorization': `Bearer ${process.env.API_KEY}`
    }
  });

  const events = await response.json();

  // Filter to only non-seminar events
  const generalEvents = events.filter(e => e.type === 'event');

  return Response.json(generalEvents);
}
```

### 2.2 Events Listing Page

**File: `/src/app/events/page.tsx`**

```typescript
import Link from 'next/link';

async function getEvents() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/events`, {
    cache: 'no-store'
  });
  return res.json();
}

export default async function EventsPage() {
  const events = await getEvents();

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">Veranstaltungen</h1>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map(event => (
          <Link
            key={event._id}
            href={`/events/${event.slug}`}
            className="border rounded-lg p-6 hover:shadow-lg transition"
          >
            <h2 className="text-2xl font-bold mb-2">{event.name}</h2>
            <p className="text-gray-600 mb-4">{event.description}</p>
            <div className="text-sm text-gray-500">
              <p>{event.eventDetails.location}</p>
              <p>{new Date(event.eventDetails.startDate).toLocaleDateString('de-DE')}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

---

## Phase 3: Frontend - Event Detail Page

### 3.1 Event Detail Page

**File: `/src/app/events/[slug]/page.tsx`**

```typescript
import Link from 'next/link';
import { notFound } from 'next/navigation';

async function getEvent(slug: string) {
  const res = await fetch(
    `${process.env.BACKEND_API_URL}/api/v1/events/${slug}`,
    {
      headers: { 'Authorization': `Bearer ${process.env.API_KEY}` },
      cache: 'no-store'
    }
  );

  if (!res.ok) return null;
  return res.json();
}

export default async function EventPage({ params }: { params: { slug: string } }) {
  const event = await getEvent(params.slug);

  if (!event) notFound();

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-5xl font-bold mb-4">{event.name}</h1>

      <div className="grid md:grid-cols-3 gap-8 mb-12">
        <div className="md:col-span-2">
          <p className="text-xl text-gray-700 mb-6">{event.description}</p>

          {/* Event details */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Veranstaltungsdetails</h2>
            <dl className="space-y-2">
              <div>
                <dt className="font-semibold">Datum:</dt>
                <dd>
                  {new Date(event.eventDetails.startDate).toLocaleDateString('de-DE')}
                  {event.eventDetails.endDate &&
                    ` - ${new Date(event.eventDetails.endDate).toLocaleDateString('de-DE')}`
                  }
                </dd>
              </div>
              <div>
                <dt className="font-semibold">Ort:</dt>
                <dd>{event.eventDetails.location}</dd>
              </div>
              <div>
                <dt className="font-semibold">Veranstaltungsort:</dt>
                <dd>{event.eventDetails.venue}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div>
          {event.registration.enabled && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4">Anmeldung</h3>
              <Link
                href={`/events/${event.slug}/register`}
                className="block w-full bg-blue-600 text-white text-center py-3 rounded-lg font-semibold hover:bg-blue-700"
              >
                Jetzt anmelden
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

## Phase 4: Frontend - Registration Form

### 4.1 Registration Form Component

**File: `/src/app/events/[slug]/register/components/HaffSymposiumForm.tsx`**

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface HaffSymposiumFormProps {
  event: any;
}

export function HaffSymposiumForm({ event }: HaffSymposiumFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [attendeeCategory, setAttendeeCategory] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);

    // Collect checkbox values for orga team
    const supportActivities = Array.from(
      document.querySelectorAll('input[name="support_activities"]:checked')
    ).map((cb: any) => cb.value);

    try {
      // Send to backend API
      const result = await fetch('/api/events/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trigger: 'event_registration_complete',
          inputData: {
            eventType: 'haffsymposium_registration',
            eventId: event._id,
            source: 'haffnet_website',

            customerData: {
              email: data.private_email,
              firstName: data.first_name,
              lastName: data.last_name,
              title: data.title,
              salutation: data.salutation,
              phone: data.mobile_phone,
              organization: data.organization,
              profession: data.profession
            },

            formResponses: {
              attendee_category: data.attendee_category,
              other_info: data.other_info,

              // Category-specific responses
              ...(attendeeCategory === '1' && {
                arrival_time: data.arrival_time_external,
                ucra_participants: data.ucra_participants_external,
                accommodation: data.accommodation_external,
                activity: data.activity_external,
                bbq: data.bbq_external,
                special_requests: data.special_requests_external,
                billing_address: data.billing_address_external
              }),

              // ... other categories

              ...(attendeeCategory === '6' && {
                support_activities: supportActivities,
                bbq: data.bbq_orga,
                special_requests: data.special_requests_orga
              })
            },

            transactionData: {
              productId: event._id,
              productName: event.name,
              price: calculatePrice(data),
              currency: 'EUR'
            },

            metadata: {
              registeredAt: new Date().toISOString(),
              locale: 'de-DE'
            }
          }
        })
      });

      const response = await result.json();

      if (response.success) {
        router.push(`/events/${event.slug}/confirmation?id=${response.transactionId}`);
      } else {
        alert('Fehler bei der Anmeldung: ' + response.message);
      }
    } catch (error) {
      alert('Fehler bei der Anmeldung. Bitte versuchen Sie es erneut.');
    } finally {
      setLoading(false);
    }
  };

  const calculatePrice = (data: any) => {
    const category = data.attendee_category;
    const basePrices = event.registration.categories.find(
      c => c.value === category
    )?.price || 0;

    const ucraCount = parseInt(data[`ucra_participants_${getCategoryName(category)}`] || '0');
    const ucraPrice = ucraCount * 30;

    return basePrices + ucraPrice;
  };

  const getCategoryName = (value: string) => {
    const map = { '1': 'external', '2': 'ameos', '3': 'haffnet', '4': 'speaker', '5': 'sponsor', '6': 'orga' };
    return map[value] || 'external';
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
      {/* Copy HTML form structure from html_form_import.html */}
      {/* Convert to React/Tailwind components */}

      {/* Attendee Category Selection */}
      <section className="mb-8 p-6 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Anmeldekategorie</h2>
        <div className="space-y-3">
          {event.registration.categories.map(cat => (
            <label key={cat.value} className="flex items-start gap-3 p-4 bg-white rounded border hover:border-blue-300 cursor-pointer">
              <input
                type="radio"
                name="attendee_category"
                value={cat.value}
                onChange={(e) => setAttendeeCategory(e.target.value)}
                required
              />
              <span>{cat.label}</span>
            </label>
          ))}
        </div>
      </section>

      {/* Personal Information */}
      <section className="mb-8 p-6 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Persönliche Angaben</h2>
        {/* ... form fields ... */}
      </section>

      {/* Conditional sections based on attendee_category */}
      {attendeeCategory === '1' && (
        <section className="mb-8 p-6 bg-gray-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">External Participant Details</h2>
          {/* ... external participant fields ... */}
        </section>
      )}

      {/* Submit button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Wird verarbeitet...' : 'Anmeldung abschicken'}
      </button>
    </form>
  );
}
```

### 4.2 Registration Page

**File: `/src/app/events/[slug]/register/page.tsx`**

```typescript
import { HaffSymposiumForm } from './components/HaffSymposiumForm';

async function getEvent(slug: string) {
  const res = await fetch(
    `${process.env.BACKEND_API_URL}/api/v1/events/${slug}`,
    {
      headers: { 'Authorization': `Bearer ${process.env.API_KEY}` },
      cache: 'no-store'
    }
  );

  if (!res.ok) return null;
  return res.json();
}

export default async function RegisterPage({ params }: { params: { slug: string } }) {
  const event = await getEvent(params.slug);

  if (!event) notFound();
  if (!event.registration.enabled) {
    return <div>Registration is not available for this event.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 rounded-lg mb-8">
        <h1 className="text-4xl font-bold mb-2">{event.name}</h1>
        <p className="text-xl">
          {new Date(event.eventDetails.startDate).toLocaleDateString('de-DE')} • {event.eventDetails.location}
        </p>
      </div>

      <HaffSymposiumForm event={event} />
    </div>
  );
}
```

### 4.3 Registration API Route

**File: `/src/app/api/events/register/route.ts`**

```typescript
export async function POST(request: Request) {
  const body = await request.json();

  // Forward to backend workflow API
  const response = await fetch(
    `${process.env.BACKEND_API_URL}/api/v1/workflows/trigger`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.API_KEY}`
      },
      body: JSON.stringify(body)
    }
  );

  const result = await response.json();
  return Response.json(result);
}
```

---

## Phase 5: Confirmation Page

**File: `/src/app/events/[slug]/confirmation/page.tsx`**

```typescript
export default function ConfirmationPage({ searchParams }: { searchParams: { id: string } }) {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto text-center">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-4xl font-bold mb-4">Anmeldung erfolgreich!</h1>
        <p className="text-xl text-gray-700 mb-8">
          Ihre Anmeldung wurde erfolgreich übermittelt.
        </p>
        <div className="bg-gray-50 p-6 rounded-lg">
          <p className="text-sm text-gray-600">Anmeldungs-ID:</p>
          <p className="font-mono font-bold">{searchParams.id}</p>
        </div>
        <p className="text-gray-600 mt-6">
          Sie erhalten in Kürze eine Bestätigung per E-Mail.
        </p>
      </div>
    </div>
  );
}
```

---

## Implementation Checklist

### Backend Setup
- [ ] Verify events exist in backend with correct structure
- [ ] Create HaffSymposium event object
- [ ] Configure workflow for `event_registration_complete` trigger
- [ ] Add behaviors (cost calculation, employer detection, etc.)
- [ ] Test workflow with sample data

### Frontend - Events System
- [ ] Create `/src/app/events/page.tsx` (events listing)
- [ ] Create `/src/app/events/[slug]/page.tsx` (event detail)
- [ ] Create `/src/app/api/events/route.ts` (fetch events API)
- [ ] Test events listing displays correctly

### Frontend - Registration Form
- [ ] Create `/src/app/events/[slug]/register/page.tsx`
- [ ] Create `/src/app/events/[slug]/register/components/HaffSymposiumForm.tsx`
- [ ] Convert HTML form to React components
- [ ] Implement conditional sections logic
- [ ] Add form validation
- [ ] Create `/src/app/api/events/register/route.ts`
- [ ] Test form submission

### Frontend - Confirmation
- [ ] Create `/src/app/events/[slug]/confirmation/page.tsx`
- [ ] Display success message and transaction ID
- [ ] Test confirmation flow

### Testing & Polish
- [ ] Test full registration flow
- [ ] Test all attendee categories
- [ ] Test conditional sections
- [ ] Test UCRA cost calculation
- [ ] Mobile responsive testing
- [ ] Error handling

---

## Key Decisions Made

1. **Forms are built in React** - Custom form components, not backend templates
2. **Backend validates on submit** - No need for complex form schema system
3. **Events are separate from seminars** - Different routes (`/events` vs `/seminare`)
4. **Single API endpoint** - `/api/v1/workflows/trigger` handles all registrations
5. **Backend behaviors handle logic** - Cost calculation, employer detection, etc.

---

## Next Steps

When you're ready to continue:

1. **Start with backend** - Verify event structure and workflow
2. **Build events listing** - Simple page to display events
3. **Convert HTML form** - React-ify the HaffSymposium form
4. **Wire up submission** - Connect to backend API
5. **Test & refine** - Ensure everything works

**Start command:** "Let's begin with Phase 1 - setting up the backend event structure"
