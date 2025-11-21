# Convex Integration for Dynamic Checkout Configuration

## Overview

The registration form now uses **dynamic checkout configuration** from Convex instead of hardcoded environment variables. This allows you to configure checkout instances per page in your CMS.

## How It Works

### Before (Hardcoded)
```typescript
// .env.local
NEXT_PUBLIC_CHECKOUT_INSTANCE_ID=k123abc...

// api-client.ts
const CHECKOUT_INSTANCE_ID = process.env.NEXT_PUBLIC_CHECKOUT_INSTANCE_ID;
```

### After (Dynamic from CMS)
```typescript
// 1. Fetch page content from Convex (includes checkout config)
const content = await getPageContent("voundbrand", "/events");

// 2. Extract checkout instance ID
const checkoutInstanceId = content.page.customProperties.contentRules.checkoutId;

// 3. Pass to checkout API
await checkoutApi.submitRegistration(data, checkoutInstanceId);
```

## Files Updated

### 1. `/src/lib/api-client.ts`
- **Changed**: `checkoutApi.submitRegistration()` now requires `checkoutInstanceId` as second parameter
- **Removed**: `CHECKOUT_INSTANCE_ID` environment variable dependency
- **Added**: Runtime parameter for checkout instance ID

**Before**:
```typescript
async submitRegistration(data: RegistrationInput): Promise<RegistrationResponse>
```

**After**:
```typescript
async submitRegistration(
  data: RegistrationInput,
  checkoutInstanceId: string  // NEW: Required parameter from CMS
): Promise<RegistrationResponse>
```

### 2. `/src/lib/convex-client.ts` (NEW)
- Helper functions to fetch page content from Convex
- Extracts checkout instance ID from CMS configuration
- Validates checkout configuration

**Functions**:
- `getPageContent(orgSlug, pageSlug)` - Fetch page with all content
- `getCheckoutInstanceId(content)` - Extract checkout ID
- `hasCheckoutConfigured(content)` - Check if checkout is configured

### 3. `/src/app/events/[id]/register/page.tsx`
- **✅ COMPLETED**: Now uses Convex client to fetch checkout instance ID dynamically
- **✅ NO ENVIRONMENT VARIABLE**: Checkout ID comes ONLY from Convex CMS

## Current State: ✅ Convex Integration Complete

The registration form now fetches the checkout instance ID dynamically from Convex CMS:

```typescript
// src/app/events/[id]/register/page.tsx

import { getPageContent, getCheckoutInstanceId } from '@/lib/convex-client';

const ORG_SLUG = 'voundbrand';

export default function RegisterPage({ params }: RegisterPageProps) {
  const [checkoutInstanceId, setCheckoutInstanceId] = useState<string | null>(null);

  // Load checkout config from Convex CMS
  useEffect(() => {
    async function loadData() {
      const pageContent = await getPageContent(ORG_SLUG, '/events');
      const checkoutId = getCheckoutInstanceId(pageContent);

      if (checkoutId) {
        setCheckoutInstanceId(checkoutId);
      } else {
        setError('Checkout-Konfiguration fehlt...');
      }
    }
    loadData();
  }, [id]);

  // In handleSubmit:
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate checkout instance ID from CMS
    if (!checkoutInstanceId) {
      setError('Checkout-Konfiguration fehlt...');
      return;
    }

    // Call checkout API with dynamic instance ID from CMS
    const response = await checkoutApi.submitRegistration(data, checkoutInstanceId);
  };
}
```

## Environment Variables

### Required
```bash
# Backend API (for checkout operations)
NEXT_PUBLIC_API_URL=https://agreeable-lion-828.convex.site/api/v1
NEXT_PUBLIC_API_KEY=org_xxx...
NEXT_PUBLIC_ORG_ID=xxx...

# Convex CMS (for dynamic configuration)
NEXT_PUBLIC_CONVEX_URL=https://xxx.convex.cloud
```

### ❌ NO LONGER NEEDED
```bash
# ❌ REMOVED: Checkout instance ID now comes from Convex CMS only
# NEXT_PUBLIC_CHECKOUT_INSTANCE_ID=your_checkout_instance_id_here
```

