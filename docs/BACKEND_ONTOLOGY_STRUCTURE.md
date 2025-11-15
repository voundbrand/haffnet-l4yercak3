# Backend Ontology Structure - HaffSymposium Event

## Understanding Your Backend Architecture

Your backend uses an **ontology-based system** where everything is stored in the universal `objects` table.

### Key Concepts:

1. **Events** → `type: "event"`, `subtype: "symposium"` (stored in `objects` table)
2. **Products** → `type: "product"`, `subtype: "ticket"` (stored in `objects` table)
3. **Tickets** → `type: "ticket"` (instances of products, stored in `objects` table)
4. **Links** → Relationships between objects (stored in `objectLinks` table)

---

## HaffSymposium Structure

### 1. Create Event Object

**Type:** `event`
**Subtype:** `symposium`

```typescript
// Create event using eventOntology.createEvent
{
  organizationId: "your_org_id",
  subtype: "symposium",
  name: "8. HaffSymposium der Sportmedizin",
  description: "Das 8. HaffSymposium der Sportmedizin findet am 31. Mai und 1. Juni 2024 in Ueckermünde statt.",

  startDate: 1717142400000, // 2024-05-31 09:00:00 (Unix timestamp)
  endDate: 1717264800000,   // 2024-06-01 18:00:00
  location: "Ueckermünde",

  customProperties: {
    startDate: 1717142400000,
    endDate: 1717264800000,
    location: "Ueckermünde",
    venue: "Bürgersaal",
    timezone: "Europe/Berlin",
    maxCapacity: 200,
    currentRegistrations: 0,

    // Event-specific data
    address: {
      street: "Am Markt 1",
      city: "Ueckermünde",
      postalCode: "17373",
      country: "Deutschland"
    },

    // Registration configuration
    registration: {
      enabled: true,
      openDate: 1705276800000, // 2024-01-15
      closeDate: 1716681600000, // 2024-05-25
    }
  }
}
```

**Result:** Event object with `_id: "event_haffsymposium_2024"`

---

### 2. Create Product Objects (Registration Categories)

Each attendee category is a **separate product** with `subtype: "ticket"`.

#### Product 1: External Participant

```typescript
// Create using productOntology.createProduct
{
  organizationId: "your_org_id",
  subtype: "ticket",
  name: "HaffSymposium 2024 - Externer Teilnehmer",
  description: "Teilnahmegebühr für externe Teilnehmer",

  price: 15000, // 150.00 EUR in cents
  currency: "EUR",
  inventory: null, // Unlimited

  eventId: "event_haffsymposium_2024", // Link to event

  customProperties: {
    price: 15000,
    currency: "EUR",
    sold: 0,
    categoryCode: "external", // For behavior matching
    categoryLabel: "Externer Teilnehmer",

    // Add-ons specific to this category
    addons: [
      {
        id: "ucra_boat_trip",
        name: "UCRA Abendveranstaltung",
        pricePerPerson: 3000, // 30.00 EUR
        maxQuantity: 2
      }
    ]
  }
}
```

**Result:** Product object with `_id: "product_external_2024"`

#### Product 2: AMEOS Employee

```typescript
{
  organizationId: "your_org_id",
  subtype: "ticket",
  name: "HaffSymposium 2024 - AMEOS Mitarbeiter",
  description: "Kostenlose Teilnahme für AMEOS Mitarbeiter (Arbeitgeber zahlt)",

  price: 0, // Free for employee
  currency: "EUR",
  inventory: null,

  eventId: "event_haffsymposium_2024",

  customProperties: {
    price: 0,
    currency: "EUR",
    sold: 0,
    categoryCode: "ameos",
    categoryLabel: "AMEOS Mitarbeiter",

    // Employer billing configuration
    invoiceConfig: {
      employerSourceField: "attendee_category",
      employerMapping: {
        "ameos": "AMEOS Klinikum Ueckermünde" // Invoice this org
      },
      defaultPaymentTerms: "net30"
    },

    addons: [
      {
        id: "ucra_boat_trip",
        name: "UCRA Abendveranstaltung",
        pricePerPerson: 3000, // Employer also pays for boat trip
        maxQuantity: 2
      }
    ]
  }
}
```

