# Customer Authentication System - Implementation Plan (Revised)

**Goal**: Create a separate authentication system for external customers (doctors) using the CRM contact ontology, completely isolated from platform user management.

---

## Architecture Overview

### Backend Structure

**PLATFORM USERS (Back Office) - EXISTING**
- users table
- userPasswords table
- sessions table
- organizationMembers table
- Full RBAC system

**SEPARATOR**

**EXTERNAL CUSTOMERS (Public Website) - NEW**
- objects (type: "crm_contact", subtype: "customer")
  - name: "Dr. Max Mustermann"
  - customProperties:
    - email: "max@hospital.de"
    - firstName: "Max"
    - lastName: "Mustermann"
    - passwordHash: "bcrypt..."
    - title: "Dr. med."
    - specialization: "Kardiologie"
    - licenseNumber: "DE-12345"
    - phone: "+49..."
    - marketingOptIn: true
    - lastLogin: 1234567890
  - status: "active" | "inactive" | "archived"

- objects (type: "crm_organization", subtype: "business")
  - name: "Praxis Dr. Mustermann"
  - customProperties:
    - companyName: "Praxis Dr. Mustermann GmbH"
    - taxId: "DE123456789"
    - billingAddress: {
        street: "Hauptstraße 123"
        city: "Berlin"
        postalCode: "10115"
        country: "Deutschland"
      }
    - domain: "praxis-mustermann.de" (optional)
    - industry: "Healthcare"

- objects (type: "event", subtype: "course_event")
  - name: "Kardiologie Fortbildung 2025"
  - customProperties:
    - startDate: 1234567890
    - endDate: 1234999999
    - maxParticipants: 50
    - currentParticipants: 23

- objects (type: "certificate", subtype: "cme_certificate")
  - name: "Certificate - Dr. Max Mustermann - Kardiologie 2025"
  - customProperties:
    - issueDate: 1234567890
    - certificateUrl: "https://..."
    - cmePoints: 8
    - eventId: Id<"objects"> // Reference to event

- objects (type: "checkout", subtype: "course_registration")
  - name: "Registration - Dr. Mustermann - Kardiologie 2025"
  - customProperties:
    - status: "completed" | "pending" | "failed"
    - amount: 450.00
    - currency: "EUR"
    - transaction: {
        id: "txn_abc123"
        status: "paid"
        method: "stripe"
        timestamp: 1234567890
      }

- customerSessions table (NEW)
  - contactId: Id<"objects">
  - email: string
  - createdAt: number
  - expiresAt: number

- objectLinks (customer relationships)
  - contact -> organization (type: "owns_business")
  - contact -> event (type: "registered_for")
  - contact -> certificate (type: "earned_certificate")
  - contact -> checkout (type: "made_purchase")
  - certificate -> event (type: "certificate_for_event")

---

## Key Data Model Changes

### 1. CRM Organization Integration

**During Registration:**
- Customer provides business information
- System creates/finds CRM Organization object
- Links customer to organization via objectLink (type: "owns_business")
- Organization stores billing address and tax information

**Benefits:**
- Reusable billing information across multiple course registrations
- Support for multi-doctor practices (multiple contacts -> one organization)
- Clear separation of personal vs. business data

### 2. Event/Certificate/CME Points Flow

**Event Structure:**
```typescript
// Event object (course offering)
{
  type: "event",
  subtype: "course_event",
  name: "Kardiologie Fortbildung 2025",
  customProperties: {
    cmePoints: 8,
    startDate: ...,
    endDate: ...,
  }
}
```

**Certificate Structure:**
```typescript
// Certificate object (awarded after completion)
{
  type: "certificate",
  subtype: "cme_certificate",
  name: "Certificate - Dr. Max Mustermann - Kardiologie 2025",
  customProperties: {
    cmePoints: 8, // Copied from event at certificate creation
    certificateUrl: "https://...",
    issueDate: ...,
  }
}

// Links:
// certificate -> event (type: "certificate_for_event")
// contact -> certificate (type: "earned_certificate")
```

