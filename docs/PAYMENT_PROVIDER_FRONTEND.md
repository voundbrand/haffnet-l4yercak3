# Payment Provider Integration - Frontend Reality Check

## The Truth About Payment Providers

**You're absolutely right.** Payment providers like Stripe, PayPal, etc. **require frontend components**. You can't fully decouple them.

Here's what the backend behavior system **actually handles** vs what the **frontend must do**:

---

## What Backend Behaviors Handle

### 1. **Business Logic** (100% Backend)

```typescript
// Backend decides WHICH payment provider to use
{
  type: "payment-provider-selection",
  config: {
    rules: [
      { if: "employerDetected", then: "invoice" },
      { if: "transactionType=B2B", then: "invoice" },
      { if: "country=DE", then: "stripe" },
      { if: "country=US", then: "stripe" },
      { else: "paypal" }
    ]
  }
}

// Backend decides IF payment should be skipped
{
  type: "invoice-mapping",
  apply: () => {
    if (employerDetected) {
      return {
        success: true,
        data: { skipPaymentStep: true },
        actions: [{ type: "skip_payment_step" }]
      };
    }
  }
}
```

### 2. **Invoice Generation** (100% Backend)

```typescript
// Backend creates invoices - no frontend needed
{
  type: "consolidated-invoice-generation",
  config: {
    templateId: "cme_invoice",
    paymentTerms: "net30"
  }
}
// Returns: pdfUrl, invoiceId
```

### 3. **Ticket Creation** (100% Backend)

```typescript
// Backend creates tickets after payment
{
  type: "ticket-generation",
  config: {
    when: "after_payment"
  }
}
```

---

## What Frontend MUST Handle

### 1. **Payment Provider UI** (Frontend Required)

**Stripe, PayPal, etc. require frontend SDKs for security reasons.**

You **cannot** send credit card numbers to your backend directly. That would violate PCI compliance.

#### ❌ What You CANNOT Do:

```typescript
// WRONG - Never send card details to your backend!
const result = await fetch('/api/checkout', {
  body: JSON.stringify({
    cardNumber: '4242424242424242',  // ❌ PCI violation!
    cvv: '123',                      // ❌ Security risk!
    expiry: '12/25'                  // ❌ Don't do this!
  })
});
```

#### ✅ What You MUST Do:

```typescript
// CORRECT - Use Stripe.js on frontend
import { loadStripe } from '@stripe/stripe-js';

const stripe = await loadStripe('pk_live_...');
const elements = stripe.elements();
const cardElement = elements.create('card');

// Stripe.js creates a token WITHOUT sending card data to your backend
const { token } = await stripe.createToken(cardElement);

// Now send the TOKEN to your backend
const result = await fetch('/api/checkout', {
  body: JSON.stringify({
    paymentToken: token.id  // ✅ Safe - no card data
  })
});
```

---

## The Real Architecture: Hybrid Approach

### Backend: Business Logic
### Frontend: Payment UI

