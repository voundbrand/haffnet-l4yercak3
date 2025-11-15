# API Endpoints - Event Registration System

This document specifies all API endpoints needed for the HaffSymposium event registration system.

---

## Base URL

```
Production: https://api.haffnet.de/v1
Development: http://localhost:3000/api/v1
```

---

## Authentication

Most endpoints require authentication via session token:

```bash
Authorization: Bearer <session_token>
```

Public endpoints (marked with 🌐) do not require authentication.

---

## Endpoints Overview

### Events
- `GET /events` - List all published events
- `GET /events/:eventId` - Get single event
- `GET /events/:eventId/products` - Get products for event

### Forms
- `GET /forms/public/:formId` 🌐 - Get published form schema

### Workflows
- `POST /workflows/trigger` 🌐 - Trigger workflow (registration)

### Tickets
- `GET /tickets/:ticketId` - Get ticket details
- `GET /tickets/:ticketId/verify` 🌐 - Verify ticket QR code

---

## Event Endpoints

### GET /events
List all published events

**Authentication:** Optional (shows more data if authenticated)

**Query Parameters:**
- `subtype` (optional) - Filter by event subtype (e.g., "symposium")
- `status` (optional) - Filter by status (default: "published")
- `upcoming` (optional) - Only show upcoming events (default: true)
- `limit` (optional) - Number of results (default: 50)
- `offset` (optional) - Pagination offset (default: 0)

**Request:**
```bash
GET /api/v1/events?subtype=symposium&upcoming=true
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "events": [
      {
        "_id": "event_haffsymposium_2024",
        "type": "event",
        "subtype": "symposium",
        "name": "8. HaffSymposium der Sportmedizin",
        "description": "Das 8. HaffSymposium der Sportmedizin findet am 31. Mai und 1. Juni 2024 in Ueckermünde statt.",
        "status": "published",
        "customProperties": {
          "startDate": 1717142400000,
          "endDate": 1717264800000,
          "location": "Ueckermünde",
          "venue": "Bürgersaal",
          "timezone": "Europe/Berlin",
          "maxCapacity": 200,
          "currentRegistrations": 45,
          "address": {
            "street": "Am Markt 1",
            "city": "Ueckermünde",
            "postalCode": "17373",
            "country": "Deutschland"
          },
          "registration": {
            "enabled": true,
            "openDate": 1705276800000,
            "closeDate": 1716681600000
          }
        },
        "createdAt": 1704067200000,
        "updatedAt": 1704067200000
      }
    ],
    "pagination": {
      "total": 1,
      "limit": 50,
      "offset": 0,
      "hasMore": false
    }
  }
}
```

---

### GET /events/:eventId
Get single event by ID

**Authentication:** Optional

**Request:**
```bash
GET /api/v1/events/event_haffsymposium_2024
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "_id": "event_haffsymposium_2024",
    "type": "event",
    "subtype": "symposium",
    "name": "8. HaffSymposium der Sportmedizin",
    "description": "Das 8. HaffSymposium der Sportmedizin findet am 31. Mai und 1. Juni 2024 in Ueckermünde statt.",
    "status": "published",
    "customProperties": {
      "startDate": 1717142400000,
      "endDate": 1717264800000,
      "location": "Ueckermünde",
      "venue": "Bürgersaal",
      "timezone": "Europe/Berlin",
      "maxCapacity": 200,
      "currentRegistrations": 45,
      "spotsRemaining": 155,
      "address": {
        "street": "Am Markt 1",
        "city": "Ueckermünde",
        "postalCode": "17373",
        "country": "Deutschland"
      },
      "registration": {
        "enabled": true,
        "openDate": 1705276800000,
        "closeDate": 1716681600000,
        "isOpen": true
      }
    }
  }
}
```

**Error Response:**
```json
{
  "status": "error",
  "message": "Event not found",
  "code": "EVENT_NOT_FOUND"
}
```

---

### GET /events/:eventId/products
Get all products (registration categories) for an event

**Authentication:** Optional