**Result:** Product object with `_id: "product_ameos_2024"`

#### Product 3-6: HaffNet Member, Speaker, Sponsor, Orga Team

```typescript
// Repeat for each category with appropriate pricing:

// HaffNet Member
{ price: 10000 /* 100 EUR */, categoryCode: "haffnet" }

// Speaker
{ price: 0, categoryCode: "speaker" }

// Sponsor
{ price: 0, categoryCode: "sponsor" }

// Orga Team
{ price: 0, categoryCode: "orga" }
```

---

### 3. Object Links (Relationships)

When you create products with `eventId`, the system automatically creates:

```
event_haffsymposium_2024 --[offers]--> product_external_2024
event_haffsymposium_2024 --[offers]--> product_ameos_2024
event_haffsymposium_2024 --[offers]--> product_haffnet_2024
event_haffsymposium_2024 --[offers]--> product_speaker_2024
event_haffsymposium_2024 --[offers]--> product_sponsor_2024
event_haffsymposium_2024 --[offers]--> product_orga_2024
```

**Link Type:** `"offers"` (event offers these products)

---

### 4. When User Registers

**Frontend sends:**
```typescript
{
  trigger: "event_registration_complete",
  inputData: {
    eventType: "haffsymposium_registration",
    eventId: "event_haffsymposium_2024",

    customerData: {
      email: "dr.mueller@ameos.de",
      firstName: "Hans",
      lastName: "Mueller"
    },

    formResponses: {
      attendee_category: "ameos", // Match categoryCode
      ucra_participants: 2
    },

    transactionData: {
      productId: "product_ameos_2024", // Selected product
      price: 6000, // 0 (base) + 60 (2 × UCRA)
      currency: "EUR"
    }
  }
}
```

**Backend workflow creates:**

1. **Contact** (CRM object)
```typescript
type: "crm_contact"
customProperties: { email, name, etc. }
```

2. **Ticket** (using ticketOntology.createTicketInternal)
```typescript
type: "ticket"
customProperties: {
  productId: "product_ameos_2024",
  holderName: "Hans Mueller",
  holderEmail: "dr.mueller@ameos.de",
  purchaseDate: Date.now()
}
```

3. **Object Links:**
```
ticket --[issued_from]--> product_ameos_2024
ticket --[admits_to]--> event_haffsymposium_2024
contact --[registered_for]--> event_haffsymposium_2024
```

4. **Invoice**
```typescript
type: "invoice"
customProperties: {
  recipientOrganization: "AMEOS Klinikum Ueckermünde",
  totalAmount: 6000, // UCRA addon only
  paymentTerms: "net30"
}
```

---

## API Endpoints You'll Use

### Get Event
```typescript
GET /api/v1/events/{eventId}

// Uses: eventOntology.getEvent
// Returns: Event object with customProperties
```

### Get Products for Event
```typescript
GET /api/v1/events/{eventId}/products

// Uses: eventOntology.getProductsByEvent
// Returns: Array of product objects linked to event
```

### Submit Registration
```typescript
POST /api/v1/workflows/trigger
Body: { trigger: "event_registration_complete", inputData: {...} }

// Workflow behaviors create:
// - Contact (CRM)
// - Ticket
// - Invoice (if needed)
// - Sends emails
```

---

## How Categories Work

Instead of storing categories in the event object, **each category is a separate product**:

```
Event: "HaffSymposium 2024"
   │
   ├─ offers → Product: "External Participant" (price: 150 EUR)
   ├─ offers → Product: "AMEOS Employee" (price: 0 EUR, employer billing)
   ├─ offers → Product: "HaffNet Member" (price: 100 EUR)
   ├─ offers → Product: "Speaker" (price: 0 EUR)
   ├─ offers → Product: "Sponsor" (price: 0 EUR)
   └─ offers → Product: "Orga Team" (price: 0 EUR)
```

**Frontend displays:**
1. Fetch event → Get event name, dates, description
2. Fetch products → Get all registration categories with prices
3. User selects product → Submit registration with `productId`

---

## Summary: Data Structure

