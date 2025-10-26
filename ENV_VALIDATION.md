# Environment Variable Validation - Build-Time Configuration Safety

## Issue Summary

**Severity:** HIGH | **Status:** FIXED ✅

### Problem
- ❌ No build-time validation of critical environment variables
- ❌ `SITE_WEBSITE` not in env.schema despite being required
- ❌ `SENTRY_AUTH_TOKEN` used but not validated
- ❌ Build succeeds silently with missing/empty variables
- ❌ Deployment failures only discovered at runtime
- ❌ No helpful error messages for missing config

### Impact
```
Bad Configuration → Silent Build Success → Runtime Failure in Production
```

---

## Solution Implemented ✅

### 1. **Comprehensive env.schema** (astro.config.ts)

All environment variables now have TypeScript types and validation rules:

```typescript
env: {
  schema: {
    // Server-side (Private) Variables
    SITE_WEBSITE: envField.string({
      access: "secret",
      context: "server",
      optional: false,  // ✅ Required for deployment
    }),
    SENTRY_AUTH_TOKEN: envField.string({
      access: "secret",
      context: "server",
      optional: true,
    }),
    SENTRY_DSN: envField.string({
      access: "secret",
      context: "server",
      optional: true,
    }),
    // ... all variables documented

    // Client-side (Public) Variables
    PUBLIC_SENTRY_DSN: envField.string({
      access: "public",
      context: "client",
      optional: true,
    }),
  },
}
```

### 2. **Build-Time Validation** (New)

**File:** `src/utils/envValidation.ts`

```typescript
validateBuildEnvironment(): ValidationResult
├─ Checks all required variables exist
├─ Detects empty values
├─ Provides helpful error messages
└─ Suggests fixes in output
```

**Features:**
- ✅ Critical variables: must exist
- ✅ Recommended variables: warning if missing
- ✅ Empty value detection
- ✅ Context-aware error messages
- ✅ Helpful links to documentation

### 3. **Astro Integration Hook** (New)

**File:** `src/integrations/envValidation.ts`

```typescript
envValidationIntegration()
├─ Runs before build starts
├─ Validates all environment variables
├─ Logs errors and warnings
└─ Exits with error code if validation fails
```

**Workflow:**
```
astro build
  ↓
envValidationIntegration hook triggers
  ↓
validateBuildEnvironment()
  ↓
logValidationResults()
  ├─ Errors → Exit with code 1 ❌
  └─ Warnings → Continue build ⚠️
```

### 4. **Error Messages** (Production-Ready)

When a required variable is missing:

```
======================================================================
🚨 ENVIRONMENT VALIDATION FAILED
======================================================================

❌ MISSING REQUIRED ENVIRONMENT VARIABLE: SITE_WEBSITE

Description: Your production domain (e.g., https://example.com)

Action Required:
1. Create or update .env.local file
2. Add: SITE_WEBSITE=<your_value>
3. For details, see: .env.example

Documentation:
- Setup Guide: https://github.com/NikaNats/Natspaper#configuration
- Environment Variables: .env.example

======================================================================
Build cannot proceed. Please fix the errors above and try again.
======================================================================
```

---

## Environment Variables Validated

### Required (Critical)
| Variable | Context | Purpose | Default |
|----------|---------|---------|---------|
| `SITE_WEBSITE` | Server | Production domain | ❌ Required |

### Optional (Recommended)
| Variable | Context | Purpose | Default |
|----------|---------|---------|---------|
| `SENTRY_AUTH_TOKEN` | Server | Error tracking auth | Disabled if missing |
| `SENTRY_DSN` | Server | Server-side error tracking | Disabled if missing |
| `PUBLIC_SENTRY_DSN` | Client | Client-side error tracking | Disabled if missing |

### Optional (Meta)
| Variable | Context | Purpose | Default |
|----------|---------|---------|---------|
| `SENTRY_TRACE_SAMPLE_RATE` | Server | Trace sampling (0-1) | 0.1 (production) |
| `NODE_ENV` | Server | Environment | Auto-detected |
| `BUILD_TIMESTAMP` | Server | Build metadata | Not set |
| `BUILD_VERSION` | Server | Build metadata | Not set |
| `PUBLIC_GOOGLE_SITE_VERIFICATION` | Client | GSC verification | Disabled if missing |

