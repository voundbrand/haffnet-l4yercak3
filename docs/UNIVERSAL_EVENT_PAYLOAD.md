# Universal Event Payload - The One Object to Rule Them All

## Philosophy

Instead of having different API endpoints for different actions, we have **ONE payload structure** that works for everything. The backend interprets it based on context.

## The Universal Payload Structure

```typescript
interface UniversalEventPayload {
  // TIER 1: Event Classification
  trigger: string;              // What action triggers this?
  inputData: {
    eventType: string;          // What type of event is this?
    eventId: string;            // Which specific event/product?
    source: string;             // Where did this come from?

    // TIER 2: Customer/User Data
    customerData?: {
      // Identity
      email: string;
      firstName?: string;
      lastName?: string;
      title?: string;
      phone?: string;

      // Organization
      organization?: string;
      jobTitle?: string;
      department?: string;

      // Address
      address?: {
        street?: string;
        city?: string;
        state?: string;
        zip?: string;
        country?: string;
      };

      // Social/External IDs
      externalIds?: {
        crmId?: string;
        memberNumber?: string;
        customerId?: string;
      };
    };

    // TIER 3: Form/Input Data
    formResponses?: {
      // Any form field data
      [key: string]: any;
    };

    // TIER 4: Transaction/Commerce Data
    transactionData?: {
      productId: string;
      productName: string;
      price: number;
      currency: string;
      quantity?: number;

      addons?: Array<{
        id: string;
        name: string;
        price: number;
      }>;

      discounts?: Array<{
        code: string;
        amount: number;
      }>;

      paymentMethod?: string;
      paymentStatus?: string;
    };

    // TIER 5: Metadata & Context
    metadata?: {
      // Source tracking
      referralSource?: string;
      campaignId?: string;
      affiliateId?: string;

      // Technical context
      userAgent?: string;
      ipAddress?: string;
      deviceType?: string;

      // Temporal context
      locale?: string;
      timezone?: string;
      registeredAt?: string;

      // Custom fields
      [key: string]: any;
    };
  };

  // OPTIONAL: Async callback
  webhookUrl?: string;
}
```

---

## Real-World Examples

### Example 1: Seminar Registration (Medical Education)

```json
{
  "trigger": "registration_complete",
  "inputData": {
    "eventType": "cme_seminar_registration",
    "eventId": "sem_kardiologie_2025_06",
    "source": "haffnet_website",

    "customerData": {
      "email": "dr.schmidt@uniklinik-hamburg.de",
      "firstName": "Anna",
      "lastName": "Schmidt",
      "title": "PD Dr. med.",
      "phone": "+49 40 7410-0",
      "organization": "Universitätsklinikum Hamburg",
      "jobTitle": "Oberärztin Kardiologie",
      "department": "Kardiologie",

      "address": {
        "street": "Martinistraße 52",
        "city": "Hamburg",
        "zip": "20246",
        "country": "Germany"
      },

      "externalIds": {
        "licenseNumber": "DE-HH-12345"
      }
    },

    "formResponses": {
      "specialty": "Kardiologie",
      "subspecialty": "Interventionelle Kardiologie",
      "yearsOfExperience": 15,
      "dietaryPreferences": ["vegetarian", "gluten-free"],
      "accommodationNeeded": true,
      "arrivalDate": "2025-06-14",
      "departureDate": "2025-06-17",
      "roomType": "single",
      "specialRequests": "Erdgeschoss bevorzugt",
      "cmePointsRequired": true,
      "certificateDelivery": "email",
      "emergencyContact": {
        "name": "Dr. Thomas Schmidt",
        "phone": "+49 40 1234567",
        "relationship": "Ehepartner"
      }
    },

    "transactionData": {
      "productId": "prod_kardiologie_update_2025",
      "productName": "Kardiologie Update 2025 - 3 Tage CME-Fortbildung",
      "price": 599.00,
      "currency": "EUR",
      "quantity": 1,

      "addons": [
        {
          "id": "addon_hotel_3nights",
          "name": "Hotel Package 3 Nächte",
          "price": 450.00
        },
        {
          "id": "addon_dinner_gala",
          "name": "Gala Dinner",
          "price": 89.00
        }
      ],

      "discounts": [
        {
          "code": "EARLYBIRD2025",
          "amount": -50.00
        }
      ],

      "paymentMethod": "invoice",
      "paymentStatus": "pending"
    },

    "metadata": {
      "referralSource": "google_ads",
      "campaignId": "cme_spring_2025",
      "utm_source": "google",
      "utm_medium": "cpc",
      "utm_campaign": "kardiologie_2025",
      "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      "ipAddress": "192.168.1.1",
      "deviceType": "desktop",
      "locale": "de-DE",
      "timezone": "Europe/Berlin",
      "registeredAt": "2025-11-03T14:30:00+01:00",
      "pageReferrer": "https://google.com/search?q=kardiologie+fortbildung",
      "sessionDuration": 420
    }
  }
}
```

