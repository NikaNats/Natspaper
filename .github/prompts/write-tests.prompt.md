---
mode: "agent"
tools: ["filesystem", "sequential-thinking"]
description: "Generate comprehensive Vitest unit tests or Playwright E2E tests for a target module."
---

# Test Generation

Generate high-quality tests for the specified module. Ask the user which file/module to test if not provided.

## For Vitest Unit Tests (`src/utils/**`)

### Discovery

1. Read the target file fully.
2. Identify all exported functions/methods.
3. Read the interface/type definitions used.
4. Check for existing tests in `tests/unit/` — avoid duplication.

### Generation Rules

- File: `tests/unit/<module>/<subject>.test.ts`
- Import pattern:
  ```ts
  import { describe, it, expect, vi, beforeEach } from "vitest";
  import { functionUnderTest } from "@utils/<module>/<subject>";
  ```
- Structure: one `describe` per exported function, one `it` per scenario.
- Cover:
  1. ✅ Happy path (typical valid input)
  2. 🔄 All locales (`en`, `ka`, fallback cases)
  3. ⚠️ Edge cases (empty arrays, empty strings, `undefined`, `null`)
  4. ❌ Error paths (`expect(() => fn()).toThrow(...)`)
  5. 🔒 Security cases (if sanitization is involved — test injection attempts)

### Mock Patterns

```ts
// Module mock
vi.mock("astro:content", () => ({
  getCollection: vi.fn().mockResolvedValue([]),
}));

// Reset per test
beforeEach(() => {
  vi.clearAllMocks();
});
```

## For Playwright E2E Tests (`tests/e2e-browser/**`)

### Discovery

1. Identify the page route being tested.
2. Check `playwright.config.ts` for base URL and projects.
3. Read the page component for `data-testid` attributes.

### Generation Rules

- File: `tests/e2e-browser/<feature>.spec.ts`
- Every spec must include an axe accessibility test.
- Use `data-testid` selectors only; never CSS class selectors.
- Include locale variants: test route with `/en/` and `/ka/` prefixes.

### Structure Template

```ts
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("<Feature> [locale: en]", () => {
  test("should render <element>", async ({ page }) => {
    await page.goto("/en/<route>");
    await expect(page.getByTestId("<testid>")).toBeVisible();
  });

  test("should have no axe violations", async ({ page }) => {
    await page.goto("/en/<route>");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    expect(results.violations).toEqual([]);
  });
});
```

## Output

After generating, run `pnpm test:run` (unit) or `pnpm test:e2e` (E2E) to confirm the tests pass. Report pass/fail summary.
