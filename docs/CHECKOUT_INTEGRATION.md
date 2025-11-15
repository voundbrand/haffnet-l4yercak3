# Checkout Integration Guide - Behavior-Driven System

## The Problem You're Solving

**You have a behavior-driven checkout system in your backend.** You don't want to rewrite checkout logic for every frontend (web, iOS, Android, etc.).

**Good news:** You don't have to! Your backend's behavior system handles ALL the complex business logic. The frontend just collects data and displays results.

---

## Core Concept: Backend Does Everything

```
Frontend                     Backend Behaviors
   │                              │
   ├─ Collect product info  ────► │
   ├─ Collect customer info ────► │
   ├─ Collect form data     ────► employer-detection
   │                              invoice-mapping
   │                              consolidated-invoice-generation
   │                              ticket-generation
   │                              email-notification
   │                              payment-provider-selection
   │  ◄──────────────────────── Results (skip payment? invoice ready? etc.)
   │
   └─ Display confirmation
```

**The backend tells the frontend:**
- "Skip the payment step" (employer billing detected)
- "Show invoice payment" (B2B transaction)
- "Process credit card" (B2C transaction)
- "Create tickets now" (post-payment fulfillment)

---

## The Only Approach: API Integration + Payment Provider SDKs

**How it works:**
- Frontend sends events to backend API: `POST /api/v1/workflows/trigger`
- Backend behaviors handle business logic (employer detection, invoice generation, etc.)
- Frontend uses platform-specific payment SDKs (Stripe.js, Stripe iOS, Stripe Android)
- Backend processes payments via payment provider APIs

**Why this approach:**
- ✅ ONE backend serves all platforms (web, iOS, Android)
- ✅ Business logic stays in backend (change without touching frontend)
- ✅ PCI compliant (card data never touches your servers)
- ✅ Platform-specific payment UIs (optimized for each platform)

---

## Full Integration Example (HaffNet)

### Step 1: Understand the Universal Event Pattern

**You send ONE payload** for all checkout events:

```typescript
{
  "trigger": "checkout_complete",
  "inputData": {
    "eventType": "seminar_registration",
    "source": "haffnet_website",

    "customerData": {
      "email": "dr.mueller@charite.de",
      "firstName": "Hans",
      "lastName": "Mueller",
      "organization": "Charité Berlin"
    },

    "formResponses": {
      "specialty": "Kardiologie",
      "licenseNumber": "DE-12345",
      "hotelRequired": true
    },

    "transactionData": {
      "productId": "seminar_kardiologie_2025",
      "productName": "Kardiologie Update 2025",
      "price": 599.00,
      "currency": "EUR",
      "quantity": 1
    }
  }
}
```

### Step 2: Backend Workflows Execute Behaviors

Your backend has a workflow configured for `trigger: "checkout_complete"`:

```typescript
// Backend workflow configuration (stored in L4yerCak3)
{
  triggerOn: "checkout_complete",
  behaviors: [
    {
      type: "employer-detection",
      priority: 100,
      config: {
        hospitalDomains: ["charite.de", "uniklinik-*.de"]
      }
    },
    {
      type: "invoice-mapping",
      priority: 90,
      config: {
        invoiceToEmployer: true
      }
    },
    {
      type: "payment-provider-selection",
      priority: 80,
      config: {
        rules: [
          { if: "employerDetected", then: "invoice" },
          { if: "transactionType=B2B", then: "invoice" },
          { else: "stripe" }
        ]
      }
    },
    {
      type: "consolidated-invoice-generation",
      priority: 70,
      config: {
        templateId: "cme_invoice_template"
      }
    },
    {
      type: "ticket-generation",
      priority: 60,
      config: {
        when: "after_payment",
        deliveryMethod: "email"
      }
    }
  ]
}
```

### Step 3: Backend Returns Actionable Results

