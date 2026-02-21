---
mode: "ask"
tools: ["filesystem", "git", "sequential-thinking"]
description: "Structured PR review: architecture, correctness, perf, a11y, i18n, tests."
---

# PR Review Checklist

Perform a structured code review of the current diff. Check each category below and output findings as a numbered list of actionable comments.

## 1. Architecture & SOLID

- [ ] New content access goes through `PostRepository`, not raw `getCollection()`
- [ ] New client-side features are registered via `FeatureManager.register()`
- [ ] Dumb components in `src/components/ui/` have zero side effects
- [ ] Smart components in `src/components/features/` clean up listeners in `disconnectedCallback`
- [ ] New abstractions depend on interfaces, not concrete implementations

## 2. TypeScript Correctness

- [ ] No `any` usage introduced
- [ ] No new `enum` — const + `as const` used instead
- [ ] `import type` used for all type-only imports
- [ ] All new functions have explicit return types
- [ ] No `@ts-ignore` without an accompanying FIXME comment

## 3. Performance & Reliability

- [ ] No `globalThis.gc()` calls
- [ ] No `.free()` on N-API objects (rely on GC finalizer)
- [ ] Unbounded `Promise.all()` over arrays wrapped in `ConcurrencyLimiter`
- [ ] No RegEx used in hot paths / sanitization (use character-by-character parsing)
- [ ] FOUC-sensitive scripts use `is:inline`

## 4. Security

- [ ] No hardcoded secrets or tokens
- [ ] No raw innerHTML assignment (use textContent or DOMParser)
- [ ] No new `eval()` or `new Function()` calls
- [ ] External scripts do NOT use fragile SRI hashes on CDN-hosted third-party resources

## 5. Accessibility (WCAG 2.2 AA)

- [ ] New interactive elements have `aria-label` or visible label
- [ ] Heading hierarchy is preserved (no skipped levels)
- [ ] `data-testid` added to new significant elements
- [ ] No `outline: none` without visible replacement
- [ ] Images have descriptive `alt` text; decorative images have `alt=""`

## 6. i18n

- [ ] No hardcoded user-visible strings
- [ ] All new strings added to all locale dictionaries in `src/i18n/`
- [ ] New routes include `[locale]` parameter

## 7. CSS & Styling

- [ ] Animations wrapped in `@media (prefers-reduced-motion: no-preference)`
- [ ] No `@apply` outside `src/styles/components.css`
- [ ] Container queries used instead of media queries for component responsiveness
- [ ] New design tokens added as CSS custom properties

## 8. Tests

- [ ] New utilities have unit tests in `tests/unit/`
- [ ] New E2E-affecting features have specs in `tests/e2e-browser/`
- [ ] All tests pass: `pnpm test:run` and `pnpm test:e2e`
- [ ] Coverage not decreased from baseline

## Output Format

For each finding, output:

```
[SEVERITY: BLOCKER|MAJOR|MINOR|NIT] <File>:<Line> — <Issue> — <Suggested Fix>
```

Summarize total counts by severity at the end.
