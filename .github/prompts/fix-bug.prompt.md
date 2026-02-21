---
mode: "agent"
tools: ["filesystem", "sequential-thinking", "git"]
description: "Systematic bug investigation: reproduce, isolate, fix, test, verify."
---

# Bug Fix Workflow

Follow this structured process for every bug. Do not skip steps.

## Step 1 — Understand the Bug

Answer these questions before touching code:

1. What is the **observed behavior**?
2. What is the **expected behavior**?
3. Which **layer** is affected? (Data → `src/utils/post/`, UI → `src/components/`, Routing → `src/pages/`)
4. Is it **locale-specific**? Test across `en` and `ka`.
5. Is it **environment-specific**? (dev vs build, Chrome vs Firefox)

## Step 2 — Reproduce

```bash
pnpm dev          # Verify in dev
pnpm build        # Verify in prod build
pnpm test:run     # Run unit tests
pnpm test:e2e     # Run E2E tests
```

Identify the smallest reproduction case.

## Step 3 — Isolate Root Cause

- Read the failing test output or error stack trace completely.
- Trace data flow: `pages/` → `layouts/` → `components/` → `utils/`.
- Check if a recent change introduced a regression: `git log --oneline -20`.
- For rendering bugs: check if it's a hydration issue (SSG vs client-side).

## Step 4 — Fix

Apply the minimal correct change:

- Fix in the correct layer (never patch symptoms in UI when root cause is in data layer).
- Maintain TypeScript strict mode — no `as any` or `!` non-null assertions as fix mechanisms.
- Ensure the fix handles all locales.
- Ensure the fix handles edge cases (empty arrays, missing frontmatter fields, etc.).

## Step 5 — Write a Regression Test

**For every bug fix, write a test that would have caught the bug:**

```ts
// tests/unit/<module>/<subject>.test.ts
it("should <correct behavior> — regression for #<issue-number>", () => {
  // Arrange: recreate the exact failing condition
  // Act: call the fixed function
  // Assert: verify the bug is gone
});
```

## Step 6 — Verify Holistically

```bash
pnpm build        # Must succeed
pnpm test:run     # All unit tests must pass
pnpm test:e2e     # All E2E tests must pass (optional: --project=chromium for speed)
```

## Step 7 — Document

Commit message format:

```
fix(<scope>): <imperative description of what was fixed>

- Root cause: <one line>
- Fix: <one line>
- Regression test added: tests/unit/<path>.test.ts
```
