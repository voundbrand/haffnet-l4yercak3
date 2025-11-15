# L4yerCak3 Event-Driven API - Complete Documentation

## 🎯 Overview

Your L4yerCak3 backend provides a **universal event-driven API** that powers all your frontends (web, iOS, Android) through a single, elegant interface.

**Core Concept**: Frontends send **events** → Backend executes **workflows** → Results returned

---

## 📚 Documentation Guide

### Quick Start (Read These First)

1. **[API_SPECIFICATION.md](./API_SPECIFICATION.md)** ⭐ START HERE
   - How the API works
   - Authentication
   - Request/response formats
   - Real-world examples

2. **[UNIVERSAL_EVENT_PAYLOAD.md](./UNIVERSAL_EVENT_PAYLOAD.md)**
   - The ONE object structure for all events
   - Complete field reference
   - Examples for every use case

3. **[FRONTEND_INTEGRATION.md](./FRONTEND_INTEGRATION.md)**
   - How to integrate from Next.js, React Native
   - Complete code examples
   - Form handling patterns

### Backend Reference

4. **[BACKEND_REFERENCE.md](./BACKEND_REFERENCE.md)**
   - How workflows and behaviors work
   - Available behaviors
   - Creating custom behaviors
   - Testing workflows

---

## 🚀 Quick Examples

### Frontend: Submit Event

```typescript
// Any frontend (web, mobile) sends this:
const result = await fetch('https://api.l4yercak3.com/api/v1/workflows/trigger', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    trigger: 'registration_complete',
    inputData: {
      eventType: 'seminar_registration',
      source: 'haffnet_website',
      customerData: { ... },
      formResponses: { ... },
      transactionData: { ... }
    }
  })
});

// Backend handles EVERYTHING automatically:
// - Detect employer
// - Generate invoice
// - Create ticket
// - Send emails
// - Update CRM
```

### Backend: Workflow Configuration

```typescript
// In your l4yercak3 backend admin:
{
  name: "Seminar Registration",
  trigger: "registration_complete",
  behaviors: [
    { type: "employer-detection", priority: 100 },
    { type: "invoice-mapping", priority: 90 },
    { type: "consolidated-invoice-generation", priority: 80 },
    { type: "ticket-generation", priority: 70 },
    { type: "email-notification", priority: 60 }
  ]
}

// Frontend doesn't know or care about this complexity!
```

---

## 💡 Key Benefits

### 1. **One API for Everything**

Instead of multiple endpoints:
- ❌ `/api/register-seminar`
- ❌ `/api/create-invoice`
- ❌ `/api/send-ticket`
- ❌ `/api/update-crm`

You have one:
- ✅ `/api/v1/workflows/trigger`

### 2. **Frontend Simplicity**

Frontend just sends events. Backend handles all the complex logic:

```typescript
// Frontend doesn't know about:
// - Invoice generation
// - Employer detection
// - Email templating
// - CRM updates
// - PDF creation

// It just sends:
triggerWorkflow({
  trigger: 'registration_complete',
  inputData: { ... }
})
```

### 3. **Platform Agnostic**

Same API works everywhere:

```
HaffNet Website    →
BNI Network Site   →
iOS App            →  /api/v1/workflows/trigger  →  L4yerCak3 Backend
Android App        →
Admin Panel        →
```

### 4. **Behavior Orchestration**

Backend chains complex workflows automatically:

```
1. Detect employer       (analyze email domain)
2. Map invoice           (employer or individual?)
3. Generate invoice      (create PDF)
4. Generate ticket       (create QR code)
5. Send emails           (confirmation + billing)
6. Update CRM            (create/update contact)
```

All this happens from ONE frontend API call!

### 5. **Easy to Extend**

Add new behaviors without touching frontend:

```typescript
// Backend only (no frontend changes needed):
{
  behaviors: [
    ...existingBehaviors,
    { type: "sms-notification", priority: 55 },  // NEW!
    { type: "analytics-tracking", priority: 50 } // NEW!
  ]
}
```

---

## 🎨 Real-World Use Cases

### HaffNet: Medical Seminar Registration

**Frontend sends**:
```json
{
  "trigger": "registration_complete",
  "inputData": {
    "eventType": "seminar_registration",
    "customerData": {
      "email": "dr.schmidt@charite.de",
      "organization": "Charité Berlin"
    }
  }
}
```

**Backend does**:
1. Detects employer (Charité Berlin)
2. Sends invoice to hospital billing
3. Creates CME certificate
4. Emails ticket to doctor
5. Adds doctor to CRM
6. Links to hospital in CRM

**Frontend receives**:
```json
{
  "success": true,
  "ticketId": "ticket_123",
  "invoiceId": "inv_2025_001",
  "message": "Registration successful"
}
```

### BNI Network: Meeting RSVP

**Frontend sends**:
```json
{
  "trigger": "rsvp_submit",
  "inputData": {
    "eventType": "chapter_meeting_rsvp",
    "customerData": {
      "memberNumber": "BNI-MV-1234"
    },
    "formResponses": {
      "attending": "yes",
      "guestCount": 2
    }
  }
}
```

**Backend does**:
1. Updates member attendance
2. Adds guests to list
3. Updates catering count
4. Sends RSVP confirmation
5. Notifies chapter president

### Private Party: Wedding RSVP

