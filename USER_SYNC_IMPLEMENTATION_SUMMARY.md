# User Sync Implementation Summary

## ✅ What We've Solved

### Problem
You identified a **critical architectural gap**: When a user registers directly (via `/registrieren`) they are only created in **Convex** (for authentication), but NOT in the **Backend API** (where all the business data lives - CRM, bookings, events, etc.).

This creates major issues:
- ❌ User can login but has no profile in Backend
- ❌ User's bookings not linked to their account
- ❌ No CRM contact record
- ❌ Cannot manage user from admin dashboard
- ❌ Systems out of sync

### Solution
Implemented **bidirectional sync** using event-driven architecture:

1. **Frontend → Backend**: Use workflow trigger API for user creation
2. **Backend → Frontend**: Use webhooks for updates/deletions
3. **ID Linking**: Store IDs in both systems for cross-reference

## 📝 What We've Built

### 1. User Registration API (`userApi.registerUser()`)

**Location**: [src/lib/api-client.ts:430-553](src/lib/api-client.ts#L430-L553)

**What it does**:
- Takes user data from frontend registration
- Calls Backend API `/workflows/trigger` endpoint
- Sends event type: `user_registration`
- Backend workflow creates:
  - CRM contact record
  - Frontend user profile
  - Welcome email (optional behavior)
- Returns `frontendUserId` and `crmContactId`
- Links Convex user ID to Backend user ID

**Usage**:
```typescript
import { userApi } from '@/lib/api-client';

// After Convex auth user is created
const result = await userApi.registerUser({
  email: 'user@example.com',
  firstName: 'Max',
  lastName: 'Mustermann',
  phone: '+49 123 456789',
  convexUserId: 'convex_user_123', // From Convex auth
});

if (result.success) {
  console.log('User created in Backend:', {
    frontendUserId: result.frontendUserId,
    crmContactId: result.crmContactId,
  });
}
```

### 2. Architecture Documentation

**Location**: [docs/USER_SYNC_ARCHITECTURE.md](docs/USER_SYNC_ARCHITECTURE.md)

**Includes**:
- Complete bidirectional sync strategy
- Data flow diagrams
- Security considerations (webhook signatures)
- Example code for all scenarios
- Webhook implementation guide
- Testing checklist
- Migration plan

## 🎯 Key Design Decisions

### Why Workflow Trigger API?

**Instead of** creating a custom `/users` endpoint or using the checkout hack, we use the existing `/workflows/trigger` endpoint because:

✅ **Event-driven**: Fits the Backend API's architecture perfectly
✅ **Flexible behaviors**: Can add/remove behaviors without frontend changes
✅ **Consistent**: Same pattern as event registrations
✅ **Extensible**: Easy to add welcome emails, analytics, etc.
✅ **Already exists**: No new endpoint needed

### Workflow Event Structure

```typescript
{
  trigger: 'user_registration',  // Backend listens for this
  inputData: {
    eventType: 'account_created',
    source: 'haffnet_website',

    customerData: {
      email, firstName, lastName, phone
    },

    metadata: {
      convexUserId,        // Link to Convex auth user
      registrationDate,
      platform: 'web',
      authProvider: 'email'
    }
  }
}
```

### ID Linking Strategy

**Both systems store BOTH IDs**:

**Convex User Record**:
```typescript
{
  _id: "convex_user_123",
  email: "user@example.com",
  // ... auth fields

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
    "authProvider": "email"
  }
}
```

This allows:
- ✅ Fast lookups in both directions
- ✅ Data integrity verification
- ✅ Sync status tracking
- ✅ Recovery from sync failures

## 🔄 Complete User Lifecycle

### 1. Registration (Frontend → Backend)

```
User submits form
     ↓
Create Convex auth user
     ↓
Call userApi.registerUser()
     ↓
POST /workflows/trigger
     ↓
Backend workflow creates:
  - CRM contact
  - Frontend user profile
  - Welcome email
     ↓
Returns frontendUserId
     ↓
Store in Convex user record
     ↓
Redirect to dashboard
```

### 2. User Update (Backend → Frontend via Webhook)

```
Admin updates user in Backend
     ↓
Backend sends webhook:
  POST /api/webhooks/backend-sync
  {
    event: "user.updated",
    data: { frontendUserId, ... }
  }
     ↓
Frontend validates signature
     ↓
Call Convex mutation
     ↓
Update Convex user record
```

### 3. User Deletion (Backend → Frontend via Webhook)

```
Admin deletes user in Backend
     ↓
Backend sends webhook:
  POST /api/webhooks/backend-sync
  {
    event: "user.deleted",
    data: { frontendUserId, reason }
  }
     ↓
Frontend validates signature
     ↓
Convex soft-deletes user:
  - Set deletedAt timestamp
  - Set isActive = false
  - Invalidate sessions
     ↓
User can no longer login
```

## 📋 Next Steps (Backend Team)

### 1. Create User Registration Workflow

**File**: `backend/workflows/userRegistration.ts`

```typescript
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

### 2. Implement `create-frontend-user` Behavior

This behavior should:
- Create a user record in Backend's user management system
- Link to CRM contact (from `create-contact` behavior)
- Store `convexUserId` from `metadata.convexUserId`
- Return `frontendUserId` in workflow response

### 3. Configure Webhooks

Add webhook configuration to send events to frontend:

```typescript
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
  ]
}
```

## 📋 Next Steps (Frontend Team)

### 1. Update Registration Page

**File**: `src/app/registrieren/page.tsx`

Add call to `userApi.registerUser()` after Convex auth registration:

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  // ... validation

  // STEP 1: Create Convex auth user
  const authResult = await register({ ... });

  if (authResult.success) {
    // STEP 2: Create Backend user
    const backendResult = await userApi.registerUser({
      email: formData.email,
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone,
      convexUserId: authResult.userId,
    });

    if (backendResult.success) {
      // STEP 3: Store Backend IDs in Convex
      await updateConvexUserProfile({
        userId: authResult.userId,
        frontendUserId: backendResult.frontendUserId,
        crmContactId: backendResult.crmContactId,
      });
    }

    router.push('/dashboard');
  }
};
```