```typescript
// Objects Table
{
  _id: "event_haffsymposium_2024",
  type: "event",
  subtype: "symposium",
  name: "8. HaffSymposium der Sportmedizin",
  customProperties: { startDate, endDate, location, ... }
}

{
  _id: "product_external_2024",
  type: "product",
  subtype: "ticket",
  name: "HaffSymposium 2024 - Externer Teilnehmer",
  customProperties: { price: 15000, categoryCode: "external", addons: [...] }
}

{
  _id: "ticket_12345",
  type: "ticket",
  name: "HaffSymposium 2024 - Hans Mueller",
  customProperties: { productId: "product_ameos_2024", holderName: "Hans Mueller" }
}

// ObjectLinks Table
{
  fromObjectId: "event_haffsymposium_2024",
  toObjectId: "product_external_2024",
  linkType: "offers"
}

{
  fromObjectId: "ticket_12345",
  toObjectId: "product_ameos_2024",
  linkType: "issued_from"
}

{
  fromObjectId: "ticket_12345",
  toObjectId: "event_haffsymposium_2024",
  linkType: "admits_to"
}
```

---

---

## 5. Forms Integration (Registration Form Schema)

You can optionally store the registration form schema in the backend as a `form` object.

### Option A: Store Form Schema in Backend

**Benefits:**
- Reusable across multiple events
- Can be edited via admin panel
- Frontend fetches schema dynamically
- Validation rules stored centrally

```typescript
// Create form using formsOntology.createForm
{
  organizationId: "your_org_id",
  subtype: "registration",
  name: "HaffSymposium 2024 Registration Form",
  description: "Registration form for HaffSymposium event",

  eventId: "event_haffsymposium_2024", // Link to event

  formSchema: {
    version: "1.0",
    fields: [
      {
        id: "attendee_category",
        type: "select",
        label: "Teilnehmerkategorie",
        required: true,
        options: [
          { value: "external", label: "Externer Teilnehmer" },
          { value: "ameos", label: "AMEOS Mitarbeiter" },
          { value: "haffnet", label: "HaffNet-Mitglied" },
          { value: "speaker", label: "Referent" },
          { value: "sponsor", label: "Sponsor" },
          { value: "orga", label: "Orga-Team" }
        ]
      },
      {
        id: "first_name",
        type: "text",
        label: "Vorname",
        required: true
      },
      {
        id: "last_name",
        type: "text",
        label: "Nachname",
        required: true
      },
      {
        id: "email",
        type: "email",
        label: "E-Mail",
        required: true
      },
      {
        id: "ucra_participants",
        type: "number",
        label: "UCRA Abendveranstaltung - Anzahl Personen",
        required: false,
        min: 0,
        max: 2,
        conditionalLogic: {
          show: {
            field: "attendee_category",
            operator: "in",
            value: ["external", "ameos", "haffnet"]
          }
        }
      }
      // ... more fields
    ],
    settings: {
      allowMultipleSubmissions: false,
      showProgressBar: true,
      submitButtonText: "Jetzt anmelden",
      successMessage: "Vielen Dank für Ihre Anmeldung!",
      redirectUrl: "/bestaetigung"
    }
  }
}
```

**Result:** Form object with `_id: "form_haffsymposium_2024"`

**Object Link:**
```
form_haffsymposium_2024 --[form_for]--> event_haffsymposium_2024
```

**Frontend fetches form:**
```typescript
// GET /api/v1/forms/public/{formId}
// Uses: formsOntology.getPublicForm
const form = await fetch(`/api/v1/forms/public/form_haffsymposium_2024`);
```

### Option B: Build Form Directly in React

**Benefits:**
- Full UI control
- Custom validation
- Easier conditional logic
- No backend schema needed

```typescript
// Frontend: src/app/events/[id]/register/page.tsx
export default function RegisterPage() {
  return (
    <form onSubmit={handleSubmit}>
      <select name="attendee_category" required>
        <option value="external">Externer Teilnehmer</option>
        <option value="ameos">AMEOS Mitarbeiter</option>
        {/* ... */}
      </select>

      <input type="text" name="first_name" required />
      <input type="text" name="last_name" required />
      <input type="email" name="email" required />

      {/* Submit to workflow */}
    </form>
  );
}
```

