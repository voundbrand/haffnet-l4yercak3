# Frontend Implementation: Conference Feedback Survey Form

## 📋 Task Overview

Create a new survey form page that allows users to submit post-event feedback for HaffNet conferences. This form follows the same pattern as the existing event registration form but is optimized for survey responses with rating scales, matrix questions, and feedback collection.

---

## 🎯 Requirements

### Page Location
Create new file: `src/app/forms/[id]/page.tsx`

**Why `/forms/[id]` instead of `/surveys/[id]`?**
- Your web publishing application manages what forms are available
- This route works for ALL form types (surveys, contact forms, registration forms, etc.)
- Form type (survey vs registration) is determined by the backend schema
- Same pattern as `/events/[id]` - fetch content dynamically from CMS

### Form Schema Reference
- **Backend Schema**: `/Users/foundbrand_001/Development/vc83-com/src/templates/forms/conference-feedback-survey/schema.ts`
- **HTML Reference**: `/Users/foundbrand_001/Development/vc83-com/.kiro/haffnet_forms_netigate/conference-feedback-survey.html`
- **Existing Pattern**: `/Users/foundbrand_001/Development/haffnet-l4yercak3/src/app/events/[id]/register/page.tsx`
- **CMS Integration**: Fetch form configuration from web publishing API (like events/products)

---

## 🏗️ Implementation Pattern

### Dynamic Form Renderer (Web Publishing Integration)

This page renders ANY form type dynamically based on the schema from your backend:

```typescript
'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formApi } from '@/lib/api-client'; // NEW: Add forms API client
import { useFrontendAuth } from '@/hooks/useFrontendAuth';
import type { FormSchema } from '@/types/forms'; // Import form schema types

const ORG_SLUG = 'voundbrand';

interface FormPageProps {
  params: Promise<{ id: string }>;
}

export default function FormPage({ params }: FormPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { isAuthenticated, user } = useFrontendAuth();

  const [form, setForm] = useState<FormSchema | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dynamic form data based on schema
  const [formData, setFormData] = useState<Record<string, unknown>>({});

  // Load form configuration from web publishing API
  useEffect(() => {
    async function loadForm() {
      try {
        // Fetch form from web publishing (like events/products)
        const formRes = await formApi.getForm(id);
        setForm(formRes);

        // Initialize form data with default values from schema
        const initialData: Record<string, unknown> = {};
        formRes.sections.forEach(section => {
          section.fields.forEach(field => {
            if (field.type === 'checkbox') {
              initialData[field.id] = [];
            } else if (field.type === 'rating') {
              initialData[field.id] = field.metadata?.type === 'nps' ? -1 : 0;
            } else {
              initialData[field.id] = field.defaultValue || '';
            }
          });
        });
        setFormData(initialData);
      } catch (err) {
        setError('Fehler beim Laden des Formulars');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadForm();
  }, [id]);

  // ... rest of implementation
}
```

### Key Differences from Event Registration

1. **Dynamic Schema**: Form fields are generated from backend schema
2. **Web Publishing**: Form availability managed via CMS
3. **Generic Route**: `/forms/[id]` works for all form types
4. **No Product Selection**: Forms don't have products/pricing (unless it's a registration form)
5. **Submission**: Use workflow trigger API with form-specific trigger

---

## 📊 Form State Structure

### Required State Variables

```typescript
const [formData, setFormData] = useState({
  // Section 1: Overall Satisfaction
  overall_satisfaction: 0, // 1-5 rating
  nps_score: -1, // 0-10 rating (-1 = not selected)

  // Section 2: Content Feedback (Matrix Questions)
  content_presentations: 0, // 1-5
  content_relevance: 0, // 1-5
  content_speakers: 0, // 1-5
  content_timing: 0, // 1-5
  content_highlights: '', // textarea
  content_improvements: '', // textarea

  // Section 3: Organization Feedback (Matrix Questions)
  org_registration: 0, // 1-5
  org_communication: 0, // 1-5
  org_checkin: 0, // 1-5
  org_staff: 0, // 1-5

  // Section 4: Venue Feedback (Matrix Questions)
  venue_location: 0, // 1-5
  venue_facilities: 0, // 1-5
  venue_catering: 0, // 1-5
  venue_networking: 0, // 1-5
  venue_comments: '', // textarea

  // Section 5: Future Topics
  future_topics: [] as string[], // Multi-select checkbox
  future_suggestions: '', // textarea
  would_return: '', // radio: yes/maybe/no

  // Section 6: Additional Feedback
  additional_comments: '', // textarea

  // Section 7: Optional Contact (all optional)
  contact_name: '',
  contact_email: '',
  contact_organization: '',
});
```

