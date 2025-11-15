# Frontend Integration Guide - Event-Driven API

## Overview

This guide shows how to integrate any frontend (web, mobile) with the L4yerCak3 event-driven API.

**Key Concept**: Your frontend sends **events** to the API. The backend handles all the complex workflow logic.

---

## Setup

### 1. Environment Variables

Create `.env.local`:

```bash
# L4yerCak3 API
NEXT_PUBLIC_API_URL=https://api.l4yercak3.com
NEXT_PUBLIC_API_KEY=your_api_key_here

# Organization
NEXT_PUBLIC_ORG_SLUG=haffnet
```

### 2. API Client

Create `/src/lib/l4yercak3-api.ts`:

```typescript
/**
 * L4yerCak3 API Client
 *
 * Universal event-driven API client for triggering workflows.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL!;
const API_KEY = process.env.NEXT_PUBLIC_API_KEY!;

export interface WorkflowEvent {
  trigger: string;
  inputData: {
    eventType: string;
    eventId: string;
    source: string;
    customerData?: object;
    formResponses?: object;
    transactionData?: object;
    metadata?: object;
  };
  webhookUrl?: string;
}

export interface WorkflowResponse {
  success: boolean;
  transactionId: string;
  ticketId?: string;
  invoiceId?: string;
  contactId?: string;
  workflowId?: string;
  behaviorResults?: Array<{
    behaviorType: string;
    success: boolean;
    message: string;
    data?: object;
  }>;
  message: string;
}

export class L4yerCak3API {
  /**
   * Trigger a workflow with an event
   */
  static async triggerWorkflow(event: WorkflowEvent): Promise<WorkflowResponse> {
    const response = await fetch(`${API_URL}/api/v1/workflows/trigger`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify(event)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `API error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Helper: Build customer data from form
   */
  static buildCustomerData(formData: FormData) {
    return {
      email: formData.get('email') as string,
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      title: formData.get('title') as string,
      phone: formData.get('phone') as string,
      organization: formData.get('organization') as string
    };
  }

  /**
   * Helper: Build transaction data
   */
  static buildTransactionData(product: {
    id: string;
    name: string;
    price: number;
  }) {
    return {
      productId: product.id,
      productName: product.name,
      price: product.price,
      currency: 'EUR',
      quantity: 1
    };
  }

  /**
   * Helper: Build metadata
   */
  static buildMetadata(source: string = 'website') {
    return {
      source,
      userAgent: navigator.userAgent,
      locale: navigator.language,
      registeredAt: new Date().toISOString()
    };
  }
}
```

---

## Use Cases

### 1. Seminar Registration Form

#### Step 1: Registration Form Component

`/src/app/seminare/[id]/register/page.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { handleSeminarRegistration } from './actions';

