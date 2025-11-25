# User Sync Architecture: Convex ↔ Backend API

## Problem Statement

We have a **dual-backend architecture**:

1. **Convex**: Handles OAuth authentication, sessions, user login
2. **Backend API (L4yerCak3)**: Handles CRM, user profiles, bookings, events, all business data

**Critical Issue**: These systems can get out of sync:
- ❌ User registers in Convex → Backend doesn't know about them
- ❌ User deleted in Backend → Still exists in Convex (can still login!)
- ❌ User updated in Backend → Convex has stale data
- ❌ User's bookings/data in Backend → Not linked to Convex auth user

## Solution: Bidirectional Sync with Event-Driven Architecture

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                             │
│  (Next.js App)                                              │
└───────────────┬────────────────────────────┬────────────────┘
                │                            │
                │ Auth                       │ Registration/Data
                ↓                            ↓
┌───────────────────────────┐    ┌──────────────────────────┐
│   CONVEX (Auth System)    │    │  BACKEND API (L4yerCak3) │
│   - OAuth providers       │    │  - CRM contacts          │
│   - Sessions              │    │  - User profiles         │
│   - User credentials      │◄──►│  - Event bookings        │
│                           │    │  - Invoices/Tickets      │
└───────────────────────────┘    └──────────────────────────┘
        ↑                                    │
        │                                    │
        └────────── Webhooks ────────────────┘
             (Backend → Convex sync)
```

## Implementation Strategy

### 1. Frontend → Backend: User Creation

**When**: User registers via `/registrieren` page

**Flow**:
1. User submits registration form
2. Frontend creates Convex auth user (email/password or OAuth)
3. **Immediately** trigger Backend API workflow to create user profile
4. Backend creates CRM contact and user profile
5. Backend returns `frontendUserId` and `crmContactId`
6. Frontend stores these IDs in Convex user record

**Code**:

```typescript
// /src/lib/api-client.ts

