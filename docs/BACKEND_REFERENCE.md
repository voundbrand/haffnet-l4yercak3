# Backend Reference - Workflows & Behaviors

## Overview

Your L4yerCak3 backend uses an **event-driven workflow system**. When the API receives an event, it:

1. Finds workflows matching the `trigger`
2. Executes configured behaviors in priority order
3. Returns results to frontend

---

## Workflow Structure

Workflows are stored as `objects` with `type: "workflow"`:

```typescript
{
  _id: "workflow_id",
  type: "workflow",
  subtype: "seminar-registration",
  organizationId: "org_haffnet",
  name: "CME Seminar Registration",
  status: "active",

  customProperties: {
    // Objects this workflow operates on
    objects: [
      {
        objectId: "prod_seminare",
        objectType: "product",
        role: "primary"
      }
    ],

    // Behaviors to execute
    behaviors: [
      {
        id: "bhv_123",
        type: "employer-detection",
        enabled: true,
        priority: 100,
        config: {
          hospitalDomains: ["charite.de", "uniklinik-*.de"]
        }
      },
      {
        id: "bhv_456",
        type: "invoice-mapping",
        enabled: true,
        priority: 90,
        config: {
          invoiceToEmployer: true
        }
      },
      {
        id: "bhv_789",
        type: "consolidated-invoice-generation",
        enabled: true,
        priority: 80,
        config: {
          templateId: "cme_invoice"
        }
      }
    ],

    // Execution settings
    execution: {
      triggerOn: "registration_complete",
      requiredInputs: ["customerData", "transactionData"],
      errorHandling: "rollback"
    }
  }
}
```

---

## Available Behaviors

### 1. `employer-detection`

**Purpose**: Detect if customer works at a hospital/employer

**Config**:
```typescript
{
  hospitalDomains: string[];        // e.g., ["charite.de", "uniklinik-*.de"]
  requiredFields: string[];         // e.g., ["organization", "email"]
}
```

**Input**: `customerData.email`, `customerData.organization`

**Output**:
```typescript
{
  success: true,
  data: {
    employerDetected: boolean,
    employerId: string,           // CRM organization ID
    employerName: string
  }
}
```

---

### 2. `invoice-mapping`

**Purpose**: Determine who should receive the invoice (employer vs. individual)

**Config**:
```typescript
{
  invoiceToEmployer: boolean;
  invoiceToIndividual: boolean;
}
```

**Depends on**: `employer-detection` results

**Output**:
```typescript
{
  success: true,
  data: {
    invoiceTo: "employer" | "individual",
    invoiceRecipient: string      // Organization ID or contact ID
  }
}
```

---

### 3. `consolidated-invoice-generation`

**Purpose**: Generate PDF invoice

**Config**:
```typescript
{
  templateId: string;               // Invoice template ID
  includeAddons: boolean;
  includeTax: boolean;
  taxRate: number;
}
```

**Input**: `transactionData`, `customerData`, invoice mapping results

**Output**:
```typescript
{
  success: true,
  data: {
    invoiceId: string,
    invoiceNumber: string,
    total: number,
    pdfUrl: string
  }
}
```

---

### 4. `ticket-generation`

**Purpose**: Create attendee ticket with QR code

**Config**:
```typescript
{
  templateId: string;
  deliveryMethod: "email" | "sms" | "download";
  includeQRCode: boolean;
}
```

**Output**:
```typescript
{
  success: true,
  data: {
    ticketId: string,
    ticketNumber: string,
    qrCode: string                // URL to QR code image
  }
}
```

---

### 5. `email-notification`

**Purpose**: Send confirmation/notification emails

**Config**:
```typescript
{
  template: string;                // Email template ID
  recipients: string[];            // ["customer", "admin", "employer"]
  cc: string[];
  bcc: string[];
}
```

**Output**:
```typescript
{
  success: true,
  data: {
    emailsSent: string[]           // Email addresses sent to
  }
}
```

---

### 6. `contact-creation`

**Purpose**: Create/update contact in CRM

**Config**:
```typescript
{
  updateIfExists: boolean;
  requiredFields: string[];
}
```

**Output**:
```typescript
{
  success: true,
  data: {
    contactId: string,
    isNew: boolean
  }
}
```

---

## Creating Workflows (Backend)

### Option 1: Through Admin UI

1. Login to l4yercak3 admin
2. Go to Workflows
3. Click "Create Workflow"
4. Configure:
   - Name and trigger
   - Add objects (products, forms, etc.)
   - Add behaviors with config
   - Set execution settings
5. Activate

### Option 2: Programmatically

```typescript
import { api } from '../convex/_generated/api';

await convex.mutation(api.workflows.workflowOntology.createWorkflow, {
  sessionId,
  organizationId,
  workflow: {
    name: "HaffNet Seminar Registration",
    subtype: "seminar-registration",
    status: "active",

    objects: [
      {
        objectId: productId,
        objectType: "product",
        role: "primary"
      }
    ],

    behaviors: [
      {
        type: "employer-detection",
        enabled: true,
        priority: 100,
        config: {
          hospitalDomains: ["charite.de"]
        }
      },
      // ... more behaviors
    ],

    execution: {
      triggerOn: "registration_complete",
      requiredInputs: ["customerData"],
      errorHandling: "rollback"
    }
  }
});
```

---

## Behavior Execution Flow

```
API receives event
    ↓
Find workflow (triggerOn = event.trigger)
    ↓
Sort behaviors by priority (highest first)
    ↓
Execute behavior 1
    ↓
Execute behavior 2 (can access behavior 1 results)
    ↓
Execute behavior 3 (can access all previous results)
    ↓
Return aggregated results
```

### Behavior Context

Each behavior receives:

```typescript
{
  sessionId: string,
  organizationId: string,
  behaviorType: string,
  config: object,               // From workflow config
  context: {
    customerData: object,
    formResponses: object,
    transactionData: object,
    metadata: object,
    behaviorData: {             // Results from previous behaviors
      "employer-detection": { ... },
      "invoice-mapping": { ... }
    }
  }
}
```

---

## Adding Custom Behaviors

### Step 1: Create Behavior Action

`convex/workflows/behaviors/myBehavior.ts`:

```typescript
import { action } from "../../_generated/server";
import { v } from "convex/values";

export const executeMyBehavior = action({
  args: {
    sessionId: v.string(),
    organizationId: v.id("organizations"),
    config: v.any(),
  },
  handler: async (ctx, args) => {
    // Your logic here
    const result = await doSomething(args.config);

    return {
      success: true,
      message: "Behavior executed successfully",
      data: result
    };
  }
});
```

### Step 2: Register in Behavior Executor

`convex/workflows/behaviorExecutor.ts`:

```typescript
case "my-custom-behavior":
  return await ctx.runAction(
    api.workflows.behaviors.myBehavior.executeMyBehavior,
    {
      sessionId: args.sessionId,
      organizationId: args.organizationId,
      config: args.config,
    }
  );
```

### Step 3: Use in Workflow

```typescript
{
  type: "my-custom-behavior",
  enabled: true,
  priority: 75,
  config: {
    customSetting: "value"
  }
}
```

---

## Testing Workflows

### Manual Test (Admin UI)

1. Go to Workflows
2. Select workflow
3. Click "Test Workflow"
4. Provide test data
5. View execution results

### Programmatic Test

```typescript
import { api } from '../convex/_generated/api';

const result = await convex.action(api.workflows.workflowOntology.executeWorkflow, {
  sessionId,
  workflowId,
  manualTrigger: true,
  contextData: {
    customerData: {
      email: "test@example.com",
      organization: "Charité Berlin"
    },
    transactionData: {
      productId: "prod_test",
      price: 599
    }
  }
});

console.log('Workflow result:', result);
console.log('Behavior results:', result.behaviorResults);
```

---

## Workflow Execution Logging

Every workflow execution is logged to `workflowExecutionLogs`:

```typescript
{
  _id: "log_123",
  workflowId: "workflow_456",
  workflowName: "Seminar Registration",
  status: "success",
  startedAt: 1699000000000,
  completedAt: 1699000005000,
  logs: [
    { level: "info", message: "Starting execution", timestamp: 1699000000000 },
    { level: "success", message: "Behavior employer-detection completed", timestamp: 1699000001000 },
    { level: "success", message: "Behavior invoice-mapping completed", timestamp: 1699000002000 }
  ],
  result: {
    success: true,
    executedCount: 5,
    totalCount: 5
  }
}
```

View logs in admin UI: Workflows → [Workflow Name] → Execution History

---

## Error Handling

### Error Handling Strategies

1. **Rollback**: Stop on first error, don't save any changes
2. **Continue**: Execute all behaviors even if some fail
3. **Notify**: Continue but send error notifications

Set in workflow config:

```typescript
execution: {
  errorHandling: "rollback"  // or "continue" or "notify"
}
```

### Behavior Error Response

```typescript
{
  success: false,
  error: "Error message",
  message: "User-friendly description"
}
```

---

## Best Practices

1. **Priority Order**: Higher priority behaviors execute first (100, 90, 80...)
2. **Dependency Chain**: Behaviors can use results from previous behaviors via `context.behaviorData`
3. **Idempotent Behaviors**: Design behaviors to be safely re-executable
4. **Config Validation**: Validate behavior config in the behavior handler
5. **Error Messages**: Return clear, actionable error messages
6. **Logging**: Use console.log for debugging (visible in execution logs)
7. **Testing**: Test behaviors individually before adding to workflow

---

## Example: Complete Workflow

```typescript
{
  name: "HaffNet Seminar Registration",
  subtype: "seminar-registration",
  status: "active",

  execution: {
    triggerOn: "registration_complete",
    requiredInputs: ["customerData", "transactionData"],
    errorHandling: "rollback"
  },

  behaviors: [
    // 1. Detect employer (priority 100)
    {
      type: "employer-detection",
      enabled: true,
      priority: 100,
      config: {
        hospitalDomains: ["charite.de", "uniklinik-*.de"],
        requiredFields: ["organization", "email"]
      }
    },

    // 2. Map invoice recipient (priority 90)
    {
      type: "invoice-mapping",
      enabled: true,
      priority: 90,
      config: {
        invoiceToEmployer: true
      }
    },

    // 3. Generate invoice (priority 80)
    {
      type: "consolidated-invoice-generation",
      enabled: true,
      priority: 80,
      config: {
        templateId: "cme_invoice_template",
        includeTax: true,
        taxRate: 0.19
      }
    },

    // 4. Generate ticket (priority 70)
    {
      type: "ticket-generation",
      enabled: true,
      priority: 70,
      config: {
        templateId: "cme_ticket_template",
        deliveryMethod: "email",
        includeQRCode: true
      }
    },

    // 5. Send emails (priority 60)
    {
      type: "email-notification",
      enabled: true,
      priority: 60,
      config: {
        template: "registration_confirmation",
        recipients: ["customer", "admin"]
      }
    },

    // 6. Create/update contact (priority 50)
    {
      type: "contact-creation",
      enabled: true,
      priority: 50,
      config: {
        updateIfExists: true,
        requiredFields: ["email", "firstName", "lastName"]
      }
    }
  ]
}
```

---

## Next Steps

- See `API_SPECIFICATION.md` for API endpoint details
- See `UNIVERSAL_EVENT_PAYLOAD.md` for event structure
- See `FRONTEND_INTEGRATION.md` for frontend examples
