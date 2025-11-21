# Frontend Authentication & Checkout Implementation Guide

## ✅ Implementation Complete!

This guide explains how to use the newly implemented authentication and checkout features in your Next.js frontend.

---

## 📁 Project Structure

```
src/
├── app/
│   ├── layout.tsx                    # ✅ Updated with Providers
│   ├── providers.tsx                 # ✅ NEW: Convex provider
│   ├── dashboard/
│   │   └── page.tsx                  # ✅ NEW: Protected dashboard
│   └── auth/
│       └── google/
│           └── callback/
│               └── page.tsx          # ✅ NEW: OAuth callback handler
├── components/
│   ├── frontend-auth/
│   │   ├── LoginForm.tsx             # ✅ NEW: Login form
│   │   ├── RegisterForm.tsx          # ✅ NEW: Registration form
│   │   ├── AuthModal.tsx             # ✅ NEW: Auth modal wrapper
│   │   ├── ProtectedRoute.tsx        # ✅ NEW: Protected route HOC
│   │   └── OAuthCallback.tsx         # ✅ NEW: OAuth handler
│   ├── checkout/
│   │   └── CheckoutForm.tsx          # ✅ NEW: Checkout flow
│   ├── dashboard/
│   │   └── UserDashboard.tsx         # ✅ NEW: User dashboard
│   └── ui/
│       ├── dialog.tsx                # ✅ NEW: Modal component
│       ├── button.tsx                # ✅ Existing
│       ├── input.tsx                 # ✅ Existing
│       └── ... (other UI components)
├── hooks/
│   ├── useFrontendAuth.ts            # ✅ NEW: Auth hook
│   └── useCheckout.ts                # ✅ NEW: Checkout hook
├── stores/
│   ├── useFrontendAuthStore.ts       # ✅ NEW: Auth state (Zustand)
│   └── useCheckoutStore.ts           # ✅ NEW: Checkout state (Zustand)
└── lib/
    └── api-client.ts                 # ✅ Existing: Backend API client

convex/
├── schema.ts                         # ✅ Existing: Database schema
└── frontendAuth.ts                   # ✅ NEW: Auth actions
```

---

## 🚀 Quick Start

### 1. Environment Configuration

Ensure your `.env.local` has the required variables:

```bash
# Convex (for authentication & real-time data)
NEXT_PUBLIC_CONVEX_URL=https://giddy-bison-234.convex.cloud

# Backend API (for checkout & public data)
NEXT_PUBLIC_API_URL=https://agreeable-lion-828.convex.site/api/v1
NEXT_PUBLIC_API_KEY=org_ks79z6rj8kc42sn7r847smrdr57vd3mz_00lbs61zzosdidru0vucxp4xynnbbp3p

# Organization ID
NEXT_PUBLIC_ORG_ID=ks79z6rj8kc42sn7r847smrdr57vd3mz

# Optional: Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

### 2. Start Development Server

```bash
# Terminal 1: Start Convex dev
npx convex dev

# Terminal 2: Start Next.js dev
npm run dev
```

---

## 🔐 Authentication Implementation

### Using the Auth Modal

```typescript
'use client';

import { useState } from 'react';
import { AuthModal } from '@/components/frontend-auth/AuthModal';
import { Button } from '@/components/ui/button';

export function MyPage() {
  const [showAuth, setShowAuth] = useState(false);

  return (
    <>
      <Button onClick={() => setShowAuth(true)}>
        Log In / Register
      </Button>

      <AuthModal
        open={showAuth}
        onOpenChange={setShowAuth}
        defaultView="login" // or "register"
        onSuccess={() => {
          console.log('User logged in!');
          setShowAuth(false);
        }}
      />
    </>
  );
}
```

### Using the Auth Hook

```typescript
'use client';

import { useFrontendAuth } from '@/hooks/useFrontendAuth';