---

## 🎨 UI Components to Implement

### 1. **NPS Rating Scale (0-10)**

```tsx
{/* NPS Score Component */}
<div className="bg-white rounded-lg shadow-md p-6">
  <h2 className="text-xl font-bold text-gray-900 mb-4">
    Weiterempfehlung
  </h2>

  <label className="block text-sm font-medium text-gray-700 mb-2">
    Würden Sie diese Veranstaltung weiterempfehlen? *
  </label>

  <div className="flex justify-between text-xs text-gray-600 mb-2">
    <span>0 = Überhaupt nicht wahrscheinlich</span>
    <span>10 = Äußerst wahrscheinlich</span>
  </div>

  <div className="grid grid-cols-11 gap-2">
    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
      <button
        key={value}
        type="button"
        onClick={() => setFormData({ ...formData, nps_score: value })}
        className={`
          h-12 rounded-lg font-semibold text-sm transition-all
          ${formData.nps_score === value
            ? 'bg-green-600 text-white ring-2 ring-green-600 ring-offset-2'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }
        `}
      >
        {value}
      </button>
    ))}
  </div>
</div>
```

### 2. **5-Point Rating Scale (Stars or Buttons)**

```tsx
{/* 5-Point Rating Component */}
<div className="flex items-center gap-2">
  <span className="text-sm text-gray-700 w-48">Qualität der Vorträge</span>
  <div className="flex gap-2">
    {[1, 2, 3, 4, 5].map((value) => (
      <button
        key={value}
        type="button"
        onClick={() => setFormData({ ...formData, content_presentations: value })}
        className={`
          w-10 h-10 rounded-full font-semibold text-sm transition-all
          ${formData.content_presentations === value
            ? 'bg-green-600 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }
        `}
      >
        {value}
      </button>
    ))}
  </div>
  <span className="text-xs text-gray-500">
    {formData.content_presentations === 1 && '(Sehr schlecht)'}
    {formData.content_presentations === 5 && '(Sehr gut)'}
  </span>
</div>
```

### 3. **Matrix Questions Table**

```tsx
{/* Matrix Table Component */}
<div className="bg-white rounded-lg shadow-md p-6">
  <h2 className="text-xl font-bold text-gray-900 mb-4">
    Inhalte und Programm
  </h2>

  <p className="text-sm text-gray-600 mb-4">
    Bitte bewerten Sie die folgenden Aspekte *
  </p>

  <div className="overflow-x-auto">
    <table className="w-full">
      <thead>
        <tr className="border-b">
          <th className="text-left py-2 px-2 text-sm font-semibold">Aspekt</th>
          <th className="text-center py-2 px-2 text-xs">1<br/>Sehr schlecht</th>
          <th className="text-center py-2 px-2 text-xs">2</th>
          <th className="text-center py-2 px-2 text-xs">3</th>
          <th className="text-center py-2 px-2 text-xs">4</th>
          <th className="text-center py-2 px-2 text-xs">5<br/>Sehr gut</th>
        </tr>
      </thead>
      <tbody>
        {[
          { key: 'content_presentations', label: 'Qualität der Vorträge' },
          { key: 'content_relevance', label: 'Relevanz der Themen' },
          { key: 'content_speakers', label: 'Kompetenz der Referenten' },
          { key: 'content_timing', label: 'Zeitplanung/Takt' },
        ].map((item) => (
          <tr key={item.key} className="border-b hover:bg-gray-50">
            <td className="py-3 px-2 text-sm">{item.label}</td>
            {[1, 2, 3, 4, 5].map((value) => (
              <td key={value} className="text-center py-3 px-2">
                <input
                  type="radio"
                  name={item.key}
                  value={value}
                  checked={formData[item.key as keyof typeof formData] === value}
                  onChange={() => setFormData({ ...formData, [item.key]: value })}
                  className="w-5 h-5 accent-green-600 cursor-pointer"
                  required
                />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>
```

### 4. **Multi-Select Checkboxes**

```tsx
{/* Future Topics Multi-Select */}
<div className="bg-white rounded-lg shadow-md p-6">
  <h2 className="text-xl font-bold text-gray-900 mb-4">
    Zukünftige Themen
  </h2>

  <label className="block text-sm font-medium text-gray-700 mb-3">
    Welche Themen würden Sie sich wünschen? (Mehrfachauswahl)
  </label>

  <div className="space-y-2">
    {[
      { value: 'sportmedizin', label: 'Sportmedizin und Leistungsdiagnostik' },
      { value: 'rehabilitation', label: 'Rehabilitation und Prävention' },
      { value: 'digitalisierung', label: 'Digitalisierung im Gesundheitswesen' },
      { value: 'networking', label: 'Networking und Erfahrungsaustausch' },
      { value: 'workshops', label: 'Praktische Workshops' },
      { value: 'forschung', label: 'Aktuelle Forschungsergebnisse' },
    ].map((topic) => (
      <label key={topic.value} className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
        <input
          type="checkbox"
          checked={formData.future_topics.includes(topic.value)}
          onChange={(e) => {
            const newTopics = e.target.checked
              ? [...formData.future_topics, topic.value]
              : formData.future_topics.filter((t) => t !== topic.value);
            setFormData({ ...formData, future_topics: newTopics });
          }}
          className="mr-3 w-5 h-5 accent-green-600 cursor-pointer"
        />
        <span className="text-sm text-gray-700">{topic.label}</span>
      </label>
    ))}
  </div>
</div>
```

---

## 🔌 API Integration

### Add Forms API to `src/lib/api-client.ts`

```typescript
export const formApi = {
  /**
   * Get form details by ID from web publishing
   * This fetches the form schema and configuration
   * (Similar to eventApi.getEvent)
   */
  async getForm(formId: string) {
    const response = await fetch(`${API_BASE_URL}/forms/${formId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch form');
    }

    return response.json() as Promise<{
      id: string;
      name: string;
      description?: string;
      type: string; // 'form'
      subtype: string; // 'survey', 'registration', 'contact', etc.
      formSchema: FormSchema; // The actual form structure
      settings: {
        requireAuth: boolean;
        allowAnonymous: boolean;
        showProgressBar: boolean;
      };
    }>;
  },

  /**
   * Get published forms from web publishing
   * (Similar to eventApi.getEvents)
   */
  async getPublishedForms() {
    const response = await fetch(`${API_BASE_URL}/forms`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch forms');
    }

    return response.json();
  },

  /**
   * Submit form response
   * Uses the same workflow trigger API as registration
   */
  async submitForm(data: {
    formId: string;
    formType: string; // 'survey', 'contact', 'registration'
    responses: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  }) {
    // Determine workflow trigger based on form type
    const triggerMap: Record<string, string> = {
      'survey': 'survey_submission',
      'contact': 'contact_form_submission',
      'registration': 'form_submission',
    };

    const trigger = triggerMap[data.formType] || 'form_submission';

    const response = await fetch(`${API_BASE_URL}/workflows/trigger`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        trigger,
        inputData: {
          formId: data.formId,
          formResponses: data.responses,
          metadata: {
            ...data.metadata,
            submittedAt: new Date().toISOString(),
            source: 'website',
          },
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Form submission failed');
    }

    return response.json();
  },
};
```

### Backend API Endpoints Needed

Your backend team needs to expose these endpoints in the web publishing API:

1. **GET `/api/forms`** - List all published forms
2. **GET `/api/forms/[id]`** - Get specific form with schema
3. **POST `/api/workflows/trigger`** - Submit form (already exists!)

These should follow the same pattern as `/api/events`.

---

## ✅ Validation Rules

### Required Fields

All matrix questions (ratings) are **required**:
- `overall_satisfaction` (1-5)
- `nps_score` (0-10)
- All content ratings (4 fields)
- All organization ratings (4 fields)
- All venue ratings (4 fields)
- `would_return` (radio)

### Optional Fields

- All text areas
- Multi-select checkboxes
- Contact information

### Validation Example

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  // Validate required ratings
  const requiredRatings = [
    'overall_satisfaction',
    'content_presentations',
    'content_relevance',
    'content_speakers',
    'content_timing',
    'org_registration',
    'org_communication',
    'org_checkin',
    'org_staff',
    'venue_location',
    'venue_facilities',
    'venue_catering',
    'venue_networking',
  ];

  for (const field of requiredRatings) {
    if (formData[field as keyof typeof formData] === 0) {
      setError(`Bitte bewerten Sie: ${field}`);
      return;
    }
  }

  if (formData.nps_score === -1) {
    setError('Bitte geben Sie eine Weiterempfehlungsbewertung ab');
    return;
  }

  if (!formData.would_return) {
    setError('Bitte beantworten Sie die Frage zur erneuten Teilnahme');
    return;
  }

  setSubmitting(true);

  try {
    const response = await formApi.submitForm({
      formId: id,
      formType: form.subtype, // 'survey', 'contact', etc.
      responses: formData,
      metadata: {
        source: 'website',
        userAgent: navigator.userAgent,
      },
    });

    // Redirect to thank you page
    router.push(`/forms/${id}/danke`);
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Fehler beim Absenden');
  } finally {
    setSubmitting(false);
  }
};
```

