<br/>

<div align="center">
  <img src="https://raw.githubusercontent.com/NikaNats/Natspaper/main/public/favicon.svg" alt="Natspaper Logo" width="100" />
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
[![Astro Version](https://img.shields.io/badge/Astro-5.15.5-E53512?logo=astro)](https://astro.build/)
[![TypeScript Version](https://img.shields.io/badge/TypeScript-5.9.3-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Test Quality](https://img.shields.io/badge/QA%20Pipeline-Passing-2ECC71)](./tests)
[![License](https://img.shields.io/badge/License-MIT-green)](./LICENSE)

</div>

**Natspaper** is a statically-generated blog platform designed for technical writers, academics, and developers who demand uncompromising performance and precision. It combines a minimal, content-first design with a powerful, modern tech stack to deliver instant page loads, flawless math rendering, and a seamless developer experience.

## Core Philosophy

This project is built on three pillars: performance, quality, and experience.

- **🚀 Built for Speed:** Every architectural decision prioritizes performance. By leveraging Astro's static-site generation, shipping minimal JavaScript, and optimizing assets at build time, Natspaper achieves near-perfect Lighthouse scores and a snappy user experience.
- **🛡️ Engineered for Quality:** A comprehensive testing suite (unit, integration, and E2E), strict TypeScript, and automated quality checks ensure the codebase is stable, maintainable, and reliable. Security is hardened with a strict Content Security Policy (CSP) and automated monitoring.
- **✍️ Designed for Writers:** The focus is on the content. A clean, distraction-free UI, first-class LaTeX support, and a simple Markdown-based workflow make writing and publishing a pleasure.

## Features at a Glance

| Feature                         | Description                                                                                               |
| :------------------------------ | :-------------------------------------------------------------------------------------------------------- |
| **⚡️ Instant Performance**     | Statically-generated HTML with Astro. No server, no database, no lag.                                     |
| **✍️ Flawless LaTeX Rendering** | Server-side KaTeX rendering for beautiful, accessible math equations (`$E=mc^2$`).                        |
| **🎨 FOUC-Free Dark Mode**      | Automatic theme detection with persistence. A critical inline script prevents any "flash" on page load.   |
| **🌐 Advanced i18n Support**    | SEO-friendly routing for multiple languages (`/en/`, `/ka/`) with automatic browser language detection.   |
| **🖼️ Dynamic OG Images**        | Automatically generates beautiful social media preview cards for every post, enhancing shareability.      |
| **🔒 Hardened Security**        | Strict Content Security Policy (CSP) and other security headers configured for production environments.   |
| **🔍 Blazing-Fast Search**      | Client-side full-text search powered by Pagefind, delivering instant results without a server round-trip. |
| **✅ Comprehensive Testing**    | Unit, integration, and E2E tests with Vitest and Playwright ensure exceptional code quality.              |

## 🚀 Getting Started

### Prerequisites

- Node.js `v20.x` or higher
- pnpm `v10.x` or higher
- Git

### 1. Set Up Your Local Environment

Clone the repository and install the dependencies.

```bash
# Clone the repository
git clone https://github.com/NikaNats/Natspaper.git
cd Natspaper

# Install dependencies with pnpm
pnpm install

# Create a local environment file from the example
cp .env.example .env.local
```

### PNPM lockfile and CI notes

The project's CI runs `pnpm install` with `--frozen-lockfile` which will fail if `package.json` changes but `pnpm-lock.yaml` is not updated. When you add or remove dependencies locally, update the lockfile and commit it before pushing:

```bash
# Regenerate lockfile if dependencies changed
pnpm install

# Commit package.json and pnpm-lock.yaml
git add package.json pnpm-lock.yaml
git commit -m "chore: update dependencies"
```

If you must update dependencies in a CI job where `--frozen-lockfile` is enforced, temporarily run:

```bash
pnpm install --no-frozen-lockfile --prefer-offline
```

Then commit the lockfile changes and rerun CI.

### 2. Start the Development Server

Launch the Astro development server with hot-reloading.

```bash
pnpm dev
```

Your site is now running at `http://localhost:4321`.

### 3. Write Your First Post

Create a new Markdown file in `src/content/blog/en/your-first-post.md` and add the following content:

```yaml
---
title: "My First Post"
pubDatetime: 2024-10-28T10:00:00Z
description: "This is the beginning of my new technical blog!"
tags:
  - "getting-started"
  - "astro"
---
Welcome to my new blog! This content is written in Markdown.
```

Save the file, and your new post will instantly appear on the site.

## 📋 Commands Cheat Sheet

Natspaper includes a suite of scripts to streamline development, testing, and production builds.

| Command             | Description                                               |
| :------------------ | :-------------------------------------------------------- |
| `pnpm dev`          | Start the development server with hot-reloading.          |
| `pnpm build`        | Create a production-ready build in the `dist/` directory. |
| `pnpm preview`      | Preview the local production build.                       |
| `pnpm test:run`     | Run all unit and integration tests with Vitest.           |
| `pnpm test:e2e`     | Run all end-to-end browser tests with Playwright.         |
| `pnpm test:all`     | Run all unit, integration, and E2E tests.                 |
| `pnpm lint`         | Check for code style and linting errors.                  |
| `pnpm format:check` | Check for code formatting inconsistencies with Prettier.  |
| `pnpm astro check`  | Validate TypeScript and Astro types across the project.   |

## ⚙️ Developer's Guide

### Configuration

#### Site Metadata & Feature Flags

Global site settings, author details, and feature flags are centralized in `src/config.ts`. This is the first place you should go to customize your blog.

```typescript
// src/site.config.ts
export const siteConfig = {
  title: "Your Blog Name",
  author: "Your Name",
  // ...
};

// src/settings.config.ts
export const settingsConfig = {
  postPerPage: 5,
  lightAndDarkMode: true,
  // ...
};
```

#### Environment Variables

The project uses a layered environment variable system for managing secrets and environment-specific settings.

1.  **Defaults (Committed):** `.env.development` and `.env.production` contain non-sensitive defaults.
2.  **Local Overrides (Ignored):** Create a `.env.local` file to add secrets (like Sentry DSNs) or override defaults for local development. This file is ignored by Git.

```env
# .env.local (Never committed to Git)
PUBLIC_SENTRY_DSN=your_client_dsn
SENTRY_DSN=your_server_dsn
SENTRY_AUTH_TOKEN=your_auth_token
```

### Project Structure

The codebase is organized to be highly scalable and maintainable.

```
src/
├── components/      # UI primitives, feature components, and layouts.
├── content/         # Your content! All Markdown blog posts live here.
├── config/          # Centralized configuration files for the site.
├── data/            # Static data like social media links.
├── i18n/            # Dictionaries and utilities for internationalization.
├── layouts/         # High-level page templates (e.g., PostDetails, Main).
├── pages/           # File-based routing for Astro pages.
├── styles/          # Global CSS, theming, and typography.
└── utils/           # Core business logic (post sorting, OG image generation, etc.).

tests/
├── e2e-browser/     # Playwright tests for user journeys.
├── integration/     # Vitest tests for component workflows.
└── unit/            # Vitest tests for individual utilities.
```

### Writing Content

All blog posts are written in Markdown and live in `src/content/blog/`. The frontmatter is validated by Zod to prevent build errors.

#### Frontmatter Fields

| Key           | Required | Type                | Description                                                                        |
| :------------ | :------- | :------------------ | :--------------------------------------------------------------------------------- |
| `title`       | **Yes**  | `string`            | The title of the post.                                                             |
| `pubDatetime` | **Yes**  | `Date` (ISO String) | The publication date (e.g., `2024-10-28T10:00:00Z`). Use `Z` for UTC.              |
| `description` | **Yes**  | `string`            | A short summary for SEO and social cards.                                          |
| `author`      | No       | `string`            | Defaults to the site author in `src/config.ts`.                                    |
| `modDatetime` | No       | `Date` (ISO String) | The date the post was last modified. Can be auto-generated from Git history.       |
| `tags`        | No       | `string[]`          | An array of tags for categorization.                                               |
| `featured`    | No       | `boolean`           | Set to `true` to feature the post on the homepage.                                 |
| `draft`       | No       | `boolean`           | Set to `true` to prevent the post from being published.                            |
| `ogImage`     | No       | `string`            | URL to a custom Open Graph image. If omitted, one will be generated automatically. |

## 🧪 Testing & Quality Assurance

This project maintains a high standard of quality through a comprehensive, multi-layered testing strategy.

- **Unit & Integration Tests (Vitest):** Core utilities and component interactions are tested in isolation for speed and reliability.
- **End-to-End Tests (Playwright):** Critical user journeys, such as navigating posts and switching languages, are tested in a real browser to guarantee functionality.
- **Static Analysis:** TypeScript, ESLint, and Prettier are used to catch errors and enforce a consistent code style before code is ever committed.

Run all tests to ensure your changes are safe:

```bash
pnpm test:all
```

## 🚀 Deployment

### Vercel (Recommended)

The project is optimized for Vercel and includes CI/CD workflows for automated deployments.

1.  Push your repository to GitHub.
2.  Import the project on your Vercel dashboard.
3.  Add your environment variables in **Project Settings → Environment Variables**. At a minimum, you need:
    - `SITE_WEBSITE`: The full URL of your live site (e.g., `https://your-domain.com`).

The workflows in `.github/workflows/` will automatically handle preview and production deployments.

## 🎨 Acknowledgements & Inspiration

Natspaper stands on the shoulders of giants. This project draws inspiration from the design philosophy and best practices of several excellent open-source projects:

- **[Hugo PaperMod](https://github.com/adityatelange/hugo-PaperMod):** Provided the foundational design philosophy for Natspaper's academic-inspired aesthetic and performance-first approach.
- **[Astro Paper](https://github.com/satnaing/astro-paper):** Demonstrated best practices for building blog themes with Astro, content management, and modern web patterns.

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.
