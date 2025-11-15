# Checkout Integration - Quick Summary

## TL;DR: The Reality

**You can't fully decouple payment providers from the frontend.** Here's what goes where:

### Backend (Behavior System) Handles:
✅ **Business Logic**
- Employer detection ("Is this a hospital email?")
- Invoice generation (PDF creation)
- Payment provider selection ("Use Stripe or invoice?")
- Ticket generation
- Email notifications
- CRM updates
- **Payment processing** (charging cards via provider APIs)

### Frontend MUST Handle:
❌ **Payment UI**
- Stripe Elements / PayPal buttons (platform-specific SDKs)
- Card input forms (secure, PCI-compliant)
- Token creation (card data → secure token)
- Apple Pay / Google Pay (platform-specific)

---

## The Pattern (All Platforms)

```
1. Frontend collects customer data
   ↓
2. Send to backend API /api/v1/workflows/trigger
   ↓
3. Backend behaviors execute (employer detection, etc.)
   ↓
4. Backend returns: "Use Stripe" or "Skip payment (invoice)"
   ↓
5a. If invoice → Show confirmation (done!)
5b. If Stripe → Load Stripe SDK on frontend
   ↓
6. Customer enters card (Stripe.js/iOS/Android SDK)
   ↓
7. Frontend creates token (card never hits your backend)
   ↓
8. Send token to backend /api/payments/process
   ↓
9. Backend charges card using provider API
   ↓
10. Backend returns tickets, invoice, confirmation
```

---

##What You Reuse Across Platforms

### ✅ Backend Behaviors (100% Reusable)

**Configure ONCE in backend, use on web/iOS/Android:**

```typescript
// Backend workflow (all platforms use this)
{
  triggerOn: "checkout_complete",
  behaviors: [
    { type: "employer-detection", priority: 100 },
    { type: "payment-provider-selection", priority: 90 },
    { type: "invoice-generation", priority: 80 },
    { type: "ticket-generation", priority: 70 }
  ]
}
```

### ❌ Payment UI (Platform-Specific)

**Each platform needs its own SDK:**

```bash
# Web
npm install @stripe/stripe-js

# iOS
pod 'Stripe'

# Android
implementation 'com.stripe:stripe-android'
```

**But they all do the same thing:**
1. Collect card info securely
2. Create token (card → token)
3. Send token to backend
4. Done!

---

## Code Volume Comparison

### Without Behavior System (Old Way):

```
Web app:
- Employer detection logic: 50 lines
- Invoice generation: 100 lines
- Payment selection: 75 lines
- Ticket generation: 60 lines
- Stripe integration: 150 lines
Total: 435 lines

iOS app:
- Same employer detection: 50 lines
- Same invoice logic: 100 lines
- Same payment selection: 75 lines
- Same ticket logic: 60 lines
- Stripe iOS SDK: 150 lines
Total: 435 lines

Android app:
- Same employer detection: 50 lines
- Same invoice logic: 100 lines
- Same payment selection: 75 lines
- Same ticket logic: 60 lines
- Stripe Android SDK: 150 lines
Total: 435 lines

TOTAL: 1,305 lines across 3 platforms
```

### With Behavior System (New Way):

```
Backend (configured once):
- Employer detection behavior: 0 lines (admin UI config)
- Invoice generation behavior: 0 lines (admin UI config)
- Payment selection behavior: 0 lines (admin UI config)
- Ticket generation behavior: 0 lines (admin UI config)

Web app:
- API client: 50 lines
- Stripe.js integration: 100 lines
Total: 150 lines

iOS app:
- API client: 50 lines
- Stripe iOS SDK: 100 lines
Total: 150 lines

Android app:
- API client: 50 lines
- Stripe Android SDK: 100 lines
Total: 150 lines

TOTAL: 450 lines across 3 platforms
```

**Savings: 1,305 → 450 lines (65% reduction!)** 🎉

---

## What's Different Per Platform

Only the payment UI:

| Platform | Payment SDK | Code Volume |
|----------|-------------|-------------|
| Web | `@stripe/stripe-js` | ~100 lines |
| iOS | `pod 'Stripe'` | ~100 lines |
| Android | Stripe Android SDK | ~100 lines |

**Everything else (business logic) is in backend behaviors.**

---

## Example: Employer Billing Flow

### Backend Behavior (Configure Once):

```typescript
// employer-detection behavior config (admin UI)
{
  hospitalDomains: ["charite.de", "uniklinik-*.de"]
}
```

### All Frontend Platforms (Same Code):

```typescript
// Web, iOS, Android - same logic!
const result = await fetch('/api/v1/workflows/trigger', {
  body: JSON.stringify({
    trigger: 'checkout_complete',
    inputData: {
      customerData: {
        email: 'dr.mueller@charite.de'
      }
    }
  })
});

if (result.behaviorResults.find(b => b.data?.skipPaymentStep)) {
  // Show confirmation (invoice sent to hospital)
  showConfirmation();
} else {
  // Show payment (individual payment)
  showStripeForm();
}
```

---

## Bottom Line

**What you DON'T rewrite:**
- ✅ Employer detection
- ✅ Invoice generation
- ✅ Payment provider selection
- ✅ Ticket creation
- ✅ Email notifications

**What you DO implement per platform:**
- ❌ Stripe form UI (~100 lines each)

**But the checkout FLOW is identical across all platforms.**

---

## Files to Read

1. **[CHECKOUT_INTEGRATION.md](./CHECKOUT_INTEGRATION.md)** - Full explanation
2. **[PAYMENT_PROVIDER_FRONTEND.md](./PAYMENT_PROVIDER_FRONTEND.md)** - Payment reality check
3. **[CHECKOUT_CODE_EXAMPLES.md](./CHECKOUT_CODE_EXAMPLES.md)** - Copy/paste code

**Start here:** CHECKOUT_INTEGRATION.md → understand the system
**Then:** PAYMENT_PROVIDER_FRONTEND.md → understand payment SDKs
**Finally:** CHECKOUT_CODE_EXAMPLES.md → copy code and ship! 🚀
