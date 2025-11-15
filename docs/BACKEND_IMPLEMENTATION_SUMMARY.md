# Backend Implementation Summary - HaffSymposium Event

## Overview

Complete backend documentation for the HaffSymposium event registration system using the L4yerCak3 ontology-based architecture.

---

## Documentation Files

### 1. [BACKEND_ONTOLOGY_STRUCTURE.md](./BACKEND_ONTOLOGY_STRUCTURE.md)
**Purpose:** Explains how the ontology system works

**Key Concepts:**
- Universal `objects` table for all entity types
- Events, Products, Tickets, Forms stored as objects
- `objectLinks` table for relationships
- Forms, Products, and Events integration

**Key Sections:**
- Event object structure
- Product objects (6 registration categories)
- Forms integration (3 approaches: backend schema, React only, hybrid)
- Complete integration flow
- Frontend registration workflow

---

### 2. [WORKFLOW_CONFIGURATION.md](./WORKFLOW_CONFIGURATION.md)
**Purpose:** Complete workflow configuration with 11 behaviors

**Behaviors (in priority order):**
1. **Validate Registration Data** (100) - Input validation
2. **Check Event Capacity** (90) - Prevent overbooking
3. **Calculate Final Pricing** (80) - Price verification
4. **Detect Employer Billing** (70) - AMEOS invoice detection
5. **Create/Update Contact** (60) - CRM integration
6. **Create Ticket** (50) - Admission ticket with QR code
7. **Create Form Response** (45) - Audit trail
8. **Generate Invoice** (40) - Employer billing (conditional)
9. **Send Confirmation Email** (30) - Attendee notification
10. **Update Statistics** (20) - Event metrics
11. **Notify Admin** (10) - Admin notification

**Features:**
- Automatic employer billing for AMEOS employees
- UCRA add-on calculation (30 EUR × participants)
- Free tickets for speakers, sponsors, orga team
- Price mismatch detection
- Capacity enforcement
- Complete audit trail

---

### 3. [API_ENDPOINTS.md](./API_ENDPOINTS.md)
**Purpose:** API specification for frontend integration

**Endpoints:**

**Events:**
- `GET /events` - List published events
- `GET /events/:eventId` - Get single event
- `GET /events/:eventId/products` - Get registration categories

**Forms:**
- `GET /forms/public/:formId` - Get form schema (public)

**Workflows:**
- `POST /workflows/trigger` - Submit registration

**Tickets:**
- `GET /tickets/:ticketId` - Get ticket details
- `GET /tickets/:ticketId/verify` - Verify QR code

**Features:**
- Rate limiting (10 req/min for registration)
- CORS configuration
- Error codes and handling
- Frontend integration examples

---

### 4. [BACKEND_SETUP_GUIDE.md](./BACKEND_SETUP_GUIDE.md)
**Purpose:** Step-by-step setup instructions

**Setup Steps:**
1. Create Event object
2. Create 6 Product objects
3. Create Form object (optional)
4. Verify object links
5. Create workflow with 11 behaviors
6. Create email templates
7. Test workflow
8. Verify setup

**Includes:**
- Complete configuration code for all objects
- Email template HTML
- Test cases
- Troubleshooting guide
- Verification checklist

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                             │
│  Next.js App (haffnet.de)                                   │
│  - Event listing page (/events)                             │
│  - Event detail page (/events/haffsymposium)               │
│  - Registration form (/events/haffsymposium/register)      │
│  - Confirmation page (/bestaetigung)                        │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      │ API Calls
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                      API LAYER                               │
│  /api/v1/events/:eventId                                    │
│  /api/v1/events/:eventId/products                           │
│  /api/v1/workflows/trigger                                  │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      │ Convex Queries/Mutations
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                  CONVEX BACKEND                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Ontology Tables                                      │  │
│  │  - objects (events, products, tickets, forms, etc.)  │  │
│  │  - objectLinks (relationships)                        │  │
│  │  - objectActions (audit trail)                        │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Ontology Functions                                   │  │
│  │  - eventOntology.ts (event CRUD)                     │  │
│  │  - productOntology.ts (product CRUD)                 │  │
│  │  - formsOntology.ts (form CRUD)                      │  │
│  │  - ticketOntology.ts (ticket CRUD)                   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Workflow Engine                                      │  │
│  │  Trigger: event_registration_complete                │  │
│  │                                                        │  │
│  │  Behaviors (11):                                      │  │
│  │  1. Validate → 2. Check Capacity → 3. Calculate      │  │
│  │  4. Billing → 5. Contact → 6. Ticket                 │  │
│  │  7. Form Response → 8. Invoice → 9. Email            │  │
│  │  10. Stats → 11. Admin Notify                        │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      │ External Services
                      ▼
