# Natspaper Architecture Guide

> A comprehensive guide to the architecture patterns, design decisions, and
> extensibility mechanisms in Natspaper.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Component Architecture](#component-architecture)
3. [Feature Flag System](#feature-flag-system)
4. [Slot Strategy](#slot-strategy)
5. [Plugin Architecture](#plugin-architecture)
6. [Locale-Aware Routing (DRY Page Architecture)](#locale-aware-routing-dry-page-architecture)
7. [Data Flow](#data-flow)
8. [Extending the System](#extending-the-system)
9. [Best Practices](#best-practices)

---

## Architecture Overview

Natspaper follows **SOLID principles** with a focus on:

- **Single Responsibility**: Each component does one thing well
- **Open/Closed**: Extend via props and slots, don't modify
- **Liskov Substitution**: Components are interchangeable via consistent interfaces
- **Interface Segregation**: Small, focused prop interfaces
- **Dependency Inversion**: High-level components depend on abstractions
  (`FEATURES` config, `IPostRepository`), not concrete implementations

### Directory Structure

```
src/
├── config.ts        # Site identity, FEATURES flags, socials, navigation
├── types.ts         # Shared TypeScript interfaces (SiteConfig, FeaturesConfig, …)
├── components/
│   ├── ui/          # Dumb/Presentational (Breadcrumb, Hr, Icon, LinkButton, Pagination)
│   ├── features/    # Smart components (Comments, Analytics, Seo, ThemeManager)
│   ├── layout/      # Page chrome (Header, Footer, MobileMenu, NavMenu, NavLinks)
│   └── post/        # Post-specific (PostHero, PostContent, PostFooter, Tag, …)
├── layouts/         # Page templates with named slots (Layout, Main, PostDetails)
├── pages/           # Route handlers (data fetching via PostRepository)
├── utils/           # Pure functions and utilities
│   ├── core/        # ConcurrencyLimiter, slugify
│   ├── features/    # FeatureManager, ProgressBar, HeadingLinks
│   ├── i18n/        # Date formatting
│   ├── og/          # Satori/Resvg OG image generation
│   ├── post/        # PostRepository (data access layer)
│   ├── rss/         # RSS feed generation & sanitization
│   └── seo/         # Canonical URLs, structured data
├── i18n/            # Dictionaries & locale config
├── integrations/    # Custom Astro integrations (env validation)
├── styles/          # Tailwind CSS v4 layers (base, components, typography, global)
└── types/           # Ambient declarations (global.d.ts, modules.d.ts)

config/
├── env.ts           # Zod-validated env schema
├── integrations.ts  # Astro integrations registry
└── vite.ts          # Vite plugin configuration
```

---

## Component Architecture

### Smart vs Dumb Components

**Dumb Components** (`src/components/ui/`):

- Accept data via props
- No data fetching or side effects
- Pure rendering logic
- Examples: `Breadcrumb`, `Hr`, `Icon`, `LinkButton`, `Pagination`

```astro
<!-- ✅ Good: Dumb component receives data -->
<Breadcrumb
  items={[
    { label: "Home", href: `/${locale}` },
    { label: "Posts", href: `/${locale}/posts` },
    { label: title },
  ]}
/>
```

**Smart Components** (`src/components/features/`):

- May fetch data or have side effects
- Integrate with external services
- Handle feature flag logic
- Examples: `Comments`, `Analytics`, `Seo`, `ThemeManager`, `StructuredData`

```astro
<!-- ✅ Smart component handles its own logic -->
<Comments locale={locale} />
<Analytics />
```

### Composition Pattern

Prefer composition over inheritance:

```astro
<!-- ✅ Compose small components -->
<PostFooter
  {tags}
  {showEditPost}
  {editPostConfig}
  {post}
  {prevPost}
  {nextPost}
  {tTag}
  locale={Astro.currentLocale}
/>

<!-- ❌ Avoid: Monolithic components with many responsibilities -->
<PostPageWithFooterAndCommentsAndNavigation post={post} />
```

---

## Feature Flag System

The feature flag system lives in `src/config.ts` as the `FEATURES` export,
typed by `FeaturesConfig` in `src/types.ts`.

### Basic Usage

```typescript
import { FEATURES } from "@/config";

if (FEATURES.lightAndDarkMode) {
  // Render theme toggle
}

if (FEATURES.showArchives) {
  // Render archives navigation link
}
```

### Adding New Features

1. Add the field to `FeaturesConfig` in `src/types.ts`:

```typescript
export interface FeaturesConfig {
  // ... existing fields
  newsletter: boolean; // ← Add here
}
```

2. Set the default value in `src/config.ts`:

```typescript
export const FEATURES: FeaturesConfig = {
  // ... existing flags
  newsletter: false,
};
```

3. Use in components:

```astro
---
import { FEATURES } from "@/config";
---

{FEATURES.newsletter && <NewsletterForm />}
```

### Environment Overrides

For runtime-toggleable flags, read from `import.meta.env` in `src/config.ts`:

```typescript
export const FEATURES: FeaturesConfig = {
  newsletter: import.meta.env.PUBLIC_FEATURE_NEWSLETTER === "true",
  // ...
};
```

```env
# .env.production
PUBLIC_FEATURE_NEWSLETTER=true
```

---

## Slot Strategy

The layout system uses **named slots** for flexible content injection.

### Layout.astro Slots

```astro
<Layout title="My Page">
  <!-- Inject into <head> -->
  <script slot="head" type="module" src="/custom-script.js"></script>

  <!-- Page content -->
  <Main pageTitle="Welcome">...</Main>
</Layout>
```

### Main.astro Slots

| Slot             | Purpose                         | Example Use               |
| ---------------- | ------------------------------- | ------------------------- |
| `hero`           | Full-bleed content above main   | Landing page banners      |
| `before-title`   | Before the page title           | Breadcrumbs, back links   |
| `after-title`    | After title, before description | Reading time, author info |
| `before-content` | Before main content             | Share buttons, tags       |
| `sidebar`        | Right sidebar (desktop)         | Table of contents         |
| `after-content`  | After main content              | Comments, related posts   |
| (default)        | Main content area               | Article body              |

```astro
<Main pageTitle="Blog Post" layout="with-sidebar">
  <!-- Breadcrumb navigation -->
  <nav slot="before-title">
    <a href="/">Home</a> / <a href="/posts">Posts</a>
  </nav>

  <!-- Reading time badge -->
  <span slot="after-title">5 min read</span>

  <!-- Table of contents -->
  <TableOfContents slot="sidebar" headings={headings} />

  <!-- Article content -->
  <article>...</article>

  <!-- Comments section -->
  <Comments slot="after-content" postId={id} />
</Main>
```

---

## Plugin Architecture

Natspaper uses Astro's integration system for extensibility.

### Adding New Integrations

1. Create integration in `src/integrations/`:

```typescript
// src/integrations/myFeature.ts
import type { AstroIntegration } from "astro";

export function myFeatureIntegration(): AstroIntegration {
  return {
    name: "my-feature",
    hooks: {
      "astro:config:setup": ({ addMiddleware }) => {
        // Add middleware, inject scripts, etc.
      },
      "astro:build:done": ({ pages }) => {
        // Post-build processing
      },
    },
  };
}
```

2. Register in `config/integrations.ts`:

```typescript
import { myFeatureIntegration } from "../src/integrations/myFeature";

export function getIntegrations() {
  return [
    // ...existing integrations
    myFeatureIntegration(),
  ];
}
```

### Existing Integrations

| Integration      | Purpose                                    |
| ---------------- | ------------------------------------------ |
| `envValidation`  | Build-time environment variable validation |
| `sitemap`        | XML sitemap generation with i18n hreflang  |
| `expressiveCode` | Syntax highlighting for code blocks        |
| `Sonda`          | Bundle analysis (HTML + JSON reports)      |

---

## Locale-Aware Routing (DRY Page Architecture)

### Overview

To maintain the **DRY (Don't Repeat Yourself) principle**, all locale-specific
pages use **dynamic routing** through `src/pages/[locale]/`.

### Before (Duplicated Pages)

```
src/pages/
├── en/
│   ├── index.astro           # Duplicated
│   ├── archives/index.astro  # Duplicated
│   ├── tags/index.astro      # Duplicated
│   └── posts/[slug].astro    # Duplicated
└── ka/
    ├── index.astro           # Duplicated
    ├── archives/index.astro  # Duplicated
    ├── tags/index.astro      # Duplicated
    └── posts/[slug].astro    # Duplicated
```

**Problems:**

- Code duplication violates DRY principle
- Changes to Archives layout required editing 2 files
- Harder to maintain consistency
- Increased file count and complexity

### After (Dynamic Routing)

```
src/pages/
├── index.astro                     # Root redirect → /en/
├── robots.txt.ts                   # SEO: robots.txt
├── api/
│   └── health.json.ts              # Uptime monitoring endpoint
└── [locale]/
    ├── index.astro                 # Handles /en and /ka
    ├── 404.astro                   # Localized error page
    ├── rss.xml.ts                  # Per-locale RSS feed
    ├── archives/index.astro        # Handles /en/archives and /ka/archives
    ├── tags/
    │   ├── index.astro             # Tag listing
    │   └── [tag]/[...page].astro   # Tag pagination
    └── posts/
        ├── [slug].astro            # Handles all posts
        ├── [...page].astro         # Handles pagination
        ├── [...file].md.ts         # Handles .md redirects
        ├── [...catch].ts           # Handles 404s
        └── [slug].png.ts           # Handles OG images
```

### Implementation Pattern

**Single dynamic page replaces duplicates:**

```astro
---
import type { GetStaticPaths } from "astro";
import { SUPPORTED_LANGS, DEFAULT_LANG } from "@/i18n/config";
import type { Lang } from "@/i18n";

// 1. Generate paths for all supported locales
export const getStaticPaths = (() => {
  return SUPPORTED_LANGS.map(locale => ({
    params: { locale },
  }));
}) satisfies GetStaticPaths;

// 2. Extract locale from URL parameters
const locale = (
  SUPPORTED_LANGS.includes(Astro.params.locale as Lang)
    ? Astro.params.locale
    : DEFAULT_LANG
) as Lang;

// 3. Use locale-aware queries and content
const posts = await PostRepository.getByLocale(locale);

// 4. Define localized content
const contentByLocale: Record<Lang, object> = {
  en: {
    /* English content */
  },
  ka: {
    /* Georgian content */
  },
};

const content = contentByLocale[locale];
---

<!-- Render page with locale-aware content -->
```

### Benefits

✅ **No Code Duplication** - Single page handles all locales
✅ **Easy Maintenance** - Fix Archives layout in one place
✅ **Consistent Behavior** - All locales use identical logic
✅ **Scalable** - Adding new locales requires no new pages
✅ **Type-Safe** - TypeScript ensures all locales are defined
✅ **Testable** - Single source to test

---

## Data Flow

### Content Collection Pipeline

```
1. Markdown/MDX Files (src/content/blog/{locale}/)
        ↓
2. Content Collection (Astro, validated by src/content.config.ts)
        ↓
3. PostRepository (src/utils/post/repository.ts)
        ↓
4. Page Components (src/pages/[locale]/)
        ↓
5. UI Components (src/components/)
```

### PostRepository Pattern

All post-related data access goes through `PostRepository`, which implements
the `IPostRepository` interface (Dependency Inversion):

```typescript
import { PostRepository } from "@/utils/post/repository";

// Get all published posts (sorted, drafts excluded)
const posts = await PostRepository.getSorted();

// Get posts for a specific locale
const enPosts = await PostRepository.getByLocale("en");

// Get posts with cross-locale fallback
const kaPosts = await PostRepository.getByLocaleWithFallback("ka");

// Get posts by tag
const taggedPosts = await PostRepository.getByTag("astro");

// Get featured posts
const featured = await PostRepository.getFeatured();

// Get series parts
const seriesParts = await PostRepository.getSeries("system-design", "en");
```

**Why?**

- Single source of truth for post queries
- `IPostRepository` abstraction enables test doubles without mocking Astro
- Easy to add caching, filtering, or transformations
- Swappable implementation (e.g., future Headless CMS migration)

---

## Extending the System

### Adding a New Page Type

1. Create the content collection schema in `src/content.config.ts`
2. Add repository methods to `IPostRepository` and implement in `repository.ts`
3. Create page templates in `src/pages/[locale]/`
4. Add UI components as needed

### Adding a New UI Component

1. Create component in `src/components/ui/`
2. Follow the dumb component pattern (props in, markup out)
3. Import directly where needed (no barrel file)
4. Document props with JSDoc comments

<!-- prettier-ignore -->
```astro
---
/**
 * MyComponent - Brief description
 *
 * @example
 * <MyComponent variant="primary">Content</MyComponent>
 */
export interface Props {
  /** Description of prop */
  variant?: "primary" | "secondary";
}

const { variant = "primary" } = Astro.props;
---

<div class:list={["my-component", `variant-${variant}`]}>
  <slot />
</div>
```

### Adding Feature Flags for New Features

1. Add the field to `FeaturesConfig` interface in `src/types.ts`
2. Set the default value in `FEATURES` object in `src/config.ts`
3. Use `FEATURES.<flagName>` in components
4. Document in this guide

---

## Best Practices

### Do's ✅

- Use composition over inheritance
- Keep components small and focused
- Use named slots for flexible layouts
- Feature-flag new functionality via `FEATURES` in `src/config.ts`
- Test with the existing test suite (Vitest + Playwright)
- Document prop interfaces with JSDoc
- Route all content access through `PostRepository`
- Add `data-testid` to every interactive element

### Don'ts ❌

- Don't fetch data in UI components (`src/components/ui/`)
- Don't call `getCollection()` outside `PostRepository`
- Don't modify core components directly
- Don't hardcode feature states or UI strings
- Don't duplicate styling across components
- Don't skip type annotations (`any` is forbidden)
- Don't use `enum` — use `const` objects with `as const`

---

## Further Reading

- [Astro Documentation](https://docs.astro.build)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
- [CSS Container Queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries)
- [Astro Content Collections](https://docs.astro.build/en/guides/content-collections/)
