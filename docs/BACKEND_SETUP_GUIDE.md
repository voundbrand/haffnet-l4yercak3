# Backend Setup Guide - HaffSymposium Event

This guide walks you through creating the backend objects for the HaffSymposium event in your L4yerCak3 admin panel.

---

## Prerequisites

- Access to L4yerCak3 admin panel
- Organization ID
- Admin permissions for creating events, products, and workflows

---

## Setup Overview

You'll create:
1. **1 Event object** (HaffSymposium)
2. **6 Product objects** (registration categories)
3. **1 Form object** (optional - registration form schema)
4. **1 Workflow configuration** (11 behaviors)
5. **2 Email templates** (confirmation, admin notification)

**Estimated time:** 30-45 minutes

---

## Step 1: Create Event Object

### Navigate to Events
Admin Panel → Events → Create New Event

### Event Configuration

```typescript
{
  // Basic Information
  organizationId: "<your_org_id>",
  subtype: "symposium",
  name: "8. HaffSymposium der Sportmedizin",
  description: "Das 8. HaffSymposium der Sportmedizin findet am 31. Mai und 1. Juni 2024 in Ueckermünde statt. Eine interdisziplinäre Fortbildungsveranstaltung für Ärzte, Therapeuten und Sportmediziner.",

  // Event Dates (Unix timestamps in milliseconds)
  startDate: 1717142400000,  // May 31, 2024 09:00:00 GMT+2
  endDate: 1717264800000,    // June 1, 2024 18:00:00 GMT+2
  location: "Ueckermünde",

  // Status
  status: "published",

  // Custom Properties
  customProperties: {
    // Dates
    startDate: 1717142400000,
    endDate: 1717264800000,
    location: "Ueckermünde",
    venue: "Bürgersaal",
    timezone: "Europe/Berlin",

    // Capacity
    maxCapacity: 200,
    currentRegistrations: 0,

    // Address
    address: {
      street: "Am Markt 1",
      city: "Ueckermünde",
      postalCode: "17373",
      country: "Deutschland"
    },

    // Registration Window
    registration: {
      enabled: true,
      openDate: 1705276800000,   // January 15, 2024
      closeDate: 1716681600000    // May 25, 2024
    },

    // Statistics (initialize to zero)
    stats: {
      totalRevenue: 0,
      totalRegistrations: 0,
      categoryCounts: {
        external: 0,
        ameos: 0,
        haffnet: 0,
        speaker: 0,
        sponsor: 0,
        orga: 0
      }
    }
  }
}
```

**Save and copy the Event ID:** `event_haffsymposium_2024` (or whatever ID is generated)

---

## Step 2: Create Product Objects (6 Categories)

### Product 1: External Participant

```typescript
{
  organizationId: "<your_org_id>",
  subtype: "ticket",
  name: "HaffSymposium 2024 - Externer Teilnehmer",
  description: "Teilnahmegebühr für externe Teilnehmer (nicht AMEOS oder HaffNet)",

  status: "published",

  // Link to event
  eventId: "event_haffsymposium_2024",

  customProperties: {
    // Pricing
    price: 15000,      // 150.00 EUR in cents
    currency: "EUR",
    sold: 0,

    // Category identification
    categoryCode: "external",
    categoryLabel: "Externer Teilnehmer",

    // Add-ons available for this category
    addons: [
      {
        id: "ucra_boat_trip",
        name: "UCRA Abendveranstaltung",
        description: "Bootstour auf dem Haff mit Abendessen am 31. Mai",
        pricePerPerson: 3000,  // 30.00 EUR
        maxQuantity: 2,
        available: true
      }
    ]
  }
}
```

**Product ID:** `product_external_2024`

---

### Product 2: AMEOS Employee

