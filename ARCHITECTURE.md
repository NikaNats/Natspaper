# Natspaper Architecture Guide

> A comprehensive guide to the architecture patterns, design decisions, and extensibility mechanisms in Natspaper.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Component Architecture](#component-architecture)
3. [Feature Flag System](#feature-flag-system)
4. [Slot Strategy](#slot-strategy)
5. [Plugin Architecture](#plugin-architecture)
6. [Data Flow](#data-flow)
7. [Extending the System](#extending-the-system)

---

## Architecture Overview

Natspaper follows **SOLID principles** with a focus on:

- **Single Responsibility**: Each component does one thing well
- **Open/Closed**: Extend via props and slots, don't modify
- **Liskov Substitution**: Components are interchangeable via consistent interfaces
- **Interface Segregation**: Small, focused prop interfaces
- **Dependency Inversion**: High-level components depend on abstractions (feature flags, configs)

### Directory Structure

```
src/
├── components/
│   ├── ui/          # Dumb/Presentational components (Grid, Card, Section)
│   ├── features/    # Smart components with logic (Comments, Analytics)
│   └── common/      # Shared utilities (Header, Footer)
├── layouts/         # Page templates with named slots
├── pages/           # Route handlers (data fetching)
├── utils/           # Pure functions and utilities
├── types/           # Shared TypeScript interfaces
└── config.ts        # Centralized configuration

config/
├── features.ts      # Feature flag system
├── integrations.ts  # Astro integrations
├── env.ts           # Environment schema
└── index.ts         # Barrel exports
```

---

## Component Architecture

### Smart vs Dumb Components

**Dumb Components** (`src/components/ui/`):

- Accept data via props
- No data fetching or side effects
- Pure rendering logic
- Examples: `Grid`, `Card`, `Section`

```astro
<!-- ✅ Good: Dumb component receives data -->
<Grid cols="responsive">
  {posts.map(post => <PostCard {...post} />)}
</Grid>
```

**Smart Components** (`src/components/features/`):

- May fetch data or have side effects
- Integrate with external services
- Handle feature flag logic
- Examples: `Comments`, `Analytics`, `Seo`

```astro
<!-- ✅ Smart component handles its own logic -->
<Comments postId={post.id} />
```

### Composition Pattern

Prefer composition over inheritance:

```astro
<!-- ✅ Compose small components -->
<Section title="Recent Posts">
  <Grid cols="3">
    {
      posts.map(post => (
        <Card variant="elevated" interactive>
          <PostCard {...post} />
        </Card>
      ))
    }
  </Grid>
</Section>

<!-- ❌ Avoid: Monolithic components with many responsibilities -->
<PostGridSection posts={posts} variant="elevated" cols={3} />
```

---

## Feature Flag System

The feature flag system (`config/features.ts`) provides:

### Basic Usage

```typescript
import { isFeatureEnabled } from "@/config/features";

if (isFeatureEnabled("newsletter")) {
  // Render newsletter form
}
```

### Adding New Features

1. Add the feature key to `FeatureKey` type:

```typescript
export type FeatureKey = "darkMode" | "search" | "newsletter"; // ← Add here
// ...
```

2. Define the feature in `FeatureRegistry`:

```typescript
export const FeatureRegistry: Record<FeatureKey, FeatureDefinition> = {
  newsletter: {
    description: "Newsletter subscription form",
    defaultEnabled: false,
    envKey: "PUBLIC_FEATURE_NEWSLETTER",
    requires: ["analytics"], // Optional: dependencies
  },
};
```

3. Use in components:

```astro
---
import { isFeatureEnabled } from "@/config/features";
---

{isFeatureEnabled("newsletter") && <NewsletterForm />}
```

### Environment Overrides

Features can be toggled via environment variables:

```env
# Enable in production only
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

| Integration      | Purpose                                 |
| ---------------- | --------------------------------------- |
| `envValidation`  | Runtime environment variable validation |
| `sitemap`        | XML sitemap generation                  |
| `expressiveCode` | Syntax highlighting for code blocks     |
| `sentry`         | Error tracking (production only)        |

---

## Data Flow

### Content Collection Pipeline

```
1. Markdown/MDX Files (src/content/)
        ↓
2. Content Collection (Astro)
        ↓
3. PostRepository (src/utils/post/repository.ts)
        ↓
4. Page Components (src/pages/)
        ↓
5. UI Components (src/components/)
```

### PostRepository Pattern

All post-related data access goes through `PostRepository`:

```typescript
import PostRepository from "@/utils/post/repository";

// Get all published posts
const posts = await PostRepository.getPublished();

// Get posts by tag
const taggedPosts = await PostRepository.getByTag("astro");

// Get recent posts
const recent = await PostRepository.getRecent(5);
```

**Why?**

- Single source of truth for post queries
- Easy to add caching, filtering, or transformations
- Testable without mocking content collections

---

## Extending the System

### Adding a New Page Type

1. Create the content collection schema in `src/content.config.ts`
2. Add repository methods for the new content type
3. Create page templates in `src/pages/`
4. Add UI components as needed

### Adding a New UI Component

1. Create component in `src/components/ui/`
2. Follow the dumb component pattern (props in, markup out)
3. Export from `src/components/ui/index.ts`
4. Document props with JSDoc comments

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

1. Add to `FeatureKey` type in `config/features.ts`
2. Define in `FeatureRegistry` with description and default
3. Use `isFeatureEnabled()` in components
4. Document in this guide

---

## Best Practices

### Do's ✅

- Use composition over inheritance
- Keep components small and focused
- Use named slots for flexible layouts
- Feature-flag new functionality
- Test with the existing test suite
- Document prop interfaces

### Don'ts ❌

- Don't fetch data in UI components
- Don't modify core components directly
- Don't hardcode feature states
- Don't duplicate styling across components
- Don't skip type annotations

---

## Further Reading

- [Astro Documentation](https://docs.astro.build)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
- [Component Composition](https://reactjs.org/docs/composition-vs-inheritance.html)