**Request:**
```bash
GET /api/v1/events/event_haffsymposium_2024/products
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "products": [
      {
        "_id": "product_external_2024",
        "type": "product",
        "subtype": "ticket",
        "name": "HaffSymposium 2024 - Externer Teilnehmer",
        "description": "Teilnahmegebühr für externe Teilnehmer",
        "status": "published",
        "customProperties": {
          "price": 15000,
          "currency": "EUR",
          "sold": 12,
          "categoryCode": "external",
          "categoryLabel": "Externer Teilnehmer",
          "addons": [
            {
              "id": "ucra_boat_trip",
              "name": "UCRA Abendveranstaltung",
              "description": "Bootstour auf dem Haff mit Abendessen",
              "pricePerPerson": 3000,
              "maxQuantity": 2
            }
          ]
        }
      },
      {
        "_id": "product_ameos_2024",
        "type": "product",
        "subtype": "ticket",
        "name": "HaffSymposium 2024 - AMEOS Mitarbeiter",
        "description": "Kostenlose Teilnahme für AMEOS Mitarbeiter",
        "status": "published",
        "customProperties": {
          "price": 0,
          "currency": "EUR",
          "sold": 18,
          "categoryCode": "ameos",
          "categoryLabel": "AMEOS Mitarbeiter",
          "invoiceConfig": {
            "employerSourceField": "attendee_category",
            "employerMapping": {
              "ameos": "AMEOS Klinikum Ueckermünde"
            },
            "defaultPaymentTerms": "net30"
          },
          "addons": [
            {
              "id": "ucra_boat_trip",
              "name": "UCRA Abendveranstaltung",
              "description": "Bootstour auf dem Haff mit Abendessen",
              "pricePerPerson": 3000,
              "maxQuantity": 2
            }
          ]
        }
      },
      {
        "_id": "product_haffnet_2024",
        "type": "product",
        "subtype": "ticket",
        "name": "HaffSymposium 2024 - HaffNet-Mitglied",
        "description": "Reduzierte Teilnahmegebühr für HaffNet-Mitglieder",
        "status": "published",
        "customProperties": {
          "price": 10000,
          "currency": "EUR",
          "sold": 8,
          "categoryCode": "haffnet",
          "categoryLabel": "HaffNet-Mitglied",
          "addons": [
            {
              "id": "ucra_boat_trip",
              "name": "UCRA Abendveranstaltung",
              "pricePerPerson": 3000,
              "maxQuantity": 2
            }
          ]
        }
      },
      {
        "_id": "product_speaker_2024",
        "type": "product",
        "subtype": "ticket",
        "name": "HaffSymposium 2024 - Referent",
        "description": "Kostenlose Teilnahme für Referenten",
        "status": "published",
        "customProperties": {
          "price": 0,
          "currency": "EUR",
          "sold": 5,
          "categoryCode": "speaker",
          "categoryLabel": "Referent",
          "addons": []
        }
      },
      {
        "_id": "product_sponsor_2024",
        "type": "product",
        "subtype": "ticket",
        "name": "HaffSymposium 2024 - Sponsor",
        "description": "Kostenlose Teilnahme für Sponsoren",
        "status": "published",
        "customProperties": {
          "price": 0,
          "currency": "EUR",
          "sold": 2,
          "categoryCode": "sponsor",
          "categoryLabel": "Sponsor",
          "addons": []
        }
      },
      {
        "_id": "product_orga_2024",
        "type": "product",
        "subtype": "ticket",
        "name": "HaffSymposium 2024 - Orga-Team",
        "description": "Kostenlose Teilnahme für Orga-Team",
        "status": "published",
        "customProperties": {
          "price": 0,
          "currency": "EUR",
          "sold": 0,
          "categoryCode": "orga",
          "categoryLabel": "Orga-Team",
          "addons": []
        }
      }
    ],
    "count": 6
  }
}
```

---

## Form Endpoints

### GET /forms/public/:formId 🌐
Get published form schema (public endpoint)

**Authentication:** None required

