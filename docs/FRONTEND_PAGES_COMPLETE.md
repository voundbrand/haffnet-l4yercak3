# Frontend Pages - Complete Implementation

All event registration pages have been created and connected to your L4yerCak3 backend API.

---

## Created Pages

### 1. Events Listing Page
**Path:** `/events`
**File:** [src/app/events/page.tsx](../src/app/events/page.tsx)

**Features:**
- Fetches all published symposium events from API
- Displays events in a responsive grid
- Shows event dates, location, capacity
- Highlights registration status (open/closed)
- Shows remaining spots warning when < 20 spots left
- Links to event detail pages

**API Call:**
```typescript
GET /api/v1/events?subtype=symposium&status=published&upcoming=true
```

---

### 2. Event Detail Page
**Path:** `/events/[id]`
**File:** [src/app/events/[id]/page.tsx](../src/app/events/[id]/page.tsx)

**Features:**
- Shows complete event information
- Displays all 6 registration categories with pricing
- Shows add-on options (UCRA boat trip)
- Real-time capacity tracking
- Registration CTA button (disabled if full/closed)
- Sidebar with registration window info

**API Calls:**
```typescript
GET /api/v1/events/{eventId}
GET /api/v1/events/{eventId}/products
```

---

### 3. Registration Form Page
**Path:** `/events/[id]/register`
**File:** [src/app/events/[id]/register/page.tsx](../src/app/events/[id]/register/page.tsx)

**Features:**
- Category selection (6 options)
- UCRA add-on selector (0-2 participants)
- Personal information form
- Optional fields (dietary requirements, accessibility)
- Privacy consent checkboxes
- Real-time price calculation
- Shows employer billing message for AMEOS
- Form validation
- Loading states during submission

**Form Fields:**
- Title (optional)
- First Name *
- Last Name *
- Email *
- Phone
- Organization
- Position
- Dietary Requirements
- Accessibility Needs
- Comments
- Privacy Consent *
- Photo Consent
- Newsletter Signup

**API Call:**
```typescript
POST /api/v1/workflows/trigger
{
  trigger: "event_registration_complete",
  inputData: {
    eventId,
    productId,
    customerData: { ... },
    formResponses: { ... },
    transactionData: { ... }
  }
}
```

---

### 4. Confirmation Page
**Path:** `/bestaetigung`
**File:** [src/app/bestaetigung/page.tsx](../src/app/bestaetigung/page.tsx)

**Features:**
- Success message with green checkmark
- Displays complete ticket information
- Shows QR code for check-in
- Event details and attendee info
- Pricing breakdown
- Add-on confirmation (UCRA if selected)
- Print button
- Important instructions
- Link to view more events

**URL Parameter:**
```
/bestaetigung?ticket={ticketId}
```

**API Call:**
```typescript
GET /api/v1/tickets/{ticketId}
```

---

## API Client

**File:** [src/lib/api-client.ts](../src/lib/api-client.ts)

**Configured for:**
- Base URL: `https://app.l4yercak3.com/api/v1`
- API Key: Stored in `.env.local`
- Organization ID: `ks79z6rj8kc42sn7r847smrdr57vd3mz`

**Available Functions:**

```typescript
// Events
eventApi.getEvents(params)
eventApi.getEvent(eventId)
eventApi.getEventProducts(eventId)

// Forms
formApi.getPublicForm(formId)

// Workflows
workflowApi.submitRegistration(data)

// Tickets
ticketApi.getTicket(ticketId)
ticketApi.verifyTicket(ticketId)
```

**TypeScript Types Included:**
- Event
- Product
- Form
- Ticket
- RegistrationInput
- RegistrationResponse

---

## Environment Variables

**File:** `.env.local`

```bash
# L4yerCak3 Backend API Configuration
NEXT_PUBLIC_API_URL=https://app.l4yercak3.com/api/v1
NEXT_PUBLIC_API_KEY=org_ks79z6rj8kc42sn7r847smrdr57vd3mz_00lbs61zzosdidru0vucxp4xynnbbp3p

# Organization ID
NEXT_PUBLIC_ORG_ID=ks79z6rj8kc42sn7r847smrdr57vd3mz

# Event ID (update after creating event in backend)
NEXT_PUBLIC_EVENT_ID=event_haffsymposium_2024
```

---

## User Flow

### Complete Registration Journey

1. **User visits `/events`**
   - Sees list of available events
   - Clicks on "9. HaffSymposium"

2. **User sees event details at `/events/event_haffsymposium_2024`**
   - Reads event information
   - Views all 6 categories and pricing
   - Sees UCRA add-on option
   - Clicks "Jetzt anmelden"

3. **User fills registration form at `/events/event_haffsymposium_2024/register`**
   - Selects category (e.g., "External Participant")
   - Optionally adds UCRA participants (0-2)
   - Fills personal information
   - Accepts privacy policy
   - Sees total price update in real-time
   - Clicks "Verbindlich anmelden"

