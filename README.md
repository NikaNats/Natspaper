<br/>

<div align="center">
  <h1>Natspaper</h1>
  <p>
    <b>An academically-focused, performance-obsessed blog platform built with Astro and TypeScript.</b>
  </p>
  <p>Engineered for speed, security, and a world-class writing experience.</p>
  <br/>
  <a href="https://natspaper.vercel.app/" target="_blank" rel="noopener"><strong>View Live Demo »</strong></a>
  <br/>
  <br/>

[![CI/CD Pipeline](https://github.com/NikaNats/Natspaper/actions/workflows/cd-deploy.yml/badge.svg)](https://github.com/NikaNats/Natspaper/actions/workflows/cd-deploy.yml)
[![Astro](https://img.shields.io/badge/Astro-5.16-E53512?logo=astro)](https://astro.build/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![Code Style](https://img.shields.io/badge/Code_Style-Prettier-F7B93E?logo=prettier)](https://prettier.io/)
[![License](https://img.shields.io/badge/License-MIT-green)](./LICENSE)

</div>

**Natspaper** is a statically-generated blog platform designed for technical writers, academics, and developers who demand uncompromising performance and precision. It combines a minimal, content-first design with a powerful, modern tech stack to deliver instant page loads, flawless math rendering, and a seamless developer experience.

---

## Tech Stack

| Category       | Technology                                                                                                                 |
| :------------- | :------------------------------------------------------------------------------------------------------------------------- |
| **Framework**  | [Astro 5.16](https://astro.build/) (Static-Site Generation)                                                                |
| **Language**   | [TypeScript 5.9](https://www.typescriptlang.org/) (Strict Mode)                                                            |
| **Styling**    | [Tailwind CSS v4](https://tailwindcss.com/)                                                                                |
| **OG Images**  | [Satori](https://github.com/vercel/satori) + [Resvg](https://github.com/nickel-city/resvg-js) (Concurrent-safe generation) |
| **Validation** | [Zod](https://zod.dev/) (Content Collections)                                                                              |
| **Comments**   | [Giscus](https://giscus.app/) (GitHub Discussions)                                                                         |
| **Testing**    | [Vitest](https://vitest.dev/) (Unit/Integration) + [Playwright](https://playwright.dev/) (E2E)                             |
| **Analytics**  | [Vercel Analytics](https://vercel.com/analytics) + Speed Insights                                                          |

---

## Key Features

| Feature                    | Description                                                                                                                                  |
| :------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------- |
| **⚡️ Instant Performance** | Statically-generated HTML. No server, no database, no lag.                                                                                   |
| **✍️ Flawless LaTeX**      | Server-side **KaTeX** rendering for beautiful, accessible math (`$E=mc^2$`).                                                                 |
| **🎨 FOUC-Free Dark Mode** | Automatic theme detection with persistence. A critical inline script prevents any "flash."                                                   |
| **🌐 Advanced i18n**       | Locale-aware routing (`/[locale]/...`) with automatic fallback logic via `PostRepository`. See [ARCHITECTURE.md](./ARCHITECTURE.md).         |
| **🖼️ Dynamic OG Images**   | Concurrent-safe generation using **Satori/Resvg** with a `ConcurrencyLimiter` to prevent OOM during builds.                                  |
| **🔒 Hardened Security**   | Strict CSP, security headers (`HSTS`, `X-Frame-Options`), and a custom `verify-build.js` script. See [SECURITY.md](./SECURITY.md).           |
| **🧩 Feature Flags**       | Toggleable features (dark mode, comments, analytics) via a type-safe `FEATURES` object in `src/config.ts`.                                   |
| **🏛️ Clean Architecture**  | "Smart vs. Dumb" component pattern. High-level logic depends on abstractions, not implementations. See [ARCHITECTURE.md](./ARCHITECTURE.md). |

---

## Getting Started

### Prerequisites

- **Node.js** `v20.x` or higher
- **pnpm** `v10.x` or higher

### 1. Clone & Install

```bash
git clone https://github.com/NikaNats/Natspaper.git
cd Natspaper
pnpm install
```

### 2. Configure Environment

The build **will fail** if environment validation detects missing critical variables. The validation logic lives in `config/env.ts` and is executed by `src/integrations/envValidation.ts`.

```bash
# Create a local environment file (ignored by Git)
cp .env.example .env.local
```

### 3. Start Development Server

```bash
pnpm dev
```

Your site is now running at `http://localhost:4321`.

---

## Project Structure

```
├── config/                 # Build-time configuration
│   ├── env.ts              # Zod-validated env schema
│   └── integrations.ts     # Astro integrations
│
├── src/
│   ├── config.ts           # Site identity, FEATURES flags, socials, navigation
│   ├── components/
│   │   ├── ui/             # Dumb (presentational) components
│   │   └── features/       # Smart components (logic, integrations)
│   ├── content/blog/       # Markdown posts (organized by locale)
│   ├── i18n/               # Dictionaries & locale config
│   ├── integrations/       # Custom Astro integrations (env validation)
│   ├── layouts/            # Page templates with named slots
│   ├── pages/[locale]/     # DRY, locale-aware dynamic routing
│   └── utils/
│       ├── core/           # ConcurrencyLimiter, slugify
│       ├── og/             # Satori/Resvg OG image generation
│       ├── post/           # PostRepository (data access layer)
│       ├── seo/            # Canonical URLs, meta tags
│       └── rss/            # RSS feed generation
│
├── tests/
│   ├── unit/               # Vitest: utilities, pure functions
│   ├── integration/        # Vitest: pipeline flows
│   └── e2e/                # Playwright: accessibility, dark mode
│
└── scripts/
    └── verify-build.js     # SRE guardrail: validates build artifacts
```

---

## Testing Pyramid

Natspaper employs a multi-layered testing strategy to guarantee stability.

| Layer           | Tool              | Scope                                                      |
| :-------------- | :---------------- | :--------------------------------------------------------- |
| **Unit**        | Vitest            | Pure utilities (`slugify`, `i18n`, `rss`).                 |
| **Integration** | Vitest            | Pipeline flows (`tests/integration/fullPipeline.test.ts`). |
| **E2E**         | Playwright        | User journeys: accessibility, dark mode, navigation, i18n. |
| **Build Guard** | `verify-build.js` | Validates critical artifacts (HTML, CSS, sitemap) exist.   |

```bash
# Run all tests
pnpm test:all

# Run specific suites
pnpm test:run       # Unit & Integration
pnpm test:e2e       # Playwright E2E
```

---

## Commands

| Command             | Description                                        |
| :------------------ | :------------------------------------------------- |
| `pnpm dev`          | Start dev server with hot-reloading.               |
| `pnpm build`        | Production build + type-check + `verify-build.js`. |
| `pnpm preview`      | Preview the production build locally.              |
| `pnpm test:all`     | Run all unit, integration, and E2E tests.          |
| `pnpm lint`         | Lint with ESLint.                                  |
| `pnpm format:check` | Check formatting with Prettier.                    |
| `pnpm astro check`  | Validate TypeScript and Astro types.               |

---

## Deployment

### Vercel (Recommended)

1.  Push your repository to GitHub.
2.  Import the project on your [Vercel dashboard](https://vercel.com/).
3.  Add required environment variables in **Settings → Environment Variables**:
    - `SITE_WEBSITE`: Your production URL (e.g., `https://your-domain.com`).

The CI/CD workflows in `.github/workflows/` handle preview and production deployments automatically.

---

## Acknowledgements

Natspaper draws inspiration from:

- **[Hugo PaperMod](https://github.com/adityatelange/hugo-PaperMod)** — Academic-inspired aesthetic.
- **[Astro Paper](https://github.com/satnaing/astro-paper)** — Best practices for Astro blog themes.

---

## License

This project is licensed under the **MIT License**. See [LICENSE](./LICENSE) for details.