**CME Points Calculation:**
```typescript
// To get total CME points for a customer:
// 1. Find all certificates linked to contact
// 2. Sum cmePoints from all certificates

async function getTotalCMEPoints(contactId: Id<"objects">) {
  // Get all certificate links
  const certificateLinks = await ctx.db
    .query("objectLinks")
    .withIndex("by_from", (q) => q.eq("fromObjectId", contactId))
    .filter((q) => q.eq(q.field("linkType"), "earned_certificate"))
    .collect();

  // Get all certificates
  const certificates = await Promise.all(
    certificateLinks.map(link => ctx.db.get(link.toObjectId))
  );

  // Sum CME points
  return certificates.reduce((total, cert) => {
    return total + (cert?.customProperties?.cmePoints || 0);
  }, 0);
}
```

### 3. Checkout/Transaction Integration

**No Separate Customer Checkout Object Needed:**
- Use existing `checkout` objects (type: "checkout", subtype: "course_registration")
- Checkout already contains transaction data in customProperties
- Link contact to checkout via objectLink (type: "made_purchase")

**Transaction Data Access:**
```typescript
// Get customer's transactions
async function getCustomerTransactions(contactId: Id<"objects">) {
  // Get all checkout links
  const checkoutLinks = await ctx.db
    .query("objectLinks")
    .withIndex("by_from", (q) => q.eq("fromObjectId", contactId))
    .filter((q) => q.eq(q.field("linkType"), "made_purchase"))
    .collect();

  // Get all checkout objects
  const checkouts = await Promise.all(
    checkoutLinks.map(link => ctx.db.get(link.toObjectId))
  );

  // Return transaction data from checkout.customProperties.transaction
  return checkouts.map(checkout => ({
    id: checkout.customProperties.transaction.id,
    amount: checkout.customProperties.amount,
    status: checkout.customProperties.transaction.status,
    date: checkout.customProperties.transaction.timestamp,
  }));
}
```

---

## Backend Implementation (l4yercak3)

### Phase 1: Schema & Data Model

**File**: `convex/schema.ts`

```typescript
// Add new customerSessions table
customerSessions: defineTable({
  contactId: v.id("objects"), // References crm_contact object
  email: v.string(),
  createdAt: v.number(),
  expiresAt: v.number(), // 24 hours default
})
  .index("by_contact", ["contactId"])
  .index("by_email", ["email"]),
```

**Why separate sessions table?**
- Keeps customer sessions isolated from platform sessions
- Different expiration rules (customers: 30 days, platform: 24 hours)
- Easier to query and manage customer-specific data

---

### Phase 2: Customer Authentication Mutations

**File**: `convex/customerAuth.ts` (NEW)

#### 2.1 Registration: `registerCustomer`

```typescript
export const registerCustomer = action({
  args: {
    // Personal info
    email: v.string(),
    password: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    title: v.optional(v.string()), // "Dr.", "Prof.", etc.
    specialization: v.optional(v.string()),
    licenseNumber: v.optional(v.string()),
    phone: v.optional(v.string()),
    marketingOptIn: v.optional(v.boolean()),

    // Business info (creates CRM Organization)
    business: v.object({
      companyName: v.string(),
      taxId: v.optional(v.string()),
      billingAddress: v.object({
        street: v.string(),
        city: v.string(),
        postalCode: v.string(),
        country: v.string(),
      }),
      domain: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    // 1. Check if email already exists
    // 2. Hash password using bcrypt (via cryptoActions)
    // 3. Create CRM Organization object with business info
    // 4. Create CRM Contact object with passwordHash in customProperties
    // 5. Create objectLink (contact -> organization, type: "owns_business")
    // 6. Create initial customerSession
    // 7. Log objectAction (type: "customer_registered")
    // 8. Return { success, contactId, organizationId, sessionId }
  }
});
```

**Key Steps:**
1. Validate email uniqueness across `objects` where `type="crm_contact"`
2. Use existing `internal.cryptoActions.hashPassword` for bcrypt
3. Create CRM Organization first (for billing info)
4. Create CRM Contact with link to organization
5. Store `passwordHash` in `customProperties` (not in separate table)
6. Generate 30-day session token

---

#### 2.2 Sign In: `signInCustomer`

```typescript
export const signInCustomer = action({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Find crm_contact by email
    // 2. Verify password using bcrypt (via cryptoActions)
    // 3. Check contact status (active only)
    // 4. Create new customerSession
    // 5. Update lastLogin timestamp
    // 6. Log objectAction (type: "customer_signed_in")
    // 7. Return { success, sessionId, customer }
  }
});
```

**Security Considerations:**
- Rate limiting: Max 5 failed attempts per hour
- IP tracking in `objectActions` for audit trail
- Session rotation on successful login

