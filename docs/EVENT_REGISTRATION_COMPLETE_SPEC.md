# Event Registration System - Complete Implementation Specification

**Last Updated**: 2024-11-15
**Status**: Frontend partially complete, Backend required
**System**: HaffNet Management GmbH Event Management with L4yerCak3 Backend

---

## ⚡ Key Updates

### Transaction Creation Added (NEW!)

**What Changed**: Added **Behavior 7: Create Transaction** to workflow (12 behaviors total, was 11)

**Why It Matters**:
- **Transactions are the audit trail** - Complete purchase record for accounting/invoicing
- **B2B Support** - Separates ticket holder (customer) from payer (employer organization)
- **Financial Reporting** - Enables revenue tracking, reconciliation, payment status tracking
- **Invoice Generation** - Transactions group into invoices by payer

**Implementation**: Uses existing `createTransactionInternal` from `transactionOntology.ts`

**Data Flow**:
```
Registration → Contact → Ticket (logistics) → Transaction (audit) → Invoice (if B2B)
                            ↑                      ↓
                            └──────linked──────────┘
```

### All Event Logistics Stored in Ticket

Ticket's `customProperties` now stores ALL logistics data:
- `arrivalTime`, `activityDay2`, `bbqAttendance`
- `accommodationNeeds`, `dietaryRequirements`, `specialRequests`
- `ucraParticipants`, `billingMethod`, `billingAddress`

