# HaffNet Forms - Netigate Survey Imports

This directory contains HTML boilerplate files extracted from Netigate surveys for conversion into vc83-com form templates.

## Created Templates

### 1. Conference Feedback Survey ✅
- **File**: `conference-feedback-survey.html`
- **Template Code**: `conference-feedback-survey`
- **Schema**: `src/templates/forms/conference-feedback-survey/schema.ts`
- **Status**: ✅ Seeded to database
- **Category**: `survey`
- **Features**:
  - NPS Score (0-10 rating)
  - Overall satisfaction rating (1-5)
  - Matrix questions for content/organization/venue evaluation
  - Multi-select future topic preferences
  - Open-ended feedback fields
  - Optional contact information

## How to Add New Survey Templates

1. **Get the Survey URL** from Netigate (e.g., `https://netigate.se/ra/s.aspx?s=...`)

2. **Create HTML Boilerplate** in this directory:
   ```
   touch conference-name-survey.html
   ```

3. **Extract Survey Structure** manually or via browser inspector

4. **Create Form Schema**:
   ```bash
   mkdir -p src/templates/forms/[template-code]
   touch src/templates/forms/[template-code]/schema.ts
   ```

5. **Update Seed File** (`convex/seedFormTemplates.ts`):
   - Import the schema
   - Add template definition to the array

6. **Run Seed Command**:
   ```bash
   npx convex run seedFormTemplates:seedFormTemplates
   ```

7. **Enable for Organizations** (as super admin):
   - Use `enableFormTemplate` mutation
   - Or via super admin UI

## Template Structure

Each survey template should have:
- **HTML boilerplate** (for reference)
- **TypeScript schema** (actual implementation)
- **Template metadata** (in seed file)

## Categories

Form templates support these categories:
- `event` - Event registration forms
- `survey` - Post-event surveys and feedback forms
- `general` - General purpose forms
- `contact` - Contact forms

## Field Types Supported

All standard form field types:
- `text`, `textarea`, `email`, `phone`, `number`
- `select`, `radio`, `checkbox`, `multi_select`
- `date`, `time`, `datetime`
- `rating` (1-5 or 0-10 NPS)
- `file`

## Super Admin Functions

Available via Convex mutations:
- `formTemplateAvailability.enableFormTemplate` - Enable template for org
- `formTemplateAvailability.disableFormTemplate` - Disable template for org
- `formTemplateAvailability.getAllSystemFormTemplates` - List all templates
- `formTemplateAvailability.getAvailableFormTemplates` - Get org's templates