**Frontend sends**:
```json
{
  "trigger": "rsvp_submit",
  "inputData": {
    "eventType": "wedding_rsvp",
    "formResponses": {
      "attending": "yes",
      "dietaryRestrictions": ["vegetarian"],
      "songRequest": "Dancing Queen"
    }
  }
}
```

**Backend does**:
1. Updates guest list
2. Adds song to playlist
3. Updates seating chart
4. Sends confirmation
5. Sends accommodation info

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Frontends                        │
│  HaffNet Web │ iOS App │ Android │ BNI Site │ etc. │
└──────────────┬──────────────────────────────────────┘
               │
               │ HTTPS POST /api/v1/workflows/trigger
               │ { trigger, inputData }
               ▼
┌─────────────────────────────────────────────────────┐
│              L4yerCak3 API Gateway                  │
│  - Verify API key                                   │
│  - Validate request                                 │
│  - Route to workflow                                │
└──────────────┬──────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────┐
│            Workflow Executor                        │
│  - Find workflow (by trigger)                       │
│  - Execute behaviors (by priority)                  │
│  - Aggregate results                                │
└──────────────┬──────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────┐
│            Behavior Executor                        │
│  ├─ employer-detection                              │
│  ├─ invoice-mapping                                 │
│  ├─ consolidated-invoice-generation                 │
│  ├─ ticket-generation                               │
│  ├─ email-notification                              │
│  └─ contact-creation                                │
└──────────────┬──────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────┐
│          Results & Side Effects                     │
│  - Invoice PDF created                              │
│  - Ticket with QR code                              │
│  - Emails sent                                      │
│  - CRM updated                                      │
│  - Analytics logged                                 │
└──────────────┬──────────────────────────────────────┘
               │
               │ Response:
               │ { success, ticketId, invoiceId, ... }
               ▼
         Back to Frontend
```

---

## 📋 Documentation Index

| Document | Purpose | Audience |
|----------|---------|----------|
| **API_SPECIFICATION.md** | API endpoints, authentication, examples | Frontend Devs |
| **UNIVERSAL_EVENT_PAYLOAD.md** | Event data structure, field reference | Frontend Devs |
| **FRONTEND_INTEGRATION.md** | Code examples, React/Native patterns | Frontend Devs |
| **CHECKOUT_INTEGRATION.md** | Checkout flow and behavior system | Frontend Devs |
| **CHECKOUT_CODE_EXAMPLES.md** | Platform-specific checkout code | Frontend Devs |
| **PAYMENT_PROVIDER_FRONTEND.md** | Payment provider integration (Stripe, etc.) | Frontend Devs |
| **BACKEND_REFERENCE.md** | Workflows, behaviors, configuration | Backend Devs |
| **README.md** (this file) | Overview, navigation | Everyone |

---

## 🔐 Security

- **API Keys**: Required for all requests
- **Organization Scope**: API keys are scoped to organizations
- **HTTPS Only**: All requests must use HTTPS
- **Rate Limiting**: Configurable per API key
- **Input Validation**: All data validated before processing
- **Audit Logging**: Every API call logged

---

## 🧪 Testing

### Frontend Testing

```typescript
// Mock the API during development
import { L4yerCak3API } from '@/lib/l4yercak3-api';

jest.mock('@/lib/l4yercak3-api');

test('registration submits successfully', async () => {
  L4yerCak3API.triggerWorkflow.mockResolvedValue({
    success: true,
    ticketId: 'test_ticket',
    invoiceId: 'test_invoice'
  });

  // Test your form submission
});
```

### Backend Testing

```typescript
// Test workflows in admin UI or programmatically
const result = await executeWorkflow({
  workflowId,
  manualTrigger: true,
  contextData: {
    customerData: { email: 'test@example.com' }
  }
});
```

---

## 🚦 Getting Started

### For Frontend Developers

**Building a checkout?**
1. Read [CHECKOUT_INTEGRATION.md](./CHECKOUT_INTEGRATION.md) - Overview of checkout system
2. Read [PAYMENT_PROVIDER_FRONTEND.md](./PAYMENT_PROVIDER_FRONTEND.md) - Payment UI requirements
3. Read [CHECKOUT_CODE_EXAMPLES.md](./CHECKOUT_CODE_EXAMPLES.md) - Copy/paste code examples

**Building forms or features?**
1. Read [API_SPECIFICATION.md](./API_SPECIFICATION.md) - API basics
2. Read [UNIVERSAL_EVENT_PAYLOAD.md](./UNIVERSAL_EVENT_PAYLOAD.md) - Event structure
3. Read [FRONTEND_INTEGRATION.md](./FRONTEND_INTEGRATION.md) - Integration patterns

### For Backend Developers

1. Read [BACKEND_REFERENCE.md](./BACKEND_REFERENCE.md)
2. Configure workflows in admin UI
3. Test workflows with sample data
4. Monitor execution logs

---

## 📊 Performance

- **API Response Time**: < 200ms (excluding behavior execution)
- **Workflow Execution**: Parallel behavior execution where possible
- **Scalability**: Handles 1000s of concurrent requests
- **Reliability**: Built on Convex (99.9% uptime)

---

## 🤝 Support

- **Documentation**: This folder
- **API Issues**: Check `workflowExecutionLogs` in admin UI
- **Questions**: Contact backend team

---

## 🎉 Summary

**One API endpoint. Universal event payload. Infinite possibilities.**

Your frontends send events, the backend orchestrates complex workflows automatically. Add new behaviors, change business logic, configure workflows - all without touching frontend code.

**Welcome to event-driven architecture!** 🚀