**Backend Actions Triggered:**
1. Detect employer (Universitätsklinikum Hamburg)
2. Map invoice to employer billing address
3. Generate consolidated invoice
4. Create CME certificate
5. Send confirmation email to doctor
6. Send billing email to hospital admin
7. Create ticket with QR code
8. Add to CRM as contact
9. Link contact to organization (hospital)

---

### Example 2: BNI Chapter Meeting RSVP

```json
{
  "trigger": "rsvp_submit",
  "inputData": {
    "eventType": "chapter_meeting_rsvp",
    "eventId": "meeting_bni_mv_2025_11_15",
    "source": "bni_network_website",

    "customerData": {
      "email": "mueller@example-gmbh.de",
      "firstName": "Hans",
      "lastName": "Müller",
      "organization": "Example GmbH",
      "jobTitle": "Geschäftsführer",

      "externalIds": {
        "memberNumber": "BNI-MV-1234",
        "companyId": "DE123456789"
      }
    },

    "formResponses": {
      "attending": "yes",
      "guestCount": 2,
      "guestNames": ["Maria Schmidt", "Thomas Weber"],
      "guestCompanies": ["Schmidt Consulting", "Weber IT Services"],
      "mealPreference": "standard",
      "dietaryRestrictions": [],
      "visitorsInterested": true,
      "bringingVisitors": false
    },

    "transactionData": {
      "productId": "prod_chapter_meeting",
      "productName": "Chapter Meeting November 2025",
      "price": 0.00,
      "currency": "EUR",
      "quantity": 3
    },

    "metadata": {
      "rsvpDeadline": "2025-11-13T23:59:59+01:00",
      "registeredAt": "2025-11-03T09:15:00+01:00",
      "locale": "de-DE"
    }
  }
}
```

**Backend Actions Triggered:**
1. Update member attendance record
2. Add guests to attendance list
3. Send RSVP confirmation email
4. Notify chapter president of guest count
5. Update catering numbers

---

### Example 3: Wedding RSVP

```json
{
  "trigger": "rsvp_submit",
  "inputData": {
    "eventType": "wedding_rsvp",
    "eventId": "wedding_sarah_john_2025",
    "source": "party_rsvp_website",

    "customerData": {
      "email": "maria.schmidt@gmail.com",
      "firstName": "Maria",
      "lastName": "Schmidt"
    },

    "formResponses": {
      "attending": "yes",
      "attendanceType": "ceremony_and_reception",
      "plusOne": true,
      "plusOneName": "Thomas Schmidt",
      "dietaryRestrictions": {
        "primary": ["vegetarian"],
        "plusOne": ["gluten-free"]
      },
      "songRequest": "Dancing Queen - ABBA",
      "messageForCouple": "So excited to celebrate with you!",
      "needsAccommodation": true,
      "arrivalDate": "2025-06-13",
      "departureDate": "2025-06-15",
      "willAttendRehearsalDinner": false,
      "relationshipToCouple": "College friend of bride"
    },

    "metadata": {
      "invitationCode": "INV-2025-142",
      "rsvpDeadline": "2025-04-01T23:59:59+01:00",
      "registeredAt": "2025-11-03T19:45:00+01:00"
    }
  }
}
```

**Backend Actions Triggered:**
1. Update guest list
2. Add song to playlist
3. Send RSVP confirmation email
4. Update seating chart data
5. Update catering count
6. Send accommodation info

---

### Example 4: Newsletter Subscription

```json
{
  "trigger": "subscription_request",
  "inputData": {
    "eventType": "newsletter_subscription",
    "eventId": "newsletter_cme_monthly",
    "source": "haffnet_website",

    "customerData": {
      "email": "dr.weber@praxis-weber.de",
      "firstName": "Michael",
      "lastName": "Weber",
      "title": "Dr. med."
    },

    "formResponses": {
      "interests": ["kardiologie", "innere-medizin"],
      "frequency": "monthly",
      "preferredLanguage": "de",
      "gdprConsent": true,
      "consentDate": "2025-11-03T10:30:00+01:00"
    },

    "metadata": {
      "signupSource": "footer_form",
      "referrer": "https://google.com",
      "locale": "de-DE",
      "registeredAt": "2025-11-03T10:30:15+01:00"
    }
  }
}
```