```typescript
// What the backend returns
{
  "success": true,
  "transactionId": "txn_123",
  "behaviorResults": [
    {
      "behaviorType": "employer-detection",
      "success": true,
      "data": {
        "employerDetected": true,
        "employerId": "org_charite"
      }
    },
    {
      "behaviorType": "payment-provider-selection",
      "success": true,
      "data": {
        "provider": "invoice",
        "skipPaymentStep": true  // 🎯 Frontend uses this!
      },
      "actions": [
        {
          "type": "skip_payment_step",
          "when": "immediate"
        },
        {
          "type": "create_invoice",
          "when": "immediate"
        }
      ]
    },
    {
      "behaviorType": "consolidated-invoice-generation",
      "success": true,
      "data": {
        "invoiceId": "inv_2025_001",
        "pdfUrl": "https://storage.../invoice.pdf"
      }
    }
  ]
}
```

### Step 4: Frontend Interprets Results

```typescript
// Frontend checkout logic (works for web, iOS, Android)

// Send checkout data to backend
const result = await fetch('/api/v1/workflows/trigger', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    trigger: 'checkout_complete',
    inputData: checkoutData
  })
});

const response = await result.json();

// Check behavior results for actions
const shouldSkipPayment = response.behaviorResults.some(b =>
  b.data?.skipPaymentStep === true
);

if (shouldSkipPayment) {
  // Employer billing - skip to confirmation
  navigate('/confirmation');
} else {
  // Regular checkout - show payment step
  navigate('/payment');
}
```

---

## Frontend Checkout Flow (Any Platform)

### Generic Multi-Step Checkout Pattern

**Works for:** Next.js, React Native, SwiftUI, Kotlin

```typescript
// Step 1: Product Selection
const selectedProducts = [
  { productId: "seminar_xyz", quantity: 1, price: 599 }
];

// Step 2: Registration Form (optional)
const formResponses = {
  specialty: "Kardiologie",
  licenseNumber: "DE-12345",
  hotelRequired: true
};

// Step 3: Customer Information
const customerData = {
  email: "dr.mueller@charite.de",
  firstName: "Hans",
  lastName: "Mueller",
  organization: "Charité Berlin"
};

// Step 4: Send to Backend
const checkoutResult = await triggerWorkflow({
  trigger: "checkout_complete",
  inputData: {
    eventType: "seminar_registration",
    source: "haffnet_website",
    customerData,
    formResponses,
    transactionData: {
      productId: selectedProducts[0].productId,
      price: selectedProducts[0].price,
      currency: "EUR"
    }
  }
});

// Step 5: Check Results
const shouldSkipPayment = checkoutResult.behaviorResults.some(b =>
  b.data?.skipPaymentStep
);

if (shouldSkipPayment) {
  // Backend created invoice and tickets
  // Show confirmation
  showConfirmation({
    invoiceUrl: checkoutResult.behaviorResults.find(b =>
      b.behaviorType === "consolidated-invoice-generation"
    )?.data?.pdfUrl,
    ticketIds: checkoutResult.behaviorResults.find(b =>
      b.behaviorType === "ticket-generation"
    )?.data?.ticketIds
  });
} else {
  // Show payment step (Stripe, PayPal, etc.)
  showPaymentStep({
    amount: selectedProducts[0].price,
    provider: checkoutResult.behaviorResults.find(b =>
      b.behaviorType === "payment-provider-selection"
    )?.data?.provider || "stripe"
  });
}
```

---

## Platform-Specific Examples

### React/Next.js (HaffNet)

```typescript
// /src/app/seminare/[id]/checkout/page.tsx
'use client';

import { useState } from 'react';
import { triggerWorkflow } from '@/lib/api';

export default function CheckoutPage() {
  const [step, setStep] = useState<'customer-info' | 'payment' | 'confirmation'>('customer-info');
  const [checkoutData, setCheckoutData] = useState({});

  const handleCustomerInfoSubmit = async (customerData: any) => {
    const result = await triggerWorkflow({
      trigger: 'checkout_complete',
      inputData: {
        eventType: 'seminar_registration',
        source: 'haffnet_website',
        customerData,
        transactionData: {
          productId: params.id,
          price: 599
        }
      }
    });

    // Check if backend says to skip payment
    const skipPayment = result.behaviorResults.some(b =>
      b.data?.skipPaymentStep
    );

    if (skipPayment) {
      setStep('confirmation');
    } else {
      setStep('payment');
    }
  };

  return (
    <div>
      {step === 'customer-info' && (
        <CustomerInfoForm onSubmit={handleCustomerInfoSubmit} />
      )}
      {step === 'payment' && (
        <PaymentForm />
      )}
      {step === 'confirmation' && (
        <Confirmation />
      )}
    </div>
  );
}
```