export default function SeminarRegistrationPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);

    try {
      const result = await handleSeminarRegistration(formData);

      if (result.success) {
        // Redirect to confirmation page
        router.push(`/bestaetigung?ticketId=${result.ticketId}&invoiceId=${result.invoiceId}`);
      } else {
        setError(result.error || 'Registration failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Seminar Registration</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Hidden fields */}
      <input type="hidden" name="eventId" value={params.id} />
      <input type="hidden" name="productId" value={params.id} />
      <input type="hidden" name="productName" value="Kardiologie Update 2025" />
      <input type="hidden" name="price" value="599.00" />

      {/* Personal Information */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Personal Information</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <select name="title" required className="w-full border rounded px-3 py-2">
              <option value="">Select...</option>
              <option value="Dr. med.">Dr. med.</option>
              <option value="Prof. Dr. med.">Prof. Dr. med.</option>
              <option value="PD Dr. med.">PD Dr. med.</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">First Name *</label>
            <input
              type="text"
              name="firstName"
              required
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Last Name *</label>
            <input
              type="text"
              name="lastName"
              required
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email *</label>
            <input
              type="email"
              name="email"
              required
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Phone</label>
            <input
              type="tel"
              name="phone"
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Organization *</label>
            <input
              type="text"
              name="organization"
              required
              placeholder="e.g., Charité Berlin"
              className="w-full border rounded px-3 py-2"
            />
          </div>
        </div>
      </section>

      {/* Professional Information */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Professional Information</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Specialty *</label>
            <select name="specialty" required className="w-full border rounded px-3 py-2">
              <option value="">Select...</option>
              <option value="Kardiologie">Kardiologie</option>
              <option value="Innere Medizin">Innere Medizin</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">License Number</label>
            <input
              type="text"
              name="licenseNumber"
              className="w-full border rounded px-3 py-2"
            />
          </div>
        </div>
      </section>

      {/* Accommodation */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Accommodation</h2>

        <div className="space-y-4">
          <label className="flex items-center">
            <input type="checkbox" name="hotelRequired" value="true" className="mr-2" />
            <span>I need hotel accommodation</span>
          </label>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Arrival Date</label>
              <input
                type="date"
                name="arrivalDate"
                className="w-full border rounded px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Departure Date</label>
              <input
                type="date"
                name="departureDate"
                className="w-full border rounded px-3 py-2"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Dietary Preferences */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Dietary Preferences</h2>

        <select name="dietary" className="w-full border rounded px-3 py-2">
          <option value="">No restrictions</option>
          <option value="vegetarian">Vegetarian</option>
          <option value="vegan">Vegan</option>
          <option value="gluten-free">Gluten-free</option>
        </select>
      </section>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-3 rounded font-semibold hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Processing...' : 'Complete Registration'}
      </button>
    </form>
  );
}
```

#### Step 2: Server Action

`/src/app/seminare/[id]/register/actions.ts`:

```typescript
'use server';

import { L4yerCak3API, WorkflowEvent } from '@/lib/l4yercak3-api';

export async function handleSeminarRegistration(formData: FormData) {
  try {
    // Build universal event payload
    const event: WorkflowEvent = {
      trigger: 'registration_complete',
      inputData: {
        eventType: 'seminar_registration',
        eventId: formData.get('eventId') as string,
        source: 'haffnet_website',

        customerData: {
          email: formData.get('email') as string,
          firstName: formData.get('firstName') as string,
          lastName: formData.get('lastName') as string,
          title: formData.get('title') as string,
          phone: formData.get('phone') as string,
          organization: formData.get('organization') as string
        },

        formResponses: {
          specialty: formData.get('specialty') as string,
          licenseNumber: formData.get('licenseNumber') as string,
          dietaryPreferences: formData.get('dietary') as string,
          hotelRequired: formData.get('hotelRequired') === 'true',
          arrivalDate: formData.get('arrivalDate') as string,
          departureDate: formData.get('departureDate') as string
        },

        transactionData: {
          productId: formData.get('productId') as string,
          productName: formData.get('productName') as string,
          price: parseFloat(formData.get('price') as string),
          currency: 'EUR',
          quantity: 1
        },

        metadata: {
          registeredAt: new Date().toISOString(),
          locale: 'de-DE'
        }
      }
    };

    // Trigger workflow
    const result = await L4yerCak3API.triggerWorkflow(event);

    if (result.success) {
      return {
        success: true,
        ticketId: result.ticketId,
        invoiceId: result.invoiceId,
        transactionId: result.transactionId
      };
    } else {
      return {
        success: false,
        error: result.message
      };
    }
  } catch (error) {
    console.error('Registration error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Registration failed'
    };
  }
}
```

#### Step 3: Confirmation Page

`/src/app/bestaetigung/page.tsx`:

```typescript
import { Suspense } from 'react';

export default function ConfirmationPage({
  searchParams
}: {
  searchParams: { ticketId?: string; invoiceId?: string };
}) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-green-800 mb-2">
            ✓ Registration Successful!
          </h1>
          <p className="text-green-700">
            Your seminar registration has been completed successfully.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <h2 className="font-semibold mb-1">Your Ticket</h2>
            <p className="text-gray-600">Ticket ID: {searchParams.ticketId}</p>
            <p className="text-sm text-gray-500">
              A confirmation email with your ticket has been sent.
            </p>
          </div>

          <div>
            <h2 className="font-semibold mb-1">Invoice</h2>
            <p className="text-gray-600">Invoice ID: {searchParams.invoiceId}</p>
            <p className="text-sm text-gray-500">
              The invoice has been sent to your organization's billing department.
            </p>
          </div>
        </div>
      </div>
    </Suspense>
  );
}
```

---

### 2. Contact Form

`/src/app/contact/actions.ts`:

```typescript
'use server';

import { L4yerCak3API } from '@/lib/l4yercak3-api';

export async function handleContactSubmission(formData: FormData) {
  try {
    const result = await L4yerCak3API.triggerWorkflow({
      trigger: 'form_submit',
      inputData: {
        eventType: 'contact_inquiry',
        eventId: 'contact_form',
        source: 'haffnet_website',

        customerData: {
          email: formData.get('email') as string,
          firstName: formData.get('name') as string
        },

        formResponses: {
          subject: formData.get('subject') as string,
          message: formData.get('message') as string
        },

        metadata: {
          submittedAt: new Date().toISOString()
        }
      }
    });

    return { success: result.success, message: result.message };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Submission failed'
    };
  }
}
```

---

### 3. Newsletter Subscription

```typescript
'use server';

import { L4yerCak3API } from '@/lib/l4yercak3-api';

export async function subscribeToNewsletter(email: string) {
  try {
    const result = await L4yerCak3API.triggerWorkflow({
      trigger: 'subscription_request',
      inputData: {
        eventType: 'newsletter_subscription',
        eventId: 'newsletter_monthly',
        source: 'haffnet_website',

        customerData: {
          email
        },

        formResponses: {
          interests: ['cme', 'seminare'],
          frequency: 'monthly',
          gdprConsent: true,
          consentDate: new Date().toISOString()
        },

        metadata: {
          signupSource: 'footer_form',
          registeredAt: new Date().toISOString()
        }
      }
    });

    return { success: result.success };
  } catch (error) {
    return { success: false };
  }
}
```

---

## Mobile Integration (React Native)

### iOS/Android API Client

```typescript
// /src/lib/api.ts

import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://api.l4yercak3.com';
const API_KEY = process.env.EXPO_PUBLIC_API_KEY!;

export async function triggerWorkflow(event: WorkflowEvent) {
  try {
    const response = await fetch(`${API_URL}/api/v1/workflows/trigger`, {
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

    return await response.json();
  } catch (error) {
    console.error('Workflow trigger error:', error);
    throw error;
  }
}

// Usage in React Native component
async function handleRegistration(formData: object) {
  const result = await triggerWorkflow({
    trigger: 'registration_complete',
    inputData: {
      eventType: 'seminar_registration',
      source: 'ios_app', // or 'android_app'
      ...formData
    }
  });

  if (result.success) {
    navigation.navigate('Confirmation', {
      ticketId: result.ticketId,
      invoiceId: result.invoiceId
    });
  }
}
```

---

## Error Handling

### Client-Side Error Handling

```typescript
try {
  const result = await L4yerCak3API.triggerWorkflow(event);

  if (result.success) {
    // Success path
  } else {
    // Backend returned success: false
    setError(result.message);

    // Check specific behavior failures
    if (result.behaviorResults) {
      const failedBehaviors = result.behaviorResults.filter(b => !b.success);
      failedBehaviors.forEach(behavior => {
        console.error(`${behavior.behaviorType} failed:`, behavior.message);
      });
    }
  }
} catch (error) {
  // Network error or API unavailable
  if (error instanceof Error) {
    setError(`Network error: ${error.message}`);
  }
}
```

### Validation Error Handling

```typescript
const result = await L4yerCak3API.triggerWorkflow(event);

if (!result.success && result.errors) {
  // Field-specific validation errors
  result.errors.forEach(error => {
    setFieldError(error.field, error.message);
  });
}
```

---

## Testing

### Mock API for Development

```typescript
// /src/lib/__mocks__/l4yercak3-api.ts

export class L4yerCak3API {
  static async triggerWorkflow(event: WorkflowEvent): Promise<WorkflowResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock success response
    return {
      success: true,
      transactionId: `txn_${Date.now()}`,
      ticketId: 'ticket_mock_123',
      invoiceId: 'inv_mock_456',
      message: 'Mock registration successful'
    };
  }
}
```

### Unit Test Example

```typescript
import { handleSeminarRegistration } from './actions';

describe('Seminar Registration', () => {
  it('should submit registration successfully', async () => {
    const formData = new FormData();
    formData.append('email', 'test@example.com');
    formData.append('firstName', 'Test');
    // ... more fields

    const result = await handleSeminarRegistration(formData);

    expect(result.success).toBe(true);
    expect(result.ticketId).toBeDefined();
    expect(result.invoiceId).toBeDefined();
  });
});
```

---

## Best Practices

1. **Always use Server Actions** for API calls (prevents API key exposure)
2. **Validate inputs client-side** before sending to API
3. **Handle errors gracefully** with user-friendly messages
4. **Log to analytics** when workflows are triggered
5. **Test with mock API** during development
6. **Use TypeScript** for type safety
7. **Include source field** to track where events come from
8. **Add metadata** for debugging and analytics

---

## Next Steps

- See `API_SPECIFICATION.md` for full API reference
- See `UNIVERSAL_EVENT_PAYLOAD.md` for complete payload examples
- See `BACKEND_REFERENCE.md` for workflow configuration
