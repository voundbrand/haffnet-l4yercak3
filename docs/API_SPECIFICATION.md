# L4yerCak3 API Specification - Event-Driven Architecture

## Overview

The L4yerCak3 API provides a **universal event-driven interface** that allows frontends (web, mobile, etc.) to trigger **workflows and behaviors** in the backend.

Instead of many specific endpoints, you have **ONE powerful endpoint** that accepts different event types and triggers the appropriate workflows.

## Core Concept: Event → Workflow → Behaviors

```
Frontend Event
    ↓
API Endpoint (/api/v1/workflows/trigger)
    ↓
Workflow Executor (finds matching workflow)
    ↓
Behavior Executor (runs configured behaviors)
    ↓
Results (invoices, tickets, emails, etc.)
```

---

## 🔑 Authentication

All API requests require an API key in the Authorization header:

```http
Authorization: Bearer YOUR_API_KEY_HERE
```

**Getting an API Key:**
1. Login to L4yerCak3 admin
2. Go to Settings → API Keys
3. Create new API key for your organization
4. Copy the key (shown only once)

---

## 🎯 Main Endpoint: Trigger Workflow

### `POST /api/v1/workflows/trigger`

**Purpose**: Send an event from your frontend that triggers backend workflows.

### Request Headers

```http
Content-Type: application/json
Authorization: Bearer YOUR_API_KEY
```

### Request Body

```typescript
{
  // REQUIRED: What type of event is this?
  "trigger": string, // e.g., "form_submit", "checkout_start", "registration_complete"

  // REQUIRED: The data payload for this event
  "inputData": {
    // Universal fields (recommended for all events)
    "eventType": string,        // e.g., "seminar_registration"
    "eventId": string,           // Your frontend event/product ID
    "source": string,            // e.g., "haffnet_website", "ios_app"

    // Event-specific data
    "formResponses": object,     // Form field data
    "metadata": object,          // Additional context
    "customerData": object,      // User information
    "transactionData": object    // Payment/order details
  },

  // OPTIONAL: Callback URL for async results
  "webhookUrl": string          // e.g., "https://haffnet.de/api/webhook"
}
```

### Response

```typescript
{
  "success": boolean,
  "transactionId": string,      // Unique ID for tracking

  // Created objects (varies by workflow)
  "ticketId": string,           // If workflow creates ticket
  "invoiceId": string,          // If workflow generates invoice
  "contactId": string,          // If workflow creates/updates contact

  // Workflow execution details
  "workflowId": string,         // Which workflow was triggered
  "behaviorResults": [          // Results from each behavior
    {
      "behaviorType": string,
      "success": boolean,
      "message": string,
      "data": object
    }
  ],

  "message": string             // Human-readable result
}
```

---

## 📦 Universal Event Payload Structure

This is the **ONE object** you send from all your frontends. The backend interprets it based on the `trigger` and `eventType`.

### Example: Seminar Registration (HaffNet)

```json
{
  "trigger": "registration_complete",
  "inputData": {
    "eventType": "seminar_registration",
    "eventId": "seminar_kardiologie_2025",
    "source": "haffnet_website",

    "customerData": {
      "email": "dr.mueller@example.com",
      "firstName": "Hans",
      "lastName": "Mueller",
      "title": "Dr. med.",
      "phone": "+49 30 12345678",
      "organization": "Charité Berlin"
    },

    "formResponses": {
      "specialty": "Kardiologie",
      "licenseNumber": "DE-12345",
      "dietaryPreferences": "vegetarian",
      "hotelRequired": true,
      "arrivalDate": "2025-06-14",
      "departureDate": "2025-06-17"
    },

    "transactionData": {
      "productId": "prod_kardiologie_2025",
      "productName": "Kardiologie Update 2025",
      "price": 599.00,
      "currency": "EUR",
      "quantity": 1,
      "addons": [
        {
          "id": "addon_hotel",
          "name": "Hotel Package",
          "price": 150.00
        }
      ]
    },

    "metadata": {
      "referralSource": "newsletter",
      "campaignId": "spring_2025",
      "userAgent": "Mozilla/5.0...",
      "ipAddress": "192.168.1.1",
      "locale": "de-DE",
      "registeredAt": "2025-11-03T12:30:00Z"
    }
  }
}
```

### What Happens in Backend:

1. **Workflow Executor** finds workflow with `triggerOn: "registration_complete"`
2. **Behavior Executor** runs configured behaviors:
   - `employer-detection` - Detects if customer works at hospital
   - `invoice-mapping` - Routes invoice to employer or individual
   - `consolidated-invoice-generation` - Creates invoice
   - `email-notification` - Sends confirmation email
   - `ticket-generation` - Creates attendee ticket
3. **Results** return with invoice ID, ticket ID, etc.

