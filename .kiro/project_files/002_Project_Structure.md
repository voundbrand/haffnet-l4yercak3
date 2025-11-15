# HaffNet L4yerCak3 - Project Structure Guide

## ✅ Correct Next.js 16 Project Structure

Your project is now correctly structured with `/src` folder configuration:

```
haffnet-l4yercak3/
├── .next/                    # Build output (auto-generated)
├── node_modules/             # Dependencies
├── public/                   # ✅ Static assets (at root level, NOT in src/)
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
├── src/                      # ✅ Source code (with app directory inside)
│   ├── app/                  # Next.js App Router
│   │   ├── layout.tsx        # Root layout
│   │   ├── page.tsx          # Home page (/)
│   │   ├── globals.css       # Global styles
│   │   ├── seminare/         # Seminars catalog (/seminare)
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       ├── page.tsx  # Detail page (/seminare/[id])
│   │   │       └── anmelden/
│   │   │           └── page.tsx  # Registration (/seminare/[id]/anmelden)
│   │   └── bestaetigung/     # Confirmation page (/bestaetigung)
│   │       └── page.tsx
│   ├── components/           # React components
│   │   ├── courses/
│   │   │   ├── CourseCard.tsx
│   │   │   └── RegistrationForm.tsx
│   │   └── ui/              # shadcn/ui components
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── badge.tsx
│   │       └── ...
│   └── lib/                 # Utilities and libraries
│       ├── utils.ts
│       ├── validations/
│       │   └── registration.ts
│       └── vc83-api/       # API client
│           ├── index.ts
│           ├── types.ts
│           └── client.ts
├── .env.local              # Environment variables (not in git)
├── .env.example            # Template for environment setup
├── components.json         # shadcn/ui configuration
├── next.config.ts          # Next.js configuration
├── tsconfig.json          # TypeScript configuration
├── tailwind.config.ts     # Tailwind CSS configuration (if exists)
├── postcss.config.mjs     # PostCSS configuration
└── package.json           # Project dependencies
```

---

## 📁 Key Folder Locations

### ✅ Correct Locations:

1. **`public/` folder**: At ROOT level (not in src/)
   - Static assets served from root URL path
   - Examples: `/next.svg`, `/favicon.ico`

2. **`src/app/` folder**: Inside src/ directory
   - All pages, layouts, and route handlers
   - Next.js App Router structure

3. **`src/components/` folder**: Inside src/ directory
   - Reusable React components
   - shadcn/ui components in `src/components/ui/`

4. **`src/lib/` folder**: Inside src/ directory
   - Utility functions
   - API clients
   - Validation schemas

---

## 🚨 Common Mistakes to Avoid

### ❌ WRONG:
```
haffnet-l4yercak3/
├── src/
│   ├── public/          # ❌ WRONG! Public should be at root
│   └── app/
```

### ✅ CORRECT:
```
haffnet-l4yercak3/
├── public/              # ✅ Correct at root level
└── src/
    └── app/
```

---

## 🔧 Next.js Configuration

Your `next.config.ts` doesn't need special configuration for the `/src` folder - Next.js automatically detects it:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,  // React 19 compiler enabled
};

export default nextConfig;
```

Next.js automatically looks for:
1. `app/` directory at root level, OR
2. `src/app/` directory (your current setup ✅)

---

## 🛣️ Route Structure

With your current setup, routes map as follows:

| File Path | URL Route |
|-----------|-----------|
| `src/app/page.tsx` | `/` (home) |
| `src/app/seminare/page.tsx` | `/seminare` |
| `src/app/seminare/[id]/page.tsx` | `/seminare/123` |
| `src/app/seminare/[id]/anmelden/page.tsx` | `/seminare/123/anmelden` |
| `src/app/bestaetigung/page.tsx` | `/bestaetigung` |

---

## 📦 Public Assets

Files in `public/` are served from the root URL:

```typescript
// ✅ Correct way to reference public assets
<Image src="/logo.png" />        // Points to public/logo.png
<link rel="icon" href="/favicon.ico" />  // Points to public/favicon.ico
```

```typescript
// ❌ WRONG - don't include /public/ in the path
<Image src="/public/logo.png" />  // ❌ This won't work!
```

---

## 🎯 Import Aliases

Your `tsconfig.json` defines path aliases:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

This allows you to import like:

```typescript
// ✅ Using alias (recommended)
import { Button } from "@/components/ui/button";
import { vc83Api } from "@/lib/vc83-api";

// ❌ Without alias (works but not recommended)
import { Button } from "../../components/ui/button";
import { vc83Api } from "../../lib/vc83-api";
```

---

## 🚀 Running the Application

### Development:
```bash
npm run dev
# or
pnpm dev
# or
yarn dev
```

Access at: [http://localhost:3000](http://localhost:3000)

### Production Build:
```bash
npm run build
npm start
```

---

## 🔄 Recent Changes: "kurse" → "seminare"

All references have been updated from "kurse" (courses) to "seminare" (seminars):

### File Renames:
- `src/app/kurse/` → `src/app/seminare/`
- All nested files moved accordingly

### Content Updates:
- URL routes: `/kurse` → `/seminare`
- Button text: "Kurse entdecken" → "Seminare entdecken"
- Page titles: "CME-Fortbildungskurse" → "CME-Fortbildungsseminare"
- Breadcrumbs updated
- All `<Link>` components updated

---

## ✅ Build Status

```bash
npm run build

Route (app)
┌ ○ /                          # Static home page
├ ○ /_not-found               # Static 404
├ ƒ /bestaetigung             # Dynamic confirmation
├ ○ /seminare                 # Static seminar catalog
├ ƒ /seminare/[id]            # Dynamic seminar details
└ ƒ /seminare/[id]/anmelden   # Dynamic registration

○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand

✓ Build successful!
```

---

## 🐛 404 Issue - Solved!

If you were getting a 404 on the main page (`/`), it was likely because:

1. **Dev server needed restart** after folder structure changes
2. **Build cache** from old structure

**Solution:**
```bash
# Clear Next.js cache
rm -rf .next

# Rebuild
npm run build

# Restart dev server
npm run dev
```

---

## 📝 Notes

- The `public/` folder location is **critical** - it must be at root level
- The `src/` folder is **optional** but recommended for cleaner organization
- Next.js automatically detects both `app/` and `src/app/` structures
- The 404 API error during build is **expected** (API not running yet)
- All routes now use `/seminare` instead of `/kurse`

---

## ✅ Your Project Structure is Now Correct!

Everything is properly configured:
- ✅ `public/` at root level
- ✅ `src/app/` with all pages
- ✅ Components in `src/components/`
- ✅ API client in `src/lib/`
- ✅ All routes renamed to "seminare"
- ✅ Build successful
- ✅ Ready for development