```typescript
{
  organizationId: "<your_org_id>",
  subtype: "ticket",
  name: "HaffSymposium 2024 - AMEOS Mitarbeiter",
  description: "Kostenlose Teilnahme für AMEOS Mitarbeiter. Die Kosten werden dem Arbeitgeber in Rechnung gestellt.",

  status: "published",
  eventId: "event_haffsymposium_2024",

  customProperties: {
    // Pricing (free for employee, employer pays)
    price: 0,
    currency: "EUR",
    sold: 0,

    // Category identification
    categoryCode: "ameos",
    categoryLabel: "AMEOS Mitarbeiter",

    // Employer billing configuration
    invoiceConfig: {
      employerSourceField: "attendee_category",
      employerMapping: {
        "ameos": "AMEOS Klinikum Ueckermünde"
      },
      defaultPaymentTerms: "net30",
      billingNote: "Mitarbeiterschulung gemäß Fortbildungsvereinbarung"
    },

    // Add-ons (employer also pays for these)
    addons: [
      {
        id: "ucra_boat_trip",
        name: "UCRA Abendveranstaltung",
        description: "Bootstour auf dem Haff mit Abendessen",
        pricePerPerson: 3000,
        maxQuantity: 2,
        available: true
      }
    ]
  }
}
```

**Product ID:** `product_ameos_2024`

---

### Product 3: HaffNet Member

```typescript
{
  organizationId: "<your_org_id>",
  subtype: "ticket",
  name: "HaffSymposium 2024 - HaffNet-Mitglied",
  description: "Reduzierte Teilnahmegebühr für HaffNet-Mitglieder",

  status: "published",
  eventId: "event_haffsymposium_2024",

  customProperties: {
    price: 10000,  // 100.00 EUR
    currency: "EUR",
    sold: 0,

    categoryCode: "haffnet",
    categoryLabel: "HaffNet-Mitglied",

    addons: [
      {
        id: "ucra_boat_trip",
        name: "UCRA Abendveranstaltung",
        description: "Bootstour auf dem Haff mit Abendessen",
        pricePerPerson: 3000,
        maxQuantity: 2,
        available: true
      }
    ]
  }
}
```

**Product ID:** `product_haffnet_2024`

---

### Product 4: Speaker

```typescript
{
  organizationId: "<your_org_id>",
  subtype: "ticket",
  name: "HaffSymposium 2024 - Referent",
  description: "Kostenlose Teilnahme für Referenten und Vortragenden",

  status: "published",
  eventId: "event_haffsymposium_2024",

  customProperties: {
    price: 0,
    currency: "EUR",
    sold: 0,

    categoryCode: "speaker",
    categoryLabel: "Referent",

    addons: []  // No add-ons for speakers
  }
}
```

**Product ID:** `product_speaker_2024`

---

### Product 5: Sponsor

```typescript
{
  organizationId: "<your_org_id>",
  subtype: "ticket",
  name: "HaffSymposium 2024 - Sponsor",
  description: "Kostenlose Teilnahme für Sponsoren",

  status: "published",
  eventId: "event_haffsymposium_2024",

  customProperties: {
    price: 0,
    currency: "EUR",
    sold: 0,

    categoryCode: "sponsor",
    categoryLabel: "Sponsor",

    addons: []
  }
}
```

**Product ID:** `product_sponsor_2024`

---

### Product 6: Orga Team

```typescript
{
  organizationId: "<your_org_id>",
  subtype: "ticket",
  name: "HaffSymposium 2024 - Orga-Team",
  description: "Kostenlose Teilnahme für Organisationsteam",

  status: "published",
  eventId: "event_haffsymposium_2024",

  customProperties: {
    price: 0,
    currency: "EUR",
    sold: 0,

    categoryCode: "orga",
    categoryLabel: "Orga-Team",

    addons: []
  }
}
```

**Product ID:** `product_orga_2024`

---

## Step 3: Create Form Object (Optional)

If you want to store the form schema in the backend:

```typescript
{
  organizationId: "<your_org_id>",
  subtype: "registration",
  name: "HaffSymposium 2024 Registration Form",
  description: "Anmeldeformular für das 8. HaffSymposium",

  status: "published",
  eventId: "event_haffsymposium_2024",

  customProperties: {
    eventId: "event_haffsymposium_2024",

    formSchema: {
      version: "1.0",

      fields: [
        // See BACKEND_ONTOLOGY_STRUCTURE.md for complete field definitions
        {
          id: "attendee_category",
          type: "select",
          label: "Teilnehmerkategorie",
          required: true,
          options: [
            { value: "external", label: "Externer Teilnehmer" },
            { value: "ameos", label: "AMEOS Mitarbeiter" },
            { value: "haffnet", label: "HaffNet-Mitglied" },
            { value: "speaker", label: "Referent" },
            { value: "sponsor", label: "Sponsor" },
            { value: "orga", label: "Orga-Team" }
          ]
        }
        // Add more fields as needed
      ],

      settings: {
        allowMultipleSubmissions: false,
        showProgressBar: true,
        submitButtonText: "Jetzt anmelden",
        successMessage: "Vielen Dank für Ihre Anmeldung!",
        redirectUrl: "/bestaetigung"
      }
    },

    stats: {
      views: 0,
      submissions: 0,
      completionRate: 0
    }
  }
}
```