**Request:**
```bash
GET /api/v1/forms/public/form_haffsymposium_2024
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "_id": "form_haffsymposium_2024",
    "type": "form",
    "subtype": "registration",
    "name": "HaffSymposium 2024 Registration Form",
    "description": "Registration form for HaffSymposium event",
    "status": "published",
    "customProperties": {
      "eventId": "event_haffsymposium_2024",
      "formSchema": {
        "version": "1.0",
        "fields": [
          {
            "id": "attendee_category",
            "type": "select",
            "label": "Teilnehmerkategorie",
            "required": true,
            "options": [
              { "value": "external", "label": "Externer Teilnehmer" },
              { "value": "ameos", "label": "AMEOS Mitarbeiter" },
              { "value": "haffnet", "label": "HaffNet-Mitglied" },
              { "value": "speaker", "label": "Referent" },
              { "value": "sponsor", "label": "Sponsor" },
              { "value": "orga", "label": "Orga-Team" }
            ]
          },
          {
            "id": "first_name",
            "type": "text",
            "label": "Vorname",
            "required": true
          },
          {
            "id": "last_name",
            "type": "text",
            "label": "Nachname",
            "required": true
          },
          {
            "id": "email",
            "type": "email",
            "label": "E-Mail",
            "required": true
          }
        ],
        "settings": {
          "allowMultipleSubmissions": false,
          "showProgressBar": true,
          "submitButtonText": "Jetzt anmelden",
          "successMessage": "Vielen Dank für Ihre Anmeldung!",
          "redirectUrl": "/bestaetigung"
        }
      }
    }
  }
}
```

**Error Response (Form not found or not published):**
```json
{
  "status": "error",
  "message": "Form not found or not published",
  "code": "FORM_NOT_FOUND"
}
```

---

## Workflow Endpoints

### POST /workflows/trigger 🌐
Trigger a workflow (used for event registration)

**Authentication:** None required (public endpoint for registration)

**Rate Limiting:** 10 requests per minute per IP

**Request:**
```bash
POST /api/v1/workflows/trigger
Content-Type: application/json

{
  "trigger": "event_registration_complete",
  "inputData": {
    "eventId": "event_haffsymposium_2024",
    "productId": "product_external_2024",

    "customerData": {
      "email": "max.mustermann@example.com",
      "firstName": "Max",
      "lastName": "Mustermann",
      "phone": "+49 170 1234567"
    },

    "formResponses": {
      "attendee_category": "external",
      "first_name": "Max",
      "last_name": "Mustermann",
      "email": "max.mustermann@example.com",
      "phone": "+49 170 1234567",
      "organization": "Beispiel GmbH",
      "ucra_participants": 2,
      "consent_privacy": true
    },

    "transactionData": {
      "productId": "product_external_2024",
      "price": 21000,
      "currency": "EUR",
      "breakdown": {
        "basePrice": 15000,
        "addons": [
          {
            "id": "ucra_boat_trip",
            "name": "UCRA Abendveranstaltung",
            "quantity": 2,
            "pricePerUnit": 3000,
            "total": 6000
          }
        ],
        "subtotal": 21000,
        "total": 21000
      }
    },

    "paymentMethod": {
      "type": "stripe",
      "paymentIntentId": "pi_1234567890"
    },

    "metadata": {
      "source": "website",
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0..."
    }
  }
}
```

**Success Response:**
```json
{
  "status": "success",
  "message": "Registration completed successfully",
  "data": {
    "ticketId": "ticket_12345",
    "ticketNumber": "HAFF-2024-0045",
    "eventId": "event_haffsymposium_2024",
    "eventName": "8. HaffSymposium der Sportmedizin",
    "contactId": "contact_67890",
    "confirmationUrl": "/bestaetigung?ticket=ticket_12345",
    "pricing": {
      "total": 21000,
      "currency": "EUR",
      "billingMethod": "customer_payment"
    }
  }
}
```

**Error Response (Validation Failed):**
```json
{
  "status": "error",
  "message": "Validation failed",
  "code": "VALIDATION_ERROR",
  "errors": [
    {
      "field": "customerData.email",
      "message": "Invalid email format"
    },
    {
      "field": "formResponses.consent_privacy",
      "message": "Privacy consent is required"
    }
  ]
}
```

**Error Response (Event Full):**
```json
{
  "status": "error",
  "message": "Event is at full capacity",
  "code": "EVENT_FULL"
}
```

**Error Response (Price Mismatch):**
```json
{
  "status": "error",
  "message": "Price mismatch. Please refresh and try again.",
  "code": "PRICE_MISMATCH"
}
```

---

## Ticket Endpoints

### GET /tickets/:ticketId
Get ticket details (authenticated)