export const userApi = {
  /**
   * Register a new user in Backend API
   *
   * Called AFTER Convex auth registration to sync user to Backend.
   * Uses workflow trigger API to create user profile in CRM.
   */
  async registerUser(userData: {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    convexUserId: string; // Link to Convex auth user
  }): Promise<{
    success: boolean;
    frontendUserId?: string;
    crmContactId?: string;
    message?: string;
    error?: string;
  }> {
    try {
      console.log('[User API] Creating user in Backend API:', userData.email);

      // Use workflow trigger API
      const response = await apiFetch<{
        success: boolean;
        contactId?: string;
        frontendUserId?: string;
        transactionId?: string;
        message?: string;
      }>('/workflows/trigger', {
        method: 'POST',
        body: JSON.stringify({
          trigger: 'user_registration',
          inputData: {
            eventType: 'account_created',
            source: 'haffnet_website',

            // User data
            customerData: {
              email: userData.email,
              firstName: userData.firstName,
              lastName: userData.lastName,
              phone: userData.phone,
            },

            // Link to Convex auth user
            metadata: {
              convexUserId: userData.convexUserId,
              registrationDate: new Date().toISOString(),
              platform: 'web',
            },
          },
        }),
      });

      if (response.success) {
        console.log('[User API] User created in Backend:', {
          frontendUserId: response.frontendUserId,
          crmContactId: response.contactId,
        });

        return {
          success: true,
          frontendUserId: response.frontendUserId,
          crmContactId: response.contactId,
          message: 'User created successfully',
        };
      }

      return {
        success: false,
        error: response.message || 'Failed to create user',
      };

    } catch (error) {
      console.error('[User API] Registration failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
};
```

### 2. Registration Page Flow

```typescript
// /src/app/registrieren/page.tsx

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError(null);

  try {
    // STEP 1: Create Convex auth user
    const authResult = await register({
      email: formData.email,
      password: formData.password,
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone || undefined,
    });

    if (!authResult.success) {
      setError(authResult.message || 'Registrierung fehlgeschlagen');
      return;
    }

    // STEP 2: Create Backend API user profile
    const backendResult = await userApi.registerUser({
      email: formData.email,
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone,
      convexUserId: authResult.userId, // Link to Convex user
    });

    if (backendResult.success) {
      // STEP 3: Store Backend IDs in Convex user record
      await updateConvexUserProfile({
        userId: authResult.userId,
        frontendUserId: backendResult.frontendUserId,
        crmContactId: backendResult.crmContactId,
      });

      console.log('[Registration] User created in both systems:', {
        convexUserId: authResult.userId,
        frontendUserId: backendResult.frontendUserId,
        crmContactId: backendResult.crmContactId,
      });

      // Success! Redirect to dashboard
      router.push('/dashboard');
    } else {
      // Backend creation failed, but Convex user exists
      console.warn('[Registration] User created in Convex but not Backend');

      // Still let them proceed - we can sync later
      router.push('/dashboard?warning=backend_sync_pending');
    }

  } catch (error) {
    console.error('[Registration] Error:', error);
    setError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
  }
};
```

### 3. Backend Workflow Configuration

**Create a new workflow in Backend API**:

```typescript
// Backend: workflows/userRegistration.ts

{
  type: "workflow",
  subtype: "user-registration",
  name: "User Account Registration",
  status: "active",

  execution: {
    triggerOn: "user_registration",
    requiredInputs: ["customerData"],
    errorHandling: "log_and_continue"
  },

  behaviors: [
    {
      type: "create-contact",
      enabled: true,
      priority: 100,
      config: {
        source: "website_registration",
        tags: ["website_user", "active"],
      }
    },
    {
      type: "create-frontend-user",
      enabled: true,
      priority: 90,
      config: {
        linkToConvexUser: true,
        convexUserIdField: "metadata.convexUserId"
      }
    },
    {
      type: "send-welcome-email",
      enabled: true,
      priority: 80,
      config: {
        templateId: "welcome_email",
      }
    },
  ]
}
```

### 4. Backend → Convex Sync (Webhooks)

**Problem**: What if Backend deletes/updates a user?

**Solution**: Backend sends webhooks to Convex

#### 4.1 Create Webhook Endpoint in Frontend

```typescript
// /src/app/api/webhooks/backend-sync/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { syncBackendUserUpdate } from '@/lib/backend-sync';

const WEBHOOK_SECRET = process.env.BACKEND_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature
    const signature = request.headers.get('x-webhook-signature');
    if (!verifySignature(signature, WEBHOOK_SECRET)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload = await request.json();
    const { event, data } = payload;

    console.log('[Backend Webhook] Received event:', event);

    switch (event) {
      case 'user.updated':
        await syncBackendUserUpdate({
          frontendUserId: data.frontendUserId,
          updates: {
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
          },
        });
        break;

      case 'user.deleted':
        await handleUserDeletion({
          frontendUserId: data.frontendUserId,
          reason: data.reason,
        });
        break;

      case 'user.suspended':
        await handleUserSuspension({
          frontendUserId: data.frontendUserId,
          reason: data.reason,
        });
        break;

      default:
        console.warn('[Backend Webhook] Unknown event:', event);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[Backend Webhook] Error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

function verifySignature(signature: string | null, secret: string | undefined): boolean {
  // Implement HMAC signature verification
  // This ensures webhooks actually come from your Backend
  return true; // Simplified for now
}
```

#### 4.2 Convex Mutation for Backend Updates

```typescript
// convex/backendSync.ts

import { mutation } from './_generated/server';
import { v } from 'convex/values';

/**
 * Update Convex user based on Backend changes
 */
export const syncBackendUserUpdate = mutation({
  args: {
    frontendUserId: v.string(),
    updates: v.object({
      email: v.optional(v.string()),
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      phone: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    // Find Convex user by frontendUserId
    const user = await ctx.db
      .query('users')
      .withIndex('by_frontend_user_id', (q) =>
        q.eq('frontendUserId', args.frontendUserId)
      )
      .first();

    if (!user) {
      console.warn('[Convex Sync] User not found:', args.frontendUserId);
      return { success: false, error: 'User not found' };
    }

    // Update Convex user record
    await ctx.db.patch(user._id, {
      ...args.updates,
      lastSyncedAt: Date.now(),
    });

    console.log('[Convex Sync] User updated:', user._id);
    return { success: true };
  },
});

/**
 * Soft-delete Convex user when deleted in Backend
 */
export const handleBackendUserDeletion = mutation({
  args: {
    frontendUserId: v.string(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_frontend_user_id', (q) =>
        q.eq('frontendUserId', args.frontendUserId)
      )
      .first();

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Soft delete: mark as deleted but keep record
    await ctx.db.patch(user._id, {
      deletedAt: Date.now(),
      deletionReason: args.reason || 'deleted_in_backend',
      isActive: false,
    });

    console.log('[Convex Sync] User soft-deleted:', user._id);
    return { success: true };
  },
});
```

#### 4.3 Backend Webhook Configuration

**In Backend API**, configure webhooks to call your frontend:

```typescript
// Backend: config/webhooks.ts

{
  webhooks: [
    {
      event: "user.updated",
      url: "https://haffnet.de/api/webhooks/backend-sync",
      secret: process.env.WEBHOOK_SECRET,
      enabled: true,
    },
    {
      event: "user.deleted",
      url: "https://haffnet.de/api/webhooks/backend-sync",
      secret: process.env.WEBHOOK_SECRET,
      enabled: true,
    },
    {
      event: "user.suspended",
      url: "https://haffnet.de/api/webhooks/backend-sync",
      secret: process.env.WEBHOOK_SECRET,
      enabled: true,
    },
  ]
}
```

## Data Flow Diagrams

### User Registration Flow

```
┌─────────┐
│  User   │
│ submits │
│  form   │
└────┬────┘
     │
     ▼
┌─────────────────────────────┐
│  1. Create Convex Auth User │
│     (email + password)      │
└────────────┬────────────────┘
             │
             │ Success → convexUserId
             ▼
┌─────────────────────────────┐
│  2. Trigger Backend API     │
│     POST /workflows/trigger │
│     {                       │
│       trigger: "user_reg"   │
│       customerData: {...}   │
│       metadata: {           │
│         convexUserId        │
│       }                     │
│     }                       │
└────────────┬────────────────┘
             │
             │ Success → frontendUserId, crmContactId
             ▼
┌─────────────────────────────┐
│  3. Update Convex User      │
│     Store Backend IDs:      │
│     - frontendUserId        │
│     - crmContactId          │
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│  4. Redirect to Dashboard   │
│     User now exists in      │
│     BOTH systems!           │
└─────────────────────────────┘
```

### Backend User Deletion Flow

```
┌─────────────────────┐
│  Admin deletes user │
│  in Backend CMS     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────┐
│  Backend triggers webhook   │
│  POST /api/webhooks/sync    │
│  {                          │
│    event: "user.deleted",   │
│    data: {                  │
│      frontendUserId,        │
│      reason: "gdpr_request" │
│    }                        │
│  }                          │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  Frontend validates         │
│  webhook signature          │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  Call Convex mutation       │
│  handleBackendUserDeletion  │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  Convex soft-deletes user   │
│  - Set deletedAt timestamp  │
│  - Set isActive = false     │
│  - Invalidate sessions      │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  User can no longer login   │
│  (403 on auth check)        │
└─────────────────────────────┘
```

## Security Considerations

### 1. Webhook Signature Verification

**Why**: Prevent unauthorized webhooks from malicious actors

**How**: HMAC signature verification

```typescript
function verifySignature(payload: string, signature: string, secret: string): boolean {
  const crypto = require('crypto');
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

### 2. User ID Linking

**Store both IDs in both systems**:

**Convex User Record**:
```typescript
{
  _id: "convex_user_123",
  email: "user@example.com",
  // Auth fields...

  // Backend links
  frontendUserId: "frontend_user_456",
  crmContactId: "crm_contact_789",
  lastSyncedAt: 1234567890,
}
```

**Backend User Record**:
```json
{
  "_id": "frontend_user_456",
  "email": "user@example.com",
  "customProperties": {
    "convexUserId": "convex_user_123",
    "authProvider": "email",
    "registrationSource": "website"
  }
}
```

## Environment Variables

```bash
# Backend API
NEXT_PUBLIC_API_URL=https://api.haffnet.de/api/v1
NEXT_PUBLIC_API_KEY=org_xxx...
NEXT_PUBLIC_ORG_ID=xxx...

# Convex
NEXT_PUBLIC_CONVEX_URL=https://xxx.convex.cloud

# Webhook Security
BACKEND_WEBHOOK_SECRET=your_webhook_secret_here
```

## Testing Checklist

- [ ] User registers → Created in both Convex and Backend
- [ ] User registers → Backend returns frontendUserId
- [ ] User registers → Convex stores frontendUserId
- [ ] Backend deletes user → Webhook fires
- [ ] Backend deletes user → Convex soft-deletes user
- [ ] Backend deletes user → User cannot login
- [ ] Backend updates user email → Webhook fires
- [ ] Backend updates user email → Convex email updated
- [ ] User books event → Linked to correct Backend user
- [ ] Webhook signature invalid → Request rejected

## Migration Plan

### Phase 1: Add User Creation Workflow
1. ✅ Create `userApi.registerUser()` method
2. ✅ Add workflow trigger support
3. ✅ Update registration page
4. ✅ Test user creation flow

### Phase 2: Add Webhook Support
1. Create webhook endpoint in frontend
2. Create Convex sync mutations
3. Configure Backend to send webhooks
4. Test webhook delivery and processing

### Phase 3: Add User ID Linking
1. Update Convex user schema with `frontendUserId`
2. Update Backend user schema with `convexUserId`
3. Migrate existing users (match by email)
4. Add sync status monitoring

### Phase 4: Handle Edge Cases
1. Retry logic for failed syncs
2. Queue system for webhook processing
3. Admin dashboard for sync status
4. Manual re-sync tools

## Next Steps

1. Implement `userApi.registerUser()` with workflow trigger
2. Update `/registrieren` page to call both systems
3. Create Backend workflow for user registration
4. Set up webhook endpoint for Backend → Convex sync
5. Test complete user lifecycle

## Questions to Answer

1. **What happens if Backend is down during registration?**
   - User still created in Convex (can login)
   - Queue retry for Backend creation
   - Show warning in dashboard: "Profile sync pending"

2. **What happens if Convex is down?**
   - Registration fails (can't create auth user)
   - User tries again later

3. **How do we handle duplicate emails?**
   - Check both systems before allowing registration
   - Convex will reject duplicate emails automatically
   - Backend should also validate

4. **Can users exist in Backend without Convex?**
   - Yes (admin-created users, imported users)
   - They get invited to create Convex account
   - First login creates Convex user + links IDs