---

## 🎨 Styling Guidelines

### Use Tailwind Classes from Registration Form

- **Primary color**: `green-600` for buttons and accents
- **Sections**: `bg-white rounded-lg shadow-md p-6`
- **Headers**: `text-xl font-bold text-gray-900 mb-4`
- **Inputs**: Focus ring with `focus:ring-2 focus:ring-green-600`
- **Buttons**: Same gradient pattern as registration

### Responsive Design

```css
/* Mobile: Stack everything */
<div className="grid grid-cols-1 gap-4">

/* Desktop: Side-by-side for ratings */
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">

/* Matrix tables: Horizontal scroll on mobile */
<div className="overflow-x-auto">
```

---

## 🧪 Testing Checklist

- [ ] All required fields validated before submission
- [ ] NPS scale (0-10) works correctly
- [ ] 5-point rating scales work in matrix tables
- [ ] Multi-select checkboxes allow multiple selections
- [ ] Radio buttons for "would return" work
- [ ] Text areas save content
- [ ] Optional contact fields can be left empty
- [ ] Form submits successfully
- [ ] Error messages display correctly
- [ ] Loading state shows during submission
- [ ] Success redirect works
- [ ] Mobile responsive (especially matrix tables)
- [ ] Accessibility: keyboard navigation works

