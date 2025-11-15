# L4yerCak3 Event-Driven API Documentation

## 📖 Complete Documentation

All documentation is in the `/docs` folder:

### Start Here
- **[docs/README.md](./docs/README.md)** - Overview and navigation
- **[docs/QUICK_REFERENCE.md](./docs/QUICK_REFERENCE.md)** - Quick reference card

### For Frontend Developers
1. **[docs/API_SPECIFICATION.md](./docs/API_SPECIFICATION.md)** - API endpoints and authentication
2. **[docs/UNIVERSAL_EVENT_PAYLOAD.md](./docs/UNIVERSAL_EVENT_PAYLOAD.md)** - Event data structure
3. **[docs/FRONTEND_INTEGRATION.md](./docs/FRONTEND_INTEGRATION.md)** - Code examples

### For Backend Developers
4. **[docs/BACKEND_REFERENCE.md](./docs/BACKEND_REFERENCE.md)** - Workflows and behaviors

## 🎯 Quick Example

```typescript
// Frontend sends event
const result = await fetch('https://api.l4yercak3.com/api/v1/workflows/trigger', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    trigger: 'registration_complete',
    inputData: {
      eventType: 'seminar_registration',
      source: 'haffnet_website',
      customerData: { ... },
      transactionData: { ... }
    }
  })
});

// Backend automatically:
// - Detects employer
// - Generates invoice
// - Creates ticket
// - Sends emails
// - Updates CRM
```

## 🚀 Key Benefit

**One API endpoint for everything.** Your frontends send events, the backend handles all the complex workflow logic.

**Read the docs to get started!** →  [docs/README.md](./docs/README.md)