**Form ID:** `form_haffsymposium_2024`

---

## Step 4: Verify Object Links

After creating the event and products, verify that object links were created automatically:

### Navigate to: Admin Panel → Object Links

**Expected Links:**

```
event_haffsymposium_2024 --[offers]--> product_external_2024
event_haffsymposium_2024 --[offers]--> product_ameos_2024
event_haffsymposium_2024 --[offers]--> product_haffnet_2024
event_haffsymposium_2024 --[offers]--> product_speaker_2024
event_haffsymposium_2024 --[offers]--> product_sponsor_2024
event_haffsymposium_2024 --[offers]--> product_orga_2024
```

If form was created:
```
form_haffsymposium_2024 --[form_for]--> event_haffsymposium_2024
```

---

## Step 5: Create Workflow Configuration

### Navigate to: Admin Panel → Workflows → Create Workflow

### Workflow Settings

```typescript
{
  trigger: "event_registration_complete",
  name: "Event Registration Workflow",
  description: "Processes HaffSymposium event registrations",

  settings: {
    async: true,
    retryOnFailure: true,
    maxRetries: 3,
    notifyOnError: true,
    timeout: 30000
  }
}
```

### Add 11 Behaviors

See [WORKFLOW_CONFIGURATION.md](./WORKFLOW_CONFIGURATION.md) for the complete configuration of all 11 behaviors:

1. validate_registration_data (priority: 100)
2. check_event_capacity (priority: 90)
3. calculate_pricing (priority: 80)
4. detect_employer_billing (priority: 70)
5. create_contact (priority: 60)
6. create_ticket (priority: 50)
7. create_form_response (priority: 45)
8. generate_employer_invoice (priority: 40)
9. send_confirmation_email (priority: 30)
10. update_statistics (priority: 20)
11. notify_admin (priority: 10)

**Important:** Add behaviors in descending priority order (100 → 10)

---

## Step 6: Create Email Templates

### Template 1: Confirmation Email

**Template Name:** `event_registration_confirmation`

**Subject:** `Anmeldebestätigung - {{eventName}}`