### Recommended Approach: Hybrid

**Best of both worlds:**
1. **Store basic form metadata** in backend (form exists, status, settings)
2. **Build custom React form** for full UI control
3. **Submit to workflow** with both form responses and selected product

**Why?**
- Allows backend to track which events have registration forms
- Gives admin panel visibility into form stats (submissions, completion rate)
- Frontend still has full control over rendering and UX
- Form responses stored as audit trail via `createFormResponse`

---

## Complete Integration Flow

### Step 1: Create Backend Objects

```typescript
// 1. Event
eventOntology.createEvent({ ... })
→ event_haffsymposium_2024

// 2. Products (6 categories)
productOntology.createProduct({ eventId: "event_haffsymposium_2024", ... })
→ product_external_2024, product_ameos_2024, etc.

// 3. Form (optional)
formsOntology.createForm({ eventId: "event_haffsymposium_2024", ... })
→ form_haffsymposium_2024
```

**Object Links Created:**
```
event --[offers]--> product_external
event --[offers]--> product_ameos
event --[offers]--> product_haffnet
event --[offers]--> product_speaker
event --[offers]--> product_sponsor
event --[offers]--> product_orga
form --[form_for]--> event
```

### Step 2: Frontend Registration Flow

```typescript
// User visits /events/haffsymposium/register

// 1. Fetch event
GET /api/v1/events/event_haffsymposium_2024
→ { name, dates, location, description }

// 2. Fetch products (categories)
GET /api/v1/events/event_haffsymposium_2024/products
→ [
  { _id: "product_external_2024", name: "External", price: 15000 },
  { _id: "product_ameos_2024", name: "AMEOS", price: 0 },
  ...
]

// 3. Fetch form schema (optional)
GET /api/v1/forms/public/form_haffsymposium_2024
→ { formSchema: { fields: [...] } }

// 4. User fills form and selects category
// 5. User selects addons (UCRA boat trip)
// 6. Frontend calculates total price

// 7. Submit registration
POST /api/v1/workflows/trigger
{
  trigger: "event_registration_complete",
  inputData: {
    eventId: "event_haffsymposium_2024",
    productId: "product_ameos_2024", // Selected category

    formResponses: {
      attendee_category: "ameos",
      first_name: "Hans",
      last_name: "Mueller",
      email: "dr.mueller@ameos.de",
      ucra_participants: 2
    },

    transactionData: {
      productId: "product_ameos_2024",
      price: 6000, // Calculated: 0 (base) + 6000 (2 × UCRA)
      currency: "EUR"
    }
  }
}
```

### Step 3: Backend Workflow Execution

**Workflow behaviors execute:**
1. Create CRM contact
2. Create ticket (linked to product and event)
3. Create form response (audit trail)
4. Generate invoice (if employer billing)
5. Send confirmation email
6. Update product sold count
7. Update event registration count

**Objects Created:**
```typescript
// Ticket
{
  _id: "ticket_12345",
  type: "ticket",
  customProperties: {
    productId: "product_ameos_2024",
    holderName: "Hans Mueller",
    holderEmail: "dr.mueller@ameos.de",
    registrationData: { /* form responses embedded */ }
  }
}

// Form Response (audit trail)
{
  _id: "response_67890",
  type: "formResponse",
  customProperties: {
    formId: "form_haffsymposium_2024",
    responses: { first_name: "Hans", ... },
    submittedAt: 1234567890
  }
}
```

**Links Created:**
```
ticket --[issued_from]--> product_ameos_2024
ticket --[admits_to]--> event_haffsymposium_2024
contact --[registered_for]--> event_haffsymposium_2024
```

---

## Next Steps

1. **Create event object** using `eventOntology.createEvent`
2. **Create 6 product objects** (one per category) using `productOntology.createProduct`
3. **Create form object** (optional) using `formsOntology.createForm`
4. **Configure workflow** for `trigger: "event_registration_complete"`
5. **Build frontend** to display event → products → registration form

**This is how Forms, Products, and Events work together!**