```
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND (React, iOS, Android)                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Step 1: Collect Customer Info                              │
│  ├─ Email, name, organization                               │
│  └─ Send to backend ───────────────────┐                    │
│                                         │                    │
│                                         ▼                    │
│                         ┌───────────────────────────┐        │
│                         │ BACKEND BEHAVIORS         │        │
│                         ├───────────────────────────┤        │
│                         │ employer-detection        │        │
│                         │ invoice-mapping           │        │
│                         │ payment-provider-selection│        │
│                         └───────────────────────────┘        │
│                                         │                    │
│  ◄──────────────────────────────────────┘                    │
│  Backend returns:                                            │
│  - paymentProvider: "stripe"                                 │
│  - skipPaymentStep: false                                    │
│  - amount: 599                                               │
│                                                              │
│  Step 2: Frontend Uses Provider SDK                          │
│  ├─ If provider === "stripe"                                │
│  │   └─ Load Stripe.js ────────────────┐                    │
│  ├─ If provider === "paypal"            │                    │
│  │   └─ Load PayPal SDK                 │                    │
│  └─ If provider === "invoice"           │                    │
│      └─ Skip payment (show confirmation)│                    │
│                                          │                    │
│  ┌───────────────────────────────────────┘                   │
│  │ Stripe.js (frontend)                                      │
│  ├─ Customer enters card details                             │
│  ├─ Stripe.js creates token (card data never hits backend)   │
│  └─ Return token to your code ──────────┐                    │
│                                          │                    │
│  Step 3: Send Token to Backend          │                    │
│  └─ POST /api/payment ──────────────────┼────┐               │
│     {                                    │    │               │
│       paymentToken: "tok_xxx",           │    ▼               │
│       transactionId: "txn_123"           │  ┌─────────────┐   │
│     }                                    │  │ BACKEND     │   │
│                                          │  ├─────────────┤   │
│                                          │  │ Stripe API  │   │
│                                          │  │ charge card │   │
│                                          │  │ using token │   │
│                                          │  └─────────────┘   │
│                                          │    │               │
│  ◄───────────────────────────────────────────┘               │
│  Backend returns:                                            │
│  - success: true                                             │
│  - ticketIds: [...]                                          │
│  - invoiceUrl: "..."                                         │
│                                                              │
│  Step 4: Show Confirmation                                   │
│  └─ Display tickets, invoice, etc.                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## The Split: What Goes Where

### Backend Behavior System Handles:

1. ✅ **Employer detection** - "Is this a hospital email?"
2. ✅ **Payment provider selection** - "Use Stripe or invoice?"
3. ✅ **Invoice generation** - Generate PDF invoices
4. ✅ **Ticket creation** - Create attendee tickets
5. ✅ **Email notifications** - Send confirmation emails
6. ✅ **CRM updates** - Create/update contacts
7. ✅ **Payment processing** - Charge cards using provider APIs (backend-to-backend)

### Frontend MUST Handle:

1. ❌ **Payment UI components** - Stripe Elements, PayPal buttons
2. ❌ **Card input forms** - Secure card number entry
3. ❌ **Token creation** - Convert card → token (via provider SDK)
4. ❌ **3D Secure flows** - Authentication popups
5. ❌ **Platform-specific payment** - Apple Pay, Google Pay

---

## Concrete Example: Stripe Integration

### Step 1: Backend Decides "Use Stripe"

```typescript
// Frontend sends customer data
const checkoutResult = await triggerCheckout({
  trigger: 'checkout_start',
  inputData: {
    customerData: {
      email: 'customer@example.com',
      organization: '' // No employer
    },
    transactionData: {
      productId: 'seminar_xyz',
      price: 599
    }
  }
});

// Backend behaviors execute
// employer-detection → No employer found
// payment-provider-selection → Returns "stripe"

console.log(checkoutResult.behaviorResults);
// [
//   { behaviorType: "employer-detection", data: { employerDetected: false } },
//   { behaviorType: "payment-provider-selection", data: { provider: "stripe" } }
// ]
```

### Step 2: Frontend Loads Stripe SDK

```typescript
// Frontend checks which provider to use
const provider = checkoutResult.behaviorResults.find(
  b => b.behaviorType === 'payment-provider-selection'
)?.data?.provider;

if (provider === 'stripe') {
  // Load Stripe SDK (frontend)
  const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

  // Create Stripe Elements
  const elements = stripe.elements();
  const cardElement = elements.create('card');
  cardElement.mount('#card-element');
}
```

### Step 3: Customer Enters Card Details

```tsx
// Frontend component
<form onSubmit={handlePayment}>
  {/* Stripe Elements inject secure iframe here */}
  <div id="card-element"></div>

  <button type="submit">Pay €599</button>
</form>
```

### Step 4: Frontend Creates Token

```typescript
async function handlePayment(e) {
  e.preventDefault();

  // Stripe.js creates token (card data goes directly to Stripe, NOT your backend)
  const { token, error } = await stripe.createToken(cardElement);

  if (error) {
    alert(error.message);
    return;
  }

  // Now send token to YOUR backend
  const result = await fetch('/api/v1/payments/process', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      transactionId: checkoutResult.transactionId,
      paymentToken: token.id,  // ✅ Safe - just a token
      amount: 599,
      currency: 'EUR'
    })
  });
}
```

### Step 5: Backend Charges Card

```typescript
// Backend endpoint: /api/v1/payments/process
import Stripe from 'stripe';