### React Native (iOS/Android)

```typescript
// Same logic, different UI components
import { useState } from 'react';
import { View, Text, Button } from 'react-native';
import { triggerWorkflow } from '@/lib/api';

export default function CheckoutScreen() {
  const [step, setStep] = useState('customer-info');

  const handleSubmit = async (customerData: any) => {
    const result = await triggerWorkflow({
      trigger: 'checkout_complete',
      inputData: {
        eventType: 'seminar_registration',
        source: 'ios_app', // or 'android_app'
        customerData,
        transactionData: { productId: 'xyz', price: 599 }
      }
    });

    const skipPayment = result.behaviorResults.some(b =>
      b.data?.skipPaymentStep
    );

    if (skipPayment) {
      navigation.navigate('Confirmation');
    } else {
      navigation.navigate('Payment');
    }
  };

  return (
    <View>
      {/* Same checkout logic, native UI */}
    </View>
  );
}
```

### SwiftUI (Native iOS)

```swift
// Swift example using URLSession
struct CheckoutView: View {
    @State private var step: CheckoutStep = .customerInfo

    func submitCheckout(customerData: CustomerData) async {
        let payload = CheckoutPayload(
            trigger: "checkout_complete",
            inputData: InputData(
                eventType: "seminar_registration",
                source: "ios_native_app",
                customerData: customerData,
                transactionData: TransactionData(
                    productId: "xyz",
                    price: 599
                )
            )
        )

        let result = await API.triggerWorkflow(payload)

        let shouldSkipPayment = result.behaviorResults.contains { behavior in
            behavior.data?.skipPaymentStep == true
        }

        if shouldSkipPayment {
            step = .confirmation
        } else {
            step = .payment
        }
    }

    var body: some View {
        // SwiftUI checkout UI
    }
}
```

---

## Behavior System Benefits

### 1. **No Frontend Duplication**

**Bad (Old Way):**
```typescript
// iOS app
if (customerEmail.contains("@charite.de")) {
  skipPayment = true;
}

// Android app
if (customerEmail.contains("@charite.de")) {
  skipPayment = true;
}

// Web app
if (customerEmail.includes("@charite.de")) {
  skipPayment = true;
}
```

**Good (Behavior Way):**
```typescript
// Backend behavior (ALL platforms use this)
{
  type: "employer-detection",
  config: {
    hospitalDomains: ["charite.de", "uniklinik-*.de"]
  }
}

// iOS/Android/Web just check the result
if (result.data?.skipPaymentStep) {
  // Skip payment
}
```

### 2. **Easy to Update Rules**

**Change employer detection rules in backend:**
```typescript
// Add new hospital domain - NO CODE CHANGES
{
  type: "employer-detection",
  config: {
    hospitalDomains: [
      "charite.de",
      "uniklinik-*.de",
      "meduni-*.at"  // ← New Austrian hospitals
    ]
  }
}
```

**All frontends automatically use new rules!** ✨

### 3. **Complex Logic Stays in Backend**

Example: Invoice mapping behavior

