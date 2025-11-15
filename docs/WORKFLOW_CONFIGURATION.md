# Workflow Configuration - Event Registration

This document defines the workflow configuration for the `event_registration_complete` trigger that handles HaffSymposium registrations.

## Overview

**Trigger:** `event_registration_complete`
**Purpose:** Process event registrations, create tickets, handle payments, and send confirmations

---

## Workflow Trigger Configuration

```typescript
{
  trigger: "event_registration_complete",
  name: "Event Registration Workflow",
  description: "Processes event registrations with behavior-driven business logic",

  // Workflow settings
  settings: {
    async: true,
    retryOnFailure: true,
    maxRetries: 3,
    notifyOnError: true,
    timeout: 30000 // 30 seconds
  }
}
```

---

## Input Data Schema

**Frontend sends this data structure:**

```typescript
{
  trigger: "event_registration_complete",
  inputData: {
    // Event identification
    eventId: string,           // "event_haffsymposium_2024"
    eventType: string,          // "haffsymposium_registration"

    // Selected product (registration category)
    productId: string,          // "product_external_2024"

    // Customer information
    customerData: {
      email: string,            // Required
      firstName: string,        // Required
      lastName: string,         // Required
      phone?: string,           // Optional
      organization?: string     // Optional
    },

    // Form responses (all form fields)
    formResponses: {
      attendee_category: string,        // "external" | "ameos" | "haffnet" | "speaker" | "sponsor" | "orga"

      // Personal info
      title?: string,                   // "Dr." | "Prof." | etc.
      first_name: string,
      last_name: string,
      email: string,
      phone?: string,

      // Professional info
      organization?: string,
      position?: string,
      department?: string,
      street?: string,
      city?: string,
      postal_code?: string,
      country?: string,

      // Event-specific
      dietary_requirements?: string,
      accessibility_needs?: string,

      // Add-ons
      ucra_participants?: number,       // 0-2 (UCRA boat trip)

      // Additional
      comments?: string,
      consent_privacy: boolean,
      consent_photos?: boolean,
      newsletter_signup?: boolean
    },

    // Transaction data
    transactionData: {
      productId: string,        // Same as productId above
      price: number,            // Total price in cents (calculated by frontend)
      currency: string,         // "EUR"

      // Breakdown (optional, for transparency)
      breakdown?: {
        basePrice: number,
        addons: Array<{
          id: string,
          name: string,
          quantity: number,
          pricePerUnit: number,
          total: number
        }>,
        subtotal: number,
        tax?: number,
        total: number
      }
    },

    // Payment method (if paying now)
    paymentMethod?: {
      type: "stripe" | "paypal" | "invoice",
      paymentIntentId?: string,     // Stripe payment intent
      paypalOrderId?: string,        // PayPal order ID
      invoiceDetails?: {
        billingEmail: string,
        billingName: string,
        billingAddress: object
      }
    },

    // Metadata
    metadata?: {
      source: string,           // "website" | "mobile_app" | "admin"
      ipAddress?: string,
      userAgent?: string,
      referrer?: string,
      sessionId?: string
    }
  }
}
```

---

## Workflow Behaviors (Execution Order)

### Behavior 1: Validate Registration Data
**Priority:** 100 (highest)
**Purpose:** Validate all input data before processing

```typescript
{
  name: "validate_registration_data",
  priority: 100,

  conditions: {
    trigger: "event_registration_complete"
  },

  actions: [
    {
      type: "validate",
      rules: [
        { field: "eventId", required: true },
        { field: "productId", required: true },
        { field: "customerData.email", required: true, format: "email" },
        { field: "customerData.firstName", required: true, minLength: 1 },
        { field: "customerData.lastName", required: true, minLength: 1 },
        { field: "formResponses.attendee_category", required: true, enum: ["external", "ameos", "haffnet", "speaker", "sponsor", "orga"] },
        { field: "formResponses.consent_privacy", required: true, equals: true },
        { field: "transactionData.price", required: true, min: 0 },
        { field: "transactionData.currency", required: true, equals: "EUR" }
      ],
      onError: {
        response: { status: "error", message: "Validation failed" },
        stopWorkflow: true
      }
    }
  ]
}
```

---

### Behavior 2: Check Event Capacity
**Priority:** 90
**Purpose:** Ensure event has available capacity