---

## 📦 Deliverables

1. **New page**: `src/app/forms/[id]/page.tsx` (dynamic form renderer)
2. **API client update**: Add `formApi` to `src/lib/api-client.ts`
3. **Thank you page**: `src/app/forms/[id]/danke/page.tsx` (simple confirmation)
4. **Type definitions**: Add `FormSchema` type if needed
5. **Forms listing** (optional): `src/app/forms/page.tsx` (list all published forms)

### Architecture Benefits

- ✅ **Web Publishing Integration**: Forms managed via CMS like events/products
- ✅ **Dynamic Rendering**: One component renders all form types
- ✅ **Scalable**: Add new form types without new routes
- ✅ **Consistent**: Same pattern as `/events/[id]` and `/products/[id]`

---

## 🔗 Reference Links

- **Backend Schema**: `src/templates/forms/conference-feedback-survey/schema.ts`
- **HTML Mockup**: `.kiro/haffnet_forms_netigate/conference-feedback-survey.html`
- **Existing Pattern**: `/Users/foundbrand_001/Development/haffnet-l4yercak3/src/app/events/[id]/register/page.tsx`
- **API Docs**: Backend API endpoint `/api/v1/workflows/trigger`

---

## 📝 Notes for Frontend Team

1. **Authentication**: Survey can be submitted anonymously (no auth required)
2. **Progressive disclosure**: Contact info section is clearly marked as optional
3. **Visual feedback**: Highlight selected ratings clearly (green backgrounds)
4. **Mobile-first**: Matrix tables need horizontal scroll on mobile
5. **Accessibility**: Use proper aria-labels for rating buttons
6. **Error handling**: Show field-specific errors near the field
7. **Loading states**: Disable submit button during submission

---

## 🚀 Priority

**High Priority** - This is needed for post-event feedback collection.

**Estimated Time**: 6-8 hours for experienced React developer

---

## ❓ Questions?

Contact backend team for:
- API endpoint clarification
- Survey ID format
- Response data structure
- Error handling specifics

---

**Good luck! 🎉**

---

## 🏢 Web Publishing Integration

### How Forms Work in Your Architecture

```
┌─────────────────────────────────────────────────┐
│  Backend (Convex)                                │
│  ├── Form Templates (System)                     │
│  │   └── conference-feedback-survey ✅          │
│  ├── Form Instances (Per Organization)          │
│  │   └── Created from templates                 │
│  └── Web Publishing                              │
│      └── Publishes forms to frontend            │
└─────────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────┐
│  Frontend API (/api/forms)                       │
│  ├── GET /forms → List published forms          │
│  └── GET /forms/[id] → Get form with schema     │
└─────────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────┐
│  Frontend Page (/forms/[id])                     │
│  ├── Fetches form schema dynamically            │
│  ├── Renders fields based on schema             │
│  └── Submits via workflow trigger               │
└─────────────────────────────────────────────────┘
```

### Example: Publishing a Survey

**Backend (Super Admin)**:
1. Enable template for organization:
   ```typescript
   await enableFormTemplate({
     organizationId: "org_123",
     templateCode: "conference-feedback-survey"
   });
   ```

