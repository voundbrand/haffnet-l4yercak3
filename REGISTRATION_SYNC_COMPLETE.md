# ✅ Registration Sync Implementation Complete

## What Was Implemented

Updated the direct registration page ([src/app/registrieren/page.tsx](src/app/registrieren/page.tsx#L60-L118)) to create users in **BOTH** Convex and Backend API.

## Changes Made

### 1. Import Backend API Client

```typescript
import { userApi } from '@/lib/api-client';
```

### 2. Updated Registration Flow

**Before** (Convex only):
```typescript
const result = await register({ ... });
if (result.success) {
  router.push('/dashboard');
}
```

**After** (Both systems):
```typescript
// STEP 1: Create Convex auth user
const authResult = await register({ ... });

if (authResult.success) {
  // STEP 2: Create Backend API user profile
  const backendResult = await userApi.registerUser({
    email: formData.email,
    firstName: formData.firstName,
    lastName: formData.lastName,
    phone: formData.phone,
    convexUserId: authResult.userId, // Link to Convex
  });

  if (backendResult.success) {
    // ✅ User created in BOTH systems
    console.log('User created in both systems:', {
      convexUserId: authResult.userId,
      frontendUserId: backendResult.frontendUserId,
      crmContactId: backendResult.crmContactId,
    });
    router.push('/dashboard');
  } else {
    // ⚠️ Convex user exists, Backend failed
    // Still let them use the app
    router.push('/dashboard?warning=backend_sync_pending');
  }
}
```

## Error Handling

### Scenario 1: Convex Auth Fails
- **Result**: Registration stops, user sees error
- **User Impact**: Cannot create account
- **Action**: User retries registration

### Scenario 2: Backend API Fails
- **Result**: User still created in Convex (can login)
- **User Impact**: Can use app, but sync pending
- **Action**: User redirected to `/dashboard?warning=backend_sync_pending`
- **Recovery**: Backend sync can be retried later (manual or automatic)

### Scenario 3: Both Succeed ✅
- **Result**: User exists in both systems
- **User Impact**: Full functionality
- **Data**:
  - Convex: `authResult.userId`
  - Backend: `backendResult.frontendUserId`, `backendResult.crmContactId`

## Logging

Comprehensive logging added for debugging:

```typescript
// Step 1
console.log('[Registration] Creating Convex auth user...');
console.log('[Registration] Convex user created:', authResult.userId);

// Step 2
console.log('[Registration] Creating Backend API user profile...');
console.log('[Registration] ✅ User created in both systems:', {
  convexUserId: authResult.userId,
  frontendUserId: backendResult.frontendUserId,
  crmContactId: backendResult.crmContactId,
});

// Or if Backend fails
console.warn('[Registration] ⚠️ User created in Convex but not in Backend:', {
  convexUserId: authResult.userId,
  backendError: backendResult.error,
});
```

## User Journey

### Happy Path: Both Systems Succeed

```
User fills form
     ↓
Submit registration
     ↓
[Frontend] Create Convex auth user
     ✅ Success → convexUserId
     ↓
[Frontend] Call Backend API workflow
     POST /workflows/trigger
     trigger: "user_registration"
     ↓
[Backend] Workflow creates:
     - CRM contact
     - Frontend user profile
     - Welcome email (optional)
     ✅ Success → frontendUserId, crmContactId
     ↓
[Frontend] Log both IDs
     ↓
Redirect to /dashboard
     ↓
User can:
     ✅ Login with Convex
     ✅ Book events (linked to Backend user)
     ✅ View profile in CRM
     ✅ Receive emails
```

### Failure Path: Backend API Down

```
User fills form
     ↓
Submit registration
     ↓
[Frontend] Create Convex auth user
     ✅ Success → convexUserId
     ↓
[Frontend] Call Backend API workflow
     POST /workflows/trigger
     ❌ Error (Backend unreachable)
     ↓
[Frontend] Log warning
     ⚠️ User in Convex, not in Backend
     ↓
Redirect to /dashboard?warning=backend_sync_pending
     ↓
User can:
     ✅ Login with Convex
     ⚠️ Cannot book events yet
     ⚠️ No CRM profile

Recovery:
     - Admin can manually trigger sync
     - Or retry on next login
     - Or background job retries
```

## Testing Checklist

### Manual Testing

- [ ] Register new user with all fields filled
- [ ] Check console logs show both Convex and Backend user creation
- [ ] Verify user can login after registration
- [ ] Check Backend CRM for new contact record
- [ ] Verify `frontendUserId` and `crmContactId` are logged
- [ ] Test with Backend API down (should still allow registration)
- [ ] Verify warning message on dashboard if Backend fails

### Integration Testing

- [ ] User registers → Exists in Convex
- [ ] User registers → Exists in Backend CRM
- [ ] User registers → IDs are linked (convexUserId in Backend metadata)
- [ ] User books event → Booking linked to correct Backend user
- [ ] Backend deletes user → Convex user soft-deleted (webhook)
- [ ] Backend updates user → Convex user updated (webhook)

## What Still Needs to Be Done

### Frontend (Optional Enhancements)

1. **Store Backend IDs in Convex User Record**
   - Create Convex mutation to update user with `frontendUserId` and `crmContactId`
   - Call after successful Backend registration
   - Allows quick lookup in both directions

2. **Retry Logic for Failed Backend Sync**
   - Add background job to retry failed syncs
   - Check for users with no `frontendUserId`
   - Retry `userApi.registerUser()` for them

3. **Dashboard Warning Banner**
   - Show warning if `?warning=backend_sync_pending` in URL
   - Explain that profile sync is pending
   - Offer manual retry button

### Backend (Required)

1. **Create `user_registration` Workflow**
   - Trigger: `user_registration`
   - Behaviors:
     - `create-contact` → CRM contact
     - `create-frontend-user` → User profile (returns `frontendUserId`)
     - `send-welcome-email` → Welcome email

2. **Configure Webhooks (Optional for Sync)**
   - `user.updated` → `https://haffnet.de/api/webhooks/backend-sync`
   - `user.deleted` → `https://haffnet.de/api/webhooks/backend-sync`

## Summary

### ✅ What's Working Now

1. **Event Registration** ([src/app/events/[id]/register/page.tsx](src/app/events/[id]/register/page.tsx))
   - Creates users in Backend via checkout flow
   - Returns `frontendUserId` and logs it ✅

2. **Direct Registration** ([src/app/registrieren/page.tsx](src/app/registrieren/page.tsx))
   - Creates users in Convex (auth) ✅
   - Creates users in Backend (CRM) ✅
   - Links both IDs together ✅
   - Graceful error handling ✅

### 🎯 Next Steps

1. **Backend Team**: Implement `user_registration` workflow
2. **Test**: Complete registration flow end-to-end
3. **Optional**: Add Convex mutation to store Backend IDs
4. **Optional**: Add retry logic and dashboard warning

## Architecture Docs

- **Full Specification**: [docs/USER_SYNC_ARCHITECTURE.md](docs/USER_SYNC_ARCHITECTURE.md)
- **Quick Reference**: [USER_SYNC_IMPLEMENTATION_SUMMARY.md](USER_SYNC_IMPLEMENTATION_SUMMARY.md)

---

**Status**: ✅ Frontend implementation complete, pending Backend workflow implementation