## CMS Configuration

In your CMS (Convex backend), configure checkout for each page:

1. **Create External Page**: `/events` or `/haffsymposium`
2. **Configure Content Rules**:
   ```json
   {
     "events": {
       "filter": "future",
       "visibility": "public",
       "limit": 10
     },
     "checkoutId": "k123abc...",  // Checkout instance ID
     "formIds": ["form_1", "form_2"]
   }
   ```
3. **Publish Page**: Set status to "published"

## Benefits of Dynamic Configuration

### ✅ Multiple Events, Multiple Checkouts
- Different events can use different checkout instances
- Each page can have its own configuration
- No need to redeploy frontend for config changes

### ✅ CMS-Driven
- Marketing team can configure checkout in CMS
- No developer needed for configuration changes
- Test/production environments use same code

### ✅ Flexible
- Can change checkout instance without code changes
- Can A/B test different checkout flows
- Can have event-specific payment processing

## Testing

### ✅ Current Setup (Convex Integration)
```bash
# Ensure Convex URL is set in .env.local
NEXT_PUBLIC_CONVEX_URL=https://xxx.convex.cloud

# Run dev server
npm run dev

# Test registration form
# ✅ Should fetch checkout ID from Convex CMS dynamically
# ✅ No environment variable needed for checkout instance ID
```

### Configure Checkout in Convex CMS
1. Go to your Convex CMS
2. Navigate to the `/events` page configuration
3. Add `checkoutId` to `contentRules`:
   ```json
   {
     "contentRules": {
       "checkoutId": "k123abc...",
       "events": { "filter": "future", "visibility": "public" }
     }
   }
   ```
4. Save and publish the page

## Troubleshooting

### Error: "Checkout-Konfiguration fehlt"
**Cause**: CMS page doesn't have `contentRules.checkoutId` configured

**Solution**:
1. Go to Convex CMS
2. Navigate to the `/events` page
3. Edit the page configuration
4. Add `checkoutId` to `contentRules`:
   ```json
   {
     "contentRules": {
       "checkoutId": "k123abc..."
     }
   }
   ```
5. Save and publish the page
6. Reload the registration form

### Error: "Failed to fetch checkout config from Convex"
**Cause**: Convex CMS is unreachable or `NEXT_PUBLIC_CONVEX_URL` is not set

**Solution**:
1. Check that `NEXT_PUBLIC_CONVEX_URL` is set in `.env.local`
2. Verify your Convex backend is running
3. Check network connectivity
4. Verify the `getPublishedContentForFrontend` API exists in your Convex backend

### Page loads but no error shown
**Cause**: The page might not exist in CMS or returns null

**Solution**:
1. Check browser console for Convex client logs
2. Verify the page `/events` exists in your CMS
3. Ensure the page status is "published"
4. Check that `orgSlug` matches your organization in CMS

## Migration Path

### Phase 1: ✅ COMPLETED - API Client Update
- ✅ Modified `checkoutApi.submitRegistration()` to accept instance ID parameter
- ✅ Removed hardcoded environment variable from API client
- ✅ Created Convex client helpers

### Phase 2: ✅ COMPLETED - Convex Integration
- ✅ Registration form fetches page content from Convex CMS
- ✅ Extracts checkout instance ID dynamically
- ✅ NO environment variable fallback
- ✅ Fails gracefully if CMS not configured

### Phase 3: 🎯 Current State (Convex Only)
- ✅ Convex client is the ONLY source for checkout instance ID
- ✅ No environment variable used or needed
- ✅ All configuration comes from CMS
- ✅ `NEXT_PUBLIC_CHECKOUT_INSTANCE_ID` is not used anywhere in code

## Summary

**What Changed**:
- ✅ API client now accepts checkout instance ID as parameter
- ✅ Convex client helper created
- ✅ Registration form updated to pass instance ID
- ✅ Temporary env var fallback in place

**What's Next**:
- ⏳ Generate Convex schema
- ⏳ Update registration form to use Convex client
- ⏳ Test with CMS-configured checkout
- ⏳ Remove env var fallback

**Status**: ✅ Ready for testing with env var fallback