```typescript
{
  name: "check_event_capacity",
  priority: 90,

  conditions: {
    trigger: "event_registration_complete"
  },

  actions: [
    {
      type: "query",
      target: "event",
      query: {
        eventId: "{{inputData.eventId}}"
      },
      storeAs: "event"
    },
    {
      type: "evaluate",
      condition: "event.customProperties.currentRegistrations < event.customProperties.maxCapacity",
      onFalse: {
        response: {
          status: "error",
          message: "Event is at full capacity"
        },
        stopWorkflow: true
      }
    }
  ]
}
```

---

### Behavior 3: Calculate Final Pricing
**Priority:** 80
**Purpose:** Validate frontend pricing and calculate final amounts

```typescript
{
  name: "calculate_pricing",
  priority: 80,

  conditions: {
    trigger: "event_registration_complete"
  },

  actions: [
    {
      type: "query",
      target: "product",
      query: {
        productId: "{{inputData.productId}}"
      },
      storeAs: "selectedProduct"
    },
    {
      type: "calculate",
      formula: {
        basePrice: "{{selectedProduct.customProperties.price}}",

        // Calculate UCRA addon
        ucraTotal: {
          if: "{{inputData.formResponses.ucra_participants > 0}}",
          then: "{{inputData.formResponses.ucra_participants * 3000}}",
          else: 0
        },

        // Total
        calculatedTotal: "{{basePrice + ucraTotal}}",

        // Validate against frontend calculation
        priceMatch: "{{calculatedTotal === inputData.transactionData.price}}"
      },
      storeAs: "pricing"
    },
    {
      type: "evaluate",
      condition: "{{pricing.priceMatch === true}}",
      onFalse: {
        response: {
          status: "error",
          message: "Price mismatch. Please refresh and try again."
        },
        stopWorkflow: true
      }
    }
  ]
}
```

---

### Behavior 4: Detect Employer Billing
**Priority:** 70
**Purpose:** Determine if registration should be billed to employer

```typescript
{
  name: "detect_employer_billing",
  priority: 70,

  conditions: {
    trigger: "event_registration_complete"
  },

  actions: [
    {
      type: "evaluate",
      formula: {
        // Check if category has employer billing config
        hasEmployerConfig: "{{selectedProduct.customProperties.invoiceConfig !== undefined}}",

        // Get employer name from mapping
        employerName: {
          if: "{{hasEmployerConfig}}",
          then: "{{selectedProduct.customProperties.invoiceConfig.employerMapping[inputData.formResponses.attendee_category]}}",
          else: null
        },

        // Determine billing method
        billingMethod: {
          if: "{{employerName !== null}}",
          then: "employer_invoice",
          else: {
            if: "{{pricing.calculatedTotal === 0}}",
            then: "free",
            else: "customer_payment"
          }
        }
      },
      storeAs: "billing"
    }
  ]
}
```

---

### Behavior 5: Create or Update Contact
**Priority:** 60
**Purpose:** Create CRM contact for the attendee

```typescript
{
  name: "create_contact",
  priority: 60,

  conditions: {
    trigger: "event_registration_complete"
  },

  actions: [
    {
      type: "upsert",
      target: "object",
      objectType: "crm_contact",

      // Find existing contact by email
      findBy: {
        type: "crm_contact",
        "customProperties.email": "{{inputData.customerData.email}}"
      },

      // Create or update
      data: {
        organizationId: "{{event.organizationId}}",
        type: "crm_contact",
        subtype: "event_attendee",
        name: "{{inputData.customerData.firstName}} {{inputData.customerData.lastName}}",
        description: "Event attendee",
        status: "active",

        customProperties: {
          email: "{{inputData.customerData.email}}",
          firstName: "{{inputData.customerData.firstName}}",
          lastName: "{{inputData.customerData.lastName}}",
          phone: "{{inputData.customerData.phone}}",

          // Professional info
          organization: "{{inputData.formResponses.organization}}",
          position: "{{inputData.formResponses.position}}",
          department: "{{inputData.formResponses.department}}",

          // Address
          address: {
            street: "{{inputData.formResponses.street}}",
            city: "{{inputData.formResponses.city}}",
            postalCode: "{{inputData.formResponses.postal_code}}",
            country: "{{inputData.formResponses.country}}"
          },

          // Preferences
          dietaryRequirements: "{{inputData.formResponses.dietary_requirements}}",
          accessibilityNeeds: "{{inputData.formResponses.accessibility_needs}}",
          newsletterConsent: "{{inputData.formResponses.newsletter_signup}}",
          photoConsent: "{{inputData.formResponses.consent_photos}}",

          // Metadata
          source: "{{inputData.metadata.source}}",
          lastEventRegistration: "{{Date.now()}}"
        }
      },

      storeAs: "contact"
    },
    {
      type: "createLink",
      fromObjectId: "{{contact._id}}",
      toObjectId: "{{inputData.eventId}}",
      linkType: "registered_for",
      properties: {
        registeredAt: "{{Date.now()}}",
        category: "{{inputData.formResponses.attendee_category}}"
      }
    }
  ]
}
```