---

## 🎨 Event Types by Frontend

### HaffNet Website

```typescript
// Seminar Registration
{
  "trigger": "registration_complete",
  "inputData": {
    "eventType": "seminar_registration",
    // ... customer data, form responses, transaction data
  }
}

// Contact Form
{
  "trigger": "form_submit",
  "inputData": {
    "eventType": "contact_inquiry",
    "formResponses": {
      "subject": "Question about CME points",
      "message": "..."
    }
  }
}

// Newsletter Signup
{
  "trigger": "subscription_request",
  "inputData": {
    "eventType": "newsletter_subscription",
    "customerData": {
      "email": "dr.mueller@example.com"
    }
  }
}
```

### BNI Network Site

```typescript
// Event RSVP
{
  "trigger": "rsvp_submit",
  "inputData": {
    "eventType": "chapter_meeting_rsvp",
    "eventId": "meeting_2025_11_15",
    "customerData": {
      "memberNumber": "BNI-MV-1234"
    },
    "formResponses": {
      "attending": true,
      "guestCount": 2,
      "guestNames": ["Jane Doe", "John Smith"]
    }
  }
}

// Visitor Registration
{
  "trigger": "registration_complete",
  "inputData": {
    "eventType": "visitor_registration",
    "customerData": {
      "businessName": "Acme Corp",
      "industry": "Technology"
    },
    "formResponses": {
      "referredBy": "member_123"
    }
  }
}
```

### Private Party RSVP Site

```typescript
// Party RSVP
{
  "trigger": "rsvp_submit",
  "inputData": {
    "eventType": "wedding_rsvp",
    "eventId": "sarah_john_wedding",
    "customerData": {
      "guestName": "Maria Schmidt"
    },
    "formResponses": {
      "attending": "yes",
      "plusOne": true,
      "plusOneName": "Thomas Schmidt",
      "dietaryRestrictions": "gluten-free",
      "songRequest": "Dancing Queen - ABBA"
    }
  }
}
```

### Mobile App (iOS/Android)

Same payload structure, just different `source`:

```typescript
{
  "trigger": "registration_complete",
  "inputData": {
    "source": "ios_app", // or "android_app"
    "eventType": "seminar_registration",
    // ... same structure as web
  }
}
```

---

## 🔧 Workflow Configuration (Backend)

In your backend, you configure which **workflows** handle which **triggers**.

### Example: HaffNet Seminar Registration Workflow

```typescript
{
  type: "workflow",
  subtype: "seminar-registration",
  name: "CME Seminar Registration",
  status: "active",

  execution: {
    triggerOn: "registration_complete",     // Matches frontend trigger
    requiredInputs: [
      "customerData",
      "formResponses",
      "transactionData"
    ],
    errorHandling: "rollback"
  },

  behaviors: [
    {
      type: "employer-detection",
      enabled: true,
      priority: 100,
      config: {
        hospitalDomains: ["charite.de", "uniklinik-*.de"],
        requiredFields: ["organization", "email"]
      }
    },
    {
      type: "invoice-mapping",
      enabled: true,
      priority: 90,
      config: {
        invoiceToEmployer: true
      }
    },
    {
      type: "consolidated-invoice-generation",
      enabled: true,
      priority: 80,
      config: {
        templateId: "cme_invoice_template"
      }
    },
    {
      type: "ticket-generation",
      enabled: true,
      priority: 70,
      config: {
        templateId: "cme_ticket_template",
        deliveryMethod: "email"
      }
    },
    {
      type: "email-notification",
      enabled: true,
      priority: 60,
      config: {
        template: "registration_confirmation",
        recipients: ["customer", "admin"]
      }
    }
  ]
}
```

---

## 📊 Response Examples

### Success Response: Seminar Registration

```json
{
  "success": true,
  "transactionId": "txn_1234567890",
  "ticketId": "ticket_abc123",
  "invoiceId": "inv_2025_0001",
  "contactId": "contact_xyz789",

  "workflowId": "workflow_seminar_registration",

  "behaviorResults": [
    {
      "behaviorType": "employer-detection",
      "success": true,
      "message": "Detected employer: Charité Berlin",
      "data": {
        "employerDetected": true,
        "employerId": "org_charite",
        "employerName": "Charité Berlin"
      }
    },
    {
      "behaviorType": "invoice-mapping",
      "success": true,
      "message": "Invoice mapped to employer",
      "data": {
        "invoiceTo": "employer",
        "invoiceRecipient": "org_charite"
      }
    },
    {
      "behaviorType": "consolidated-invoice-generation",
      "success": true,
      "message": "Invoice generated successfully",
      "data": {
        "invoiceId": "inv_2025_0001",
        "invoiceNumber": "2025-0001",
        "total": 749.00,
        "pdfUrl": "https://storage.l4yercak3.com/invoices/2025-0001.pdf"
      }
    },
    {
      "behaviorType": "ticket-generation",
      "success": true,
      "message": "Ticket created and emailed",
      "data": {
        "ticketId": "ticket_abc123",
        "ticketNumber": "TKT-2025-1234",
        "qrCode": "https://storage.l4yercak3.com/tickets/abc123.png"
      }
    },
    {
      "behaviorType": "email-notification",
      "success": true,
      "message": "Confirmation email sent",
      "data": {
        "emailsSent": ["dr.mueller@example.com", "admin@haffnet.de"]
      }
    }
  ],

  "message": "Registration completed successfully. Invoice sent to employer, ticket emailed to participant."
}
```

