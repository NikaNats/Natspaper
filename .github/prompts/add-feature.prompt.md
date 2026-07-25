---
agent: "add-feature"
tools: ["filesystem", "sequential-thinking"]
description: "End-to-end feature implementation: design, code, test, verify."
---

# Feature Implementation Workflow

Use this prompt when adding a new feature to Natspaper.

## Phase 1 — Design (Before Writing Code)

Answer every question before coding:

1. **Which layer(s) does this touch?**
   - Data: `src/utils/post/`, `src/content/`
   - UI: `src/components/ui/`
   - Feature: `src/components/features/`
   - Layout: `src/components/layout/`
   - Post: `src/components/post/`
   - Page/Route: `src/pages/`

2. **Does this require new i18n keys?** List them.
   - UI strings: `src/i18n/dictionaries/ui.ts` (both `en` and `ka` objects)
   - Tag names: `src/i18n/dictionaries/tags.ts` (both `en` and `ka` objects)

3. **Does this require a new feature flag?**
   - Type: `src/types.ts` → `FeaturesConfig` interface
   - Default: `src/config.ts` → `FEATURES` object

4. **Does this require new CSS custom properties or Tailwind utilities?**

5. **Does this touch SEO?** (meta tags, sitemap, robots, canonical URLs)

6. **Does this affect all locales?** List: `en`, `ka`, and others.

7. **What are the accessibility implications?** (new interactive elements, focus management, ARIA)

8. **What could go wrong?** (network faults, missing translations, empty data)

## Phase 2 — Implementation Order

Follow this strict order to maintain separation of concerns:

```
1. Interface / type definitions (src/types.ts or module-local types)
2. Feature flag (src/types.ts → FeaturesConfig, src/config.ts → FEATURES) if needed
3. Data layer (src/utils/post/ or new utility)
4. Unit tests for the data layer (tests/unit/)
5. Dumb UI component (src/components/ui/)
6. Smart Feature component (src/components/features/) if needed
7. Layout / page integration
8. i18n keys — add to BOTH locale objects in src/i18n/dictionaries/ui.ts (and tags.ts if applicable) simultaneously
9. E2E test (tests/e2e-browser/)
```

## Phase 3 — Quality Gates

Before asking for review:

```bash
pnpm build:prod          # astro check → build → verify-build.js (full CI gate)
pnpm lint                # No ESLint or Stylelint violations
pnpm test:run            # All unit tests pass
pnpm test:e2e            # All E2E tests pass
```

## Checklist

- [ ] Feature works in `en` and `ka` locales
- [ ] No hardcoded UI strings
- [ ] All new interactive elements have `data-testid`
- [ ] All new interactive elements are keyboard-accessible
- [ ] Animations respect `prefers-reduced-motion`
- [ ] New utilities have unit tests with ≥ 90% coverage
- [ ] `IPostRepository` updated if data layer extended
- [ ] `FeatureManager` used if new client-side feature registered
- [ ] New feature flag added to `FeaturesConfig` (`src/types.ts`) and `FEATURES` (`src/config.ts`) if applicable
- [ ] FOUC-sensitive code uses `is:inline`
- [ ] No `any`, no `enum`, no raw `getCollection()`

## Commit Format

```
feat(<scope>): <description>

- What was added: <summary>
- i18n keys added: <list or "none">
- Feature flag added: <name or "none">
- Tests: tests/unit/<path>.test.ts, tests/e2e-browser/<spec>.spec.ts
```