---

#### 2.3 Sign Out: `signOutCustomer`

```typescript
export const signOutCustomer = mutation({
  args: {
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Delete customerSession
    // 2. Log objectAction (type: "customer_signed_out")
    // 3. Return { success: true }
  }
});
```

---

#### 2.4 Get Current Customer: `getCurrentCustomer`

```typescript
export const getCurrentCustomer = query({
  args: {
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 1. Validate session (check expiry)
    // 2. Get contact object
    // 3. Get linked organization (for billing info)
    // 4. Calculate totalCMEPoints from certificates
    // 5. Return sanitized customer data (no passwordHash!)
    // 6. Return null if session invalid/expired
  }
});
```

**Returns:**
```typescript
{
  id: Id<"objects">,
  email: string,
  firstName: string,
  lastName: string,
  title?: string,
  specialization?: string,
  totalCMEPoints: number, // Calculated from certificates
  registeredCourses: number,
  business: {
    id: Id<"objects">,
    companyName: string,
    billingAddress: { ... },
    taxId?: string,
  },
  // NO passwordHash in response!
}
```

---

#### 2.5 Update Customer Profile: `updateCustomerProfile`

```typescript
export const updateCustomerProfile = mutation({
  args: {
    sessionId: v.string(),
    updates: v.object({
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      phone: v.optional(v.string()),
      specialization: v.optional(v.string()),
      marketingOptIn: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, args) => {
    // 1. Validate session
    // 2. Update contact customProperties
    // 3. Update contact.name if firstName/lastName changed
    // 4. Log objectAction (type: "customer_updated_profile")
    // 5. Return updated customer
  }
});
```

---

#### 2.6 Update Business Info: `updateBusinessInfo`

```typescript
export const updateBusinessInfo = mutation({
  args: {
    sessionId: v.string(),
    updates: v.object({
      companyName: v.optional(v.string()),
      taxId: v.optional(v.string()),
      billingAddress: v.optional(v.object({
        street: v.string(),
        city: v.string(),
        postalCode: v.string(),
        country: v.string(),
      })),
    }),
  },
  handler: async (ctx, args) => {
    // 1. Validate session
    // 2. Get linked organization
    // 3. Update organization customProperties
    // 4. Log objectAction (type: "customer_updated_business")
    // 5. Return updated organization
  }
});
```

---

#### 2.7 Change Password: `changeCustomerPassword`

```typescript
export const changeCustomerPassword = action({
  args: {
    sessionId: v.string(),
    currentPassword: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Validate session
    // 2. Verify currentPassword
    // 3. Hash newPassword
    // 4. Update passwordHash in customProperties
    // 5. Invalidate all other sessions (force re-login)
    // 6. Log objectAction (type: "customer_changed_password")
    // 7. Return { success: true }
  }
});
```

---

#### 2.8 Reset Password Request: `requestPasswordReset`

```typescript
export const requestPasswordReset = action({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Find customer by email
    // 2. Generate secure reset token (crypto.randomUUID())
    // 3. Store token in customProperties.resetToken with expiry
    // 4. Send email with reset link (via emailService)
    // 5. Log objectAction (type: "customer_requested_password_reset")
    // 6. Return { success: true } (always, don't leak email existence)
  }
});
```

---

#### 2.9 Reset Password: `resetCustomerPassword`

```typescript
export const resetCustomerPassword = action({
  args: {
    token: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Find customer by resetToken
    // 2. Verify token not expired (1 hour)
    // 3. Hash newPassword
    // 4. Update passwordHash
    // 5. Clear resetToken from customProperties
    // 6. Invalidate all sessions
    // 7. Log objectAction (type: "customer_reset_password")
    // 8. Return { success: true }
  }
});
```

---

### Phase 3: Customer Course Queries

**File**: `convex/customerCourses.ts` (NEW)

#### 3.1 Get Customer Dashboard: `getCustomerDashboard`

```typescript
export const getCustomerDashboard = query({
  args: {
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Validate session
    // 2. Get all event registrations (objectLinks: contact -> event)
    // 3. Get all certificates (objectLinks: contact -> certificate)
    // 4. Calculate total CME points from certificates
    // 5. Get upcoming events (startDate > now)
    // 6. Get completed events (endDate < now, has certificate)
    // 7. Return dashboard data
  }
});
```

