<!--
SYNC IMPACT REPORT
==================
Version change: (none) → 1.0.0  (initial ratification, template → concrete)
Modified principles: N/A (first fill)
Added sections: Core Principles (I–VIII), Rendering & Content Standards, Development Workflow & Quality Gates, Governance
Removed sections: N/A
Templates requiring updates:
  ✅ .specify/templates/plan-template.md  — Constitution Check gates verified; no structural changes needed
  ✅ .specify/templates/spec-template.md  — Mandatory sections (i18n, tests, accessibility) already implied; no changes needed
  ✅ .specify/templates/tasks-template.md — Test task categories (unit/e2e) align with Principle VII; no changes needed
Follow-up TODOs: None — all placeholders resolved.
-->

# Natspaper Constitution

## Core Principles

### I. Framework & Language Integrity

Every source file in `src/` and `config/` MUST be authored in TypeScript 5.x with
`strict: true` (as configured in `tsconfig.json`). `.astro` component files are the
only permitted UI file extension. Plain `.js` files are forbidden everywhere except
the `public/` directory (browser-only inline scripts).

- MUST NOT use `any`. Use `unknown` with explicit type-narrowing.
- MUST NOT use `enum`; use `const` objects with `as const` or string-literal unions.
- MUST prefer `interface` over `type` for object shapes to assist TS compiler caching.
- Exhaustive `switch` statements or record-lookup maps MUST be used where branching
  on a union type could silently fall through.
- No React, Vue, Svelte, or other Virtual DOM frameworks are permitted. The project is
  100 % Vanilla JS + Astro.

**Rationale**: These constraints keep the build pipeline deterministic, eliminate a
class of runtime type errors, and ensure the entire surface area of the codebase is
auditable by the TypeScript compiler with no escape hatches.

### II. Styling Discipline — Tailwind CSS v4 Exclusively

Tailwind CSS v4 is the sole permitted styling mechanism.

- Inline `style` attributes are FORBIDDEN in all `.astro` and markup files.
- CSS Modules are FORBIDDEN.
- Utility classes from Tailwind MUST be used; component-level styles belong in
  `src/styles/components.css` via controlled `@layer components` blocks only, and
  MUST NOT duplicate Tailwind utility logic arbitrarily.
- `@apply` MUST be used sparingly; it is only permitted inside strict `@layer
  components` boundaries in `components.css`.
- CSS Container Queries (`@container`) MUST be preferred over `@media` for
  component-level responsiveness.
- Fluid typography and spacing MUST use `clamp()`.
- Animations MUST be wrapped in `@media (prefers-reduced-motion: no-preference)`.

**Rationale**: A single styling system prevents specificity wars, keeps the output
bundle predictable, and avoids the runtime overhead of CSS-in-JS or module hashing.

### III. Component Architecture — Smart vs. Dumb (NON-NEGOTIABLE)

Two and only two component categories are recognised:

| Location | Category | Rules |
|---|---|---|
| `src/components/ui/` | Dumb / Presentational | Accept props only. MUST have no side effects, no `window` access, no data-fetching. |
| `src/components/features/` | Smart / Container | MAY bind to `window`, load third-party scripts, call data-layer abstractions. |

- Interactive client-side logic MUST be encapsulated in native Web Components (custom
  elements) defined inside Astro `<script>` tags (e.g., `<mobile-menu>`); scattered
  global event listeners are forbidden.
- FOUC-prevention scripts (dark-mode toggle, theme persistence) MUST use `<script
  is:inline>` and MUST be self-contained — they MUST NOT import modules.
- File names MUST follow **kebab-case** with `.astro` extension
  (e.g., `post-card.astro`, `tag-badge.astro`).

**Rationale**: Clear separation of presentational and behavioural concerns enables
isolated unit-testing of dumb components and prevents logic creep into the design
library.

### IV. SOLID Architecture & Feature Flags

All new modules MUST adhere to SOLID:

- **S** – Single responsibility: one reason to change per module.
- **O** – Open/closed: extend via new files / implementations, not by modifying
  stable abstractions.
- **L** – Liskov substitution: subtypes MUST be substitutable for their bases without
  altering correctness.
- **I** – Interface segregation: expose only the methods a caller needs.
- **D** – Dependency inversion: high-level modules MUST depend on abstractions, not
  concrete implementations.

Concrete rules:

- ALL content fetching MUST go through `src/utils/post/repository.ts`
  (`PostRepository`). Direct calls to `getCollection()` inside UI or feature
  components are forbidden.
