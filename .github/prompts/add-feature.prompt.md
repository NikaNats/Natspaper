---
mode: "agent"
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
   - Layout: `src/layouts/`
   - Page/Route: `src/pages/`

2. **Does this require new i18n keys?** List them.

3. **Does this require new CSS custom properties or Tailwind utilities?**

4. **Does this touch SEO?** (meta tags, sitemap, robots, canonical URLs)

5. **Does this affect all locales?** List: `en`, `ka`, and others.

6. **What are the accessibility implications?** (new interactive elements, focus management, ARIA)

7. **What could go wrong?** (network faults, missing translations, empty data)

## Phase 2 — Implementation Order

Follow this strict order to maintain separation of concerns:

```
1. Interface / type definitions (src/types.ts or module-local types)
2. Data layer (src/utils/post/ or new utility)
3. Unit tests for the data layer (tests/unit/)
4. Dumb UI component (src/components/ui/)
5. Smart Feature component (src/components/features/) if needed
6. Layout / page integration
7. i18n keys — add to ALL locale dictionaries simultaneously
8. E2E test (tests/e2e-browser/)
```

## Phase 3 — Quality Gates

Before asking for review:

```bash
pnpm build               # No TypeScript errors, build succeeds
pnpm lint                # No ESLint or Stylelint violations
pnpm test:run            # All unit tests pass
pnpm test:e2e            # All E2E tests pass
pnpm verify-build        # Build output meets size/content thresholds
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
- [ ] FOUC-sensitive code uses `is:inline`
- [ ] No `any`, no `enum`, no raw `getCollection()`

## Commit Format

```
feat(<scope>): <description>

- What was added: <summary>
- i18n keys added: <list or "none">
- Tests: tests/unit/<path>.test.ts, tests/e2e-browser/<spec>.spec.ts
```