**Returns:**
```typescript
{
  totalCMEPoints: 45, // Sum from all certificates
  registeredEvents: 12,
  upcomingEvents: [/* events with startDate > now */],
  completedEvents: [/* events with endDate < now */],
  certificates: [/* certificate objects with URLs */],
}
```

**CME Points Calculation:**
```typescript
// Get all certificates for this contact
const certificateLinks = await ctx.db
  .query("objectLinks")
  .withIndex("by_from", (q) => q.eq("fromObjectId", contactId))
  .filter((q) => q.eq(q.field("linkType"), "earned_certificate"))
  .collect();

const certificates = await Promise.all(
  certificateLinks.map(link => ctx.db.get(link.toObjectId))
);

const totalCMEPoints = certificates.reduce((sum, cert) => {
  return sum + (cert?.customProperties?.cmePoints || 0);
}, 0);
```

---

#### 3.2 Get Customer Events: `getCustomerEvents`

```typescript
export const getCustomerEvents = query({
  args: {
    sessionId: v.string(),
    filter: v.optional(v.union(
      v.literal("upcoming"),
      v.literal("completed"),
      v.literal("all")
    )),
  },
  handler: async (ctx, args) => {
    // 1. Validate session
    // 2. Get objectLinks (type: "registered_for")
    // 3. Fetch event objects
    // 4. Filter by date if needed
    // 5. Include certificate info if completed
    // 6. Return event list with registration details
  }
});
```

**Returns:**
```typescript
[
  {
    eventId: "evt_123",
    name: "Kardiologie Fortbildung 2025",
    startDate: 1234567890,
    endDate: 1234999999,
    cmePoints: 8,
    registrationDate: 1234500000,
    status: "upcoming" | "completed",
    certificate?: {
      id: "cert_456",
      url: "https://...",
      issueDate: 1235000000,
    },
  },
]
```

---

#### 3.3 Get Customer Transactions: `getCustomerTransactions`

```typescript
export const getCustomerTransactions = query({
  args: {
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Validate session
    // 2. Get objectLinks (type: "made_purchase")
    // 3. Fetch checkout objects
    // 4. Extract transaction data from checkout.customProperties
    // 5. Return payment history with invoice info
  }
});
```

**Returns:**
```typescript
[
  {
    transactionId: "txn_abc123",
    checkoutId: "checkout_789",
    eventName: "Kardiologie Fortbildung 2025",
    amount: 450.00,
    currency: "EUR",
    status: "paid",
    method: "stripe",
    timestamp: 1234567890,
    billingAddress: { ... }, // From linked organization
  },
]
```

---

### Phase 4: Course Registration Flow

**File**: `convex/customerRegistration.ts` (NEW)

#### 4.1 Register for Event: `registerForEvent`

```typescript
export const registerForEvent = mutation({
  args: {
    sessionId: v.string(),
    eventId: v.id("objects"),
    paymentMethodId: v.string(), // Stripe payment method
  },
  handler: async (ctx, args) => {
    // 1. Validate session
    // 2. Get customer contact
    // 3. Get linked organization (for billing info)
    // 4. Verify event availability
    // 5. Create checkout object with transaction data
    // 6. Create objectLink (contact -> event, type: "registered_for")
    // 7. Create objectLink (contact -> checkout, type: "made_purchase")
    // 8. Update event.customProperties.currentParticipants
    // 9. Send confirmation email
    // 10. Log objectAction (type: "customer_registered_for_event")
    // 11. Return { success, checkoutId, confirmationCode }
  }
});
```

**Checkout Object Created:**
```typescript
{
  type: "checkout",
  subtype: "course_registration",
  name: "Registration - Dr. Mustermann - Kardiologie 2025",
  customProperties: {
    status: "completed",
    amount: 450.00,
    currency: "EUR",
    eventId: "evt_123",
    contactId: "contact_456",
    organizationId: "org_789", // Billing organization
    transaction: {
      id: "txn_abc123",
      status: "paid",
      method: "stripe",
      timestamp: 1234567890,
      paymentIntentId: "pi_xyz",
    },
  },
}
```

---

#### 4.2 Award Certificate: `awardCertificate`