┌─────────────────────────────────────────────────────────────┐
│               EXTERNAL SERVICES                              │
│  - Stripe (payment processing)                              │
│  - Email Service (SendGrid/AWS SES)                         │
│  - QR Code Generator                                        │
│  - PDF Generator (ticket PDFs)                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Model

### Objects Table

```typescript
// Event
{
  _id: "event_haffsymposium_2024",
  type: "event",
  subtype: "symposium",
  name: "8. HaffSymposium der Sportmedizin",
  customProperties: { startDate, endDate, location, ... }
}

// Products (6 total)
{
  _id: "product_external_2024",
  type: "product",
  subtype: "ticket",
  name: "HaffSymposium 2024 - Externer Teilnehmer",
  customProperties: { price: 15000, categoryCode: "external", addons: [...] }
}

// Ticket (created during registration)
{
  _id: "ticket_12345",
  type: "ticket",
  name: "HaffSymposium 2024 - Max Mustermann",
  customProperties: { productId, holderName, qrCode, registrationData, ... }
}

// Form (optional)
{
  _id: "form_haffsymposium_2024",
  type: "form",
  subtype: "registration",
  customProperties: { formSchema: { fields: [...] } }
}

// Form Response (audit trail)
{
  _id: "response_67890",
  type: "formResponse",
  customProperties: { formId, responses, calculatedPricing, ... }
}

// Contact (CRM)
{
  _id: "contact_11111",
  type: "crm_contact",
  customProperties: { email, firstName, lastName, ... }
}

// Invoice (if employer billing)
{
  _id: "invoice_22222",
  type: "invoice",
  customProperties: { billTo, lineItems, total, ... }
}
```

### Object Links Table

```typescript
// Event offers Products
{ fromObjectId: "event_xxx", toObjectId: "product_xxx", linkType: "offers" }

// Ticket linked to Product
{ fromObjectId: "ticket_xxx", toObjectId: "product_xxx", linkType: "issued_from" }

// Ticket admits to Event
{ fromObjectId: "ticket_xxx", toObjectId: "event_xxx", linkType: "admits_to" }

// Contact registered for Event
{ fromObjectId: "contact_xxx", toObjectId: "event_xxx", linkType: "registered_for" }

// Form for Event
{ fromObjectId: "form_xxx", toObjectId: "event_xxx", linkType: "form_for" }
```

---

## Registration Flow

### Step 1: User Visits Event Page

```
Frontend: GET /api/v1/events/event_haffsymposium_2024
Backend: eventOntology.getEvent()
Returns: Event details (name, dates, location, capacity)
```

### Step 2: User Views Registration Options

```
Frontend: GET /api/v1/events/event_haffsymposium_2024/products
Backend: eventOntology.getProductsByEvent()
Returns: 6 products (registration categories with pricing)
```

### Step 3: User Selects Category & Fills Form

```
Frontend: React form (custom or fetched from backend)
User selects: "External Participant" + 2 UCRA participants
Frontend calculates: 15000 + (2 × 3000) = 21000 cents
```

### Step 4: User Submits Payment (if needed)