4. **Backend processes registration**
   - Validates data
   - Checks capacity
   - Verifies price calculation
   - Detects billing method (customer vs employer)
   - Creates contact, ticket, form response
   - Generates invoice (if AMEOS)
   - Sends confirmation email
   - Updates statistics

5. **User redirected to `/bestaetigung?ticket={ticketId}`**
   - Sees success message
   - Views ticket details
   - Downloads/prints ticket with QR code
   - Receives confirmation email

---

## Pricing Examples

### External Participant + UCRA (2 people)
```
Base Price:    150.00 €
UCRA (2x):      60.00 €
---------------
Total:         210.00 €
Billing: Customer pays via Stripe
```

### AMEOS Employee + UCRA (1 person)
```
Base Price:      0.00 € (free for employee)
UCRA (1x):      30.00 €
---------------
Total:          30.00 €
Billing: Invoice to AMEOS Klinikum
```

### HaffNet Member (no add-ons)
```
Base Price:    100.00 €
UCRA:            0.00 €
---------------
Total:         100.00 €
Billing: Customer pays via Stripe
```

### Speaker/Sponsor/Orga
```
Base Price:      0.00 €
UCRA:       Not available
---------------
Total:           0.00 € (FREE)
Billing: None
```

---

## Styling

All pages use:
- **Tailwind CSS** for styling
- **Blue color scheme** (blue-600, blue-700)
- **Gradient backgrounds** (from-blue-600 to-blue-700)
- **Responsive design** (mobile-first)
- **Accessible forms** with proper labels
- **Loading states** with spinners
- **Error handling** with user-friendly messages

---

## Error Handling

### Events Listing
- Shows "No events" message if empty
- Catches API errors and displays message

### Event Detail
- Returns 404 if event not found
- Catches API errors gracefully

### Registration Form
- Client-side validation (required fields)
- Server-side validation via workflow
- Shows error messages inline
- Prevents duplicate submissions

### Confirmation Page
- Validates ticket ID parameter
- Shows error if ticket not found
- Graceful loading states

---

## Testing Checklist

### Events Listing Page
- [ ] Page loads without errors
- [ ] Events display correctly
- [ ] Click event card navigates to detail page
- [ ] Capacity warnings show when < 20 spots
- [ ] "Registration open" badge shows correctly

### Event Detail Page
- [ ] Event information displays correctly
- [ ] All 6 categories show with correct pricing
- [ ] UCRA add-on information visible
- [ ] "Jetzt anmelden" button works
- [ ] Button disabled when event full/closed

### Registration Form
- [ ] All form fields render correctly
- [ ] Category selection works
- [ ] UCRA selector shows for eligible categories
- [ ] Price calculation updates in real-time
- [ ] Form validation works (required fields)
- [ ] Privacy consent required to submit
- [ ] Submission creates ticket in backend
- [ ] Redirects to confirmation on success
- [ ] Shows error message on failure

### Confirmation Page
- [ ] Ticket information displays correctly
- [ ] QR code shows
- [ ] Price breakdown is accurate
- [ ] Print button works
- [ ] Links navigate correctly

---

## Next Steps

1. **Update Event ID**: After creating the event in L4yerCak3, update `NEXT_PUBLIC_EVENT_ID` in `.env.local`

2. **Add Navigation Link**: Add a link to `/events` in your main navigation

3. **Test Complete Flow**:
   ```bash
   npm run dev
   # Visit http://localhost:3000/events
   # Complete a test registration
   ```

4. **Verify Backend Integration**:
   - Check that tickets are created in L4yerCak3
   - Verify emails are sent
   - Check that statistics update
   - Confirm invoices generated for AMEOS

5. **Add Payment Processing** (if needed):
   - Integrate Stripe.js for paid registrations
   - Add payment step before workflow submission
   - Handle payment confirmation

6. **Deploy to Vercel**:
   - Add environment variables to Vercel
   - Deploy frontend
   - Test in production

---

## Files Created

```
src/
├── app/
│   ├── events/
│   │   ├── page.tsx                    # Events listing
│   │   └── [id]/
│   │       ├── page.tsx                # Event detail
│   │       └── register/
│   │           └── page.tsx            # Registration form
│   └── bestaetigung/
│       └── page.tsx                     # Confirmation
└── lib/
    └── api-client.ts                    # API client with types
```

---

## Summary

✅ **4 pages created** and connected to backend API
✅ **Type-safe API client** with all endpoints
✅ **Complete user flow** from listing to confirmation
✅ **Real-time price calculation** with add-ons
✅ **Employer billing detection** for AMEOS
✅ **Responsive design** mobile-friendly
✅ **Error handling** throughout
✅ **Loading states** for better UX

**Ready to test!** 🚀