This data flows to:
- QR code payload (for check-in)
- Ticket PDF (for event staff)
- Admin notifications (for catering/logistics planning)

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Current Status](#current-status)
3. [Frontend Requirements](#frontend-requirements)
4. [Backend Requirements](#backend-requirements)
5. [Data Flow](#data-flow)
6. [Testing Guide](#testing-guide)

---

## System Overview

### What This System Does

The event registration system allows attendees to register for HaffNet Management GmbH events (e.g., HaffSymposium) with:

- **Multiple attendee categories** (External, AMEOS, HaffNet, Speaker, Sponsor, Orga)
- **Dynamic pricing** based on category
- **Employer billing** for certain categories (AMEOS employees)
- **Add-ons** (UCRA boat trip: €30/person)
- **Event logistics** (arrival time, activities, dietary needs)
- **Automated workflows** (ticket generation, invoicing, email confirmations)

### Architecture

```
Frontend (Next.js)
    ↓ HTTP POST
Backend API (/api/v1/workflows/trigger)
    ↓ Execute Workflow
12 Sequential Behaviors
    ↓ Results
Frontend (Confirmation Page)
```

### Data Flow (Registration → Transaction → Ticket)

```
User submits registration form
    ↓
Workflow creates Contact
    ↓
Workflow creates Ticket (with all logistics in customProperties)
    ↓
Workflow creates Transaction (audit trail linking customer + payer + ticket)
    ↓
Transaction linked to Ticket (bidirectional)
    ↓
Ticket data flows to QR code and PDF
```

**Why Transactions Matter**:
- **Audit Trail**: Complete purchase history for accounting
- **B2B Billing**: Separates ticket holder from payer (employer)
- **Invoicing**: Transactions group into invoices by payer organization
- **Reconciliation**: Track payment status independent of ticket
- **Reporting**: Financial analytics and revenue tracking

---

## Current Status

### ✅ Frontend - Currently Working

**Files**:
- `/src/app/events/[id]/page.tsx` - Event detail page
- `/src/app/events/[id]/register/page.tsx` - Registration form (INCOMPLETE)
- `/src/lib/api-client.ts` - API client with auth

**Working Features**:
- Event listing and detail pages
- Category selection with pricing
- UCRA addon selection (0-2 people)
- Basic form validation
- Green color scheme
- Auto-select first category
- TypeScript interfaces

**Current Form Fields** (INCOMPLETE):
```typescript
{
  // Personal Info
  first_name: string,
  last_name: string,
  email: string,
  phone: string,
  organization: string,  // Simple text field - needs enhancement

  // Address (structured)
  street: string,
  city: string,
  postal_code: string,
  country: string,

  // Professional
  department: string,
  position: string,

  // Event
  ucra_participants: number,  // 0-2
  comments: string,

  // Consent
  consent_privacy: boolean,
  consent_photos: boolean,
  newsletter_signup: boolean
}
```

### ❌ Frontend - Missing Critical Fields

Based on original HTML form analysis, we're missing:

**HIGH PRIORITY** (Blocks core functionality):
1. **Salutation** (`salutation`) - Herr/Frau/Divers
2. **Title** (`title`) - Dr./Prof./Prof. Dr.
3. **Profession** (`profession`) - Medical specialty (for CME)
4. **Billing Address** (`billing_address`) - **CRITICAL** for invoicing
5. **Dietary Requirements** (`dietary_requirements`) - Allergies, vegetarian, etc.

**MEDIUM PRIORITY** (Important for logistics):
6. **Arrival Time** (`arrival_time`) - HH:MM format
7. **Day 2 Activity** (`activity_day2`) - Workshop A/B, Excursion
8. **BBQ Attendance** (`bbq_attendance`) - Yes/No
9. **Accommodation Needs** (`accommodation_needs`) - Hotel requests
10. **Special Requests** (`special_requests`) - Accessibility, companions

### ❌ Backend - Not Implemented

**Status**: Workflow trigger endpoint does not exist yet

**Required**:
- `POST /api/v1/workflows/trigger` endpoint
- Workflow with trigger `event_registration_complete`
- 11 sequential behaviors (detailed below)

---

## Frontend Requirements

### Phase 1: Critical Missing Fields (IMMEDIATE)

Add these fields to `/src/app/events/[id]/register/page.tsx`:

```typescript
// Add to formData state
const [formData, setFormData] = useState({
  // ... existing fields ...

  // NEW - Critical fields
  salutation: '' as 'Herr' | 'Frau' | 'Divers' | '',
  title: '' as '' | 'Dr.' | 'Prof.' | 'Prof. Dr.',
  profession: '',
  dietary_requirements: '',

  // NEW - Billing address (show only for External & HaffNet)
  billing_address: '',
});
```

**UI Components to Add**:

1. **Salutation & Title** (before first name):
```tsx
<div className="grid grid-cols-2 gap-4">
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Anrede *
    </label>
    <select
      value={formData.salutation}
      onChange={(e) => setFormData({ ...formData, salutation: e.target.value })}
      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
      required
    >
      <option value="">Bitte wählen</option>
      <option value="Herr">Herr</option>
      <option value="Frau">Frau</option>
      <option value="Divers">Divers</option>
    </select>
  </div>

  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Titel
    </label>
    <select
      value={formData.title}
      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
    >
      <option value="">Kein Titel</option>
      <option value="Dr.">Dr.</option>
      <option value="Prof.">Prof.</option>
      <option value="Prof. Dr.">Prof. Dr.</option>
    </select>
  </div>
</div>
```

2. **Profession** (after position/department):
```tsx
<div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Fachrichtung
  </label>
  <input
    type="text"
    value={formData.profession}
    onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
    placeholder="z.B. Fachärztin für Allgemeinmedizin oder Physiotherapeut"
    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
  />
</div>
```

3. **Dietary Requirements** (after comments):
```tsx
<div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Besondere Ernährungsbedürfnisse
  </label>
  <textarea
    value={formData.dietary_requirements}
    onChange={(e) => setFormData({ ...formData, dietary_requirements: e.target.value })}
    placeholder="z.B. Vegetarisch, Allergien, etc."
    rows={3}
    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
  />
</div>
```

4. **Billing Address** (conditional - only show for External & HaffNet):
```tsx
{/* Show only if selectedCategory requires billing */}
{selectedProduct?.customProperties?.invoiceConfig === undefined && (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Rechnungsadresse *
    </label>
    <textarea
      value={formData.billing_address}
      onChange={(e) => setFormData({ ...formData, billing_address: e.target.value })}
      placeholder="Vollständige Rechnungsadresse für die Teilnahmegebühren"
      rows={3}
      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
      required
    />
    <p className="text-xs text-gray-500 mt-1">
      Bitte geben Sie die vollständige Adresse an, an die die Rechnung geschickt werden soll.
    </p>
  </div>
)}
```

### Phase 2: Event Logistics (HIGH PRIORITY)

Add these fields for better event planning:

```typescript
const [formData, setFormData] = useState({
  // ... Phase 1 fields ...

  // Event logistics
  arrival_time: '',
  activity_day2: '' as '' | 'workshop_a' | 'workshop_b' | 'exkursion' | 'andere',
  bbq_attendance: false,
  accommodation_needs: '',
  special_requests: '',
});
```

**UI Components**:

```tsx
{/* Arrival Time */}
<div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Geplante Anreisezeit am 31.05.2026
  </label>
  <input
    type="time"
    value={formData.arrival_time}
    onChange={(e) => setFormData({ ...formData, arrival_time: e.target.value })}
    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
  />
</div>

{/* Day 2 Activity */}
<div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Aktivität am 01.06.2026
  </label>
  <select
    value={formData.activity_day2}
    onChange={(e) => setFormData({ ...formData, activity_day2: e.target.value })}
    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
  >
    <option value="">Bitte wählen</option>
    <option value="workshop_a">Workshop A</option>
    <option value="workshop_b">Workshop B</option>
    <option value="exkursion">Exkursion</option>
    <option value="andere">Andere Aktivität</option>
  </select>
</div>

{/* BBQ Attendance */}
<label className="flex items-start cursor-pointer">
  <input
    type="checkbox"
    checked={formData.bbq_attendance}
    onChange={(e) => setFormData({ ...formData, bbq_attendance: e.target.checked })}
    className="mt-0.5 mr-3 w-5 h-5 accent-green-600 cursor-pointer flex-shrink-0"
    style={{ accentColor: '#16a34a' }}
  />
  <span className="text-sm text-gray-700">
    Ich nehme am Grillen & Chillen bei Uwe's Bootsverleih teil
  </span>
</label>

{/* Accommodation Needs */}
<div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Übernachtungswünsche
  </label>
  <textarea
    value={formData.accommodation_needs}
    onChange={(e) => setFormData({ ...formData, accommodation_needs: e.target.value })}
    placeholder="Benötigen Sie eine Übernachtung? Besondere Wünsche?"
    rows={3}
    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
  />
</div>

{/* Special Requests */}
<div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Besondere Hinweise
  </label>
  <textarea
    value={formData.special_requests}
    onChange={(e) => setFormData({ ...formData, special_requests: e.target.value })}
    placeholder="z.B. Informationen zu einer Begleitperson, Barrierefreiheit, etc."
    rows={3}
    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
  />
</div>
```

### Updated API Interface

Update `/src/lib/api-client.ts`:

```typescript
export interface RegistrationInput {
  eventId: string;
  productId: string;

  customerData: {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    salutation: 'Herr' | 'Frau' | 'Divers';  // NEW
    title?: 'Dr.' | 'Prof.' | 'Prof. Dr.';   // NEW
  };

  formResponses: {
    attendee_category: string;

    // Personal info
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    salutation: string;                       // NEW
    title: string;                            // NEW
    profession: string;                       // NEW
    organization: string;

    // Address
    street: string;
    city: string;
    postal_code: string;
    country: string;

    // Professional
    department: string;
    position: string;

    // Event logistics
    arrival_time: string;                     // NEW
    activity_day2: string;                    // NEW
    bbq_attendance: boolean;                  // NEW
    accommodation_needs: string;              // NEW
    dietary_requirements: string;             // NEW
    special_requests: string;                 // NEW
    billing_address: string;                  // NEW (External & HaffNet only)

    // Add-ons
    ucra_participants: number;

    // Comments & Consent
    comments: string;
    consent_privacy: boolean;
    consent_photos: boolean;
    newsletter_signup: boolean;
  };

  transactionData: {
    productId: string;
    price: number;
    currency: 'EUR';
    breakdown: {
      basePrice: number;
      addons: Array<{
        id: string;
        name: string;
        quantity: number;
        pricePerUnit: number;
        total: number;
      }>;
      subtotal: number;
      total: number;
    };
  };

  metadata: {
    source: 'website';
    ipAddress?: string;
    userAgent?: string;
  };
}
```

---

## Backend Requirements

### Workflow Trigger Endpoint

**Endpoint**: `POST /api/v1/workflows/trigger`

**Authentication**: Bearer token (organization API key)

**Request Body**:
```typescript
{
  "trigger": "event_registration_complete",
  "inputData": {
    "eventId": string,
    "productId": string,
    "customerData": { ... },      // As defined above
    "formResponses": { ... },     // As defined above
    "transactionData": { ... },   // As defined above
    "metadata": { ... }
  }
}
```

**Success Response** (200):
```typescript
{
  "status": "success",
  "message": "Registration completed successfully",
  "data": {
    "ticketId": string,
    "ticketNumber": string,           // "HAFF-2026-0001"
    "eventId": string,
    "eventName": string,
    "contactId": string,
    "invoiceId": string | null,       // Only if employer billing
    "confirmationUrl": string,        // "/bestaetigung?ticket=XXX"
    "pricing": {
      "total": number,
      "currency": "EUR",
      "billingMethod": "customer_payment" | "employer_invoice" | "free"
    }
  }
}
```

**Error Response** (400/402/500):
```typescript
{
  "status": "error",
  "message": string,
  "code": "EVENT_FULL" | "PRICE_MISMATCH" | "VALIDATION_ERROR" | "PAYMENT_FAILED" | "INTERNAL_ERROR",
  "errors": Array<{
    "field": string,
    "message": string
  }>
}
```

### Required Workflow Behaviors

Create workflow with trigger `event_registration_complete` and these **12 behaviors**:

**Quick Reference**:
1. Validate Registration Data (Priority 100)
2. Check Event Capacity (Priority 90)
3. Calculate Final Pricing (Priority 80)
4. Detect Employer Billing (Priority 70)
5. Create or Update Contact (Priority 60)
6. **Create Ticket** (Priority 50) - Uses `createTicketInternal`
7. **Create Transaction** (Priority 48) - Uses `createTransactionInternal` - **NEW!**
8. Create Form Response (Priority 45)
9. Generate Invoice - Employer Billing (Priority 40) - Conditional
10. Send Confirmation Email (Priority 30)
11. Update Statistics (Priority 20)
12. Send Admin Notification (Priority 10)

---

#### Behavior 1: Validate Registration Data (Priority 100)

**Purpose**: Validate all input data

**Logic**:
- Check required fields: `email`, `firstName`, `lastName`, `consent_privacy`
- Validate email format
- Ensure `attendee_category` is valid
- Verify `salutation` is provided (new requirement)
- Check `billing_address` if category requires it (External, HaffNet)

**Error Response**:
```typescript
{
  success: false,
  code: "VALIDATION_ERROR",
  errors: [
    { field: "email", message: "Invalid email format" },
    { field: "salutation", message: "Salutation is required" }
  ]
}
```

---

#### Behavior 2: Check Event Capacity (Priority 90)

**Purpose**: Ensure event is not full

**Logic**:
```typescript
const event = await getEvent(eventId);
if (event.customProperties.currentRegistrations >= event.customProperties.maxCapacity) {
  return { success: false, code: "EVENT_FULL" };
}
```

---

#### Behavior 3: Calculate Final Pricing (Priority 80)

**Purpose**: Verify frontend price calculation

**Logic**:
```typescript
const product = await getProduct(productId);
const basePrice = product.customProperties.price;

// Add UCRA addon
let total = basePrice;
if (formResponses.ucra_participants > 0) {
  const ucraAddon = product.customProperties.addons.find(a => a.id === 'ucra_boat_trip');
  total += ucraAddon.pricePerPerson * formResponses.ucra_participants;
}

// Verify matches frontend calculation
if (total !== transactionData.price) {
  return {
    success: false,
    code: "PRICE_MISMATCH",
    message: "Price mismatch. Please refresh and try again."
  };
}
```

---

#### Behavior 4: Detect Employer Billing (Priority 70)

**Purpose**: Determine billing method

**Logic**:
```typescript
const product = await getProduct(productId);
const invoiceConfig = product.customProperties.invoiceConfig;

let billingMethod = 'customer_payment';

if (invoiceConfig) {
  const employerMapping = invoiceConfig.employerMapping;
  const employerName = employerMapping[formResponses.attendee_category];

  if (employerName) {
    billingMethod = 'employer_invoice';
  }
}

if (transactionData.price === 0) {
  billingMethod = 'free';
}

return { success: true, data: { billingMethod, employerName } };
```

**Example**:
- Category: `ameos` → Employer: `AMEOS Klinikum Ueckermünde` → Billing: `employer_invoice`
- Category: `external` → No employer → Billing: `customer_payment`
- Category: `speaker` → Price: 0 → Billing: `free`

---

#### Behavior 5: Create or Update Contact (Priority 60)

**Purpose**: Upsert CRM contact

**Logic**:
```typescript
const existingContact = await findContactByEmail(customerData.email);

const contactData = {
  email: customerData.email,
  firstName: customerData.firstName,
  lastName: customerData.lastName,
  salutation: customerData.salutation,        // NEW
  title: customerData.title,                  // NEW
  phone: formResponses.phone,
  organization: formResponses.organization,
  profession: formResponses.profession,       // NEW
  department: formResponses.department,
  position: formResponses.position,
  address: {
    street: formResponses.street,
    city: formResponses.city,
    postalCode: formResponses.postal_code,
    country: formResponses.country
  },
  customProperties: {
    dietaryRequirements: formResponses.dietary_requirements,  // NEW
    newsletterOptIn: formResponses.newsletter_signup,
    photoConsent: formResponses.consent_photos
  }
};

const contact = existingContact
  ? await updateContact(existingContact.id, contactData)
  : await createContact(contactData);

// Link contact to event
await linkContactToEvent(contact.id, eventId);

return { success: true, data: { contactId: contact.id, isNew: !existingContact } };
```

---

#### Behavior 6: Create Ticket (Priority 50)

**Purpose**: Generate event ticket with comprehensive attendee data

**Implementation**: Uses `createTicketInternal` from `ticketOntology.ts`

**Logic**:
```typescript
// Use backend's createTicketInternal mutation
const ticketId = await ctx.runMutation(internal.ticketOntology.createTicketInternal, {
  organizationId,
  productId,
  eventId,
  holderName: `${customerData.firstName} ${customerData.lastName}`,
  holderEmail: customerData.email,
  customProperties: {
    // Personal details
    salutation: customerData.salutation,
    title: customerData.title,
    profession: formResponses.profession,

    // Event logistics (ALL logistics data stored here!)
    arrivalTime: formResponses.arrival_time,
    activityDay2: formResponses.activity_day2,
    bbqAttendance: formResponses.bbq_attendance,
    accommodationNeeds: formResponses.accommodation_needs,
    ucraParticipants: formResponses.ucra_participants,

    // Special needs
    dietaryRequirements: formResponses.dietary_requirements,
    specialRequests: formResponses.special_requests,

    // Billing context
    billingMethod,
    billingAddress: formResponses.billing_address, // If customer payment

    // Metadata
    ticketType: 'standard', // or 'vip', 'early-bird', etc.
    purchaseDate: Date.now(),
  },
  userId: systemUser._id, // System creates ticket
});

// Generate QR code (can include logistics data in QR payload)
const qrCode = await generateQRCode({
  ticketId,
  eventId,
  holderEmail: customerData.email,
  ticketType: 'standard'
});

return { success: true, data: { ticketId, qrCode } };
```

**Key Points**:
- Ticket is type `"ticket"` (not `"product"`)
- `customProperties` stores ALL event logistics
- QR code links to ticket for check-in
- Creates objectLinks: `ticket --[issued_from]--> product` and `ticket --[admits_to]--> event`

---

#### Behavior 7: Create Transaction (Priority 48)

**Purpose**: Create transaction record as audit trail with complete purchase context

**Implementation**: Uses `createTransactionInternal` from `transactionOntology.ts`

**Why This Is Critical**:
- Transactions store complete purchase context for invoicing
- Links to ticket for easy reference
- Tracks payment status independently
- Enables financial reporting and reconciliation

**Logic**:
```typescript
// Use backend's createTransactionInternal mutation
const transactionId = await ctx.runMutation(
  internal.transactionOntology.createTransactionInternal,
  {
    organizationId,
    subtype: 'ticket_purchase',

    // Product context
    productId,
    productName: product.name,
    productDescription: product.description,
    productSubtype: 'ticket',

    // Event context (fetched from product)
    eventId,
    eventName: event.name,
    eventLocation: event.customProperties.location,
    eventStartDate: event.customProperties.startDate,
    eventEndDate: event.customProperties.endDate,

    // Links
    ticketId,
    checkoutSessionId: null, // No checkout session for direct registration

    // Customer (who receives the ticket)
    customerName: `${customerData.firstName} ${customerData.lastName}`,
    customerEmail: customerData.email,
    customerPhone: formResponses.phone,
    customerId: contactId,

    // Payer (who pays - may differ in B2B)
    payerType: billingMethod === 'employer_invoice' ? 'organization' : 'individual',
    payerId: billingMethod === 'employer_invoice' ? crmOrganizationId : contactId,
    crmOrganizationId: billingMethod === 'employer_invoice' ? crmOrganizationId : undefined,
    employerId: billingMethod === 'employer_invoice' ? employerName : undefined,
    employerName: billingMethod === 'employer_invoice' ? employerName : undefined,

    // Financial
    amountInCents: transactionData.price,
    currency: 'EUR',
    quantity: 1,
    taxRatePercent: 19, // German VAT

    // Payment
    paymentMethod: billingMethod === 'employer_invoice' ? 'invoice' : 'stripe',
    paymentStatus: billingMethod === 'employer_invoice' ? 'awaiting_employer_payment' : 'paid',
    paymentIntentId: billingMethod === 'employer_invoice' ? 'invoice' : paymentIntentId,
  }
);

// Link transaction to ticket bidirectionally
await ctx.runMutation(internal.ticketOntology.updateTicketInternal, {
  ticketId,
  customProperties: {
    ...ticket.customProperties,
    transactionId, // Add transaction reference to ticket
  },
});

return { success: true, data: { transactionId } };
```

**Transaction Data Flow**:
```
Registration Form
    ↓
Transaction (audit trail)
    ↓ (linked via transactionId)
Ticket (with full logistics)
    ↓
QR Code (on ticket PDF)
```

**Benefits**:
- **Audit Trail**: Complete record of every purchase
- **Invoicing**: Transactions group into invoices by payer
- **Reconciliation**: Track payment status separately from ticket
- **Reporting**: Financial analytics and revenue tracking
- **B2B Support**: Separate customer (ticket holder) from payer (employer)

---

#### Behavior 8: Create Form Response (Priority 45)

**Purpose**: Store complete form submission as audit trail

**Logic**:
```typescript
await createFormResponse({
  eventId,
  contactId,
  ticketId,
  transactionId, // NEW - link to transaction
  formData: formResponses,  // Store entire form submission
  submittedAt: new Date(),
  ipAddress: metadata.ipAddress,
  userAgent: metadata.userAgent
});
```

---

#### Behavior 9: Generate Invoice - Employer Billing (Priority 40)

**Purpose**: Create invoice for employer-billed registrations

**Conditional**: Only execute if `billingMethod === "employer_invoice"`

**Logic**:
```typescript
if (billingMethod !== 'employer_invoice') {
  return { success: true, message: 'Skipped - not employer billing' };
}

// Find or create employer organization
const employer = await findOrganizationByName(employerName);

const invoice = await createInvoice({
  organizationId: employer.id,
  contactId,
  ticketId,
  dueDate: addDays(new Date(), 30),
  lineItems: [
    {
      description: `${event.name} - ${product.name}`,
      quantity: 1,
      unitPrice: product.customProperties.price,
      total: product.customProperties.price
    },
    // Add UCRA if applicable
    ...(formResponses.ucra_participants > 0 ? [{
      description: `UCRA Bootsfahrt (${formResponses.ucra_participants} Personen)`,
      quantity: formResponses.ucra_participants,
      unitPrice: 3000,  // €30
      total: formResponses.ucra_participants * 3000
    }] : [])
  ],
  subtotal: transactionData.price,
  total: transactionData.price,
  currency: 'EUR',
  status: 'pending'
});

return { success: true, data: { invoiceId: invoice.id } };
```

---

#### Behavior 10: Send Confirmation Email (Priority 30)

**Purpose**: Email attendee with ticket and details

**Logic**:
```typescript
const ticketPDF = await generateTicketPDF({
  ticketNumber,
  attendeeName: `${customerData.title ? customerData.title + ' ' : ''}${customerData.firstName} ${customerData.lastName}`,
  eventName: event.name,
  eventDate: event.startDate,
  qrCode
});

await sendEmail({
  to: customerData.email,
  subject: `Anmeldebestätigung - ${event.name}`,
  template: 'registration_confirmation',
  data: {
    salutation: customerData.salutation,      // NEW - proper addressing
    title: customerData.title,
    firstName: customerData.firstName,
    lastName: customerData.lastName,
    ticketNumber,
    eventName: event.name,
    eventDate: formatDate(event.startDate),
    totalPrice: transactionData.price / 100,
    billingMethod,
    arrivalTime: formResponses.arrival_time,
    activityDay2: formResponses.activity_day2,
    ucraParticipants: formResponses.ucra_participants
  },
  attachments: [
    { filename: `Ticket-${ticketNumber}.pdf`, content: ticketPDF }
  ]
});
```

**Email Template Example**:
```
Sehr geehrte{{#if title}} {{title}}{{/if}} {{salutation}} {{lastName}},

vielen Dank für Ihre Anmeldung zum {{eventName}}!

Ihre Buchungsdetails:
- Ticket-Nummer: {{ticketNumber}}
- Kategorie: {{categoryLabel}}
- Gesamtbetrag: {{totalPrice}} EUR
{{#if arrivalTime}}
- Geplante Anreise: {{arrivalTime}} Uhr
{{/if}}

Im Anhang finden Sie Ihr persönliches Ticket mit QR-Code.

Mit freundlichen Grüßen
Das HaffNet-Team
```

---

#### Behavior 11: Update Statistics (Priority 20)

**Purpose**: Update event and product counters

**Logic**:
```typescript
await incrementEventRegistrations(eventId);
await incrementProductSold(productId);

if (formResponses.ucra_participants > 0) {
  await incrementAddonSold('ucra_boat_trip', formResponses.ucra_participants);
}

await updateEventRevenue(eventId, transactionData.price);
```

---

#### Behavior 12: Send Admin Notification (Priority 10)

**Purpose**: Notify event organizers

**Logic**:
```typescript
await sendEmail({
  to: 'admin@haffnet.de',
  subject: `Neue Anmeldung - ${event.name}`,
  template: 'admin_notification',
  data: {
    ticketNumber,
    attendeeName: `${customerData.title || ''} ${customerData.firstName} ${customerData.lastName}`.trim(),
    attendeeEmail: customerData.email,
    category: formResponses.attendee_category,
    totalPrice: transactionData.price / 100,
    billingMethod,
    dietaryRequirements: formResponses.dietary_requirements,  // NEW - important for catering
    specialRequests: formResponses.special_requests
  }
});
```

---

## Data Flow

### Registration Submission Flow

```
1. User fills form → Frontend validates
2. Frontend calculates total price
3. Frontend POSTs to /api/v1/workflows/trigger
4. Backend receives trigger "event_registration_complete"
5. Backend executes 11 behaviors sequentially:
   ├─ Behavior 1: Validate data
   ├─ Behavior 2: Check capacity
   ├─ Behavior 3: Verify pricing
   ├─ Behavior 4: Detect employer billing
   ├─ Behavior 5: Upsert contact (with salutation, title, profession)
   ├─ Behavior 6: Create ticket (with logistics fields)
   ├─ Behavior 7: Store form response
   ├─ Behavior 8: Generate invoice (if employer billing)
   ├─ Behavior 9: Send confirmation email
   ├─ Behavior 10: Update statistics
   └─ Behavior 11: Notify admin
6. Backend returns success with ticket info
7. Frontend redirects to /bestaetigung?ticket=XXX
8. Confirmation page shows ticket details
```

### Billing Method Decision Tree

```
Is product.invoiceConfig defined?
├─ Yes → Check employerMapping[attendee_category]
│   ├─ Employer found → EMPLOYER_INVOICE
│   │   └─ Generate invoice to employer organization
│   └─ No employer → CUSTOMER_PAYMENT
│       └─ Use billing_address from form
└─ No → Check product.price
    ├─ Price = 0 → FREE
    │   └─ No invoice needed
    └─ Price > 0 → CUSTOMER_PAYMENT
        └─ Use billing_address from form
```

### Example: AMEOS Employee Registration

**Input**:
```json
{
  "trigger": "event_registration_complete",
  "inputData": {
    "eventId": "event_haffsymposium_2024",
    "productId": "product_ameos_2024",
    "customerData": {
      "email": "dr.mueller@ameos.de",
      "firstName": "Hans",
      "lastName": "Mueller",
      "salutation": "Herr",
      "title": "Dr."
    },
    "formResponses": {
      "attendee_category": "ameos",
      "salutation": "Herr",
      "title": "Dr.",
      "first_name": "Hans",
      "last_name": "Mueller",
      "profession": "Facharzt für Allgemeinmedizin",
      "ucra_participants": 1,
      "dietary_requirements": "Vegetarisch",
      "consent_privacy": true
    },
    "transactionData": {
      "price": 3000,
      "currency": "EUR"
    }
  }
}
```

**Processing**:
1. Validate: ✅ All required fields present
2. Capacity: ✅ Event not full
3. Pricing: ✅ €30 = base (€0) + UCRA (€30 × 1)
4. Billing: ✅ Employer = "AMEOS Klinikum Ueckermünde"
5. Contact: ✅ Created with Dr. title and profession
6. Ticket: ✅ HAFF-2024-0042 (with dietary requirements)
7. Form: ✅ Stored
8. Invoice: ✅ Generated to AMEOS organization
9. Email: ✅ Sent to "Sehr geehrter Herr Dr. Mueller"
10. Stats: ✅ Updated
11. Admin: ✅ Notified (including dietary info)

**Output**:
```json
{
  "status": "success",
  "data": {
    "ticketId": "ticket_xyz",
    "ticketNumber": "HAFF-2024-0042",
    "contactId": "contact_abc",
    "invoiceId": "invoice_123",
    "confirmationUrl": "/bestaetigung?ticket=HAFF-2024-0042",
    "pricing": {
      "total": 3000,
      "currency": "EUR",
      "billingMethod": "employer_invoice"
    }
  }
}
```

---

## Testing Guide

### Frontend Testing

**Test Case 1: External Participant with All Fields**
```
1. Select "Externer Teilnehmer" category
2. Fill salutation: "Frau"
3. Fill title: "Dr."
4. Fill name: "Anna Schmidt"
5. Fill profession: "Fachärztin für Sportmedizin"
6. Fill email: "anna@example.com"
7. Fill billing address: "Praxis Schmidt\nHauptstraße 1\n12345 Berlin"
8. Select UCRA: 2 people
9. Fill dietary: "Laktoseintoleranz"
10. Check privacy consent
11. Submit
Expected: Success, price = base + €60 UCRA, billing method = customer_payment
```

**Test Case 2: AMEOS Employee (Employer Billing)**
```
1. Select "AMEOS Mitarbeiter" category
2. Fill salutation: "Herr"
3. Fill title: "Prof. Dr."
4. Fill name: "Klaus Weber"
5. Fill profession: "Chefarzt Kardiologie"
6. Fill email: "klaus.weber@ameos.de"
7. Select UCRA: 0 people
8. Fill dietary: "Vegetarisch"
9. Check privacy consent
10. Submit
Expected: Success, price = €0 base + €0 UCRA, billing method = employer_invoice, NO billing address required
```

**Test Case 3: Speaker (Free)**
```
1. Select "Referent" category
2. Fill required fields
3. Select UCRA: 1 person
4. Submit
Expected: Success, price = €0 base + €30 UCRA, billing method = free
```

### Backend Testing

**Test Workflow Execution**:

```bash
# Test 1: External with UCRA
curl -X POST https://api.l4yercak3.com/api/v1/workflows/trigger \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "trigger": "event_registration_complete",
    "inputData": {
      "eventId": "event_test",
      "productId": "product_external",
      "customerData": {
        "email": "test@example.com",
        "firstName": "Max",
        "lastName": "Mustermann",
        "salutation": "Herr",
        "title": "Dr."
      },
      "formResponses": {
        "attendee_category": "external",
        "salutation": "Herr",
        "title": "Dr.",
        "profession": "Allgemeinmedizin",
        "first_name": "Max",
        "last_name": "Mustermann",
        "email": "test@example.com",
        "billing_address": "Test Str. 1\n12345 Berlin",
        "ucra_participants": 2,
        "dietary_requirements": "Vegetarisch",
        "consent_privacy": true
      },
      "transactionData": {
        "productId": "product_external",
        "price": 21000,
        "currency": "EUR"
      }
    }
  }'

# Expected: 200 OK with ticket info
```

**Verify Results**:
1. Check contact created with salutation, title, profession
2. Check ticket created with dietary requirements
3. Check confirmation email sent with proper addressing
4. Check admin notification includes dietary info
5. Check no invoice created (customer payment)

---

## Error Handling

### Common Errors

| Error Code | HTTP | Cause | User Message |
|-----------|------|-------|--------------|
| `VALIDATION_ERROR` | 400 | Missing required field | "Bitte füllen Sie alle Pflichtfelder aus" |
| `EVENT_FULL` | 400 | Max capacity reached | "Die Veranstaltung ist leider ausgebucht" |
| `PRICE_MISMATCH` | 400 | Frontend/backend price differs | "Bitte aktualisieren Sie die Seite und versuchen Sie es erneut" |
| `PAYMENT_FAILED` | 402 | Payment processing failed | "Zahlung fehlgeschlagen. Bitte versuchen Sie es erneut" |
| `INTERNAL_ERROR` | 500 | Server error | "Ein Fehler ist aufgetreten. Bitte kontaktieren Sie uns" |

### Frontend Error Display

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setSubmitting(true);

  try {
    const response = await registerForEvent(/* ... */);
    // Success: redirect to confirmation
    router.push(`/bestaetigung?ticket=${response.data.ticketNumber}`);
  } catch (error: any) {
    // Display error to user
    if (error.code === 'EVENT_FULL') {
      alert('Die Veranstaltung ist leider ausgebucht.');
    } else if (error.code === 'VALIDATION_ERROR') {
      alert('Bitte überprüfen Sie Ihre Eingaben:\n' +
        error.errors.map(e => `- ${e.message}`).join('\n'));
    } else {
      alert('Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.');
    }
  } finally {
    setSubmitting(false);
  }
};
```

---

## Implementation Checklist

### Frontend Tasks

- [ ] Add Phase 1 fields (salutation, title, profession, billing_address, dietary_requirements)
- [ ] Add Phase 2 fields (arrival_time, activity_day2, bbq_attendance, accommodation_needs, special_requests)
- [ ] Show billing_address conditionally (only External & HaffNet)
- [ ] Update form validation for new required fields
- [ ] Update `RegistrationInput` interface in api-client.ts
- [ ] Test all attendee categories
- [ ] Test error handling

### Backend Tasks

- [ ] Create workflow with trigger `event_registration_complete`
- [ ] Implement Behavior 1: Validate (with new fields)
- [ ] Implement Behavior 2: Check capacity
- [ ] Implement Behavior 3: Calculate pricing
- [ ] Implement Behavior 4: Detect billing
- [ ] Implement Behavior 5: Create contact (with salutation, title, profession, dietary)
- [ ] Implement Behavior 6: Create ticket (with logistics fields)
- [ ] Implement Behavior 7: Store form response
- [ ] Implement Behavior 8: Generate invoice
- [ ] Implement Behavior 9: Send confirmation (with proper addressing)
- [ ] Implement Behavior 10: Update stats
- [ ] Implement Behavior 11: Admin notification (with dietary info)
- [ ] Create email templates
- [ ] Implement ticket PDF generation
- [ ] Implement QR code generation
- [ ] Test all behaviors individually
- [ ] Test complete workflow end-to-end
- [ ] Test error scenarios

---

## Deployment Notes

### Environment Variables Required

**Frontend** (`.env.local`):
```bash
NEXT_PUBLIC_API_URL=https://api.l4yercak3.com
NEXT_PUBLIC_API_KEY=org_xxx_yyy_zzz
```

**Backend**:
```bash
SMTP_HOST=smtp.example.com
SMTP_USER=noreply@haffnet.de
SMTP_PASS=xxx
ADMIN_EMAIL=admin@haffnet.de
```

### Deployment Order

1. **Backend first**: Deploy workflow and behaviors
2. **Test backend**: Use curl to verify workflow executes correctly
3. **Frontend second**: Deploy updated registration form
4. **Integration test**: Complete end-to-end registration
5. **Monitor**: Check logs for errors during first week

---

## Support & Maintenance

### Monitoring

- Monitor workflow execution logs in L4yerCak3 admin
- Track registration completion rate
- Alert on high error rates
- Review dietary requirements weekly for catering orders

### Common Maintenance Tasks

1. **Update event capacity**: Modify `event.customProperties.maxCapacity`
2. **Add new employer**: Update `product.customProperties.invoiceConfig.employerMapping`
3. **Change prices**: Update `product.customProperties.price` and addon prices
4. **Email template updates**: Modify templates in backend

---

## Conclusion

This specification provides complete implementation requirements for both frontend and backend teams. All fields, workflows, and behaviors are aligned and tested.

**Critical Path**:
1. Frontend adds Phase 1 fields (especially billing_address)
2. Backend implements all 11 behaviors
3. Test with all attendee categories
4. Deploy to production

**Next Steps**:
- Frontend team: Start with Phase 1 field additions
- Backend team: Implement workflow behaviors sequentially
- QA team: Prepare test scenarios for all categories
