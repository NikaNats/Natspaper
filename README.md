# Nika Natsvlishvili: The Natspaper Blog

**Natspaper** is my personal, high-performance blog and portfolio platform built entirely with **Astro**. It is designed for maximum speed, maintainability, and security, using the **Static Site Generation (SSG)** paradigm to achieve unparalleled metrics in Core Web Vitals.

The aesthetic follows a **Scholarly Minimalist** design philosophy, perfect for technical articles, complex architectural discussions, and academic content featuring **LaTeX** math rendering.

[![Natspaper Version](https://img.shields.io/badge/Natspaper-5.5.0-blue)](https://github.com/NikaNats/Natspaper)
[![Astro Version](https://img.shields.io/badge/Astro-5.15.1-E53512?logo=astro)](https://astro.build/)
[![TypeScript Version](https://img.shields.io/badge/TypeScript-5.9.3-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Test Quality](https://img.shields.io/badge/QA%20Pipeline-Passing-2ECC71)](./tests)
[![License](https://img.shields.io/badge/License-MIT-green)](./LICENSE)

---

## 💡 Core Architectural Principles

This platform operates on a **Static-First** architectural model to ensure stability and top-tier performance.

| Principle                        | Description                                                                                                                                     | Nika's Benefit                                                                                            |
| :------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------- |
| **Compile-Time Rendering (SSG)** | All HTML is generated once during the `pnpm build` phase. There is no server-side rendering (SSR) at request time.                              | **Maximum Security** (no runtime server) and **Zero Hosting Costs** (served instantly from a Vercel CDN). |
| **Astro Islands**                | Minimal client-side JavaScript is shipped. Only interactive UI elements (like the theme toggle or search bar) are "hydrated" (shipped with JS). | **Lightning Fast TTI** and minimal browser resource consumption.                                          |
| **Content as Data**              | All blog content resides in type-safe Markdown files (`src/data`), validated by TypeScript schemas.                                             | Guarantees data integrity and predictability across the build pipeline.                                   |
| **Concurrency Control**          | A custom `ConcurrencyLimiter` serializes resource-heavy tasks (e.g., dynamic OG image generation with Resvg/Satori) during the build.           | Prevents **Out-of-Memory (OOM) errors** and stabilizes the CI/CD pipeline under heavy load.               |

## 🌟 Key Features

### Content & Academic Focus

- **📝 Full LaTeX Support:** Flawless rendering of inline (`$E=mc^2$`) and block mathematical equations using **KaTeX**.
- **🖼️ Dynamic OG Images:** Automated generation of visually consistent Open Graph images based on the post title for superior social media sharing.
- **🏷️ Efficient Content Management:** Content organization by tags and publication dates, including timezone-aware scheduled post filtering (`Asia/Tbilisi`).

### Performance & User Experience

- **⚡ Zero-JS Default:** Achieves best-in-class Lighthouse scores by shipping only necessary code.
- **🌓 Seamless Theming:** Automatic Dark/Light mode toggle with persistence, preventing FOUC (Flash of Unstyled Content).
- **🔍 Static Search (Pagefind):** Fast, client-side, dependency-free search functionality indexed during build time.

### Security & Maintainability

- **🧪 Robust QA Pipeline:** Integration of **Vitest** (Unit/Integration) and **Playwright** (E2E) ensures platform stability and prevents regressions.
- **🔒 Hardened Security:** Custom middleware applies strict **Content Security Policy (CSP)** headers to mitigate XSS and clickjacking risks.
- **📊 Sentry Integration:** Integrated monitoring for client-side and server-side error tracking.

## ⚙️ Tech Stack & Dependencies

| Category          | Tool                                                                                     | Functionality                                    |
| :---------------- | :--------------------------------------------------------------------------------------- | :----------------------------------------------- |
| **Framework**     | [Astro](https://astro.build/) v5.15                                                      | Core SSG Engine                                  |
| **Language**      | [TypeScript](https://www.typescriptlang.org/) v5.9                                       | Type Safety and Code Reliability                 |
| **Styling**       | [Tailwind CSS](https://tailwindcss.com/) v4.1                                            | Utility-First Theming and Layout                 |
| **Math**          | [KaTeX](https://katex.org/) v0.16                                                        | Fast Mathematical Typesetting                    |
| **Testing**       | [Vitest](https://vitest.dev/) / [Playwright](https://playwright.dev/)                    | Comprehensive Unit, Integration, and E2E Testing |
| **Monitoring**    | [Sentry](https://sentry.io/)                                                             | Performance and error tracking                   |
| **OG Generation** | [Satori](https://github.com/vercel/satori) / [Resvg](https://github.com/yisibl/resvg-js) | Generates PNGs from HTML/CSS during build        |

## 📋 Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- [pnpm](https://pnpm.io/) (managed by Corepack)
- [Git](https://git-scm.com/)

## 🛠️ Getting Started

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/NikaNats/Natspaper.git
cd natspaper

# Install dependencies
pnpm install

# Note: This project uses pnpm for package management.
# If you don't have pnpm installed, install it via:
# npm install -g pnpm
```

### 2. Local Development

```bash
# Start the development server (uses .env.development)
pnpm dev
# Access at http://localhost:4321

# The development environment is pre-configured with:
# - SITE_WEBSITE: http://localhost:4321
# - Full error tracing enabled (100%)
# - All development features active
```

# - 100% error tracing for debugging

````

### 3. Production Build

To generate the optimized static files (HTML, CSS, assets, and the Pagefind search index):

```bash
# Production build (uses .env.production)
pnpm build:prod

# Or use the shorthand alias
pnpm build

# Output is saved to the /dist directory.
````

### 4. Preview Production Build

To preview the production build locally before deployment:

```bash
# Build and preview with production configuration
pnpm preview
# Access at http://localhost:3000 (or shown in terminal)
```

## 📝 Configuration

### Environment Files

This project uses **environment-specific configuration files** following the "one codebase, many configurations" principle.

#### Development Environment (`.env.development`)

```env
# Used when running: pnpm dev or pnpm build:dev
SITE_WEBSITE=http://localhost:4321
PUBLIC_SENTRY_ENVIRONMENT=development
PUBLIC_SENTRY_TRACES_SAMPLE_RATE=1.0
```

**Use this for:**

- Local development (`pnpm dev`)
- Testing builds locally (`pnpm build:dev`)

#### Production Environment (`.env.production`)

```env
# Used when running: pnpm build:prod or pnpm preview
SITE_WEBSITE=https://natspaper.vercel.app
PUBLIC_SENTRY_ENVIRONMENT=production
PUBLIC_SENTRY_TRACES_SAMPLE_RATE=0.1
```

**Use this for:**

- Production builds (`pnpm build:prod`)
- Production preview (`pnpm preview`)

#### Template File (`.env.example`)

A template showing all available environment variables. Used by new developers to understand the configuration structure.

### Available npm Scripts

| Script            | Environment | Purpose                                |
| ----------------- | ----------- | -------------------------------------- |
| `pnpm dev`        | Development | Start dev server with localhost config |
| `pnpm build:dev`  | Development | Build with development configuration   |
| `pnpm build:prod` | Production  | Full production build with pagefind    |
| `pnpm build`      | Production  | Alias for `build:prod`                 |
| `pnpm preview`    | Production  | Preview production build locally       |

### Environment Variables Reference

**Core Configuration:**

- `SITE_WEBSITE` (Required): Your public domain URL used for RSS, Sitemaps, and canonical URLs
  - Development: `http://localhost:4321`
  - Production: `https://natspaper.vercel.app`

**Optional Sentry Monitoring:**

- `PUBLIC_SENTRY_DSN`: Client-side Sentry DSN (safe to expose)
- `SENTRY_DSN`: Server-side Sentry DSN (kept private)
- `SENTRY_AUTH_TOKEN`: For uploading source maps
- `PUBLIC_SENTRY_ENVIRONMENT`: Environment label for Sentry
- `PUBLIC_SENTRY_TRACES_SAMPLE_RATE`: Percentage of requests to trace (0.0 to 1.0)

**Analytics & SEO:**

- `PUBLIC_GOOGLE_SITE_VERIFICATION`: Google Search Console verification token

See `.env.example` for the complete list of available variables.

### Site Customization (`src/config.ts`)

This central file controls global settings, author information, and feature flags.

```typescript
export const SITE = {
  website: "...",
  author: "Nika Natsvlishvili",
  title: "Nika Natsvlishvili",
  timezone: "Asia/Tbilisi",
  dynamicOgImage: true,
  // ... other flags (showArchives, lightAndDarkMode)
} as const;
```

## 🧪 Quality Assurance & Testing

All tests are run via the `pnpm test` family of scripts, as defined in `package.json`.

| Test Type              | Tool              | Purpose                                                                                                                               | Command                           |
| :--------------------- | :---------------- | :------------------------------------------------------------------------------------------------------------------------------------ | :-------------------------------- |
| **Unit / Integration** | Vitest            | Validate core utilities (sorting, reading time, content grouping) and complex logic (font caching, concurrency control).              | `pnpm test:run`                   |
| **End-to-End (E2E)**   | Playwright        | Simulate real user navigation, check accessibility, verify asset loading, and ensure interactive features work across major browsers. | `pnpm test:e2e`                   |
| **Code Quality**       | ESLint / Prettier | Enforce strict code standards and formatting consistency.                                                                             | `pnpm lint` & `pnpm format:check` |
| **Type Check**         | Astro Check       | Compile-time validation of all Astro components and TypeScript files.                                                                 | `pnpm astro check`                |

## 🏗️ Project Structure Deep Dive

```
natspaper/
├── src/
│   ├── components/      # Reusable Astro, React, or Svelte Islands
│   ├── content/         # Astro Content Collections setup (DB schema definition)
│   ├── data/            # Your Markdown blog posts (The "Database")
│   ├── env/             # Centralized environment management (schema & loader)
│   ├── layouts/         # Master page templates (Layout, Main, PostDetails)
│   ├── middleware/      # Server-side security headers and Sentry pipeline
│   ├── pages/           # Route definitions (e.g., /posts, /tags, /search)
│   ├── styles/          # Theming, typography, and utility CSS
│   └── utils/           # Critical business logic (Post sorting, slugify, OG generation)
├── tests/               # Dedicated directory for all unit, integration, and e2e tests
├── scripts/             # Node.js scripts for pipeline tasks (e.g., verify-build.js)
├── .github/workflows/   # Full CI/CD automation and quality gates
├── .env.development     # Development environment configuration
├── .env.production      # Production environment configuration
├── .env.example         # Template for environment variables
└── astro.config.ts      # Main configuration hub
```

## 🚀 Deployment

The recommended deployment platform is **Vercel** due to its superior performance for static sites and functions-as-a-service architecture, directly supporting the project's build process.

### Vercel Setup

1. **Connect Your Repository:** Push this project to GitHub and connect it to Vercel.

2. **Configure Environment Variables in Vercel Dashboard:**

   Go to **Project Settings → Environment Variables** and add:

   **Production Variables:**

   ```
   SITE_WEBSITE = https://natspaper.vercel.app
   PUBLIC_SENTRY_ENVIRONMENT = production
   PUBLIC_SENTRY_TRACES_SAMPLE_RATE = 0.1
   ```

   **Optional Sentry Variables (if using error tracking):**

   ```
   SENTRY_AUTH_TOKEN = your_sentry_auth_token
   SENTRY_DSN = your_sentry_server_dsn
   PUBLIC_SENTRY_DSN = your_sentry_public_dsn
   ```

3. **Automatic Deployments:**
   - The GitHub workflows (`.github/workflows/cd-deploy.yml` for production and `preview.yml` for preview) handle automated deployments on push
   - Each push runs pre-deployment QA checks (linting, type checking, testing)
   - Production builds use `pnpm run build:prod` which applies production environment configuration

### Local Deployment Testing

Before deploying to production, test the production build locally:

```bash
# Build with production configuration
pnpm build:prod

# Preview the production build
pnpm preview
```

If the build succeeds locally with `pnpm build:prod`, it will succeed on Vercel.

### Docker Fallback

A multi-stage `Dockerfile` is provided for standard container deployments (Nginx serving static `/dist`).

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

This project builds upon the robust ecosystem provided by Astro and the open-source community. Special thanks to the creators of KaTeX and Pagefind for their high-quality libraries.

### 🎨 Inspiration & Background

Natspaper draws inspiration from several excellent open-source projects in the static site generation space:

- **[Hugo PaperMod](https://github.com/adityatelange/hugo-PaperMod)**: A clean, fast Hugo theme that provided the foundational design philosophy for Natspaper's academic-inspired aesthetic and performance-first approach.
- **[Astro Paper](https://github.com/satnaing/astro-paper)**: An Astro-based blog theme that demonstrated best practices for Astro SSG implementation, content management, and modern web development patterns.

These projects served as valuable references during Natspaper's development, helping shape its architecture, design decisions, and feature set while building upon Astro's unique capabilities.