**Backend Actions Triggered:**
1. Create/update contact
2. Add to newsletter list
3. Tag with interests
4. Send welcome email
5. Add to CRM segment

---

## Key Principles

### 1. **Nested Structure for Clarity**

```
Root Level:        trigger, inputData
Tier 1:            eventType, eventId, source
Tier 2:            customerData, formResponses, transactionData, metadata
```

### 2. **Optional Everything**

Only `trigger` and `inputData` are required. Everything else is optional and depends on the event type.

### 3. **Extensible**

Add custom fields anywhere:

```json
{
  "inputData": {
    "customFields": {
      "internalCaseNumber": "CASE-2025-001",
      "assignedSalesRep": "user_abc123"
    }
  }
}
```

### 4. **Source Tracking**

Always include `source` to know where the event came from:

- `"haffnet_website"`
- `"ios_app"`
- `"android_app"`
- `"bni_network_website"`
- `"admin_panel"`
- `"api_integration"`

### 5. **Event Type Naming Convention**

Use `noun_verb` pattern:

- `seminar_registration`
- `meeting_rsvp`
- `newsletter_subscription`
- `contact_inquiry`
- `payment_completed`

---

## Common Fields Reference

### Customer Data Fields

```typescript
customerData: {
  // Identity (required)
  email: string;

  // Personal (optional)
  firstName?: string;
  lastName?: string;
  title?: string;          // "Dr.", "Prof.", "Mr.", "Ms."
  phone?: string;
  dateOfBirth?: string;    // ISO 8601
  gender?: string;

  // Professional (optional)
  organization?: string;
  jobTitle?: string;
  department?: string;
  industry?: string;

  // Address (optional)
  address?: {
    street?: string;
    street2?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;      // ISO 3166-1 alpha-2
  };

  // External IDs (optional)
  externalIds?: {
    customerId?: string;
    memberNumber?: string;
    licenseNumber?: string;
    employeeId?: string;
    crmId?: string;
  };
}
```

### Transaction Data Fields

```typescript
transactionData: {
  // Product (required)
  productId: string;
  productName: string;
  price: number;
  currency: string;        // ISO 4217 (EUR, USD, GBP)

  // Quantity (optional)
  quantity?: number;

  // Add-ons (optional)
  addons?: Array<{
    id: string;
    name: string;
    price: number;
    quantity?: number;
  }>;

  // Discounts (optional)
  discounts?: Array<{
    code?: string;
    type: "percentage" | "fixed";
    amount: number;
    reason?: string;
  }>;

  // Payment (optional)
  paymentMethod?: "stripe" | "invoice" | "bank_transfer" | "paypal";
  paymentStatus?: "pending" | "completed" | "failed";
  paymentId?: string;

  // Totals (optional)
  subtotal?: number;
  tax?: number;
  total?: number;
}
```

### Metadata Fields

```typescript
metadata: {
  // Marketing (optional)
  referralSource?: string;
  campaignId?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  affiliateId?: string;

  // Technical (optional)
  userAgent?: string;
  ipAddress?: string;
  deviceType?: "desktop" | "mobile" | "tablet";
  browser?: string;
  os?: string;

  // Temporal (optional)
  locale?: string;          // IETF BCP 47 (de-DE, en-US)
  timezone?: string;        // IANA (Europe/Berlin)
  registeredAt?: string;    // ISO 8601

  // Session (optional)
  sessionId?: string;
  sessionDuration?: number; // seconds
  pageViews?: number;
  pageReferrer?: string;

  // Custom (anything!)
  [key: string]: any;
}
```

---

## Validation Rules

### Backend Validation

The backend validates:

1. **Required fields** per trigger type
2. **Email format** in customerData
3. **Price/currency** format in transactionData
4. **Date formats** (ISO 8601)
5. **Country codes** (ISO 3166-1)
6. **Currency codes** (ISO 4217)

### Example Validation Errors

```json
{
  "success": false,
  "errors": [
    {
      "field": "inputData.customerData.email",
      "message": "Invalid email format"
    },
    {
      "field": "inputData.transactionData.currency",
      "message": "Currency must be ISO 4217 code (e.g., EUR, USD)"
    }
  ]
}
```

---

## Next Steps

See `API_SPECIFICATION.md` for:
- How to call the API
- Authentication details
- Response formats

See `FRONTEND_INTEGRATION.md` for:
- Complete code examples
- Form handling
- Error handling