2. Create form instance:
   ```typescript
   await createFormFromTemplate({
     templateId: "conference-feedback-survey",
     name: "HaffNet 2025 Feedback",
     customization: { ... }
   });
   ```

3. Publish via web publishing:
   ```typescript
   await publishForm({
     formId: "form_xyz",
     publishToFrontend: true
   });
   ```

**Frontend (User)**:
1. Visit `/forms` → See list of published forms
2. Click "HaffNet 2025 Feedback"
3. Redirected to `/forms/form_xyz`
4. Form schema loaded from backend
5. User fills out and submits
6. Redirected to `/forms/form_xyz/danke`

### Same Pattern as Events

This follows the EXACT same pattern as your events:

| Events | Forms |
|--------|-------|
| `/events` | `/forms` |
| `/events/[id]` | `/forms/[id]` |
| `/events/[id]/register` | `/forms/[id]` (already the form) |
| Backend manages event publishing | Backend manages form publishing |

---

## 🎨 Dynamic Form Field Renderer

Since forms are now dynamic, you'll need a field renderer:

```typescript
// components/FormFieldRenderer.tsx
export function FormFieldRenderer({
  field,
  value,
  onChange,
}: {
  field: FormField;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  switch (field.type) {
    case 'text':
    case 'email':
      return (
        <input
          type={field.type}
          value={value as string}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          required={field.required}
          className="w-full border border-gray-300 rounded-md px-3 py-2"
        />
      );

    case 'textarea':
      return (
        <textarea
          value={value as string}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          required={field.required}
          rows={3}
          className="w-full border border-gray-300 rounded-md px-3 py-2"
        />
      );

    case 'rating':
      const isNPS = field.metadata?.type === 'nps';
      const maxRating = isNPS ? 10 : 5;
      return (
        <div className={`grid gap-2 ${isNPS ? 'grid-cols-11' : 'grid-cols-5'}`}>
          {Array.from({ length: maxRating + 1 }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onChange(i)}
              className={`h-12 rounded-lg font-semibold ${
                value === i
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {i}
            </button>
          ))}
        </div>
      );

    case 'radio':
      return (
        <div className="space-y-2">
          {field.options?.map((option) => (
            <label key={option.value} className="flex items-center cursor-pointer p-2 hover:bg-gray-50 rounded">
              <input
                type="radio"
                name={field.id}
                value={option.value}
                checked={value === option.value}
                onChange={(e) => onChange(e.target.value)}
                required={field.required}
                className="mr-3 w-5 h-5 accent-green-600"
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      );

    case 'checkbox':
      return (
        <div className="space-y-2">
          {field.options?.map((option) => (
            <label key={option.value} className="flex items-center cursor-pointer p-2 hover:bg-gray-50 rounded">
              <input
                type="checkbox"
                checked={(value as string[]).includes(option.value)}
                onChange={(e) => {
                  const arr = value as string[];
                  const newValue = e.target.checked
                    ? [...arr, option.value]
                    : arr.filter((v) => v !== option.value);
                  onChange(newValue);
                }}
                className="mr-3 w-5 h-5 accent-green-600"
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      );

    case 'select':
      return (
        <select
          value={value as string}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
          className="w-full border border-gray-300 rounded-md px-3 py-2"
        >
          <option value="">Bitte wählen</option>
          {field.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );

    default:
      return <div>Unsupported field type: {field.type}</div>;
  }
}
```

Then use it in your form:

```typescript
{form.sections.map((section) => (
  <div key={section.id} className="bg-white rounded-lg shadow-md p-6">
    <h2 className="text-xl font-bold text-gray-900 mb-4">
      {section.title}
    </h2>
    {section.description && (
      <p className="text-sm text-gray-600 mb-4">{section.description}</p>
    )}
    
    {section.fields.map((field) => (
      <div key={field.id} className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {field.label}
          {field.required && ' *'}
        </label>
        {field.helpText && (
          <p className="text-xs text-gray-500 mb-2">{field.helpText}</p>
        )}
        <FormFieldRenderer
          field={field}
          value={formData[field.id]}
          onChange={(value) => 
            setFormData({ ...formData, [field.id]: value })
          }
        />
      </div>
    ))}
  </div>
))}
```

---

## 🚀 Benefits of This Architecture

1. **Scalability**: Add new form types without code changes
2. **CMS Control**: Non-technical users can publish/unpublish forms
3. **Reusability**: Same component for surveys, contact forms, registrations
4. **Consistency**: Same pattern as events and products
5. **Flexibility**: Form fields controlled by backend schema