```typescript
// Backend handles complexity
{
  type: "invoice-mapping",
  apply: (config, extracted, context) => {
    const employer = context.behaviorData?.["employer-detection"];
    const customerType = context.actor?.metadata?.transactionType;

    if (employer?.employerDetected) {
      return {
        success: true,
        data: {
          invoiceTo: "employer",
          employerOrgId: employer.employerId,
          paymentTerms: "net30",
          skipPaymentStep: true
        },
        actions: [{
          type: "skip_payment_step",
          when: "immediate"
        }]
      };
    }

    if (customerType === "B2B") {
      return {
        success: true,
        data: {
          invoiceTo: "customer",
          paymentTerms: "net15",
          requireUpfrontPayment: false
        }
      };
    }

    return {
      success: true,
      data: {
        invoiceTo: "customer",
        paymentMethod: "stripe",
        requireUpfrontPayment: true
      }
    };
  }
}
```

**Frontend doesn't care HOW the decision is made:**
```typescript
// Simple frontend code
if (result.data?.skipPaymentStep) {
  navigate('/confirmation');
} else {
  navigate('/payment');
}
```

---

## Checkout Behavior Examples

### Available Behaviors (Your Backend)

1. **`employer-detection`** - Detect if customer works at hospital/company
2. **`invoice-mapping`** - Determine invoice recipient and payment terms
3. **`payment-provider-selection`** - Choose payment method (Stripe, invoice, etc.)
4. **`addon-calculation`** - Calculate add-ons from form responses
5. **`tax-calculation`** - Calculate taxes based on location
6. **`consolidated-invoice-generation`** - Generate PDF invoice
7. **`ticket-generation`** - Create attendee tickets
8. **`email-notification`** - Send confirmation emails
9. **`contact-creation`** - Create/update CRM contact

### How They Work Together

```typescript
// Example: Seminar registration with employer billing

// Behavior 1: employer-detection (priority 100)
{
  input: { email: "dr.mueller@charite.de" },
  output: {
    employerDetected: true,
    employerId: "org_charite",
    employerName: "Charité Berlin"
  }
}

// Behavior 2: invoice-mapping (priority 90)
// Uses output from behavior 1
{
  input: { employerDetected: true, employerId: "org_charite" },
  output: {
    invoiceTo: "employer",
    paymentTerms: "net30",
    skipPaymentStep: true
  },
  actions: [
    { type: "skip_payment_step", when: "immediate" }
  ]
}

// Behavior 3: consolidated-invoice-generation (priority 80)
{
  input: { invoiceTo: "employer", employerId: "org_charite" },
  output: {
    invoiceId: "inv_2025_001",
    pdfUrl: "https://.../invoice.pdf"
  }
}

// Behavior 4: ticket-generation (priority 70)
{
  input: { customerId: "contact_123", productId: "seminar_xyz" },
  output: {
    ticketId: "ticket_abc",
    qrCode: "https://.../qrcode.png"
  }
}
```

---

## Next Steps

### For HaffNet (Next.js)

1. ✅ Create checkout form that collects customer data
2. ✅ Send to `/api/v1/workflows/trigger`
3. ✅ Check `behaviorResults` for `skipPaymentStep`
4. ✅ If payment needed, load Stripe.js SDK
5. ✅ Create payment token on frontend, send to backend
6. ✅ Backend processes payment and returns results

### For BNI Network (React)

Same pattern:
```typescript
trigger: "rsvp_submit",
inputData: {
  eventType: "chapter_meeting_rsvp",
  // ... BNI-specific data
}
```

### For Party RSVP (React Native)

Same pattern, mobile UI:
```typescript
trigger: "rsvp_submit",
inputData: {
  eventType: "wedding_rsvp",
  source: "ios_app",
  // ... party RSVP data
}
```

---

## Key Takeaway

**You write checkout logic ONCE (in backend behaviors).**

**Every frontend just:**
1. Collects data
2. Sends to API
3. Reads behavior results
4. Shows appropriate UI

**No duplication. No logic in frontends. Easy to maintain.** 🎉

---

## See Also

- [API_SPECIFICATION.md](./API_SPECIFICATION.md) - Complete API reference
- [BACKEND_REFERENCE.md](./BACKEND_REFERENCE.md) - Backend behavior system
- [FRONTEND_INTEGRATION.md](./FRONTEND_INTEGRATION.md) - Frontend examples