---

### Behavior 6: Create Ticket
**Priority:** 50
**Purpose:** Create ticket for event admission

```typescript
{
  name: "create_ticket",
  priority: 50,

  conditions: {
    trigger: "event_registration_complete"
  },

  actions: [
    {
      type: "create",
      target: "object",
      objectType: "ticket",

      data: {
        organizationId: "{{event.organizationId}}",
        type: "ticket",
        subtype: "event_admission",
        name: "{{event.name}} - {{contact.customProperties.firstName}} {{contact.customProperties.lastName}}",
        description: "Ticket for {{event.name}}",
        status: "active",

        customProperties: {
          // Product reference
          productId: "{{inputData.productId}}",

          // Holder information
          holderName: "{{contact.customProperties.firstName}} {{contact.customProperties.lastName}}",
          holderEmail: "{{contact.customProperties.email}}",
          holderPhone: "{{contact.customProperties.phone}}",

          // Event information
          eventId: "{{inputData.eventId}}",
          eventName: "{{event.name}}",
          eventDate: "{{event.customProperties.startDate}}",

          // Registration details
          category: "{{inputData.formResponses.attendee_category}}",
          categoryLabel: "{{selectedProduct.customProperties.categoryLabel}}",

          // Add-ons
          addons: {
            ucraBoatTrip: {
              selected: "{{inputData.formResponses.ucra_participants > 0}}",
              participants: "{{inputData.formResponses.ucra_participants || 0}}"
            }
          },

          // Embed form responses for operational queries
          registrationData: "{{inputData.formResponses}}",

          // Ticket metadata
          purchaseDate: "{{Date.now()}}",
          qrCode: "{{generateQRCode()}}",
          ticketNumber: "{{generateTicketNumber()}}",

          // Billing
          billingMethod: "{{billing.billingMethod}}",
          pricePaid: "{{pricing.calculatedTotal}}",
          currency: "EUR"
        }
      },

      storeAs: "ticket"
    },
    {
      type: "createLink",
      fromObjectId: "{{ticket._id}}",
      toObjectId: "{{inputData.productId}}",
      linkType: "issued_from",
      properties: {
        issuedAt: "{{Date.now()}}"
      }
    },
    {
      type: "createLink",
      fromObjectId: "{{ticket._id}}",
      toObjectId: "{{inputData.eventId}}",
      linkType: "admits_to",
      properties: {
        admissionDate: "{{event.customProperties.startDate}}"
      }
    }
  ]
}
```

---

### Behavior 7: Create Form Response (Audit Trail)
**Priority:** 45
**Purpose:** Store form submission as audit trail

```typescript
{
  name: "create_form_response",
  priority: 45,

  conditions: {
    trigger: "event_registration_complete"
  },

  actions: [
    {
      type: "create",
      target: "object",
      objectType: "formResponse",

      data: {
        organizationId: "{{event.organizationId}}",
        type: "formResponse",
        subtype: "registration",
        name: "Response from {{contact.customProperties.firstName}} {{contact.customProperties.lastName}}",
        description: "Form submission for {{event.name}}",
        status: "complete",

        customProperties: {
          formId: "{{event.customProperties.formId}}", // If form exists
          eventId: "{{inputData.eventId}}",
          contactId: "{{contact._id}}",
          ticketId: "{{ticket._id}}",

          responses: "{{inputData.formResponses}}",

          calculatedPricing: {
            basePrice: "{{pricing.basePrice}}",
            addons: "{{pricing.ucraTotal}}",
            total: "{{pricing.calculatedTotal}}"
          },

          submittedAt: "{{Date.now()}}",
          ipAddress: "{{inputData.metadata.ipAddress}}",
          userAgent: "{{inputData.metadata.userAgent}}",
          source: "{{inputData.metadata.source}}"
        }
      },

      storeAs: "formResponse"
    }
  ]
}
```

---

### Behavior 8: Generate Invoice (Employer Billing)
**Priority:** 40
**Purpose:** Create invoice for employer-billed registrations