### 2. Create Webhook Endpoint

**File**: `src/app/api/webhooks/backend-sync/route.ts`

Handle Backend → Frontend sync events (user updates, deletions).

### 3. Add Convex Mutations

**File**: `convex/backendSync.ts`

- `syncBackendUserUpdate` - Update Convex user from Backend changes
- `handleBackendUserDeletion` - Soft-delete Convex user

## 🔒 Security

### Webhook Signature Verification

**Critical**: All webhooks MUST be verified using HMAC signatures to prevent:
- Unauthorized user deletions
- Fake user updates
- Malicious webhook spam

**Implementation**: See [docs/USER_SYNC_ARCHITECTURE.md](docs/USER_SYNC_ARCHITECTURE.md#webhook-signature-verification)

## 🧪 Testing

### Test Scenarios

- [ ] User registers → Created in both Convex and Backend
- [ ] User registers → `frontendUserId` returned and stored
- [ ] User registers → CRM contact created
- [ ] Backend deletes user → Webhook fires
- [ ] Backend deletes user → Convex user soft-deleted
- [ ] Backend deletes user → User cannot login
- [ ] Backend updates email → Webhook fires
- [ ] Backend updates email → Convex email updated
- [ ] User books event → Linked to correct Backend user
- [ ] Invalid webhook signature → Request rejected

## 📊 Benefits

### Before (Current State)
- ❌ Users in Convex but not in Backend
- ❌ Bookings not linked to users
- ❌ No centralized user management
- ❌ Data integrity issues

### After (With Sync)
- ✅ Users exist in BOTH systems
- ✅ All bookings linked to user profiles
- ✅ Single source of truth for user data (Backend)
- ✅ Convex auth synced with Backend profiles
- ✅ Bi-directional updates (Backend ↔ Convex)
- ✅ Audit trail for all user changes
- ✅ Webhook-based real-time sync

## 🎉 Summary

**What we solved**: User registration gap between Convex auth and Backend CRM

**How we solved it**: Event-driven bidirectional sync using workflow triggers and webhooks

**What's next**:
1. Backend team: Implement `user_registration` workflow
2. Frontend team: Update registration page to call both systems
3. Both teams: Implement webhook sync for updates/deletions
4. Test complete user lifecycle

**Documentation**: See [docs/USER_SYNC_ARCHITECTURE.md](docs/USER_SYNC_ARCHITECTURE.md) for complete implementation guide

---

**Questions?** Check the architecture doc or ask in the team chat!