```typescript
export const awardCertificate = mutation({
  args: {
    eventId: v.id("objects"),
    contactId: v.id("objects"),
    certificateUrl: v.string(),
  },
  handler: async (ctx, args) => {
    // Called after event completion (manual or automated)
    // 1. Get event object (to get CME points)
    // 2. Create certificate object
    //    - customProperties.cmePoints = event.customProperties.cmePoints
    //    - customProperties.certificateUrl = certificateUrl
    // 3. Create objectLink (contact -> certificate, type: "earned_certificate")
    // 4. Create objectLink (certificate -> event, type: "certificate_for_event")
    // 5. Log objectAction (type: "certificate_awarded")
    // 6. Send email with certificate
    // 7. Return { success, certificateId }
  }
});
```

---

### Phase 5: Helper Queries

**File**: `convex/customerHelpers.ts` (NEW)

#### 5.1 Check Email Availability: `checkEmailAvailable`

```typescript
export const checkEmailAvailable = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    // Public query - no auth required
    // Check if email exists in crm_contact
    // Return { available: boolean }
  }
});
```

---

## Frontend Implementation (HaffNet Website)

### Phase 1: Update API Client

**File**: `src/lib/vc83-api/client.ts`

Update the `VC83ApiClient` class with new customer auth methods:

```typescript
// Registration with business info
async registerCustomer(data: {
  // Personal
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  title?: string;
  specialization?: string;
  licenseNumber?: string;
  phone?: string;
  marketingOptIn?: boolean;
  // Business
  business: {
    companyName: string;
    taxId?: string;
    billingAddress: {
      street: string;
      city: string;
      postalCode: string;
      country: string;
    };
    domain?: string;
  };
}): Promise<RegistrationResponse>

async signInCustomer(email: string, password: string): Promise<AuthResponse>
async signOutCustomer(): Promise<void>
async getCurrentCustomer(): Promise<Customer | null>
async updateCustomerProfile(updates: ProfileUpdates): Promise<Customer>
async updateBusinessInfo(updates: BusinessUpdates): Promise<Organization>
async changePassword(current: string, newPass: string): Promise<void>
async requestPasswordReset(email: string): Promise<void>
async resetPassword(token: string, newPass: string): Promise<void>

// Customer dashboard
async getCustomerDashboard(): Promise<DashboardData>
async getCustomerEvents(filter?: 'upcoming' | 'completed'): Promise<Event[]>
async getCustomerTransactions(): Promise<Transaction[]>

// Event registration
async registerForEvent(data: EventRegistrationData): Promise<RegistrationResult>

// Utilities
async checkEmailAvailable(email: string): Promise<boolean>
```

---

### Phase 2: Authentication Pages

#### 2.1 Registration Page

**File**: `src/app/registrieren/page.tsx`

**Features:**
- Multi-step form:
  1. Account Info (email, password)
  2. Personal Info (name, title, specialization)
  3. Business Info (company, billing address, tax ID)
  4. Review & Submit
- Email validation (check availability)
- Password strength indicator
- Terms & conditions checkbox
- Marketing opt-in checkbox

**Form Validation:**
```typescript
- Email: Required, valid format, must be available
- Password: Min 8 chars, 1 uppercase, 1 number, 1 special char
- First Name: Required
- Last Name: Required
- Title: Optional (Dr., Prof., etc.)
- Specialization: Optional
- License Number: Optional but recommended
- Business Name: Required
- Billing Address: Required (street, city, postal code, country)
- Tax ID: Optional
```

---

#### 2.2 Login Page

**File**: `src/app/anmelden/page.tsx`

**Features:**
- Email + password fields
- "Remember me" checkbox (30-day session)
- "Forgot password?" link
- Error handling (invalid credentials, locked account)
- Redirect to previous page after login
- Demo account notice (if applicable)

---

#### 2.3 Forgot Password Page

**File**: `src/app/passwort-vergessen/page.tsx`