```typescript
{
  name: "generate_employer_invoice",
  priority: 40,

  conditions: {
    trigger: "event_registration_complete",
    billingMethod: "employer_invoice"
  },

  actions: [
    {
      type: "create",
      target: "object",
      objectType: "invoice",

      data: {
        organizationId: "{{event.organizationId}}",
        type: "invoice",
        subtype: "event_registration",
        name: "Invoice - {{billing.employerName}} - {{event.name}}",
        description: "Event registration invoice",
        status: "pending",

        customProperties: {
          // Invoice details
          invoiceNumber: "{{generateInvoiceNumber()}}",
          invoiceDate: "{{Date.now()}}",
          dueDate: "{{Date.now() + (30 * 24 * 60 * 60 * 1000)}}", // 30 days

          // Billing information
          billTo: {
            organizationName: "{{billing.employerName}}",
            contactName: "{{contact.customProperties.firstName}} {{contact.customProperties.lastName}}",
            email: "{{contact.customProperties.email}}"
          },

          // Line items
          lineItems: [
            {
              description: "Event Registration: {{event.name}}",
              category: "{{selectedProduct.customProperties.categoryLabel}}",
              quantity: 1,
              unitPrice: "{{pricing.basePrice}}",
              total: "{{pricing.basePrice}}"
            },
            // Add UCRA addon if selected
            {
              if: "{{pricing.ucraTotal > 0}}",
              then: {
                description: "UCRA Abendveranstaltung",
                quantity: "{{inputData.formResponses.ucra_participants}}",
                unitPrice: 3000,
                total: "{{pricing.ucraTotal}}"
              }
            }
          ],

          // Totals
          subtotal: "{{pricing.calculatedTotal}}",
          taxRate: 0,
          taxAmount: 0,
          total: "{{pricing.calculatedTotal}}",
          currency: "EUR",

          // References
          eventId: "{{inputData.eventId}}",
          ticketId: "{{ticket._id}}",
          contactId: "{{contact._id}}",

          // Payment terms
          paymentTerms: "{{selectedProduct.customProperties.invoiceConfig.defaultPaymentTerms || 'net30'}}",
          paymentStatus: "pending"
        }
      },

      storeAs: "invoice"
    }
  ]
}
```

---

### Behavior 9: Send Confirmation Email
**Priority:** 30
**Purpose:** Send confirmation email to attendee

```typescript
{
  name: "send_confirmation_email",
  priority: 30,

  conditions: {
    trigger: "event_registration_complete"
  },

  actions: [
    {
      type: "sendEmail",
      template: "event_registration_confirmation",

      to: "{{contact.customProperties.email}}",
      from: "events@haffnet.de",
      replyTo: "info@haffnet.de",

      subject: "Anmeldebestätigung - {{event.name}}",

      templateData: {
        // Attendee info
        firstName: "{{contact.customProperties.firstName}}",
        lastName: "{{contact.customProperties.lastName}}",

        // Event info
        eventName: "{{event.name}}",
        eventDate: "{{formatDate(event.customProperties.startDate)}}",
        eventLocation: "{{event.customProperties.location}}",
        eventVenue: "{{event.customProperties.venue}}",

        // Ticket info
        ticketNumber: "{{ticket.customProperties.ticketNumber}}",
        category: "{{selectedProduct.customProperties.categoryLabel}}",

        // Add-ons
        ucraParticipants: "{{inputData.formResponses.ucra_participants || 0}}",

        // Pricing
        totalPaid: "{{formatCurrency(pricing.calculatedTotal)}}",
        billingMethod: "{{billing.billingMethod}}",

        // QR code for check-in
        qrCodeUrl: "{{ticket.customProperties.qrCode}}",

        // Links
        confirmationUrl: "{{generateConfirmationUrl(ticket._id)}}",
        eventDetailsUrl: "{{generateEventUrl(event._id)}}"
      },

      attachments: [
        {
          filename: "ticket.pdf",
          content: "{{generateTicketPDF(ticket)}}"
        }
      ]
    }
  ]
}
```

---

### Behavior 10: Update Statistics
**Priority:** 20
**Purpose:** Update event and product statistics

```typescript
{
  name: "update_statistics",
  priority: 20,

  conditions: {
    trigger: "event_registration_complete"
  },

  actions: [
    {
      type: "update",
      target: "object",
      objectId: "{{inputData.eventId}}",

      data: {
        "customProperties.currentRegistrations": {
          increment: 1
        },
        "customProperties.stats.totalRevenue": {
          increment: "{{pricing.calculatedTotal}}"
        },
        updatedAt: "{{Date.now()}}"
      }
    },
    {
      type: "update",
      target: "object",
      objectId: "{{inputData.productId}}",

      data: {
        "customProperties.sold": {
          increment: 1
        },
        updatedAt: "{{Date.now()}}"
      }
    }
  ]
}
```

---