export async function processPayment(req) {
  const { paymentToken, amount, transactionId } = req.body;

  // Backend uses SECRET key (never exposed to frontend)
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  // Charge the card using the token
  const charge = await stripe.charges.create({
    amount: amount * 100, // cents
    currency: 'eur',
    source: paymentToken,  // Token from frontend
    description: `Seminar registration ${transactionId}`
  });

  // Now trigger post-payment behaviors
  const result = await executeWorkflow({
    trigger: 'payment_complete',
    inputData: {
      transactionId,
      paymentProvider: 'stripe',
      chargeId: charge.id
    }
  });

  // Backend behaviors execute:
  // - ticket-generation
  // - email-notification
  // - CRM contact creation

  return {
    success: true,
    ticketIds: result.behaviorResults.find(b => b.type === 'ticket-generation')?.data?.ticketIds,
    invoiceUrl: result.behaviorResults.find(b => b.type === 'invoice-generation')?.data?.pdfUrl
  };
}
```

---

## So What CAN You Reuse?

### ✅ You DON'T Need to Rewrite:

1. **Employer detection logic** - Backend behavior handles this
2. **Invoice generation** - Backend creates PDFs
3. **Payment provider selection rules** - Backend decides which provider
4. **Ticket creation** - Backend generates tickets
5. **Email templates** - Backend sends emails
6. **Business logic** - All backend behaviors

### ❌ You DO Need to Implement Per Platform:

1. **Payment form UI** - React component, SwiftUI, Kotlin UI
2. **Stripe SDK integration** - `@stripe/stripe-js` (web), Stripe iOS SDK, Stripe Android SDK
3. **Card input fields** - Platform-specific UI
4. **3D Secure handling** - Platform-specific modals

---

## Platform-Specific Payment Components

### Web (React)

```bash
npm install @stripe/stripe-js @stripe/react-stripe-js
```

```tsx
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe('pk_live_...');

function PaymentForm() {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { token } = await stripe.createToken(elements.getElement(CardElement));

    // Send token to backend
    await processPayment(token.id);
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      <button type="submit">Pay</button>
    </form>
  );
}

export function CheckoutPage() {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm />
    </Elements>
  );
}
```

### iOS (Swift)

```swift
import Stripe

class PaymentViewController: UIViewController {
    let paymentTextField = STPPaymentCardTextField()

    override func viewDidLoad() {
        super.viewDidLoad()

        // Configure Stripe
        STPAPIClient.shared.publishableKey = "pk_live_..."

        // Add card input field
        view.addSubview(paymentTextField)
    }

    func handlePayment() {
        let cardParams = paymentTextField.cardParams

        STPAPIClient.shared.createToken(withCard: cardParams) { token, error in
            guard let token = token else {
                print("Error creating token: \(error)")
                return
            }

            // Send token to backend
            self.processPayment(token: token.tokenId)
        }
    }
}
```

### Android (Kotlin)

```kotlin
import com.stripe.android.Stripe
import com.stripe.android.model.Card
import com.stripe.android.model.Token

class PaymentActivity : AppCompatActivity() {
    private lateinit var stripe: Stripe

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        stripe = Stripe(
            applicationContext,
            "pk_live_..."
        )
    }

    fun handlePayment() {
        val card = cardInputWidget.card

        stripe.createToken(card!!) { token ->
            // Send token to backend
            processPayment(token.id)
        }
    }
}
```

---

## What You're REALLY Reusing

### Backend Behaviors (100% Reusable)

```typescript
// Configure ONCE in backend
// Used by web, iOS, Android automatically

{
  triggerOn: "checkout_start",
  behaviors: [
    { type: "employer-detection" },
    { type: "payment-provider-selection" },
    { type: "invoice-mapping" }
  ]
}

{
  triggerOn: "payment_complete",
  behaviors: [
    { type: "ticket-generation" },
    { type: "email-notification" },
    { type: "contact-creation" }
  ]
}
```

### Payment Provider SDKs (Platform-Specific)

```
Web:      @stripe/stripe-js
iOS:      pod 'Stripe'
Android:  implementation 'com.stripe:stripe-android'
```

**Each platform needs its own SDK, but they all:**
1. Create tokens from card data
2. Send tokens to your backend
3. Your backend uses the SAME payment processing logic

---

## The Bottom Line

**What you DON'T rewrite:**
- ✅ Employer detection
- ✅ Invoice generation
- ✅ Ticket creation
- ✅ Payment provider selection
- ✅ Email notifications
- ✅ Backend payment processing (charging cards)

**What you DO implement per platform:**
- ❌ Payment form UI (different for web, iOS, Android)
- ❌ Provider SDK integration (different SDKs per platform)
- ❌ Card input components (different UI per platform)

**But the SDKs are similar:**
```
All platforms: collect card → create token → send to backend → done
```

Your backend handles the actual charging and business logic. The frontend just creates the secure token. 🎯