**Features:**
- Email input
- Send reset link
- Success message (always shown, don't leak email existence)
- Link expires in 1 hour
- Rate limiting (max 3 requests per hour)

---

#### 2.4 Reset Password Page

**File**: `src/app/passwort-zuruecksetzen/[token]/page.tsx`

**Features:**
- New password + confirm password fields
- Password strength indicator
- Token validation
- Expired token handling
- Success redirect to login page

---

### Phase 3: Customer Dashboard

**File**: `src/app/mein-konto/page.tsx`

**Features:**
- Protected route (requires authentication)
- Overview cards:
  - Total CME Points (calculated from certificates)
  - Registered Events
  - Upcoming Events
  - Completed Events
- Quick actions:
  - Browse all courses
  - View certificates
  - Update profile
  - Update business info
- Tabs:
  - Dashboard
  - My Events
  - Certificates (with download links)
  - Transactions (payment history)
  - Profile Settings
  - Business Settings

---

### Phase 4: Event Registration Flow Update

**File**: `src/app/seminare/[id]/anmelden/page.tsx`

**Updated Flow:**
1. Check if user is logged in
2. If not, show:
   - "Sign in to register" button
   - "Create account" button
   - Option to continue as guest (collect email, create account after payment)
3. If logged in:
   - Show event details
   - Show offering selection
   - Pre-fill billing info from linked organization
   - Confirm and submit registration (creates checkout + links)

---

### Phase 5: Protected Routes & Auth Context

**File**: `src/contexts/AuthContext.tsx` (NEW)

```typescript
export function AuthProvider({ children }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  // Load customer on mount
  useEffect(() => {
    loadCustomer();
  }, []);

  async function loadCustomer() {
    const data = await vc83Api.getCurrentCustomer();
    setCustomer(data);
    setLoading(false);
  }

  return (
    <AuthContext.Provider value={{ customer, loading, reload: loadCustomer }}>
      {children}
    </AuthContext.Provider>
  );
}
```

**Usage:**
```typescript
// In any component
const { customer, loading } = useAuth();

if (loading) return <LoadingSpinner />;
if (!customer) return <LoginPrompt />;

// Access customer data
console.log(customer.totalCMEPoints); // From certificates
console.log(customer.business.billingAddress);
```

---

### Phase 6: UI Components

#### 6.1 Login/Logout Navigation

**File**: `src/components/navigation.tsx`

Update to show:
- If logged out: "Anmelden" + "Registrieren" buttons
- If logged in: "Mein Konto" dropdown with:
  - Dashboard
  - My Events
  - Certificates
  - Profile
  - Logout

---

#### 6.2 Protected Route Wrapper

**File**: `src/components/ProtectedRoute.tsx`

```typescript
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { customer, loading } = useAuth();
  const router = useRouter();

  if (loading) return <LoadingSpinner />;

  if (!customer) {
    router.push('/anmelden?redirect=' + window.location.pathname);
    return null;
  }

  return <>{children}</>;
}
```

---

## File Structure

```
convex/
├── schema.ts (UPDATE: add customerSessions table)
├── customerAuth.ts (NEW: all customer auth mutations/queries)
├── customerCourses.ts (NEW: customer course queries)
├── customerRegistration.ts (NEW: event registration + certificate flow)
└── customerHelpers.ts (NEW: utility queries)

src/
├── lib/
│   └── vc83-api/
│       ├── client.ts (UPDATE: customer auth methods)
│       └── index.ts (UPDATE: export new types)
│
├── contexts/
│   └── AuthContext.tsx (NEW: customer auth state)
│
├── app/
│   ├── registrieren/
│   │   └── page.tsx (NEW: customer registration with business info)
│   ├── anmelden/
│   │   └── page.tsx (NEW: customer login)
│   ├── passwort-vergessen/
│   │   └── page.tsx (NEW: forgot password)
│   ├── passwort-zuruecksetzen/
│   │   └── [token]/
│   │       └── page.tsx (NEW: reset password)
│   ├── mein-konto/
│   │   └── page.tsx (NEW: customer dashboard)
│   └── seminare/
│       └── [id]/
│           └── anmelden/
│               └── page.tsx (UPDATE: check auth, use organization billing)
│
└── components/
    ├── navigation.tsx (UPDATE: show login/account dropdown)
    ├── ProtectedRoute.tsx (NEW: auth wrapper)
    └── LoginPrompt.tsx (NEW: prompt to sign in)
```

---

## Implementation Checklist

### Backend (l4yercak3)

- [ ] **Schema**: Add `customerSessions` table
- [ ] **Auth**: Create `customerAuth.ts` with all auth mutations
  - [ ] `registerCustomer` (creates contact + organization + link)
  - [ ] `signInCustomer`
  - [ ] `signOutCustomer`
  - [ ] `getCurrentCustomer` (includes organization data)
  - [ ] `updateCustomerProfile`
  - [ ] `updateBusinessInfo` (updates organization)
  - [ ] `changeCustomerPassword`
  - [ ] `requestPasswordReset`
  - [ ] `resetCustomerPassword`
- [ ] **Courses**: Create `customerCourses.ts` with dashboard queries
  - [ ] `getCustomerDashboard` (CME points from certificates)
  - [ ] `getCustomerEvents`
  - [ ] `getCustomerTransactions` (from checkout objects)
- [ ] **Registration**: Create `customerRegistration.ts`
  - [ ] `registerForEvent` (creates checkout + links)
  - [ ] `awardCertificate` (creates certificate + links)
- [ ] **Helpers**: Create `customerHelpers.ts`
  - [ ] `checkEmailAvailable`
- [ ] **Testing**: Write integration tests for auth flow
- [ ] **Security**: Add rate limiting and IP tracking
- [ ] **Email**: Set up password reset email templates

### Frontend (HaffNet Website)

- [ ] **API Client**: Update with customer auth methods
- [ ] **Auth Context**: Create customer auth provider
- [ ] **Registration**: Build multi-step registration form (personal + business)
- [ ] **Login**: Build login page with error handling
- [ ] **Password Reset**: Build forgot/reset password flow
- [ ] **Dashboard**: Build customer dashboard
  - [ ] CME points display (from certificates)
  - [ ] Event list with certificate links
  - [ ] Transaction history
  - [ ] Business info editor
- [ ] **Navigation**: Update to show login/account menu
- [ ] **Protected Routes**: Add auth wrapper component
- [ ] **Event Registration**: Update to use organization billing
- [ ] **Testing**: Test full registration -> login -> event registration flow

---

## Security Considerations

1. **Password Security**:
   - Use bcrypt with cost factor 12
   - Minimum 8 characters, 1 uppercase, 1 number, 1 special char
   - No password hints or weak reset questions

2. **Session Security**:
   - 30-day expiration for "remember me"
   - 24-hour expiration for regular sessions
   - Secure, httpOnly cookies (if using cookies)
   - Session rotation on password change

3. **Rate Limiting**:
   - Login: 5 attempts per hour per IP
   - Registration: 3 per hour per IP
   - Password reset: 3 per hour per email

4. **Data Privacy**:
   - Never return `passwordHash` in queries
   - Sanitize all customer data before returning
   - Log all auth events in `objectActions`
   - GDPR compliance: allow data export/deletion

5. **Email Validation**:
   - Send confirmation email after registration
   - Verify email before allowing event registration
   - Add `emailVerified` flag to customProperties

---

## Data Model Examples

### CRM Contact (Customer)

```typescript
{
  _id: "contact_123",
  organizationId: "haffnet_org_id",
  type: "crm_contact",
  subtype: "customer",
  name: "Dr. Max Mustermann",
  description: "Kardiologie Facharzt",
  status: "active",
  customProperties: {
    // Auth
    email: "max@praxis-mustermann.de",
    passwordHash: "$2b$12$...",
    emailVerified: true,
    lastLogin: 1234567890,

    // Personal
    firstName: "Max",
    lastName: "Mustermann",
    title: "Dr. med.",
    phone: "+49 30 12345678",

    // Professional
    specialization: "Kardiologie",
    licenseNumber: "DE-CARD-12345",

    // Marketing
    marketingOptIn: true,

    // Source
    source: "website_signup",
    sourceRef: "/seminare/kardiologie-2025",
  },
  createdBy: "system",
  createdAt: 1234567890,
  updatedAt: 1234567890,
}
```

### CRM Organization (Customer's Business)

```typescript
{
  _id: "org_456",
  organizationId: "haffnet_org_id",
  type: "crm_organization",
  subtype: "business",
  name: "Praxis Dr. Mustermann",
  description: "Kardiologische Praxis",
  status: "active",
  customProperties: {
    companyName: "Praxis Dr. Mustermann GmbH",
    taxId: "DE123456789",
    billingAddress: {
      street: "Hauptstraße 123",
      city: "Berlin",
      postalCode: "10115",
      country: "Deutschland",
    },
    domain: "praxis-mustermann.de",
    industry: "Healthcare",
  },
  createdBy: "system",
  createdAt: 1234567890,
}
```

### Object Link (Contact -> Organization)

```typescript
{
  _id: "link_789",
  organizationId: "haffnet_org_id",
  fromObjectId: "contact_123", // Customer
  toObjectId: "org_456", // Business
  linkType: "owns_business",
  properties: {
    role: "owner",
    since: 1234567890,
  },
  createdBy: "system",
  createdAt: 1234567890,
}
```

### Event Object

```typescript
{
  _id: "evt_101",
  organizationId: "haffnet_org_id",
  type: "event",
  subtype: "course_event",
  name: "Kardiologie Fortbildung 2025",
  description: "CME-zertifizierte Fortbildung",
  status: "active",
  customProperties: {
    startDate: 1234567890,
    endDate: 1234999999,
    maxParticipants: 50,
    currentParticipants: 23,
    cmePoints: 8,
    price: 450.00,
    currency: "EUR",
  },
  createdBy: "admin_user_id",
  createdAt: 1234567890,
}
```

### Certificate Object

```typescript
{
  _id: "cert_202",
  organizationId: "haffnet_org_id",
  type: "certificate",
  subtype: "cme_certificate",
  name: "Certificate - Dr. Max Mustermann - Kardiologie 2025",
  description: "CME certificate for event completion",
  status: "issued",
  customProperties: {
    certificateUrl: "https://cdn.haffnet.de/certificates/cert_202.pdf",
    issueDate: 1235000000,
    cmePoints: 8, // Copied from event
  },
  createdBy: "system",
  createdAt: 1235000000,
}
```

### Object Links (Certificate)

```typescript
// Contact -> Certificate (earned)
{
  fromObjectId: "contact_123",
  toObjectId: "cert_202",
  linkType: "earned_certificate",
  properties: {
    earnedDate: 1235000000,
  },
}

// Certificate -> Event (for which event)
{
  fromObjectId: "cert_202",
  toObjectId: "evt_101",
  linkType: "certificate_for_event",
  properties: {
    completionDate: 1235000000,
  },
}
```

### Checkout Object

```typescript
{
  _id: "checkout_303",
  organizationId: "haffnet_org_id",
  type: "checkout",
  subtype: "course_registration",
  name: "Registration - Dr. Mustermann - Kardiologie 2025",
  description: "Event registration checkout",
  status: "completed",
  customProperties: {
    amount: 450.00,
    currency: "EUR",
    eventId: "evt_101",
    contactId: "contact_123",
    organizationId: "org_456", // Billing organization
    transaction: {
      id: "txn_abc123",
      status: "paid",
      method: "stripe",
      timestamp: 1234567890,
      paymentIntentId: "pi_xyz123",
    },
  },
  createdBy: "system",
  createdAt: 1234567890,
}
```

### Object Link (Contact -> Checkout)

```typescript
{
  fromObjectId: "contact_123",
  toObjectId: "checkout_303",
  linkType: "made_purchase",
  properties: {
    purchaseDate: 1234567890,
  },
}
```

### Object Link (Contact -> Event Registration)

```typescript
{
  fromObjectId: "contact_123",
  toObjectId: "evt_101",
  linkType: "registered_for",
  properties: {
    registrationDate: 1234567890,
    checkoutId: "checkout_303",
  },
}
```

---

## Success Metrics

- [ ] Customer can register account with business info in < 3 minutes
- [ ] Customer can login and see dashboard
- [ ] Customer can view all registered events
- [ ] Customer can see total CME points (calculated from certificates)
- [ ] Customer can download certificates
- [ ] Customer can register for new events (using organization billing)
- [ ] Customer can update personal profile
- [ ] Customer can update business info
- [ ] Customer can change password
- [ ] Customer can reset forgotten password
- [ ] All auth events logged in audit trail
- [ ] Zero mixing of platform users and customers
- [ ] Session management working correctly
- [ ] Billing info correctly pulled from organization

---

## Next Steps

1. **Review this revised plan** - Does this architecture meet all requirements?
2. **Backend first** - Implement schema + auth mutations in l4yercak3
3. **API client** - Update frontend client with new methods
4. **Frontend pages** - Build registration (with business), login, dashboard
5. **Integration testing** - Test full flow end-to-end
6. **Deploy** - Deploy backend + frontend together

---

## Questions to Resolve

1. **Email verification**: Require email confirmation before event registration?
2. **Session duration**: 24 hours or 30 days default?
3. **Social login**: Add Google/Microsoft OAuth later?
4. **Two-factor auth**: Required for high-value accounts?
5. **GDPR compliance**: Need data export/deletion tools?
6. **Payment integration**: Stripe/PayPal for event payments?
7. **Certificate generation**: Auto-generate PDF certificates after event?
8. **Multi-doctor practices**: Support multiple contacts per organization?

---

Ready to start implementation!