- Client-side features MUST be registered via `src/utils/features/FeatureManager.ts`.
- Runtime feature toggles (dark mode, comments, analytics, etc.) MUST be controlled
  exclusively through `config/features.ts`; toggling a feature by editing component
  code directly is forbidden.
- Pure utility functions MUST live in `src/utils/` and MUST be free of side effects.

**Rationale**: Dependency inversion and feature-flag centralisation make the codebase
easier to test, refactor, and safely extend without touching stable layers.

### V. Internationalization — All UI Strings Through i18n (NON-NEGOTIABLE)

- Every user-visible string introduced in any `.astro`, `.ts`, or `.js` file MUST be
  sourced from `src/i18n/dictionaries/`.
- The `en` (English) dictionary MUST be treated as the canonical source of truth;
  the `ka` (Georgian) dictionary MUST provide a translation for every key defined in
  `en`.
- New dictionary keys MUST be added to _both_ locale files atomically in the same
  commit / PR.
- Components MUST obtain translations via `getI18n(locale)` imported from
  `src/i18n/index.ts`. Hardcoded English text in JSX/template output is forbidden.
- Fallback logic MUST degrade gracefully to `en` when a `ka` key is absent, and MUST
  log a warning without breaking the UI.
- Locale-aware routing follows the `/[locale]/...` pattern; every generated URL MUST
  carry an explicit locale segment.

**Rationale**: Supporting Georgian and English readers as first-class citizens is a
primary product goal. Hardcoded strings silently exclude one audience and create
hidden maintenance debt.

### VI. Static-Site Purity — No Server-Side Runtime

Natspaper is a 100 % statically-generated site. The production `astro build` output
MUST consist entirely of pre-rendered HTML, CSS, and JS assets.

- Server-side rendering (SSR), edge functions, or API routes that execute at request
  time are FORBIDDEN (except Astro endpoint files that produce static assets such as
  `robots.txt.ts` and RSS feeds).
- No database connections, no secret environment variables required at runtime on the
  CDN, and no session management are permitted.
- The `@astrojs/vercel` adapter is used in static mode; any configuration change that
  switches it to SSR mode is a constitution violation.
- All data MUST be resolved at build time via Astro Content Collections and
  `PostRepository`.

**Rationale**: A purely static output achieves the sub-second TTFB goals, removes an
entire class of server-side security vulnerabilities, and makes the site trivially
portable across any static host.

### VII. Test-First Discipline (NON-NEGOTIABLE)

Every new feature or bug-fix MUST ship with:

1. **Vitest unit tests** in `tests/unit/` covering all pure utility functions and
   logic branches introduced by the change.
2. **Playwright E2E tests** in `tests/e2e/` covering the user-visible behaviour of
   the feature across at least the `chromium` browser project.

Additional rules:

- New interactive UI elements MUST carry a `data-testid` attribute.
- Accessibility MUST be verified with Axe-core; HTML MUST be WCAG 2.2 AA compliant
  (semantic tags, proper `aria-label` attributes, visible focus states).
- Tests MUST be written and confirmed failing _before_ the implementation is
  committed (Red → Green → Refactor).
- A PR that removes or disables existing tests without a documented justification is
  a constitution violation.

**Rationale**: Test coverage is the primary defence against regressions in a
framework-heavy codebase where invisible rendering side-effects are easy to introduce.

### VIII. Security, Performance & CI/CD Gate Compliance

**Security**:
- The Content Security Policy (CSP) and security headers defined in `vercel.json`
  MUST NOT be weakened. Any PR that removes a directive, loosens a `script-src`,
  or adds `unsafe-eval` / `unsafe-inline` without an accompanying hash/nonce
  strategy is a constitution violation.
- `pnpm audit --audit-level=high` MUST return zero high-severity vulnerabilities
  before any production release.

**Performance**:
- OG image generation MUST use the `ConcurrencyLimiter` utility to prevent memory
  OOM during builds. Direct `satori` / `resvg` calls outside the limiter are
  forbidden.
- No PR may introduce a measurable increase (> 5 % on any single route) in the
  Lighthouse Performance score or Astro build-output bundle size without an explicit
  architectural justification recorded in the PR description.
- FOUC for dark-mode MUST remain zero; the inline toggle script in `public/toggle-
  theme.js` MUST execute before first paint.

**CI/CD Gate** — every commit pushed to `master` or submitted as a PR MUST pass ALL
of the following gates in sequence:

1. `pnpm lint` (ESLint + Stylelint)
2. `pnpm format:check` (Prettier)
3. `pnpm build:prod` (`astro check` + `astro build` + `verify-build.js`)
4. `pnpm test:run` (Vitest)
5. `pnpm test:e2e` (Playwright)
6. Husky pre-push hook (mirrors gates 1–4 locally)

No gate may be bypassed with `--no-verify` or equivalent without a documented,
time-limited exception approved by the project maintainer.

**Rationale**: Automated gates are the enforcement mechanism for every other
principle in this constitution; without them the principles are aspirational only.

## Rendering & Content Standards

### Math Rendering

- LaTeX expressions enclosed in `$...$` (inline) or `$$...$$` (block) MUST be
  rendered server-side using **KaTeX** via the `rehype-katex` / `remark-math` plugin
  pipeline at Astro build time.
- Client-side KaTeX fallback scripts are forbidden; all math MUST be static HTML in
  the final output.

### Syntax Highlighting

- Code blocks in Markdown/MDX content MUST use **ExpressiveCode** (via
  `astro-expressive-code`) for syntax highlighting.
- Raw `<pre><code>` blocks with inline style colouring are forbidden.
- The `@expressive-code/plugin-collapsible-sections` and
  `@expressive-code/plugin-line-numbers` plugins are the approved extension points.

### File Naming & Structure Conventions

| Artifact | Convention |
|---|---|
| Astro components | `kebab-case.astro` |
| TypeScript modules | `camelCase.ts` or `kebab-case.ts` matching the existing pattern in the target directory |
| Style files | `kebab-case.css` under `src/styles/` |
| Utility functions | Pure functions in `src/utils/` subdirectories; group by domain (e.g., `core/`, `post/`, `seo/`) |
| i18n dictionaries | `src/i18n/dictionaries/<locale>.ts` |
| Test files (unit) | `tests/unit/<module-name>.test.ts` |
| Test files (E2E) | `tests/e2e/<feature>.spec.ts` |

New directories MUST mirror the existing domain grouping; catch-all `utils.ts` files
are discouraged.

## Development Workflow & Quality Gates

### Pre-Commit & Pre-Push

- Husky hooks enforce lint + format + `astro check` + unit tests before any push
  reaches the remote.
- `commitizen` (`cz.yaml`) governs commit message format; all commits MUST follow the
  configured Conventional Commits preset.

### PR Checklist (enforced by constitution)

Before a PR may be merged the author MUST confirm:

- [ ] All CI/CD gates (Principle VIII) pass with a green build.
- [ ] New user-visible strings are added to both `en` and `ka` dictionaries
  (Principle V).
- [ ] New features have Vitest unit tests AND Playwright E2E tests (Principle VII).
- [ ] No `style=""` attributes introduced; only Tailwind utilities used (Principle II).
- [ ] No direct `getCollection()` calls outside `PostRepository` (Principle IV).
- [ ] `vercel.json` CSP has not been weakened (Principle VIII).
- [ ] Bundle size impact assessed; increase > 5 % documented in PR description
  (Principle VIII).

### Environment Variables

- All environment variables MUST be declared and validated in `config/env.ts` and
  `src/env/schema.ts` via Zod before use.
- A build that references an undeclared env var MUST fail via `envValidation.ts`.
- Secrets required only at build time MUST be clearly labelled; no runtime-secret
  access is permitted (Principle VI).

## Governance

This constitution supersedes all other practices and informal agreements on the
Natspaper project. Amendments follow the process below:

1. **Propose**: Open a GitHub Discussion or PR titled `constitution: <summary>` that
   describes the proposed amendment, the motivation, and any migration plan for
   existing code.
2. **Review**: The project maintainer reviews for consistency with the project's
   stated goals (static-first, performance-obsessed, accessibility-first).
3. **Version bump**: Apply semantic versioning to `CONSTITUTION_VERSION`:
   - **MAJOR** — backward-incompatible governance change, principle removal, or
     redefinition that invalidates previously compliant code.
   - **MINOR** — new principle added or existing principle materially expanded.
   - **PATCH** — clarification, wording improvement, typo fix.
4. **Record**: Update `LAST_AMENDED_DATE` and prepend a new Sync Impact Report
   comment to this file.
5. **Propagate**: Update `.specify/templates/` and `.github/instructions/` files as
   required. A constitution amendment PR MUST include those updates atomically.

All PRs and code reviews MUST verify compliance with this document. Raise
non-compliance as a blocking review comment citing the specific principle violated.
For runtime development guidance refer to `.github/instructions/copilot-instructions.md`.

**Version**: 1.0.0 | **Ratified**: 2026-02-27 | **Last Amended**: 2026-02-27