---

## Files Modified/Created

### Modified
- ✅ **astro.config.ts**
  - Added complete env.schema with all variables
  - Added envValidationIntegration() to integrations
  - Clear comments for each variable

### Created
- ✅ **src/utils/envValidation.ts**
  - `validateBuildEnvironment()` - Main validation logic
  - `validateEnvVariable()` - Single variable validation
  - `logValidationResults()` - Formatted error/warning output
  - `isProduction()` - Helper function
  - `isBuildTime()` - Helper function

- ✅ **src/integrations/envValidation.ts**
  - `envValidationIntegration()` - Astro integration hook
  - Runs at build-time via `astro:build:start`
  - Exits build on validation failure

### Updated
- ✅ **.env.example** - Already has documentation

---

## Build-Time Behavior

### Successful Build (All Variables Valid)
```bash
$ npm run build
[00:00] ✓ build complete
✓ Sitemap generated
✓ Sentry integration ready
```

### Failed Build (Missing Required Variable)
```bash
$ npm run build
[00:00] Building...

🚨 ENVIRONMENT VALIDATION FAILED
❌ MISSING REQUIRED ENVIRONMENT VARIABLE: SITE_WEBSITE

Action Required: Set SITE_WEBSITE in .env.local

✖ Build failed
```

### Partial Build (Missing Optional Variable)
```bash
$ npm run build
[00:00] Building...

⚠️  ENVIRONMENT WARNINGS
ℹ️  Optional: SENTRY_AUTH_TOKEN is not configured.

[00:05] ✓ build complete (Sentry integration disabled)
```

---

## Deployment Safety

### Before Deployment Checklist
- [ ] `SITE_WEBSITE` set to production domain
- [ ] `.env.local` exists in deployment environment
- [ ] All secrets are secure and not committed
- [ ] Build passes validation (`npm run build` succeeds)
- [ ] Run `git status` to verify `.env.local` is in `.gitignore`

### CI/CD Integration
Validation runs automatically in:
- Local builds: `npm run build`
- GitHub Actions: Before deployment
- Vercel/Netlify: Before deployment
- Docker builds: Before container creation

---

## Testing

### Test Missing Required Variable
```bash
# Temporarily remove SITE_WEBSITE
$ unset SITE_WEBSITE
$ npm run build
# ✗ Build fails with helpful message
```

### Test Invalid Value
```bash
# Set empty value
$ SITE_WEBSITE="" npm run build
# ⚠️  Warning about empty value
```

### Test Optional Missing
```bash
# Don't set SENTRY_AUTH_TOKEN
$ npm run build
# ℹ️  Warning but build succeeds
```

---

## Integration Points

### In astro.config.ts
```typescript
import { envValidationIntegration } from "./src/integrations/envValidation";

export default defineConfig({
  integrations: [
    envValidationIntegration(),  // Runs at build start
    // ... other integrations
  ],
});
```

### Manual Validation
```typescript
import { 
  validateBuildEnvironment, 
  logValidationResults 
} from "./src/utils/envValidation";

const result = validateBuildEnvironment();
logValidationResults(result);  // Logs and exits if errors
```

---

## Benefits

✅ **Fail Fast:** Errors caught at build time, not runtime
✅ **Developer Experience:** Clear, actionable error messages
✅ **Production Safety:** Prevents silent configuration failures
✅ **Type Safety:** All variables have TypeScript types
✅ **Documentation:** Schema serves as variable documentation
✅ **CI/CD Ready:** Works in all deployment contexts
✅ **User-Friendly:** Helps new developers understand requirements

---

## References

- [Astro Environment Variables](https://docs.astro.build/en/guides/environment-variables/)
- [Astro envField API](https://docs.astro.build/en/reference/configuration-reference/#env)
- [Astro Integrations](https://docs.astro.build/en/reference/integrations-reference/)
- [12 Factor App: Environment Variables](https://12factor.net/config)
