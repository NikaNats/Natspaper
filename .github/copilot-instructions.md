# Natspaper — AI Coding Agent Instructions

**Stack**: Astro 5.x (100 % SSG) · TypeScript 5.9 strict · Tailwind CSS v4 · Vitest + Playwright

---

## Architecture at a Glance

```
src/components/ui/        ← Dumb/presentational — props only, no side effects
src/components/features/  ← Smart — may bind window, call data layer, load 3rd-party scripts
src/utils/post/repository.ts  ← ALL content fetching (never call getCollection() elsewhere)
src/utils/features/FeatureManager.ts  ← Register client-side features
config/features.ts        ← Runtime feature toggles (darkMode, comments, analytics…)
src/i18n/dictionaries/    ← Every user-visible string lives here (en + ka)
src/utils/core/ConcurrencyLimiter.ts  ← Wrap ALL Satori/Resvg OG calls to prevent OOM
```

Page routing: `src/pages/[locale]/` — all locale routes are DRY dynamic routes; never
duplicate pages under `en/` and `ka/` manually.

---

## Hard Rules (violations block CI)

| Rule                                                                        | Why                                                                |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| No `any` — use `unknown` + narrowing                                        | TS strict enforced by `astro check`                                |
| No `style=""` attributes — Tailwind utilities only                          | `components.css` via `@layer components` is the only escape        |
| No `getCollection()` outside `PostRepository`                               | Data-layer abstraction; all filtering/sorting lives there          |
| No hardcoded UI strings — always `getI18n(locale)` from `src/i18n/index.ts` | Both `en` and `ka` keys must be added atomically                   |
| No React/Vue/Svelte                                                         | 100 % Vanilla JS + Astro — no virtual DOM                          |
| No SSR / server runtime                                                     | Static output only; `@astrojs/vercel` adapter stays in static mode |
| `vercel.json` CSP must not be weakened                                      | No `unsafe-eval`; no removing existing directives                  |
| Animations inside `@media (prefers-reduced-motion: no-preference)`          | Accessibility                                                      |

---

## Key Patterns

### Adding a new feature flag

```typescript
// 1. config/features.ts — extend FeatureKey union and FeatureRegistry
export type FeatureKey = "darkMode" | "comments" | "myFeature";
// 2. Use in components
import { isFeatureEnabled } from "@/config/features";
{isFeatureEnabled("myFeature") && <MyFeature />}
// 3. Toggle via env (optional): PUBLIC_FEATURE_MY_FEATURE=true
```

### i18n string (always both locales in one commit)

```typescript
// src/i18n/dictionaries/en.ts  ← add key
// src/i18n/dictionaries/ka.ts  ← add translation
// Usage in .astro frontmatter:
const { t } = getI18n(locale); // import from src/i18n/index.ts
```

### OG image generation (must use limiter)

```typescript
import { ConcurrencyLimiter } from "@/utils/core/ConcurrencyLimiter";
const limiter = new ConcurrencyLimiter(2);
const png = await limiter.run(() => generateOgImages(post));
```

### Custom interactive element

```astro
<!-- Prefer Web Components over scattered listeners -->
<script>
  class MyWidget extends HTMLElement {
    connectedCallback() {
      /* ... */
    }
  }
  customElements.define("my-widget", MyWidget);
</script>
<my-widget data-testid="my-widget"></my-widget>
```

### FOUC-free scripts

```astro
<!-- Must be is:inline — no module imports allowed here -->
<script is:inline>
  const theme = localStorage.getItem("theme") ?? "light";
  document.documentElement.setAttribute("data-theme", theme);
</script>
```

### Layout slots

`hero` · `before-title` · `after-title` · `before-content` · `sidebar` · `after-content` — see `src/layouts/Main.astro`

---

## CSS & Styling

- `@container` for component-level responsiveness (not `@media`)
- `clamp()` for fluid typography/spacing
- `@apply` only inside `@layer components` in `src/styles/components.css`

## TypeScript Conventions

- `interface` over `type` for object shapes (compiler caching)
- No `enum` — use `const X = { ... } as const` or string-literal unions
- Exhaustive switches: use record lookups or `satisfies` to catch missing cases

---

## Developer Workflow

```bash
pnpm dev               # Dev server (NODE_ENV=development)
pnpm build:prod        # astro check → build → verify-build.js (full CI gate)
pnpm test:run          # Vitest unit tests
pnpm test:e2e          # Playwright (requires built site or dev server)
pnpm lint              # ESLint + Stylelint
pnpm format:check      # Prettier
```

**All 6 gates must be green before merging**: lint → format:check → build:prod → test:run → test:e2e → Husky pre-push.

New features require **both** `tests/unit/*.test.ts` (Vitest) **and** `tests/e2e/*.spec.ts` (Playwright). Add `data-testid` to every interactive element.

### Environment variables

Declare in `src/env/schema.ts` (Zod) and `config/env.ts`. The `envValidation` Astro integration will fail the build if an undeclared var is used.

---

## File Naming

- Astro components: `kebab-case.astro`
- TS utilities: `camelCase.ts` matching the subdomain folder (`src/utils/core/`, `src/utils/post/`, `src/utils/seo/`)
- Tests: `tests/unit/<module>.test.ts` · `tests/e2e/<feature>.spec.ts`
- New integrations: `src/integrations/<name>.ts` → register in `config/integrations.ts`

## Performance / SRE

- Avoid RegEx on critical paths — use char-by-char parsing (see `sanitizeMarkdownUrls.ts`)
- `ConcurrencyLimiter` is mandatory for any native-memory-heavy async batch (OG images, Resvg)
- Math rendering is **server-side KaTeX only** (`remark-math` + `rehype-katex`); no client-side fallback scripts
- Code blocks via **ExpressiveCode** (`astro-expressive-code`); raw `<pre>` with inline colours is forbidden
