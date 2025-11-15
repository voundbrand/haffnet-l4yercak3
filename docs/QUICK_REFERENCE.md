# Quick Reference Card

## 🎯 The Universal Event Pattern

```typescript
// EVERY frontend event follows this pattern:

POST https://api.l4yercak3.com/api/v1/workflows/trigger
Authorization: Bearer YOUR_API_KEY

{
  "trigger": string,           // What action triggers this?
  "inputData": {
    "eventType": string,       // What type of event?
    "eventId": string,         // Which specific event/product?
    "source": string,          // Where from? (web, ios, android)

    // Optional based on event type:
    "customerData": { ... },
    "formResponses": { ... },
    "transactionData": { ... },
    "metadata": { ... }
  }
}
```

---

## 📦 Common Triggers

| Trigger | Use For | Example EventType |
|---------|---------|-------------------|
| `registration_complete` | User signs up | `seminar_registration` |
| `form_submit` | Contact/inquiry forms | `contact_inquiry` |
| `rsvp_submit` | Event RSVP | `meeting_rsvp`, `wedding_rsvp` |
| `subscription_request` | Newsletter signup | `newsletter_subscription` |
| `checkout_start` | Begin purchase | `product_purchase` |
| `payment_completed` | Payment success | `order_confirmation` |

---

## 💻 Frontend Code Template

```typescript
// /src/lib/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL;
const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

export async function triggerWorkflow(event: {
  trigger: string;
  inputData: object;
}) {
  const res = await fetch(`${API_URL}/api/v1/workflows/trigger`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify(event)
  });

  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}
```

---

## 🎨 Example: Registration Form

```typescript
// Server Action
'use server';

export async function handleRegistration(formData: FormData) {
  const result = await triggerWorkflow({
    trigger: 'registration_complete',
    inputData: {
      eventType: 'seminar_registration',
      eventId: formData.get('eventId'),
      source: 'haffnet_website',

      customerData: {
        email: formData.get('email'),
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        organization: formData.get('organization')
      },

      formResponses: {
        specialty: formData.get('specialty'),
        dietaryPreferences: formData.get('dietary')
      },

      transactionData: {
        productId: formData.get('productId'),
        price: parseFloat(formData.get('price')),
        currency: 'EUR'
      }
    }
  });

  return {
    success: result.success,
    ticketId: result.ticketId,
    invoiceId: result.invoiceId
  };
}
```

---

## 🔧 Backend: Workflow Structure

```typescript
{
  name: "Seminar Registration",
  status: "active",

  execution: {
    triggerOn: "registration_complete",  // Matches frontend trigger
    errorHandling: "rollback"
  },

  behaviors: [
    { type: "employer-detection", priority: 100, config: { ... } },
    { type: "invoice-mapping", priority: 90, config: { ... } },
    { type: "consolidated-invoice-generation", priority: 80 },
    { type: "ticket-generation", priority: 70 },
    { type: "email-notification", priority: 60 }
  ]
}
```

---

## 📝 Customer Data Fields

```typescript
customerData: {
  // Required
  email: string,

  // Optional
  firstName?: string,
  lastName?: string,
  title?: string,
  phone?: string,
  organization?: string,

  address?: {
    street?: string,
    city?: string,
    zip?: string,
    country?: string
  },

  externalIds?: {
    customerId?: string,
    memberNumber?: string
  }
}
```

---

## 💰 Transaction Data Fields

```typescript
transactionData: {
  // Required
  productId: string,
  productName: string,
  price: number,
  currency: string,  // "EUR", "USD", etc.

  // Optional
  quantity?: number,
  addons?: [{ id, name, price }],
  discounts?: [{ code, amount }],
  paymentMethod?: string
}
```

---

## 📊 Response Format

```typescript
{
  success: boolean,
  transactionId: string,

  // Created objects (depends on workflow)
  ticketId?: string,
  invoiceId?: string,
  contactId?: string,

  // Workflow details
  workflowId?: string,
  behaviorResults?: [{
    behaviorType: string,
    success: boolean,
    message: string,
    data?: object
  }],

  message: string
}
```

---

## ⚡ Available Behaviors

| Behavior | Purpose | Key Config |
|----------|---------|------------|
| `employer-detection` | Detect if customer works at hospital | `hospitalDomains` |
| `invoice-mapping` | Route invoice to employer/individual | `invoiceToEmployer` |
| `consolidated-invoice-generation` | Create PDF invoice | `templateId` |
| `ticket-generation` | Create event ticket | `templateId`, `deliveryMethod` |
| `email-notification` | Send emails | `template`, `recipients` |
| `contact-creation` | Create/update CRM contact | `updateIfExists` |

---

## 🔐 Security Checklist

- ✅ Use HTTPS only
- ✅ Never expose API key in client-side code
- ✅ Use server actions for API calls
- ✅ Validate inputs before sending
- ✅ Handle errors gracefully
- ✅ Log to analytics

---

## 🧪 Testing

```typescript
// Mock during development
jest.mock('@/lib/api');

test('registration works', async () => {
  triggerWorkflow.mockResolvedValue({
    success: true,
    ticketId: 'test_123'
  });

  // Test your code
});
```

---

## 📖 Full Documentation

| Document | Purpose |
|----------|---------|
| [README.md](./README.md) | Overview & navigation |
| [API_SPECIFICATION.md](./API_SPECIFICATION.md) | Complete API reference |
| [UNIVERSAL_EVENT_PAYLOAD.md](./UNIVERSAL_EVENT_PAYLOAD.md) | Payload structure |
| [FRONTEND_INTEGRATION.md](./FRONTEND_INTEGRATION.md) | Code examples |
| [BACKEND_REFERENCE.md](./BACKEND_REFERENCE.md) | Workflow configuration |

---

## 🚀 Quick Start Checklist

### Frontend Setup

- [ ] Add API URL and key to `.env.local`
- [ ] Copy API client code to `/src/lib/api.ts`
- [ ] Create server action for form submission
- [ ] Build event payload with customer data
- [ ] Call `triggerWorkflow(event)`
- [ ] Handle success/error responses

### Backend Setup

- [ ] Login to l4yercak3 admin
- [ ] Create workflow with appropriate trigger
- [ ] Add behaviors with configuration
- [ ] Set execution settings
- [ ] Activate workflow
- [ ] Test with sample data

---

## 💡 Remember

**One endpoint. One payload structure. Infinite possibilities.**

Frontend sends events → Backend handles complexity → Results returned

That's it! 🎉
