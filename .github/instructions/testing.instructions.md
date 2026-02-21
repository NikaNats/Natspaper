---
applyTo: "tests/**"
---

# Testing Standards — Natspaper

## Stack

| Type               | Tool                                    | Config                 |
| ------------------ | --------------------------------------- | ---------------------- |
| Unit / Integration | **Vitest**                              | `vitest.config.ts`     |
| E2E / A11y         | **Playwright**                          | `playwright.config.ts` |
| Accessibility      | **Axe-core** via `@axe-core/playwright` | E2E suites             |

## Vitest — Unit Tests

### File Location & Naming

```
tests/
  unit/
    <module>/
      <subject>.test.ts    # mirrors src/utils/<module>/<subject>.ts
  __mocks__/
    astro-content.ts       # stub for astro:content virtual module
```

### Test Structure

Use `describe`/`it` blocks — **not** `test()` at top level.

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

describe("moduleName", () => {
  describe("methodName", () => {
    it("should <expected behavior> when <condition>", () => {
      // Arrange → Act → Assert
    });
  });
});
```

### Coverage Requirements

- All files in `src/utils/` must have unit tests.
- Coverage target: **≥ 90%** lines for utility functions.
- Run coverage: `pnpm test:coverage`.

### Mocking Rules

- Use `vi.mock()` for module-level mocks — always factory form.
- Stub `astro:content` via the alias in `vitest.config.ts` (`tests/__mocks__/astro-content.ts`).
- Never spy on private class fields — test observable behavior only.
- Reset mocks with `vi.clearAllMocks()` in `beforeEach`.

### What to Test

- Happy path (expected input → expected output)
- Edge cases (empty arrays, null/undefined, locale fallbacks)
- Error paths (`expect(() => fn()).toThrow(...)`)
- Type narrowing proofs (TypeScript compile-time only — add `@ts-expect-error` to confirm)

## Playwright — E2E Tests

### File Location

```
tests/
  e2e-browser/
    <feature>.spec.ts
```

### Required Imports

```ts
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
```

### Accessibility Test Pattern

Every E2E spec covering a page **must** include an axe assertion:

```ts
test("should have no axe violations", async ({ page }) => {
  await page.goto("/en/");
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(results.violations).toEqual([]);
});
```

### Locator Strategy (preference order)

1. `data-testid` attribute — always add these in component code
2. ARIA role + name: `page.getByRole("button", { name: "..." })`
3. `getByText()` only for visible text that won't change with i18n updates

**NEVER** use CSS selectors like `.some-class` in tests.

### Network Interception

Use `page.route()` to simulate outages:

```ts
test("gracefully handles third-party failure", async ({ page }) => {
  await page.route("**/third-party.com/**", route => route.abort());
  await page.goto("/en/");
  // Assert page still renders core content
  await expect(page.getByRole("main")).toBeVisible();
});
```

### Performance Budget (assertions)

Assert against build output in `scripts/verify-build.js`:

- HTML larger than 2 KB
- CSS bundle larger than 1 KB
- JS bundle larger than 200 B

## General Rules

- Tests must be **deterministic** — no `Date.now()` raw calls, use `vi.setSystemTime()`.
- Tests must be **isolated** — clean up DOM mutations and localStorage in `afterEach`.
- Tests must be **fast** — unit tests < 50ms each; E2E < 10s each.
- Add `data-testid` to every new interactive/significant element **in the component code** — not just in the test file.