### Behavior 11: Send Admin Notification
**Priority:** 10
**Purpose:** Notify admin of new registration

```typescript
{
  name: "notify_admin",
  priority: 10,

  conditions: {
    trigger: "event_registration_complete"
  },

  actions: [
    {
      type: "sendEmail",
      template: "admin_new_registration",

      to: "admin@haffnet.de",
      from: "system@haffnet.de",
      subject: "New Registration: {{event.name}}",

      templateData: {
        eventName: "{{event.name}}",
        attendeeName: "{{contact.customProperties.firstName}} {{contact.customProperties.lastName}}",
        attendeeEmail: "{{contact.customProperties.email}}",
        category: "{{selectedProduct.customProperties.categoryLabel}}",
        totalAmount: "{{formatCurrency(pricing.calculatedTotal)}}",
        billingMethod: "{{billing.billingMethod}}",
        registrationTime: "{{Date.now()}}",
        ticketId: "{{ticket._id}}",
        currentRegistrations: "{{event.customProperties.currentRegistrations + 1}}",
        maxCapacity: "{{event.customProperties.maxCapacity}}"
      }
    }
  ]
}
```

---

## Workflow Response

**Success Response:**

```typescript
{
  status: "success",
  message: "Registration completed successfully",

  data: {
    ticketId: "{{ticket._id}}",
    ticketNumber: "{{ticket.customProperties.ticketNumber}}",

    eventId: "{{inputData.eventId}}",
    eventName: "{{event.name}}",

    contactId: "{{contact._id}}",

    invoiceId: "{{invoice._id}}", // If employer billing

    confirmationUrl: "/bestaetigung?ticket={{ticket._id}}",

    pricing: {
      total: "{{pricing.calculatedTotal}}",
      currency: "EUR",
      billingMethod: "{{billing.billingMethod}}"
    }
  }
}
```

**Error Response:**

```typescript
{
  status: "error",
  message: "Error message here",
  code: "ERROR_CODE",

  errors: [
    // Validation errors or other issues
  ]
}
```

---

## Testing the Workflow

### Test Case 1: External Participant with UCRA

```bash
POST /api/v1/workflows/trigger
{
  "trigger": "event_registration_complete",
  "inputData": {
    "eventId": "event_haffsymposium_2024",
    "productId": "product_external_2024",
    "customerData": {
      "email": "test@example.com",
      "firstName": "Max",
      "lastName": "Mustermann"
    },
    "formResponses": {
      "attendee_category": "external",
      "first_name": "Max",
      "last_name": "Mustermann",
      "email": "test@example.com",
      "ucra_participants": 2,
      "consent_privacy": true
    },
    "transactionData": {
      "productId": "product_external_2024",
      "price": 21000,
      "currency": "EUR"
    }
  }
}
```

**Expected:** Ticket created, total = 21000 (15000 base + 6000 UCRA)

### Test Case 2: AMEOS Employee (Employer Billing)

```bash
POST /api/v1/workflows/trigger
{
  "trigger": "event_registration_complete",
  "inputData": {
    "eventId": "event_haffsymposium_2024",
    "productId": "product_ameos_2024",
    "customerData": {
      "email": "dr.mueller@ameos.de",
      "firstName": "Hans",
      "lastName": "Mueller"
    },
    "formResponses": {
      "attendee_category": "ameos",
      "first_name": "Hans",
      "last_name": "Mueller",
      "email": "dr.mueller@ameos.de",
      "ucra_participants": 1,
      "consent_privacy": true
    },
    "transactionData": {
      "productId": "product_ameos_2024",
      "price": 3000,
      "currency": "EUR"
    }
  }
}
```

**Expected:** Ticket created, invoice generated for AMEOS, total = 3000 (UCRA only)

---

## Implementation Checklist

- [ ] Configure workflow trigger in L4yerCak3 admin
- [ ] Create all 11 behaviors in priority order
- [ ] Set up email templates (confirmation, admin notification)
- [ ] Configure QR code generation
- [ ] Set up ticket PDF generation
- [ ] Test all scenarios (free, paid, employer billing)
- [ ] Verify object links creation
- [ ] Test error handling and validation
- [ ] Configure monitoring and logging
- [ ] Set up webhook for payment confirmation (Stripe/PayPal)

---

## Next: Frontend Integration

Once this workflow is configured, the frontend simply needs to:

1. Collect form data
2. Calculate total price
3. Handle payment (if needed) via Stripe.js/PayPal
4. POST to `/api/v1/workflows/trigger` with the input data above

The backend handles **everything else** through these 11 behaviors!