```
Frontend: Stripe.js creates payment intent
Stripe: Returns payment intent ID
Frontend: Stores payment intent ID
```

### Step 5: Frontend Submits Registration

```
Frontend: POST /api/v1/workflows/trigger
Body: {
  trigger: "event_registration_complete",
  inputData: {
    eventId, productId, customerData, formResponses, transactionData
  }
}
```

### Step 6: Backend Workflow Executes

```
Behavior 1: Validate data ✓
Behavior 2: Check capacity ✓
Behavior 3: Verify price calculation ✓
Behavior 4: Detect billing method ✓
Behavior 5: Create/update contact ✓
Behavior 6: Create ticket with QR code ✓
Behavior 7: Store form response ✓
Behavior 8: Generate invoice (if employer) ✓
Behavior 9: Send confirmation email ✓
Behavior 10: Update statistics ✓
Behavior 11: Notify admin ✓
```

### Step 7: Frontend Receives Response

```
Backend returns: {
  status: "success",
  data: {
    ticketId,
    ticketNumber,
    confirmationUrl: "/bestaetigung?ticket=xxx"
  }
}

Frontend: Redirects to confirmation page
```

### Step 8: User Sees Confirmation

```
Frontend: GET /api/v1/tickets/:ticketId
Backend: ticketOntology.getTicket()
Displays: Ticket details, QR code, event info
Email: Confirmation email with PDF ticket
```

---

## Pricing Logic

### External Participant

```
Base price: 150.00 EUR
UCRA (2 people): 60.00 EUR
Total: 210.00 EUR (21000 cents)
Billing: Customer pays via Stripe
```

### AMEOS Employee

```
Base price: 0.00 EUR (free for employee)
UCRA (1 person): 30.00 EUR
Total: 30.00 EUR (3000 cents)
Billing: Invoice sent to AMEOS Klinikum
```

### HaffNet Member

```
Base price: 100.00 EUR
UCRA (0 people): 0.00 EUR
Total: 100.00 EUR (10000 cents)
Billing: Customer pays via Stripe
```

### Speaker/Sponsor/Orga

```
Base price: 0.00 EUR
UCRA: Not available
Total: 0.00 EUR (free)
Billing: None
```

---

## Employer Billing Logic

### Trigger Condition

```typescript
if (product.customProperties.invoiceConfig !== undefined) {
  // Get employer from mapping
  const employerName =
    product.customProperties.invoiceConfig.employerMapping[attendee_category];

  if (employerName) {
    billingMethod = "employer_invoice";
    // Generate invoice for employer
  }
}
```

### AMEOS Example

```typescript
// Product configuration
{
  invoiceConfig: {
    employerMapping: {
      "ameos": "AMEOS Klinikum Ueckermünde"
    },
    defaultPaymentTerms: "net30"
  }
}

// When user selects "ameos" category:
Invoice created for: AMEOS Klinikum Ueckermünde
Due date: +30 days
Line items: Base (0 EUR) + UCRA (30 EUR) = 30 EUR
```

---

## Objects Created Per Registration

For a single registration (e.g., External participant + UCRA):

1. **Contact** - CRM record
2. **Ticket** - Admission ticket with QR code
3. **Form Response** - Audit trail of submission
4. **Invoice** - If employer billing (AMEOS only)
5. **Object Links** (3-4):
   - ticket → product (issued_from)
   - ticket → event (admits_to)
   - contact → event (registered_for)
   - invoice → ticket (if employer billing)

**Total database operations:** ~15-20 (creates, updates, links)

---

## Email Templates

### Confirmation Email
- **To:** Attendee
- **Subject:** "Anmeldebestätigung - 8. HaffSymposium"
- **Contains:** Event details, ticket number, QR code, pricing
- **Attachment:** Ticket PDF

### Admin Notification
- **To:** admin@haffnet.de
- **Subject:** "New Registration: 8. HaffSymposium"
- **Contains:** Attendee info, category, payment details, current capacity

---

## Security & Validation

### Input Validation (Behavior 1)