**Template:**

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Anmeldebestätigung</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #0066cc; color: white; padding: 20px; text-align: center;">
    <h1>Anmeldebestätigung</h1>
  </div>

  <div style="padding: 20px;">
    <p>Sehr geehrte/r {{firstName}} {{lastName}},</p>

    <p>vielen Dank für Ihre Anmeldung zum <strong>{{eventName}}</strong>.</p>

    <h2>Ihre Anmeldedaten</h2>
    <ul>
      <li><strong>Veranstaltung:</strong> {{eventName}}</li>
      <li><strong>Datum:</strong> {{eventDate}}</li>
      <li><strong>Ort:</strong> {{eventLocation}}, {{eventVenue}}</li>
      <li><strong>Ticketnummer:</strong> {{ticketNumber}}</li>
      <li><strong>Kategorie:</strong> {{category}}</li>
    </ul>

    {{#if ucraParticipants}}
    <h3>UCRA Abendveranstaltung</h3>
    <p>Sie haben sich für die UCRA Abendveranstaltung angemeldet ({{ucraParticipants}} Person(en)).</p>
    {{/if}}

    <h3>Teilnahmegebühr</h3>
    <p><strong>Gesamtbetrag:</strong> {{totalPaid}}</p>
    {{#if billingMethod}}
    <p><em>Zahlungsart: {{billingMethod}}</em></p>
    {{/if}}

    <h3>Ihr Ticket</h3>
    <p>Ihr Ticket ist als PDF im Anhang dieser E-Mail. Bitte bringen Sie das Ticket (ausgedruckt oder digital) zur Veranstaltung mit.</p>

    <div style="text-align: center; margin: 30px 0;">
      <img src="{{qrCodeUrl}}" alt="QR Code" style="width: 200px; height: 200px;" />
      <p><small>QR-Code für Check-in</small></p>
    </div>

    <p>Bei Fragen wenden Sie sich bitte an: <a href="mailto:info@haffnet.de">info@haffnet.de</a></p>

    <p>Wir freuen uns auf Ihre Teilnahme!</p>

    <p>Mit freundlichen Grüßen<br>
    Ihr HaffNet-Team</p>
  </div>

  <div style="background-color: #f0f0f0; padding: 15px; text-align: center; font-size: 12px;">
    <p>HaffNet Management GmbH | Am Markt 1 | 17373 Ueckermünde</p>
    <p><a href="{{confirmationUrl}}">Anmeldung online ansehen</a></p>
  </div>
</body>
</html>
```

---

### Template 2: Admin Notification

**Template Name:** `admin_new_registration`

**Subject:** `New Registration: {{eventName}}`

**Template:**

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>New Registration</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h1>New Event Registration</h1>

  <h2>Event Details</h2>
  <ul>
    <li><strong>Event:</strong> {{eventName}}</li>
    <li><strong>Time:</strong> {{registrationTime}}</li>
  </ul>

  <h2>Attendee Information</h2>
  <ul>
    <li><strong>Name:</strong> {{attendeeName}}</li>
    <li><strong>Email:</strong> {{attendeeEmail}}</li>
    <li><strong>Category:</strong> {{category}}</li>
  </ul>

  <h2>Payment</h2>
  <ul>
    <li><strong>Amount:</strong> {{totalAmount}}</li>
    <li><strong>Billing Method:</strong> {{billingMethod}}</li>
  </ul>

  <h2>Event Status</h2>
  <ul>
    <li><strong>Current Registrations:</strong> {{currentRegistrations}} / {{maxCapacity}}</li>
    <li><strong>Remaining Spots:</strong> {{maxCapacity - currentRegistrations}}</li>
  </ul>

  <p><a href="/admin/tickets/{{ticketId}}">View Ticket in Admin Panel</a></p>
</body>
</html>
```

---

## Step 7: Test the Workflow

### Use Postman or curl to test:

```bash
curl -X POST https://your-api.com/api/v1/workflows/trigger \
  -H "Content-Type: application/json" \
  -d '{
    "trigger": "event_registration_complete",
    "inputData": {
      "eventId": "event_haffsymposium_2024",
      "productId": "product_external_2024",
      "customerData": {
        "email": "test@example.com",
        "firstName": "Test",
        "lastName": "User"
      },
      "formResponses": {
        "attendee_category": "external",
        "first_name": "Test",
        "last_name": "User",
        "email": "test@example.com",
        "consent_privacy": true
      },
      "transactionData": {
        "productId": "product_external_2024",
        "price": 15000,
        "currency": "EUR"
      }
    }
  }'
```

### Expected Result:

1. ✅ Contact created
2. ✅ Ticket created with QR code
3. ✅ Form response stored
4. ✅ Confirmation email sent
5. ✅ Admin notification sent
6. ✅ Event statistics updated
7. ✅ Product sold count incremented

---

## Step 8: Verify Setup

### Checklist

- [ ] Event object created and published
- [ ] All 6 product objects created and linked to event
- [ ] Form object created (optional)
- [ ] All object links verified
- [ ] Workflow configured with 11 behaviors
- [ ] Email templates created
- [ ] Test registration successful
- [ ] Confirmation email received
- [ ] Admin notification received
- [ ] Ticket generated with QR code
- [ ] Statistics updated correctly

---

## Troubleshooting

### Issue: Object links not created

**Solution:** Manually create links via Admin Panel → Object Links

```typescript
{
  fromObjectId: "event_haffsymposium_2024",
  toObjectId: "product_external_2024",
  linkType: "offers"
}
```

### Issue: Workflow not triggering

**Solution:** Check workflow trigger name matches exactly: `event_registration_complete`

### Issue: Email not sending

**Solution:** Verify email template names match behavior configuration

### Issue: Price mismatch error

**Solution:** Ensure frontend calculates price correctly (base + addons)

---

## Next Steps

Once backend is set up, proceed to:

1. **Frontend Development** - Build React components to consume these APIs
2. **Payment Integration** - Set up Stripe.js for payment processing
3. **QR Code Generation** - Configure QR code service for check-in
4. **Monitoring** - Set up logging and error tracking

See [API_ENDPOINTS.md](./API_ENDPOINTS.md) for frontend integration details.