### Error Response: Missing Data

```json
{
  "success": false,
  "transactionId": "txn_1234567890",

  "workflowId": "workflow_seminar_registration",

  "behaviorResults": [
    {
      "behaviorType": "employer-detection",
      "success": false,
      "message": "Missing required field: organization",
      "error": "Cannot detect employer without organization field"
    }
  ],

  "message": "Workflow execution failed: Missing required customer data"
}
```

---

## 🛠️ Frontend Integration Pattern

### React/Next.js Example (HaffNet)

```typescript
// /src/lib/api.ts

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

export async function triggerWorkflow(event: {
  trigger: string;
  inputData: object;
}) {
  const response = await fetch(`${API_BASE_URL}/api/v1/workflows/trigger`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify(event)
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}
```

### Registration Form Handler

```typescript
// /src/app/seminare/[id]/register/actions.ts

'use server';

import { triggerWorkflow } from '@/lib/api';

export async function handleRegistration(formData: FormData) {
  // Build universal event payload
  const event = {
    trigger: 'registration_complete',
    inputData: {
      eventType: 'seminar_registration',
      eventId: formData.get('eventId'),
      source: 'haffnet_website',

      customerData: {
        email: formData.get('email'),
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        title: formData.get('title'),
        phone: formData.get('phone'),
        organization: formData.get('organization')
      },

      formResponses: {
        specialty: formData.get('specialty'),
        licenseNumber: formData.get('licenseNumber'),
        dietaryPreferences: formData.get('dietary'),
        hotelRequired: formData.get('hotelRequired') === 'true'
      },

      transactionData: {
        productId: formData.get('productId'),
        productName: formData.get('productName'),
        price: parseFloat(formData.get('price') as string),
        currency: 'EUR'
      },

      metadata: {
        referralSource: formData.get('utm_source') || 'direct',
        registeredAt: new Date().toISOString()
      }
    }
  };

  // Trigger workflow
  const result = await triggerWorkflow(event);

  if (result.success) {
    // Redirect to confirmation page with ticket/invoice info
    return {
      success: true,
      ticketId: result.ticketId,
      invoiceId: result.invoiceId
    };
  } else {
    // Handle error
    return {
      success: false,
      error: result.message
    };
  }
}
```

---

## 🚀 Benefits of This Architecture

1. **One Universal Interface**: All frontends use the same API endpoint
2. **Event-Driven**: Frontend sends events, backend decides what to do
3. **Behavior Orchestration**: Backend handles complex workflows automatically
4. **Platform Agnostic**: Web, iOS, Android all use same payload structure
5. **Easy to Extend**: Add new behaviors without changing frontend
6. **Testable**: Test workflows independently of frontends
7. **Audit Trail**: Every workflow execution is logged
8. **Flexible**: Same event can trigger different workflows per organization

---

## 📱 Multi-Platform Usage

```typescript
// Same payload structure works everywhere!

// Web (HaffNet)
fetch('/api/v1/workflows/trigger', { ... });

// iOS (Swift)
URLSession.shared.dataTask(
  with: request,
  completionHandler: { ... }
)

// Android (Kotlin)
client.post("https://api.l4yercak3.com/api/v1/workflows/trigger") {
  // ... same JSON payload
}

// React Native
fetch('/api/v1/workflows/trigger', { ... });
```

---

## 🔐 Security Best Practices

1. **API Keys**: Use different API keys for each frontend (web, iOS, Android)
2. **HTTPS Only**: All API requests must use HTTPS
3. **Rate Limiting**: API keys have rate limits (configurable per organization)
4. **Input Validation**: Backend validates all input data before processing
5. **Audit Logging**: All API calls are logged with user/organization context

---

## Next: Backend Implementation

See `BACKEND_IMPLEMENTATION.md` for how to:
- Create workflows in your backend
- Configure behaviors
- Add custom behavior types
- Test workflows

See `FRONTEND_INTEGRATION.md` for:
- Complete code examples
- Form handling patterns
- Error handling strategies
- Testing approaches