```typescript
- eventId: required
- productId: required
- email: required, valid email format
- firstName: required, min 1 char
- lastName: required, min 1 char
- attendee_category: required, enum validation
- consent_privacy: required, must be true
- price: required, min 0
- currency: required, must be "EUR"
```

### Price Validation (Behavior 3)

```typescript
// Backend recalculates and compares
backendPrice = basePrice + (ucraParticipants × 3000)

if (backendPrice !== frontendPrice) {
  throw "Price mismatch error"
}
```

### Capacity Validation (Behavior 2)

```typescript
if (event.currentRegistrations >= event.maxCapacity) {
  throw "Event is full"
}
```

---

## Testing Checklist

### Backend Objects
- [ ] Event created with correct dates
- [ ] All 6 products created and linked
- [ ] Form created (if using backend schema)
- [ ] Object links verified

### Workflow Behaviors
- [ ] Validation works (reject invalid data)
- [ ] Capacity check works (reject when full)
- [ ] Price calculation matches frontend
- [ ] Employer billing triggers for AMEOS
- [ ] Contact created/updated
- [ ] Ticket generated with QR code
- [ ] Form response stored
- [ ] Invoice created for employer billing
- [ ] Emails sent (confirmation + admin)
- [ ] Statistics updated

### Edge Cases
- [ ] Duplicate email (update existing contact)
- [ ] Event at capacity (reject registration)
- [ ] Price mismatch (reject with error)
- [ ] Invalid category (validation error)
- [ ] Missing required fields (validation error)
- [ ] Free tickets (no payment required)
- [ ] UCRA addon (price calculation)

---

## Performance Considerations

### Database Queries
- Event fetch: 1 query
- Products fetch: 1 query (with event link filter)
- Registration workflow: ~15-20 operations
- Average response time: < 500ms

### Optimization
- Index on `by_org_type` for fast object queries
- Index on `by_from_link_type` for fast link queries
- Async workflow execution (doesn't block response)
- Email sending queued (doesn't block workflow)

---

## Monitoring & Logging

### Key Metrics to Track
- Total registrations per day
- Category distribution (external vs AMEOS vs HaffNet)
- Revenue by category
- Capacity utilization
- UCRA addon uptake
- Employer billing count
- Email delivery rate
- Workflow execution time
- Error rate by behavior

### Alerts
- Event capacity at 90%
- Workflow failure rate > 5%
- Email delivery failure
- Price mismatch detected
- Payment processing failure

---

## Next Steps for Frontend

Now that backend is documented, you can:

1. **Create Event Listing Page** (`/events`)
   - Fetch events: `GET /api/v1/events`
   - Display upcoming events
   - Link to event details

2. **Create Event Detail Page** (`/events/haffsymposium`)
   - Fetch event: `GET /api/v1/events/:eventId`
   - Fetch products: `GET /api/v1/events/:eventId/products`
   - Show event info, pricing, register button

3. **Create Registration Form** (`/events/haffsymposium/register`)
   - Build React form (personal info, category, UCRA)
   - Calculate price dynamically
   - Integrate Stripe.js (if payment needed)
   - Submit: `POST /api/v1/workflows/trigger`

4. **Create Confirmation Page** (`/bestaetigung`)
   - Fetch ticket: `GET /api/v1/tickets/:ticketId`
   - Display ticket, QR code, event details
   - Download PDF option

---

## Questions?

Refer to these docs:
- **Architecture:** [BACKEND_ONTOLOGY_STRUCTURE.md](./BACKEND_ONTOLOGY_STRUCTURE.md)
- **Workflow:** [WORKFLOW_CONFIGURATION.md](./WORKFLOW_CONFIGURATION.md)
- **API:** [API_ENDPOINTS.md](./API_ENDPOINTS.md)
- **Setup:** [BACKEND_SETUP_GUIDE.md](./BACKEND_SETUP_GUIDE.md)

**Ready to wire up the frontend!** 🚀