**Authentication:** Required

**Request:**
```bash
GET /api/v1/tickets/ticket_12345
Authorization: Bearer <session_token>
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "_id": "ticket_12345",
    "type": "ticket",
    "subtype": "event_admission",
    "name": "8. HaffSymposium der Sportmedizin - Max Mustermann",
    "status": "active",
    "customProperties": {
      "productId": "product_external_2024",
      "holderName": "Max Mustermann",
      "holderEmail": "max.mustermann@example.com",
      "holderPhone": "+49 170 1234567",
      "eventId": "event_haffsymposium_2024",
      "eventName": "8. HaffSymposium der Sportmedizin",
      "eventDate": 1717142400000,
      "category": "external",
      "categoryLabel": "Externer Teilnehmer",
      "addons": {
        "ucraBoatTrip": {
          "selected": true,
          "participants": 2
        }
      },
      "ticketNumber": "HAFF-2024-0045",
      "qrCode": "https://api.haffnet.de/qr/ticket_12345",
      "purchaseDate": 1704067200000,
      "pricePaid": 21000,
      "currency": "EUR",
      "billingMethod": "customer_payment"
    }
  }
}
```

---

### GET /tickets/:ticketId/verify 🌐
Verify ticket QR code (public endpoint for check-in)

**Authentication:** None required

**Request:**
```bash
GET /api/v1/tickets/ticket_12345/verify
```

**Response (Valid Ticket):**
```json
{
  "status": "success",
  "data": {
    "valid": true,
    "ticketNumber": "HAFF-2024-0045",
    "holderName": "Max Mustermann",
    "eventName": "8. HaffSymposium der Sportmedizin",
    "category": "Externer Teilnehmer",
    "checkedIn": false,
    "checkedInAt": null
  }
}
```

**Response (Already Checked In):**
```json
{
  "status": "success",
  "data": {
    "valid": true,
    "ticketNumber": "HAFF-2024-0045",
    "holderName": "Max Mustermann",
    "eventName": "8. HaffSymposium der Sportmedizin",
    "category": "Externer Teilnehmer",
    "checkedIn": true,
    "checkedInAt": 1717142500000,
    "warning": "Ticket already checked in"
  }
}
```

**Response (Invalid Ticket):**
```json
{
  "status": "error",
  "message": "Invalid or expired ticket",
  "code": "INVALID_TICKET"
}
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `EVENT_NOT_FOUND` | 404 | Event does not exist |
| `EVENT_FULL` | 400 | Event has reached capacity |
| `EVENT_CLOSED` | 400 | Event registration is closed |
| `FORM_NOT_FOUND` | 404 | Form not found or not published |
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `PRICE_MISMATCH` | 400 | Calculated price doesn't match |
| `PAYMENT_FAILED` | 402 | Payment processing failed |
| `INVALID_TICKET` | 404 | Ticket not found or invalid |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Internal server error |

---

## Rate Limiting

All public endpoints have rate limits:

- **GET endpoints:** 60 requests/minute per IP
- **POST /workflows/trigger:** 10 requests/minute per IP

Rate limit headers:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1704067200
```

---

## CORS Configuration

```
Access-Control-Allow-Origin: https://haffnet.de
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Max-Age: 86400
```

---

## Frontend Integration Example

```typescript
// Fetch event details
const event = await fetch('/api/v1/events/event_haffsymposium_2024')
  .then(res => res.json());

// Fetch products (categories)
const products = await fetch('/api/v1/events/event_haffsymposium_2024/products')
  .then(res => res.json());

// Submit registration
const registration = await fetch('/api/v1/workflows/trigger', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    trigger: 'event_registration_complete',
    inputData: {
      eventId: 'event_haffsymposium_2024',
      productId: selectedProduct._id,
      customerData: { ... },
      formResponses: { ... },
      transactionData: { ... }
    }
  })
}).then(res => res.json());

// Redirect to confirmation
if (registration.status === 'success') {
  router.push(registration.data.confirmationUrl);
}
```

---

## Next Steps

1. Implement these endpoints in your Convex backend
2. Test with Postman/Insomnia
3. Build frontend to consume these APIs
4. Set up monitoring and logging
5. Configure rate limiting
6. Test error scenarios
