# Natspaper

A minimal, high-performance blog platform built with **Astro** and **TypeScript**. Designed for technical writing, academic content, and flawless LaTeX math rendering.

[![Natspaper Version](https://img.shields.io/badge/Natspaper-5.5.0-blue)](https://github.com/NikaNats/Natspaper)
[![Astro Version](https://img.shields.io/badge/Astro-5.15.1-E53512?logo=astro)](https://astro.build/)
[![TypeScript Version](https://img.shields.io/badge/TypeScript-5.9.3-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Test Quality](https://img.shields.io/badge/QA%20Pipeline-Passing-2ECC71)](./tests)
[![License](https://img.shields.io/badge/License-MIT-green)](./LICENSE)

## Key Highlights

- **Static-First Architecture:** Pre-rendered HTML with zero runtime server required.
- **Minimal JavaScript:** Only interactive components (theme toggle, search) ship with JS.
- **LaTeX Support:** Flawless rendering of inline (`$E=mc^2$`) and block math via KaTeX.
- **Dynamic Open Graph Images:** Auto-generated social media preview cards for superior sharing.
- **Dark/Light Theme:** Automatic preference detection with persistence and no FOUC (Flash of Unstyled Content).
- **Full-Text Search:** Blazing-fast, client-side indexing and search with Pagefind.
- **Comprehensive Testing:** Unit, integration, and E2E test coverage with Vitest & Playwright.
- **Security Hardened:** Strict Content Security Policy (CSP) headers, Sentry monitoring, and type-safe content validation.

## 🚀 Quick Start

### Prerequisites

- Node.js v18 or higher
- [pnpm](https://pnpm.io/) (or run `npm install -g pnpm`)
- [Git](https://git-scm.com/)

### Setup (5 minutes)

```bash
# 1. Clone the repository
git clone https://github.com/NikaNats/Natspaper.git
cd natspaper

# 2. Install dependencies
pnpm install

# 3. Set up your local environment file (for secrets and local settings)
# This command copies the template to a local file that is ignored by Git.
cp .env.example .env.local

# 4. Start the development server
pnpm dev
```

Open `http://localhost:4321` in your browser. You can now start editing files in the `src/` directory.

## 📋 Common Commands

| Command              | Purpose                                      |
| :------------------- | :------------------------------------------- |
| `pnpm dev`           | Start the development server with hot-reloading. |
| `pnpm build`         | Create a production-ready build in the `/dist` directory. |
| `pnpm preview`       | Preview the local production build before deploying. |
| `pnpm test:run`      | Run all unit and integration tests. |
| `pnpm test:e2e`      | Run all end-to-end browser tests. |
| `pnpm lint`          | Check the codebase for linting errors. |
| `pnpm format:check`  | Check for code formatting inconsistencies. |

## 📚 Tech Stack

| Component | Technology                                              | Version |
| :-------- | :------------------------------------------------------ | :------ |
| **Core**  | [Astro](https://astro.build/)                           | 5.15+   |
| **Lang**  | [TypeScript](https://www.typescriptlang.org/)           | 5.9+    |
| **Style** | [Tailwind CSS](https://tailwindcss.com/)                | 4.1+    |
| **Math**  | [KaTeX](https://katex.org/)                             | 0.16+   |
| **Test**  | [Vitest](https://vitest.dev/) & [Playwright](https://playwright.dev/) | Latest |
| **Ops**   | [Sentry](https://sentry.io/), [Pagefind](https://pagefind.app/) | Latest |

## ⚙️ Configuration

### Environment Variables

This project uses a **layered environment variable system**. Never commit secrets to Git.

#### 1. Base Configuration (Committed to Git)

These files contain non-sensitive defaults for different environments:

- `.env.development` – Defaults for `pnpm dev`
- `.env.production` – Defaults for `pnpm build`

#### 2. Local Overrides (Git Ignored)

To add secrets or override defaults locally, create a `.env.local` file (as shown in the setup instructions). This file is listed in `.gitignore` and will **not** be committed.

```env
# .env.local – This file is NOT committed to Git
# Add your Sentry DSNs or other secrets here for local development.
PUBLIC_SENTRY_DSN=your_public_dsn_here
SENTRY_DSN=your_server_dsn_here
SENTRY_AUTH_TOKEN=your_auth_token_here
```

### Site Settings

Global site settings are managed in `src/config.ts`. Edit this file to customize:

- **Author name, profile URL, and bio**
- **Blog title, description, and OG image**
- **Timezone:** Crucial for accurately filtering scheduled posts. Must be a valid IANA Time Zone identifier (e.g., `America/New_York`, `Asia/Tbilisi`)
- **Feature flags** (e.g., `dynamicOgImage`, `lightAndDarkMode`)

## 🏗️ Project Structure

```
src/
├── components/        # Reusable Astro components (+ Islands)
├── data/              # Blog posts (Markdown files)
├── env/               # Environment variable validation schema
├── layouts/           # Page templates (Layout, Main, PostDetails)
├── middleware/        # Security headers, Sentry integration
├── pages/             # Routes (/posts, /tags, /search, etc.)
├── styles/            # Theming, typography, and utility CSS
└── utils/             # Core business logic (sorting, slugs, OG generation)

tests/
├── unit/              # Vitest tests for individual utilities
├── integration/       # Vitest tests for component workflows
├── e2e-browser/       # Playwright tests for user interactions
└── workflows/         # High-level automated test suites

scripts/               # Node.js utilities for the build pipeline
```

**Key directories to know:**

- `src/data/blog/` – Add new posts here as Markdown files
- `src/config.ts` – Site metadata and feature toggles
- `src/styles/` – Global CSS and Tailwind overrides
- `tests/` – All test files (unit, integration, E2E)

## 🧪 Testing

```bash
# Run unit & integration tests (fast)
pnpm test:run

# Run end-to-end tests in a real browser (slower)
pnpm test:e2e

# Run all code quality checks
pnpm lint && pnpm format:check

# Validate all TypeScript and Astro types
pnpm astro check
```

Test configurations are located in `vitest.config.ts` and `playwright.config.ts`.

## 🚀 Deployment

### Vercel (Recommended)

1. Push your repository to GitHub, GitLab, or Bitbucket.
2. Import the repository in your Vercel dashboard.
3. Configure the environment variables in **Project Settings → Environment Variables**.

**Required Variables:**

```env
SITE_WEBSITE = https://natspaper.vercel.app
```

**Optional Sentry Monitoring** (add these to enable error tracking):

```env
SENTRY_AUTH_TOKEN = your_sentry_auth_token
SENTRY_DSN = your_sentry_server_dsn
PUBLIC_SENTRY_DSN = your_sentry_public_dsn
PUBLIC_SENTRY_ENVIRONMENT = production
PUBLIC_SENTRY_TRACES_SAMPLE_RATE = 0.1
```

The CI/CD pipelines in `.github/workflows/` will handle automated deployments on push.

### Docker

A multi-stage `Dockerfile` is provided for standard container deployments using Nginx.

```bash
docker build -t natspaper .
docker run -p 8080:80 natspaper
```

### Test Before Deploying

```bash
pnpm build
pnpm preview
```

If this works locally, it will work on Vercel.

## 📖 Writing Blog Posts

1. Create a new Markdown file in `src/data/blog/`.
2. Add the frontmatter metadata at the top of the file. The `pubDatetime` is required and must be a full ISO 8601 timestamp.

```yaml
---
title: "My First Post with LaTeX"
author: "Your Name"
# The 'Z' at the end indicates UTC. This is critical for timezone-aware scheduling.
pubDatetime: 2025-10-28T10:00:00Z
modDatetime: 2025-10-29T15:30:00Z # Optional: for updated posts
description: "A brief and compelling description for SEO and social media previews."
tags:
  - "Astro"
  - "Web Development"
  - "LaTeX"
---

# Your content starts here

This post demonstrates how to use inline LaTeX, like $E=mc^2$, and block equations:

$$
\int_0^{\infty} e^{-x^2} dx = \frac{\sqrt{\pi}}{2}
$$
```

### Frontmatter Fields

| Key | Required | Description |
| :-- | :------- | :---------- |
| `title` | Yes | The title of the post. |
| `pubDatetime` | Yes | The publication date and time in ISO 8601 format (e.g., `2025-10-28T10:00:00Z`). The `Z` suffix indicates UTC. |
| `description` | Yes | A short summary for SEO and social cards. |
| `author` | No | The author's name (defaults to site author in `src/config.ts`). |
| `modDatetime` | No | The date the post was last modified. |
| `tags` | No | An array of tags for categorization. |
| `draft` | No | Set to `true` to prevent the post from being published. |

## 🏛️ Architecture Overview

**Static-first design:**
- All HTML pre-rendered at build time → zero runtime server needed
- Content stored in Markdown files → version controlled and simple
- Astro Islands → only interactive UI gets JavaScript
- Pagefind indexing → fast, client-side search

**Why this matters:**
- ⚡ Instant page loads (no server latency)
- 🔒 No server vulnerabilities to exploit
- 💰 Free hosting (GitHub Pages, Vercel, Netlify)
- 📈 Better SEO (pre-rendered HTML, instant rendering)

**Build pipeline includes:**
- Dynamic OG image generation (Satori + Resvg)
- LaTeX math rendering (KaTeX)
- Pagefind search indexing
- Concurrency control (prevents OOM during heavy builds)

## 🎨 Inspiration & Background

Natspaper draws inspiration from several excellent open-source projects in the static site generation space:

- **[Hugo PaperMod](https://github.com/adityatelange/hugo-PaperMod)**: A clean, fast Hugo theme that provided the foundational design philosophy for Natspaper's academic-inspired aesthetic and performance-first approach.
- **[Astro Paper](https://github.com/satnaing/astro-paper)**: An Astro-based blog theme that demonstrated best practices for Astro SSG implementation, content management, and modern web development patterns.

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