export function UserProfile() {
  const { user, isAuthenticated, loading, logout } = useFrontendAuth();

  if (loading) return <div>Loading...</div>;

  if (!isAuthenticated) return <div>Please log in</div>;

  return (
    <div>
      <h1>Welcome, {user?.firstName}!</h1>
      <p>Email: {user?.email}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Protecting Routes

```typescript
import { ProtectedRoute } from '@/components/frontend-auth/ProtectedRoute';

export default function MyProtectedPage() {
  return (
    <ProtectedRoute>
      <div>This content is only visible to authenticated users</div>
    </ProtectedRoute>
  );
}
```

### Manual Login/Register

```typescript
import { useFrontendAuth } from '@/hooks/useFrontendAuth';

export function ManualAuth() {
  const { login, register, loading } = useFrontendAuth();

  const handleLogin = async () => {
    const result = await login({
      email: 'user@example.com',
      password: 'password123',
    });

    if (result.success) {
      console.log('Logged in!', result.user);
    } else {
      console.error('Login failed:', result.message);
    }
  };

  const handleRegister = async () => {
    const result = await register({
      email: 'new@example.com',
      password: 'securepassword',
      firstName: 'John',
      lastName: 'Doe',
      phone: '+49 123 456789',
    });

    if (result.success) {
      console.log('Registered!', result.user);
    } else {
      console.error('Registration failed:', result.message);
    }
  };

  return (
    <div>
      <button onClick={handleLogin} disabled={loading}>Login</button>
      <button onClick={handleRegister} disabled={loading}>Register</button>
    </div>
  );
}
```

---

## 💳 Checkout Implementation

### Using the Checkout Form

```typescript
'use client';

import { CheckoutForm } from '@/components/checkout/CheckoutForm';
import { useRouter } from 'next/navigation';

export function EventRegistration() {
  const router = useRouter();

  return (
    <CheckoutForm
      productId="prod_abc123"
      organizationId={process.env.NEXT_PUBLIC_ORG_ID!}
      onSuccess={(ticketId) => {
        console.log('Registration complete!', ticketId);
        router.push(`/tickets/${ticketId}`);
      }}
      onError={(error) => {
        console.error('Checkout failed:', error);
      }}
    />
  );
}
```

### Manual Checkout Flow

```typescript
import { useCheckout } from '@/hooks/useCheckout';
import { useState } from 'react';

export function ManualCheckout() {
  const { createSession, confirmPayment, loading } = useCheckout();
  const [sessionId, setSessionId] = useState<string | null>(null);

  const handleCreateSession = async () => {
    const session = await createSession({
      organizationId: process.env.NEXT_PUBLIC_ORG_ID!,
      productId: 'prod_abc123',
      customerEmail: 'customer@example.com',
      customerName: 'John Doe',
      customerPhone: '+49 123 456789',
      paymentMethod: 'free', // or 'stripe', 'invoice'
    });

    if (session) {
      console.log('Session created:', session.sessionId);
      setSessionId(session.sessionId);

      // For Stripe, redirect to session.stripeSessionUrl
      if (session.stripeSessionUrl) {
        window.location.href = session.stripeSessionUrl;
      }
    }
  };

  const handleConfirmPayment = async () => {
    if (!sessionId) return;

    const result = await confirmPayment({
      sessionId,
      checkoutSessionId: sessionId,
      paymentIntentId: 'free', // or 'invoice', or Stripe payment intent ID
    });

    if (result.success) {
      console.log('Payment confirmed!', result.ticketId);
    } else {
      console.error('Payment failed:', result.message);
    }
  };

  return (
    <div>
      <button onClick={handleCreateSession} disabled={loading}>
        Create Session
      </button>
      {sessionId && (
        <button onClick={handleConfirmPayment} disabled={loading}>
          Confirm Payment
        </button>
      )}
    </div>
  );
}
```

---

## 🗂️ State Management (Zustand)

### Auth Store

```typescript
import { useFrontendAuthStore } from '@/stores/useFrontendAuthStore';

// Get state
const { user, sessionToken, loading } = useFrontendAuthStore();

// Set state
useFrontendAuthStore.getState().setUser(user);
useFrontendAuthStore.getState().setSessionToken(token);
useFrontendAuthStore.getState().logout();
```

### Checkout Store

```typescript
import { useCheckoutStore } from '@/stores/useCheckoutStore';

// Get state
const { products, customerInfo, paymentMethod } = useCheckoutStore();

// Set state
useCheckoutStore.getState().setProducts([{ productId: 'prod_123', quantity: 1 }]);
useCheckoutStore.getState().setCustomerInfo({ email: 'user@example.com', name: 'John Doe' });
useCheckoutStore.getState().setPaymentMethod('stripe');
useCheckoutStore.getState().reset(); // Clear all checkout data
```

---

## 🔄 Real-time Data with Convex

### Session Verification (Automatic)

The `useFrontendAuth` hook automatically verifies sessions in real-time:

```typescript
const { isAuthenticated, user } = useFrontendAuth();

// isAuthenticated updates automatically when session expires
// user data updates automatically when contact info changes
```

### Custom Convex Queries

```typescript
'use client';

import { useQuery } from 'convex/react';
import { api } from '@/../convex/_generated/api';

export function MyTickets() {
  const { user } = useFrontendAuth();

  // Real-time query - updates automatically!
  const tickets = useQuery(
    api.tickets.getMyTickets,
    user ? { userId: user.userId } : 'skip'
  );

  return (
    <div>
      {tickets?.map(ticket => (
        <div key={ticket._id}>{ticket.name}</div>
      ))}
    </div>
  );
}
```

---

## 🛠️ Backend API Integration

### Available Endpoints

The backend API client ([src/lib/api-client.ts](src/lib/api-client.ts)) provides:

```typescript
import { eventApi, formApi, workflowApi, ticketApi, transactionApi } from '@/lib/api-client';

// Get events
const { events, total } = await eventApi.getEvents({ upcoming: true });

// Get single event
const event = await eventApi.getEvent('event_123');

// Get event products
const { products } = await eventApi.getEventProducts('event_123');

// Get form
const { data: form } = await formApi.getPublicForm('form_123');

// Submit registration (legacy - prefer useCheckout hook)
const response = await workflowApi.submitRegistration({
  eventId: 'event_123',
  formId: 'form_123',
  products: [{ productId: 'prod_123', quantity: 1 }],
  customerData: { /* ... */ },
  formResponses: { /* ... */ },
  transactionData: { /* ... */ },
});

// Get ticket
const { data: ticket } = await ticketApi.getTicket('ticket_123');

// Verify ticket QR code
const { data: verification } = await ticketApi.verifyTicket('ticket_123');
```

---

## 🧪 Testing

### Manual Testing Checklist

**Authentication:**
- [ ] User can register with email/password
- [ ] User can log in with existing credentials
- [ ] Invalid credentials show error message
- [ ] Session persists after page refresh
- [ ] User can log out
- [ ] Protected routes redirect to login
- [ ] Dashboard shows user information

**Checkout:**
- [ ] Checkout form collects customer info
- [ ] Payment method selection works
- [ ] Free registration completes successfully
- [ ] Stripe redirect works (if configured)
- [ ] Invoice method creates session
- [ ] Success message displays after completion
- [ ] Error messages display on failure

### Example Test Page

Create `src/app/test-auth/page.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { useFrontendAuth } from '@/hooks/useFrontendAuth';
import { Button } from '@/components/ui/button';
import { AuthModal } from '@/components/frontend-auth/AuthModal';

export default function TestAuthPage() {
  const [showModal, setShowModal] = useState(false);
  const { user, isAuthenticated, loading, logout } = useFrontendAuth();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Authentication Test Page</h1>

      <div className="space-y-4">
        <div>
          <strong>Status:</strong> {loading ? 'Loading...' : isAuthenticated ? 'Authenticated' : 'Not authenticated'}
        </div>

        {user && (
          <div>
            <strong>User:</strong>
            <pre className="bg-gray-100 p-4 rounded mt-2">
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>
        )}

        <div className="flex gap-3">
          <Button onClick={() => setShowModal(true)}>
            Open Auth Modal
          </Button>
          {isAuthenticated && (
            <Button variant="outline" onClick={logout}>
              Logout
            </Button>
          )}
        </div>
      </div>

      <AuthModal
        open={showModal}
        onOpenChange={setShowModal}
        onSuccess={() => setShowModal(false)}
      />
    </div>
  );
}
```

---

## 📚 Architecture Overview

### Hybrid Backend Approach

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                   │
│                  customer-domain.com                    │
└─────────────────────────────────────────────────────────┘
                │                    │
                │                    │
                ▼                    ▼
    ┌──────────────────┐   ┌──────────────────┐
    │   Convex (Auth)  │   │  Backend API     │
    │                  │   │  (Checkout/Data) │
    ├──────────────────┤   ├──────────────────┤
    │ • Login/Register │   │ • Create Session │
    │ • OAuth Callback │   │ • Confirm Payment│
    │ • Session Check  │   │ • Get Events     │
    │ • My Tickets     │   │ • Downloads      │
    │ • Real-time Sub  │   │ • Public Data    │
    └──────────────────┘   └──────────────────┘
                │                    │
                │                    │
                ▼                    ▼
    ┌──────────────────────────────────┐
    │     Convex Database              │
    │  • frontend_user objects         │
    │  • frontend_session objects      │
    │  • tickets, purchases            │
    │  • CRM data                      │
    └──────────────────────────────────┘
```

### Why Hybrid?

- **Convex**: Real-time auth, session management, OAuth callbacks on customer domain
- **Backend API**: Checkout, payments, public data, file downloads (accessible from anywhere)

---

## 🔧 Troubleshooting

### Common Issues

**"NEXT_PUBLIC_CONVEX_URL is not defined"**
- Ensure `.env.local` has `NEXT_PUBLIC_CONVEX_URL` set
- Restart Next.js dev server: `npm run dev`

**"Convex functions not found"**
- Run `npx convex dev` in a separate terminal
- Check that `convex/_generated/api.d.ts` exists

**"Session not persisting"**
- Check browser localStorage for `frontend-auth-storage`
- Clear localStorage and try logging in again

**"Checkout fails with network error"**
- Verify `NEXT_PUBLIC_API_URL` is correct in `.env.local`
- Check backend API is running
- Inspect network tab for error details

---

## 🎯 Next Steps

1. **Customize UI**: Update components in `src/components/` to match your design
2. **Add OAuth Providers**: Implement Google OAuth callback logic in [OAuthCallback.tsx](src/components/frontend-auth/OAuthCallback.tsx)
3. **Real Tickets Query**: Create Convex query for user tickets and add to dashboard
4. **Email Verification**: Add email verification flow (requires backend support)
5. **Password Reset**: Implement password reset functionality
6. **Profile Management**: Add user profile editing in dashboard

---

## 📖 Additional Resources

- **Convex Documentation**: https://docs.convex.dev
- **Next.js Documentation**: https://nextjs.org/docs
- **Zustand Documentation**: https://docs.pmnd.rs/zustand
- **Radix UI Documentation**: https://www.radix-ui.com/primitives
- **Tailwind CSS**: https://tailwindcss.com/docs

---

## ✅ Implementation Checklist

- [x] Install Zustand
- [x] Create Convex auth actions
- [x] Set up Convex provider
- [x] Create Zustand stores (auth + checkout)
- [x] Implement useFrontendAuth hook
- [x] Implement useCheckout hook
- [x] Build LoginForm component
- [x] Build RegisterForm component
- [x] Build AuthModal component
- [x] Build ProtectedRoute wrapper
- [x] Build OAuthCallback component
- [x] Build CheckoutForm component
- [x] Build UserDashboard component
- [x] Add Dialog (Modal) UI component
- [x] Update root layout with Providers
- [x] Generate Convex API types

---

**Happy coding! 🚀**

If you have any questions, check the inline documentation in each file or refer to this guide.
